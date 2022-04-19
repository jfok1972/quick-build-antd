/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import moment from 'moment';
import { API_HEAD } from '@/utils/request';
import { getLocalMonetaryPosition, getLocalMonetaryType, MD5 } from '@/utils/utils';
import type { DataminingModal, SchemeSettingModal } from './data';
import { getMonetary } from '../module/grid/monetary';
import {
  getFilterRestHidden,
  getFilterRestNumber,
  getModuleInfo,
  getSqlParamDefaultValue,
} from '../module/modules';
import {
  ACT_FETCH_LOADING_CHANGED,
  PARENTNODE,
  ROOTROWID,
  ROWID,
  SELECTED,
  TEXTUNDERLINE,
} from './constants';
import { getAllFilterExportString } from './condition/conditionUtils';
import { rebuildColumns } from './resultTree/columnFactory';
import { getSqlparamExportStr } from './resultTree/sqlparams';
import type { DataminingFilterCondition } from '../module/data';

// 读取数据之前和之后设置fetchLoading的值
export const setFetchLoading = ({
  dispatch,
  fetchLoading,
}: {
  dispatch: Function;
  fetchLoading: boolean;
}) => {
  dispatch({
    type: ACT_FETCH_LOADING_CHANGED,
    payload: {
      fetchLoading,
    },
  });
};

export const getDefaultDataminingSetting = (): SchemeSettingModal => {
  return {
    showdetail: 'no',
    expandRowAddGroupName: 'no',
    expandColAddGroupName: 'yes',
    expandColAddFilter: 'no',
    expandMaxCol: 12,
    expandMaxRow: 0,
    expandMaxLevel: 0,
    autoHiddenZeroCol: 'yes',
    refreshMode: 'expandpath',
    expandMultiGroup: 'no',
    expandItemDirection: 'asc',
    expandItemMode: 'text',
    addCountSumPercent: 'yes',
    addNumberTip: 'yes',
    leafColumnCharSize: 6,
  };
};

export const getInitDataminingState = (
  moduleName: string,
  defaultSchemeid?: string,
): DataminingModal => {
  let moduleInfo: any;
  if (moduleName !== 'undefined') moduleInfo = getModuleInfo(moduleName);
  const result: DataminingModal = {
    moduleName,
    defaultSchemeid,
    fromCache: false,
    schemes: [],
    refreshAllCount: -1, // 第一次是默认的
    refreshFilterDataSourceCount: 0,
    schemeChanged: false,
    selectedRowKeys: [], // 当前选中的记录
    expandedRowKeys: [ROOTROWID], // 树形结构展开的节点
    fetchLoading: false,
    monetary: getMonetary(getLocalMonetaryType(moduleName)),
    monetaryPosition: getLocalMonetaryPosition(moduleName),
    currentScheme: {
      schemeid: '',
      text: '',
      title: '',
      savepath: true,
    },
    schemeState: {
      columnGroup: [],
      dataSource: [],
      fieldGroup: [
        {
          aggregate: 'count',
          aggregatefieldname: 'count.*',
          fieldname: '*',
          fieldtype: 'String',
          leaf: true,
          text: '记录数',
          rowid: 'field-101',
        },
      ],
      isMultFieldGroup: false,
      rowGroup: [],
      setting: getDefaultDataminingSetting(),
      sorts: [
        {
          property: undefined,
          direction: 'ASC',
        },
      ],
    },
    filters: {
      navigatefilters: [],
      viewscheme: {
        title: undefined,
        viewschemeid: undefined,
      },
      userfilter: [],
      sqlparam:
        moduleInfo && moduleInfo.moduleLimit && moduleInfo.moduleLimit.hassqlparam
          ? getSqlParamDefaultValue(moduleInfo)
          : null,
    },
    filterDataSource: [],
    navigates: [],
    currSetting: {
      fieldGroupFixedLeft: false,
      navigate: {
        visible: false,
        activeKey: '',
      },
      groupRegionVisible: false,
      filtersRegionVisible: false,
      userFilterRegionVisible: false,
      // 筛选字段从第几个开始隐藏，-1表示不隐藏
      userFilterRestNumber: moduleName !== 'undefined' ? getFilterRestNumber(moduleInfo) : -1,
      // 筛选字段是否隐藏 展开，收起
      userFilterRestHidden: moduleName !== 'undefined' ? getFilterRestHidden(moduleInfo) : false,
    },
    exportSetting: {
      colorless: false,
      disablerowgroup: false,
      unittextalone: false,
      pagesize: 'pageautofit',
      autofitwidth: true,
      scale: 100,
      disablecollapsed: false,
    },
  };
  return result;
};

