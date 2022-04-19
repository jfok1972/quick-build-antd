/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { Effect } from 'dva';
import type { Reducer } from 'redux';
import { queryCurrent } from '@/services/user';
import { apply } from '@/utils/utils';

/**
 * 用户可以选择的数据权限
 */
export interface CanSelectDataRole {
  checked: boolean;
  roleId: string;
  roleName: string;
  moduleNames: string[];
}

export interface CurrentUser {
  username?: string;
  usercode?: string;
  title?: string;
  group?: string;
  signature?: string;
  passwordstrong?: string;
  needResetPassword?: boolean;
  roleCodes?: string[];
  tags?: {
    key: string;
    label: string;
  }[];
  userid?: string;
  notifyCount?: number;
  unreadCount?: number;
  canselectdatarole?: CanSelectDataRole[];
}

export interface UserModelState {
  currentUser?: CurrentUser;
}

export interface UserModelType {
  namespace: 'user';
  state: UserModelState;
  effects: {
    fetchCurrent: Effect;
  };
  reducers: {
    saveCurrentUser: Reducer<UserModelState>;
    changeNotifyCount: Reducer<UserModelState>;
    dataRoleCheckChanged: Reducer<UserModelState>;
    dataRoleCheckReset: Reducer<UserModelState>;
  };
}

export const currentUser: CurrentUser = {};

const UserModel: UserModelType = {
  namespace: 'user',

  state: {
    currentUser: {},
  },

  effects: {
    *fetchCurrent(_, { call, put, select }) {
      const userid = yield select((state: any) => state.user.currentUser.userid);
      // 如果当前用户信息已加载，则不用重新加载了
      if (!userid) {
        const response = yield call(queryCurrent);
        yield put({
          type: 'saveCurrentUser',
          payload: response,
        });
      }
    },
  },

  reducers: {
    saveCurrentUser(state, action) {
      // 将用户放到全局变量中
      const user = action.payload as CurrentUser;
      user.needResetPassword =
        user.needResetPassword || user.passwordstrong === '太短' || user.passwordstrong === '弱';
      apply(currentUser, user);
      return {
        ...state,
        currentUser: { ...user },
      };
    },

    changeNotifyCount(state, action) {
      return {
        ...state,
        currentUser: {
          ...state!.currentUser,
          notifyCount: action.payload.totalCount,
          unreadCount: action.payload.unreadCount,
        },
      };
    },

    dataRoleCheckChanged(state = {}, action) {
      const { roleId, checked } = action.payload;
      const canselectdatarole = state.currentUser?.canselectdatarole?.map((role) =>
        role.roleId === roleId ? { ...role, checked } : role,
      );
      const user = {
        ...state.currentUser,
        canselectdatarole,
      };
      return {
        ...state,
        currentUser: user,
      };
    },

    dataRoleCheckReset(state = {}) {
      const canselectdatarole = state.currentUser?.canselectdatarole?.map((role) => ({
        ...role,
        checked: false,
      }));
      const user = {
        ...state.currentUser,
        canselectdatarole,
      };
      apply(currentUser, user);
      return {
        ...state,
        currentUser: user,
      };
    },
  },
};

export default UserModel;
