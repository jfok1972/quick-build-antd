/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import request, { API_HEAD } from '@/utils/request';
import { serialize } from 'object-to-formdata';

/**
 * 取得当前登录的用户信息和系统信息
 */
export async function queryCurrent(): Promise<any> {
  return request(`${API_HEAD}/login/getuserbean.do`);
}

export async function queryNotices(): Promise<any> {
  // return request(API_HEAD+'/notices');
  return request(`${API_HEAD}/platform/systemframe/getapprovequestioninfo.do`);
}

export async function notificationRead(notificationId: string): Promise<any> {
  return request(`${API_HEAD}/platform/systemframe/notificationread.do`, {
    params: {
      notificationId,
    },
  });
}

export async function notificationRemove(notificationId: string): Promise<any> {
  return request(`${API_HEAD}/platform/systemframe/notificationremove.do`, {
    params: {
      notificationId,
    },
  });
}

export async function notificationReload(): Promise<any> {
  return request(`${API_HEAD}/platform/systemframe/notificationreload.do`, {});
}

export async function notificationClear(deleteds: string[]): Promise<any> {
  return request(`${API_HEAD}/platform/systemframe/notificationclear.do`, {
    method: 'POST',
    data: serialize({
      deleteds: deleteds.join(','),
    }),
  });
}
