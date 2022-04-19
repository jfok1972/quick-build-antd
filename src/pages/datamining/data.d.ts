/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 * 商业数据分析使用的Modal
 */

import type { SortModal, ViewSchemeType } from '../module/data';
import type { MonetaryType } from '../module/grid/monetary';
import type { DataminingNavigateModal, NavigateConditionModal } from './navigate/data';

declare const HeaderCellTypes: ['sumfield' | 'subfield' | 'group' | 'fieldingroup'];
export declare type HeaderCellType = typeof HeaderCellTypes[number];

export interface ActionProps {
  type: string;
  payload: any;
}

// ownerfilter: false
// savepath: true
// schemeid: "ff8080817586cb9101758d1387f1005c"
// text: "合同个数和签订金额年度月份分类汇总表 (路径)"
// title: "合同个数和签订金额年度月份分类汇总表"

export interface DataMiningSchemeModal {
  schemeid: string;
  text: string;
  title: string;
  savepath: boolean;
  otherfilter?: boolean;
}

// 每一个列分组的定义信息
// text: "安置房建设资金"
// leaf: true
// condition: "pmagreementbudgettype|ff80808174ec813b0174fb8f944200f9=01"
export interface ColumnGroupModal {
  text: string;
  leaf: boolean;
  condition?: string;
  children?: ColumnGroupModal[]; // 多层表头下面的子表
}

// 选中的字段
// aggregate: "sum"
// aggregatefieldname: "sum.singAmount"
// fieldname: "singAmount"
// fieldtype: "Double"
// ismonetary: true
// leaf: true
// text: "合同签订金额"
// unittext: "元"
export interface FieldModal {
  aggregate: 'count' | 'sum';
  aggregatefieldname: string;
  fieldname: string;
  fieldtype: string;
  ismonetary?: boolean;
  leaf: boolean;
  text: string;
  unittext?: string;
  condition?: string | null;
  subconditionid?: string | null;
  hiddenInColumnGroup?: boolean; // 是否在分组里面隐藏，只显示总计
  columns?: fieldModal[]; // 嵌套的情况很少用到extjs里可用，这里先不加了
  rowid?: string;
}

// 每一个行展开的属性
// conditionpath: "d41d8cd98f00b204e9800998ecf8427e"
// fieldid: "ff8080817517d40c017517d53df1009b-8a53b78262ea6e6d0162ea6e89ab0001"
// title: "合同签订日期(yyyy年mm月)"
// type: "expand"
// 展开类型：expand:根据conditionpath指定的rowid进行展开，如有多个，则是有多条展开记录
export interface RowGroupModal {
  conditionpath: string; // 行的rowid值
  conditiontext: string; // 操作行的文字描述
  fieldid: string; // 展开的字段
  title: string; // 展开的字段的描述
  type: string; // 展开的类型 "expand"
  text?: string; // 修改过后的标题文字
  addSelectedChildrens?: boolean; // 行合并时是否加入原行
  condition: string; // 合并行的条件
  records?: any[]; // 导航拖动过来的记录
  pos?: number; // 导航拖动过来的放置位置
}

// 可展开的一个分组的定义
export interface ExpandGroupFieldModal {
  fieldid: string;
  title: string;
  iconCls?: string;
}

// 可展开的一个分组的树形结构定义
export interface ExpandGroupTreeFieldModal {
  fieldahead?: string;
  fieldid: string;
  title: string; // 原始自动生成的标题
  iconCls?: string;
  text: string; // 显示的标题
  functionid?: string; // 定义的函数id
  menu?: ExpandGroupTreeFieldModal[];
}

export interface SchemeSettingModal {
  expandItemMode: 'code' | 'text' | 'value';
  expandMaxRow: number;
  showdetail: 'yes' | 'no';
  expandRowAddGroupName: 'yes' | 'no';
  expandColAddGroupName: 'yes' | 'no';
  expandColAddFilter: 'yes' | 'no';
  expandMaxCol: 12;
  expandMaxLevel: 0;
  autoHiddenZeroCol: 'yes' | 'no';
  refreshMode: string; // "expandpath",
  expandMultiGroup: 'yes' | 'no';
  expandItemDirection: 'asc' | 'desc';
  addCountSumPercent: 'yes' | 'no';
  addNumberTip: 'yes' | 'no';
  leafColumnCharSize: number;
}

