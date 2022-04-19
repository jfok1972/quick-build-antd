/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Component } from 'react';
import type { ConnectProps } from 'umi';
import { connect, history } from 'umi';
import { Tag, message } from 'antd';
import groupBy from 'lodash/groupBy';
import moment from 'moment';
import type { NoticeItem } from '@/models/global';
import type { CurrentUser } from '@/models/user';
import { currentUser as currUser } from '@/models/user';
import type { ConnectState } from '@/models/connect';
import type { ParentFilterModal } from '@/pages/module/data';
import { getModuleUrlFormSysMenu } from '@/layouts/BasicLayout';
import NoticeIcon from '../NoticeIcon';
import styles from './index.less';
import { animateCSS } from '@/utils/utils';

export interface GlobalHeaderRightProps extends Partial<ConnectProps> {
  notices?: NoticeItem[];
  currentUser?: CurrentUser;
  disableActiviti?: boolean;
  fetchingNotices?: boolean;
  onNoticeVisibleChange?: (visible: boolean) => void;
  onNoticeClear?: (tabName?: string) => void;
}

let noticeDispatch: any = null;
export const refreshNotices = () => {
  noticeDispatch({
    type: 'global/fetchNotices',
  });
};

class GlobalHeaderRight extends Component<GlobalHeaderRightProps> {
  componentDidMount() {
    const { dispatch } = this.props;
    if (dispatch) {
      noticeDispatch = dispatch;
      dispatch({
        type: 'global/fetchNotices',
      });
    }
  }

  changeReadState = (clickedItem: NoticeItem): void => {
    const { id } = clickedItem;
    const { dispatch } = this.props;

    if (dispatch) {
      dispatch({
        type: 'global/changeNoticeReadState',
        payload: id,
      });
    }
  };

  handleNoticeClear = (title: string, key: string) => {
    const { dispatch } = this.props;
    message.info(`${'清空了'} ${title}`);
    if (dispatch) {
      dispatch({
        type: 'global/clearNotices',
        payload: key,
      });
    }
  };

  // 删除一个通知
  handleNoticeRemove = (clickedItem: NoticeItem): void => {
    const { id } = clickedItem;
    const { dispatch } = this.props;
    message.warn('已删除一条通知！');
    animateCSS(`#notice-${clickedItem.key}`, 'backOutRight').then(() => {
      if (dispatch) {
        dispatch({
          type: 'global/removeNotice',
          payload: id,
        });
      }
    });
  };

  handlerNoticeReloadAll = () => {
    const { dispatch } = this.props;
    message.info(`已经加载了所有通知！`);
    if (dispatch) {
      dispatch({
        type: 'global/reloadAllNotice',
      });
    }
  };

  getNoticeData = (): Record<string, NoticeItem[]> => {
    const { notices = [] } = this.props;

    if (!notices || notices.length === 0 || !Array.isArray(notices)) {
      return {};
    }

    const newNotices = notices.map((notice) => {
      const newNotice = { ...notice };

      if (newNotice.datetime) {
        newNotice.datetime = moment(notice.datetime as string).fromNow();
      }

      if (newNotice.id) {
        newNotice.key = newNotice.id;
      }

      if (newNotice.extra && newNotice.status) {
        const color = {
          todo: '',
          processing: 'blue',
          urgent: 'red',
          doing: 'gold',
        }[newNotice.status];
        newNotice.extra = (
          <Tag
            color={color}
            style={{
              marginRight: 0,
            }}
          >
            {newNotice.extra}
          </Tag>
        );
      }

      return newNotice;
    });
    return groupBy(newNotices, 'type');
  };

  getUnreadData = (noticeData: Record<string, NoticeItem[]>) => {
    const unreadMsg: Record<string, number> = {};
    Object.keys(noticeData).forEach((key) => {
      const value = noticeData[key];

      if (!unreadMsg[key]) {
        unreadMsg[key] = 0;
      }

      if (Array.isArray(value)) {
        unreadMsg[key] = value.filter((item) => !item.read).length;
      }
    });
    return unreadMsg;
  };

  // 打开我可以审批的模块，加入条件限定
  pushApprove = (item: NoticeItem) => {
    const { moduleName = '' } = item;
    const parentFilter: ParentFilterModal = {
      moduleName,
      fieldahead: null,
      fieldName: 'actAssignee',
      fieldtitle: '我可以审批的记录',
      operator: '=',
      fieldvalue: currUser.userid || '',
      text: '',
    };
    this.pushModuleWithParentFilter(moduleName, parentFilter);
  };

