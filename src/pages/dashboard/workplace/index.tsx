import React, { useMemo } from 'react';
import { API_HEAD } from '@/utils/request';
import type { Dispatch } from 'redux';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import styles from './index.less';
import { connect } from 'dva';
import type { CurrentUser } from '@/pages/account/center/data';
import type { ModalState } from '@/models/accountCenter';
import { useEffect } from 'react';
import { Result, Skeleton, Statistic, Card } from 'antd';
import type { UserModelState } from '@/models/user';
import DetailGrid from '@/pages/module/detailGrid';

interface WorkplaceProps {
  dispatch: Dispatch<any>;
  route: any;
  location: any;
  match: any;
  currentUser: Partial<CurrentUser>;
  currentUserLoading: boolean;
  user: any;
}

const Workplace: React.FC<WorkplaceProps> = ({ user, currentUser, dispatch }) => {
  const { personnel } = currentUser;
  const { unreadCount } = user;
  const approveCount: number = (user.notifyCount || 0) - (unreadCount || 0);
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

  return (
    <PageHeaderWrapper title={<UserRegion />} extra={<ExtraContent />}>
      {approveCount ? <Card>{detailGrid}</Card> : null}
      {approveCount || unreadCount ? null : (
        <Result
          status="success"
          title="您所有的工作都完成了"
          subTitle="所有待办和待阅工作都完成了，有新的工作将会显示在此处！"
        />
      )}
    </PageHeaderWrapper>
  );
};

export default connect(
  ({
    loading,
    accountCenter,
    user,
  }: {
    loading: { effects: Record<string, boolean> };
    accountCenter: ModalState;
    user: UserModelState;
  }) => ({
    user: user.currentUser,
    currentUser: accountCenter.currentUser,
    currentUserLoading: loading.effects['accountCenter/fetchCurrent'],
  }),
)(Workplace);
