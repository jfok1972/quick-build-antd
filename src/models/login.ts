import type { Reducer } from 'redux';
import type { Effect } from 'dva';
import { history, loginslatkey } from 'umi';
// import { stringify } from 'querystring';
import { fakeAccountLogin, fakeAccountLogout, getFakeCaptcha } from '@/services/login';
import { setAuthority } from '@/utils/authority';
import { getPageQuery, encryptString } from '@/utils/utils';

export interface StateType {
  status?: 'ok' | 'error' | 'warnning';
  errorcode?: string;
  type?: string;
  currentAuthority?: 'user' | 'guest' | 'admin';
}

export interface LoginModelType {
  namespace: string;
  state: StateType;
  effects: {
    login: Effect;
    getCaptcha: Effect;
    logout: Effect;
  };
  reducers: {
    changeLoginStatus: Reducer<StateType>;
    loginErrorCode7: Reducer<StateType>;
  };
}

const Model: LoginModelType = {
  namespace: 'login',

  state: {
    status: undefined,
  },

  effects: {
    *login({ payload }, { call, put }) {
      const response = yield call(fakeAccountLogin, payload);
      // 要兼容以前的后台，登录失败返回success : false
      const responseStatus = {
        type: payload.type,
        status: response.success ? 'ok' : 'error',
        errorcode: response.data,
        currentAuthority: 'admin',
      };
      // 单个帐号不允许同时登录时，要弹出一个对话框，确定是否强制登录
      if (response.data === '7') responseStatus.status = 'warnning';
      yield put({
        type: 'changeLoginStatus',
        payload: responseStatus,
      });
      // Login successfully
      if (response.success === true) {
        localStorage.setItem('login-user-code', payload.usercode);
        if (localStorage.getItem('login-allow-save-pwd') === 'true') {
          localStorage.setItem('login-user-loginslatkey', encryptString(loginslatkey[0]));
          localStorage.setItem('login-user-password', encryptString(payload.password));
        } else {
          localStorage.removeItem('login-user-loginslatkey');
          localStorage.removeItem('login-user-password');
        }
        const urlParams = new URL(window.location.href);
        const params = getPageQuery();
        let { redirect } = params as { redirect: string };
        if (redirect) {
          const redirectUrlParams = new URL(redirect);
          if (redirectUrlParams.origin === urlParams.origin) {
            redirect = redirect.substr(urlParams.origin.length);
            if (redirect.match(/^\/.*#/)) {
              redirect = redirect.substr(redirect.indexOf('#') + 1);
            }
          } else {
            window.location.href = '/';
            return;
          }
        }
        history.push(redirect || '/');
      }
    },

    *getCaptcha({ payload }, { call }) {
      yield call(getFakeCaptcha, payload);
    },

    *logout(_, { call }) {
      yield call(fakeAccountLogout);
      window.location.href = `${window.location.origin}/user/login`;
      // const { redirect } = getPageQuery();
      // Note: There may be security issues, please note
      // if (window.location.pathname !== '/user/login' && !redirect) {
      //  router.replace({
      //    pathname: '/user/login',
      //    search: stringify({
      //      redirect: window.location.href,
      //    }),
      //  });
      // }
    },
  },

  reducers: {
    changeLoginStatus(state, { payload }) {
      setAuthority(payload.currentAuthority);
      return {
        ...state,
        status: payload.status,
        type: payload.type,
        errorcode: payload.errorcode,
      };
    },

    // 当用户不允许重复登录时，并登时提示，在选择了取消时执行此操作
    loginErrorCode7(state) {
      return {
        ...state,
        status: 'error',
      };
    },
  },
};

export default Model;
