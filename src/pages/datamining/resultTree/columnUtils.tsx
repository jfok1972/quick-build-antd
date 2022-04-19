/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Badge, Button, message, Tooltip } from 'antd';
import update from 'immutability-helper';
import { DoubleLeftOutlined, DoubleRightOutlined, ToTopOutlined } from '@ant-design/icons';
import { apply } from '@/utils/utils';
import { changeUserFilterToParam } from '@/pages/module/UserDefineFilter';
import { serialize } from 'object-to-formdata';
import request, { API_HEAD } from '@/utils/request';
import { getSqlparamFilter } from '@/pages/module/grid/filterUtils';
import { findParentLastLevel, getAggregateFieldNames } from '../schemeUtils';
import type { DataminingModal, HeaderCellType } from '../data';
import { getRestTitles, getTreeRecordByKey } from '../utils';
import styles from '../index.less';
import {
  ACT_COLUMN_GROUP_VISIBLE_TOGGLE,
  ACT_COLUMN_GROUP_REST_VISIBLE_TOGGLE,
  ROWID,
  SELECTED,
  TEXT,
  ACT_FIELD_GROUP_UPDATE,
  ACT_COLUMN_GROUP_UPDATE,
  PARENT_ROWID,
  TEXTUNDERLINE,
  LEVELUNDERLINE,
} from '../constants';

// 取得当前头就cell的类型
// 总计的字段分组，分组，单个字段的最后一个分组，多个字段最后的分数
export const getCellType = (column: any): HeaderCellType => {
  if (!column[ROWID]) return 'group';
  if ((column[ROWID] as string).startsWith('field')) return 'sumfield';
  if ((column[ROWID] as string).indexOf('field') > 0) return 'subfield';
  return column.dataIndex ? 'fieldingroup' : 'group';
};
/**
 *  调整TABLE中的column中的按钮
 * 1. 每个父节点的第一个子节点可以展开或隐藏其他节点。
 * 2. 没有condition的节点是分组节点。可以整体隐藏
 * @param columns
 * @param dispatch
 */
export const adjustColumnGroupToggleButton = (columns: any[], dispatch: Function) => {
  for (let i = columns.length - 1; i >= 0; i -= 1) {
    const column = columns[i];
    const cellType = getCellType(column);
    if (column[SELECTED])
      column.className = (column.className ? `${column.className} ` : '') + styles.rowcellselected;
    if (column.hidden) {
      column.title = (
        <>
          <Tooltip title={`显示 ${column.text}`}>
            <div
              style={
                cellType === 'fieldingroup'
                  ? { marginLeft: '-5px', marginRight: '-5px' }
                  : { position: 'absolute', top: '4px', left: '3px' }
              }
            >
              <DoubleRightOutlined
                onClick={() => {
                  dispatch({
                    type: ACT_COLUMN_GROUP_VISIBLE_TOGGLE,
                    payload: {
                      type: 'toggle',
                      rowids: [column[ROWID]],
                    },
                  });
                }}
              />
            </div>
          </Tooltip>
          {cellType === 'fieldingroup' ? null : <>&nbsp;</>}
        </>
      );
      column.width = '21px';
      delete column.dataIndex;
      delete column.sorter;
      delete column.sortDirections;
      delete column.render;
      delete column.children;
    } else if (
      column.hideRest ||
      (i !== columns.length - 1 && !!column.children && column.text === '小计')
    ) {
      // 如果当前记录是小计，并且后面还有column，说明这是一级展的记录，后面是另一个分组的展开，可以显示或隐藏
      // 不是小计的记录可以通过菜单里面实现这个功能，这里就要判断一下了
      // delete column.children;
      column.title = (
        <span style={{ display: 'flex' }}>
          <span style={{ flex: 1 }}>{column.text}</span>
          <Button
            type="text"
            size="small"
            style={{ padding: '0px' }}
            onClick={() => {
              dispatch({
                // 当前节点后面的同级节点都不显示
                type: ACT_COLUMN_GROUP_REST_VISIBLE_TOGGLE,
                payload: { rowid: column[ROWID] },
              });
            }}
          >
            {column.hideRest ? (
              <>
                <ToTopOutlined rotate={90} />
                <Tooltip title={getRestTitles(columns, i + 1)}>
                  <Badge
                    count={columns.length - i - 1}
                    size="small"
                    offset={[2, -2]}
                    style={{ backgroundColor: '#69c0ff', boxShadow: '0 0 0 1px #1890ff' }}
                  />
                </Tooltip>
              </>
            ) : (
              <Tooltip title="隐藏后面剩余的分组">
                <ToTopOutlined rotate={270} />
              </Tooltip>
            )}
          </Button>
        </span>
      );
      if (column.hideRest) columns.splice(i + 1, columns.length - (i + 1));
    } else if (cellType === 'group') {
      column.title = (
        <>
          {column.text}
          <span className={styles.celltypegroup}>
            <DoubleLeftOutlined
              className={styles.eye}
              onClick={() => {
                dispatch({
                  type: ACT_COLUMN_GROUP_VISIBLE_TOGGLE,
                  payload: {
                    type: 'hidden',
                    rowids: [column[ROWID]],
                  },
                });
              }}
            />{' '}
          </span>
        </>
      );
    }
    if (column.children) adjustColumnGroupToggleButton(column.children, dispatch);
  }
};

