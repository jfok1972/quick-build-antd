/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { createContext } from 'react';
import { apply, setLocalMonetaryPosition, setLocalMonetaryType } from '@/utils/utils';
import { message } from 'antd';
import update from 'immutability-helper';
import type { ModuleState, TextValue, SortModal, ModuleFilters, GroupModal } from '../data';
import { getModuleInfo } from '../modules';
import { fetchObjectDataSync, fetchObjectRecordSync, fetchObjectData } from '../service';
import {
  getAllFilterAjaxParam,
  getColumnFiltersInfo,
  getGridColumnFilters,
} from '../grid/filterUtils';
import { getGridColumnSorts } from '../grid/sortUtils';
import { getMonetary } from '../grid/monetary';
import { RECNOUNDERLINE } from '../constants';

interface ActionProps {
  type: string;
  payload: any;
}

interface ModuleStateContext {
  moduleState: any;
  dispatch: any;
}

const fetchDataAsync = (moduleState: ModuleState) => {
  const { moduleName, gridParams, sorts, sortschemeid, filters } = moduleState;
  // if (!filters.parentfilter?.fieldvalue)          // 如果没有parentFilter的值，那么不用去后台取数据了，应该是空的
  //     return moduleState;
  const payload: any = { moduleName };
  payload.page = gridParams.curpage;
  payload.limit = gridParams.limit;
  payload.start = gridParams.start;
  if (sortschemeid) payload.sortschemeid = sortschemeid;
  apply(payload, getAllFilterAjaxParam(filters, moduleState));
  if (sorts.length) {
    payload.sort = JSON.stringify(sorts);
  }
  return fetchObjectData(payload);
};

/**
 * 异步处理的一个办法
 * 参考了https://blog.csdn.net/weixin_42461410/article/details/88650304
 * @param dispatch
 */
export const wrapperDispatch = (moduleState: ModuleState, dispatch: any) => {
  return (action: ActionProps) => {
    // type:'modules/xxxx' ,去掉modules/
    const type = action.type.split('/')[action.type.split('/').length - 1];
    // message.info('wrapperDispatch:' + type);
    if (type === 'fetchData') {
      if (moduleState.filters.parentfilter?.fieldvalue || moduleState.filters.dataminingFilter) {
        dispatch({ type: 'loadingStart' });
        fetchDataAsync(moduleState)
          .then((response: any) => {
            dispatch({
              type: 'updateDataList',
              payload: response,
            });
          })
          .finally(() => {
            dispatch({ type: 'loadingFinished' });
          });
      }
    } else dispatch(action);
  };
};

const updateDateList = (moduleState: ModuleState, action: ActionProps) => {
  const { primarykey, namefield } = getModuleInfo(moduleState.moduleName);
  const { curpage, limit, start, total, totalpage, remoteRoot, data: dataSource } = action.payload;
  // 把不是当页的选中的记录全部清除掉。默认刷新过后，不保留非当前页的选中记录
  // 树形结构的只保留根结点的选中状态
  const selectedRowKeys = moduleState.selectedRowKeys.filter(
    (key: any) => dataSource.find((record: any) => record[primarykey] === key) !== undefined,
  );
  return {
    ...moduleState,
    gridParams: { curpage, limit, start, total, totalpage },
    dataSource,
    remoteRoot: remoteRoot || {},
    selectedRowKeys,
    recordOrderChanged: false,
    selectedTextValue: selectedRowKeys.map((key: string): TextValue => {
      const rec = dataSource.find((record: any) => record[primarykey] === key) || {};
      return {
        text: rec[namefield],
        value: key,
      };
    }),
  };
};

/**
 * 异步处理的一个办法
 * 参考了https://blog.csdn.net/weixin_42461410/article/details/88650304
 * @param dispatch
 */
