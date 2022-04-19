/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { extend } from 'umi-request';
import { notification, Modal } from 'antd';

export const API_HEAD = '/api';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
  999: '用户尚未得到授权',
};

let isAlert = false;

/**
 * 异常处理程序
 */
const errorHandler = (error: { response: Response }): Response => {
  const { response } = error;
  if (response && response.status) {
    const errorText = codeMessage[response.status] || response.statusText;
    const { status, url } = response;
    if (url.indexOf('getuserbean.do') === -1 && url.indexOf('logout') === -1) {
      // && window.location.href.indexOf('user/login') === -1
      // 不加&& window.location.href.indexOf('user/login') === -1 ie11 运行不正常，ie11中url  为空
      if (status === 999 || status === 401) {
        if (!isAlert) {
          isAlert = true; // 可能有多个request同时运行
          // eslint-disable-next-line
          alert('用户登录已超时,请按 确定 按钮重新进行身份验证！');
          window.location.reload();
        }
        // 用户登录超时，需要重新登录
        // 这里不是阻塞状态，因此request,会继续往下执行，则会出错
        Modal.warning({
          title: '用户登录已超时',
          content: '请按 确定 按钮重新进行身份验证！',
          okText: '确 定',
          onOk() {
            window.location.reload();
          },
        });
      } else
        notification.error({
          message: `请求错误 ${status}: ${url}`,
          description: errorText,
        });
    } else {
      // getuserbean.do 获取当前用户信息，如果尚未登录则不需要显示提示信息
    }
  } else if (!response) {
    notification.error({
      description: '您的网络发生异常，无法连接服务器',
      message: '网络异常',
    });
  }
  return response;
};

/**
 * 配置request请求时的默认参数
 */
const request = extend({
  errorHandler, // 默认错误处理
  credentials: 'include', // 默认请求是否带上cookie
  headers: {
    // 发送异步请求的标识，后台可以用来判断Ajax请求是否是异步的
    'X-Requested-With': 'XMLHttpRequest',
    antd: 'true',
  },
});

// https://github.com/GerryIsWarrior/ajax
// 获取同步数据
const ajax = require('ajax-js');

export const syncRequest = (
  url: string,
  { type = 'get', params }: { type?: string; params: object },
): any => {
  let result: object = {};
  ajax.common({
    url,
    type,
    requestHeader: {
      'X-Requested-With': 'XMLHttpRequest',
      antd: 'true',
    },
    async: false,
    data: params,
    successEvent: (res: string) => {
      result = res ? JSON.parse(res) : res;
    },
    errorEvent: (res: any) => {
      if (res === 999 || res === 401) {
        if (!isAlert) {
          isAlert = true; // 可能有多个request同时运行
          // eslint-disable-next-line
          alert('用户登录已超时,请按 确定 按钮重新进行身份验证！');
          window.location.reload();
        }
      } else {
        notification.error({
          message: `请求错误 ${res}: ${url}`,
          description: res,
        });
      }
    },
  });
  return result;
};

export default request;