/**
 * 从树形中移除指定的rowid,并把子节点提升到移除的位置
 * @param records
 * @param rowids
 */
const removeRowidFromTree = (records: any[], rowid: string, keepChildren: boolean) => {
  let removed = false;
  const doRemove = (recs: any[]) => {
    if (removed) return;
    for (let i = 0; i < recs.length; i += 1) {
      const rec = recs[i];
      if (rec[ROWID] === rowid) {
        if (rec.children && keepChildren) recs.splice(i, 1, ...rec.children);
        else recs.splice(i, 1);
        removed = true;
        return;
      }
      if (rec.children) doRemove(rec.children);
    }
  };
  doRemove(records);
};

/**
 * 从树形中移除指定的rowids,并把子节点提升到移除的位置
 * @param records
 * @param rowids
 */
export const removeRowidsFromTree = (records: any[], rowids: string[], keepChildren: boolean) => {
  rowids.forEach((rowid) => {
    removeRowidFromTree(records, rowid, keepChildren);
  });
  return records;
};

// 清除所有选中的
export const clearColumnGroupAllSelected = (records: any[]): any[] => {
  const clearSelected = (recs: any[]) => {
    recs.forEach((record) => {
      const rec = record;
      delete rec[SELECTED];
      if (rec.children) clearSelected(rec.children);
    });
  };
  clearSelected(records);
  return records;
};

// 返回所有选中的
export const getSelectedColumnGroup = (records: any[]): any[] => {
  const result: any[] = [];
  const getSelected = (recs: any[]) => {
    recs.forEach((record) => {
      const rec = record;
      if (rec[SELECTED]) result.push(rec);
      if (rec.children) getSelected(rec.children);
    });
  };
  getSelected(records);
  return result;
};

// 取得父级的rowid,rowid是以-号分隔的
const getParentRowid = (rowid: string): string => {
  return rowid.substring(0, rowid.lastIndexOf('-'));
};

/**
 * 合并在选中的grid column,只能合并同一个节点下的相同的末级节点
 */