export const wrapperSelectDispatch = (moduleState: ModuleState, dispatch: any) => {
  return (action: ActionProps) => {
    // type:'modules/xxxx' ,去掉modules/
    const type = action.type.split('/')[action.type.split('/').length - 1];
    // message.info('wrapperDispatch:' + type);
    if (type === 'fetchData') {
      dispatch({ type: 'loadingStart' });
      fetchDataAsync(moduleState)
        .then((response: any) => {
          dispatch({
            type: 'updateDataList',
            payload: response,
          });
        })
        .finally(() => {
          dispatch({ type: 'loadingFinished' });
        });
    } else dispatch(action);
  };
};

const fetchData = (moduleState: ModuleState) => {
  const { moduleName, gridParams, sorts, sortschemeid, remoteRoot, filters } = moduleState;
  if (!filters.parentfilter?.fieldvalue && !filters.dataminingFilter)
    // 如果没有parentFilter的值，那么不用去后台取数据了，应该是空的
    return moduleState;
  const moduleInfo = getModuleInfo(moduleName);
  const payload: any = { moduleName };
  payload.page = gridParams.curpage;
  payload.limit = gridParams.limit;
  payload.start = gridParams.start;
  if (sortschemeid) payload.sortschemeid = sortschemeid;
  apply(payload, getAllFilterAjaxParam(filters, moduleState));
  if (sorts.length) {
    payload.sort = JSON.stringify(sorts);
  }
  const response: any = fetchObjectDataSync(payload);
  const { curpage, limit, start, total, totalpage, data: dataSource } = response;
  // 把不是当页的选中的记录全部清除掉。默认刷新过后，不保留非当前页的选中记录
  // 树形结构的只保留根结点的选中状态
  const selectedRowKeys = moduleState.selectedRowKeys.filter(
    (key: any) =>
      dataSource.find((record: any) => record[moduleInfo.primarykey] === key) !== undefined,
  );
  return {
    ...moduleState,
    gridParams: { curpage, limit, start, total, totalpage },
    dataSource,
    remoteRoot: remoteRoot || {},
    selectedRowKeys,
    selectedTextValue: selectedRowKeys.map((key: string): TextValue => {
      const rec = dataSource.find((record: any) => record[moduleInfo.primarykey] === key) || {};
      return {
        text: rec[moduleInfo.namefield],
        value: key,
      };
    }),
  };
};

const filterChanged = (moduleState: ModuleState, action: ActionProps) => {
  // console.log('filterChanged', action.payload);
  const { payload } = action;
  const { type } = payload;
  const filters: ModuleFilters = { ...moduleState.filters };
  switch (type) {
    // 使用 parentFilterChanged 了 ，不然数据会刷新二次
    case 'parentFilterChange':
      filters.parentfilter = payload.parentFilter;
      // 如果父模块限定条件改变了，那么其他所有的筛选都清除
      filters.navigate = [];
      filters.viewscheme = { title: undefined, viewschemeid: undefined };
      filters.searchfilter = ''; // 查询框中的文字
      filters.columnfilter = []; // 当前生效的列筛选条件
      filters.userfilter = []; // 用户自定义的筛选条件
      break;
    case 'columnFilterChange':
      filters.columnfilter = getGridColumnFilters(
        payload.columnfilter,
        getColumnFiltersInfo(moduleState.moduleName),
      );
      break;
    case 'clearAllColumnFilter':
      filters.columnfilter = [];
      break;
    case 'clearColumnFilter':
      filters.columnfilter = filters.columnfilter?.filter(
        (filter) => filter.property !== payload.dataIndex,
      );
      break;
    case 'viewSchemeChange':
      filters.viewscheme = { ...payload.viewscheme };
      break;
    case 'navigateSelectChange':
      filters.navigate = payload.navigates;
      break;
    case 'clearNavigateFilter': {
      const { index } = payload;
      let navigate: any[] = [];
      if (index !== -1) {
        navigate = [...filters.navigate];
        navigate.splice(index, 1);
      }
      filters.navigate = navigate;
      break;
    }
    case 'userDefineFilter':
      filters.userfilter = payload.userfilter;
      break;
    case 'searchfilter':
      filters.searchfilter = payload.query;
      break;
    case 'clearUserFilter':
      filters.userfilter = filters.userfilter?.map((filter) => {
        const f = { ...filter };
        delete f.value;
        delete f.text;
        return f;
      });
      break;
    default:
      break;
  }
  const { gridParams } = moduleState;
  return {
    ...moduleState,
    filters,
    gridParams: { ...gridParams, curpage: 1 },
    dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
  };
};

