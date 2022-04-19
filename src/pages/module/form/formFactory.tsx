/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useState } from 'react';
import { history } from 'umi';
import {
  InputNumber,
  DatePicker,
  Popover,
  Tabs,
  Space,
  Input,
  Form,
  Checkbox,
  Select,
  Radio,
  Row,
  Col,
  Card,
  TreeSelect,
  Rate,
  AutoComplete,
  Switch,
  Slider,
  Typography,
  Tooltip,
} from 'antd';
import type { Dispatch } from 'redux';
import {
  BlockOutlined,
  DownOutlined,
  RightOutlined,
  ProfileOutlined,
  AuditOutlined,
  FileDoneOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  FormOutlined,
  SelectOutlined,
} from '@ant-design/icons';
import type { FormInstance, Rule } from 'antd/lib/form';
import { apply, getLastLevelLabel, getNumberDigitsFormat } from '@/utils/utils';
import PinyinMatch from 'pinyin-match';
import type {
  ModuleModal,
  ModuleFieldType,
  FormOperateType,
  FormShowType,
  TextValue,
  ParentFilterModal,
  ModuleState,
} from '../data';
import { getDictionary, getPropertys } from '../dictionary/dictionarys';

import {
  getModuleInfo,
  getModuleComboDataSource,
  getModulTreeDataSource,
  getFieldDefine,
  addParentAdditionField,
  addChildAdditionField,
  getModulTreePathDataSource,
  getFormSchemeFormType,
} from '../modules';
import styles from './formFactory.less';
import {
  DateFormat,
  DateTimeFormat,
  DateTimeFormatWithOutSecond,
  getModuleNameFromOneToMany,
} from '../moduleUtils';
import { ManyToOneRemote } from './field/manyToOneRemote';
import DetailGrid from '../detailGrid';
import { getApproveSteps, isStartProcess, canApprove } from '../approve/utils';
import { ApproveForm } from '../approve/approvePanel';
import { PopoverDescriptionWithId } from '../descriptions';
import SelectGrid from '../detailGrid/selectGrid';
import ImageField from './field/ImageField';
import { PercentField } from './field/PercentField';
import TagSelect from '../UserDefineFilter/TagSelect';
import OneTowManyTooltip from '../widget/oneTwoManyTooltip';
import { getModuleUrlFormSysMenu } from '@/layouts/BasicLayout';
import { JsonField } from './field/JsonField';
import TreeCascader from './field/TreeCascader';

const numeral = require('numeral');

const FormItem = Form.Item;
const { TabPane } = Tabs;

let fieldsetVisible = {}; // 存放所有可折叠面版的折叠属性
// eslint-disable-next-line
styles._;
interface FormSchemePanelProps {
  moduleInfo: ModuleModal;
  moduleState: ModuleState;
  callback?: Function; // 窗口关闭时的回调
  form: FormInstance;
  currRecord: any;
  showType: FormShowType;
  formType: FormOperateType;
  readOnly: boolean;
  details: any[];
  parentCols: number; // 父panel的分栏数,如果为0则不分栏
  fieldsValidate: any;
  dispatch: Dispatch;
  setV: Function;
  requiredMark: boolean;
}

const getFieldName = (field: ModuleFieldType, readOnly: boolean | undefined = undefined) => {
  if (field.isManyToOne || field.isOneToOne)
    return readOnly ? field.manyToOneInfo.nameField : field.manyToOneInfo.keyField;
  if (field.fDictionaryid && readOnly) return `${field.fieldname}_dictname`;
  return field.fieldname;
};

const ManyToOneSelectPopover = ({
  fieldDefine,
  form,
}: {
  fieldDefine: ModuleFieldType;
  form: any;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <Popover
      trigger="click"
      visible={visible}
      onVisibleChange={(v) => setVisible(v)}
      overlayClassName="manytoonepopover"
      overlayStyle={{
        width: '80%',
        maxHeight: `${document.body.clientHeight - 200}px`,
        overflow: 'auto',
      }}
      content={
        <SelectGrid
          manyToOneInfo={{
            form,
            setTextValue: (value: TextValue) => {
              const changedfields = {
                [getFieldName(fieldDefine)]: value.value,
                [getFieldName(fieldDefine, true)]: value.text,
              };
              form.setFieldsValue(changedfields);
              form.onValuesChange(changedfields, form.getFieldsValue());
              setVisible(false);
            },
          }}
          moduleName={fieldDefine.fieldtype}
        />
      }
    >
      <SearchOutlined />
    </Popover>
  );
};

// 生成formField时的属性
export interface FormFieldProps {
  moduleInfo: ModuleModal;
  name: string;
  form: any;
  fieldDefine: ModuleFieldType;
  formFieldDefine: any;
  fieldProps: any;
  currRecord: any;
  dispatch: Dispatch;
}

/**
 * 字段设置了propertyValue属性，字段可以选择一些值，并且也可以录入新的值，新的值不会在以后的选择里
 * @param param0
 */