/**
 * 根据聚合字段以后附加在字段上的条件来计算字段的名称值
 * @param fieldname
 * @param condition
 */
export const getColumnDataIndex = (
  fieldname: string,
  condition: string | undefined = undefined,
): string => {
  const md5str = fieldname + (condition || '');
  return `jf${MD5(md5str).substr(0, 27)}`;
};

/**
 * 将数据分析的行条件和列条件转换为userfilter
 * FUser|8a53b78262ea6e6d0162ea6ea59a02eb=8a53b78262ea6e6d0162ea6e8ccd00f4 转换成
 * property_:'FUser|8a53b78262ea6e6d0162ea6ea59a02eb';
 * operator : 'in';
 * value : 'value';
 * @param conditions
 */
export const changeDataminingConditionsToUserFilters = (conditions: string[]) => {
  const result: DataminingFilterCondition[] = [];
  conditions.forEach((condition) => {
    const conds = condition.split('|||');
    conds.forEach((cond) => {
      const equesPos = cond.indexOf('=');
      result.push({
        property_: cond.substring(0, equesPos),
        operator: 'in',
        value: cond.substring(equesPos + 1, cond.length),
      });
    });
  });
  return result;
};

/**
 * 返回一系列的字段的名称值
 * @param fieldnames
 * @param condition
 */
export const getColumnsDataIndex = (
  fieldnames: string[],
  condition: string | undefined = undefined,
): string[] => {
  const result: string[] = [];
  fieldnames.forEach((fieldname) => {
    result.push(getColumnDataIndex(fieldname, condition));
  });
  return result;
};

// 将前01个月，下01个月，改为实际的月份
const transformArray: any[] = [];
export const fieldTitleTransform = (title: string) => {
  // const now = new Date();
  let result = title;
  if (transformArray.length === 0) {
    for (let i = 1; i <= 12; i += 1) {
      transformArray.push({
        sour: `前${i < 10 ? '0' : ''}${i}个月`,
        tranto: moment().add(-i, 'month').format('YYYY年MM月'),
        // Ext.Date.format(Ext.Date.add(now, 'mo', -i), "y年m月")
      });
      transformArray.push({
        sour: `下${i < 10 ? '0' : ''}${i}个月`,
        tranto: moment().add(i, 'month').format('YYYY年MM月'),
        // Ext.Date.format(Ext.Date.add(now, 'mo', i), "y年m月")
      });
    }
  }
  if (result) {
    for (let i = 0; i < transformArray.length; i += 1) {
      result = result.replace(transformArray[i].sour, transformArray[i].tranto);
    }
  }
  return result;
};

// 在树形结构中找到主键是pinkey的记录并返回
export const getTreeRecordByKey = (records: any[], key: string, keyFieldName: string): any => {
  let result: any = null;
  const findPinRecord = (recs: any[]) => {
    recs.forEach((rec: any) => {
      if (!result)
        if (rec[keyFieldName] === key) {
          result = rec;
        }
      if (!result && rec.children && Array.isArray(rec.children)) findPinRecord(rec.children);
    });
  };
  findPinRecord(records);
  return result;
};

// 返回所有叶节点的记录
export const getAllLeafRecords = (dataSource: any[]): any[] => {
  const result: any[] = [];
  const getLeafs = (recs: any[]) => {
    recs.forEach((rec: any) => {
      if (rec.children && Array.isArray(rec.children)) getLeafs(rec.children);
      else result.push(rec);
    });
  };
  getLeafs(dataSource);
  return result;
};

