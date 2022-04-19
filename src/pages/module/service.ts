/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import request, { API_HEAD, syncRequest } from '@/utils/request';
import { applyIf, apply } from '@/utils/utils';
import { isMoment } from 'moment';
import { serialize } from 'object-to-formdata';
import type { ModuleState, FetchObjectResponse } from './data';
import type { ConditionType } from './design/DesignConditionExpression';
import { getAllFilterAjaxParam } from './grid/filterUtils';
import { getModuleInfo } from './modules';
import { DateTimeFormat, generateTreeParent } from './moduleUtils';

export const queryModuleInfo = async (params: any) => {
  return request(`${API_HEAD}/platform/module/getmoduleinfo.do`, {
    method: 'POST',
    body: serialize(params),
  });
};

export const querySyncModuleInfo = (moduleName: string): object => {
  return syncRequest(`${API_HEAD}/platform/module/getmoduleinfo.do`, {
    type: 'POST',
    params: { moduleName },
  });
};

export const fetchObjectTreeData = async (params: any) => {
  apply(params, {
    start: (params.page - 1) * params.limit,
  });
  return request(`${API_HEAD}/platform/dataobject/fetchtreedata.do?_dc=${new Date().getTime()}`, {
    method: 'POST',
    params: {
      moduleName_: params.moduleName,
    },
    body: serialize(params),
  });
};

export const fetchObjectData = async (params: any) => {
  apply(params, {
    start: (params.page - 1) * params.limit,
  });
  return request(`${API_HEAD}/platform/dataobject/fetchdata.do?_dc=${new Date().getTime()}`, {
    method: 'POST',
    params: {
      moduleName_: params.moduleName,
    },
    body: serialize(params),
  });
};

export const fetchObjectDataSync = (params: any) => {
  apply(params, {
    start: (params.page - 1) * params.limit,
  });
  return syncRequest(`${API_HEAD}/platform/dataobject/fetchdata.do?_dc=${new Date().getTime()}`, {
    type: 'POST',
    params,
  });
};

export const fetchObjectDataWithState = async (moduleState: ModuleState) => {
  return new Promise((resolve) => {
    const { moduleName, gridParams, sorts, sortschemeid } = moduleState;
    const moduleInfo = getModuleInfo(moduleName);
    const { istreemodel, primarykey } = moduleInfo;
    const payload: any = { moduleName };
    payload.page = gridParams.curpage;
    payload.limit = gridParams.limit;
    payload.start = gridParams.start;
    if (sortschemeid) payload.sortschemeid = sortschemeid;
    apply(payload, getAllFilterAjaxParam(moduleState.filters, moduleState));

    if (sorts.length) {
      payload.sort = JSON.stringify(sorts);
    }
    if (istreemodel) {
      // 如果是树形的模块
      fetchObjectTreeData(payload).then((response: any) => {
        const { children } = response;
        const result: FetchObjectResponse = {
          start: 0,
          limit: 20,
          total: 0,
          curpage: 1,
          totalpage: 1,
          data: generateTreeParent(children),
          spendtime: 0,
          // 树形数据默认展开第一级
          expandedRowKeys:
            children && children.length
              ? children.map((record: any): string => record[primarykey])
              : [],
        };
        resolve(result);
      });
    } else {
      fetchObjectData(payload).then((response: FetchObjectResponse) => {
        if (!response.data) response.data = [];
        resolve(response);
      });
    }
  });
};

/**
 * 同步取得模块的一条记录
 * @param params
 * objectname:
 * id:
 */
export const fetchObjectRecordSync = (params: any) => {
  return syncRequest(`${API_HEAD}/platform/dataobject/fetchinfo.do?_dc=${new Date().getTime()}`, {
    type: 'POST',
    params,
  });
};

/**
 * 异步取得模块的一条记录
 * @param params
 * objectname:
 * id:
 */
export const fetchObjectRecord = async (params: any) => {
  return new Promise((resolve) => {
    request(`${API_HEAD}/platform/dataobject/fetchinfo.do?_dc=${new Date().getTime()}`, {
      method: 'POST',
      params: {
        moduleName_: params.objectname,
      },
      body: serialize(params),
    }).then((response) => {
      resolve(response);
    });
  });
};

/// ///////////////////////
// 新建或修改一条记录，这个在提交的时候是 request_payload 方式，在windows nginx转发的时候会中文乱码
/// ///////////////////////
export const saveOrUpdateRecordRequestPayload = async (params: any) => {
  return new Promise((resolve) => {
    request(`${API_HEAD}/platform/dataobject/saveorupdate.do`, {
      params: {
        objectname: params.moduleName,
        opertype: params.opertype === 'insert' ? 'new' : params.opertype,
      },
      data: params.data,
      method: 'POST',
    }).then((response) => {
      resolve(response);
    });
  });
};

