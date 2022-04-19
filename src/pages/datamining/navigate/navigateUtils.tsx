/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

/* eslint-disable no-use-before-define */

import React, { useContext } from 'react';
import { message, Typography } from 'antd';
import Highlighter from 'react-highlight-words';
import { DragPreviewImage, useDrag, useDrop } from 'react-dnd';
import request, { API_HEAD } from '@/utils/request';
import { serialize } from 'object-to-formdata';
import PinyinMatch from 'pinyin-match';
import { getSqlparamFilter } from '@/pages/module/grid/filterUtils';
import { apply } from '@/utils/utils';
import {
  ACT_NAVIGATE_FETCH_DATA,
  ACT_NAVIGATE_ROW_EXPAND,
  CHILDREN,
  DRAG_ITEM_GROUPFIELD,
  MATCH_FIRST_POS,
  NAVIGATE_CHECK_CHANGE_DELAY,
  NAVIGATE_RECORD_COUNT_FIELD,
  NO_MATCH,
  ROWID,
  TEXT,
  TITLE,
  DRAG_NAVIGATE_RECORD,
  LEVELUNDERLINE,
} from '../constants';
import type { DataminingNavigateModal, NavigateConditionModal } from './data';
import type { DataminingModal, ExpandGroupFieldModal } from '../data';
import styles from '../index.less';
import type { DataminingStateContext } from '..';
import { DataminingContext } from '..';
import { navigateCheckedChange } from './navigateTree';
import { getAllChildRowids, getTreeRecordByKey } from '../utils';

const { Text } = Typography;

// 把没有children的都合并在一起
const PROPERTY = 'property_';
const combineCondition = (conditions: NavigateConditionModal[]): NavigateConditionModal[] => {
  const result: NavigateConditionModal[] = [];
  conditions.forEach((condition) => {
    if (Array.isArray(condition.children)) {
      result.push(condition);
    } else {
      const firstPropertyChildren = result.find(
        (cond) => cond[PROPERTY] === condition[PROPERTY] && !cond.children,
      );
      if (firstPropertyChildren) {
        firstPropertyChildren.value?.push(...(condition.value as string[]));
        firstPropertyChildren.text += `,${condition.text}`;
      } else result.push(condition);
    }
  });
  return result;
};

/**
 * 生成每一个导航列表的导航条件。
 * 条件的生成方式如下：从根节点往下，如果已选中，则加放当前节点；
 * 如果未选中，则判断下一级节点是否有选中的，有的就加入上一级的childrens节点，递归以上操作
 * 同一个级别下可能不同的groupfieldid,例如：
 * @param navigates
 */
// {
//     "children":
//         [{
//             "property_": "pmProject.pmGlobal.FOrganization|8a53b78262ea6e6d0162ea6e9ce30224-1",
//             "operator": "eq",
//             "value": "00",
//             "title": "分组的字段值",
//             "text": "选中的记录或者是上级的记录",
//             "children": [
//                 {
//                     "property_": "pmProject.pmGlobal.FOrganization|8a53b78262ea6e6d0162ea6e9ce30224-2",
//                     "operator": "in",
//                     "value": "0006,0007",
//                     "text": "记录1，记录2",
//                     "title": "子分组1"
//                 },
//                 {
//                     "property_": "pmAgreementState|ff80808174ec813b0174fb8fcd2a016d",
//                     "operator": "in",
//                     "value": "30,70",
//                     "text": "记录3，记录4",
//                     "title": "分组2"
//                 }]
//         }]
// };

// 生成一个树形结构的所有选中记录的条件值
export const getNavigateTreeCondition = (
  navigate: DataminingNavigateModal,
): NavigateConditionModal => {
  // 生成某一级的所有选中记录的条件
  // 从顶向下生成树
  const getLevelCondition = (records: any[]) => {
    const levelResult: NavigateConditionModal[] = [];
    records.forEach((record: any) => {
      const recordCond: NavigateConditionModal = {
        // 对于根节点的fieldid,fieldtitle可以不用设置，-1，-2，的fieldid除外
        property_: record.groupfieldid || null,
        title: record.grouptitle || null,
        operator: 'in',
        value: [record.value || null],
        text: record.text || null,
      };
      // 如果当前记录被勾选了,就不管子节点了
      if (navigate.checkedKeys.find((rec) => rec === record[ROWID])) {
        levelResult.push(recordCond);
      } else if (record[CHILDREN]) {
        // 如果当前有子节点，递归判断子节点中是否有选中的记录
        const children: NavigateConditionModal[] = getLevelCondition(record[CHILDREN]);
        if (children.length) {
          recordCond.children = children;
          levelResult.push(recordCond);
        }
      }
    });
    // 把没有children的，并且property_相同的都合并到一起
    return combineCondition(levelResult);
  };
  return {
    groupFieldid: navigate.navigateGroup.fieldid,
    title: navigate.navigateGroup.title,
    operator: 'in',
    children: getLevelCondition(navigate.dataSource[0][CHILDREN]),
  };
};

