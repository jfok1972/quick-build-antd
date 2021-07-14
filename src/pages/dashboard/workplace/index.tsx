import React from 'react';
import { API_HEAD } from '@/utils/request';
import type { Dispatch } from 'redux';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import styles from './index.less';
import { connect } from 'dva';
import type { CurrentUser } from '@/pages/account/center/data';
import type { ModalState } from '@/models/accountCenter';
import { useEffect } from 'react';
import { Result, Skeleton, Statistic } from 'antd';
import type { UserModelState } from '@/models/user';

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
    const { unreadCount } = user;
    const count: number = (user.notifyCount || 0) - (unreadCount || 0);
    return (
      <div className={styles.extraContent}>
        <div className={styles.statItem}>
          <Statistic title="待办事项" value={count ? `${count}个` : '无'} />
        </div>
        <div className={styles.statItem}>
          <Statistic title="待阅通知" value={unreadCount ? `${unreadCount}条` : '无'} />
        </div>
      </div>
    );
  };

  return (
    <PageHeaderWrapper title={<UserRegion />} extra={<ExtraContent />}>
      <Result
        status="success"
        title="您所有的工作都完成了"
        subTitle="所有待办和待阅工作都完成了，有新的工作将会显示在此处！"
      />
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
