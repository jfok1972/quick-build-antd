/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import request, { API_HEAD } from '@/utils/request';

/**
 * 取得当前用户的信息
 */
export async function queryCurrent() {
  return request(`${API_HEAD}/platform/systemframe/currentuser.do`);
}

/**
 * 给当前用户增加一个自定义标签
 * @param params
 */
export async function addTag(params: { label: string }) {
  return request(`${API_HEAD}/platform/userfavourite/addtag.do`, {
    params,
  });
}

/**
 * 删除当前用户的一个自定义标签
 * @param params
 */
export async function removeTag(params: { label: string }) {
  return request(`${API_HEAD}/platform/userfavourite/removetag.do`, {
    params,
  });
}

/**
 * 更新当前用户的签名
 * @param params
 */
export async function updateSignature(params: { text: string }) {
  return request(`${API_HEAD}/platform/userfavourite/updatesignature.do`, {
    params,
  });
}