// 获取一个导航的所有条件值
export const getNaviagtesCondition = (
  navigates: DataminingNavigateModal[],
): NavigateConditionModal[] => {
  const result: NavigateConditionModal[] = [];
  navigates.forEach((navigate) => {
    // root 被选中，则忽略此导航条件
    if (navigate.checkedKeys.length && !navigate.checkedKeys.find((key) => key === 'root')) {
      result.push(getNavigateTreeCondition(navigate));
    }
  });
  return result;
};

// 递归取得所有条件的说明
export const getWholeConditionText = (conditions: NavigateConditionModal[]): string => {
  const result: string[] = [];
  conditions.forEach((condition) => {
    let text = condition.text as string;
    if (condition.children) {
      text += `(${getWholeConditionText(condition.children)})`;
    }
    result.push(text);
  });
  return result.join(',');
};

// 当选择一个分组作为导航的时候，读取其数据
export const fetchNavigateData = async (
  state: DataminingModal,
  navigate: DataminingNavigateModal,
  parentConditions: string[],
) => {
  const { moduleName, filters } = state;
  return request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
    method: 'POST',
    params: {
      moduleName_: moduleName,
    },
    data: serialize({
      moduleName,
      groupfieldid: navigate.navigateGroup.fieldid,
      title: navigate.navigateGroup.title,
      conditions: JSON.stringify([]),
      fields: JSON.stringify(['count.*']),
      parentconditions: JSON.stringify(parentConditions),
      sqlparamstr: filters.sqlparam ? JSON.stringify(getSqlparamFilter(filters.sqlparam)) : null,
    }),
  });
};

// 导航条件中选中和未选中的互换
export const toggleNavigateSelected = (
  state: DataminingModal,
  dispatch: Function,
  navigate: DataminingNavigateModal,
) => {
  const { checkedKeys, dataSource } = navigate;
  const checked: string[] = [];

  const hasChecked = (rowid: string): boolean => !!checkedKeys.find((key) => key === rowid);
  const childSomeChecked = (record: any): boolean => {
    const c: string[] = getAllChildRowids(record);
    for (let i = 0; i < c.length; i += 1) {
      if (hasChecked(c[i])) return true;
    }
    return false;
  };
  const arrangeChecked = (records: any[]) => {
    // 如果一个节点选中了，那就把其所有选中的子节点全部删除
    // 如果一个节点没有选中，那么判断其子节点是否有一个选中的，如果有，这个节点还是未选中
    // 如果一个节点没有选中，其为叶节点，或者所有子节点都未选中，那么选中这个节点
    records.forEach((record: any) => {
      if (!hasChecked(record[ROWID])) {
        if (record.children) {
          if (!childSomeChecked(record))
            // 没有子节点，或者子节点都没有选中
            checked.push(record[ROWID]);
          // 有子节点，并且有一个选中的
          else arrangeChecked(record.children);
        } else checked.push(record[ROWID]);
      }
    });
  };
  if (checkedKeys.length === 0) {
    checked.push('root');
  } else if (hasChecked('root')) {
    // 如果已经全选了，那么全清空
  } else {
    arrangeChecked(dataSource[0].children);
  }
  navigateCheckedChange(
    state,
    dispatch,
    navigate.navigateGroup.fieldid,
    checked,
    NAVIGATE_CHECK_CHANGE_DELAY,
  );
};

