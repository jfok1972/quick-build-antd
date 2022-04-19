/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Avatar, List, Popconfirm, Spin } from 'antd';
import React, { useState } from 'react';
import classNames from 'classnames';
import {
  CarryOutFilled,
  CloseCircleFilled,
  CloseOutlined,
  InfoCircleFilled,
  QuestionCircleFilled,
  WarningFilled,
} from '@ant-design/icons';
import type { NoticeIconData } from './index';
import styles from './NoticeList.less';
import { getModuleInfo } from '@/pages/module/modules';
import { AttachemntDisplayButton } from './AttachmentDisplayButton';

export interface NoticeIconTabProps {
  hidden?: boolean;
  loading?: boolean;
  count?: number;
  unreadCount?: number;
  name?: string;
  showClear?: boolean;
  showViewMore?: boolean;
  showRefresh?: boolean;
  style?: React.CSSProperties;
  title: string;
  tabKey: string;
  data?: NoticeIconData[];
  onClick?: (item: NoticeIconData) => void;
  onClear?: () => void;
  onRemove?: (item: NoticeIconData) => void;
  onRefresh?: () => void;
  emptyText?: string;
  clearText?: string;
  refreshText?: string;
  viewMoreText?: string;
  list: NoticeIconData[];
  onViewMore?: (e: any) => void;
}
const NoticeList: React.FC<NoticeIconTabProps> = ({
  data = [],
  unreadCount,
  onClick,
  // 清除所有通知
  onClear,
  onRemove,
  onRefresh,
  refreshText,
  showRefresh,
  title,
  onViewMore,
  emptyText,
  showClear,
  clearText,
  viewMoreText,
  showViewMore = false,
  loading,
}) => {
  const [clearVisible, setClearVisible] = useState<boolean>(false);

  if (!data || data.length === 0) {
    return (
      <Spin spinning={loading}>
        <div className={styles.notFound}>
          <img src="/empty_image.svg" alt="not found" />
          <div>{emptyText}</div>
        </div>
      </Spin>
    );
  }
  return (
    <Spin spinning={loading}>
      <List<NoticeIconData>
        className={styles.list}
        dataSource={data}
        renderItem={(item, i) => {
          const itemCls = classNames(styles.item, {
            [styles.read]: item.read,
          });
          // eslint-disable-next-line no-nested-ternary
          let { avatar } = item;
          if (avatar === 'warning') avatar = <WarningFilled style={{ color: '#fadb14' }} />;
          if (avatar === 'info') avatar = <InfoCircleFilled style={{ color: '#1890ff' }} />;
          if (avatar === 'error') avatar = <CloseCircleFilled style={{ color: '#f5222d' }} />;
          if (avatar === 'question') avatar = <QuestionCircleFilled style={{ color: '#fa8c16' }} />;
          if (['audit', 'approve'].includes(item.action!)) {
            avatar = <CarryOutFilled style={{ color: '#1890ff' }} />;
          } else if (item.action === 'claim') {
            avatar = <InfoCircleFilled style={{ color: '#1890ff' }} />;
          }
          let leftIcon = null;
          if (avatar)
            leftIcon =
              typeof avatar === 'string' ? (
                <Avatar className={styles.avatar} src={avatar} />
              ) : (
                <span className={styles.iconElement}>{avatar}</span>
              );
          return (
            <List.Item
              id={`notice-${item.key}`}
              className={itemCls}
              key={item.key || i}
              onClick={() => onClick && onClick(item)}
            >
              <List.Item.Meta
                className={styles.meta}
                avatar={leftIcon}
                title={
                  <div className={styles.title}>
                    {item.record && item.record.attachmentcount ? (
                      <AttachemntDisplayButton
                        record={item.record}
                        moduleInfo={getModuleInfo('FNotification')}
                      />
                    ) : null}
                    {item.title}
                    <div className={styles.extra}>{item.extra}</div>
                    {item.read ? (
                      <CloseOutlined
                        style={{ float: 'right' }}
                        onClick={() => {
                          onRemove!(item);
                        }}
                      />
                    ) : null}
                  </div>
                }
                description={
                  <div>
                    <div className={styles.description}>{item.description}</div>
                    <div className={styles.datetime}>{item.datetime}</div>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
      <div className={styles.bottomBar}>
        {showClear ? (
          <Popconfirm
            visible={clearVisible}
            onVisibleChange={(visible) => {
              if (!visible) {
                setClearVisible(visible);
                return;
              }
              // 如果还有未阅读的通知，提醒一下
              if (unreadCount) {
                setClearVisible(visible);
              } else {
                onClear!();
              }
            }}
            title={`还有 ${unreadCount} 条${title}未查看，确定要清除吗？`}
            onConfirm={onClear}
          >
            <div>
              {clearText} {title}
            </div>
          </Popconfirm>
        ) : null}
        {showRefresh ? (
          <div onClick={onRefresh}>
            {refreshText} {title}
          </div>
        ) : null}
        {showViewMore ? (
          <div
            onClick={(e) => {
              if (onViewMore) {
                onViewMore(e);
              }
            }}
          >
            {viewMoreText}
          </div>
        ) : null}
      </div>
    </Spin>
  );
};

export default NoticeList;
