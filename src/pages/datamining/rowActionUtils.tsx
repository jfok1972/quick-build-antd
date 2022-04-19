/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import request, { API_HEAD } from '@/utils/request';
import { apply } from '@/utils/utils';
import { message } from 'antd';
import { serialize } from 'object-to-formdata';
import { getSqlparamFilter } from '../module/grid/filterUtils';
import { changeUserFilterToParam } from '../module/UserDefineFilter';
import {
  ACT_DATAMINING_FETCHDATA,
  ACT_SELECTED_ROWKEYS_CHANGED,
  ROOTROWID,
  ROWID,
  TEXT,
  TEXTUNDERLINE,
} from './constants';
import type { DataminingModal } from './data';
import {
  expandRowWithGroup,
  getAggregateFieldNames,
  getGroupDetailConditions,
  getRecordAllCondition,
} from './schemeUtils';
import {
  getAllChildRowids,
  getTreeRecordByKey,
  removeFromParentNode,
  setFetchLoading,
} from './utils';

// 重新刷新某一行的数据
// 会将指定记录的数据重新生成，并且写入该record
export const refreshRowData = async (state: DataminingModal, record: any, isrefresh: boolean) => {
  // 加入当前记录和所有父节点的条件
  const parentConditions: string[] = [];
  getRecordAllCondition(record, parentConditions);
  // 清除记录里面的数值数据
  Object.keys(record).forEach((key) => {
    if (key.indexOf('jf') === 0) apply(record, { [key]: null });
  });
  const { moduleName, filters, schemeState: currentScheme } = state;
  const result = await request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
    method: 'POST',
    params: {
      moduleName_: moduleName,
    },
    data: serialize({
      moduleName,
      groupfieldid: null,
      conditions: JSON.stringify(getGroupDetailConditions(currentScheme.columnGroup)),
      fields: JSON.stringify(getAggregateFieldNames(currentScheme.fieldGroup)),
      parentconditions: JSON.stringify(parentConditions),
      navigatefilters: JSON.stringify(filters.navigatefilters),
      viewschemeid: filters.viewscheme.viewschemeid,
      userfilters: JSON.stringify(changeUserFilterToParam(filters.userfilter)),
      sqlparamstr: filters.sqlparam ? JSON.stringify(getSqlparamFilter(filters.sqlparam)) : null,
    }),
  });
  if (Array.isArray(result) && result.length === 1) {
    const rec = result[0];
    if (isrefresh) {
      delete rec.value;
      delete rec.text;
    }
    Object.keys(rec).forEach((i) => {
      if (i !== 'text') apply(record, { [i]: rec[i] });
    });
  }
};