const getPropertyValueInput: React.FC<FormFieldProps> = ({ fieldDefine, fieldProps }) => {
  if (fieldProps.readOnly) {
    return <Input {...fieldProps} />;
  }
  const options = fieldDefine.propertyvalue?.split(',').map((text, index) => (
    <Select.Option key={`key-${index}`} value={text || ''}>
      {text}
    </Select.Option>
  ));
  return fieldDefine.multiMode ? (
    <Select
      mode={fieldDefine.multiMode}
      tokenSeparators={[',']}
      allowClear
      showSearch
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
    >
      {options}
    </Select>
  ) : (
    <AutoComplete
      {...fieldProps}
      allowClear
      showSearch
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
      filterOption={(input, option: any) => {
        return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
      }}
    >
      {options}
    </AutoComplete>
  );
};

/**
 * 设置了property属性，可以设置一些选择的值，并且可以加入新的。
 * @param param0
 */
const getPropertyInput: React.FC<FormFieldProps> = ({ fieldDefine, fieldProps }) => {
  if (fieldProps.readOnly) {
    return <Input {...fieldProps} />;
  }
  const options = getPropertys(fieldDefine.fPropertyid, fieldDefine.fieldid).map(
    ({ text }, index) => (
      <Select.Option key={`key-${index.toString()}`} value={text || ''}>
        {text}
      </Select.Option>
    ),
  );
  return fieldDefine.multiMode ? (
    <Select
      mode={fieldDefine.multiMode}
      tokenSeparators={[',']}
      allowClear
      showSearch
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
    >
      {options}
    </Select>
  ) : (
    <AutoComplete
      {...fieldProps}
      allowClear
      showSearch
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
      filterOption={(input, option: any) => {
        return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
      }}
    >
      {options}
    </AutoComplete>
  );
};

/**
 * 生成数据字典的选择字段
 * 10	只能下拉选择
 * 20	可录入关键字选择
 * 30	可录入代码和关键字选择      // 显示 代码值-名称
 * 40	在RadioGroup中进行选择
 * 50 在RadioButton中进行选择
 * @param param0
 */
const getDictionaryInput: React.FC<FormFieldProps> = ({
  fieldDefine,
  formFieldDefine,
  fieldProps,
}) => {
  if (fieldProps.readOnly) {
    return <Input {...fieldProps} />;
  }
  const dictionary = getDictionary(fieldDefine.fDictionaryid || '');
  const { inputmethod, data } = dictionary;
  if (inputmethod === '40')
    return (
      <Radio.Group {...fieldProps} buttonStyle="solid">
        {data.map(({ value, text }) =>
          formFieldDefine.radioButton ? (
            <Radio.Button key={`key-${value}`} value={value}>
              {text}
            </Radio.Button>
          ) : (
            <Radio key={`key-${value}`} value={value}>
              {text}
            </Radio>
          ),
        )}
      </Radio.Group>
    );
  if (inputmethod === '50')
    return (
      <Radio.Group {...fieldProps} buttonStyle="solid">
        {data.map(({ value, text }) => (
          <Radio.Button key={`key-${value}`} value={value}>
            {text}
          </Radio.Button>
        ))}
      </Radio.Group>
    );
  return (
    <Select
      {...fieldProps}
      allowClear
      showSearch={inputmethod !== '10'}
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
      filterOption={(input, option: any) => {
        return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
      }}
    >
      {data.map(({ value, text }) => (
        <Select.Option key={`key-${value}`} value={value || ''}>
          {(inputmethod === '30' ? `${value}-` : '') + text}
        </Select.Option>
      ))}
    </Select>
  );
};

// 10	只能下拉选择(local)
// 20	可录入关键字选择(local)
// 30	可录入编码和关键字选择(local)
// 40	可录入关键字选择(remote)
// 50	可录入编码和关键字选择(remote)
// 60	在树形结构中选择
// 70	根据选择路径在树结构中选择
// 71-根据选择路径级联选择
// 80-树形结构级联选择
// 90	在Grid列表中进行选择
// 95	在RadioGroup中进行选择

