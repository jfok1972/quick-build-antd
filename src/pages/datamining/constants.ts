/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

export const ROOTROWID = 'd41d8cd98f00b204e9800998ecf8427e';
export const ROWID = 'rowid';
export const PARENT_ROWID = 'p_rowid';
export const PARENTNODE = 'parentNode';
export const CHILDREN = 'children';
export const VALUE = 'value';
export const TEXT = 'text';
export const TEXTUNDERLINE = 'text_';
export const TITLE = 'title';
export const SELECTED = 'selected';
export const LEVELUNDERLINE = 'level_';

// 拖动过程中分组字段拖动的type值
export const DRAG_ITEM_GROUPFIELD = 'drag_item_group_field';
// 拖动过程中导航条件拖动的type值
export const DRAG_NAVIGATE_RECORD = 'drag_navigate_record';

// 导航条件改变以后，多少毫秒刷新数据
export const NAVIGATE_CHECK_CHANGE_DELAY = 1500;

// 导航记录中记录数的字段
export const NAVIGATE_RECORD_COUNT_FIELD = 'jf7f3905091f04dfb37b421e1e6ec';

// 可进行行内拖动的ROW
export const DRAGABLE_BODY_ROW = 'DragableBodyRow';

// 搜索结果为未找到
export const NO_MATCH = 1000;
export const MATCH_FIRST_POS = '_mfp';

// sqlt参数改变
export const ACT_SQLPARAM_CHANGE = 'dataminingsqlparamchange';

// 新增数据分析方案
export const ACT_ADD_SCHEME = 'adddataminingscheme';
// 保存数据分析方案
export const ACT_EDIT_SCHEME = 'editdataminingscheme';
// 删除数据分析方案
export const ACT_DELETE_SCHEME = 'deletedataminingscheme';

// 数据分析参数设置
export const ACT_SETTING_CHANGE = 'dataminingsettingchange';
// 数据分析导出参数设置
export const ACT_DATAMINING_EXPORT_SETTING_CHANGE = 'dataminingexportsettingchange';
// 在列上进行了排序操作
export const ACT_SORT_CHANGE = 'sortchange';

export const ACT_NAVIGATE_ADD_GROUP = 'addNavigateGroup';
export const ACT_NAVIGATE_REMOVE_GROUP = 'removeNavigateGroup';
export const ACT_NAVIGATE_ACTIVETAB_CHANGE = 'navigateactivetabchange';
export const ACT_NAVIGATE_FETCH_DATA = 'fetchNavigateData';
export const ACT_NAVIGATE_EXPAND = 'navigateExpand';
export const ACT_NAVIGATE_SELECTED = 'navigateSelected';
export const ACT_NAVIGATE_CHECKED = 'navigateChecked';
export const ACT_NAVIGATE_AFTER_CHANGE = 'afterNavigateChange';
export const ACT_NAVIGATE_ROW_EXPAND = 'navigaterowexpand';

export const ACT_FETCH_LOADING_CHANGED = 'fetchLoadingChanged';
export const ACT_MONETARY_CHANGED = 'monetaryChanged';

export const ACT_TOGGLE_GROUP_REGION = 'toggleGroupRegion';
export const ACT_TOGGLE_FILTER_REGION = 'toggleFilterRegion';
export const ACT_TOGGLE_NAVIGATE_REGION = 'toggleNavigateRegion';

export const ACT_SELECTED_ROWKEYS_CHANGED = 'selectedRowKeysChanged';
// 行折叠或展开，以及设置展开所有和折叠所有
export const ACT_DATAMINING_EXPAND_CHANGED = 'dataminingexpandChanged';
// 取消当前数据分析方案的所有操作，只保留根节点
export const ACT_CLEAR_ALL_ROWEXPAND = 'clearAllRowExpand';
// 取消当前数据分析方案的所有字段的展开方案
export const ACT_CLEAR_ALL_COLUMN_EXPAND = 'clearAllColumnExpand';
export const ACT_DELETE_ROWGROUP_FROM_INDEX = 'deleteRowGroupFromIndex';

export const ACT_FILTER_DATASOURCE_UPDATE = 'filterDataSourceUpdate';
export const ACT_UPDATE_DATAMINING_SCHEMEINFO = 'updateSchemeInfo';
export const ACT_DATAMINING_FETCH_SCHEMES = 'dataminingfetchSchemes';
export const ACT_DATAMINING_CHANGE_SCHEME = 'dataminingchangeScheme';
export const ACT_DATAMINING_FETCHDATA = 'dataminingfetchData';

export const ACT_FIELD_GROUP_UPDATE = 'fieldgroupupdate';

// 总计的聚合字段固定显示在最左边的转换
export const ACT_FIELD_GROUP_FIXED_LEFT_TOGGLE = 'fieldgroupfixedlefttoggle';
// 增加一个已经定义好的聚合字段
export const ACT_FIELD_GROUP_ADD = 'fieldgroupadd';
// 删除一个聚合字段
export const ACT_FIELD_GROUP_REMOVE = 'fieldgroupremove';
// 聚合字段在分组中是否显示的转换
export const ACT_FIELD_GROUP_HIDDEN_IN_TOGGLE = 'fieldgrouphiddenintoggle';
export const ACT_COLUMN_GROUP_UPDATE = 'columngroupupdate';

// 修改表头项目文字说明,不包括聚合字段
export const ACT_COLUMN_GROUP_EDIT_TEXT = 'columngroupedittext';

// 表头上点击按钮进行了隐藏或展开显示的操作
export const ACT_COLUMN_GROUP_REST_VISIBLE_TOGGLE = 'columngrouprestvisibletoggle';

// 取消所有选中的表头分组
export const ACT_COLUMN_GROPU_DESELECTEDALL = 'columngroupdeselectall';

// 删除当前列或选中列（可保留子节点）
export const ACT_COLUMN_GROUP_REMOVE = 'columngroupremove';

// 显示或隐藏当前列
export const ACT_COLUMN_GROUP_VISIBLE_TOGGLE = 'columngroupvisibletoggle';

// 选中或者取消选择当前分组
export const ACT_COLUMN_GROUP_SELECTED_TOGGLE = 'columngroupselectetoggle';

// 合并选中的分组（可保留子节点）
export const ACT_COLUMN_GROUP_COMBINE_SELECTED = 'columngroupcombineselected';
