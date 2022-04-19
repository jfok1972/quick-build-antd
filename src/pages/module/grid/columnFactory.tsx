/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { Key } from 'react';
import moment from 'moment';
import { Tooltip, Button, Input, Popover, Select, Divider, Radio, DatePicker, message } from 'antd';
import {
  PaperClipOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  AuditOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { apply, applyIf, applyOtherSetting } from '@/utils/utils';
import type { Dispatch } from 'redux';
import type {
  ModuleModal,
  ModuleFieldType,
  ColumnFilterInfoType,
  ModuleState,
  TextValue,
  GridOperateType,
} from '../data';
import { getSortOrder } from './sortUtils';
import {
  nameFieldRender,
  booleanRenderer,
  dateRender,
  datetimeRender,
  directionaryFieldRender,
  manyToOneFieldRender,
  imageRender,
  oneToManyFieldRender,
  integerRender,
  floatRender,
  percentRender,
  monetaryRender,
  manyToManyFieldRender,
  treeNodePinFieldRender,
  rateRender,
  iconClsRender,
  stringRenderer,
  percentRenderWithTooltip,
} from './columnRender';
import {
  getColumnFilterValue,
  getBooleanFilterOption,
  getStringColumnFilterValue,
  getNumberColumnFilterValue,
  getColumnFilterInfo,
  NumberFilterSelectOption,
  getDateColumnFilterValue,
} from './filterUtils';
import { getDictionaryData } from '../dictionary/dictionarys';
import {
  getModuleInfo,
  getModuleComboDataSource,
  addParentAdditionField,
  getFieldDefine,
} from '../modules';
import { attachemntRenderer } from '../attachment/utils';
import { getMonetarysValueText } from './monetary';
import { DateFormat, getModuleNameFromOneToMany } from '../moduleUtils';
import { approveRenderer, approveVActRuTaskRenderer } from '../approve/utils';
import { DateSectionQuickSelect } from '../UserDefineFilter/dateSectionQuickSelect';
import { getBusinessColumnRender } from './columnBusinessRender';
import { auditRenderer } from '../audit/utils';
import { getActionColumn } from './actions';
import { RECNOUNDERLINE } from '../constants';

const moduleExportGridColumnDefine: Record<Key, object> = {};

export const getCurrentExportGridColumnDefine = (moduleName: string) => {
  return moduleExportGridColumnDefine[moduleName];
};

const getExportGridColumns = (items: any[]) => {
  const regexp = new RegExp('<[^>]*>', 'gm'); // 把所有的超文本标记全部删掉
  const result: any[] = [];
  items.forEach((item: any) => {
    const t = item.originText || item.menuText || item.text;
    const column: any = {
      text: t ? t.replace(regexp, '') : '',
      gridFieldId: item.gridFieldId,
    };
    if (item.hidden) column.hidden = true;
    // 如果ActionColumn需要导出，则设置isExport:true
    if (!item.children || (item.dataIndex && item.isExport)) {
      column.dataIndex = item.dataIndex;
      if (item.manytooneNameName) column.dataIndex = item.manytooneNameName;
      if (item.fieldDefine && item.fieldDefine.fDictionaryid) column.dataIndex += '_dictname';
      column.ismonetary = item.fieldDefine && item.fieldDefine.ismonetary;
      column.unittext = item.fieldDefine && item.fieldDefine.unittext;
      if (item.isOneToMany) column.unittext = '条';
    } else {
      column.items = getExportGridColumns(item.children);
      if (column.items.length === 0) delete column.items;
    }
    if ((column.dataIndex || column.items) && !item.hidden && column.dataIndex !== RECNOUNDERLINE)
      result.push(column);
  });
  return result;
};

export const getSubTotalFields = (items: any[], namefield: string) => {
  const result: any[] = [];
  const genFields = (fields: any[]) => {
    fields.forEach((item: any) => {
      if (item.children) {
        genFields(item.children);
      } else if (
        item.dataIndex &&
        item.fieldDefine &&
        !item.gridField.disableTotal &&
        (item.fieldDefine.allowsummary || item.isOneToMany)
      )
        result.push(item);
      else if (item.dataIndex === namefield)
        result.push({
          namefield: true,
        });
      else result.push(null);
    });
  };
  genFields(items);
  return result;
};

export const getLockedLeftColumns = (
  moduleInfo: ModuleModal,
  moduleState: ModuleState,
  dispatch: Dispatch<any>,
) => {
  const columns = [];
  // if (false) {
  //   columns.push({
  //     title: <Tooltip title="记录顺序号"><BarsOutlined /></Tooltip>,
  //     className: styles.numberalignright,
  //     dataIndex: '__recno__',
  //     key: '__recno__',
  //     width: 60,
  //     fixed: 'left',
  //   })
  // }
  // 是否有附件，有附件则加入附件按钮
  if (moduleInfo.moduleLimit.hasattachment && moduleInfo.userLimit.attachment?.query)
    columns.push({
      title: (
        <Tooltip title="附件">
          <PaperClipOutlined />
        </Tooltip>
      ),
      // sorter: moduleState.sortMultiple,
      sortOrder: getSortOrder(moduleState.sorts, 'attachmentcount'),
      sorter: true,
      width: 66,
      dataIndex: 'attachmentcount',
      menuText: '附件个数',
      key: 'attachmentcount',
      align: 'center',
      fixed: 'left',
      render: (value: any, record: Object, _recno: number) =>
        attachemntRenderer({ record, _recno, moduleInfo, dispatch }),
    });
  // 是否模块具有审批功能
  if (moduleInfo.moduleLimit.hasapprove) {
    // 四合一的审批按钮
    columns.push({
      title: (
        <Tooltip title="审批流程">
          <AuditOutlined />
        </Tooltip>
      ),
      dataIndex: 'actProcState',
      align: 'center',
      key: 'approvecolumn',
      menuText: '审批状态',
      fixed: 'left',
      render: (value: any, record: Object, _recno: number) =>
        moduleState.moduleName === 'VActRuTask'
          ? // 如果是待办事项的模块
            approveVActRuTaskRenderer({ value, record, _recno, moduleState, dispatch })
          : approveRenderer({ value, record, _recno, moduleState, dispatch }),
    });
  }
  // 是否模块具有审核功能
  if (moduleInfo.moduleLimit.hasaudit) {
    columns.push({
      title: (
        <Tooltip title="审核信息">
          <CheckCircleOutlined />
        </Tooltip>
      ),
      dataIndex: 'auditingName',
      key: 'auditcolumn',
      menuText: '审核信息',
      fixed: 'left',
      align: 'center',
      render: (value: any, record: Object, _recno: number) =>
        auditRenderer({ value, record, _recno, moduleState, dispatch }),
    });
  }
  return columns;
};

// additionFieldname:"count.UCity.numbervalue.with.UProvince"
// additionObjectname:"UCity"
// aggregate:"count"
// columnid:"402828e5588237fd01588245f20c0009"
// defaulttitle:"市(省份)--numbervalue--计数"
// fieldahead:"UCity.with.UProvince"
// fieldid:"40288ffd581e94f701581e95091d003c"
// orderno:10
const addChildAdditionField = (columnfield: any) => {
  const pmoduleName = columnfield.additionObjectname;
  const additionModuleInfo = getModuleInfo(pmoduleName);
  const additionField = getFieldDefine(columnfield.fieldid, additionModuleInfo);
  const field: any = {
    fieldname: columnfield.additionFieldname,
    fieldtitle: columnfield.defaulttitle,
    fieldid: columnfield.fieldid,
    aggregate: columnfield.aggregate,
  };
  applyIf(field, additionField);
  if (field.aggregate === 'count') {
    field.fieldtype = 'Integer';
    field.ismonetary = false;
  }
  // if (!me.getFieldDefineWithName(field.fieldname)) {
  //   me.fDataobject.fDataobjectfields.push(field);
  //   const modelFields = app.view.platform.module.model.GridModelFactory.getField(field);
  //   for (let i in modelFields) {
  //     modelFields[i].persist = false;
  //     me.model.addFields([modelFields[i]])
  //   }
  // }
  return field;
};

const getMenuText = (fieldDefine: any, gridField: any) => {
  let result = gridField.title || fieldDefine.fieldtitle;
  if (fieldDefine.unittext) result += `(${fieldDefine.unittext})`;
  return result.replace(new RegExp('--', 'gm'), '');
};

let searchInput: any = null;
const getStringColumnSearchProps = (dataIndex: any, fieldDefine: any) => ({
  filterDropdown: ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
  }: {
    setSelectedKeys: any;
    selectedKeys: any;
    confirm: any;
    clearFilters: any;
  }) => (
    <div style={{ padding: 8 }}>
      <Input
        ref={(node) => {
          searchInput = node;
        }}
        placeholder={`搜索 ${fieldDefine.fieldtitle}`}
        value={selectedKeys[0]}
        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
        onPressEnter={() => confirm()}
        style={{ width: 188, marginBottom: 8, display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button disabled={!selectedKeys[0]} type="link" onClick={() => clearFilters()} size="small">
          重置
        </Button>
        <Button type="primary" onClick={() => confirm()} size="small" style={{ marginLeft: 8 }}>
          确定
        </Button>
      </div>
    </div>
  ),
  filterIcon: (filtered: boolean) => (
    <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
  ),
  onFilterDropdownVisibleChange: (visible: boolean) => {
    if (visible) {
      setTimeout(() => searchInput.select());
    }
  },
});

const { Option } = Select;

const getNumberColumnSearchProps = (
  dataIndex: any,
  fieldDefine: ModuleFieldType,
  moduleState: ModuleState,
  dispatch: Dispatch,
) => ({
  filterDropdown: ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
  }: {
    setSelectedKeys: any;
    selectedKeys: any;
    confirm: any;
    clearFilters: any;
  }) => (
    <>
      <div style={{ padding: 8 }}>
        <span>
          <Input.Group compact>
            <Select
              value={selectedKeys[0] ? selectedKeys[0] : '='}
              onChange={(e) => setSelectedKeys([e, selectedKeys[1]])}
              style={{ width: 90 }}
            >
              {NumberFilterSelectOption.map((item) => (
                <Option key={item.value} value={item.value}>
                  {item.text}
                </Option>
              ))}
            </Select>
            <Input
              ref={(node) => {
                searchInput = node;
              }}
              placeholder={`搜索 ${fieldDefine.fieldtitle}`}
              value={selectedKeys[1]}
              // 前面一个是符号，后面一个是值，如果数组只有一个，那么就表示未选择值
              onChange={(e) =>
                setSelectedKeys(
                  e.target.value ? [selectedKeys[0], e.target.value] : [selectedKeys[0]],
                )
              }
              onPressEnter={() => confirm()}
              style={{ width: 188, marginBottom: 8, marginRight: 6 }}
            />
            <Popover
              trigger="click"
              title="数值字段筛选说明"
              content={
                <div>
                  <b>列表</b>可以多值，以逗号分隔：
                  <br />
                  例如：100,200,300 表示等于以上三值的数据；
                  <br />
                  <b>列表外</b>可以多值，以逗号分隔：
                  <br />
                  例如：100,200,300 表示不等于以上三值的数据；
                  <br />
                  <b>区间</b>以二个数值用逗号分隔：
                  <br />
                  例如：100,1000 表示 &gt;=100 并且 &lt;=1000；
                  <br />
                  <b>区间外</b>以二个数值用逗号分隔：
                  <br />
                  例如：100,1000 表示&gt;100 或者 &lt;1000；
                </div>
              }
            >
              <a>
                <InfoCircleOutlined style={{ margin: 8 }} />
              </a>
            </Popover>
          </Input.Group>
        </span>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Button
            disabled={!selectedKeys[1]}
            type="link"
            onClick={() => clearFilters()}
            size="small"
          >
            重置
          </Button>
          <Button type="primary" onClick={() => confirm()} size="small" style={{ marginLeft: 8 }}>
            确定
          </Button>
        </div>
      </div>
      {fieldDefine.ismonetary ? (
        <span>
          <Divider style={{ margin: '3px 0px' }} />
          <div style={{ padding: '10px' }}>
            数值单位：
            <Radio.Group
              value={moduleState.monetary.type}
              onChange={(e: any) => {
                dispatch({
                  type: 'modules/monetaryChanged',
                  payload: {
                    moduleName: moduleState.moduleName,
                    monetaryType: e.target.value,
                  },
                });
              }}
            >
              {getMonetarysValueText().map((rec: TextValue) => (
                <Radio.Button key={rec.value} value={rec.value}>
                  {rec.text}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
          <div style={{ padding: '10px' }}>
            显示位置：
            <Radio.Group
              value={moduleState.monetaryPosition}
              onChange={(e: any) => {
                dispatch({
                  type: 'modules/monetaryChanged',
                  payload: {
                    moduleName: moduleState.moduleName,
                    position: e.target.value,
                  },
                });
              }}
            >
              <Radio.Button value="behindnumber">显示在数值后</Radio.Button>
              <Radio.Button value="columntitle">显示在列头上</Radio.Button>
            </Radio.Group>
          </div>
        </span>
      ) : null}
    </>
  ),
  filterIcon: (filtered: boolean) => (
    <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
  ),
  onFilterDropdownVisibleChange: (visible: boolean) => {
    if (visible) {
      setTimeout(() => searchInput.select());
    }
  },
});

const { RangePicker } = DatePicker;

const getDateColumnSearchProps = () => ({
  filterDropdown: ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
  }: {
    setSelectedKeys: any;
    selectedKeys: any;
    confirm: any;
    clearFilters: any;
  }) => (
    <div style={{ padding: 8, width: '300px' }}>
      <div style={{ marginBottom: 8, display: 'block' }}>
        <DateSectionQuickSelect
          callback={(value: any) =>
            setSelectedKeys([value[0].format(DateFormat), value[1].format(DateFormat)])
          }
        />
        <RangePicker
          allowEmpty={[true, true]}
          picker="date"
          style={{ flex: 1 }}
          format={DateFormat}
          value={[
            selectedKeys[0] ? moment(selectedKeys[0], DateFormat) : null,
            selectedKeys[1] ? moment(selectedKeys[1], DateFormat) : null,
          ]}
          onChange={(dates: any, dateStrings: [string, string]) => setSelectedKeys(dateStrings)}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button disabled={!selectedKeys[0]} type="link" onClick={() => clearFilters()} size="small">
          重置
        </Button>
        <Button type="primary" onClick={() => confirm()} size="small" style={{ marginLeft: 8 }}>
          确定
        </Button>
      </div>
    </div>
  ),
  filterIcon: (filtered: boolean) => (
    <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
  ),
});

