/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { Reducer } from 'redux';
import type { Effect } from 'dva';
import type { CurrentUser, ListItemDataType, TagType } from '../pages/account/center/data';

import { queryCurrent, addTag, removeTag, updateSignature } from '../pages/account/center/service';

export interface ModalState {
  currentUser: Partial<CurrentUser>;
  list: ListItemDataType[];
}

export interface ModelType {
  namespace: string;
  state: ModalState;
  effects: {
    fetchCurrent: Effect;
    addTag: Effect;
    removeTag: Effect;
    editSignature: Effect;
  };
  reducers: {
    saveCurrentUser: Reducer<ModalState>;
    updateTags: Reducer<ModalState>;
    updateSignature: Reducer<ModalState>;
  };
}

const Model: ModelType = {
  namespace: 'accountCenter',

  state: {
    currentUser: {},
    list: [],
  },

  effects: {
    *fetchCurrent(_, { call, put }) {
      const response = yield call(queryCurrent);
      yield put({
        type: 'saveCurrentUser',
        payload: response,
      });
      yield put({
        type: 'fetchUserLimits',
        payload: {
          userid: response.user.id,
        },
      });
    },

    *addTag({ payload }, { call, put }) {
      yield call(addTag, payload);
      yield put({
        type: 'updateTags',
        payload: {
          type: 'add',
          label: payload.label,
        },
      });
    },

    *removeTag({ payload }, { call, put }) {
      yield call(removeTag, payload);
      yield put({
        type: 'updateTags',
        payload: {
          type: 'remove',
          label: payload.label,
        },
      });
    },

    *editSignature({ payload }, { call, put }) {
      yield call(updateSignature, payload);
      yield put({
        type: 'updateSignature',
        payload: {
          text: payload.text,
        },
      });
    },
  },

  reducers: {
    updateSignature(state, action) {
      const { text: signature } = action.payload;
      let { currentUser } = state as ModalState;
      const personnel = { ...currentUser.personnel, signature };
      currentUser = { ...currentUser, personnel };
      return {
        ...(state as ModalState),
        currentUser,
      };
    },

    updateTags(state, action) {
      const { type, label } = action.payload;
      let { currentUser } = state as ModalState;
      let { tags } = currentUser.personnel;
      if (type === 'add') {
        tags = [...tags, { key: label, label }];
      } else {
        tags = tags.filter((tag: TagType) => tag.label !== label);
      }
      const personnel = { ...currentUser.personnel, tags };
      currentUser = { ...currentUser, personnel };
      return {
        ...(state as ModalState),
        currentUser,
      };
    },

    saveCurrentUser(state, action) {
      return {
        ...(state as ModalState),
        currentUser: action.payload || {},
      };
    },
  },
};

export default Model;