// 合并选中的行,需要加入到路径之中。
// 在执行路径 再次合并行的时候，可能会有一些行找不到。那么就condition也要加入，不然无法展开了
export const combineSelectedRows = async (
  state: DataminingModal,
  dispatch: Function,
  addSelectedChildrens: boolean,
) => {
  const {
    selectedRowKeys,
    schemeState: { dataSource },
  } = state;
  const selections: any[] = [];
  selectedRowKeys.forEach((rowid) => {
    const record = getTreeRecordByKey(dataSource, rowid, ROWID);
    if (record) selections.push(record);
  });
  const first = selections[0];
  if (selections.find((rec) => rec.parentNode !== first.parentNode)) {
    message.warn('要合并的行必须在同一个父节点下！');
    return;
  }
  let text = '';
  const values = [];
  const nodeconditions = [];
  const firstcondition = first.condition;
  let addtext = true;
  const ahead = firstcondition.substring(0, firstcondition.lastIndexOf('=')); // field1=value1|||field2
  for (let i = 0; i < selections.length; i += 1) {
    if (addtext) {
      if (text.length < 40) {
        text +=
          (selections[i][TEXTUNDERLINE] || selections[i].text) +
          (i === selections.length - 1 ? '' : ',');
      } else {
        addtext = false;
        text = `${text.substr(0, text.length - 1)} 等${selections.length}条`;
      }
    }
    const { condition } = selections[i];
    const pos = condition.lastIndexOf('=');
    const head = condition.substring(0, pos); // field=value
    if (head !== ahead) {
      message.warn('合并的所有行必须分组属性一致！'); // 有可能父分组被删了，会有不同分组的最后都在同一级下
      return;
    }
    const value: string = condition.substr(pos + 1);
    if (value.startsWith('!')) {
      message.warn('不允许对合并非选中行的结果进行合并！');
      return;
    }
    nodeconditions.push(selections[i][ROWID]); // rowid代表了唯一的一行。
    values.push(condition.substr(pos + 1));
  }
  const rec: any = {
    text,
    condition: `${ahead}=${values.join(',')}`,
    parentNode: first.parentNode,
  };
  // 把rec放在first的前面
  first.parentNode.children.splice(
    first.parentNode.children.findIndex((c: any) => c === first),
    0,
    rec,
  );
  for (let i = 0; i < selections.length; i += 1) {
    const removed = removeFromParentNode(selections[i]);
    if (addSelectedChildrens) {
      if (!rec.children) rec.children = [];
      removed.parentNode = rec;
      rec.children.push(removed);
    }
  }
  setFetchLoading({ dispatch, fetchLoading: true });
  await refreshRowData(state, rec, true);
  // 合并操作记录到路径之中
  const expandPaths: any[] = [];
  expandPaths.push({
    type: 'combinerows',
    conditionpath: nodeconditions.join(','),
    text,
    condition: rec.condition,
    addSelectedChildrens,
  });
  dispatch({
    type: ACT_DATAMINING_FETCHDATA,
    payload: {
      dataSource: [...state.schemeState.dataSource],
      expandPaths,
      expandedRowKeys: [rec[ROWID]],
    },
  });
  dispatch({
    type: ACT_SELECTED_ROWKEYS_CHANGED,
    payload: {
      selectedRowKeys: [rec[ROWID]],
    },
  });
  setFetchLoading({ dispatch, fetchLoading: false });
};

// 合并非选中的行,需要加入到路径之中。
// 在执行路径 再次合并行的时候，可能会有一些行找不到。那么就condition也要加入，不然无法展开了
export const combineNotSelectedRows = async (
  state: DataminingModal,
  dispatch: Function,
  addSelectedChildrens: boolean,
) => {
  const {
    selectedRowKeys,
    schemeState: { dataSource },
  } = state;
  const selections: any[] = [];
  selectedRowKeys.forEach((rowid) => {
    const record = getTreeRecordByKey(dataSource, rowid, ROWID);
    if (record) selections.push(record);
  });
  const first = selections[0];
  if (selections.find((rec) => rec.parentNode !== first.parentNode)) {
    message.warn('要合并的行必须在同一个父节点下！');
    return;
  }
  let text = '';
  const values = [];
  const nodeconditions = [];
  const firstcondition = first.condition;
  const ahead = firstcondition.substring(0, firstcondition.lastIndexOf('=')); // field1=value1|||field2
  let addtext = true;
  for (let i = 0; i < selections.length; i += 1) {
    if (addtext) {
      if (text.length < 40) {
        text +=
          (selections[i][TEXTUNDERLINE] || selections[i].text) +
          (i === selections.length - 1 ? '' : ',');
      } else {
        addtext = false;
        text = `${text.substr(0, text.length - 1)} 等${selections.length}条`;
      }
    }
    const { condition } = selections[i];
    const pos = condition.lastIndexOf('=');
    const head = condition.substring(0, pos); // field=value
    if (head !== ahead) {
      message.warn('合并的所有行必须分组属性一致！'); // 有可能父分组被删了，会有不同分组的最后都在同一级下
      return;
    }
    const value: string = condition.substr(pos + 1);
    if (value.startsWith('!')) {
      message.warn('不允许对合并非选中行的结果进行合并！');
      return;
    }
    nodeconditions.push(selections[i][ROWID]); // rowid代表了唯一的一行。
    values.push(value);
  }
  const rec: any = {
    text: '其他',
    // 合并非选中行的条件以!开头，!01,02,03,04...
    condition: `${ahead}=!${values.join(',')}`,
    parentNode: first.parentNode,
  };
  // 删除所有的非选中节点
  const notSelecteds = (rec.parentNode.children as []).filter(
    (r) => selections.findIndex((sr) => sr === r) === -1,
  );
  for (let i = 0; i < notSelecteds.length; i += 1) {
    const removed = removeFromParentNode(notSelecteds[i]);
    if (addSelectedChildrens) {
      if (!rec.children) rec.children = [];
      removed.parentNode = rec;
      rec.children.push(removed);
    }
  }
  // 把rec放在最后一个节点
  rec.parentNode.children.push(rec);
  setFetchLoading({ dispatch, fetchLoading: true });
  await refreshRowData(state, rec, true);
  // 合并操作记录到路径之中
  const expandPaths: any[] = [];
  expandPaths.push({
    type: 'combineotherrows',
    conditionpath: nodeconditions.join(','),
    text,
    condition: rec.condition,
    addSelectedChildrens,
  });
  dispatch({
    type: ACT_DATAMINING_FETCHDATA,
    payload: {
      dataSource: [...state.schemeState.dataSource],
      expandPaths,
      expandedRowKeys: [rec[ROWID]],
    },
  });
  dispatch({
    type: ACT_SELECTED_ROWKEYS_CHANGED,
    payload: {
      selectedRowKeys: [rec[ROWID]],
    },
  });
  setFetchLoading({ dispatch, fetchLoading: false });
};

