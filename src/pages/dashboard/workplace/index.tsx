import React, { useMemo } from 'react';
import { API_HEAD } from '@/utils/request';
import type { Dispatch } from 'redux';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import styles from './index.less';
import { connect } from 'dva';
import type { CurrentUser } from '@/pages/account/center/data';
import type { ModalState } from '@/models/accountCenter';
import { useEffect } from 'react';
import { Result, Skeleton, Statistic, Card, Space } from 'antd';
import type { UserModelState } from '@/models/user';
import DetailGrid from '@/pages/module/detailGrid';
import type { GlobalModelState } from '@/models/connect';
import type { NoticeItem } from '@/models/global';
import type { ParentFilterModal } from '@/pages/module/data';

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
  global.notices.forEach((item) => {
    if (item.type === 'event') {
      if (item.action === 'approve' || item.action === 'claim') approveCount += item.count || 0;
      else if (item.action === 'audit') auditCount += item.count || 0;
      else otherCount += item.count || 0;
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
  const detailGrid = useMemo(() => {
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
   * 除了审核，审批的之外的其他需要处理的模块
   */
  const needActionModule = ({ notices }: { notices: NoticeItem[] }) => {
    const result: any[] = [];
    notices.forEach((item) => {
      if (item.type === 'event' && !item.action) {
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
        result.push(
          <Card>
            <DetailGrid
              moduleName={moduleName}
              parentFilter={parentFilter}
              parentOperateType="display"
              // readOnly
              displayTitle
              displayParentTitle
            />
          </Card>,
        );
      }
    });
    return result.length ? result : null;
  };

  return (
    <PageHeaderWrapper title={<UserRegion />} extra={<ExtraContent />}>
      <Space direction="vertical" style={{ width: '100%' }} size={[16, 16]}>
        {approveCount ? <Card>{detailGrid}</Card> : null}
        {needActionModule({ notices: global.notices })}
        {approveCount || unreadCount ? null : (
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
