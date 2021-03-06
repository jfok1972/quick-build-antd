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
import type {
  ModuleModal,
  ModuleFieldType,
  FormOperateType,
  FormShowType,
  TextValue,
  ParentFilterModal,
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

const numeral = require('numeral');

const FormItem = Form.Item;
const { TabPane } = Tabs;

let fieldsetVisible = {}; // ??????????????????????????????????????????
// eslint-disable-next-line
styles._;
interface FormSchemePanelProps {
  moduleInfo: ModuleModal;
  form: FormInstance;
  currRecord: any;
  showType: FormShowType;
  formType: FormOperateType;
  readOnly: boolean;
  details: any[];
  parentCols: number; // ???panel????????????,?????????0????????????
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

// ??????formField????????????
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
 * ???????????????propertyValue????????????????????????????????????????????????????????????????????????????????????????????????????????????
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
 * ?????????property?????????????????????????????????????????????????????????????????????
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
 * ?????????????????????????????????
 * 10	??????????????????
 * 20	????????????????????????
 * 30	?????????????????????????????????      // ?????? ?????????-??????
 * 40	???RadioGroup???????????????
 * 50 ???RadioButton???????????????
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

// 10	??????????????????(local)
// 20	????????????????????????(local)
// 30	?????????????????????????????????(local)
// 40	????????????????????????(remote)
// 50	?????????????????????????????????(remote)
// 60	????????????????????????
// 70	???????????????????????????????????????
// 90	???Grid?????????????????????
// 95	???RadioGroup???????????????

const getManyToOneInput: React.FC<FormFieldProps> = (params) => {
  const { fieldDefine, currRecord, formFieldDefine, fieldProps, dispatch } = params;
  const { fieldtype, allowParentValue } = fieldDefine;
  const cobject = getModuleInfo(fieldtype);
  // ?????????????????????????????????text,?????????????????????????????????????????????manytoone?????????
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

  // ????????????????????????????????????
  let mode = cobject.selectedmode;
  // 95	???RadioGroup???????????????
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
    // ??????30??????????????????radioGroup???
    if (radioItems.length <= 30)
      return (
        <Radio.Group buttonStyle="solid" {...fieldProps}>
          {radioItems}
        </Radio.Group>
      );
    mode = '20';
  }
  if (mode === '10' || mode === '20' || mode === '30') {
    // 10	??????????????????(local)
    // 20	????????????????????????(local)
    // 30	?????????????????????????????????(local)
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
          return option.label && option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
        }}
      />
    );
  }
  if (mode === '40' || mode === '50') {
    return ManyToOneRemote(params);
  }
  // 60	????????????????????????
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
      getModulTreeDataSource(fieldtype, !!allowParentValue, !!formFieldDefine.addCodeToText),
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
  // 70-???????????????????????????????????????,???????????????????????????????????????????????????????????????
  if (mode === '70') {
    const arrageTreeNode = (array: any): TextValue[] => {
      return array.map((rec: TextValue) => ({
        value: rec.objectid || '',
        label: rec.text,
        key: rec.objectid,
        isLeaf: rec.leaf,
        disabled: !rec.leaf,
        children:
          rec.children && rec.children.length > 0 ? arrageTreeNode(rec.children) : undefined,
      }));
    };
    const manytooneData = arrageTreeNode(getModulTreePathDataSource(fieldtype));
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
  // '90' ??????????????????????????????????????????
  // if (mode === '90') {
  //   return <Input {...fieldProps}
  //     addonAfter={<ManyToOneSelectPopover fieldDefine={fieldDefine} form={form} />} >
  //   </Input>
  // }
  return <></>;
};