const expandChanged = (moduleState: ModuleState, action: ActionProps) => {
  const { expanded, key, title, selected } = action.payload;
  const { expandedRowKeys } = moduleState;
  if (selected) {
    // 展开即选中，不是树都这样操作，只能展开一个
    return {
      ...moduleState,
      expandedRowKeys: expanded ? [key] : [],
      selectedRowKeys: [key],
      selectedTextValue: [{ text: title, value: key }],
    };
  }
  return {
    // 树状的可以展开多个
    ...moduleState,
    expandedRowKeys: expanded
      ? [...expandedRowKeys, key]
      : expandedRowKeys.filter((value: string) => value !== key),
  };
};

const resetSelectedRow = (moduleState: ModuleState) => {
  return {
    ...moduleState,
    selectedRowKeys: [],
    selectedTextValue: [],
  };
};

/**
 * 记录修改过后更新,如果当前
 * @param moduleState
 * @param action
 */
const updateRecord = (moduleState: ModuleState, action: ActionProps) => {
  const { record } = action.payload;
  const { moduleName } = moduleState;
  const { primarykey } = getModuleInfo(moduleName);
  const dataSource = moduleState.dataSource.map((rec: any) => {
    if (rec[primarykey] === record[primarykey]) {
      record[RECNOUNDERLINE] = rec[RECNOUNDERLINE];
      return record;
    }
    return rec;
  });
  let { formState } = moduleState;
  if (moduleState.formState.visible) {
    if (moduleState.formState.currRecord[primarykey] === record[primarykey]) {
      formState = { ...formState, currRecord: { ...record } };
    }
  }
  return {
    ...moduleState,
    dataSource,
    formState,
  };
};

const refreshRecord = (moduleState: ModuleState, action: ActionProps) => {
  const response = fetchObjectRecordSync({
    objectname: moduleState.moduleName,
    id: action.payload.recordId,
  });
  const record = response.data;
  return updateRecord(moduleState, {
    type: 'updateRecord',
    payload: {
      record,
    },
  });
};

/**
 * 插入记录
 * @param moduleState
 * @param action
 */
const insertRecord = (moduleState: ModuleState, action: ActionProps) => {
  const { record } = action.payload;
  const { moduleName } = moduleState;
  const moduleInfo = getModuleInfo(moduleName);
  const gridParams = { ...moduleState.gridParams };
  record[RECNOUNDERLINE] = '+';
  // 如果超过当前页的显示记录数，则不会显示出来了
  const dataSource = [...moduleState.dataSource, record]
    .reverse()
    .filter((_, index) => index < gridParams.limit)
    .reverse();
  gridParams.total += 1;
  if (gridParams.curpage === 0) gridParams.curpage = 1;
  if (gridParams.totalpage === 0) gridParams.totalpage = 1;
  const key = record[moduleInfo.primarykey];
  return {
    ...moduleState,
    dataSource,
    gridParams,
    lastInsertRecord: record,
    selectedRowKeys: [key], // 新建记录后，选中该条记录，不然找不到新建的在哪
    selectedTextValue: [{ text: record[moduleInfo.namefield], value: key }],
  };
};

// 恢复到默认排序
const resetSorts = (moduleState: ModuleState) => {
  const sorts: SortModal[] = [];
  return {
    ...moduleState,
    sorts,
    sortschemeid: null,
    dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
  };
};

