/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { Key } from 'react';
import { isMoment } from 'moment';
import type {
  ColumnFilter,
  ColumnFilterType,
  ModuleState,
  TextValue,
  ModuleFilters,
  ModuleFieldType,
} from '../data';
import {
  getUserFilterCount,
  stringFieldOperator,
  changeUserFilterToParam,
} from '../UserDefineFilter';
import { getFieldDefine, getGridScheme, getModuleInfo } from '../modules';
import { getLeafColumns } from '../moduleUtils';

/**
 * 所有模块的grid column 的筛选的信息
 *
 */
const columnFilterInfos: Record<Key, ColumnFilterType> = {};

export const getColumnFiltersInfo = (moduleid: string) => {
  if (!columnFilterInfos[moduleid]) columnFilterInfos[moduleid] = {};
  return columnFilterInfos[moduleid];
};
export const getColumnFilterInfo = (moduleid: string, dataIndex: string) => {
  if (!columnFilterInfos[moduleid]) columnFilterInfos[moduleid] = {};
  if (!columnFilterInfos[moduleid][dataIndex])
    columnFilterInfos[moduleid][dataIndex] = { title: '', type: 'string' };
  return columnFilterInfos[moduleid][dataIndex];
};

export const getSqlparamCount = (sqlparam: any[]): number => {
  let count = 0;
  if (sqlparam)
    Object.keys(sqlparam).forEach((key) => {
      if (sqlparam[key].value) count += 1;
    });
  return count;
};

export const getAllFilterCount = (moduleState: ModuleState): number => {
  return (
    (moduleState.filters.viewscheme.viewschemeid ? 1 : 0) +
    (moduleState.filters.columnfilter ? moduleState.filters.columnfilter.length : 0) +
    (moduleState.filters.navigate ? moduleState.filters.navigate.length : 0) +
    (moduleState.filters.searchfilter ? 1 : 0) +
    getUserFilterCount(moduleState.filters.userfilter) +
    getSqlparamCount(moduleState.filters.sqlparam)
  );
};

// 取得sqlparam参数的值，把日期要转换一下
export const getSqlparamFilter = (stateSqlparam: any) => {
  if (!stateSqlparam) return {};
  const sqlparam = {};
  Object.keys(stateSqlparam).forEach((key) => {
    sqlparam[key] = stateSqlparam[key].value;
  });
  Object.keys(sqlparam).forEach((key) => {
    if (isMoment(sqlparam[key])) sqlparam[key] = sqlparam[key].format('YYYY-MM-DD');
  });
  return sqlparam;
};

/**
 * 获取所有的条件，用于fetch data时传送到后台的筛选参数
 */
export const getAllFilterAjaxParam = (filters: ModuleFilters, moduleState: ModuleState) => {
  const payload: any = {};
  const { columnfilter, navigate, viewscheme, userfilter } = filters;
  if (columnfilter && columnfilter.length > 0) payload.filter = JSON.stringify(columnfilter);
  if (navigate) payload.navigates = JSON.stringify(navigate);
  if (viewscheme.viewschemeid) payload.viewschemeid = viewscheme.viewschemeid;
  if (userfilter && userfilter.length) {
    payload.userfilter = changeUserFilterToParam(userfilter);
    if (payload.userfilter.length) payload.userfilter = JSON.stringify(payload.userfilter);
    else delete payload.userfilter;
  }
  if (filters.parentfilter) {
    payload.parentFilter = JSON.stringify(filters.parentfilter);
  }
  if (filters.dataminingFilter) {
    payload.dataminingFilter = JSON.stringify(filters.dataminingFilter);
  }
  if (filters.sqlparam) {
    payload.sqlparamstr = JSON.stringify(getSqlparamFilter(filters.sqlparam));
  }
  if (filters.searchfilter) {
    const queryArray = [];
    const moduleInfo = getModuleInfo(moduleState.moduleName);
    const gridScheme: any = getGridScheme(moduleState.currentGridschemeid, moduleInfo);
    const columns = getLeafColumns(gridScheme.columns);
    for (let i = 0; i < columns.length; i += 1) {
      const column: any = columns[i];
      if (column.fieldahead && column.aggregate)
        // eslint-disable-next-line
        continue;
      const field: ModuleFieldType = getFieldDefine(column.fieldid, moduleInfo);
      if (!field || field.ishidden || field.isdisable || field.userdisable)
        // eslint-disable-next-line
        continue; // 隐藏字段和禁用的字段都不放在grid中
      if (field.fDictionaryid) {
        queryArray.push({
          property: `${field.fieldname}_dictname`,
          operator: 'like',
          value: filters.searchfilter,
          searchfor: 'text',
        });
      }
      if (field.fieldtype.toLocaleLowerCase() === 'string') {
        queryArray.push({
          property: field.fieldname,
          operator: 'like',
          value: filters.searchfilter,
          searchfor: 'text',
        });
      } else if (field.isManyToOne || field.isOneToOne) {
        queryArray.push({
          property: field.manyToOneInfo.nameField,
          operator: 'like',
          value: filters.searchfilter,
          searchfor: 'text',
        });
      }
    }
    payload.query = JSON.stringify(queryArray);
  }
  return payload;
};