const setFieldxtype = (
  thisfield: any,
  fieldtype: string,
  moduleState: ModuleState,
  filterInfo: ColumnFilterInfoType,
  dispatch: Dispatch,
) => {
  const columnFilterInfo = filterInfo;
  const field = thisfield;
  if (!field.fieldDefine.aggregate)
    switch (fieldtype) {
      case 'image':
        apply(field, {
          render: (value: string, record: Object, recno: number) =>
            imageRender(value, record, recno, field),
          align: 'center',
          width: 100,
          sorter: false,
        });
        break;
      case 'date':
        apply(field, {
          align: 'center',
          render: (value: string, record: Object, recno: number) =>
            dateRender(value, record, recno, field.isShortYear),
        });
        columnFilterInfo.type = 'date';
        field.filteredValue = getDateColumnFilterValue(moduleState.filters.columnfilter, field.key);
        apply(field, getDateColumnSearchProps());
        break;
      case 'datetime':
      case 'timestamp':
        apply(field, {
          align: 'center',
          render: (value: string, record: Object, recno: number) =>
            datetimeRender(
              value,
              record,
              recno,
              field.fieldDefine.disableSecond,
              field.isShortYear,
            ),
        });
        columnFilterInfo.type = 'date';
        field.filteredValue = getDateColumnFilterValue(moduleState.filters.columnfilter, field.key);
        apply(field, getDateColumnSearchProps());
        break;
      case 'boolean':
        field.align = 'center';
        field.render = booleanRenderer;
        field.filters = getBooleanFilterOption(field.fieldDefine.isrequired);
        field.filteredValue = getColumnFilterValue(moduleState.filters.columnfilter, field.key);
        columnFilterInfo.type = 'combobox';
        columnFilterInfo.comboValue = field.filters;
        break;
      case 'integer':
        if (field.fieldDefine.isRate) {
          apply(field, {
            render: rateRender,
          });
        } else {
          apply(field, {
            align: 'right',
            render: integerRender,
          });
        }
        break;
      case 'money':
      case 'double':
      case 'float':
        if (field.fieldDefine.isRate) {
          apply(field, {
            render: rateRender,
          });
        } else {
          apply(field, {
            align: 'right',
            render: (value: number) => floatRender(value, field.fieldDefine.digitslen),
          });
          if (field.fieldDefine.ismonetary) {
            field.render = (value: number, record: object, _recno: number) =>
              monetaryRender(value, record, _recno, moduleState, field.fieldDefine.digitslen);
          }
        }
        break;
      case 'percent':
        apply(field, {
          render: percentRender,
          align: 'center',
        });
        // 是否是加权平均，是的话，tooltip中显示分子/分母
        if (field.fieldDefine.divisor) {
          field.render = (value: number, record: any) =>
            percentRenderWithTooltip(
              value,
              record && record[field.fieldDefine.divisor],
              record && record[field.fieldDefine.denominator],
            );
        }
        break;
      case 'blob':
        field.sorter = false;
        break;
      case 'string': {
        field.render = (value: string) => stringRenderer(value, field);
        break;
      }
      default:
    }

  switch (fieldtype) {
    case 'percent':
    case 'money':
    case 'double':
    case 'float':
    case 'integer':
      columnFilterInfo.type = 'number';
      field.filteredValue = getNumberColumnFilterValue(moduleState.filters.columnfilter, field.key);
      apply(
        field,
        getNumberColumnSearchProps(field.dataIndex, field.fieldDefine, moduleState, dispatch),
      );
      break;
    default:
  }
};