// 单字段和多字段排序的转换 sortMultiple:{} and sortMultiple : {multiple : 1}
const sortMultipleChanged = (moduleState: ModuleState, action: ActionProps) => {
  const { sortMultiple } = action.payload;
  const { sorts } = moduleState;
  return !sortMultiple.multiple && sorts.length > 1
    ? {
        ...moduleState,
        sortMultiple,
        sorts: [sorts[0]],
        dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
      }
    : {
        ...moduleState,
        sortMultiple,
        dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
      };
};

const columnSortChanged = (moduleState: ModuleState, action: ActionProps) => {
  const { columnsorter } = action.payload;
  const sorts: SortModal[] = getGridColumnSorts(columnsorter);
  return {
    ...moduleState,
    sorts,
    sortschemeid: null,
    dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
  };
};

const groupChanged = (moduleState: ModuleState, action: ActionProps) => {
  const { property, title } = action.payload;
  const groups: GroupModal[] = [
    {
      property,
      title,
    },
  ];
  return {
    ...moduleState,
    groups,
    // dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
  };
};

const resetGroups = (moduleState: ModuleState): ModuleState => {
  return {
    ...moduleState,
    groups: [],
    // dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
  };
};

const pageChanged = (moduleState: ModuleState, action: ActionProps) => {
  const { page } = action.payload;
  const gp = { ...moduleState.gridParams, curpage: page };
  return {
    ...moduleState,
    gridParams: gp,
    dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
  };
};

const pageSizeChanged = (moduleState: ModuleState, action: ActionProps) => {
  // pagesize 改变后，最好还是能显示尽量多的当前页的数据
  const { limit } = action.payload;
  const { gridParams } = moduleState;
  const { start: oldstart } = gridParams;
  // 在改变了每页显示之后，最接近原来页面的数据的页面0-19，20-39，。。。。。
  const page = Math.floor(oldstart / limit) + 1;
  const gp = { ...moduleState.gridParams, curpage: page, limit };
  return {
    ...moduleState,
    gridParams: gp,
    dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
  };
};

const formStateChanged = (moduleState: ModuleState, action: ActionProps) => {
  const { formState } = action.payload;
  // 如果是visible那么把把字段的对象换掉，可以强制form更新字段
  if (formState.visible) {
    formState.currRecord = { ...formState.currRecord };
  }
  return {
    ...moduleState,
    formState,
  };
};

const selectedRowKeysChanged = (moduleState: ModuleState, action: ActionProps): ModuleState => {
  const { selectedRowKeys } = action.payload;
  const { moduleName, dataSource } = moduleState;
  const { primarykey, namefield } = getModuleInfo(moduleName);
  // 把不在 selectedRowKeys 中的记录删除
  const selectedTextValue: TextValue[] = moduleState.selectedTextValue.filter((value) =>
    selectedRowKeys.find((key: any) => key === value.value),
  );
  // 不在selectedTextValue中的键
  const outKeys: any[] = selectedRowKeys.filter(
    (key: any) => selectedTextValue.find((value: TextValue) => value.value === key) === undefined,
  );
  selectedTextValue.push(
    ...outKeys.map((key: string): TextValue => {
      const rec = dataSource.find((record: any) => record[primarykey] === key) || {};
      return {
        text: rec[namefield],
        value: key,
      };
    }),
  );
  return {
    ...moduleState,
    selectedRowKeys,
    selectedTextValue,
  };
};

export const DetailModelContext = createContext<ModuleStateContext>({
  moduleState: undefined,
  dispatch: undefined,
});

