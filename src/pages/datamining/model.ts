/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import update from 'immutability-helper';
import { getMonetary } from '../module/grid/monetary';
import type { ActionProps, DataminingModal, FieldModal } from './data';
import { getInitDataminingState, getTreeRecordByKey, sortTree } from './utils';
// https://github.com/kolodny/immutability-helper
import {
  ACT_NAVIGATE_ADD_GROUP,
  ACT_NAVIGATE_FETCH_DATA,
  ACT_NAVIGATE_EXPAND,
  ACT_NAVIGATE_ACTIVETAB_CHANGE,
  ACT_NAVIGATE_SELECTED,
  ACT_NAVIGATE_REMOVE_GROUP,
  ROOTROWID,
  ACT_NAVIGATE_CHECKED,
  ACT_NAVIGATE_AFTER_CHANGE,
  ACT_NAVIGATE_ROW_EXPAND,
  ACT_FETCH_LOADING_CHANGED,
  ACT_MONETARY_CHANGED,
  ACT_TOGGLE_GROUP_REGION,
  ACT_TOGGLE_FILTER_REGION,
  ACT_TOGGLE_NAVIGATE_REGION,
  ACT_SELECTED_ROWKEYS_CHANGED,
  ACT_DATAMINING_EXPAND_CHANGED,
  ACT_CLEAR_ALL_ROWEXPAND,
  ACT_CLEAR_ALL_COLUMN_EXPAND,
  ACT_DELETE_ROWGROUP_FROM_INDEX,
  ACT_FILTER_DATASOURCE_UPDATE,
  ACT_UPDATE_DATAMINING_SCHEMEINFO,
  ACT_DATAMINING_FETCHDATA,
  ACT_DATAMINING_FETCH_SCHEMES,
  ACT_DATAMINING_CHANGE_SCHEME,
  ACT_FIELD_GROUP_UPDATE,
  ACT_COLUMN_GROUP_UPDATE,
  ACT_COLUMN_GROUP_REST_VISIBLE_TOGGLE,
  ACT_COLUMN_GROUP_EDIT_TEXT,
  ROWID,
  TEXT,
  ACT_COLUMN_GROUP_REMOVE,
  ACT_COLUMN_GROUP_VISIBLE_TOGGLE,
  ACT_COLUMN_GROUP_SELECTED_TOGGLE,
  SELECTED,
  ACT_COLUMN_GROPU_DESELECTEDALL,
  ACT_COLUMN_GROUP_COMBINE_SELECTED,
  ACT_FIELD_GROUP_REMOVE,
  ACT_FIELD_GROUP_HIDDEN_IN_TOGGLE,
  ACT_FIELD_GROUP_FIXED_LEFT_TOGGLE,
  ACT_FIELD_GROUP_ADD,
  ACT_SORT_CHANGE,
  ACT_ADD_SCHEME,
  ACT_DELETE_SCHEME,
  ACT_SETTING_CHANGE,
  ACT_DATAMINING_EXPORT_SETTING_CHANGE,
  ACT_SQLPARAM_CHANGE,
} from './constants';
import type { DataminingNavigateModal } from './navigate/data';
import { getNaviagtesCondition } from './navigate/navigateUtils';
import { getFilterDataSource } from './condition/conditionUtils';
import { fetchDataminingSchemes } from './schemeUtils';
import {
  clearColumnGroupAllSelected,
  combineSelectedColumns,
  removeRowidsFromTree,
} from './resultTree/columnUtils';

