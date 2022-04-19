/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { AnyAction, Reducer } from 'redux';
import type { EffectsCommandMap } from 'dva';
import { apply, setLocalMonetaryPosition, setLocalMonetaryType } from '@/utils/utils';
import { queryModuleInfo, fetchObjectRecord, fetchObjectDataWithState } from './service';
import { getGridColumnSorts } from './grid/sortUtils';
import { getGridColumnFilters, getColumnFiltersInfo } from './grid/filterUtils';
import type {
  ModuleState,
  TextValue,
  ModuleModal,
  ModuleFilters,
  FetchObjectResponse,
  SortModal,
  GroupModal,
} from './data';
import {
  setModuleInfo,
  generateModuleInfo,
  hasModuleInfo,
  getModuleInfo,
  getDefaultModuleState,
} from './modules';
import { getMonetary } from './grid/monetary';
import { updateTreeRecord, addRecordToTree, getAllTreeRecord } from './moduleUtils';
import { RECNOUNDERLINE } from './constants';

export type Effect = (
  action: AnyAction,
  effects: EffectsCommandMap & { select: <T>(func: (state: ModalState) => T) => T },
) => void;

export type ModalState = Record<string, ModuleState>;

export interface ModuleModelType {
  namespace: string;
  state: ModalState;
  effects: {
    fetchModuleInfo: Effect;
    fetchData: Effect;
    refreshRecord: Effect;
    filterChanged: Effect; // 各种筛选条件改变后都执行此函数，在改变条件过后，获取数据，然后更新，少掉中间一个步骤
  };
  reducers: {
    updateModuleState: Reducer<ModalState>;
    updateDataList: Reducer<ModalState>;
    updateDataSource: Reducer<ModalState>;
    updateRecord: Reducer<ModalState>;
    insertRecord: Reducer<ModalState>;
    formStateChanged: Reducer<ModalState>;

    pageChanged: Reducer<ModalState>;
    pageSizeChanged: Reducer<ModalState>;
    parentFilterChanged: Reducer<ModalState>;

    sortMultipleChanged: Reducer<ModalState>;
    columnSortChanged: Reducer<ModalState>;
    sortSchemeChanged: Reducer<ModalState>;
    resetSorts: Reducer<ModalState>;
    groupChanged: Reducer<ModalState>;
    resetGroups: Reducer<ModalState>;

    toggleUserFilter: Reducer<ModalState>;
    toggleUserFilterRestHidden: Reducer<ModalState>;
    toggleNavigate: Reducer<ModalState>;
    toggleTableWidgets: Reducer<ModalState>;
    toggleIsShowListCard: Reducer<ModalState>;
    removeAttachment: Reducer<ModalState>;

    selectedRowKeysChanged: Reducer<ModalState>;
    resetSelectedRow: Reducer<ModalState>;
    expandChanged: Reducer<ModalState>;
    treeExpandAll: Reducer<ModalState>;
    treeCollapseAll: Reducer<ModalState>;
    pinkeyChanged: Reducer<ModalState>;

    gridSchemeChanged: Reducer<ModalState>;
    gridExportSettingChanged: Reducer<ModalState>;
    monetaryChanged: Reducer<ModalState>;
    gridSizeChanged: Reducer<ModalState>;

    toggleCanDragToNavigate: Reducer<ModalState>;
    toggleCanDragToLeafNode: Reducer<ModalState>;
    toggleCanDragChangeRecno: Reducer<ModalState>;

    setTabParentFilters: Reducer<ModalState>;
  };
}

const loadedModules: Record<string, any> = {};