export const moduleStateReducer = (moduleState: ModuleState, action: ActionProps): ModuleState => {
  const type = action.type.split('/')[action.type.split('/').length - 1];
  // message.warn("action.type ----" + type);
  switch (type) {
    case 'init':
      return {
        ...action.payload.initState,
        dataSourceLoadCount: new Date().getTime(), // dataSourceLoadCount变化会重新读取第一页数据
      };
    case 'loadingStart':
      return { ...moduleState, fetchLoading: true };
    case 'loadingFinished':
      return { ...moduleState, fetchLoading: false };
    case 'updateDataList':
      return updateDateList(moduleState, action);
    case 'updateDataSource':
      return update(moduleState, {
        dataSource: {
          $set: action.payload.dataSource,
        },
        recordOrderChanged: {
          $set: action.payload.recordOrderChanged === true,
        },
      });
    case 'fetchData':
      return fetchData(moduleState);
    case 'selectedRowKeysChanged':
      return selectedRowKeysChanged(moduleState, action);
    case 'formStateChanged':
      return formStateChanged(moduleState, action);
    case 'pageSizeChanged':
      return pageSizeChanged(moduleState, action);
    case 'pageChanged':
      return pageChanged(moduleState, action);
    case 'columnSortChanged':
      return columnSortChanged(moduleState, action);
    case 'sortMultipleChanged':
      return sortMultipleChanged(moduleState, action);
    case 'resetSorts':
      return resetSorts(moduleState);
    case 'groupChanged':
      return groupChanged(moduleState, action);
    case 'resetGroups':
      return resetGroups(moduleState);
    case 'insertRecord':
      return insertRecord(moduleState, action);
    case 'updateRecord':
      return updateRecord(moduleState, action);
    case 'resetSelectedRow':
      return resetSelectedRow(moduleState);
    case 'refreshRecord':
      return refreshRecord(moduleState, action);
    case 'expandChanged':
      return expandChanged(moduleState, action);
    case 'gridSchemeChanged':
      return { ...moduleState, currentGridschemeid: action.payload.gridschemeid };
    case 'gridExportSettingChanged':
      return { ...moduleState, gridExportSetting: action.payload.gridExportSetting };
    case 'monetaryChanged': {
      const { position, monetaryType } = action.payload;
      const result = { ...moduleState };
      if (position) {
        result.monetaryPosition = position;
        setLocalMonetaryPosition(moduleState.moduleName, position);
      }
      if (monetaryType) {
        result.monetary = getMonetary(monetaryType);
        setLocalMonetaryType(moduleState.moduleName, monetaryType);
      }
      return result;
    }
    case 'filterChanged':
      return filterChanged(moduleState, action);
    case 'gridSizeChanged':
      return {
        ...moduleState,
        currSetting: { ...moduleState.currSetting, gridSize: action.payload.size },
      };
    case 'toggleUserFilter':
      return {
        ...moduleState,
        currSetting: {
          ...moduleState.currSetting,
          userFilterRegionVisible: !moduleState.currSetting.userFilterRegionVisible,
        },
      };
    case 'toggleNavigate':
      return {
        ...moduleState,
        currSetting: {
          ...moduleState.currSetting,
          navigate: {
            ...moduleState.currSetting.navigate,
            visible: !moduleState.currSetting.navigate.visible,
          },
        },
      };
    case 'toggleTableWidgets':
      return {
        ...moduleState,
        currSetting: {
          ...moduleState.currSetting,
          tableWidgetsVisible: !moduleState.currSetting.tableWidgetsVisible,
        },
      };
    case 'toggleIsShowListCard':
      return update(moduleState, {
        currSetting: {
          $toggle: ['isShowListCard'],
        },
      });
    // DetailGrid没有此功能
    case 'toggleCanDragToNavigate':
      return update(moduleState, {
        currSetting: {
          $toggle: ['canDragToNavigate'],
        },
      });
    case 'toggleCanDragChangeRecno':
      return update(moduleState, {
        currSetting: {
          $toggle: ['canDragChangeRecno'],
        },
      });
    default:
      message.warn(`action.type ----${type} 未进行处理。`);
      return moduleState;
  }
};
