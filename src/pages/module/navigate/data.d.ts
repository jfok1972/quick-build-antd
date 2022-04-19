/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { ParentFilterModal } from '../data';

export type ModuleNavigates = Record<string, NavigateStateModal[]>;

export interface NavigateStateModal {
  navigateschemeid: string; // 导航方案id
  title: string; // 导航的名称
  loading: 'needload' | 'loading' | 'loaded'; // 请求数据的状态，'needload','loading,'loaded','

  allowNullRecordButton: boolean; // 是否允许在包含无记录导航之间切换
  isContainNullRecord: boolean; // 是否包含无记录导航值，当allowNullRecordButton为true时，可以切换
  cascading: boolean; // 是否层级，为false则定义的各级都平级展示，当allLevel大于1时可以切换
  allLevel: number; // 导航定义的层数

  parentFilter?: ParentFilterModal; // 父级条件约束

  canExpandedKeys: string[]; // 所有的可以拆叠的节点,1000是根节点，没用了，先留着吧

  expandedKeys: string[]; // 当前展开的所有节点的key

  dataSource: any[]; // 所有导航的数据
  dataSourceKeyIndex: any; // 每一条记录的key的索引   {‘1000’：第一条}
  depth?: numbrer; // 导航树的深度,大于等于allLevel
  search?: string; // 搜索的文字
  nodeCount: number; // 一共有多少个节点

  treeData: any[]; // treeData数据，更改过后再会重新渲染

  initExpandedKeys: string[]; // 初始状态的展开，用于取消搜索之后
  initTreeData: any[]; // 初始值
}