// 新建一条记录或者修改记录，这个是用的 form data 方式，不会乱码，
// 看这个网址 https://segmentfault.com/a/1190000018774494
// 注意+8的时区，data[k] = data[k].format(DATE_TIME); 将返回当前时区的时间
// 在mysql中，必须设置default-time-zone=+08:00，才可以，否则保存数据和显示数据会不一致
export const saveOrUpdateRecord = async (params: any) => {
  const data = { ...params.data };
  Object.keys(data).forEach((k) => {
    if (isMoment(data[k])) {
      data[k] = data[k].format(DateTimeFormat);
    }
  });
  return new Promise((resolve) => {
    request(`${API_HEAD}/platform/dataobject/saveorupdatedata.do`, {
      params: {
        objectname: params.moduleName,
        opertype: params.opertype === 'insert' ? 'new' : params.opertype,
      },
      // serialize 生成 formdata
      data: serialize({ data: JSON.stringify(data) }),
      method: 'POST',
    }).then((response) => {
      resolve(response);
    });
  });
};

// 删除模块的一条记录
export const deleteModuleRecord = async (params: any) => {
  return request(`${API_HEAD}/platform/dataobject/remove.do`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    params: {
      objectname: params.moduleName,
    },
    data: {
      recordId: params.recordId,
    },
  });
};

// 删除模块的多条记录
// params : {
//   moduleName : grid.moduleInfo.fDataobject.objectname,
//   ids : grid.getSelectionIds().join(","),
//   titles : grid.getSelectionTitleTpl().join("~~")
// },
export const deleteModuleRecords = async (params: any) => {
  return request(`${API_HEAD}/platform/dataobject/removerecords.do`, {
    method: 'POST',
    body: serialize(params),
  });
};

/**
 * 批量审核记录
 * @param params
 * @returns
 */
export const batchAuditModuleRecords = async (params: any) => {
  return request(`${API_HEAD}/platform/audit/doaudits.do`, {
    method: 'POST',
    body: serialize(params),
  });
};

/**
 * 获取模块作为combodata的数据
 * @param params
 * moduleName: moduleName
 */
export const fetchObjectComboData = (params: any) => {
  return syncRequest(`${API_HEAD}/platform/dataobject/fetchcombodata.do`, {
    params,
  });
};

/**
 * 获取模块作为treedata的数据
 * @param params
 * moduleName: moduleName
 */
export const fetchObjectComboTreeData = (params: any) => {
  return syncRequest(`${API_HEAD}/platform/dataobject/fetchpickertreedata.do`, {
    params,
  });
};

/**
 * 模块字段根据选择路径生成的树，非叶节点全部不可以选择，只能选择叶节点
 * @param params
 * moduleName: moduleName
 */
export const fetchObjectComboTreePathData = (params: any) => {
  return syncRequest(`${API_HEAD}/platform/dataobject/fetchtreeselectpathdata.do`, {
    params,
  });
};

/**
 * 读取一个模块的的所有关联模块的结构图，包括父模块和子模块
 * @param params
 * @returns
 */
export const fetchModuleHierarchyData = (params: any) => {
  return syncRequest(`${API_HEAD}/platform/module/getModuleHierarchyTree.do`, {
    params,
  });
};

/**
 * 获取一个模块的字段，结构是字段分组--字段
 * @param params
 * @returns
 */
export const fetchModuleFields = async (params: any) => {
  return request(`${API_HEAD}/platform/module/getModuleFields.do`, {
    params,
  });
};

/**
 * 读取一个form方案的所有字段定义，是树形结构
 * @param params
 * @returns
 */
export const fetchFormDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/form/getdetails.do`, {
    params,
  });
};

/**
 * 保存当前的form方案中设置的字段
 * @param params
 * @returns
 */
export const saveFormSchemeDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/form/updatedetails.do`, {
    method: 'POST',
    body: serialize(params),
  });
};

export const fetchGridDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/grid/getdetailsforedit.do`, {
    params,
  });
};

export const saveGridSchemeDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/grid/updatedetails.do`, {
    method: 'POST',
    body: serialize(params),
  });
};

export const fetchSortDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/sort/getdetails.do`, {
    params,
  });
};

export const saveSortSchemeDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/sort/updatedetails.do`, {
    params,
  });
};

export const fetchFilterDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/filter/getdetails.do`, {
    params,
  });
};

export const saveFilterSchemeDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/filter/updatedetails.do`, {
    params,
  });
};

export const fetchDefaultOrderDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/sort/getdefaultdetails.do`, {
    params,
  });
};

export const saveDefaultOrderSchemeDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/sort/updatedefaultdetails.do`, {
    params,
  });
};

export const fetchNavigateDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/navigate/getdetails.do`, {
    params,
  });
};

export const saveNavigateSchemeDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/navigate/updatedetails.do`, {
    params,
  });
};

/**
 * 读取一个附加字段的定义
 * @param params
 * @returns
 */
export const fetchFieldExpression = async (params: any) => {
  return request(`${API_HEAD}/platform/dataobjectfield/getexpression.do`, {
    params,
  });
};

/**
 * 更新一个附加字段的定义
 * @param params
 * @returns
 */
export const updateFieldExpression = async (params: any) => {
  return request(`${API_HEAD}/platform/dataobjectfield/updateexpression.do`, {
    params,
  });
};

/**
 * 获取实体对象条件，数据角色，可选数据角色的条件表达式
 * @param param0
 * @returns
 */
