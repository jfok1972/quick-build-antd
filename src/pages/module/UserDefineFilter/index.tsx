/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  Form,
  Input,
  Select,
  TreeSelect,
  Checkbox,
  Radio,
} from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { apply } from '@/utils/utils';
import type { ModuleState, TextValue } from '../data';
import {
  getFilterScheme,
  getModuleInfo,
  getModuleComboDataSource,
  getModulTreeDataSource,
  convertModuleIdValuesToText,
  convertTreeModuleIdValuesToText,
} from '../modules';
import { canUseThisDateFilter, arrageDataFilterToParam } from './dateFilter';
import TagSelect from './TagSelect';
import { getDictionaryData, convertDictionaryValueToText } from '../dictionary/dictionarys';
import {
  getBooleanFilterOption,
  getBooleanInValueText,
  NumberFilterSelectOption,
} from '../grid/filterUtils';
import { fetchNavigateTreeDataSync } from '../service';
import styles from './index.less';
import { getDateFilter } from './dateSectionFilter';

const LabelColLayout = {
  labelCol: {
    flex: '0 0 120px',
  },
};

export interface UserFilterProps {
  moduleState: ModuleState;
  filterField: any;
  form: any;
  labelWarrapCol: any;
}

/**
 * 所有模块的筛选数据的初始值
 */
const filterInitValues: any = {};
export const setFilterInitValues = (moduleName: string, initFilter: any) => {
  if (!filterInitValues[moduleName]) filterInitValues[moduleName] = {};
  if (!filterInitValues[moduleName][initFilter.property])
    filterInitValues[moduleName][initFilter.property] = initFilter;
};
export const getFilterInitValues = (moduleName: string) => {
  return filterInitValues[moduleName] || {};
};

export const initUserFilterFieldInitValues = (moduleName: string, scheme: any) => {
  if (!scheme || !scheme.details[0] || !scheme.details[0].details) return;
  scheme.details[0].details.forEach((filterField: any) => {
    const title = filterField.title || filterField.defaulttitle;
    const filter = {
      property: filterField.fieldname,
      operator: 'in',
      value: undefined,
      title,
    };
    // if (filterField.comboThisField) { } else
    if (filterField.fDictionaryid) apply(filter, { fDictionaryid: filterField.fDictionaryid });
    else if (filterField.isNumberField) apply(filter, { operator: '=', type: 'number' });
    else if (filterField.isDateField)
      apply(filter, {
        operator: 'day',
        operator1: 'section', // 都是区间的查询
        text: undefined,
        searchfor: 'date',
      });
    else if (filterField.isBooleanField) apply(filter, { type: 'boolean' });
    else if (filterField.xtype === 'usermanytoonetreefilter')
      apply(filter, {
        operator: 'startwith',
        manyToOneTreeObject: filterField.manyToOneInfo.objectname,
      });
    else if (filterField.manyToOneInfo)
      apply(filter, { manyToOneObject: filterField.manyToOneInfo.objectname });
    else if (filterField.comboThisField)
      // 有此属性的，操作符是 in
      apply(filter, {});
    else apply(filter, { operator: 'like', type: 'string' });

    // 定义在筛选字段中的初始值
    if (filterField.operator) {
      apply(filter, { operator: filterField.operator });
    }
    if (filterField.value) {
      apply(filter, { value: filterField.value });
    }
    setFilterInitValues(moduleName, filter);
  });
};

/**
 * 所有用户筛选方案的detailid的记录个数的存放
 */
const detailidNavigateCountCache = {};

/**
 * 取得一个筛选字段按照导航方式获取的数据，里面有记录数
 * @param moduleState
 * @param filterField
 */