const getManyToOneInput: React.FC<FormFieldProps> = (params) => {
  const { fieldDefine, currRecord, formFieldDefine, fieldProps, dispatch } = params;
  const { fieldtype, allowParentValue } = fieldDefine;
  const cobject = getModuleInfo(fieldtype);
  // 如果是只读的，那就显示text,在后面显示感叹号，点击可以显示manytoone的信息
  if (fieldProps.readOnly) {
    return (
      <Input
        {...fieldProps}
        suffix={
          <PopoverDescriptionWithId
            id={currRecord[getFieldName(fieldDefine)]}
            moduleInfo={cobject}
            dispatch={dispatch}
          />
        }
      />
    );
  }

  // 父模块及父模块的选择方式
  let mode = cobject.selectedmode;
  // 95	在RadioGroup中进行选择
  if (mode === '95') {
    const radioItems = getModuleComboDataSource(fieldtype).map(({ value, text }) =>
      formFieldDefine.radioButton ? (
        <Radio.Button key={`key-${value}`} value={value}>
          {text}
        </Radio.Button>
      ) : (
        <Radio key={`key-${value}`} value={value}>
          {text}
        </Radio>
      ),
    );
    // 大于30个选项不能用radioGroup了
    if (radioItems.length <= 30)
      return (
        <Radio.Group buttonStyle="solid" {...fieldProps}>
          {radioItems}
        </Radio.Group>
      );
    mode = '20';
  }
  if (mode === '10' || mode === '20' || mode === '30') {
    // 10	只能下拉选择(local)
    // 20	可录入关键字选择(local)
    // 30	可录入编码和关键字选择(local)
    const options = getModuleComboDataSource(fieldtype).map(({ value, text }) => ({
      value,
      label: (mode === '30' ? `${value}-` : '') + text,
    }));
    return (
      <Select
        allowClear
        showSearch={mode !== '10'}
        {...fieldProps}
        options={options}
        getPopupContainer={(triggerNode) => triggerNode.parentNode}
        filterOption={(input, option: any) => {
          return (
            option.label && !!PinyinMatch.match(option.label.toLowerCase(), input.toLowerCase())
          );
        }}
      />
    );
  }
  if (mode === '40' || mode === '41' || mode === '50' || mode === '51') {
    return ManyToOneRemote(params, mode);
  }
  // 60	在树形结构中选择
  if (mode === '60') {
    const arrageTreeNode = (array: any): TextValue[] => {
      return array.map((rec: TextValue) => ({
        value: rec.value || '',
        label: rec.text,
        key: rec.value,
        isLeaf: rec.leaf,
        disabled: !!rec.disabled,
        children:
          rec.children && rec.children.length > 0 ? arrageTreeNode(rec.children) : undefined,
      }));
    };
    const manytooneData = arrageTreeNode(
      getModulTreeDataSource(
        fieldtype,
        !!allowParentValue,
        !!formFieldDefine.addCodeToText,
        !!formFieldDefine.shortName,
      ),
    );
    return (
      <TreeSelect
        {...fieldProps}
        treeDefaultExpandAll
        allowClear
        showSearch
        treeNodeFilterProp="label"
        treeData={manytooneData}
        getPopupContainer={(triggerNode) => triggerNode.parentNode}
      />
    );
  }
  // 70-根据选择路径在树结构中选择,根据当前模块设置的树形选择路径来进行选择。
  // 71-根据选择路径级联选择，必须选到最末级
  if (mode === '70' || mode === '71') {
    const arrageTreeNode = (array: any): TextValue[] => {
      return array.map((rec: TextValue) => ({
        value: rec.objectid || '',
        [mode === '70' ? 'label' : 'text']: rec.text,
        key: rec.objectid,
        isLeaf: rec.leaf,
        // 71 的选择方式不能disabled
        disabled: mode === '70' ? !rec.leaf : false,
        children:
          rec.children && rec.children.length > 0 ? arrageTreeNode(rec.children) : undefined,
      }));
    };
    const manytooneData = arrageTreeNode(getModulTreePathDataSource(fieldtype));
    return mode === '70' ? (
      <TreeSelect
        {...fieldProps}
        treeDefaultExpandAll
        allowClear
        showSearch
        treeNodeFilterProp="label"
        treeData={manytooneData}
        getPopupContainer={(triggerNode) => triggerNode.parentNode}
      />
    ) : (
      <TreeCascader
        {...fieldProps}
        // 这个配置理论上不能设置为true，不可以选择非叶节点
        changeOnSelect={formFieldDefine.changeOnSelect}
        options={manytooneData}
      />
    );
  }
  // 树形结构级联选择
  if (mode === '80') {
    // 级联选择优先使用shortName字段中的值,默认为使用shortName中的值
    const shortName = formFieldDefine.shortName === undefined ? true : !!formFieldDefine.shortName;
    const manytooneData = getModulTreeDataSource(fieldtype, true, false, shortName);
    return (
      <TreeCascader
        {...fieldProps}
        changeOnSelect={formFieldDefine.changeOnSelect}
        options={manytooneData}
      />
    );
  }
  return <></>;
};

/**
 * manytomany的字段的修改，可以checkbox,select,tagSelect
 * @param params
 */
const getManyToManyInput: React.FC<FormFieldProps> = (params) => {
  const { fieldDefine, formFieldDefine, fieldProps } = params;
  if (formFieldDefine.tagSelect) {
    return (
      <TagSelect
        hideCheckAll={!!formFieldDefine.hideCheckAll}
        expandable={formFieldDefine.expandable}
        expand={!formFieldDefine.expandable || formFieldDefine.expand}
      >
        {getModuleComboDataSource(getModuleNameFromOneToMany(fieldDefine.fieldtype)).map(
          (rec: TextValue) => (
            <TagSelect.Option key={rec.value} value={rec.value}>
              {rec.text}
            </TagSelect.Option>
          ),
        )}
      </TagSelect>
    );
  }
  return formFieldDefine.xtype === 'manytomanycheckboxgroup' ? (
    <Checkbox.Group {...fieldProps}>
      {getModuleComboDataSource(getModuleNameFromOneToMany(fieldDefine.fieldtype)).map(
        (rec: any) => (
          <Checkbox key={rec.value} value={rec.value}>
            {rec.text}
          </Checkbox>
        ),
      )}
    </Checkbox.Group>
  ) : (
    <Select
      mode="multiple"
      allowClear
      {...fieldProps}
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
      filterOption={(input, option: any) => {
        return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
      }}
    >
      {getModuleComboDataSource(getModuleNameFromOneToMany(fieldDefine.fieldtype)).map(
        (rec: any) => (
          <Select.Option key={rec.value} value={rec.value} label={rec.label}>
            {rec.text}
          </Select.Option>
        ),
      )}
    </Select>
  );
};