  //  // 打开我可以接受的模块，加入条件限定
  pushClaim = (item: NoticeItem) => {
    const { moduleName = '' } = item;
    const parentFilter: ParentFilterModal = {
      moduleName,
      fieldahead: null,
      fieldName: 'actCandidate',
      fieldtitle: '我可以接受任务的记录',
      operator: 'like',
      fieldvalue: currUser.userid || '',
      text: '',
    };
    this.pushModuleWithParentFilter(moduleName, parentFilter);
  };

  // 打开我可以审核的模块，加入条件限定
  pushAudit = (item: NoticeItem) => {
    const { moduleName = '' } = item;
    const parentFilter: ParentFilterModal = {
      moduleName,
      fieldahead: null,
      fieldName: 'canAuditingUserid',
      fieldtitle: '我可以审核的记录',
      operator: '=',
      fieldvalue: currUser.userid || '',
      text: '',
    };
    this.pushModuleWithParentFilter(moduleName, parentFilter);
  };

  pushQuestionModule = (item: NoticeItem) => {
    const { moduleName = '' } = item;
    const parentFilter: ParentFilterModal = {
      moduleName,
      fieldahead: null,
      fieldName: item.filterFieldName || '',
      fieldtitle: item.filterText || '',
      operator: item.filterFieldOperator || '',
      fieldvalue: item.filterFieldValue || '',
      text: '',
    };
    this.pushModuleWithParentFilter(moduleName, parentFilter);
  };

  // 打开一个模块加上限定条件
  pushModuleWithParentFilter = (moduleName: string, pf: ParentFilterModal) => {
    const parentFilterParam = encodeURIComponent(JSON.stringify(pf));
    const pathname = getModuleUrlFormSysMenu(moduleName);
    history.push({
      pathname,
      state: {
        parentFilter: parentFilterParam,
      },
    });
  };

  render() {
    const { currentUser: user, fetchingNotices, onNoticeVisibleChange } = this.props;
    const noticeData = this.getNoticeData();
    const unreadMsg = this.getUnreadData(noticeData);
    return (
      <NoticeIcon
        className={styles.action}
        count={user && user.notifyCount}
        unreadCount={user && user.unreadCount}
        onItemClick={(item_) => {
          const item = item_ as NoticeItem;
          // 待办里面包括，可以审核，可以审批，可以接受任务，以及自定义的待办事项
          if (item.type === 'event') {
            if (item.action === 'approve') {
              this.pushApprove(item);
            } else if (item.action === 'claim') {
              this.pushClaim(item);
            } else if (item.action === 'audit') {
              this.pushAudit(item);
            } else this.pushQuestionModule(item);
          } else if (item.type === 'notification') {
            // 消息还没有阅读
            if (!item.read) {
              this.changeReadState(item);
              message.info('已阅读一条通知！');
            }
          }
        }}
        loading={fetchingNotices}
        clearText="清空"
        refreshText="刷新"
        onRefresh={refreshNotices}
        viewMoreText="查看更多"
        onClear={this.handleNoticeClear}
        onRemove={(item) => this.handleNoticeRemove(item as NoticeItem)}
        onPopupVisibleChange={onNoticeVisibleChange}
        onViewMore={(props) => {
          if (props.tabKey === 'notification') {
            this.handlerNoticeReloadAll();
          } else {
            // message.info(`没有更多的${props.title}事项了！`);
            // 转到工作台
            history.push({
              pathname: '/dashboard/workplace',
            });
          }
        }}
        clearClose
      >
        <NoticeIcon.Tab
          // hidden={!!disableActiviti}
          tabKey="event"
          title="待办"
          emptyText="您已完成所有待办"
          list={noticeData.event}
          showRefresh
          showViewMore
        />
        <NoticeIcon.Tab
          tabKey="notification"
          count={unreadMsg.notification}
          list={noticeData.notification}
          title="通知"
          emptyText={
            (
              <span>
                <div>您已查看所有通知</div>
                <div
                  style={{
                    cursor: 'pointer',
                    marginTop: '12px',
                  }}
                  onClick={this.handlerNoticeReloadAll}
                >
                  重新查看通知
                </div>
              </span>
            ) as any
          }
          showClear
          showRefresh={false}
          showViewMore
        />
        <NoticeIcon.Tab
          tabKey="message"
          list={noticeData.message}
          title="消息"
          emptyText="您已读完所有消息"
        />
      </NoticeIcon>
    );
  }
}

export default connect(({ user, global, loading, systemInfo }: ConnectState) => ({
  currentUser: user.currentUser,
  collapsed: global.collapsed,
  disableActiviti: systemInfo.systemInfo?.systeminfo.disableActiviti,
  fetchingMoreNotices: loading.effects['global/fetchMoreNotices'],
  fetchingNotices: loading.effects['global/fetchNotices'],
  notices: global.notices,
}))(GlobalHeaderRight);