export interface CurrentSchemeModal {
  columnGroup: ColumnGroupModal[]; // 所有的列展开的分组定义
  fieldGroup: FieldModal[]; // 所有选中的聚合字段
  isMultFieldGroup: boolean; // 聚合字段是否是多层，多层的不能进行展开和其他的操作了
  rowGroup: RowGroupModal[];
  setting: SchemeSettingModal;
  dataSource: any[];
  sorts: SortModal[];
}

export interface FilterDataSourceModal {
  key: string;
  pin: boolean;
  locked: boolean;
  source: '视图方案' | '用户筛选' | '导航条件' | '查询参数';
  property?: string;
  fieldtitle?: string;
  operator?: string;
  displaycond: string;
  conditiontype: 'viewscheme' | 'userfilter' | 'navigatefilter' | 'sqlparam';
  originfilter: any; // 原始的条件
  recordnum: number;
}

// 导航区域的设置
interface DataminingNavigateSetting {
  visible: boolean; // 导航区域是否可见
  activeKey: string;
}

interface DataminingSetting {
  fieldGroupFixedLeft: boolean; // 总计靠左固定
  navigate: DataminingNavigateSetting; // 导航区域设置
  filtersRegionVisible: boolean; // 当前生效筛选条件区域是否可见
  groupRegionVisible: boolean; // 可分组区域是否可见
  userFilterRegionVisible: boolean; // regionVisible 初始显示还是隐藏
  userFilterRestNumber: number; // 筛选字段隐藏个数   restNumber : 3, 从第三个开始隐藏 ，设置在筛选分组里面
  userFilterRestHidden: boolean; // 筛选字段是否隐藏 展开，收起 restHidden : false ，默认隐藏
}

export interface FiltersModal {
  navigatefilters: NavigateConditionModal[];
  viewscheme: ViewSchemeType;
  userfilter: any[];
  sqlparam: any;
}

export interface ExportSettingModal {
  unittextalone: boolean; // 计量单位是否单独一行
  colorless: boolean; // true为没有背景颜色
  disablecollapsed: boolean; // 折叠的记录是否导出
  disablerowgroup: boolean; // 是否加入行组合
  pagesize: 'A4' | 'A4landscape' | 'A3' | 'A3landscape' | 'pageautofit';
  autofitwidth: boolean; // 选定了纸张后，是否自动适应宽度
  scale: number; // 选定了纸张后，缩放比例
  // 包含隐藏列的不用了
}

export interface DataminingModal {
  moduleName: string;
  defaultSchemeid?: string; // 默认的方案，如果设置了，初始化的时候先设置为此方案
  fromCache: boolean; // 当前state是否是从cache中调用，如果是，则只渲染，不进行任何操作
  refreshAllCount: number; // 是否需要刷新所有的数据，0不刷新，不为0刷新，+1，则刷新
  refreshFilterDataSourceCount: number; // 是否需要刷新条件列表中的记录数，0不刷新，+1，刷新
  schemeChanged: boolean; // 是否改变了筛选方案，加载方案后改为true, 刷新数据后改为false
  fetchLoading: boolean; // 数据分析数是否正在加载
  selectedRowKeys: any[]; // 当前选中的记录
  expandedRowKeys: any[]; // 树形结构展开的节点
  schemes: DataMiningSchemeModal[];
  aggregateFields?: FieldModal[]; // 可供选择加入的所有的聚合字段，定义在字段分组中
  expandGroupFields?: ExpandGroupFieldModal[]; // 所有可以展开的分组
  expandGroupFieldsTree?: ExpandGroupTreeFieldModal[]; // 所有可展开的分组的树形结构
  currentScheme: DataMiningSchemeModal;
  schemeState: CurrentSchemeModal;
  monetary: MonetaryType;
  monetaryPosition: 'behindnumber' | 'columntitle';
  currSetting: DataminingSetting;
  filters: FiltersModal;
  navigates: DataminingNavigateModal[]; // 所有导航的定义,包括数据，选中状态等
  filterDataSource: FilterDataSourceModal[]; // 显示当前所有条件的table的数据源
  exportSetting: ExportSettingModal;
}