export const getPercentFormField = (digitslen: number, fieldProps: any) => {
  return (
    <InputNumber
      precision={digitslen}
      step={0.01}
      formatter={(value: any) => {
        if (!value) return '';
        let v;
        if (Number.isFinite(value)) v = (value * 100).toFixed(digitslen - 2);
        else {
          const parts = value.split('|||');
          if (parts.length === 2) return `${parts[1]}%`;
          v = (Number.parseFloat(parts[0]) * 100).toFixed(digitslen - 2);
        }
        return `${v}%`;
      }}
      parser={(value: string) => {
        const v = value.replace('%', '');
        const floatvalue = (Number.parseFloat(v) / 100).toFixed(digitslen);
        return `${floatvalue}|||${v}`;
      }}
      style={{ width: '100px' }}
      {...fieldProps}
    />
  );
};

const getFieldInput: React.FC<FormFieldProps> = (props) => {
  const { fieldDefine, formFieldDefine, fieldProps, name } = props;
  const { fieldname } = fieldDefine;
  if (fieldDefine.fDictionaryid) {
    return getDictionaryInput(props);
  }
  if (fieldDefine.propertyvalue) {
    return getPropertyValueInput(props);
  }
  if (fieldDefine.fPropertyid) {
    return getPropertyInput(props);
  }
  if (fieldDefine.fieldrelation) {
    if (fieldDefine.isManyToOne || fieldDefine.isOneToOne) return getManyToOneInput(props);
    if (fieldDefine.isManyToMany) {
      return getManyToManyInput(props);
    }
    if (fieldDefine.isOneToMany) {
      return (
        <InputNumber
          className="integer"
          precision={0}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value: any) => value.replace(/\$\s?|(,*)/g, '')}
          {...fieldProps}
        />
      );
    }
    return <span style={{ color: 'red' }}>未处理的字段：{fieldDefine.fieldtitle}</span>;
  }

  const { fieldtype } = fieldDefine;
  let formField;
  const checkedText = formFieldDefine.checkedText || '是';
  const unCheckedText = formFieldDefine.uncheckedText || '否';
  switch (fieldtype.toLowerCase()) {
    case 'integer':
      if (fieldDefine.isRate) {
        formField = <Rate allowClear {...fieldProps} disabled={fieldProps.readOnly} />;
      } else {
        formField = (
          <InputNumber
            precision={0}
            className="integer"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value: any) => value.replace(/\$\s?|(,*)/g, '')}
            {...fieldProps}
          />
        );
      }
      break;
    case 'money':
    case 'double':
      if (fieldDefine.isRate) {
        formField = <Rate allowHalf allowClear {...fieldProps} disabled={fieldProps.readOnly} />;
      } else {
        formField = (
          <InputNumber
            className="double"
            precision={fieldDefine.digitslen || 2}
            formatter={(value) => {
              if (!value) return '';
              // 在不是焦点的时候才进行转换
              if (document.activeElement!.id !== name) {
                return numeral(value).format(getNumberDigitsFormat(fieldDefine.digitslen || 2));
              }
              return value;
            }}
            {...fieldProps}
          />
        );
      }
      break;
    case 'float':
      if (fieldDefine.isRate) {
        formField = <Rate allowHalf allowClear {...fieldProps} disabled={fieldProps.readOnly} />;
      } else {
        formField = (
          <InputNumber className="double" precision={fieldDefine.digitslen || 2} {...fieldProps} />
        );
      }
      break;
    case 'percent': {
      // 默认是2位小数，百分比就是整数，设置4位小数，百分比小数位置是2位
      const digitslen = Math.max(fieldDefine.digitslen || 2, 2);
      if (formFieldDefine.slider) {
        formField = (
          <Slider
            tipFormatter={(value) => `${parseFloat(((value || 0) * 100).toFixed(digitslen - 2))}%`}
            min={0}
            max={1}
            marks={{ 0: '0%', 1: '100%' }}
            // 最小是0.001,再小无法控制了
            step={digitslen >= 2 ? 0.001 : 0.01}
          />
        );
      } else formField = <PercentField {...fieldProps} digitslen={digitslen} name={name} />;
      break;
    }
    case 'date':
      formField = (
        <DatePicker
          format={DateFormat}
          {...fieldProps}
          placeholder={fieldProps.readOnly ? '' : undefined}
        />
      );
      break;
    case 'datetime':
    case 'timestamp': {
      const dateFormat =
        fieldDefine.disableSecond === false ? DateTimeFormat : DateTimeFormatWithOutSecond;
      formField = (
        <DatePicker
          showTime
          format={dateFormat}
          {...fieldProps}
          placeholder={fieldProps.readOnly ? '' : undefined}
        />
      );
      break;
    }
    case 'boolean':
      if (formFieldDefine.switch)
        // 开关样式
        formField = (
          <Switch
            {...fieldProps}
            checkedChildren={<span style={{ margin: '2px' }}>{checkedText}</span>}
            unCheckedChildren={<span style={{ margin: '2px' }}>{unCheckedText}</span>}
          />
        );
      else if (formFieldDefine.radio)
        // radio样式
        formField = (
          <Radio.Group {...fieldProps}>
            <Radio value>{checkedText}</Radio>
            <Radio value={false}>{unCheckedText}</Radio>
          </Radio.Group>
        );
      // radioButton样式
      else if (formFieldDefine.radioButton)
        formField = (
          <Radio.Group {...fieldProps} buttonStyle="solid">
            <Radio.Button value>{checkedText}</Radio.Button>
            <Radio.Button value={false}>{unCheckedText}</Radio.Button>
          </Radio.Group>
        );
      // 单个checkbox
      else formField = <Checkbox {...fieldProps} />;
      break;
    case 'image':
      formField = (
        <ImageField
          {...fieldProps}
          imageWidth={formFieldDefine.imageWidth}
          imageHeight={formFieldDefine.imageHeight}
          imageStyle={formFieldDefine.imageStyle}
        />
      );
      break;
    case 'string': {
      if (formFieldDefine.jsonField) {
        formField = <JsonField {...fieldProps} jsonFieldProps={formFieldDefine.jsonFieldProps} />;
      } else {
        const len = ['creater', 'lastmodifier'].includes(fieldname.toLowerCase())
          ? 10
          : fieldDefine.fieldlen;
        if (len > 0 && len <= 100)
          // allowClear={!fieldDefine.isrequired}
          formField = (
            <Input
              maxLength={len}
              {...fieldProps}
              style={len <= 10 ? { maxWidth: `${len * 16 + 24}px` } : {}}
            />
          );
        else if (len === 0) formField = <Input.TextArea autoSize {...fieldProps} />;
        else
          formField = <Input.TextArea maxLength={len} autoSize={{ maxRows: 10 }} {...fieldProps} />;
      }
      break;
    }
    default:
      formField = <Input {...fieldProps} style={{ maxWidth: '300px' }} autoFocus />;
  }
  return formField;
};