const buildTextAndUnit = (field: any, moduleState: ModuleState) => {
  const me = field;
  const { unittext } = me.fieldDefine;
  let result = me.gridField.title || me.fieldDefine.fieldtitle;
  result = result.replace(new RegExp('--', 'gm'), '<br/>'); // title中间有--表示换行
  me.originText = result;
  result = result.replace('小计', '<span style="color : green;">小计</span>');
  if (me.fieldDefine.ismonetary && moduleState.monetaryPosition === 'columntitle') {
    // 可能选择金额单位千,
    // 万,百万, 亿
    const { monetary } = moduleState;
    const monetaryunittext = monetary.unittext === '个' ? '' : monetary.unittext;
    if (unittext || monetaryunittext)
      result += `<br/><span style="color:green;">(${monetaryunittext}${unittext || ''})</span>`;
  } else if (unittext) result += `<br/><span style="color:green;">(${unittext})</span>`;

  me.title = `<div style="text-align:center;">${result}</div>`;
};

/**
 * 根据groupField,fieldDefine的定义，生成一个column的定义
 */
const getColumn = ({
  gridField,
  fieldDefine,
  moduleInfo,
  moduleState,
  dispatch,
  gridType,
}: {
  gridField: any;
  fieldDefine: ModuleFieldType;
  moduleInfo: ModuleModal;
  moduleState: ModuleState;
  dispatch: Dispatch;
  gridType: GridOperateType;
}) => {
  // 如果在某种 gridType中不显示该列,可以设置成  disableGridType:'onetomanygrid',disableGridType:['a','b']
  if (gridField.disableGridType) {
    const gt = gridField.disableGridType;
    if (typeof gt === 'string' && gt === gridType) {
      return null;
    }
    if (Array.isArray(gt)) {
      for (let i = 0; i < gt.length; i += 1) {
        if (gt[i] === gridType) return null;
      }
    }
  }
  // 如果是onetomanygrid，如果是父模块的字段，则不用显示了
  if (
    gridType === 'onetomanygrid' &&
    fieldDefine.fieldname === moduleState.filters.parentfilter?.fieldahead
  ) {
    return null;
  }
  // 要分成三种情况来行成列了。基本字段,manytoone，onetomany字段，
  const field: any = {
    maxWidth: gridField.maxwidth || 600,
    fieldDefine,
    gridField,
    gridFieldId: gridField.columnid, // 加上这个属性，用于在列改变了宽度过后，传到后台
    sorter: moduleState.sortMultiple,
    menuText: getMenuText(fieldDefine, gridField),
    dataIndex: fieldDefine.fieldname,
    key: fieldDefine.fieldname,
    hidden: gridField.hidden,
    groupable: !!fieldDefine.allowgroup,
    showDetailTip: gridField.showdetailtip,
  };
  if (gridField.columnwidth) {
    field.width = `${gridField.columnwidth}px`;
  }
  if (gridField.locked) field.fixed = 'left';
  let columnFilterInfo: ColumnFilterInfoType = getColumnFilterInfo(
    moduleInfo.modulename,
    field.dataIndex,
  );
  apply(columnFilterInfo, { title: field.menuText, type: 'string' });
  setFieldxtype(
    field,
    fieldDefine.fieldtype.toLowerCase(),
    moduleState,
    columnFilterInfo,
    dispatch,
  );
  if (fieldDefine.fDictionaryid) {
    field.groupable = true;
    field.render = (value: any, record: object, recno: number) =>
      directionaryFieldRender(value, record, recno, { fieldname: fieldDefine.fieldname });
    field.filters = getDictionaryData(fieldDefine.fDictionaryid);
    field.filteredValue = getColumnFilterValue(
      moduleState.filters.columnfilter,
      fieldDefine.fieldname,
    );
    columnFilterInfo.comboValue = field.filters;
    columnFilterInfo.type = 'dictionary';
  }
  if (fieldDefine.tooltiptpl) {
    field.tooltiptpl = fieldDefine.tooltiptpl; // 显示在字段值上的tooltip的tpl值
    // field.tooltipXTemplate = new Ext.XTemplate(fieldDefine.tooltiptpl);
  }
  if (moduleInfo.namefield === fieldDefine.fieldname) {
    field.render = (value: any, record: object, recno: number) =>
      nameFieldRender(value, record, recno, { moduleInfo, dispatch, field });
  }
  if (field.dataIndex === 'iconcls') {
    field.render = (value: any) => iconClsRender(value);
  }
  if (gridField.flex) {
    field.flex = gridField.flex;
    delete field.maxWidth;
  }
  if (fieldDefine.isManyToOne || fieldDefine.isOneToOne) {
    const fn = fieldDefine.manyToOneInfo.nameField;
    field.dataIndex = fn;
    field.manytooneIdName = fieldDefine.manyToOneInfo.keyField;
    field.manytooneNameName = fieldDefine.manyToOneInfo.nameField;

    field.sorter = moduleState.sortMultiple;
    field.sortOrder = getSortOrder(moduleState.sorts, fn);
    const pModuleInfo = getModuleInfo(fieldDefine.fieldtype);
    field.render = (value: any, record: object, recno: number) =>
      manyToOneFieldRender(value, record, recno, {
        moduleInfo: pModuleInfo,
        keyField: fieldDefine.manyToOneInfo.keyField,
        field,
        dispatch,
      });
    if (pModuleInfo.selectedmode === '10' || pModuleInfo.selectedmode === '95') {
      // // 如果pmodule的被选择方式是只能下拉选择或在radiobutton中选择，那么就可以单个选择，否则都是和textfield一样
      field.key = fieldDefine.manyToOneInfo.keyField; // key用于生成grid查找字段，这个是查primary字段,in
      field.filters = getModuleComboDataSource(fieldDefine.fieldtype);
      field.filteredValue = getColumnFilterValue(moduleState.filters.columnfilter, field.key);
      columnFilterInfo = getColumnFilterInfo(moduleInfo.modulename, field.key);
      columnFilterInfo.title = field.menuText;
      columnFilterInfo.type = 'combobox';
      columnFilterInfo.comboValue = field.filters;
    } else {
      field.key = field.dataIndex; // key用于生成grid查找字段，这个是查namefield字段,like
      apply(field, getStringColumnSearchProps(field.dataIndex, fieldDefine));
      field.filteredValue = getColumnFilterValue(moduleState.filters.columnfilter, field.dataIndex);
      columnFilterInfo = getColumnFilterInfo(moduleInfo.modulename, field.dataIndex);
      columnFilterInfo.title = field.menuText;
    }
  }
  if (fieldDefine.isOneToMany) {
    field.isOneToMany = true;
    let ft = fieldDefine.fieldtype;
    ft = ft.substring(ft.indexOf('<') + 1, ft.indexOf('>'));
    field.childModuleName = ft;
    field.fieldahead = fieldDefine.fieldahead;
    field.align = 'right';
    columnFilterInfo.type = 'number';
    field.filteredValue = getNumberColumnFilterValue(moduleState.filters.columnfilter, field.key);
    apply(
      field,
      getNumberColumnSearchProps(field.dataIndex, field.fieldDefine, moduleState, dispatch),
    );
    field.render = (value: any, record: Object, recno_: number) =>
      oneToManyFieldRender(value, record, recno_, {
        fieldtitle: field.menuText,
        childModuleName: field.childModuleName,
        fieldahead: field.fieldahead,
        moduleInfo,
        dispatch,
        field,
        moduleState,
      });
  }
  if (fieldDefine.aggregate) {
    // filename "count.FUser.userid.with.FPersonnel.FOrganization"
    const fn = fieldDefine.fieldname;
    const parts = fn.split('.with.');
    const childparts = parts[0].split('.');
    // me.aggregate = childparts[0];
    // me.childFieldName = childparts[2];
    // me.fieldahead = childparts[1] + '.with.' + parts[1];
    // me.childModuleName = childparts[1];

    field.isOneToMany = true;
    [, field.childModuleName] = childparts;
    field.fieldahead = `${childparts[1]}.with.${parts[1]}`;
    field.align = 'right';
    columnFilterInfo.type = 'number';
    field.filteredValue = getNumberColumnFilterValue(moduleState.filters.columnfilter, field.key);
    apply(
      field,
      getNumberColumnSearchProps(field.dataIndex, field.fieldDefine, moduleState, dispatch),
    );
    field.render = (value: any, record: Object, recno_: number) =>
      oneToManyFieldRender(value, record, recno_, {
        fieldtitle: field.menuText,
        childModuleName: field.childModuleName,
        dispatch,
        fieldahead: field.fieldahead,
        moduleInfo,
        field,
        moduleState,
      });
  }

  if (fieldDefine.isManyToMany) {
    field.sorter = false;
    field.dataIndex += '_detail';
    const joinTable = fieldDefine.jointable;
    // 取得joinTable的模块定义
    field.joinModule = getModuleInfo(joinTable || '');
    // manyToMany 另一端的模块名称，模块的字段名为Set<modulename>,或
    // List<module>,利用正则表达式，取得<>之间的内容。
    field.manyToManyModuleName = getModuleNameFromOneToMany(fieldDefine.fieldtype);
    field.manyToManyModuleInfo = getModuleInfo(field.manyToManyModuleName);
    field.manyToManyModuleTitle = getModuleInfo(field.manyToManyModuleName).title;
    field.render = (value: any, record: Object, recno_: number) =>
      manyToManyFieldRender(value, record, recno_, {
        moduleName: field.manyToManyModuleName,
        dispatch,
      });

    delete field.filter;
  }
  applyOtherSetting(field, fieldDefine.gridcolumnset);
  applyOtherSetting(field, gridField.othersetting);
  buildTextAndUnit(field, moduleState);
  if (field.render === null) delete field.render;

  if (field.sorter) field.sortOrder = getSortOrder(moduleState.sorts, field.key);

  field.text = field.title;
  /* eslint-disable */
  field.title = (
    <span style={{ whiteSpace: 'nowrap' }} dangerouslySetInnerHTML={{ __html: field.title }} />
  );
  /* eslint-enable */
  // 设置了title是一个icon
  if (gridField.titleIconCls) {
    field.title = (
      <Tooltip title={field.menuText}>
        <span className={gridField.titleIconCls} />
      </Tooltip>
    );
    field.align = 'center';
  }
  if (!field.filters && fieldDefine.fieldtype.toLowerCase() === 'string') {
    apply(field, getStringColumnSearchProps(field.dataIndex, fieldDefine));
    field.filteredValue = getStringColumnFilterValue(moduleState.filters.columnfilter, field.key);
    columnFilterInfo.type = 'string';
  }

  // 如果在grid字段中配置了columnRender ,那么可以自定义render方法
  if (gridField.columnRender) {
    field.columnRender = gridField.columnRender;
    /* eslint-disable */
    field.render = (value: any, record: Object, recno_: number) => (
      <span dangerouslySetInnerHTML={{ __html: field.columnRender(value, record, recno_) }} />
    );
    /* eslint-enable */
  }

  if (field.allowPin) {
    field.render = (value: any, record: Object, recno_: number) =>
      treeNodePinFieldRender(value, record, recno_, { moduleState, dispatch });
  }

  if (field.disableSorter) field.sorter = false;
  if (field.disableSearch || gridType === 'onetomanygrid') {
    delete field.filterDropdown;
    delete field.filters;
  }

  const BusinessRender = getBusinessColumnRender(moduleState.moduleName, field.dataIndex);
  if (BusinessRender) {
    field.render = (value: any, record: any, recno: number) => (
      <BusinessRender
        {...{
          value,
          record,
          recno,
          dataIndex: field.dataIndex,
          fieldDefine,
          dispatch,
          moduleState,
        }}
      />
    );
  }
  return field;
};

