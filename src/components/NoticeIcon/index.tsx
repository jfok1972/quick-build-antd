/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { BellOutlined } from '@ant-design/icons';
import { Badge, Tabs } from 'antd';
import useMergeValue from 'use-merge-value';
import React from 'react';
import classNames from 'classnames';
import type { TextValue } from '@/pages/module/data';
import type { NoticeIconTabProps } from './NoticeList';
import NoticeList from './NoticeList';

import HeaderDropdown from '../HeaderDropdown';
import styles from './index.less';

const { TabPane } = Tabs;

export interface NoticeIconData {
  avatar?: string | React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  record?: any; // 通知事项的原来记录，里面包括了附件信息
  datetime?: React.ReactNode;
  extra?: React.ReactNode;
  style?: React.CSSProperties;
  key?: string | number;
  read?: boolean;

  data?: TextValue[];
  maxhours?: number;
  action?: 'approve' | 'claim' | 'audit';
  moduleName?: string;
  count?: number;

  filterFieldName?: string;
  filterFieldOperator?: string;
  filterFieldValue?: string;
  filterText?: string;
}

export interface NoticeIconProps {
  count?: number;
  unreadCount?: number;
  bell?: React.ReactNode;
  className?: string;
  loading?: boolean;
  onClear?: (tabName: string, tabKey: string) => void;
  onRemove?: (item: NoticeIconData, tabProps: NoticeIconTabProps) => void;
  onRefresh?: () => void;
  onItemClick?: (item: NoticeIconData, tabProps: NoticeIconTabProps) => void;
  onViewMore?: (tabProps: NoticeIconTabProps, e: MouseEvent) => void;
  onTabChange?: (tabTile: string) => void;
  style?: React.CSSProperties;
  onPopupVisibleChange?: (visible: boolean) => void;
  popupVisible?: boolean;
  clearText?: string;
  refreshText?: string;
  viewMoreText?: string;
  clearClose?: boolean;
  emptyImage?: string;
  children: React.ReactElement<NoticeIconTabProps>[];
}

const NoticeIcon: React.FC<NoticeIconProps> & {
  Tab: typeof NoticeList;
} = (props) => {
  const getNotificationBox = (): React.ReactNode => {
    const {
      children,
      loading,
      onClear,
      onTabChange,
      onItemClick,
      onRemove,
      onViewMore,
      clearText,
      viewMoreText,
      onRefresh,
      refreshText,
      unreadCount,
    } = props;
    if (!children) {
      return null;
    }
    const panes: React.ReactNode[] = [];
    React.Children.forEach(children, (child: React.ReactElement<NoticeIconTabProps>): void => {
      if (!child) {
        return;
      }
      const { list, title, count, tabKey, showClear, showViewMore, hidden } = child.props;
      if (hidden) {
        return;
      }
      let len = 0;
      if (list && list.length) {
        list.forEach((rec) => {
          len += rec.count || 0;
        });
      }
      const msgCount = count || count === 0 ? count : len;
      const tabTitle: string = msgCount > 0 ? `${title} (${msgCount})` : title;
      panes.push(
        <TabPane tab={tabTitle} key={tabKey}>
          <NoticeList
            loading={loading}
            onRefresh={onRefresh}
            refreshText={refreshText}
            clearText={clearText}
            viewMoreText={viewMoreText}
            data={list}
            unreadCount={unreadCount}
            onClear={(): void => onClear && onClear(title, tabKey)}
            onClick={(item): void => onItemClick && onItemClick(item, child.props)}
            onRemove={(item): void => onRemove && onRemove(item, child.props)}
            onViewMore={(event): void => onViewMore && onViewMore(child.props, event)}
            showClear={showClear}
            showViewMore={showViewMore}
            {...child.props}
          />
        </TabPane>,
      );
    });
    return (
      <>
        <Tabs className={styles.tabs} onChange={onTabChange} centered>
          {panes}
        </Tabs>
      </>
    );
  };

  const { className, count, bell } = props;

  const [visible, setVisible] = useMergeValue<boolean>(false, {
    value: props.popupVisible,
    onChange: props.onPopupVisibleChange,
  });
  const noticeButtonClass = classNames(className, styles.noticeButton);
  const notificationBox = getNotificationBox();
  const NoticeBellIcon = bell || <BellOutlined className={styles.icon} />;
  const trigger = (
    <span className={classNames(noticeButtonClass, { opened: visible })}>
      <Badge count={count} style={{ boxShadow: 'none' }} className={styles.badge}>
        {NoticeBellIcon}
      </Badge>
    </span>
  );
  if (!notificationBox) {
    return trigger;
  }

  return (
    <HeaderDropdown
      placement="bottomRight"
      overlay={notificationBox}
      overlayClassName={styles.popover}
      trigger={['click']}
      visible={visible}
      onVisibleChange={setVisible}
    >
      {trigger}
    </HeaderDropdown>
  );
};

NoticeIcon.defaultProps = {
  emptyImage: '/empty_image.svg',
};

NoticeIcon.Tab = NoticeList;

export default NoticeIcon;