export const getOneToManyInfoButton = (
  record: Object,
  {
    fieldtitle,
    childModuleName,
    fieldahead,
    moduleInfo,
    dispatch,
  }: {
    fieldtitle: string;
    childModuleName: string;
    fieldahead: string;
    moduleInfo: ModuleModal;
    dispatch: Dispatch;
  },
) => {
  const formScheme = getFormSchemeFormType(childModuleName, 'onetomanytooltip');
  const openOrEnter = (openInNewWindow: boolean) => {
    const parentFilter: ParentFilterModal = {
      moduleName: moduleInfo.modulename,
      fieldahead: fieldahead.split('.with.')[1],
      fieldName: moduleInfo.primarykey,
      fieldtitle: moduleInfo.title,
      operator: '=',
      fieldvalue: record[moduleInfo.primarykey],
      text: record[moduleInfo.namefield],
    };
    const parentFilterParam = encodeURIComponent(JSON.stringify(parentFilter));
    const pathname = getModuleUrlFormSysMenu(childModuleName);
    if (openInNewWindow) {
      const url = `${pathname}?parentFilter=${parentFilterParam}`;
      window.open(url);
    } else {
      history.push({
        pathname,
        // query ,可以用 location.query 获取值,
        // state ,可以用 location.state 获取值,state方式下，url中?后面的参数不显示在网址中，刷新后参数丢失
        state: {
          parentFilter: parentFilterParam,
        },
      });
    }
  };
  return formScheme && moduleInfo && record[moduleInfo.namefield] !== undefined ? (
    <Popover
      trigger="click"
      title={
        <span>
          {`${record[moduleInfo.namefield]} 的 ${fieldtitle}`}
          <Space style={{ float: 'right', marginRight: '12px', marginLeft: '12px' }}>
            <Tooltip title={`转到${fieldtitle}`}>
              <a onClick={() => openOrEnter(false)}>
                <FormOutlined />
              </a>
            </Tooltip>
            <Tooltip title="新页面中打开">
              <a onClick={() => openOrEnter(true)}>
                <SelectOutlined rotate={90} />
              </a>
            </Tooltip>
          </Space>
        </span>
      }
      content={
        <OneTowManyTooltip
          moduleName={moduleInfo.modulename}
          fieldahead={fieldahead}
          childModuleName={childModuleName}
          parentid={record[moduleInfo.primarykey]}
          dispatch={dispatch}
        />
      }
    >
      <Typography.Text type="secondary" className={styles.onetomanyfieldinfo}>
        <InfoCircleOutlined />
      </Typography.Text>
    </Popover>
  ) : null;
};