export const combineSelectedColumns = (
  columnGroup: any[],
  keepChildren: boolean,
): any[] | false => {
  const selections: any[] = getSelectedColumnGroup(columnGroup);
  const pnoderowid = getParentRowid(selections[0][ROWID]);
  const parentChildren: any[] = pnoderowid
    ? getTreeRecordByKey(columnGroup, pnoderowid, ROWID).children
    : columnGroup;
  // message.warn(pnoderowid);
  for (let i = 0; i < selections.length; i += 1) {
    if (getParentRowid(selections[i][ROWID]) !== pnoderowid) {
      message.warn('合并的分组必须在同一个父分组之下！');
      return false;
    }
  }
  for (let i = 0; i < selections.length; i += 1) {
    if (selections[i].children) {
      message.warn('合并的分组必须都是最末级的！');
      return false;
    }
  }
  const values = [];
  let text: string = '';
  // 取得最后一级之前的，前面应该都一样，否则就不是同一个父分组之下。
  // field1=value1|||field2=value2,将会判断
  // field1=value1|||field2，这些是否相同。相同的才能合并
  const first = selections[0];
  const firstcondition = selections[0].condition;
  const ahead = firstcondition.substring(0, firstcondition.lastIndexOf('='));
  // field1=value1|||field2
  let addtext = true;
  // 如果 addSelectedChildrens 为true, 那么合并后再 展开
  for (let i = 0; i < selections.length; i += 1) {
    if (addtext) {
      if (text.length < 30) {
        text +=
          (selections[i][TEXTUNDERLINE] || selections[i][TEXT]) +
          (i === selections.length - 1 ? '' : ',');
      } else {
        addtext = false;
        text = `${text.substr(0, text.length - 1)}等${selections.length}条`;
      }
    }
    // field=value
    const { condition } = selections[i];
    const pos = condition.lastIndexOf('=');
    const head = condition.substring(0, pos);
    if (head !== ahead) {
      message.warn('合并的分组必须都是在同一级，同一个父分组之下的！'); // 有可能父分组被删了，会有不同分组的最后都在同一级下
      return false;
    }
    if (selections[i][TEXT] === '小计') {
      // 可能小计和明细同处在一个父column之下
      message.warn('小计列不能再进行合并了！');
      return false;
    }
    values.push(condition.substr(pos + 1));
  }
  let reco;
  if (keepChildren) {
    reco = {
      text,
      condition: `${ahead}=${values.join(',')}`,
      leaf: false,
      children: [
        {
          text: '小计',
          condition: `${ahead}=${values.join(',')}`,
          leaf: true,
        },
        ...selections,
      ],
    };
  } else {
    reco = {
      text,
      condition: `${ahead}=${values.join(',')}`,
      leaf: true,
    };
  }
  parentChildren.splice(
    parentChildren.findIndex((rec) => rec === first),
    0,
    reco,
  );
  selections.forEach((selection) =>
    parentChildren.splice(
      parentChildren.findIndex((r) => r === selection),
      1,
    ),
  );
  return columnGroup;
};

// 聚合字段进行拖动了之后进行排序，聚合字段只能在总计列进行拖动
export const moveFieldGroup = (
  state: DataminingModal,
  dispatch: Function,
  dragRowid: string,
  dropRowid: string,
) => {
  const fieldGroup: any[] = [...state.schemeState.fieldGroup];
  const dragIndex = fieldGroup.findIndex((field) => field[ROWID] === dragRowid);
  const dropIndex = fieldGroup.findIndex((field) => field[ROWID] === dropRowid);
  const group = update(fieldGroup, {
    $splice: [
      [dragIndex, 1],
      [dropIndex, 0, fieldGroup[dragIndex]],
    ],
  });
  dispatch({
    type: ACT_FIELD_GROUP_UPDATE,
    payload: {
      fieldGroup: group,
    },
  });
};

// 聚合字段分组的移动，必须在同一个父节点下的二个子节点才可以移动
export const moveColumnGroup = (
  state: DataminingModal,
  dispatch: Function,
  parentid: string,
  dragRowid: string,
  dropRowid: string,
) => {
  const {
    schemeState: { columnGroup },
  } = state;
  const parent: any = getTreeRecordByKey(columnGroup, parentid, ROWID);
  const children = parent ? parent.children : columnGroup;
  const dragIndex = children.findIndex((field: any) => field[ROWID] === dragRowid);
  const dropIndex = children.findIndex((field: any) => field[ROWID] === dropRowid);
  const dragRecord = children[dragIndex];
  (children as any[]).splice(dragIndex, 1);
  (children as any[]).splice(dropIndex, 0, dragRecord);
  dispatch({
    type: ACT_COLUMN_GROUP_UPDATE,
    payload: {
      columnGroup: [...columnGroup],
    },
  });
};