export const getSqlparamFilterAjaxText = (sqlparam: any[]) => {
  const result: any[] = [];
  if (sqlparam)
    Object.keys(sqlparam).forEach((key) => {
      const { value } = sqlparam[key];
      if (value !== null) {
        result.push({
          property: sqlparam[key].title,
          operator: sqlparam[key].operator,
          value: isMoment(value) ? value.format('YYYY-MM-DD') : value,
        });
      }
    });
  return result;
};

export const NumberFilterSelectOption = [
  { value: '=', text: '=' },
  { value: '>=', text: '>=' },
  { value: '>', text: '>' },
  { value: '<=', text: '<=' },
  { value: '<', text: '<' },
  { value: '<>', text: '<>' },
  { value: 'in', text: '列表' },
  { value: 'not in', text: '列表外' },
  { value: 'between', text: '区间' },
  { value: 'not between', text: '区间外' },
];

const OptionSelectOption = [
  { value: 'like', text: '包含' },
  { value: 'is null', text: '' },
];

const DateFilterSelectOption = [{ value: 'daysection', text: '区间' }];

export const getOperateTitle = (operate: string): string => {
  let result: any = NumberFilterSelectOption.filter((item) => item.value === operate);
  if (result.length > 0) return result[0].text;
  result = OptionSelectOption.filter((item) => item.value === operate);
  if (result.length > 0) return result[0].text;
  result = stringFieldOperator.filter((item) => item.value === operate);
  if (result.length > 0) return result[0].text;
  result = DateFilterSelectOption.filter((item) => item.value === operate);
  if (result.length > 0) return result[0].text;
  return operate;
};

/**
 *
 * 生成当前grid列的筛选条件的描述说明
 *
 */
export const getGridColumnFiltersDescription = (
  filters: ColumnFilter[],
  columnFilterInfo: ColumnFilterType,
  sepatater: string = ',',
): ColumnFilter[] => {
  let result: ColumnFilter[] = [];
  result = filters.map((filter): ColumnFilter => {
    const { comboValue } = columnFilterInfo[filter.property];
    if (comboValue) {
      const array = (filter.value as string).split(',');
      return {
        dataIndex: filter.property,
        property: columnFilterInfo[filter.property].title,
        operator: getOperateTitle(filter.operator),
        value: array
          .map((item: string) => {
            /* eslint-disable */
            for (const i in comboValue) {
              if (comboValue[i].value === item) return comboValue[i].text;
            }
            /* eslint-enable */
            return '';
          })
          .join(sepatater),
      };
    }
    return {
      dataIndex: filter.property,
      property: columnFilterInfo[filter.property].title,
      operator: getOperateTitle(filter.operator),
      value: filter.value,
    };
  });
  return result;
};

/**
 * 获取所有的条件文本描述
 * property
 * operator
 * value
 */
export const getAllFilterAjaxText = (moduleState: ModuleState): any[] => {
  const { moduleName, filters } = moduleState;
  const result: any[] = [];

  if (filters.sqlparam) {
    result.push(...getSqlparamFilterAjaxText(filters.sqlparam));
  }

  result.push(
    ...changeUserFilterToParam(filters.userfilter, true, ',').map((f: any) => {
      const res = { ...f };
      res.property = res.title;
      res.operator = getOperateTitle(res.operator);
      delete res.title;
      return res;
    }),
  );

  result.push(
    ...getGridColumnFiltersDescription(
      filters.columnfilter || [],
      getColumnFiltersInfo(moduleName),
      ',',
    ),
  );

  result.push(
    ...filters.navigate.map((filter: any) => ({
      property: filter.fieldtitle,
      operator: filter.operator,
      value: filter.text,
    })),
  );

  if (filters.viewscheme.viewschemeid)
    result.push({
      property: `视图方案：${filters.viewscheme.title}`,
      operator: null,
      value: null,
    });
  if (filters.searchfilter) {
    result.push({
      property: `所有文本字段`,
      operator: '包含',
      value: filters.searchfilter,
    });
  }
  if (filters.parentfilter) {
    result.push({
      property: filters.parentfilter.fieldtitle,
      operator: ':',
      value: filters.parentfilter.text,
    });
  }
  return result;
};