const getFieldNavigateCountArray = (moduleState: ModuleState, filterField: any): any[] => {
  const { moduleName } = moduleState;
  const title = filterField.title || filterField.defaulttitle;
  const { fieldname, detailid } = filterField;
  if (moduleState.filters.parentfilter) {
    const id = `${detailid}--${moduleState.filters.parentfilter.fieldvalue}`;
    if (!detailidNavigateCountCache[id]) {
      detailidNavigateCountCache[id] = fetchNavigateTreeDataSync({
        moduleName,
        title,
        navigateschemeid: fieldname,
        parentFilter: encodeURI(JSON.stringify(moduleState.filters.parentfilter)),
        cascading: false,
        isContainNullRecord: false,
      }).children[0].children.map((rec: any) => ({
        value: rec.fieldvalue === '_null_' ? 'null' : rec.fieldvalue,
        count: rec.count,
        text: rec.text,
      }));
      // 10分钟后将缓存清除
      setTimeout(() => {
        delete detailidNavigateCountCache[id];
      }, 1000 * 60 * 10);
    }
    return detailidNavigateCountCache[id];
  }
  if (!detailidNavigateCountCache[detailid]) {
    detailidNavigateCountCache[detailid] = fetchNavigateTreeDataSync({
      moduleName,
      title,
      navigateschemeid: fieldname,
      cascading: false,
      isContainNullRecord: false,
    }).children[0].children.map((rec: any) => ({
      value: rec.fieldvalue === '_null_' ? 'null' : rec.fieldvalue,
      count: rec.count,
      text: rec.text,
    }));
    // 10分钟后将缓存清除
    setTimeout(() => {
      delete detailidNavigateCountCache[detailid];
    }, 1000 * 60 * 10);
  }
  return detailidNavigateCountCache[detailid];
};

const addCountToText = (array: any[], moduleState: ModuleState, filterField: any) => {
  if (!(filterField.addCount === false)) {
    array.forEach((record: TextValue) => {
      const rec = record;
      getFieldNavigateCountArray(moduleState, filterField).forEach((nrec: any) => {
        if (rec.value === nrec.value) {
          rec.count = nrec.count;
          rec.text = (
            <span>
              {rec.text}
              <span className={styles.filterCount}>{`(${nrec.count})`}</span>
            </span>
          );
        }
      });
    });
    if (!(filterField.removeZoneValue === false)) {
      return array.filter((rec: TextValue) => rec.count);
    }
  }
  return array;
};

// 加入boolean类型的个数，boolean值，可能是'1','0','true','false','null'
const addBooleanCountToText = (array: any[], moduleState: ModuleState, filterField: any) => {
  if (!(filterField.addCount === false)) {
    array.forEach((record: TextValue) => {
      const rec = record;
      getFieldNavigateCountArray(moduleState, filterField).forEach((nrec: any) => {
        let v = nrec.value;
        if (v === 'true') v = '1';
        if (v === 'false') v = '0';
        if (rec.value === v) {
          rec.count = nrec.count;
          rec.text = (
            <span>
              {rec.text}
              <span className={styles.filterCount}>{`(${nrec.count})`}</span>
            </span>
          );
        }
      });
    });
    if (!(filterField.removeZoneValue === false)) {
      return array.filter((rec: TextValue) => rec.count);
    }
  }
  return array;
};

/**
 * 自定义筛选的附件属性：
 * allowEmpty : true        // 允许为空值(默认为false)：boolean类型，manytoone, dictionary 都会加入 未定义值
 * addCount : false         // 不加入boolean,manytoone,dictionary 的记录数(默认为true)
 * comboThisField : true    // 按照当前字段的值的字义来展示，按照navigate的模式来处理,和dictionary类似
 * tagSelect : true         // 使用tag方式选择筛选条件，boolean类型，manytoone, dictionary 有效
 *          tagSelect:可配置属性
 *                  expandable:true|false,
 *                  expand= !expandable || true|false
 * checkbox : true          // 使用checkbox多选的方式来进行筛选条件，boolean ,manytoone,dictionary有效
 * radio : true             // 使用radio 单选的方式来进行筛选条件，boolean ,manytoone,dictionary有效
 * hideCheckAll : true      // tagSelect中不显示“选中所有”的按钮
 *
 * 在自定义分组的附加属性中设置：
 * restNumber : 3,          // 值大于1，则可以显示或隐藏部分筛选条件
 * restHidden : true ,      // 默认部分筛选条件是隐藏或显示
 * buttonCol : 12,          // 按钮部分的列span,暂是时自动计算的，未用到
 * regionVisible : true     // 用户自定义筛选区域默认隐藏或显示
 *
 * 字符串字段的查找，displayOperator : true ，默认不显示操作符框，只执行 like，设置为true才显示其他辅助的操作符框
 *
 * 日期字段的设置
 * operator : 'day','year','quarter','week','month' // 可以用来设置选择的月，年，季，周不设置为日区间
 */