// 返回所有的子节点的id值
export const getAllChildRowids = (record: any): string[] => {
  const result: string[] = [];
  const getChildRowids = (recs: any[]) => {
    recs.forEach((rec: any) => {
      result.push(rec[ROWID]);
      if (rec.children && Array.isArray(rec.children)) getChildRowids(rec.children);
    });
  };
  if (record.children) getChildRowids(record.children);
  return result;
};

// 返回所有的非叶节点的rowid数组
export const getAllhasChildrenRowids = (datasource: any[], key: string = ROWID): string[] => {
  const result: string[] = [];
  const getRowids = (recs: any[]) => {
    recs.forEach((rec) => {
      if (rec.children) {
        result.push(rec[key]);
        getRowids(rec.children);
      }
    });
  };
  getRowids(datasource);
  return result;
};

// 返回所有的叶节点的rowid数组
export const getAllleafRowids = (datasource: any[], key: string = ROWID): string[] => {
  const result: string[] = [];
  const getRowids = (recs: any[]) => {
    recs.forEach((rec) => {
      if (rec.children) getRowids(rec.children);
      else result.push(rec[key]);
    });
  };
  getRowids(datasource);
  return result;
};

/**
 * 对一个树形结构的每一层按照field,asc进行排序
 * @param dataSource
 * @param field
 * @param order 1--正序，2--逆序
 */
export const sortTree = (dataSource: any[], field: string, order: 1 | -1): any[] => {
  const sortChildren = (children: any[]) => {
    children.forEach((rec) => {
      if (Array.isArray(rec.children)) {
        sortChildren(rec.children);
      }
    });
    children.sort((a, b) => {
      if (typeof a[field] === 'string')
        // 按照本地化进行排序
        return (a[field] as string).localeCompare(b[field]) * order;
      return (a[field] || 0) > (b[field] || 0) ? order : -order;
    });
  };
  sortChildren(dataSource);
  return [...dataSource];
};

export const removeFromParentNode = (anode: any): any => {
  const node = anode;
  if (node[PARENTNODE]) {
    const parentChildren: any[] = node[PARENTNODE].children;
    if (Array.isArray(parentChildren)) {
      parentChildren.splice(
        parentChildren.findIndex((item) => item === node),
        1,
      );
      if (parentChildren.length === 0) {
        delete node[PARENTNODE].children;
      }
    }
  }
  return node;
};

/**
 * 取得树形结构所有selectField为true的keyField的值
 * @param records
 * @param keyField
 * @param selectField
 */
export const getTreeSelectedKeys = (
  records: any[],
  keyField: string,
  selectField: string = SELECTED,
): string[] => {
  const result: string[] = [];
  const getSelectedKeys = (recs: any[]) => {
    recs.forEach((rec: any) => {
      if (rec[selectField]) result.push(rec[keyField]);
      if (rec.children) getSelectedKeys(rec.children);
    });
  };
  getSelectedKeys(records);
  return result;
};

/**
 * 在执行了隐藏当前列的所有后续节点后，在tooltip中显示的文字,从index开始算起,只显示前三个，多于3个的加等N个。
 */
export const getRestTitles = (children: any[], index: number): string | undefined => {
  // 显示几个分组的title
  const showCount = 5;
  if (index > children.length) return undefined;
  const array: string[] = [];
  for (let i = index; i < Math.min(children.length, index + showCount); i += 1) {
    array.push(children[i].text);
  }
  return (
    array.join(' , ') +
    (children.length - showCount > index ? `等${children.length - index}个分组` : '')
  );
};