/**
 * manytomany???????????????????????????checkbox,select,tagSelect
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
          precision={0}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value: any) => value.replace(/\$\s?|(,*)/g, '')}
          style={{ width: '120px' }}
          {...fieldProps}
        />
      );
    }
    return <span style={{ color: 'red' }}>?????????????????????{fieldDefine.fieldtitle}</span>;
  }

  const { fieldtype } = fieldDefine;
  let formField;
  const checkedText = formFieldDefine.checkedText || '???';
  const unCheckedText = formFieldDefine.uncheckedText || '???';
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
            style={{ width: '120px' }}
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
              // ???????????????????????????????????????
              if (document.activeElement!.id !== name) {
                return numeral(value).format(getNumberDigitsFormat(fieldDefine.digitslen || 2));
              }
              return value;
            }}
            // parser={(value: any) => value.replace(/\$\s?|(,*)/g, '')}
            style={{ width: '135px' }}
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
          <InputNumber
            className="double"
            precision={fieldDefine.digitslen || 2}
            style={{ width: '135px' }}
            {...fieldProps}
          />
        );
      }
      break;
    case 'percent': {
      // ?????????2??????????????????????????????????????????4????????????????????????????????????2???
      const digitslen = Math.max(fieldDefine.digitslen || 2, 2);
      if (formFieldDefine.slider) {
        formField = (
          <Slider
            tipFormatter={(value) => `${parseFloat(((value || 0) * 100).toFixed(digitslen - 2))}%`}
            min={0}
            max={1}
            marks={{ 0: '0%', 1: '100%' }}
            // ?????????0.001,?????????????????????
            step={digitslen >= 2 ? 0.001 : 0.01}
          />
        );
      } else
        formField = (
          <PercentField
            {...fieldProps}
            digitslen={digitslen}
            style={{ width: '100px' }}
            className="double"
            name={name}
          />
        );
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
        // ????????????
        formField = (
          <Switch
            {...fieldProps}
            checkedChildren={<span style={{ margin: '2px' }}>{checkedText}</span>}
            unCheckedChildren={<span style={{ margin: '2px' }}>{unCheckedText}</span>}
          />
        );
      else if (formFieldDefine.radio)
        // radio??????
        formField = (
          <Radio.Group {...fieldProps}>
            <Radio value>{checkedText}</Radio>
            <Radio value={false}>{unCheckedText}</Radio>
          </Radio.Group>
        );
      // radioButton??????
      else if (formFieldDefine.radioButton)
        formField = (
          <Radio.Group {...fieldProps} buttonStyle="solid">
            <Radio.Button value>{checkedText}</Radio.Button>
            <Radio.Button value={false}>{unCheckedText}</Radio.Button>
          </Radio.Group>
        );
      // ??????checkbox
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
        // query ,????????? location.query ?????????,
        // state ,????????? location.state ?????????,state????????????url????????????????????????????????????????????????????????????????
        state: {
          parentFilter: parentFilterParam,
        },
      });
    }
  };
  return formScheme && moduleInfo ? (
    <Popover
      trigger="click"
      title={
        <span>
          {`${record[moduleInfo.namefield]} ??? ${fieldtitle}`}
          <Space style={{ float: 'right', marginRight: '12px', marginLeft: '12px' }}>
            <Tooltip title={`??????${fieldtitle}`}>
              <a onClick={() => openOrEnter(false)}>
                <FormOutlined />
              </a>
            </Tooltip>
            <Tooltip title="??????????????????">
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
      // ????????????????????????????????????????????????
      if (formFieldDefine.aggregate) {
        fieldDefine = addChildAdditionField(moduleInfo, formFieldDefine);
      } else {
        // ??????manytoone,onetoonefield
        fieldDefine = addParentAdditionField(moduleInfo, formFieldDefine);
      }
    }
    if (fieldDefine === null)
      return <div style={{ color: 'red' }}>{JSON.stringify(formFieldDefine)}</div>;
  }
  if (fieldDefine.isdisable) return null;
  const {
    fieldname,
    fieldtype,
    defaultvalue, // fielddefaultvalue??????field?????????????????????????????????????????????
    isrequired,
    allownew,
    allowedit,
  } = fieldDefine;
  const fieldtitle = getLastLevelLabel(fieldDefine.fieldtitle);
  let unittext = fieldDefine.unittext || (fieldDefine.isOneToMany ? '???' : fieldDefine.unittext);
  if (!unittext && fieldDefine.fieldtype.toLowerCase() === 'percent' && !formFieldDefine.slider) {
    unittext = '%';
  }
  let required = !!isrequired;
  let fieldReadOnly = readOnly;
  // ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  if (
    formFieldDefine.fieldahead ||
    formType === 'display' ||
    formType === 'approve' ||
    formType === 'audit' ||
    (formType === 'insert' && !allownew) ||
    (formType === 'edit' && !allowedit)
  ) {
    fieldReadOnly = true;
    required = false; // ?????????????????????????????????
  }
  const { label, labelWidth } = formFieldDefine;
  const formItemProp: any = {
    key: formFieldDefine.detailid,
    name: getFieldName(fieldDefine, fieldReadOnly),
    hidden: fieldDefine.ishidden,
    validateStatus: fieldsValidate[fieldname] ? 'error' : undefined, // 'error'????????????
    // ??????????????????????????????????????????,???????????????????????????????????????
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
    // ?????????boolean????????????????????????required???????????????????????????????????????boolean???????????????
    required = false;
  }
  const fieldProps: any = {
    // ????????????????????????????????????????????????????????????????????????
    readOnly: fieldReadOnly, // ????????????????????????placeholder
    disabled: fieldReadOnly && (formType === 'insert' || formType === 'edit'),
    placeholder: fieldReadOnly ? undefined : formFieldDefine.placeholder || fieldDefine.placeholder,
    fielddefaultvalue: fieldReadOnly ? undefined : defaultvalue, // ?????????????????????,???????????????????????????formFieldDefine.fieldahead
    addonAfter: unittext,
  };
  const rules: Rule[] = [];
  if (!fieldReadOnly) {
    if (required)
      rules.push({
        required,
        message:
          formFieldDefine.requiredMessage || fieldDefine.requiredMessage || `?????????${fieldtitle}`,
      });
    if (fieldDefine.maxval) {
      // apply(fieldProps, { max: fieldDefine.maxval });   //?????????????????????????????????????????????
      // ??????????????????????????????
      const maxval = fieldDefine.maxval === 0.01 ? 0 : fieldDefine.maxval;
      rules.push({
        type: 'number',
        max: maxval,
        message: `${fieldtitle}????????????${maxval}`,
      });
    }
    if (fieldDefine.minval) {
      // ??????????????????0.01,??????????????????0??????????????????????????????0,??????????????????????????????????????????
      // apply(fieldProps, { min: fieldDefine.minval === 0.01 ? 0 : fieldDefine.minval });
      const minval = fieldDefine.minval === 0.01 ? 0 : fieldDefine.minval;
      rules.push({
        type: 'number',
        min: minval,
        message: `${fieldtitle}????????????${minval}`,
      });
    }
  }
  let fieldItem: any;

  // ?????????????????????manytoone???table??????????????????????????????????????????????????????id??? hidden,name???????????????
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
    if (unittext && fieldtype.toLowerCase() !== 'string') {
      // ????????????FormItem,????????????rules????????????????????????*?????????????????????
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
  // ?????????????????????????????????????????????????????????
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

// ????????????Card->Fields
export const getFormSchemePanel: React.FC<FormSchemePanelProps> = (params): any => {
  const {
    details,
    moduleInfo,
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
      setV({}); // ????????????????????????
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
    // ?????????
    if (subobjectid) {
      const config = {
        moduleName: subobjectid,
        parentOperateType: formType, // ????????????form??????????????????
        parentFilter: {
          moduleName: moduleInfo.objectname, // ??????????????????
          fieldahead: fieldahead.split('.with.')[1],
          fieldName: moduleInfo.primarykey, // ????????????????????????,???????????????
          fieldtitle: moduleInfo.title, // ??????????????????
          operator: '=',
          text: currRecord[moduleInfo.namefield],
          fieldvalue: currRecord[moduleInfo.primarykey], // ??????????????????id
        },
        // ???form???????????????state??????????????????????????????????????????????????????
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
        const cardParams: any = getCardProps(title || '??????????????????', <FileDoneOutlined />);
        if (item.tabTitle) delete cardParams.title;
        // ?????????????????????
        field = (
          <Card {...cardParams}>
            <span style={collapsed ? { display: 'none' } : {}}>
              {getApproveSteps({ record: currRecord, direction: item.direction })}
            </span>
          </Card>
        );
      }
    } else if (xtype === 'approvepanel') {
      // ?????????????????????????????????????????????????????????
      if (canApprove(currRecord)) {
        // formType === 'approve' &&
        const cardParams: any = getCardProps(title || '??????????????????', <AuditOutlined />);
        if (item.tabTitle) delete cardParams.title;
        field = (
          <Card {...cardParams}>
            <span style={collapsed ? { display: 'none' } : {}}>
              <ApproveForm moduleInfo={moduleInfo} dispatch={dispatch} record={currRecord} />
            </span>
          </Card>
        );
      }
    } else if (fieldid) {
      // ?????????id????????????????????????????????????
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
      // ????????????????????????layout????????????table
      const cols = !layout || layout === 'table' ? item.cols || 1 : 0; // ?????????????????????
      const children = getFormSchemePanel({ ...params, details: item.details, parentCols: cols });
      const cardParams: any = getCardProps(title, <BlockOutlined />);
      cardParams.bodyStyle = item.style;
      cardParams.className = `${showType}-${xtype}${
        cardParams.className ? ` ${cardParams.className}` : ''
      }`;
      if (!item.tabTitle && title) {
        // ?????????tabTitle,?????????tab????????????????????????????????????
        // ??? title ????????????panel???????????????????????????
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
        // ????????????????????????Row,?????????Col,style?????????????????? style:{padding:'16px 0px}
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
    // ????????????????????????????????????????????????????????????
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