const FormField = ({
  formFieldDefine,
  moduleInfo,
  fieldsValidate,
  form,
  readOnly,
  formType,
  currRecord,
  dispatch,
  requiredMark,
}: {
  formFieldDefine: any;
  moduleInfo: ModuleModal;
  fieldsValidate: any;
  dispatch: Dispatch;
  form: any;
  readOnly: boolean;
  formType: FormOperateType;
  currRecord: any;
  requiredMark: boolean;
}): any => {
  let fieldDefine: ModuleFieldType = getFieldDefine(formFieldDefine.fieldid, moduleInfo);
  if (fieldDefine === null) {
    if (formFieldDefine.fieldahead) {
      // 如果是父模的其他字段或者祖父模块
      if (formFieldDefine.aggregate) {
        fieldDefine = addChildAdditionField(moduleInfo, formFieldDefine);
      } else {
        // 生成manytoone,onetoonefield
        fieldDefine = addParentAdditionField(moduleInfo, formFieldDefine);
      }
    }
    if (fieldDefine === null)
      return <div style={{ color: 'red' }}>{JSON.stringify(formFieldDefine)}</div>;
  }
  if (fieldDefine.isdisable) return null;
  const { fieldname, fieldtype, isrequired, allownew, allowedit } = fieldDefine;
  const fieldtitle = getLastLevelLabel(fieldDefine.fieldtitle);
  let unittext = fieldDefine.unittext || (fieldDefine.isOneToMany ? '条' : fieldDefine.unittext);
  if (!unittext && fieldDefine.fieldtype.toLowerCase() === 'percent' && !formFieldDefine.slider) {
    unittext = '%';
  }
  let required = !!isrequired;
  let fieldReadOnly = readOnly;
  // 字段禁用的条件：父模块或子模块的字段，显示，新建方式下字段不允许新建修改，修改方式下字段不允许修改
  if (
    formFieldDefine.fieldahead ||
    formType === 'display' ||
    formType === 'approve' ||
    formType === 'audit' ||
    (formType === 'insert' && !allownew) ||
    (formType === 'edit' && !allowedit)
  ) {
    fieldReadOnly = true;
    required = false; // 所有只读的都不是必填项
  }
  const { label, labelWidth } = formFieldDefine;
  const formItemProp: any = {
    key: formFieldDefine.detailid,
    name: getFieldName(fieldDefine, fieldReadOnly),
    hidden: fieldDefine.ishidden,
    validateStatus: fieldsValidate[fieldname] ? 'error' : undefined, // 'error'表示出错
    // 出错后的显示在字段下方的提示,可是设置的显示在下方的提示
    help: fieldsValidate[fieldname] || formFieldDefine.help || fieldDefine.help,
    labelCol: labelWidth ? { flex: `0 0 ${labelWidth}px` } : undefined,
  };
  if (label)
    apply(formItemProp, {
      // eslint-disable-next-line
      label: <span dangerouslySetInnerHTML={{ __html: label }} />,
    });
  if (fieldtype.toLowerCase() === 'boolean') {
    formItemProp.valuePropName =
      formFieldDefine.radio || formFieldDefine.radioButton ? 'value' : 'checked';
    // 所有的boolean字段都设置为不是required的，如果有问题，需要后台对boolean加入缺省值
    required = false;
  }
  const fieldProps: any = {
    // 下拉框，日期等修改了，还没有判断，只读的还是能改
    readOnly: fieldReadOnly, // 字段禁用时不显示placeholder
    disabled: fieldReadOnly && (formType === 'insert' || formType === 'edit'),
    placeholder: fieldReadOnly ? undefined : formFieldDefine.placeholder || fieldDefine.placeholder,
    addonAfter: unittext,
  };
  const rules: Rule[] = [];
  if (!fieldReadOnly) {
    if (required)
      rules.push({
        required,
        message:
          formFieldDefine.requiredMessage || fieldDefine.requiredMessage || `请输入${fieldtitle}`,
      });
    if (fieldDefine.maxval) {
      // apply(fieldProps, { max: fieldDefine.maxval });   //不会出现提示，只会控制在控件内
      // 录错了会出现出错提示
      const maxval = fieldDefine.maxval === 0.01 ? 0 : fieldDefine.maxval;
      rules.push({
        type: 'number',
        max: maxval,
        message: `${fieldtitle}最大值为${maxval}`,
      });
    }
    if (fieldDefine.minval) {
      // 最小值设置为0.01,表示最小值是0，否则没法设置最小值0,需要设置在字段的附加设置里面
      // apply(fieldProps, { min: fieldDefine.minval === 0.01 ? 0 : fieldDefine.minval });
      const minval = fieldDefine.minval === 0.01 ? 0 : fieldDefine.minval;
      rules.push({
        type: 'number',
        min: minval,
        message: `${fieldtitle}最小值为${minval}`,
      });
    }
  }
  let fieldItem: any;

  // 检查一下是否是manytoone的table选择，如果是的话，需要加入二个字段，id为 hidden,name为选择字段
  let pobject;
  if (fieldDefine.isManyToOne) pobject = getModuleInfo(fieldtype);
  if (
    fieldDefine.isManyToOne &&
    !fieldDefine.fieldahead &&
    !fieldReadOnly &&
    pobject?.selectedmode === '90'
  ) {
    formItemProp.name = fieldDefine.manyToOneInfo.nameField;
    fieldItem = (
      <>
        <FormItem label={fieldtitle} {...formItemProp} rules={rules}>
          <Input
            {...fieldProps}
            readOnly
            addonAfter={<ManyToOneSelectPopover fieldDefine={fieldDefine} form={form} />}
          />
        </FormItem>
        <FormItem noStyle name={fieldDefine.manyToOneInfo.keyField}>
          <Input hidden />
        </FormItem>
      </>
    );
  } else {
    const fieldinput = getFieldInput({
      moduleInfo,
      name: formItemProp.name,
      fieldDefine,
      formFieldDefine,
      form,
      fieldProps,
      currRecord,
      dispatch,
    });
    if (unittext && fieldtype.toLowerCase() !== 'string' && false) {
      // 最外层的FormItem,由于没有rules因此，不会出来红*，必须手工添加
      const flabel =
        requiredMark && required ? (
          <span className="moduleform-item-unittext-required">{fieldtitle}</span>
        ) : (
          fieldtitle
        );
      fieldItem = (
        <FormItem label={flabel} {...formItemProp} key={`${formFieldDefine.detailid}1`}>
          <FormItem noStyle {...formItemProp} rules={rules}>
            {fieldinput}
          </FormItem>
          <span style={{ paddingLeft: '5px' }}>
            {unittext}
            {formFieldDefine.aggregate || fieldDefine.isOneToMany
              ? getOneToManyInfoButton(currRecord, {
                  fieldtitle: fieldDefine.fieldtitle,
                  childModuleName:
                    formFieldDefine.additionObjectname ||
                    fieldDefine.fieldtype.substring(
                      fieldDefine.fieldtype.indexOf('<') + 1,
                      fieldDefine.fieldtype.indexOf('>'),
                    ),
                  fieldahead: formFieldDefine.fieldahead || fieldDefine.fieldahead,
                  moduleInfo,
                  dispatch,
                })
              : null}
          </span>
        </FormItem>
      );
    } else
      fieldItem = (
        <FormItem label={fieldtitle} {...formItemProp} rules={rules}>
          {fieldinput}
        </FormItem>
      );
  }
  // 当前字段根据另外的字段的值来显示或隐藏
  //   parentField : {
  //     fieldName : 'saveinfilesystem',
  //     visibleValue : true
  // }
  if (formFieldDefine.parentField) {
    const { fieldName, visibleValue } = formFieldDefine.parentField;
    return (
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues[fieldName] !== currentValues[fieldName]
        }
      >
        {(params) => {
          const { getFieldValue } = params;
          return getFieldValue(fieldName) === visibleValue ? fieldItem : null;
        }}
      </Form.Item>
    );
  }
  return fieldItem;
};

