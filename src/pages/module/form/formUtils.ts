/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { FormInstance } from 'antd/lib/form';
import type { Store } from 'antd/es/form/interface';
import moment, { isMoment } from 'moment';
import { getNextId, apply, showResultInfo } from '@/utils/utils';
import type { ModuleModal, ModuleFieldType, ModuleState } from '../data';
import { getModuleInfo, getFieldDefine } from '../modules';
import { getMaxPrimaryKeyFromKey, DateTimeFormat } from '../moduleUtils';
import { getAjaxNewDefault } from '../service';
import { PARENT_RECORD } from '../constants';
import { CHILDREN } from '@/pages/datamining/constants';

/**
 * 在编辑记录前对记录做一下处理
 * 日期的转换成moment,百分比的乘100
 * @param sourRecord
 */
export const convertToFormRecord = (sourRecord: any, moduleInfo: ModuleModal) => {
  if (!sourRecord || Object.keys(sourRecord).length === 0) return {};
  const record = { ...sourRecord };
  moduleInfo.fields.forEach((field: ModuleFieldType) => {
    const { fieldname, multiMode } = field;
    if (field.isDateField) {
      if (record[fieldname] && !isMoment(record[fieldname])) {
        record[fieldname] = moment(record[fieldname], DateTimeFormat);
      }
    }
    if (multiMode && record[fieldname]) {
      record[fieldname] = record[fieldname].split(',');
    }
  });
  // console.log('sourceRecord', sourRecord);
  // console.log('target Record', record);
  delete record[PARENT_RECORD]; // 树形结构必须删除此属性，否则form在setvalues时会栈溢出
  delete record[CHILDREN]; // 树形结构的也要删除此属性
  return record;
};

/**
 * 将form中的record中的multiMode的字段的值，则数组改为字符串
 * @param sourRecord
 * @param moduleInfo
 */
export const convertMultiTagsToStr = (sourRecord: any, moduleInfo: ModuleModal) => {
  const record = { ...sourRecord };
  moduleInfo.fields.forEach((field: ModuleFieldType) => {
    const { fieldname, multiMode } = field;
    if (multiMode) {
      const value = record[fieldname];
      if (Array.isArray(value)) {
        if (value.length === 0) {
          record[fieldname] = undefined;
        } else {
          record[fieldname] = value.join(',');
        }
      }
    }
  });
  return record;
};

/**
 * 比较二个对象的不同字段，返回dest与sour不同的字段
 */
export const getDifferentField = ({
  dest,
  sour,
  moduleInfo,
}: {
  dest: object;
  sour: object;
  moduleInfo: ModuleModal;
}) => {
  // console.log('当前的所有字段');
  // console.log(sour);
  // console.log('修改后所有字段');
  // console.log(dest);
  const result = { ...dest };
  // 把相同的值去掉，不返回值
  Object.keys(result).forEach((key) => {
    if (result[key] === '')
      // 为空的字符串全保存为null
      result[key] = null;
    const field: ModuleFieldType = getFieldDefine(key, moduleInfo);
    if (field && field.isDateField) {
      if (!result[key]) {
        // 原来是空，现在也是空
        if (!sour[key]) {
          delete result[key];
        }
      } else if (result[key].isSame(sour[key], DateTimeFormat)) delete result[key];
    } else if (result[key] === sour[key]) {
      delete result[key];
    }
  });
  // 由于undefined不能被传送到后台，因此改成null
  Object.keys(result).forEach((key) => {
    if (result[key] === undefined) result[key] = null;
  });
  // console.log('修改过的字段');
  // console.log(result);
  // message.warn(JSON.stringify(result))
  return result;
};

/**
 * 模块记录新建时，根据模块字段的定义取得缺省值
 * @param form
 * @param moduleState
 */
export const getNewDefaultValues = (
  form: FormInstance,
  moduleState: ModuleState,
  setV?: Function,
): object => {
  const result = {};
  const {
    moduleName,
    dataSource,
    filters: { navigate, parentfilter: pf },
    selectedRowKeys,
    lastInsertRecord,
  } = moduleState;
  const moduleInfo = getModuleInfo(moduleName);
  const { primarykey } = moduleInfo;
  moduleInfo.fields
    .filter((mfield) => mfield.defaultvalue)
    .forEach((field) => {
      const v = field.defaultvalue;
      const { fieldname } = field;
      result[fieldname] = v;
      if (v === 'true') result[fieldname] = true;
      else if (v === 'false') result[fieldname] = false;
      else if (v === 'now') result[fieldname] = moment();
      // 如果是manytoone的，那么字段不对，不过一般manytoone的值不会加在初始值里
    });
  const fields: Store = form.getFieldsValue();
  const params: any = {
    objectname: moduleName,
    parentfilter: null,
    navigates: null,
  };
  // 再加入导航和父模块的设定值
  navigate.forEach((rec: any) => {
    const ahead: string | null = rec.fieldahead;
    // fieldahead 没有或者不能有二级以上的才可以加入缺省值,
    // if (!ahead || ahead.indexOf('.') === -1) {
    // 基本字段不要加入导航值，必须是manytoone的才加，（如果都要加，加入条件!ahead || ）
    if (ahead && ahead.indexOf('.') === -1) {
      const key: string = (ahead ? `${ahead}.` : '') + rec.fieldName;
      if (key in fields) {
        result[key] = rec.fieldvalue;
        if (ahead) {
          // 找一下有没有ahead.namefield,如果有的话也要把值加进去
          const fieldname = getFieldDefine(ahead, moduleInfo);
          const pmodule = getModuleInfo(fieldname.fieldtype);
          const namefieldname = `${ahead}.${pmodule.namefield}`;
          if (namefieldname in fields) result[namefieldname] = rec.text;
        }
      }
    }
  });
  if (pf) {
    const ahead: string | null = pf.fieldahead;
    if (ahead && ahead.indexOf('.') === -1) {
      const key: string = (ahead ? `${ahead}.` : '') + pf.fieldName;
      if (key in fields) {
        result[key] = pf.fieldvalue;
        if (ahead) {
          // 找一下有没有ahead.namefield,如果有的话也要把值加进去
          const fieldname = getFieldDefine(ahead, moduleInfo);
          const pmodule = getModuleInfo(fieldname.fieldtype);
          const namefieldname = `${ahead}.${pmodule.namefield}`;
          if (namefieldname in fields) result[namefieldname] = pf.text;
        }
      }
    }
  }
  // 如果是树状的cocelevel型的模块，并且选中了一个记录，那么新建的时候主键+1
  if (moduleInfo.istreemodel && moduleInfo.codelevel) {
    // 如果树形结构已经新建了一条，那么下一条就在上一条的记录上加1
    if (lastInsertRecord) {
      result[primarykey] = getNextId(lastInsertRecord[primarykey]);
    } else if (selectedRowKeys.length) {
      result[primarykey] = getNextId(
        getMaxPrimaryKeyFromKey(dataSource, selectedRowKeys[0], primarykey),
      );
    }
  }
  // 去服务器后台取得后台提供的缺省值
  if (navigate.length) params.navigates = JSON.stringify(navigate);
  if (pf) params.parentfilter = JSON.stringify(pf);
  getAjaxNewDefault(params).then((response) => {
    showResultInfo(response.resultInfo);
    const ajaxDefault = convertToFormRecord(response.data, moduleInfo);
    if (ajaxDefault) {
      form.setFieldsValue(apply(form.getFieldsValue(), ajaxDefault));
      if (setV) setV((v: number) => v + 1);
    }
  });
  return result;
};
