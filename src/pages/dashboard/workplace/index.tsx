/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useMemo } from 'react';
import { API_HEAD } from '@/utils/request';
import type { Dispatch } from 'redux';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import styles from './index.less';
import { connect } from 'dva';
import type { CurrentUser } from '@/pages/account/center/data';
import { currentUser as currUser } from '@/models/user';
import type { ModalState } from '@/models/accountCenter';
import { useEffect } from 'react';
import {
  Result,
  Skeleton,
  Statistic,
  Card,
  Space,
  Button,
  Tooltip,
  message,
  Popconfirm,
} from 'antd';
import type { UserModelState } from '@/models/user';
import DetailGrid from '@/pages/module/detailGrid';
import type { GlobalModelState } from '@/models/connect';
import type { NoticeItem } from '@/models/global';
import type { ParentFilterModal } from '@/pages/module/data';
import moment from 'moment';
import { AttachemntDisplayButton } from '@/components/NoticeIcon/AttachmentDisplayButton';
import { getModuleInfo } from '@/pages/module/modules';
import { CloseOutlined, NotificationOutlined } from '@ant-design/icons';
import { animateCSS } from '@/utils/utils';

interface WorkplaceProps {
  dispatch: Dispatch<any>;
  route: any;
  location: any;
  match: any;
  currentUser: Partial<CurrentUser>;
  currentUserLoading: boolean;
  user: any;
  global: GlobalModelState;
}