const regexp = new RegExp('<[^>]*>', 'gm'); // 把所有的超文本标记全部删掉
const getExportGridColumnsLeaf = (items: any[], leafColumns: any[]) => {
  const result: any[] = [];
  items.forEach((item) => {
    if (item.hidden) return; // 如果隐藏了就不显示了,看到什么字段就导出什么字段
    const t = item[TEXTUNDERLINE] || item.menuText || item.text;
    const column: any = {
      text: t ? t.replace(regexp, '') : '',
    };
    if (!item.children) {
      //  最底层的节点
      if (item.dataIndex) {
        column.dataIndex = item.dataIndex;
        if (item.ismonetary) column.ismonetary = item.ismonetary;
        if (item.unittext) column.unittext = item.unittext;
        if (item.aggregate) column.aggregate = item.aggregate;
        if (item.aggregatefieldname) column.aggregatefieldname = item.aggregatefieldname;
        if (item.fieldname) column.fieldname = item.fieldname;
        if (item.fieldtype) column.fieldtype = item.fieldtype;
        leafColumns.push({
          dataIndex: item.dataIndex,
          ismonetary: item.ismonetary,
          unittext: item.unittext,
          aggregate: item.aggregate,
          fieldtype: item.fieldtype,
        });
      }
    } else {
      column.items = getExportGridColumnsLeaf(item.children, leafColumns);
    }
    if (column.dataIndex || column.items) {
      result.push(column);
    }
  });
  return result;
};

const getExportGridColumns = (state: DataminingModal, leafColumns: any[]) => {
  const { schemeState } = state;
  const gridColumns = rebuildColumns(
    schemeState.fieldGroup,
    schemeState.isMultFieldGroup,
    schemeState.columnGroup,
    state,
    () => {},
  );
  return getExportGridColumnsLeaf(gridColumns, leafColumns);
};

const getTreeExportData = (
  state: DataminingModal,
  node: any,
  leafcolumns: any[],
  disablecollapsed: boolean,
) => {
  const result: any = {};
  const data: any[] = [];
  if (node) {
    leafcolumns.forEach((column) => {
      if (column.dataIndex === 'text') data.push(node[TEXTUNDERLINE] || node[column.dataIndex]);
      else data.push(node[column.dataIndex]);
    });
    result.data = data;
    if (node.children) {
      if (!(disablecollapsed && !state.expandedRowKeys.find((k) => k === node[ROWID]))) {
        result.children = [];
        node.children.forEach((child: any) => {
          result.children.push(getTreeExportData(state, child, leafcolumns, disablecollapsed));
        });
      }
    }
  }
  return result;
};

/**
 * 导出数据分析结果到excel或pdf
 * @param {} menuitem
 */
export const exportExcelOrPdf = (state: DataminingModal, topdf: boolean) => {
  const { moduleName, exportSetting, monetary, filters } = state;
  const moduleInfo = getModuleInfo(moduleName);
  const leafcolumns: any[] = [];
  const columns = getExportGridColumns(state, leafcolumns);
  const treedata = getTreeExportData(
    state,
    state.schemeState.dataSource[0],
    leafcolumns,
    exportSetting.disablecollapsed,
  );
  const params: any = {
    topdf,
    moduletitle: moduleInfo.title,
    schemename: state.currentScheme.title || '未保存的数据分析方案',
    conditions: JSON.stringify(
      getSqlparamExportStr(filters.sqlparam).concat(
        getAllFilterExportString(state.filterDataSource),
      ),
    ),
    colorless: exportSetting.colorless,
    monerary: monetary.monetaryUnit,
    moneraryText: monetary.monetaryUnit === 1 ? '' : monetary.unittext,

    disablerowgroup: exportSetting.disablerowgroup,
    unittextalone: exportSetting.unittextalone,
    pagesize: exportSetting.pagesize,
    autofitwidth: exportSetting.autofitwidth,
    scale: exportSetting.scale,

    columns: JSON.stringify(columns),
    leafcolumns: JSON.stringify(leafcolumns),
    data: JSON.stringify(treedata),
  };

  const children: any[] = [];
  Object.keys(params).forEach((i) => {
    const node = window.document.createElement('input');
    node.type = 'hidden';
    node.name = i;
    node.value =
      typeof params[i] === 'string' ? params[i].replace(new RegExp('"', 'gm'), "'") : params[i];
    children.push(node);
  });
  const form = window.document.createElement('form');
  form.method = 'post';
  form.action = `${API_HEAD}/platform/datamining/exporttoexcel.do`;
  children.forEach((child) => form.appendChild(child));
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};