// 取得分组后在加入到columnGroup之前进行调整
const adjustChildrenNodes = (children: any[], fieldid: string, pid: string): any[] => {
  const result: any[] = [];
  children.forEach((child) => {
    const condition = `${
      pid + fieldid + (child[LEVELUNDERLINE] ? `-${child[LEVELUNDERLINE]}` : '')
    }=${child.value}`;
    const column: any = {
      // condition分组条件
      // {SCustomer.SCity.SProvince.SArea|086002e=东北地区}{SCustomer.SCity.SProvince|402881=东北省}
      condition,
      value: child.value,
      text: child.text,
      leaf: true,
    };
    if (child.children) {
      // codelevel全级别加入
      column.children = adjustChildrenNodes(child.children, fieldid, pid);
      column.children.unshift({
        condition,
        value: column.value,
        text: '小计', // child.text,
        leaf: true,
      });
      delete column.condition;
      column.leaf = false;
    }
    result.push(column);
  });
  return result;
};

/**
 * 返回总计或者某个columnGroup展开一级后的插入columnGroup。
 * @param state
 * @param fieldid
 * @param title
 * @param parentnode
 */
export const getFieldColumnWithGroup = async (
  state: DataminingModal,
  fieldidorigin: string,
  title: string,
  expandNode: any,
) => {
  const { moduleName, filters, schemeState } = state;
  const { setting } = schemeState;
  let fieldid = fieldidorigin;
  let pid = expandNode.condition;
  const params: any = {
    moduleName,
    parentconditions: JSON.stringify(pid ? pid.split('|||') : []),
    groupfieldid: fieldid,
    conditions: JSON.stringify([]),
    fields: JSON.stringify(getAggregateFieldNames(state.schemeState.fieldGroup)),
    sqlparamstr: filters.sqlparam ? JSON.stringify(getSqlparamFilter(filters.sqlparam)) : null,
  };
  // 判断是否是codelevel模块的 fieldid-auto字段，如果是的话，在所有的parentConditions上面找
  // field-1,2,3然后展开下一级
  if (fieldid.endsWith('-auto')) {
    const fieldidHead = fieldid.substr(0, fieldid.length - 5);
    const nextlevel = findParentLastLevel(fieldidHead, pid ? pid.split('|||') : []) + 1;
    fieldid = `${fieldidHead}-${nextlevel}`;
    params.groupfieldid = fieldid;
  }
  // 如果要加入当前筛选的条件
  if (setting.expandColAddFilter) {
    apply(params, {
      navigatefilters: JSON.stringify(filters.navigatefilters),
      viewschemeid: filters.viewscheme.viewschemeid,
      userfilters: JSON.stringify(changeUserFilterToParam(filters.userfilter)),
    });
  }
  // 取得当前所选分组字段的所有值，限定在 condition的条件下
  const columns: any[] = await request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
    method: 'POST',
    params: {
      moduleName_: moduleName,
    },
    data: serialize(params),
  });
  if (columns.length === 0) return null;
  pid = pid ? `${pid}|||` : '';
  const c = setting.expandItemDirection === 'asc' ? 1 : -1;
  let sortfield = 'value';
  const mode = setting.expandItemMode;
  if (mode === 'text') sortfield = 'text';
  else if (mode === 'value') {
    if (columns.length > 0) {
      // 第一条记录的所有值，jf开头是数值
      sortfield = Object.keys(columns[0]).find((name) => name.indexOf('jf') === 0) || sortfield;
    }
  }
  columns.sort((a, b) => {
    return (a[sortfield] > b[sortfield] ? 1 : -1) * c;
  });
  const maxcol = setting.expandMaxCol;
  if (maxcol > 1 && columns.length > maxcol) {
    // 最多展开maxcol个，例如是20,则第20个，是20个以后的总和，名称为第20个，加上 等n个,
    // 3个以内都加上全称
    if (columns.length - maxcol < 3) {
      // 3个以内
      for (let i = maxcol; i < columns.length; i += 1)
        columns[maxcol - 1].text = `${columns[maxcol - 1].text},${columns[i].text}`;
    } else {
      columns[maxcol - 1].text = `${columns[maxcol - 1].text}等${columns.length - maxcol + 1}个`;
    }
    const l = columns.length;
    for (let i = maxcol; i < l; i += 1)
      columns[maxcol - 1].value = `${columns[maxcol - 1].value},${columns.pop().value}`;
  }
  if (fieldid.endsWith('-all')) fieldid = fieldid.replace('-all', '');
  const addcolumns = adjustChildrenNodes(columns, fieldid, pid);
  if (addcolumns.length === 0) return null;
  if (setting.expandColAddGroupName === 'yes') {
    return [
      {
        text: title,
        children: addcolumns,
        leaf: false,
      },
    ];
  }
  return addcolumns;
};

