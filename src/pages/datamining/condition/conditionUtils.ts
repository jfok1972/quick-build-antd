/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { getOperateTitle, getSqlparamFilter } from '@/pages/module/grid/filterUtils';
import { changeUserFilterToParam } from '@/pages/module/UserDefineFilter';
import request, { API_HEAD } from '@/utils/request';
import { uuid } from '@/utils/utils';
import { serialize } from 'object-to-formdata';
import { ACT_FILTER_DATASOURCE_UPDATE } from '../constants';
import type { DataminingModal, FilterDataSourceModal, FiltersModal } from '../data';
import type { NavigateConditionModal } from '../navigate/data';
import { navigateCheckedChange } from '../navigate/navigateTree';
import { getWholeConditionText } from '../navigate/navigateUtils';

/**
 * 在刷新filterCount的同时，更新 viewModel中的 navigatefilters : [], userfilters : [],
 * viewscheme : null,
 */
export const refreshFilterCount = (state: DataminingModal, dispatch: Function) => {
  const { filterDataSource, filters } = state;
  const condFilters: any[] = [];
  if (filterDataSource.length === 0) return;
  filterDataSource.forEach((record) => {
    const type = record.conditiontype;
    const { originfilter } = record;
    switch (type) {
      case 'viewscheme':
        condFilters.push({
          type: 'viewscheme',
          schemeid: originfilter.viewschemeid,
        });
        break;
      case 'userfilter':
        condFilters.push({
          type: 'userfilter',
          userfilter: originfilter,
        });
        break;
      case 'navigatefilter':
        condFilters.push({
          type: 'navigatefilter',
          navigatefilter: originfilter,
        });
        break;
      default:
    }
  });
  request(`${API_HEAD}/platform/datamining/getfiltercount.do`, {
    method: 'POST',
    data: serialize({
      moduleName: state.moduleName,
      fields: JSON.stringify(['count.*']),
      filters: JSON.stringify(condFilters),
      sqlparamstr: filters.sqlparam ? JSON.stringify(getSqlparamFilter(filters.sqlparam)) : null,
    }),
  }).then((result) => {
    for (let i = 0; i < filterDataSource.length; i += 1) {
      filterDataSource[i].recordnum = result[i];
    }
    dispatch({
      type: ACT_FILTER_DATASOURCE_UPDATE,
      payload: {
        filterDataSource: [...filterDataSource],
      },
    });
  });
};

// 删除了一个条件
export const deleteFilterDataSourceRecord = (
  state: DataminingModal,
  dispatch: Function,
  record: FilterDataSourceModal,
) => {
  const { conditiontype } = record;
  if (conditiontype === 'viewscheme') {
    dispatch({
      type: 'filterChanged',
      payload: {
        type: 'viewSchemeChange',
        viewscheme: {},
      },
    });
  } else if (conditiontype === 'userfilter') {
    const { userfilter } = state.filters;
    dispatch({
      type: 'filterChanged',
      payload: {
        type: 'userDefineFilter',
        userfilter: userfilter.map((filter) => {
          if (filter.property === record.property) return { ...filter, value: undefined };
          return filter;
        }),
      },
    });
  } else if (conditiontype === 'navigatefilter') {
    navigateCheckedChange(state, dispatch, record.property || '', [], 0);
  }
};

// 根据选中的所有筛选值，生成条件列表中的记录
export const getFilterDataSource = (
  filters: FiltersModal,
  fDataSource: FilterDataSourceModal[],
): FilterDataSourceModal[] => {
  let filterDataSource = fDataSource;
  const { viewscheme, navigatefilters } = filters;
  const index = filterDataSource.findIndex((filter) => filter.conditiontype === 'viewscheme');
  if (viewscheme.viewschemeid) {
    const filter: FilterDataSourceModal = {
      key: uuid(),
      pin: false,
      locked: false,
      source: '视图方案',
      conditiontype: 'viewscheme',
      displaycond: viewscheme.title || '',
      originfilter: viewscheme,
      recordnum: -1,
    };
    if (index === -1) filterDataSource.splice(0, 0, filter);
    // 加进去
    else if (filterDataSource[index].originfilter.viewschemeid !== viewscheme.viewschemeid)
      filterDataSource.splice(index, 1, filter); // 替换掉
  } else if (index !== -1) filterDataSource.splice(index, 1); // 删除

  // operator: "in"
  // property: "pmProject.pmGlobal"
  // title: "工程项目"
  // value: "市政道桥零星工程,闲置土地整理,园林绿化养护工程"，或者['aa','bb']
  // 显示title的条件
  const userFiltersWithTitle: any[] = changeUserFilterToParam(filters.userfilter, true, ',');
  // sql的参数
  const userFiltersWithCondition: any[] = changeUserFilterToParam(filters.userfilter);
  filterDataSource = filterDataSource.filter((filter) => {
    return (
      filter.conditiontype !== 'userfilter' ||
      userFiltersWithTitle.find((f) => f.property === filter.property)
    );
  });
  userFiltersWithTitle.forEach((ufilter) => {
    const filter: FilterDataSourceModal = {
      key: uuid(),
      pin: false,
      locked: false,
      source: '用户筛选',
      conditiontype: 'userfilter',
      property: ufilter.property,
      fieldtitle: ufilter.title,
      operator: getOperateTitle(ufilter.operator),
      displaycond: Array.isArray(ufilter.value) ? ufilter.value.join(',') : ufilter.value,
      originfilter: userFiltersWithCondition.find((c) => c.property === ufilter.property),
      recordnum: -1,
    };
    const findex = filterDataSource.findIndex(
      (f) => f.conditiontype === 'userfilter' && f.property === ufilter.property,
    );
    if (findex !== -1) filterDataSource.splice(findex, 1, filter);
    else filterDataSource.push(filter);
  });

  // 导航条件
  filterDataSource = filterDataSource.filter((filter) => {
    return (
      filter.conditiontype !== 'navigatefilter' ||
      navigatefilters.find((f) => f.groupFieldid === filter.property)
    );
  });

  navigatefilters.forEach((navfilter) => {
    const filter: FilterDataSourceModal = {
      key: uuid(),
      pin: false,
      locked: false,
      source: '导航条件',
      conditiontype: 'navigatefilter',
      property: navfilter.groupFieldid,
      fieldtitle: navfilter.title,
      operator: getOperateTitle(navfilter.operator as string),
      displaycond: getWholeConditionText(navfilter.children as NavigateConditionModal[]),
      originfilter: navfilter,
      recordnum: -1,
    };
    const findex = filterDataSource.findIndex(
      (f) => f.conditiontype === 'navigatefilter' && f.property === navfilter.groupFieldid,
    );
    if (findex !== -1) filterDataSource.splice(findex, 1, filter);
    else filterDataSource.push(filter);
  });
  filterDataSource.forEach((f: FilterDataSourceModal) => {
    const filter = f;
    filter.recordnum = -1;
  });
  return filterDataSource;
};

// 生成所有筛选条件的导出数组
export const getAllFilterExportString = (filterDataSource: FilterDataSourceModal[]) => {
  const result: any[] = [];
  filterDataSource.forEach((record: FilterDataSourceModal) => {
    result.push({
      source: record.source,
      fieldtitle: record.fieldtitle,
      operator: record.operator,
      displaycond: record.displaycond,
    });
  });
  return result;
};