/**
 * 当用户拖动或从菜单中选择分组字段放到记录上时进行展开。
 *
 * 1、如果当前记录没有选中，则只展开当前记录。
 * 2、如果当前记录被选中了，则展开所有的选中记录。
 *
 * @param param0
 */
export const expandRowsWithGroup = async ({
  state,
  dispatch,
  records,
  group,
  expandallleaf,
}: {
  state: DataminingModal;
  dispatch: Function;
  records: any[];
  group: any;
  expandallleaf?: boolean;
}) => {
  setFetchLoading({ dispatch, fetchLoading: true });
  const expandPaths: any[] = [];
  const expandedRowKeys: string[] = [];
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    const result: any = await expandRowWithGroup({
      state,
      selectrecord: record,
      fieldid: group.fieldid,
      title: group.title,
      recordpath: true,
    });
    // expandPath
    if (!expandallleaf && result && result.expandPath) {
      expandPaths.push(result.expandPath);
      expandedRowKeys.push(record[ROWID]);
    }
  }
  /* eslint-enable no-await-in-loop */
  if (expandallleaf) {
    // 如果是展开所有叶节点，expandpath只加入一条
    expandPaths.push({
      type: 'expandallleaf',
      fieldid: group.fieldid,
      title: group.title,
    });
  }
  dispatch({
    type: ACT_DATAMINING_FETCHDATA,
    payload: {
      dataSource: [...state.schemeState.dataSource],
      expandPaths,
      expandedRowKeys,
    },
  });
  setFetchLoading({ dispatch, fetchLoading: false });
};

// 删除当前行或者选中的行,如果有deletedRecord则只删除指定行
export const deleteSelectedRows = ({
  state,
  dispatch,
  deletedRecord,
}: {
  state: DataminingModal;
  dispatch: Function;
  deletedRecord: any;
}) => {
  const {
    schemeState: { dataSource },
  } = state;
  const expandPaths: any[] = [];
  const records: any[] = [];
  const deletedRowids: string[] = [];
  const selectedRowKeys = deletedRecord ? [deletedRecord[ROWID]] : state.selectedRowKeys;
  if (selectedRowKeys.length > 0) {
    selectedRowKeys.forEach((rowid) => {
      const record = getTreeRecordByKey(dataSource, rowid, ROWID);
      if (record) records.push(record);
    });
    records.forEach((record) => {
      if (record[ROWID] === ROOTROWID) {
        message.warn('不能删除总计行的根节点！');
      } else {
        // 删除操作记录到路径之中
        deletedRowids.push(record[ROWID]);
        // 加入所有子节点的rowid,要从selected和expanded中删除
        deletedRowids.push(...getAllChildRowids(record));
        removeFromParentNode(record);
        expandPaths.push({
          type: 'deleterow',
          conditionpath: record[ROWID],
          conditiontext: record.text,
        });
      }
    });
    dispatch({
      type: ACT_DATAMINING_FETCHDATA,
      payload: {
        dataSource: [...state.schemeState.dataSource],
        expandPaths,
        deletedRowids,
      },
    });
  }
};

