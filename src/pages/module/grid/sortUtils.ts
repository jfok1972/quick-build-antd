/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { SorterResult, SortOrder } from 'antd/lib/table/interface';
import type { SortModal } from '../data';

/**
 * 根据用户点击列头的排序来生成ajax的排序的参数如下：
 * sort: [{"property":"groupname","direction":"ASC"}]
 * 
 *  传入的参数
 *  column: {title: "系统组", dataIndex: "issystem", key: "issystem", sorter: true, render: ƒ, …}
    columnKey: "issystem"
    field: "issystem"
    order: "ascend" // "descend // null(取消排序)
 * 
 */

export const getGridColumnSorts = (
  sorters: SorterResult<any> | SorterResult<any>[],
): SortModal[] => {
  const sorts: SortModal[] = [];
  const getColumnSort = (sorter: SorterResult<any>): SortModal => {
    // console.log(sorter)
    const MENUTEXT = 'menuText';
    const result: SortModal = {
      property: sorter.columnKey,
      direction: sorter.order === 'ascend' ? 'ASC' : 'DESC',
      title: sorter.column && sorter.column[MENUTEXT],
    };
    return result;
  };
  if (Array.isArray(sorters)) {
    sorters.forEach((sorter: SorterResult<any>) => {
      if (sorter.order) sorts.push(getColumnSort(sorter));
    });
  } else if (sorters.order) sorts.push(getColumnSort(sorters as SorterResult<any>));
  return sorts;
};

/**
 * 根据当前model中的排序设置来取得某个字段的排序状态，用于grid重新渲染时指定列的排序方向
 * @param sorts
 * @param columnKey 每个字段都有field表示是显示的字段，
 *                  columnKey表示是key字段。如field=field.name,columnKey=field.primarykey
 */
export const getSortOrder = (sorts: SortModal[], columnKey: string): SortOrder => {
  for (let i = 0; i < sorts.length; i += 1) {
    if (sorts[i].property === columnKey) return sorts[i].direction === 'ASC' ? 'ascend' : 'descend';
  }
  return null;
};