// 按照某个分组展开导航数据时
export const expandNavigateRowWithGroup = ({
  state,
  navigateGroup,
  expandRecord,
  groupFieldid,
  groupTitle,
  dispatch,
}: {
  state: DataminingModal;
  navigateGroup: ExpandGroupFieldModal;
  expandRecord: any;
  groupFieldid: string;
  groupTitle: string;
  dispatch: Function;
}) => {
  const { moduleName, filters } = state;
  // 从选中节点开始加入所有的父节点
  const parentConditions: string[] = [];
  let record = expandRecord;
  do {
    parentConditions.push(`${record.groupfieldid}=${record.value}`);
    record = record.parentNode;
  } while (record);
  request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
    method: 'POST',
    params: {
      moduleName_: moduleName,
    },
    data: serialize({
      moduleName,
      groupfieldid: groupFieldid,
      title: groupTitle,
      conditions: JSON.stringify([]),
      fields: JSON.stringify(['count.*']),
      parentconditions: JSON.stringify(parentConditions),
      sqlparamstr: filters.sqlparam ? JSON.stringify(getSqlparamFilter(filters.sqlparam)) : null,
    }),
  }).then((childrens: any) => {
    const expandedKeys: string[] = [];
    /* eslint-disable */
    const children = genAllTreeData(
      childrens,
      navigateGroup,
      expandRecord,
      groupFieldid,
      groupTitle,
      expandedKeys,
    );
    /* eslint-enable */
    if (expandRecord.children) (expandRecord.children as any[]).push(...children);
    else apply(expandRecord, { children });
    dispatch({
      type: ACT_NAVIGATE_ROW_EXPAND,
      payload: {
        navigateGroup,
        key: expandRecord.key,
        expandedKeys,
      },
    });
  });
};

