/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { Subscription, Reducer, Effect } from 'umi';
import type { NoticeIconData } from '@/components/NoticeIcon';
import {
  notificationRead,
  notificationRemove,
  notificationClear,
  queryNotices,
  notificationReload,
} from '@/services/user';
import type { ConnectState } from './connect.d';

export interface NoticeItem extends NoticeIconData {
  id: string;
  type: string;
  status: string;
}

export interface GlobalModelState {
  collapsed: boolean;
  notices: NoticeItem[];
}

export interface GlobalModelType {
  namespace: 'global';
  state: GlobalModelState;
  effects: {
    fetchNotices: Effect;
    clearNotices: Effect;
    removeNotice: Effect;
    reloadAllNotice: Effect;
    changeNoticeReadState: Effect;
  };
  reducers: {
    changeLayoutCollapsed: Reducer<GlobalModelState>;
    saveNotices: Reducer<GlobalModelState>;
    saveClearedNotices: Reducer<GlobalModelState>;
  };
  subscriptions: { setup: Subscription };
}

const getUnreadCount = (notices: NoticeItem[]): number => {
  let count: number = 0;
  notices.forEach((rec) => {
    if (rec.type === 'notification') {
      count += !rec.read ? 1 : 0;
    }
  });
  return count;
};

const getAllCount = (notices: NoticeItem[]): number => {
  let count: number = 0;
  notices.forEach((rec) => {
    if (rec.type === 'event') {
      count += rec.count || 0;
    } else if (rec.type === 'notification') {
      count += !rec.read ? 1 : 0;
    }
  });
  return count;
};

const GlobalModel: GlobalModelType = {
  namespace: 'global',

  state: {
    collapsed: false,
    notices: [],
  },

  effects: {
    *fetchNotices(_, { call, put }) {
      const data = yield call(queryNotices);
      data.forEach((record: NoticeItem) => {
        const rec = record;
        if (rec.type === 'event') {
          rec.status = 'urgent';
          if (rec.maxhours) {
            if (rec.maxhours >= 24) rec.extra = `最长已等待${Math.ceil(rec.maxhours / 24.0)}天`;
            else rec.extra = `最长已等待${rec.maxhours}小时`;
          }
          if (rec.action === 'approve') {
            rec.description = `有 ${rec.data?.length} 个任务等待审批`;
          } else if (rec.action === 'claim') {
            rec.description = `有 ${rec.data?.length} 个任务等待接受`;
          } else if (rec.action === 'audit') {
            rec.description = `有 ${rec.count} 条记录等待审核`;
          }
        }
      });
      yield put({
        type: 'saveNotices',
        payload: data,
      });
      yield put({
        type: 'user/changeNotifyCount',
        payload: {
          totalCount: getAllCount(data),
          unreadCount: getUnreadCount(data),
        },
      });
    },

    *clearNotices({ payload }, { put, select }) {
      // 当前显示的所有通知都被清除，未显示的可能是后来增加的不清除
      const items: string[] = yield select((state: ConnectState) =>
        state.global.notices.filter((item) => item.type === payload).map((item) => item.id),
      );
      yield put({
        type: 'saveClearedNotices',
        payload,
      });
      const notices: NoticeItem[] = yield select((state: ConnectState) => state.global.notices);

      yield notificationClear(items);
      yield put({
        type: 'user/changeNotifyCount',
        payload: {
          totalCount: getAllCount(notices),
          unreadCount: 0,
        },
      });
    },

    *changeNoticeReadState({ payload }, { put, select }) {
      const notices: NoticeItem[] = yield select((state: ConnectState) =>
        state.global.notices.map((item) => {
          const notice = { ...item };
          if (notice.id === payload) {
            notice.read = true;
          }
          return notice;
        }),
      );
      yield put({
        type: 'saveNotices',
        payload: notices,
      });
      yield notificationRead(payload);
      yield put({
        type: 'user/changeNotifyCount',
        payload: {
          totalCount: getAllCount(notices),
          unreadCount: getUnreadCount(notices),
        },
      });
    },
    *removeNotice({ payload }, { put, select }) {
      const notices: NoticeItem[] = yield select((state: ConnectState) =>
        state.global.notices.filter((item) => item.id !== payload),
      );
      yield put({
        type: 'saveNotices',
        payload: notices,
      });
      yield notificationRemove(payload);
      yield put({
        type: 'user/changeNotifyCount',
        payload: {
          totalCount: getAllCount(notices),
          unreadCount: getUnreadCount(notices),
        },
      });
    },
    *reloadAllNotice(_, { put }) {
      yield notificationReload();
      yield put({
        type: 'global/fetchNotices',
      });
    },
  },

  reducers: {
    changeLayoutCollapsed(state = { notices: [], collapsed: true }, { payload }): GlobalModelState {
      return {
        ...state,
        collapsed: payload,
      };
    },
    saveNotices(state, { payload }): GlobalModelState {
      return {
        collapsed: false,
        ...state,
        notices: payload,
      };
    },
    saveClearedNotices(state = { notices: [], collapsed: false }, { payload }): GlobalModelState {
      return {
        ...state,
        notices: state.notices.filter((item): boolean => item.type !== payload),
      };
    },
  },

  subscriptions: {
    setup({ history }): void {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      history.listen(({ pathname, search }): void => {
        if (typeof window.ga !== 'undefined') {
          window.ga('send', 'pageview', pathname + search);
        }
      });
    },
  },
};

export default GlobalModel;