// 生成一个Card->Fields
export const getFormSchemePanel: React.FC<FormSchemePanelProps> = (params): any => {
  const {
    details,
    moduleInfo,
    moduleState,
    callback,
    form,
    fieldsValidate,
    readOnly,
    dispatch,
    showType,
    parentCols,
    setV,
    formType,
    currRecord,
    requiredMark,
  } = params;
  const items: any[] = [];
  let firstFieldSet: boolean = true;
  details.forEach((item: any) => {
    let field = null;
    const { fieldid, xtype, layout, detailid, title, subobjectid, fieldahead } = item;
    const collapsed = item.collapsible && !fieldsetVisible[detailid];
    const onCollsped = () => {
      fieldsetVisible = { ...fieldsetVisible, [detailid]: !fieldsetVisible[detailid] };
      setV({}); // 强制刷新当前组件
    };
    const getCardProps = (cardtitle: string, defaultIcon: any = null) => {
      if (fieldsetVisible[detailid] === undefined && item.collapsible)
        fieldsetVisible[detailid] = !item.collapsed;
      /* eslint-disable */
      const icon = item.collapsible ? (
        fieldsetVisible[detailid] ? (
          <DownOutlined onClick={onCollsped} />
        ) : (
          <RightOutlined onClick={onCollsped} />
        )
      ) : (
        defaultIcon
      );
      const className = `${item.collapsible && !fieldsetVisible[detailid] ? 'collapsed' : ''} ${
        firstFieldSet || item.tabTitle || xtype === 'panel'
          ? 'card_border_top_first'
          : 'card_border_top'
      }`;
      /* eslint-enable */
      return {
        key: detailid,
        size: 'small', // 'middle','large'
        bordered: false,
        className,
        icon,
        title: (
          <Space>
            {icon}
            <span>{`${cardtitle}`}</span>
          </Space>
        ),
      };
    };
    // 子模块
    if (subobjectid) {
      const config = {
        moduleName: subobjectid,
        parentOperateType: formType, // 父模块的form当前操作类型
        parentFilter: {
          moduleName: moduleInfo.objectname, // 父模块的名称
          fieldahead: fieldahead.split('.with.')[1],
          fieldName: moduleInfo.primarykey, // 父模块的限定字段,父模块主键
          fieldtitle: moduleInfo.title, // 父模块的标题
          operator: '=',
          text: currRecord[moduleInfo.namefield],
          fieldvalue: currRecord[moduleInfo.primarykey], // 父模块的记录id
        },
        // 把form信息也加入state中，以后可以使用，看看影响不影响速度
        parentForm: {
          moduleName: moduleInfo.objectname,
          dispatch,
          currRecord,
        },
      };
      const subModuleInfo = getModuleInfo(config.moduleName);
      const cardParams: any = getCardProps(subModuleInfo.title, <ProfileOutlined />);
      if (item.tabTitle) delete cardParams.title;
      field = (
        <Card {...cardParams}>
          <span style={collapsed ? { display: 'none' } : {}}>
            <DetailGrid {...config} />
          </span>
        </Card>
      );
    } else if (xtype === 'approvehistory') {
      if (currRecord && isStartProcess(currRecord)) {
        const cardParams: any = getCardProps(title || '流程审批记录', <FileDoneOutlined />);
        if (item.tabTitle) delete cardParams.title;
        // 此流程信息只读
        field = (
          <Card {...cardParams}>
            <span style={collapsed ? { display: 'none' } : {}}>
              {getApproveSteps({
                record: currRecord,
                direction: item.direction,
                breakNumber: item.breakNumber,
              })}
            </span>
          </Card>
        );
      }
    } else if (xtype === 'approvepanel') {
      // 只要可审批，不管在什么状态下都可以进行
      if (canApprove(currRecord)) {
        // formType === 'approve' &&
        const cardParams: any = getCardProps(title || '流程任务审批', <AuditOutlined />);
        if (item.tabTitle) delete cardParams.title;
        field = (
          <Card {...cardParams}>
            <span style={collapsed ? { display: 'none' } : {}}>
              <ApproveForm
                moduleInfo={moduleInfo}
                dispatch={dispatch}
                record={currRecord}
                moduleState={moduleState}
                callback={callback}
              />
            </span>
          </Card>
        );
      }
    } else if (fieldid) {
      // 有字段id的，说明是一个字段，不是
      field = (
        <FormField
          formFieldDefine={item}
          moduleInfo={moduleInfo}
          dispatch={dispatch}
          fieldsValidate={fieldsValidate}
          form={form}
          readOnly={readOnly}
          formType={formType}
          currRecord={currRecord}
          requiredMark={requiredMark}
        />
      );
    } else if (xtype === 'tabpanel') {
      item.details.forEach((tab: any) => {
        apply(tab, { tabTitle: tab.title });
      });
      const children: any = getFormSchemePanel({ ...params, details: item.details, parentCols: 0 });
      const tabs: any = [];
      for (let index = 0; index < item.details.length; index += 1) {
        const detail = item.details[index];
        tabs.push(
          <TabPane
            key={detail.detailid}
            tab={
              detail.iconCls ? (
                <span className={detail.iconCls}> {detail.tabTitle} </span>
              ) : (
                detail.tabTitle
              )
            }
          >
            {children[index]}
          </TabPane>,
        );
      }
      field = (
        <Card
          key={item.detailid}
          className={`${showType}-${xtype} card_border_top`}
          bodyStyle={{
            paddingTop: 0,
            paddingBottom: 0,
          }}
          size="small"
          bordered={false}
        >
          <Tabs key={item.detailid} centered={false} tabPosition={item.tabPosition || 'top'}>
            {tabs}
          </Tabs>
        </Card>
      );
    } else if (xtype === 'fieldset' || xtype === 'panel') {
      // 如果这层没有定义layout则默认为table
      const cols = !layout || layout === 'table' ? item.cols || 1 : 0; // 下层字段的列数
      const children = getFormSchemePanel({ ...params, details: item.details, parentCols: cols });
      const cardParams: any = getCardProps(title, <BlockOutlined />);
      cardParams.bodyStyle = item.style;
      cardParams.className = `${showType}-${xtype}${
        cardParams.className ? ` ${cardParams.className}` : ''
      }`;
      if (!item.tabTitle && title) {
        // 如果有tabTitle,说明是tab的组件，不需要这里有标题
        // 有 title 才有当前panel的标题，才可以折叠
        cardParams.title =
          item.hiddenTitle === true && showType !== 'mainregion' ? null : (
            <Space>
              {cardParams.icon}
              <span>{title}</span>
            </Space>
          );
        field = cols ? (
          <Card {...cardParams}>
            <span style={collapsed ? { display: 'none' } : {}}>
              <Row gutter={16}>{children}</Row>
            </span>
          </Card>
        ) : (
          <Card {...cardParams}>
            <span style={collapsed ? { display: 'none' } : {}}>{children}</span>
          </Card>
        );
      } else {
        // 这里仅仅加入一个Row,里面是Col,style可以自己指定 style:{padding:'16px 0px}
        delete cardParams.title;
        field = cols ? (
          // <Card {...cardParams}>
          <Row style={item.style} gutter={16} key={item.detailid}>
            {children}
          </Row>
        ) : (
          // </Card>
          <Card {...cardParams}>{children}</Card>
        );
      }
      firstFieldSet = false;
    } else if (xtype === 'container') {
      // eslint-disable-next-line
      field = <span style={{ padding: 12 }} dangerouslySetInnerHTML={{ __html: item.html }} />;
    }
    // 如果当前层是分栏的，则在此加入所有的分栏
    if (field) {
      if (parentCols) {
        const colspan = item.colspan || 1;
        items.push(
          <Col
            xs={24}
            md={parentCols === 1 ? 24 : 12 * Math.min(colspan, 2)}
            xl={parentCols === 1 ? 24 : (24 / parentCols) * Math.min(colspan, parentCols)}
            key={item.detailid}
          >
            {field}
          </Col>,
        );
      } else items.push(field);
    }
  });
  return items;
};