// 删除选中的行的所有子节点
export const deleteSelectedRowsChildren = ({
  state,
  dispatch,
  deletedRecord,
}: {
  state: DataminingModal;
  dispatch: Function;
  deletedRecord: any;
}) => {
  const {
    schemeState: { dataSource },
  } = state;
  const expandPaths: any[] = [];
  const records: any[] = [];
  const deletedRowids: string[] = [];
  const selectedRowKeys = deletedRecord ? [deletedRecord[ROWID]] : state.selectedRowKeys;
  if (selectedRowKeys.length > 0) {
    selectedRowKeys.forEach((rowid) => {
      const record = getTreeRecordByKey(dataSource, rowid, ROWID);
      if (record) records.push(record);
    });
    records.forEach((rec) => {
      // 加入所有子节点的rowid,要从selected和expanded中删除
      const record = rec;
      if (record.children) {
        deletedRowids.push(...getAllChildRowids(record));
        delete record.children;
        expandPaths.push({
          type: 'deletechildren',
          conditionpath: record[ROWID],
          conditiontext: record.text,
        });
      }
    });
    dispatch({
      type: ACT_DATAMINING_FETCHDATA,
      payload: {
        dataSource: [...state.schemeState.dataSource],
        expandPaths,
        deletedRowids,
      },
    });
  }
};

// 导航中拖动过来的数据对当前记录进行展开,在读取方案展开的时候isrecordpath=false,在用户操作展开的时候需要记录
export const expandRowWithNavigateRecords = async ({
  state,
  dispatch,
  node,
  fieldid,
  title,
  records,
  pos,
  recordpath,
}: {
  state: DataminingModal;
  dispatch: Function;
  node: any;
  fieldid: string;
  title: string;
  records: any[];
  pos: number;
  recordpath: boolean;
}) => {
  if (!records || records.length === 0) return;
  let thispos = pos;
  const expandPaths: any[] = [];
  const addRecords: any[] = [];
  if (recordpath) setFetchLoading({ dispatch, fetchLoading: true });
  const adds: any[] = JSON.parse(JSON.stringify(records));
  adds.forEach((rec) => {
    const record = rec;
    if (record.moduleName) {
      record[TEXTUNDERLINE] = record.text;
    }
    record.parentNode = node;
  });
  if (!node.children) apply(node, { children: [] });
  adds.forEach((record) => {
    if (node.children.find((rec: any) => rec.condition === record.condition)) {
      message.warn(`『${record[TEXT]}』已经在 ${node[TEXT]} 节点下存在了，不允许重复加入！`);
    } else {
      addRecords.push({ ...record, parentNode: undefined, text_: undefined });
      if (thispos < 0) node.children.push(record);
      // append
      else {
        node.children.splice(thispos, 0, record); // 加在节点前面或后面 ):
        thispos += 1;
      }
    }
  });
  // 逐条刷新数据
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < adds.length; i += 1) await refreshRowData(state, adds[i], true);
  /* eslint-enable no-await-in-loop */
  // 如果是拖动进来的，要保存在操作记录当中
  if (recordpath) {
    expandPaths.push({
      type: 'expandwithnavigaterecords',
      conditionpath: node[ROWID],
      fieldid,
      title,
      records: addRecords,
      pos: thispos,
    });
    dispatch({
      type: ACT_DATAMINING_FETCHDATA,
      payload: {
        dataSource: [...state.schemeState.dataSource],
        expandPaths,
        expandedRowKeys: [node[ROWID]],
      },
    });
    setFetchLoading({ dispatch, fetchLoading: false });
  }
};