export const NavigateRecordTitle = ({
  navigateGroup,
  node,
  search,
}: {
  navigateGroup: ExpandGroupFieldModal;
  node: any;
  search?: string;
}) => {
  const context = useContext<DataminingStateContext>(DataminingContext);
  const { state, dispatch } = context;
  const ref: any = React.useRef();
  const [{ isOver }, drop] = useDrop({
    accept: DRAG_ITEM_GROUPFIELD,
    canDrop: () => true,
    /**
     * 当用户拖动分组字段放到记录上时进行展开。
     */
    drop: (item: any) => {
      expandNavigateRowWithGroup({
        state,
        dispatch,
        navigateGroup,
        expandRecord: node,
        groupFieldid: item.fieldid,
        groupTitle: item.title,
      });
    },
    collect: (monitor) => {
      return {
        isOver: !!monitor.isOver(),
        canDrop: monitor.canDrop(),
      };
    },
  });
  const [, drag, preview] = useDrag({
    item: { type: DRAG_NAVIGATE_RECORD, navigateGroup, node },
    options: {
      dropEffect: 'copy', // 'copy' : 'move'
    },
    canDrag: true,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drop(drag(ref));
  return (
    <>
      <DragPreviewImage connect={preview} src="/images/dragrecords.png" />
      <div ref={ref} className={isOver ? styles.dragover : ''}>
        {search ? (
          <Highlighter
            highlightClassName="ant-btn-link"
            searchWords={[search]}
            textToHighlight={node.text}
          />
        ) : (
          node.text || '未定义'
        )}
        <Text type="secondary">({node[NAVIGATE_RECORD_COUNT_FIELD]})</Text>
      </div>
    </>
  );
};

// 导航条件中执行筛选操作
export const onNavigateSearch = (
  navigate: DataminingNavigateModal,
  search: string,
  dispatch: Function,
) => {
  const { navigateGroup } = navigate;
  if (navigate.search === search) return;
  const searchChildren = (array: any[]) => {
    array.forEach((rec) => {
      const record = rec;
      const find = PinyinMatch.match(record.text, search);
      record[MATCH_FIRST_POS] = find ? find[0] : NO_MATCH;
      record[TITLE] = (
        <NavigateRecordTitle
          node={record}
          navigateGroup={navigateGroup}
          search={find ? record[TEXT].substring(find[0], find[1] + 1) : ''}
        />
      );
      if (record.children) searchChildren(record.children);
    });
    array.sort((a, b) => a[MATCH_FIRST_POS] - b[MATCH_FIRST_POS]);
  };
  if (search) {
    if (search.length === 1) {
      message.warn('请输入二个以上的文字或字符再进行查询');
      return;
    }
    searchChildren(navigate.dataSource[0].children);
    dispatch({
      type: ACT_NAVIGATE_FETCH_DATA,
      payload: {
        fieldid: navigateGroup.fieldid,
        dataSource: [...navigate.dataSource],
        search,
      },
    });
  } else {
    const cancelSearchChildren = (array: any[]) => {
      array.forEach((rec) => {
        const record = rec;
        if (record[MATCH_FIRST_POS] !== NO_MATCH)
          record[TITLE] = (
            <NavigateRecordTitle node={record} navigateGroup={navigateGroup} search="" />
          );
        delete record[MATCH_FIRST_POS];
        if (record.children) cancelSearchChildren(record.children);
      });
    };
    cancelSearchChildren(navigate.dataSource[0].children);
    dispatch({
      type: ACT_NAVIGATE_FETCH_DATA,
      payload: {
        fieldid: navigateGroup.fieldid,
        dataSource: [...navigate.dataSource],
        search,
      },
    });
  }
};

// 对导航树按照字段和顺序进行排序
export const navigateDataSourceSort = (
  navigate: DataminingNavigateModal,
  dispatch: Function,
  sortProp: string,
  sortOrder: string,
) => {
  const { dataSource, navigateGroup } = navigate;
  const v = sortOrder === 'asc' ? 1 : -1;
  const sortProperty = sortProp === 'count' ? NAVIGATE_RECORD_COUNT_FIELD : sortProp;
  const sortChildren = (array: any[]) => {
    array.sort((a, b) => {
      if (a[sortProperty] > b[sortProperty]) return v;
      return a[sortProperty] < b[sortProperty] ? -v : 0;
    });
    array.forEach((rec) => rec.children && sortChildren(rec.children));
  };
  sortChildren(dataSource[0].children);
  dispatch({
    type: ACT_NAVIGATE_FETCH_DATA,
    payload: {
      fieldid: navigateGroup.fieldid,
      dataSource: [...navigate.dataSource],
    },
  });
};
// 在导航中找到选中的记录
// 如果sourceRecord包括在选中的里面，就返回所有选中的，否则只返回sourceRecord
export const getNavigateSelectedRecords = (
  state: DataminingModal,
  groupfieldid: string,
  sourceRecord: any,
): any[] => {
  const { navigates } = state;
  const navigate = navigates.find((nav) => nav.navigateGroup.fieldid === groupfieldid);
  if (navigate) {
    if (navigate.selectedKeys.find((key) => key === sourceRecord[ROWID])) {
      const records: any[] = [];
      navigate.selectedKeys.forEach((key) => {
        const record = getTreeRecordByKey(navigate.dataSource, key, ROWID);
        if (record) records.push(record);
      });
      return records;
    }
    return [sourceRecord];
  }
  return [];
};

/**
 * 返回所有节点，在总节点比较少的情况下就是这样
 * @param nodes
 */
export const genAllTreeData = (
  nodes: any[],
  navigateGroup: ExpandGroupFieldModal,
  parentNode: any,
  groupFieldid: string,
  groupTitle: string,
  expandedKeys: string[],
): any => {
  const treeData: any[] = [];
  const getNode = (node: any, search: string = '') => {
    const result: any = {
      ...node,
      key: node.rowid,
    };
    // 全自动生级的，加入当前级数
    if (node[LEVELUNDERLINE])
      result.groupfieldid = groupFieldid.replace('-all', `-${node[LEVELUNDERLINE]}`);
    else result.groupfieldid = groupFieldid;
    result.grouptitle = groupTitle;
    result.title = (
      <NavigateRecordTitle navigateGroup={navigateGroup} node={result} search={search} />
    );
    return result;
  };

  treeData.push(
    ...nodes.map((node: any) => {
      const { children } = node;
      const item: any = getNode(node, '');
      item.parentNode = parentNode;
      if (Array.isArray(children) && children.length) {
        // 默认所有节点都展开
        expandedKeys.push(node[ROWID]);
        item.children = genAllTreeData(
          children,
          navigateGroup,
          item,
          groupFieldid,
          groupTitle,
          expandedKeys,
        );
      }
      return item;
    }),
  );
  return treeData;
};

/* eslint-enable no-use-before-define */