/**
 * 根据用户的选择来生成ajax中的筛选条件
 *     用户可选择的列筛选条件，包括Boolean,数据字典等。
 *
 * @param filters { issystem:['1'] , isowner: ['2','3'] }
 * 返回结果
 * filter: [{"property":"issystem","value":"null,1","operator":"in"}]
 * filter: [{"property":"issystem","value":"1","operator":"=="}]
 */
export const getGridColumnFilters = (
  filters: Record<string, Key[] | null>,
  columnFilterInfo: ColumnFilterType,
): ColumnFilter[] => {
  const result: ColumnFilter[] = [];
  /* eslint-disable */
  for (const key in filters) {
    /* eslint-enable */
    const value: any = filters[key];
    if (value !== null && value !== undefined) {
      const filter: any = {
        property: key,
        value: value.join(','),
        operator: 'in',
      };
      switch (columnFilterInfo[key].type) {
        case 'number':
          if (value[1] === null || value[1] === undefined)
            // 如果没有选择数值，那么就不参加筛选
            // eslint-disable-next-line
            continue;
          [filter.operator, filter.value] = value;
          filter.operator = filter.operator || '=';
          break;
        case 'string':
          filter.operator = 'like';
          [filter.value] = value;
          break;
        case 'date':
          filter.operator = 'daysection';
          filter.value = `${value[0] ? value[0] : ''}--${value[1] ? value[1] : ''}`;
          break;
        default:
          break;
      }
      result.push(filter);
    }
  }
  return result;
};

/**
 * 根据当前model中的筛选设置来取得某个字段的筛选值，用于grid重新渲染时指定列的筛选值
 * @param sorts
 * @param columnKey 每个字段都有field表示是显示的字段，
 *                  columnKey表示是key字段。如field=field.name,columnKey=field.primarykey
 */
export const getColumnFilterValue = (
  columnFilter: ColumnFilter[] = [],
  columnKey: string,
): Key[] | null => {
  for (let i = 0; i < columnFilter.length; i += 1) {
    if (columnFilter[i].property === columnKey) return columnFilter[i].value.toString().split(',');
  }
  return null;
};

// 返回区间的一个数组 [startdate , enddate] ,字符串
export const getDateColumnFilterValue = (columnFilter: ColumnFilter[] = [], columnKey: string) => {
  for (let i = 0; i < columnFilter.length; i += 1) {
    if (columnFilter[i].property === columnKey)
      if (columnFilter[i].value) return (columnFilter[i].value as string).split('--');
      else return [null, null];
  }
  return null;
};

export const getStringColumnFilterValue = (
  columnFilter: ColumnFilter[] = [],
  columnKey: string,
): Key[] | null => {
  for (let i = 0; i < columnFilter.length; i += 1) {
    if (columnFilter[i].property === columnKey)
      if (columnFilter[i].value) return [columnFilter[i].value as Key];
  }
  return null;
};

export const getNumberColumnFilterValue = (
  columnFilter: ColumnFilter[] = [],
  columnKey: string,
): Key[] | null => {
  for (let i = 0; i < columnFilter.length; i += 1) {
    if (columnFilter[i].property === columnKey)
      if (columnFilter[i].value) return [columnFilter[i].operator, columnFilter[i].value as Key];
  }
  return null;
};

// 注意这里的true ,false ,还是 '1','0'
export const getBooleanFilterOption = (isrequired: boolean): TextValue[] => {
  const result = [
    { text: '是', value: '1', label: '是' },
    { text: '否', value: '0', label: '否' },
  ];
  if (!isrequired) result.push({ text: '未定义', value: 'null', label: '未定义' });
  return result;
};

// 把选择的是否，null,转换成文本显示
export const getBooleanInValueText = (arrays: any) => {
  let values = arrays;
  if (!Array.isArray(values)) values = [values];
  const data = getBooleanFilterOption(false);
  const arrayResult: any[] = values.map((value: any) => {
    /* eslint-disable */
    for (const i in data) {
      if (data[i].value === value) return data[i].text;
    }
    /* eslint-enable */
    return value;
  });
  return arrayResult.join(',');
};