const getGroupAndFieldColumns = ({
  moduleInfo,
  moduleState,
  columns,
  dispatch,
  gridType,
}: {
  moduleInfo: ModuleModal;
  moduleState: ModuleState;
  columns: [];
  dispatch: Dispatch<any>;
  gridType: GridOperateType;
}) => {
  const result = [];
  for (let i = 0; i < columns.length; i += 1) {
    const column: any = columns[i];
    if ((column.columns && column.columns.length) || !column.fieldid) {
      // 没有fieldid就当作合并表头
      if (!column.title) column.title = '';
      const group: any = {
        gridFieldId: column.columnid,
        /* eslint-disable */
        title: (
          <span
            dangerouslySetInnerHTML={{
              __html: column.title.replace(new RegExp('--', 'gm'), '<br/>'),
            }}
          />
        ),
        /* eslint-enable */
        hidden: column.hidden,
        menuText: column.title.replace(new RegExp('--', 'gm'), ''),
        children: getGroupAndFieldColumns({
          moduleState,
          moduleInfo,
          columns: column.columns,
          dispatch,
          gridType,
        }),
      };
      if (column.locked) group.fixed = 'left';
      applyOtherSetting(group, column.othersetting);
      result.push(group);
    } else if (column.fieldahead) {
      // 附加字段
      if (column.aggregate) {
        const field = addChildAdditionField(column);
        if (field) {
          const gc: any = getColumn({
            moduleState,
            gridField: column,
            fieldDefine: field,
            moduleInfo,
            dispatch,
            gridType,
          });
          if (gc) result.push(gc);
        }
      } else {
        // 父模块中的字段
        const field = addParentAdditionField(moduleInfo, column);
        if (field) {
          const gc = getColumn({
            gridField: column,
            fieldDefine: field,
            moduleInfo,
            moduleState,
            dispatch,
            gridType,
          });
          if (gc) result.push(gc);
        }
      }
    } else {
      const field = getFieldDefine(column.fieldid, moduleInfo);
      if (!field) {
        message.warn(`${JSON.stringify(column)}未找到字段的定义，可能是分组下的字段全被删光了`);
        // eslint-disable-next-line
        continue;
      }
      if (field.ishidden || field.isdisable || field.userdisable)
        // eslint-disable-next-line
        continue; // 隐藏字段和禁用的字段都不放在grid中
      const gc = getColumn({
        gridField: column,
        fieldDefine: field,
        moduleInfo,
        moduleState,
        dispatch,
        gridType,
      });
      if (gc) result.push(gc);
    }
  }
  return result;
};

export const getColumns = ({
  moduleInfo,
  moduleState,
  gridScheme,
  dispatch,
  gridType,
  readOnly,
}: {
  moduleInfo: ModuleModal;
  moduleState: ModuleState;
  gridScheme: any;
  dispatch: Dispatch;
  gridType: GridOperateType;
  readOnly?: boolean;
}): any => {
  const columns: any[] = getLockedLeftColumns(moduleInfo, moduleState, dispatch);
  const result = columns.concat(
    getGroupAndFieldColumns({
      moduleState,
      moduleInfo,
      columns: gridScheme.columns,
      dispatch,
      gridType,
    }),
  );
  moduleExportGridColumnDefine[moduleInfo.modulename] = getExportGridColumns(result);

  if (!readOnly)
    // && moduleName !== 'VActRuTask' && moduleName !== 'VActFinishTask'
    result.push(getActionColumn({ moduleInfo, moduleState, dispatch }));

  return result;
};
