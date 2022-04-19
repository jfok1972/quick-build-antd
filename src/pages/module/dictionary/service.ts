/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import request, { API_HEAD, syncRequest } from '@/utils/request';
import { serialize } from 'object-to-formdata';

const DC = '_dc';

export async function queryDicrionaryDefine(params: any) {
  return request(`${API_HEAD}/dictionary/getdictionary.do`, {
    method: 'POST',
    body: serialize(params),
  });
}

export async function queryDictionaryData(params: any) {
  return request(`${API_HEAD}/dictionary/getDictionaryComboData.do`, {
    params: {
      ...params,
      [DC]: new Date().getTime(),
    },
  });
}

export function querySyncDicrionaryDefine(params: any): any {
  return syncRequest(`${API_HEAD}/dictionary/getdictionary.do`, {
    params,
  });
}

export function querySyncDictionaryData(params: any): any {
  return syncRequest(`${API_HEAD}/dictionary/getDictionaryComboData.do`, {
    params,
  });
}

export function querySyncPropertys(params: any): any {
  return syncRequest(`${API_HEAD}/dictionary/getPropertyComboData.do`, {
    params,
  });
}
