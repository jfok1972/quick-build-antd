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
    apply(payload, getAllFilterAjaxParam(moduleState.filters));

    if (sorts.length) {
      payload.sort = JSON.stringify(sorts);
    }
    if (istreemodel) {
      // ????????????????????????
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
          // ?????????????????????????????????
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
 * ?????????????????????????????????
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
 * ?????????????????????????????????
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
// ????????????????????????????????????????????????????????? request_payload ????????????windows nginx??????????????????????????????
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

// ?????????????????????????????????????????????????????? form data ????????????????????????
// ??????????????? https://segmentfault.com/a/1190000018774494
// ??????+8????????????data[k] = data[k].format(DATE_TIME); ??????????????????????????????
// ???mysql??????????????????default-time-zone=+08:00????????????????????????????????????????????????????????????
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
      // serialize ?????? formdata
      data: serialize({ data: JSON.stringify(data) }),
      method: 'POST',
    }).then((response) => {
      resolve(response);
    });
  });
};

// ???????????????????????????
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

// ???????????????????????????
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
 * ??????????????????combodata?????????
 * @param params
 * moduleName: moduleName
 */
export const fetchObjectComboData = (params: any) => {
  return syncRequest(`${API_HEAD}/platform/dataobject/fetchcombodata.do`, {
    params,
  });
};

/**
 * ??????????????????treedata?????????
 * @param params
 * moduleName: moduleName
 */
export const fetchObjectComboTreeData = (params: any) => {
  return syncRequest(`${API_HEAD}/platform/dataobject/fetchpickertreedata.do`, {
    params,
  });
};

/**
 * ??????????????????????????????????????????????????????????????????????????????????????????????????????
 * @param params
 * moduleName: moduleName
 */
export const fetchObjectComboTreePathData = (params: any) => {
  return syncRequest(`${API_HEAD}/platform/dataobject/fetchtreeselectpathdata.do`, {
    params,
  });
};

/**
 * ????????????????????????????????????????????????????????????????????????????????????
 * @param params
 * @returns
 */
export const fetchModuleHierarchyData = (params: any) => {
  return syncRequest(`${API_HEAD}/platform/module/getModuleHierarchyTree.do`, {
    params,
  });
};

/**
 * ???????????????????????????????????????????????????--??????
 * @param params
 * @returns
 */
export const fetchModuleFields = async (params: any) => {
  return request(`${API_HEAD}/platform/module/getModuleFields.do`, {
    params,
  });
};

/**
 * ????????????form?????????????????????????????????????????????
 * @param params
 * @returns
 */
export const fetchFormDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/form/getdetails.do`, {
    params,
  });
};

/**
 * ???????????????form????????????????????????
 * @param params
 * @returns
 */
export const saveFormSchemeDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/form/updatedetails.do`, {
    params,
  });
};

export const fetchGridDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/grid/getdetailsforedit.do`, {
    params,
  });
};

export const saveGridSchemeDetails = async (params: any) => {
  return request(`${API_HEAD}/platform/scheme/grid/updatedetails.do`, {
    params,
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
 * ?????????????????????????????????
 * @param params
 * @returns
 */
export const fetchFieldExpression = async (params: any) => {
  return request(`${API_HEAD}/platform/dataobjectfield/getexpression.do`, {
    params,
  });
};

/**
 * ?????????????????????????????????
 * @param params
 * @returns
 */
export const updateFieldExpression = async (params: any) => {
  return request(`${API_HEAD}/platform/dataobjectfield/updateexpression.do`, {
    params,
  });
};

/**
 * ??????????????????????????????????????????????????????????????????????????????
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
 * ??????grid?????????excel???pdf??????
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
            monetaryText: '???',
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
 * ???????????????????????????????????????
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
 * ????????????????????????????????????
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
 * ????????????????????????????????????(??????)
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

// ??????????????????????????????
export const getAjaxNewDefault = async (params: any) => {
  return request(`${API_HEAD}/platform/dataobject/getnewdefault.do`, {
    method: 'POST',
    body: serialize(params),
  });
};

// ????????????????????????????????????????????????????????????
export const updateParentKey = async (params: any) => {
  return request(`${API_HEAD}/platform/dataobject/updateparentkey.do`, {
    method: 'POST',
    body: serialize(params),
  });
};