// 展开在fieldGroup，或者展开一级分组
export const expandHeadCellWithGroup = (
  state: DataminingModal,
  dispatch: Function,
  cellType: HeaderCellType,
  expandNode: any,
  fieldid: string,
  title: string,
) => {
  getFieldColumnWithGroup(state, fieldid, title, expandNode).then((columns) => {
    if (columns) {
      const { columnGroup } = state.schemeState;
      if (cellType === 'sumfield') {
        columnGroup.splice(columnGroup.length, 0, ...columns);
      } else if (cellType === 'group' || cellType === 'fieldingroup') {
        const column = getTreeRecordByKey(columnGroup, expandNode[ROWID], ROWID);
        const columnhj = { ...column, text: '小计' };
        delete column.condition; // 删除条件，最顶层的不可以再展开了，要在小计上展开
        column.children = [columnhj, ...columns];
      }
      dispatch({
        type: ACT_COLUMN_GROUP_UPDATE,
        payload: {
          columnGroup: [...columnGroup],
          refreshAllCount: 1,
        },
      });
    }
  });
};

// 在表头分组上根据导航值展开一级，可者插入在前级的后面
export const expandHeadCellWithNavigate = (
  state: DataminingModal,
  dispatch: Function,
  cellType: HeaderCellType,
  expandNode: any,
  fieldid: string,
  title: string,
  navigateReocrds: any[],
) => {
  const records = navigateReocrds.map((rec) => ({
    condition: `${rec.groupfieldid}=${rec.value}`,
    text: rec.text,
    value: rec.value,
    leaf: true,
  }));
  const { columnGroup } = state.schemeState;
  if (cellType === 'sumfield') {
    // 在汇总的聚合字段上展开，加入分组信息直接展开
    columnGroup.splice(columnGroup.length, 0, { text: title, leaf: false, children: records });
  } else if (cellType === 'group' || cellType === 'fieldingroup') {
    // 准备在此列上进行展开
    const column = getTreeRecordByKey(columnGroup, expandNode[ROWID], ROWID);
    // 如果拖进来的导航节点和当前选中节点的 condition的前面相同，则把此记录放在parent下面的节点的前面。
    const targetCondition: string = column.condition;
    const parts: string[] = targetCondition.split('|||');
    const targetLastFieldid = parts[parts.length - 1].split('=')[0];
    // 拖动进来的记录和目标不是相同的fieldid,就展开
    if (fieldid !== targetLastFieldid) {
      const columnhj = { ...column, text: '小计' };
      delete column.condition; // 删除条件，最顶层的不可以再展开了，要在小计上展开
      column.children = [
        columnhj,
        {
          text: title,
          leaf: false,
          children: records.map((rec) => ({
            ...rec,
            condition: `${targetCondition}|||${rec.condition}`,
          })),
        },
      ];
    } else {
      // 加到当前分组的后面
      const parentColumn = getTreeRecordByKey(columnGroup, expandNode[PARENT_ROWID], ROWID);
      const parentChildren: any[] = parentColumn ? parentColumn.children : columnGroup;
      const expandCond = expandNode.condition;
      const ahead = expandCond.substring(0, expandCond.lastIndexOf('='));
      parentChildren.splice(
        parentChildren.findIndex((node: any) => node[ROWID] === expandNode[ROWID]) + 1,
        0,
        ...records
          .map((rec: any) => ({
            ...rec,
            condition: `${ahead}=${rec.value}`,
          }))
          // 重复的不加入
          .filter((rec) => !parentChildren.find((pc) => pc.condition === rec.condition)),
      );
    }
  }
  dispatch({
    type: ACT_COLUMN_GROUP_UPDATE,
    payload: {
      columnGroup: [...columnGroup],
      refreshAllCount: 1,
    },
  });
};