// 存放每一个数据方案的数据，在下次再进入的时候，可以用这些值。
const dataminingModalCache: Record<string, DataminingModal> = {};
export const getDataminingModal = (moduleName: string, defaultSchemeid?: string) => {
  // 每一个schemeid 都有一个实例，所有的模块的不设置defaultSchemeid的，共用同一个实例
  const schemeid = defaultSchemeid || '';
  if (dataminingModalCache[moduleName + schemeid])
    return {
      ...dataminingModalCache[moduleName + schemeid],
      fromCache: true,
    };
  return getInitDataminingState(moduleName, defaultSchemeid);
};
const setDataminingModal = (state: DataminingModal) => {
  const schemeid = state.defaultSchemeid || '';
  dataminingModalCache[state.moduleName + schemeid] = state;
};
export const DataminingReducer = (state: DataminingModal, action: ActionProps): DataminingModal => {
  const { type, payload } = action;
  let newState: DataminingModal = state;
  let rec: any = null;
  // console.log(action);
  switch (type) {
    // 数据分析方案设置改变
    case ACT_SETTING_CHANGE:
      newState = update(state, {
        schemeState: {
          setting: {
            $apply: (setting) => ({ ...setting, ...payload }),
          },
        },
      });
      break;
    // 数据分析方案导出设置改变
    case ACT_DATAMINING_EXPORT_SETTING_CHANGE:
      newState = update(state, {
        exportSetting: {
          $set: payload.exportSetting,
        },
      });
      break;
    // 方案操作
    // 新增数据分析方案
    case ACT_ADD_SCHEME:
      newState = update(state, {
        schemes: {
          $push: [payload.scheme],
        },
        currentScheme: {
          $set: payload.scheme,
        },
      });
      break;

    // 删除数据分析方案
    case ACT_DELETE_SCHEME: {
      const newSchemes = state.schemes.filter((scheme) => scheme.schemeid !== payload.schemeid);
      newState = update(state, {
        schemes: {
          $set: newSchemes,
        },
        currentScheme: {
          $set: newSchemes.length
            ? newSchemes[0]
            : {
                schemeid: '',
                text: '',
                title: '',
                savepath: true,
              },
        },
      });
      break;
    }
    // 表头操作
    // 总计的聚合字段固定显示在最左边的转换
    case ACT_FIELD_GROUP_FIXED_LEFT_TOGGLE:
      newState = update(state, {
        currSetting: {
          $toggle: ['fieldGroupFixedLeft'],
        },
      });
      break;
    case ACT_FIELD_GROUP_ADD:
      newState = update(state, {
        schemeState: {
          fieldGroup: {
            $push: [payload.field],
          },
        },
        refreshAllCount: {
          $apply: (c) => c + 1,
        },
      });
      break;
    case ACT_FIELD_GROUP_REMOVE: {
      const fieldGroup: FieldModal[] = state.schemeState.fieldGroup.filter(
        (field) => field[ROWID] !== payload[ROWID],
      );
      // 删除过后，如果剩余的都隐藏了，则把第一个显示出来
      if (!fieldGroup.find((field) => !field.hiddenInColumnGroup))
        delete fieldGroup[0].hiddenInColumnGroup;
      newState = update(state, {
        schemeState: {
          fieldGroup: {
            $set: fieldGroup,
          },
        },
      });
      break;
    }
    // 聚合字段在分组中是否显示的转换
    case ACT_FIELD_GROUP_HIDDEN_IN_TOGGLE: {
      const field = state.schemeState.fieldGroup.find((f) => f[ROWID] === payload[ROWID]);
      if (field) field.hiddenInColumnGroup = !field.hiddenInColumnGroup;
      newState = update(state, {
        schemeState: {
          fieldGroup: {
            $apply: (array: FieldModal[]) => [...array],
          },
        },
      });
      break;
    }
    case ACT_FIELD_GROUP_UPDATE:
      newState = update(state, {
        schemeState: {
          fieldGroup: {
            $set: payload.fieldGroup,
          },
        },
      });
      break;
    case ACT_COLUMN_GROUP_UPDATE:
      newState = update(state, {
        schemeState: {
          columnGroup: {
            $set: [...payload.columnGroup],
          },
        },
        refreshAllCount: {
          $apply: (c) => c + (payload.refreshAllCount ? 1 : 0),
        },
      });
      break;
    // 当前表头的所有后续节点显示和隐藏的转换
    case ACT_COLUMN_GROUP_REST_VISIBLE_TOGGLE: {
      const rowid = payload[ROWID];
      const column = getTreeRecordByKey(state.schemeState.columnGroup, rowid, ROWID);
      column.hideRest = !column.hideRest;
      newState = update(state, {
        schemeState: {
          columnGroup: {
            $set: [...state.schemeState.columnGroup],
          },
        },
      });
      break;
    }
    // 修改表头项目文字说明,不包括聚合字段 payload:{rowid,text}
    case ACT_COLUMN_GROUP_EDIT_TEXT: {
      const col = getTreeRecordByKey(state.schemeState.columnGroup, payload.rowid, ROWID);
      if (col) {
        col[TEXT] = payload.text;
        newState = update(state, {
          schemeState: {
            columnGroup: {
              $set: [...state.schemeState.columnGroup],
            },
          },
        });
      }
      break;
    }
    // 删除当前列或选中列（保留子节点） payload:{rowids:[]}
    case ACT_COLUMN_GROUP_REMOVE:
      newState = update(state, {
        schemeState: {
          columnGroup: {
            $set: [
              ...removeRowidsFromTree(
                state.schemeState.columnGroup,
                payload.rowids,
                payload.keepChildren,
              ),
            ],
          },
        },
      });
      break;
    // 转换显隐方式或隐藏列 payload : {rowids , type:'toggle','hidden'}
    case ACT_COLUMN_GROUP_VISIBLE_TOGGLE:
      payload.rowids.forEach((key: any) => {
        rec = getTreeRecordByKey(state.schemeState.columnGroup, key, ROWID);
        if (rec) rec.hidden = payload.type === 'hidden' ? true : !rec.hidden;
        // 隐藏了就不要选中了
        if (rec.hidden) rec[SELECTED] = false;
      });
      newState = update(state, {
        schemeState: {
          columnGroup: {
            $set: [...state.schemeState.columnGroup],
          },
        },
      });
      break;
    // 选中或者取消选择当前分组
    case ACT_COLUMN_GROUP_SELECTED_TOGGLE:
      rec = getTreeRecordByKey(state.schemeState.columnGroup, payload.rowid, ROWID);
      if (rec) rec[SELECTED] = !rec[SELECTED];
      newState = update(state, {
        schemeState: {
          columnGroup: {
            $set: [...state.schemeState.columnGroup],
          },
        },
      });
      break;
    // 取消所有选中的表头分组
    case ACT_COLUMN_GROPU_DESELECTEDALL:
      newState = update(state, {
        schemeState: {
          columnGroup: {
            $set: [...clearColumnGroupAllSelected(state.schemeState.columnGroup)],
          },
        },
      });
      break;
    // 合并选中的分组（可保留子节点）
    case ACT_COLUMN_GROUP_COMBINE_SELECTED: {
      const schemeState = combineSelectedColumns(
        state.schemeState.columnGroup,
        payload.keepChildren,
      );
      if (schemeState)
        newState = update(state, {
          schemeState: {
            columnGroup: {
              $set: [...schemeState],
            },
          },
          refreshAllCount: {
            $apply: (c) => c + 1,
          },
        });
      break;
    }
    // 导航的操作
    case ACT_NAVIGATE_ADD_GROUP:
      if (
        !state.navigates.find((nav) => nav.navigateGroup.fieldid === payload.navigateGroup.fieldid)
      ) {
        newState = update(state, {
          navigates: {
            $push: [
              {
                navigateGroup: payload.navigateGroup,
                dataSource: [],
                expandedKeys: [],
                selectedKeys: [],
                checkedKeys: [],
              },
            ],
          },
        });
      }
      newState = update(newState, {
        currSetting: {
          navigate: {
            visible: {
              $set: true,
            },
            activeKey: {
              $set: payload.navigateGroup.fieldid,
            },
          },
        },
      });
      break;
    case ACT_NAVIGATE_REMOVE_GROUP:
      newState = update(state, {
        navigates: {
          $apply: (s: DataminingNavigateModal[]) =>
            s.filter((nav) => nav.navigateGroup.fieldid !== payload.fieldid),
        },
      });
      // 如果当前页被删除了，设置第一页为可见页
      if (newState.currSetting.navigate.activeKey === payload.fieldid) {
        newState = update(newState, {
          currSetting: {
            navigate: {
              activeKey: {
                $set: newState.navigates.length ? newState.navigates[0].navigateGroup.fieldid : '',
              },
            },
          },
        });
      }
      if (state.filters.navigatefilters.find((filter) => filter.groupFieldid === payload.fieldid)) {
        const navigatesCondition = getNaviagtesCondition(newState.navigates);
        newState = update(newState, {
          filters: {
            navigatefilters: {
              $set: navigatesCondition,
            },
          },
        });
        // 更新筛选条件grid中的数据
        newState = update(newState, {
          refreshAllCount: { $apply: (c) => c + 1 },
          refreshFilterDataSourceCount: { $apply: (c) => c + 1 },
          filterDataSource: {
            $set: getFilterDataSource(newState.filters, [...newState.filterDataSource]),
          },
        });
      }
      break;
    case ACT_NAVIGATE_ACTIVETAB_CHANGE:
      newState = update(state, {
        currSetting: {
          navigate: {
            activeKey: {
              $set: payload.activeKey,
            },
          },
        },
      });
      break;
    case ACT_NAVIGATE_FETCH_DATA:
      newState = update(state, {
        navigates: {
          $apply: (navs: DataminingNavigateModal[]) =>
            navs.map((nav: DataminingNavigateModal) => {
              if (nav.navigateGroup.fieldid !== payload.fieldid) return nav;
              return {
                ...nav,
                dataSource: payload.dataSource,
                expandedKeys: payload.expandedKeys || nav.expandedKeys,
                search: payload.search,
              };
            }),
        },
      });
      break;
    case ACT_NAVIGATE_EXPAND:
      newState = update(state, {
        navigates: {
          $apply: (navs: DataminingNavigateModal[]) =>
            navs.map((v) => {
              if (v.navigateGroup.fieldid !== payload.fieldid) return v;
              return { ...v, expandedKeys: payload.expandedKeys };
            }),
        },
      });
      break;
    case ACT_NAVIGATE_SELECTED:
      newState = update(state, {
        navigates: {
          $apply: (navs: DataminingNavigateModal[]) =>
            navs.map((v) => {
              if (v.navigateGroup.fieldid !== payload.fieldid) return v;
              return { ...v, selectedKeys: payload.selectedKeys };
            }),
        },
      });
      break;
    case ACT_NAVIGATE_CHECKED: {
      newState = update(state, {
        navigates: {
          $apply: (navs: DataminingNavigateModal[]) =>
            navs.map((v) => {
              if (v.navigateGroup.fieldid !== payload.fieldid) return v;
              return { ...v, checkedKeys: payload.checkedKeys };
            }),
        },
      });
      const navigatesCondition = getNaviagtesCondition(newState.navigates);
      newState = update(newState, {
        filters: {
          navigatefilters: {
            $set: navigatesCondition,
          },
        },
      });
      // 更新筛选条件grid中的数据
      newState = update(newState, {
        filterDataSource: {
          $set: getFilterDataSource(newState.filters, [...newState.filterDataSource]),
        },
      });
      break;
    }
    case ACT_NAVIGATE_AFTER_CHANGE:
      newState = update(state, {
        refreshAllCount: { $apply: (c) => c + 1 },
        refreshFilterDataSourceCount: { $apply: (c) => c + 1 },
      });
      break;
    case ACT_NAVIGATE_ROW_EXPAND:
      newState = update(state, {
        navigates: {
          $set: state.navigates.map((record) => {
            const { expandedKeys } = record;
            return record.navigateGroup.fieldid !== payload.navigateGroup.fieldid
              ? record
              : {
                  ...record,
                  dataSource: [...record.dataSource],
                  expandedKeys: (expandedKeys.find((key) => key === payload.key)
                    ? expandedKeys
                    : [...expandedKeys, payload.key]
                  ).concat(...payload.expandedKeys),
                };
          }),
        },
      });
      break;
    case 'modules/filterChanged':
    case 'filterChanged': {
      const changetype = payload.type;
      if (changetype === 'viewSchemeChange') {
        newState = update(state, {
          refreshAllCount: {
            $apply: (c) => c + 1,
          },
          filters: {
            viewscheme: {
              $set: payload.viewscheme,
            },
          },
        });
      }
      if (changetype === 'userDefineFilter') {
        newState = update(state, {
          refreshAllCount: {
            $apply: (c) => c + 1,
          },
          filters: {
            userfilter: {
              $set: payload.userfilter,
            },
          },
        });
      }
      // 条件改变了，清除所有选中的记录
      newState = update(newState, {
        selectedRowKeys: { $set: [] },
        filterDataSource: {
          $set: getFilterDataSource(newState.filters, [...newState.filterDataSource]),
        },
        refreshFilterDataSourceCount: { $apply: (c) => c + 1 },
      });
      break;
    }
    case ACT_SQLPARAM_CHANGE:
      newState = update(state, {
        filters: {
          sqlparam: {
            $set: payload.sqlparam,
          },
        },
        refreshAllCount: { $apply: (c) => c + 1 },
        refreshFilterDataSourceCount: { $apply: (c) => c + 1 },
      });
      break;
    case ACT_DATAMINING_FETCHDATA:
      newState = update(state, {
        // 更新过数据之后将方案改变状态置为false
        schemeChanged: {
          $set: false,
        },
        schemeState: {
          dataSource: {
            $set: payload.dataSource,
          },
        },
      });
      if (payload.expandedRowKeys && payload.expandedRowKeys.length) {
        const keys: string[] = [];
        payload.expandedRowKeys.forEach((key: string) => {
          if (!state.expandedRowKeys.find((e) => e === key)) keys.push(key);
        });
        if (!state.expandedRowKeys.find((e) => e === payload.expandedRowKey))
          newState = update(newState, {
            expandedRowKeys: {
              $push: keys,
            },
          });
      }
      if (payload.expandPaths && payload.expandPaths.length) {
        newState = update(newState, {
          schemeState: {
            rowGroup: {
              $push: payload.expandPaths,
            },
          },
        });
      }
      if (payload.deletedRowids && payload.deletedRowids.length) {
        const ids: string[] = payload.deletedRowids;
        newState = update(newState, {
          expandedRowKeys: {
            $set: state.expandedRowKeys.filter((value) => !ids.find((id) => id === value)),
          },
          selectedRowKeys: {
            $set: state.selectedRowKeys.filter((value) => !ids.find((id) => id === value)),
          },
        });
      }
      break;
    case ACT_FETCH_LOADING_CHANGED:
      newState = update(state, {
        fetchLoading: {
          $set: payload.fetchLoading,
        },
      });
      break;
    case ACT_DATAMINING_FETCH_SCHEMES:
      newState = fetchDataminingSchemes(state);
      break;
    case ACT_DATAMINING_CHANGE_SCHEME:
      newState = update(state, {
        selectedRowKeys: { $set: [] },
        expandedRowKeys: { $set: [ROOTROWID] },
        currentScheme: {
          $set: payload.currentScheme,
        },
      });
      break;
    case ACT_UPDATE_DATAMINING_SCHEMEINFO:
      newState = update(state, {
        // 方案是否改变了
        schemeChanged: { $apply: () => payload.schemeChanged === true },
        refreshAllCount: { $apply: (c) => c + 1 },
        schemeState: {
          $merge: payload.schemeState,
        },
      });
      break;
    case ACT_MONETARY_CHANGED: {
      const { position, monetaryType } = payload;
      newState = update(state, {
        monetaryPosition: {
          $set: position || state.monetaryPosition,
        },
        monetary: {
          $set: monetaryType ? getMonetary(monetaryType) : state.monetary,
        },
      });
      break;
    }
    case 'modules/toggleUserFilter':
      newState = update(state, {
        currSetting: {
          $toggle: ['userFilterRegionVisible'],
        },
      });
      break;
    case ACT_SORT_CHANGE: {
      const { property, direction } = payload;
      newState = update(state, {
        schemeState: {
          dataSource: {
            $set: sortTree(state.schemeState.dataSource, property, direction === 'ASC' ? 1 : -1),
          },
          sorts: {
            $set: [
              {
                property,
                direction,
              },
            ],
          },
        },
      });
      break;
    }
    case ACT_TOGGLE_GROUP_REGION:
      newState = update(state, {
        currSetting: {
          $toggle: ['groupRegionVisible'],
        },
      });
      break;
    case ACT_TOGGLE_FILTER_REGION:
      newState = update(state, {
        currSetting: {
          $toggle: ['filtersRegionVisible'],
        },
      });
      break;
    case ACT_TOGGLE_NAVIGATE_REGION:
      newState = update(state, {
        currSetting: {
          navigate: {
            $toggle: ['visible'],
          },
        },
      });
      break;
    case ACT_SELECTED_ROWKEYS_CHANGED:
      newState = update(state, {
        selectedRowKeys: {
          $set: payload.selectedRowKeys,
        },
      });
      break;
    case ACT_DATAMINING_EXPAND_CHANGED:
      // 如果有expandKeys,则直接设置
      if (payload.expandedRowKeys) {
        newState = update(state, {
          expandedRowKeys: {
            $set: payload.expandedRowKeys,
          },
        });
      } else if (payload.expanded)
        newState = update(state, {
          expandedRowKeys: {
            $push: [payload.key],
          },
        });
      else
        newState = update(state, {
          expandedRowKeys: {
            $apply: (a: any[]) => a.filter((o) => o !== payload.key),
          },
        });
      break;
    case ACT_CLEAR_ALL_ROWEXPAND:
      newState = update(state, {
        expandedRowKeys: {
          $set: [],
        },
        selectedRowKeys: {
          $set: [],
        },
        schemeState: {
          rowGroup: {
            $set: [],
          },
        },
        refreshAllCount: { $apply: (c) => c + 1 },
      });
      break;
    case ACT_CLEAR_ALL_COLUMN_EXPAND:
      newState = update(state, {
        schemeState: {
          columnGroup: {
            $set: [],
          },
        },
      });
      break;
    case ACT_FILTER_DATASOURCE_UPDATE:
      newState = update(newState, {
        filterDataSource: {
          $set: payload.filterDataSource,
        },
        refreshFilterDataSourceCount: {
          $apply: (c) => c + (payload.refreshCount ? 1 : 0),
        },
      });
      break;
    case ACT_DELETE_ROWGROUP_FROM_INDEX:
      newState = update(newState, {
        schemeState: {
          rowGroup: {
            $apply: (group: any[]) => group.filter((_, index) => index < payload.deleteFormIndex),
          },
        },
        refreshAllCount: {
          $apply: (c) => c + 1,
        },
        selectedRowKeys: {
          $set: [],
        },
      });
      break;
    default:
      break;
  }
  // 如果有分组字段没有加入field,或者分组字段改变了顺序或个数，则重新更新一下
  if (
    newState.schemeState.fieldGroup.find((group, index) => group[ROWID] !== `field-${101 + index}`)
  ) {
    newState = update(newState, {
      schemeState: {
        fieldGroup: {
          $set: newState.schemeState.fieldGroup.map((group, index) => ({
            ...group,
            [ROWID]: `field-${101 + index}`,
          })),
        },
      },
    });
  }
  newState.fromCache = false; // 有过操作以后，就解除fromCache,否则在useState中不进行更新
  setDataminingModal(newState);
  return newState;
};