const Workplace: React.FC<WorkplaceProps> = ({ user, currentUser, global, dispatch }) => {
  const { personnel } = currentUser;
  const { unreadCount } = user;
  let approveCount = 0;
  let auditCount = 0;
  let otherCount = 0;
  let notificationCount = 0;
  global.notices.forEach((item) => {
    if (item.type === 'event') {
      if (item.action === 'approve' || item.action === 'claim') approveCount += item.count || 0;
      else if (item.action === 'audit') auditCount += item.count || 0;
      else otherCount += item.count || 0;
    } else if (item.type === 'notification') {
      notificationCount += 1;
    }
  });
  useEffect(() => {
    if (!(personnel && personnel.name)) {
      dispatch({
        type: 'accountCenter/fetchCurrent',
      });
    }
  }, []);

  const UserRegion: React.FC<{}> = () => {
    if (!personnel) return <Skeleton avatar paragraph={{ rows: 1 }} active />;
    const hours = new Date().getHours();
    return (
      <div className={styles.pageHeaderContent}>
        <img
          className={styles.avatar}
          alt="用户头像"
          src={`${API_HEAD}/platform/systemframe/getuserfavicon.do`}
        />
        <div className={styles.content}>
          <div className={styles.contentTitle}>
            <span style={{ fontSize: '16px' }}>{hours >= 12 ? '午安，' : '早安，'}</span>
            {`${personnel.name}`}
            <span style={{ fontSize: '16px' }}>，祝开心每一天！</span>
          </div>
          <div>
            {personnel.technical} {personnel.stationname}
            {' | '}
            {personnel.orgfullname}
          </div>
        </div>
      </div>
    );
  };

  const ExtraContent: React.FC<{}> = () => {
    return (
      <div className={styles.extraContent}>
        <div className={styles.statItem}>
          <Statistic title="待办事项" value={approveCount ? `${approveCount}个` : '无'} />
        </div>
        {auditCount ? (
          <div className={styles.statItem}>
            <Statistic title="待审核" value={`${auditCount}个`} />
          </div>
        ) : null}
        {otherCount ? (
          <div className={styles.statItem}>
            <Statistic title="待处任务" value={`${otherCount}个`} />
          </div>
        ) : null}
        <div className={styles.statItem}>
          <Statistic title="待阅通知" value={unreadCount ? `${unreadCount}条` : '无'} />
        </div>
      </div>
    );
  };

  // 使用useMemo防止审批过后重新计算待办事项时刷新此控件，刷新时打开的审批窗口会有一个闪烁，关闭了再打开的动作。
  const runtimeTaskDetailGrid = useMemo(() => {
    return (
      <DetailGrid
        moduleName="VActRuTask"
        parentOperateType="edit"
        displayTitle
        parentFilter={undefined}
        dataminingFilter={{}}
      />
    );
  }, []);

  /**
   * 所有我可以审核的模块
   * @param param0
   * @returns
   */
  const auditModule = ({ notices }: { notices: NoticeItem[] }) => {
    return notices.map((item) => {
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
      return (
        // 必须要加一个key,否则某个模块取消后，会出现错乱
        <Card key={`audit_${moduleName}`}>
          <DetailGrid
            moduleName={moduleName}
            parentFilter={parentFilter}
            parentOperateType="display"
            // readOnly
            displayTitle
            displayParentTitle
          />
        </Card>
      );
    });
  };

  /**
   * 除了审核，审批的之外的其他需要处理的模块
   */
  const needActionModule = ({ notices }: { notices: NoticeItem[] }) => {
    return notices.map((item) => {
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
      return (
        // 必须要加一个key,否则某个模块取消后，会出现错乱
        <Card key={`needAction_${moduleName}${item.filterFieldName}${item.filterFieldValue}`}>
          <DetailGrid
            moduleName={moduleName}
            parentFilter={parentFilter}
            parentOperateType="display"
            // readOnly
            displayTitle
            displayParentTitle
          />
        </Card>
      );
    });
  };

  const notificationList = ({ notices }: { notices: NoticeItem[] }) => {
    const cardId = 'workplace_card';
    return (
      <Card
        key={`${cardId}notification`}
        id={cardId}
        size="small"
        className={styles.projectList}
        style={{ marginBottom: 24 }}
        title={
          <span>
            <NotificationOutlined />
            {' 所有通知'}
          </span>
        }
        bordered={false}
        extra={
          <Popconfirm
            title="确定要清除所有通知吗？"
            okText="清空"
            cancelText="取消"
            onConfirm={() => {
              message.success('清空了所有通知');
              animateCSS(`#${cardId}`, 'backOutDown').then(() => {
                dispatch({
                  type: 'global/clearNotices',
                  payload: 'notification',
                });
              });
            }}
          >
            <Button type="link">清空通知</Button>
          </Popconfirm>
        }
        bodyStyle={{ padding: 0 }}
      >
        {notices.map((item) => (
          <div id={`workplace_notice${item.id}`}>
            <Card.Grid className={styles.projectGrid} key={item.id}>
              <Card bodyStyle={{ padding: 0 }} bordered={false}>
                <Card.Meta
                  title={[
                    item.record && item.record.attachmentcount ? (
                      <AttachemntDisplayButton
                        record={item.record}
                        moduleInfo={getModuleInfo('FNotification')}
                        params={{ placement: undefined }}
                      />
                    ) : null,
                    <div className={styles.cardTitle}>{item.title}</div>,
                  ]}
                  description={
                    <Tooltip title={item.description} trigger={['click']}>
                      {item.description}
                    </Tooltip>
                  }
                />
                <div className={styles.projectItemContent}>
                  <a />
                  {item.datetime && (
                    <span className={styles.datetime}>
                      {moment(item.datetime as string).fromNow()}
                    </span>
                  )}
                </div>
                <span className={styles.closeIcon}>
                  <CloseOutlined
                    onClick={() => {
                      animateCSS(`#workplace_notice${item.id}`, 'backOutRight').then(() => {
                        dispatch({
                          type: 'global/removeNotice',
                          payload: item.id,
                        });
                      });
                    }}
                  />
                </span>
              </Card>
            </Card.Grid>
          </div>
        ))}
      </Card>
    );
  };

  return (
    <PageHeaderWrapper title={<UserRegion />} extra={<ExtraContent />}>
      <Space direction="vertical" style={{ width: '100%' }} size={[16, 16]}>
        {approveCount ? <Card key={`runtime_Approve_Task`}>{runtimeTaskDetailGrid}</Card> : null}
        {auditModule({
          notices: global.notices.filter(
            ({ type, action }) => type === 'event' && action === 'audit',
          ),
        })}
        {needActionModule({
          notices: global.notices.filter((notice) => notice.type === 'event' && !notice.action),
        })}
        {notificationCount
          ? notificationList({
              notices: global.notices.filter((notice) => notice.type === 'notification'),
            })
          : null}
        {!(personnel && personnel.name) || approveCount || auditCount || otherCount ? null : (
          <Result
            status="success"
            title="您所有的工作都完成了"
            subTitle="所有待办和待阅工作都完成了，有新的工作将会显示在此处！"
          />
        )}
      </Space>
    </PageHeaderWrapper>
  );
};

export default connect(
  ({
    loading,
    accountCenter,
    user,
    global,
  }: {
    loading: { effects: Record<string, boolean> };
    accountCenter: ModalState;
    user: UserModelState;
    global: GlobalModelState;
  }) => ({
    user: user.currentUser,
    global,
    currentUser: accountCenter.currentUser,
    currentUserLoading: loading.effects['accountCenter/fetchCurrent'],
  }),
)(Workplace);
