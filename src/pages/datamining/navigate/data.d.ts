/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { ExpandGroupFieldModal } from '../data';

// 大批量的数据，不可以进行全选，不能反选

export interface NavigateConditionModal {
  groupFieldid?: string; // 导航条件的id
  property_?: string; // 字段属性
  operator?: 'in'; // 比较符
  value?: string[]; // 所有选中值的id，以逗号分开
  text?: string; // 所有选中的记录的说明
  title?: string; // 筛选字段的说明
  children?: NavigateConditionModal[];
}

export interface DataminingNavigateModal {
  navigateGroup: ExpandGroupFieldModal; // 导航分组的定义
  expandedKeys: string[]; // 当前展开的所有节点的key
  selectedKeys: string[];
  checkedKeys: string[];

  dataSource: any[]; // 所有导航的数据
  search?: string; // 搜索的文字

  sortProperty?: 'text' | 'value' | 'count'; // 排序字段
  sortOrder?: 'asc' | 'desc'; // 排序方向
}