const OPERATEWIDTH = 90;

const { Option } = Select;

const getSelectCommonFilter = (filterField: any, dictData: any, labelWarrapCol: any) => {
  /* 在othersetting 中设置 tagSelect : true, 即为tag选择方式，否则为combobox方式  */
  const title = filterField.title || filterField.defaulttitle;
  if (filterField.tagSelect)
    return (
      <Form.Item label={title} {...labelWarrapCol}>
        <Input.Group compact style={{ display: 'flex' }}>
          <Form.Item name={[filterField.fieldname, 'value']} noStyle>
            <TagSelect
              hideCheckAll={!!filterField.hideCheckAll}
              expandable={filterField.expandable}
              expand={!filterField.expandable || filterField.expand}
            >
              {dictData.map((rec: TextValue) => (
                <TagSelect.Option key={rec.value} value={rec.value}>
                  {rec.text}
                </TagSelect.Option>
              ))}
            </TagSelect>
          </Form.Item>
          <Form.Item name={[filterField.fieldname, 'operator']} noStyle>
            <Input type="hidden" />
          </Form.Item>
        </Input.Group>
      </Form.Item>
    );
  if (filterField.checkbox)
    return (
      <Form.Item label={title} {...labelWarrapCol}>
        <Input.Group compact style={{ display: 'flex' }}>
          <Form.Item name={[filterField.fieldname, 'value']} noStyle>
            <Checkbox.Group
              style={{ flex: 1 }}
              options={dictData.map((r: any) => ({ value: r.value, label: r.text }))}
            />
          </Form.Item>
          <Form.Item name={[filterField.fieldname, 'operator']} noStyle>
            <Input type="hidden" />
          </Form.Item>
        </Input.Group>
      </Form.Item>
    );
  if (filterField.radio)
    return (
      <Form.Item label={title} {...labelWarrapCol}>
        <Input.Group compact style={{ display: 'flex' }}>
          <Form.Item name={[filterField.fieldname, 'value']} noStyle>
            <Radio.Group
              style={{ flex: 1 }}
              options={dictData.map((r: any) => ({ value: r.value, label: r.text }))}
            />
          </Form.Item>
          <Form.Item name={[filterField.fieldname, 'operator']} noStyle>
            <Input type="hidden" />
          </Form.Item>
        </Input.Group>
      </Form.Item>
    );

  return (
    <Form.Item label={title} {...labelWarrapCol}>
      <Input.Group compact style={{ display: 'flex' }}>
        <Form.Item name={[filterField.fieldname, 'value']} noStyle>
          <Select mode="multiple" style={{ flex: 1 }} allowClear optionFilterProp="label">
            {dictData.map((rec: any) => (
              <Option key={rec.value} value={rec.value} label={rec.label}>
                {rec.text}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name={[filterField.fieldname, 'operator']} noStyle>
          <Input type="hidden" />
        </Form.Item>
      </Input.Group>
    </Form.Item>
  );
};

/**
 * 一个字段，根据其所有的值来进行筛选
 * @param param0
 */
const getComboThisFieldFilter: React.FC<UserFilterProps> = ({
  moduleState,
  filterField,
  labelWarrapCol,
}): any => {
  const dictData: TextValue[] = getFieldNavigateCountArray(moduleState, filterField).map((rec) => ({
    value: rec.value,
    count: rec.count,
    label: rec.text,
    text: (
      <span>
        {rec.text}
        {filterField.addCount !== false ? (
          <span className={styles.filterCount}>{`(${rec.count})`}</span>
        ) : null}
      </span>
    ),
  }));
  if (filterField.isBooleanField) {
    dictData.forEach((record: any) => {
      const rec = record;
      if (rec.label === '1') rec.label = '是';
      if (rec.label === '0') rec.label = '否';
      rec.text = (
        <span>
          {rec.label}
          <span className={styles.filterCount}>{`(${rec.count})`}</span>
        </span>
      );
    });
  }
  return getSelectCommonFilter(filterField, dictData, labelWarrapCol);
};

const getDictionaryFilter: React.FC<UserFilterProps> = ({
  moduleState,
  filterField,
  labelWarrapCol,
}): any => {
  let dictData: TextValue[] = getDictionaryData(filterField.fDictionaryid).map((rec: any) => ({
    ...rec,
    label: rec.text,
  }));
  dictData = addCountToText(dictData, moduleState, filterField);
  if (filterField.allowEmpty)
    dictData.splice(0, 0, { value: 'null', text: '未定义', label: '未定义' });
  return getSelectCommonFilter(filterField, dictData, labelWarrapCol);
};

const getManyToOneFilter: React.FC<UserFilterProps> = ({
  moduleState,
  filterField,
  labelWarrapCol,
}): any => {
  let dictData: TextValue[] = getModuleComboDataSource(filterField.manyToOneInfo.objectname).map(
    (rec: any) => ({ ...rec, label: rec.text }),
  );
  dictData = addCountToText(dictData, moduleState, filterField);
  if (filterField.allowEmpty)
    dictData.splice(0, 0, { value: 'null', text: '未定义', label: '未定义' });
  return getSelectCommonFilter(filterField, dictData, labelWarrapCol);
};

const { SHOW_PARENT } = TreeSelect;
const getManyToOneTreeFilter: React.FC<UserFilterProps> = ({
  filterField,
  labelWarrapCol,
}): any => {
  const title = filterField.title || filterField.defaulttitle;
  const dictData: TextValue[] = getModulTreeDataSource(
    filterField.manyToOneInfo.objectname,
    true,
    !!filterField.addCodeToText,
  );
  /* 在othersetting 中设置 tagSelect : true, 即为tag选择方式，否则为combobox方式  */
  const arrageTreeNode = (array: any): TextValue[] => {
    return array.map((rec: TextValue) => ({
      value: rec.value || '',
      label: rec.text,
      key: rec.value,
      children: rec.children && rec.children.length > 0 ? arrageTreeNode(rec.children) : null,
    }));
  };

  const options = arrageTreeNode(dictData);
  return (
    <Form.Item label={title} {...labelWarrapCol}>
      <Input.Group compact style={{ display: 'flex' }}>
        <Form.Item name={[filterField.fieldname, 'value']} noStyle>
          <TreeSelect
            style={{ flex: 1 }}
            allowClear
            showCheckedStrategy={SHOW_PARENT}
            showSearch
            treeNodeFilterProp="label"
            treeData={options}
            treeCheckable
            treeDefaultExpandAll
          />
        </Form.Item>
        <Form.Item name={[filterField.fieldname, 'operator']} noStyle>
          <Input type="hidden" />
        </Form.Item>
      </Input.Group>
    </Form.Item>
  );
};

const getBooleanFilter: React.FC<UserFilterProps> = ({
  moduleState,
  filterField,
  labelWarrapCol,
}): any => {
  let dictData: TextValue[] = [...getBooleanFilterOption(!filterField.allowEmpty)];
  dictData = addBooleanCountToText(dictData, moduleState, filterField);
  return getSelectCommonFilter(filterField, dictData, labelWarrapCol);
};

const getNumberFilter: React.FC<UserFilterProps> = ({ filterField, labelWarrapCol }): any => {
  const title = filterField.title || filterField.defaulttitle;
  return (
    <Form.Item label={title} {...labelWarrapCol}>
      <Input.Group compact style={{ display: 'flex' }}>
        <Form.Item name={[filterField.fieldname, 'operator']} noStyle>
          <Select style={{ width: OPERATEWIDTH }}>
            {NumberFilterSelectOption.map((idtext: any) => (
              <Option key={idtext.value} value={idtext.value}>
                {idtext.text}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name={[filterField.fieldname, 'value']} noStyle>
          <Input style={{ flex: 1 }} placeholder="请输入" allowClear />
        </Form.Item>
      </Input.Group>
    </Form.Item>
  );
};

export const stringFieldOperator: TextValue[] = [
  {
    value: 'like',
    text: '包含',
  },
  {
    value: 'in',
    text: '列表',
  },
  {
    value: 'eq',
    text: '等于',
  },
  {
    value: 'startwith',
    text: '开始于',
  },
  {
    value: 'not like',
    text: '不包含',
  },
  {
    value: 'not in',
    text: '列表外',
  },
  {
    value: 'ne',
    text: '不等于',
  },
  {
    value: 'not startwith',
    text: '不开始',
  },
  {
    value: 'regexp',
    text: '正则',
  },
];

const getStringFilter: React.FC<UserFilterProps> = ({ filterField, labelWarrapCol }): any => {
  const title = filterField.title || filterField.defaulttitle;
  return (
    <Form.Item label={title} {...labelWarrapCol}>
      <Input.Group compact style={{ display: 'flex' }}>
        <Form.Item name={[filterField.fieldname, 'operator']} noStyle>
          <Select
            style={{
              width: OPERATEWIDTH,
              display: filterField.displayOperator ? 'inherit' : 'none',
            }}
          >
            {stringFieldOperator.map((idtext: any) => (
              <Option key={idtext.value} value={idtext.value}>
                {idtext.text}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name={[filterField.fieldname, 'value']} noStyle>
          <Input style={{ flex: 1 }} placeholder="请输入" allowClear />
        </Form.Item>
      </Input.Group>
    </Form.Item>
  );
};

/**
 * 判断一个值是否为空，如果是数组，判断数组是否为空
 * @param value
 */
const isEmptyOrEmptyArray = (value: any) => {
  if (Array.isArray(value)) return value.length;
  return value;
};

/**
 * 把用户自定义条件，转化成ajax需要的参数
 * @param userfilter
 * @param addText
 * @param separater in 的所有数据的连接符',' 或者 <br />
 */
export const changeUserFilterToParam = (
  userfilter: any,
  addText: boolean = false,
  separater: string = '',
): any[] => {
  let result = [];
  if (userfilter && userfilter.length) {
    const filters = userfilter.filter((f: any) => {
      if (f.searchfor === 'date') return canUseThisDateFilter(f);
      return isEmptyOrEmptyArray(f.value);
    });
    result = filters.map((filter: any) => {
      const f = { ...filter };
      if (f.searchfor === 'date') return arrageDataFilterToParam(f, addText);
      if (addText) {
        if (f.fDictionaryid)
          f.value = convertDictionaryValueToText(f.fDictionaryid, f.value, separater);
        else if (f.type === 'boolean') f.value = getBooleanInValueText(f.value);
        else if (f.manyToOneTreeObject)
          f.value = convertTreeModuleIdValuesToText(f.manyToOneTreeObject, f.value, separater);
        else if (f.manyToOneObject)
          f.value = convertModuleIdValuesToText(f.manyToOneObject, f.value, separater);
      }
      return f;
    });
  }
  return result;
};

export const getUserFilterCount = (userfilter: any): number => {
  let result = 0;
  if (userfilter && userfilter.length) {
    const filter = userfilter.filter((f: any) => {
      if (f.searchfor === 'date') return canUseThisDateFilter(f);
      return isEmptyOrEmptyArray(f.value);
    });
    result = filter.length;
  }
  return result;
};

const UserDefineFilter = ({
  moduleState,
  dispatch,
  visible,
  filterSchemeid,
  inPopover,
}: {
  moduleState: ModuleState | any;
  dispatch: any;
  visible: boolean;
  filterSchemeid?: string;
  inPopover?: boolean;
}) => {
  const {
    moduleName,
    currSetting: { userFilterRestHidden, userFilterRestNumber },
  } = moduleState;
  const moduleInfo = getModuleInfo(moduleName);
  const scheme = getFilterScheme(moduleInfo, filterSchemeid);
  const [form] = Form.useForm();
  const getACol = (filterField: any, cols: number): any => {
    const labelWarrapCol = { style: { marginBottom: '6px', marginTop: '6px' } };
    const colspan = Math.min(filterField.colspan || 1, cols);
    if (scheme.labelCol) {
      // 自定义标题的span,否则为默认
      apply(labelWarrapCol, {
        labelCol: { span: scheme.labelCol },
        wrapperCol: { span: scheme.wrapperCol || 24 - scheme.labelCol },
      });
    }
    const params = { moduleState, filterField, form, labelWarrapCol };
    /* eslint-disable */
    return (
      <Col
        xs={24}
        key={filterField.detailid}
        md={cols === 1 ? 24 : 12 * Math.min(colspan, 2)}
        xl={cols === 1 ? 24 : (24 / cols) * Math.min(colspan, cols)}
      >
        {filterField.comboThisField
          ? getComboThisFieldFilter(params)
          : filterField.fDictionaryid
          ? getDictionaryFilter(params)
          : filterField.isNumberField
          ? getNumberFilter(params)
          : filterField.isDateField
          ? getDateFilter(params)
          : filterField.isBooleanField
          ? getBooleanFilter(params)
          : filterField.xtype === 'usermanytoonetreefilter'
          ? getManyToOneTreeFilter(params)
          : filterField.manyToOneInfo
          ? getManyToOneFilter(params)
          : getStringFilter(params)}
      </Col>
    );
    /* eslint-enable */
  };

  const onSearch = () => {
    const filter: Record<string, any> = JSON.parse(JSON.stringify(getFilterInitValues(moduleName)));
    const formValues: Record<string, any> = form.getFieldsValue();
    // console.log(formValues);
    const userfilter: any[] = [];
    Object.keys(formValues).forEach((key) => {
      if (!filter[key]) filter[key] = {};
      apply(filter[key], formValues[key]);
      userfilter.push(filter[key]);
    });
    dispatch({
      type: 'modules/filterChanged',
      payload: {
        moduleName,
        type: 'userDefineFilter',
        userfilter,
      },
    });
  };
  const onReset = () => {
    const userfilter: any[] = [];
    const filter: Record<string, any> = JSON.parse(JSON.stringify(getFilterInitValues(moduleName)));
    Object.keys(filter).forEach((key) => {
      userfilter.push(filter[key]);
    });
    dispatch({
      type: 'modules/filterChanged',
      payload: {
        moduleName,
        type: 'userDefineFilter',
        userfilter,
      },
    });
  };
  const getButtonRegion = () => {
    return (
      <span style={{ display: 'flex', marginBottom: '6px', marginTop: '6px' }}>
        <span style={{ flex: 1 }} />
        <Space size="middle">
          <Button onClick={onReset}>重置</Button>
          <Button type="primary" onClick={onSearch}>
            查询
          </Button>
          {/* <Button onClick={() => { console.log(form.getFieldsValue()); }}>条件</Button> */}
        </Space>
        {userFilterRestNumber !== -1 ? (
          <Button
            type="link"
            onClick={() => {
              dispatch({
                type: 'modules/toggleUserFilterRestHidden',
                payload: {
                  moduleName,
                },
              });
            }}
          >
            {userFilterRestHidden ? '展开' : '收起'}
            {userFilterRestHidden ? <DownOutlined /> : <UpOutlined />}
          </Button>
        ) : (
          <Button
            style={{ display: inPopover ? 'none' : 'inherit' }}
            type="link"
            onClick={() => {
              dispatch({
                type: 'modules/toggleUserFilter',
                payload: {
                  moduleName,
                },
              });
            }}
          >
            隐藏
          </Button>
        )}
      </span>
    );
  };

  const getFilterForm = (fscheme: any, hidden: boolean) => {
    const cols = fscheme.details[0].cols || 3;
    let count = fscheme.details[0].details.length;
    if (userFilterRestNumber !== -1 && hidden) count = userFilterRestNumber;
    const fieldsArray: any[] = [];
    const hiddenArray: any[] = [];
    for (let i = 0; i < count; i += 1) {
      fieldsArray.push(getACol(fscheme.details[0].details[i], cols));
    }
    for (let i = count; i < fscheme.details[0].details.length; i += 1) {
      hiddenArray.push(getACol(fscheme.details[0].details[i], cols));
    }
    return (
      <Row gutter={0}>
        {fieldsArray}
        <Col xs={24} md={12} xl={cols === 1 ? 24 : 24 / cols}>
          {getButtonRegion()}
        </Col>
        <Row style={{ display: 'none' }}>{hiddenArray}</Row>
      </Row>
    );
  };
  const getStateInitValues = (): Record<string, any> => {
    // console.log('取得筛选条件')
    const { filters } = moduleState;
    const { userfilter } = filters;
    const values: Record<string, any> = JSON.parse(JSON.stringify(getFilterInitValues(moduleName)));
    if (userfilter)
      userfilter.forEach((filter: any) => {
        if (values[filter.property]) {
          values[filter.property].operator = filter.operator;
          values[filter.property].value = filter.value;
          values[filter.property].operator1 = filter.operator1;
          values[filter.property].text = filter.text;
        }
      });
    return values;
  };
  useEffect(() => {
    // console.log('user define filter useEffect')
    setTimeout(() => {
      form.setFieldsValue(getStateInitValues());
    }, 0);
  }, [moduleState.filters.userfilter]);
  return (
    <Card
      className={inPopover ? 'popoverfiltercard' : 'filtercard'}
      style={{
        display: visible ? 'inherit' : 'none',
        width: scheme.width ? `${scheme.width}px` : '',
      }}
      bodyStyle={{ width: scheme.width ? `${scheme.width}px` : '' }}
      bordered={!inPopover}
    >
      <Form {...LabelColLayout} form={form} autoComplete="off">
        {getFilterForm(scheme, !!userFilterRestHidden)}
      </Form>
    </Card>
  );
};

/**
 * 生成一个mini的用户自定义筛选方案，一般只有1，2个字段，在同一行上
 * @param param0
 * @returns
 */
export const UserInlineDefineFilter = ({
  moduleState,
  dispatch,
  filterSchemeid,
}: {
  moduleState: ModuleState | any;
  dispatch: any;
  filterSchemeid?: string;
}) => {
  const { moduleName } = moduleState;
  const moduleInfo = getModuleInfo(moduleName);
  const scheme = getFilterScheme(moduleInfo, filterSchemeid);
  const [form] = Form.useForm();
  const getACol = (filterField: any): any => {
    const labelWarrapCol = {};
    if (scheme.labelCol) {
      // 自定义标题的span,否则为默认
      apply(labelWarrapCol, {
        labelCol: { span: scheme.labelCol },
        wrapperCol: { span: scheme.wrapperCol || 24 - scheme.labelCol },
      });
    }
    const params = { moduleState, filterField, form, labelWarrapCol };
    /* eslint-disable */
    return filterField.comboThisField
      ? getComboThisFieldFilter(params)
      : filterField.fDictionaryid
      ? getDictionaryFilter(params)
      : filterField.isNumberField
      ? getNumberFilter(params)
      : filterField.isDateField
      ? getDateFilter(params)
      : filterField.isBooleanField
      ? getBooleanFilter(params)
      : filterField.xtype === 'usermanytoonetreefilter'
      ? getManyToOneTreeFilter(params)
      : filterField.manyToOneInfo
      ? getManyToOneFilter(params)
      : getStringFilter(params);
    /* eslint-enable */
  };

  const onSearch = () => {
    const filter: Record<string, any> = JSON.parse(JSON.stringify(getFilterInitValues(moduleName)));
    const formValues: Record<string, any> = form.getFieldsValue();
    // console.log(formValues);
    const userfilter: any[] = [];
    Object.keys(formValues).forEach((key) => {
      if (!filter[key]) filter[key] = {};
      apply(filter[key], formValues[key]);
      userfilter.push(filter[key]);
    });
    dispatch({
      type: 'modules/filterChanged',
      payload: {
        moduleName,
        type: 'userDefineFilter',
        userfilter,
      },
    });
  };
  const getStateInitValues = (): Record<string, any> => {
    // console.log('取得筛选条件')
    const { filters } = moduleState;
    const { userfilter } = filters;
    const values: Record<string, any> = JSON.parse(JSON.stringify(getFilterInitValues(moduleName)));
    if (userfilter)
      userfilter.forEach((filter: any) => {
        if (values[filter.property]) {
          values[filter.property].operator = filter.operator;
          values[filter.property].value = filter.value;
          values[filter.property].operator1 = filter.operator1;
          values[filter.property].text = filter.text;
        }
      });
    return values;
  };
  useEffect(() => {
    setTimeout(() => {
      form.setFieldsValue(getStateInitValues());
    }, 0);
  }, [moduleState.filters.userfilter]);
  return (
    <Form
      {...LabelColLayout}
      form={form}
      autoComplete="off"
      layout="inline"
      size="middle"
      colon={false}
      style={{ width: scheme.width ? `${scheme.width}px` : '' }}
      onFieldsChange={() => {
        onSearch();
      }}
    >
      <div style={{ width: '100%' }}>
        {scheme.details[0].details.map((item: any) => getACol(item))}
      </div>
    </Form>
  );
};

export default UserDefineFilter;
