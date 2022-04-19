/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { MenuTheme } from 'antd';
import { Tooltip, Tag } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import React from 'react';
import type { ConnectProps } from 'umi';
import { connect, history } from 'umi';
import type { ConnectState } from '@/models/connect';
import Avatar from './AvatarDropdown';
import HeaderSearch from '../HeaderSearch';
import styles from './index.less';
import NoticeIconView from './NoticeIconView';
import CanSelectRoleIconView from './CanSelectRoleIconView';
import { useState } from 'react';
import { getModuleUrlFormSysMenu, sysMenuData } from '@/layouts/BasicLayout';

export interface GlobalHeaderRightProps extends Partial<ConnectProps> {
  theme?: MenuTheme | 'realDark' | undefined;
  layout?: 'side' | 'top' | 'mix';
}

const ENVTagColor = {
  dev: 'orange',
  test: 'green',
  pre: '#87d068',
};

const GlobalHeaderRight: React.FC<GlobalHeaderRightProps> = (props) => {
  const { theme, layout } = props;
  const [menuOption, setMenuOption] = useState<any[]>([]);
  let className = styles.right;
  if ((theme === 'dark' && layout === 'top') || layout === 'mix') {
    className = `${styles.right}  ${styles.dark}`;
  }
  return (
    <div className={className}>
      <HeaderSearch
        className={`${styles.action} ${styles.search}`}
        placeholder="应用内搜索"
        defaultValue={undefined}
        options={menuOption}
        onFocus={() => {
          if (!menuOption.length) {
            setMenuOption(
              Object.keys(sysMenuData).map((key) => {
                return {
                  label: sysMenuData[key].title,
                  value: key,
                };
              }),
            );
          }
        }}
        onChange={(value) => {
          if (value) {
            const pathname = getModuleUrlFormSysMenu(value as string);
            history.push({
              pathname,
            });
          }
        }}
      />
      <Tooltip title="使用文档">
        <a
          style={{
            color: 'inherit',
          }}
          // target="_blank"
          href="#"
          rel="noopener noreferrer"
          className={styles.action}
        >
          <QuestionCircleOutlined />
        </a>
      </Tooltip>
      <CanSelectRoleIconView />
      <NoticeIconView />
      <Avatar />
      {REACT_APP_ENV && (
        <span>
          <Tag color={ENVTagColor[REACT_APP_ENV]}>{REACT_APP_ENV}</Tag>
        </span>
      )}
    </div>
  );
};

export default connect(({ settings }: ConnectState) => ({
  theme: settings.navTheme,
  layout: settings.layout,
}))(GlobalHeaderRight);