export const fetchConditionExpression = async ({
  id,
  type,
}: {
  id: string;
  type: ConditionType;
}) => {
  if (type === 'condition') {
    return request(`${API_HEAD}/platform/scheme/usercondition/getdetails.do`, {
      params: {
        conditionId: id,
      },
    });
  }
  return request(
    `${API_HEAD}/platform/${
      type === 'datarole' ? 'datafilterrole' : 'datacanselectfilterrole'
    }/getlimits.do`,
    {
      params: {
        roleId: id,
      },
    },
  );
};

export const updateConditionExpression = async ({
  id,
  type,
  title,
  details,
}: {
  id: string;
  type: ConditionType;
  title: string;
  details: any;
}) => {
  if (type === 'condition') {
    return request(`${API_HEAD}/platform/scheme/usercondition/updatedetails.do`, {
      params: {
        conditionid: id,
        schemename: title,
        schemeDefine: details,
      },
    });
  }
  return request(
    `${API_HEAD}/platform/${
      type === 'datarole' ? 'datafilterrole' : 'datacanselectfilterrole'
    }/updatelimits.do`,
    {
      params: {
        roleId: id,
        limits: details,
      },
    },
  );
};

export const testConditionExpression = async ({
  id,
  type,
  objectid,
}: {
  id: string;
  type: ConditionType;
  objectid: string;
}) => {
  if (type === 'condition') {
    return request(`${API_HEAD}/platform/scheme/usercondition/testusercondition.do`, {
      params: {
        objectid,
        conditionid: id,
      },
    });
  }
  return request(
    `${API_HEAD}/platform/${
      type === 'datarole' ? 'datafilterrole' : 'datacanselectfilterrole'
    }/testrole.do`,
    {
      params: {
        objectid,
        roleId: id,
      },
    },
  );
};

export const testAdditionField = async (params: any) => {
  return request(`${API_HEAD}/platform/dataobjectfield/testadditionfield.do`, {
    params,
  });
};

/**
 * 下载grid表单的excel或pdf文件
 * @param params 
 *          moduleName: moduleName,
            columns: JSON.stringify(getCurrentExportGridColumnDefine(moduleName)),
            page: 1,
            start: 0,
            limit: 1000000,
            conditions: JSON.stringify([]),
            colorless: false,
            usemonetary: false,
            monetaryUnit: 10000,
            monetaryText: '万',
            sumless: false,
            unitalone: false,
            pagesize: 'pageautofit',
            autofitwidth: true,
            scale: 100,
 */
export const downloadGridExcel = async (params: any) => {
  const children: Node[] = [];
  Object.keys(params).forEach((i) => {
    const node = window.document.createElement('input');
    node.type = 'hidden';
    node.name = i;
    node.value =
      typeof params[i] === 'string' ? params[i].replace(new RegExp('"', 'gm'), "'") : params[i];
    children.push(node);
  });
  const form = window.document.createElement('form');
  form.method = 'post';
  form.action = `${API_HEAD}/platform/dataobjectexport/exporttoexcel.do`;
  children.forEach((child) => form.appendChild(child));
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

/**
 * 下载一个记录的方案导出方案
 * @param params
 */
export const downloadRecordExcel = async (params: any) => {
  const children: Node[] = [];
  Object.keys(params).forEach((i) => {
    const node = window.document.createElement('input');
    node.type = 'hidden';
    node.name = i;
    node.value =
      typeof params[i] === 'string' ? params[i].replace(new RegExp('"', 'gm'), "'") : params[i];
    children.push(node);
  });
  const form = window.document.createElement('form');
  form.method = 'post';
  form.action = `${API_HEAD}/platform/dataobjectexport/exportexcelscheme.do`;
  children.forEach((child) => form.appendChild(child));
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

/**
 * 读取一个导航方案中的数据
 */
export const fetchNavigateTreeData = async (params: any) => {
  applyIf(params, {
    reverseOrder: 0,
    parentFilter: null,
  });
  return request(`${API_HEAD}/platform/navigatetree/fetchnavigatedata.do`, {
    params,
  });
};

/**
 * 读取一个导航方案中的数据(同步)
 */
export const fetchNavigateTreeDataSync = (params: any): any => {
  applyIf(params, {
    reverseOrder: 0,
    parentFilter: null,
  });
  return syncRequest(`${API_HEAD}/platform/navigatetree/fetchnavigatedata.do`, {
    params,
  });
};

export const fetchChildModuleData = async (params: any) => {
  return request(`${API_HEAD}/platform/dataobject/fetchchilddata.do`, {
    method: 'POST',
    body: serialize(params),
  });
};

// 新建记录时取得缺省值
export const getAjaxNewDefault = async (params: any) => {
  return request(`${API_HEAD}/platform/dataobject/getnewdefault.do`, {
    method: 'POST',
    body: serialize(params),
  });
};

// 树形结构中，将一个节点放在另一个节点之下
export const updateParentKey = async (params: any) => {
  return request(`${API_HEAD}/platform/dataobject/updateparentkey.do`, {
    method: 'POST',
    body: serialize(params),
  });
};