const Model: ModuleModelType = {
  namespace: 'modules',
  state: {},
  effects: {
    // 创建模块的 moduleState,每个模块只执行一次。
    *fetchModuleInfo({ payload }, param) {
      const { moduleName, parentFilter } = payload;
      // console.log('fetchModuleInfo ', moduleName);
      const { put, call } = param;
      if (!hasModuleInfo(moduleName)) {
        const response = yield call(queryModuleInfo, payload);
        setModuleInfo(moduleName, generateModuleInfo(response));
      }
      loadedModules[moduleName] = { dataSourceLoadCount: 0 };
      const moduleState: ModuleState = getDefaultModuleState({ moduleName, parentFilter });
      yield put({
        type: 'updateModuleState',
        payload: {
          moduleState,
        },
      });
    },

    *refreshRecord({ payload }, { call, put }) {
      // console.log('refresh Record ', payload);
      const { moduleName } = payload;
      const response = yield call(fetchObjectRecord, {
        objectname: moduleName,
        id: payload.recordId,
      });
      const record = response.data;
      yield put({
        type: 'updateRecord',
        payload: { moduleName, record },
      });
    },

    *filterChanged({ payload }, { call, put, select }) {
      // console.log('filterChanged', payload);
      const { type, moduleName } = payload;
      const moduleState: ModuleState = yield select(
        (state) => state.modules[moduleName],
      ) as ModuleState;
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
        case 'sqlparamChange':
          filters.sqlparam = { ...payload.sqlparam };
          break;
        case 'resetSqlparam':
          filters.sqlparam = { ...filters.sqlparam };
          Object.keys(filters.sqlparam).forEach((key) => {
            filters.sqlparam[key].value = null;
          });
          break;
        default:
      }
      const newModuleState: ModuleState = {
        ...moduleState,
        filters,
      };
      const response: FetchObjectResponse = yield call(fetchObjectDataWithState, newModuleState);
      const { curpage, limit, start, total, totalpage, data: dataSource, remoteRoot } = response;
      apply(newModuleState, {
        selectedRowKeys: [],
        selectedTextValue: [],
        gridParams: { curpage, limit, start, total, totalpage },
        dataSource,
        remoteRoot: remoteRoot || {},
        recordOrderChanged: false,
      });
      yield put({
        type: 'updateModuleState',
        payload: { moduleState: newModuleState },
      });
      return response;
    },

    *fetchData({ payload }, { call, put, select }) {
      // console.log('prepared fetchData......', payload);
      const { moduleName } = payload;
      const moduleState = yield select((state) => state.modules[moduleName]) as ModuleState;
      if (!moduleState) return null;
      if (
        !payload.forceUpdate &&
        loadedModules[moduleName].dataSourceLoadCount === moduleState.dataSourceLoadCount
      )
        return null;
      loadedModules[moduleName].dataSourceLoadCount = moduleState.dataSourceLoadCount;
      // console.log(`fetchData...dataSourceLoadCount---${moduleState.dataSourceLoadCount}`);
      const response = yield call(fetchObjectDataWithState, moduleState);
      yield put({
        type: 'updateDataList',
        payload: { ...response, moduleName },
      });
      return response;
    },
  },
  reducers: {
    removeAttachment(state = {}, action) {
      const { moduleName, moduleRecordId: recordId, attachmentId } = action.payload;
      const { primarykey } = getModuleInfo(moduleName);
      const moduleState = state[moduleName];
      const dataSource = moduleState.dataSource.map((rec) => {
        if (rec[primarykey] === recordId) {
          const updatedRecord = { ...rec };
          updatedRecord.attachmentdata = updatedRecord.attachmentdata.filter(
            (record: any) => record.id !== attachmentId,
          );
          updatedRecord.attachmentcount = updatedRecord.attachmentdata.length;
          return updatedRecord;
        }
        return rec;
      });
      const result = {
        ...state,
      };
      result[moduleName] = { ...moduleState, dataSource };
      return result;
    },

    pageChanged(state = {}, action) {
      // console.log('page changed', action)
      const { moduleName } = action.payload;
      const result = {
        ...state,
      };
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const { page } = action.payload;
      const gp = { ...moduleState.gridParams, curpage: page };
      result[moduleName] = {
        ...moduleState,
        gridParams: gp,
        dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
      };
      return result;
    },

    pageSizeChanged(state = {}, action) {
      // console.log('pagesize changed', action)
      // pagesize 改变后，最好还是能显示尽量多的当前页的数据
      const { moduleName, limit } = action.payload;
      const result = {
        ...state,
      };
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const { gridParams } = moduleState;
      const { start: oldstart } = gridParams;
      // 在改变了每页显示之后，最接近原来页面的数据的页面0-19，20-39，。。。。。
      const page = Math.floor(oldstart / limit) + 1;
      const gp = { ...moduleState.gridParams, curpage: page, limit };
      result[moduleName] = {
        ...moduleState,
        gridParams: gp,
        dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
      };
      return result;
    },

    parentFilterChanged(state = {}, action) {
      // console.log('parentFilterChanged changed', action)
      const { moduleName, parentFilter: parentfilter } = action.payload;
      const result = {
        ...state,
      };
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const filters: ModuleFilters = {
        ...moduleState.filters,
        parentfilter,
        // 如果父模块限定条件改变了，那么其他所有的筛选都清除
        navigate: [],
        viewscheme: { title: undefined, viewschemeid: undefined },
        searchfilter: '', // 查询框中的文字
        columnfilter: [], // 当前生效的列筛选条件
        userfilter: [], // 用户自定义的筛选条件
      };
      result[moduleName] = {
        ...moduleState,
        filters,
        dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
      };
      return result;
    },

    // 单字段和多字段排序的转换 sortMultiple:{} and sortMultiple : {multiple : 1}
    sortMultipleChanged(state = {}, action) {
      // console.log('sortMultipleChanged', action)
      const { moduleName, sortMultiple } = action.payload;
      const result = {
        ...state,
      };
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const { sorts } = moduleState;
      if (!sortMultiple.multiple && sorts.length > 1) {
        //  取消多字段排序，如果有多个字段，只保留第一个
        result[moduleName] = {
          ...moduleState,
          sortMultiple,
          sorts: [sorts[0]],
        };
      } else
        result[moduleName] = {
          ...moduleState,
          sortMultiple,
        };
      return result;
    },

    // 用户点击grid column 进行排序
    columnSortChanged(state = {}, action) {
      // console.log('column sort Changed', action)
      const { moduleName, columnsorter } = action.payload;
      const result = {
        ...state,
      };
      const sorts: SortModal[] = getGridColumnSorts(columnsorter);
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      result[moduleName] = {
        ...moduleState,
        sorts,
        sortschemeid: null,
        dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
      };
      return result;
    },
    // 选择了排序方案
    sortSchemeChanged(state = {}, action) {
      // console.log('column sort Changed', action)
      const { moduleName, sortschemeid } = action.payload;
      const result = {
        ...state,
      };
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      result[moduleName] = {
        ...moduleState,
        sorts: [],
        sortschemeid,
        dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
      };
      return result;
    },
    // 恢复到默认排序
    resetSorts(state = {}, action) {
      // console.log('reset sort to default', action)
      const { moduleName } = action.payload;
      const result = {
        ...state,
      };
      const sorts: SortModal[] = [];
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      result[moduleName] = {
        ...moduleState,
        sorts,
        sortschemeid: null,
        dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
      };
      return result;
    },

    groupChanged(state = {}, action) {
      const { moduleName, property, title } = action.payload;
      const result = {
        ...state,
      };
      const groups: GroupModal[] = [
        {
          property,
          title,
        },
      ];
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      result[moduleName] = {
        ...moduleState,
        groups,
        // dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
      };
      return result;
    },

    resetGroups(state = {}, action) {
      const { moduleName } = action.payload;
      const result = {
        ...state,
      };
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      result[moduleName] = {
        ...moduleState,
        groups: [],
        // dataSourceLoadCount: moduleState.dataSourceLoadCount + 1,
      };
      return result;
    },

    insertRecord(state = {}, action) {
      const { moduleName, record } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const moduleInfo: ModuleModal = getModuleInfo(moduleName);
      const gridParams = { ...moduleState.gridParams };
      const result = {
        ...state,
      };
      let dataSource;
      if (moduleInfo.istreemodel) {
        dataSource = addRecordToTree(
          moduleState.dataSource,
          record,
          moduleInfo.primarykey,
          moduleInfo.codelevel || '',
        );
      } else {
        record[RECNOUNDERLINE] = '+';
        // 如果超过当前页的显示记录数，则不会显示出来了
        dataSource = [...moduleState.dataSource, record]
          .reverse()
          .filter((_, index) => index < gridParams.limit)
          .reverse();
      }
      const currSetting = { ...moduleState.currSetting };
      gridParams.total += 1;
      if (gridParams.curpage === 0) gridParams.curpage = 1;
      if (gridParams.totalpage === 0) gridParams.totalpage = 1;
      const key = record[moduleInfo.primarykey];
      result[moduleName] = {
        ...moduleState,
        dataSource,
        gridParams,
        currSetting,
        lastInsertRecord: record,
        selectedRowKeys: [key], // 新建记录后，选中该条记录，不然找不到新建的在哪
        selectedTextValue: [{ text: record[moduleInfo.namefield], value: key }],
      };
      return result;
    },

    updateRecord(state = {}, action) {
      const { moduleName, record } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const { primarykey, istreemodel } = getModuleInfo(moduleName);
      const result = {
        ...state,
      };
      let dataSource: any;
      if (istreemodel) {
        dataSource = updateTreeRecord(moduleState.dataSource, record, primarykey);
      } else {
        dataSource = moduleState.dataSource.map((rec: any) => {
          if (rec[primarykey] === record[primarykey]) {
            record[RECNOUNDERLINE] = rec[RECNOUNDERLINE];
            return record;
          }
          return rec;
        });
      }
      let { formState } = moduleState;
      if (moduleState.formState.visible) {
        if (moduleState.formState.currRecord[primarykey] === record[primarykey]) {
          formState = { ...formState, currRecord: { ...record } };
        }
      }
      result[moduleName] = { ...moduleState, dataSource, formState };
      return result;
    },

    formStateChanged(state = {}, action) {
      // console.log('formStateChanged', action)
      const { moduleName, formState } = action.payload;
      // 如果是visible那么把把字段的对象换掉，可以强制form更新字段
      if (formState.visible) {
        formState.currRecord = { ...formState.currRecord };
      }
      const result = {
        ...state,
      };
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      result[moduleName] = {
        ...moduleState,
        formState,
      };
      return result;
    },

    updateModuleState(state = {}, action) {
      // console.log('updateModuleState', action)
      const { moduleState } = action.payload;
      const { moduleName, gridParams } = moduleState;
      const { limit } = gridParams;
      if (limit) {
        // 如果limit有值，说明正确返回了数据，否则就说明出错了，那么就不改变state
        const result = {
          ...state,
        };
        result[moduleName] = { ...moduleState };
        return result;
      }
      return state;
    },

    updateDataList(state = {}, action) {
      const { moduleName, data: dataSource = [] } = action.payload;
      const moduleInfo: ModuleModal = getModuleInfo(moduleName);
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = {
        ...state,
      };
      const { curpage, limit, start, total, totalpage, expandedRowKeys, remoteRoot } =
        action.payload;

      // 把不是当页的选中的记录全部清除掉。默认刷新过后，不保留非当前页的选中记录
      // 树形结构的只保留根结点的选中状态
      const allRecord = moduleInfo.istreemodel ? getAllTreeRecord(dataSource) : dataSource;
      const selectedRowKeys = moduleState.selectedRowKeys.filter(
        (key: any) =>
          allRecord.find((record: any) => record[moduleInfo.primarykey] === key) !== undefined,
      );
      /// /
      const currSetting = { ...moduleState.currSetting };
      // 记录很少，并且没有选中导航，就把导航隐藏
      // if (total <= limit && moduleState.filters.navigate.length === 0)
      //   currSetting.navigate.visible = false;
      result[moduleName] = {
        ...moduleState,
        gridParams: { curpage, limit, start, total, totalpage },
        dataSource,
        remoteRoot: remoteRoot || {},
        selectedRowKeys,
        // eslint-disable-next-line
        expandedRowKeys: moduleInfo.istreemodel
          ? moduleState.expandedRowKeys.length
            ? moduleState.expandedRowKeys
            : expandedRowKeys
          : moduleState.expandedRowKeys,
        selectedTextValue: selectedRowKeys.map((key: string): TextValue => {
          const rec = allRecord.find((record: any) => record[moduleInfo.primarykey] === key) || {};
          return {
            text: rec[moduleInfo.namefield],
            value: key,
          };
        }),
        currSetting,
        recordOrderChanged: false,
      };
      return result;
    },

    updateDataSource(state = {}, action) {
      const { moduleName, dataSource = [], recordOrderChanged } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = {
        ...state,
      };
      result[moduleName] = {
        ...moduleState,
        dataSource,
        recordOrderChanged: recordOrderChanged === true,
      };
      return result;
    },

    toggleUserFilter(state = {}, action) {
      // console.log('toggleUserFilter visible.....')
      const { moduleName } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      const newCurrSetting = {
        ...moduleState.currSetting,
        userFilterRegionVisible: !moduleState.currSetting.userFilterRegionVisible,
      };
      result[moduleName] = {
        ...moduleState,
        currSetting: newCurrSetting,
      };
      return result;
    },

    toggleTableWidgets(state = {}, action) {
      // console.log('toggleTableWidgets visible.....')
      const { moduleName } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      const newCurrSetting = {
        ...moduleState.currSetting,
        tableWidgetsVisible: !moduleState.currSetting.tableWidgetsVisible,
      };
      result[moduleName] = {
        ...moduleState,
        currSetting: newCurrSetting,
      };
      return result;
    },

    toggleIsShowListCard(state = {}, action) {
      // console.log('toggleTableWidgets visible.....')
      const { moduleName } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      const newCurrSetting = {
        ...moduleState.currSetting,
        isShowListCard: !moduleState.currSetting.isShowListCard,
      };
      result[moduleName] = {
        ...moduleState,
        currSetting: newCurrSetting,
      };
      return result;
    },

    toggleUserFilterRestHidden(state = {}, action) {
      // console.log('toggleUserFilterRestHidden visible.....')
      const { moduleName } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      const newCurrSetting = {
        ...moduleState.currSetting,
        userFilterRestHidden: !moduleState.currSetting.userFilterRestHidden,
      };
      result[moduleName] = {
        ...moduleState,
        currSetting: newCurrSetting,
      };
      return result;
    },

    toggleNavigate(state = {}, action) {
      const { moduleName } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      const newNavigate = { ...moduleState.currSetting.navigate };
      const { toggle } = action.payload;
      if (toggle === 'visible') newNavigate.visible = !newNavigate.visible;
      const newCurrSetting = { ...moduleState.currSetting, navigate: newNavigate };
      result[moduleName] = {
        ...moduleState,
        currSetting: newCurrSetting,
      };
      return result;
    },

    selectedRowKeysChanged(state = {}, action) {
      // antd 修改过了选中方式，每次刷新过后，原来的选中全部取消了
      const { moduleName, selectedRowKeys, forceUpdate } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const moduleInfo: ModuleModal = getModuleInfo(moduleName);
      const result = { ...state };
      // 把不在 selectedRowKeys 中的记录删除
      const selectedTextValue: TextValue[] = moduleState.selectedTextValue.filter((value) =>
        selectedRowKeys.find((key: any) => key === value.value),
      );
      // 不在selectedTextValue中的键
      const outKeys: any[] = selectedRowKeys.filter(
        (key: any) =>
          selectedTextValue.find((value: TextValue) => value.value === key) === undefined,
      );
      const allRecord = moduleInfo.istreemodel
        ? getAllTreeRecord(moduleState.dataSource)
        : moduleState.dataSource;
      selectedTextValue.push(
        ...outKeys.map((key: string): TextValue => {
          const rec = allRecord.find((record: any) => record[moduleInfo.primarykey] === key) || {};
          return {
            text: rec[moduleInfo.namefield],
            value: key,
          };
        }),
      );
      result[moduleName] = {
        ...moduleState,
        selectedRowKeys,
        selectedTextValue,
        dataSourceLoadCount: moduleState.dataSourceLoadCount + (forceUpdate ? 1 : 0),
      };
      return result;
    },
    resetSelectedRow(state = {}, action) {
      const { moduleName } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      result[moduleName] = {
        ...moduleState,
        selectedRowKeys: [],
        selectedTextValue: [],
      };
      return result;
    },

    expandChanged(state = {}, action) {
      const { moduleName, expanded, key, title, selected } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const { expandedRowKeys } = moduleState;
      const result = { ...state };
      if (selected) {
        // 展开即选中，不是树都这样操作，只能展开一个
        result[moduleName] = {
          ...moduleState,
          expandedRowKeys: expanded ? [key] : [],
          selectedRowKeys: [key],
          selectedTextValue: [{ text: title, value: key }],
        };
      } else
        result[moduleName] = {
          // 树状的可以展开多个
          ...moduleState,
          expandedRowKeys: expanded
            ? [...expandedRowKeys, key]
            : expandedRowKeys.filter((value: string) => value !== key),
        };
      return result;
    },

    treeExpandAll(state = {}, action) {
      const { moduleName } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      const { primarykey } = getModuleInfo(moduleName);
      // 返回所有的非叶节点的rowid数组
      const getAllhasChildrenRowids = (datasource: any[]): string[] => {
        const results: string[] = [];
        const getRowids = (recs: any[]) => {
          recs.forEach((rec) => {
            if (rec.children) {
              results.push(rec[primarykey]);
              getRowids(rec.children);
            }
          });
        };
        getRowids(datasource);
        return results;
      };
      result[moduleName] = {
        ...moduleState,
        expandedRowKeys: getAllhasChildrenRowids(moduleState.dataSource),
      };
      return result;
    },

    treeCollapseAll(state = {}, action) {
      const { moduleName } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      result[moduleName] = {
        ...moduleState,
        expandedRowKeys: [],
      };
      return result;
    },

    pinkeyChanged(state = {}, action) {
      const { moduleName, pinkey } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      let { expandedRowKeys } = moduleState;
      // pinkey 加到第一个展开项的数组中
      if (pinkey) {
        expandedRowKeys = expandedRowKeys.filter((key) => key !== pinkey);
        expandedRowKeys.splice(0, 0, pinkey);
      }
      result[moduleName] = {
        ...moduleState,
        expandedRowKeys,
        pinkey,
      };
      return result;
    },

    gridSchemeChanged(state = {}, action) {
      const { moduleName } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      result[moduleName] = { ...moduleState, currentGridschemeid: action.payload.gridschemeid };
      return result;
    },

    gridExportSettingChanged(state = {}, action) {
      const { moduleName, gridExportSetting } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      result[moduleName] = { ...moduleState, gridExportSetting };
      return result;
    },

    monetaryChanged(state = {}, action) {
      const { position, monetaryType, moduleName } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      if (position) {
        result[moduleName] = { ...moduleState, monetaryPosition: position };
        setLocalMonetaryPosition(moduleState.moduleName, position);
      }
      if (monetaryType) {
        result[moduleName] = { ...moduleState, monetary: getMonetary(monetaryType) };
        setLocalMonetaryType(moduleState.moduleName, monetaryType);
      }
      return result;
    },

    gridSizeChanged(state = {}, action) {
      const { moduleName, size: gridSize } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      result[moduleName] = {
        ...moduleState,
        currSetting: { ...moduleState.currSetting, gridSize },
      };
      return result;
    },

    toggleCanDragToNavigate(state = {}, action) {
      const { moduleName } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      result[moduleName] = {
        ...moduleState,
        currSetting: {
          ...moduleState.currSetting,
          canDragToNavigate: !moduleState.currSetting.canDragToNavigate,
          canDragChangeRecno: !moduleState.currSetting.canDragToNavigate
            ? false
            : moduleState.currSetting.canDragChangeRecno,
          navigate: {
            visible: !moduleState.currSetting.canDragToNavigate
              ? true
              : moduleState.currSetting.navigate.visible,
          },
        },
      };
      return result;
    },

    toggleCanDragToLeafNode(state = {}, action) {
      const { moduleName } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      result[moduleName] = {
        ...moduleState,
        currSetting: {
          ...moduleState.currSetting,
          canDragToLeafNode: !moduleState.currSetting.canDragToLeafNode,
          // 可以拖动到叶节点下时，要置可拖动为true
          canDragChangeRecno:
            !moduleState.currSetting.canDragToLeafNode ||
            moduleState.currSetting.canDragChangeRecno,
        },
      };
      return result;
    },

    toggleCanDragChangeRecno(state = {}, action) {
      const { moduleName } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      result[moduleName] = {
        ...moduleState,
        currSetting: {
          ...moduleState.currSetting,
          canDragChangeRecno: !moduleState.currSetting.canDragChangeRecno,
          canDragToNavigate: !moduleState.currSetting.canDragChangeRecno
            ? false
            : moduleState.currSetting.canDragToNavigate,
        },
      };
      return result;
    },

    setTabParentFilters(state = {}, action) {
      const { moduleName, tabParentFilters } = action.payload;
      const moduleState: ModuleState = state[moduleName] as ModuleState;
      const result = { ...state };
      result[moduleName] = {
        ...moduleState,
        tabParentFilters,
      };
      return result;
    },
  },
};

export default Model;
