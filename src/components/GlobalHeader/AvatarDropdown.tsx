/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Menu, notification, Spin } from 'antd';
import type { ConnectProps } from 'umi';
import { history, connect } from 'umi';
import type { ConnectState } from '@/models/connect';
import type { CurrentUser } from '@/models/user';
import { API_HEAD } from '@/utils/request';
import HeaderDropdown from '../HeaderDropdown';
import styles from './index.less';

export interface GlobalHeaderRightProps extends Partial<ConnectProps> {
  currentUser?: CurrentUser;
  menu?: boolean;
}

class AvatarDropdown extends React.Component<GlobalHeaderRightProps> {
  componentDidMount() {
    const { currentUser } = this.props;
    if (currentUser && currentUser.needResetPassword)
      notification.warning({
        key: 'notification_change_password',
        top: 66,
        style: { width: '450px' },
        duration: null,
        message: '您的密码需要修改',
        description:
          '由于您的密码是初始密码或者过于简单，为了保证帐号的安全性，' +
          '请在“个人设置--安全设置--修改”中进行密码的修改，密码等级要求为中以上。',
        btn: (
          <Button
            type="primary"
            onClick={() => {
              notification.close('notification_change_password');
              history.push({
                pathname: '/account/settings',
                state: {
                  type: 'security',
                },
              });
            }}
          >
            立即去修改
          </Button>
        ),
      });
  }

  onMenuClick = (event: any) => {
    const { key } = event;
    if (key === 'logout') {
      const { dispatch } = this.props;
      if (dispatch) {
        dispatch({
          type: 'login/logout',
        });
      }
      return;
    }
    history.push(`/account/${key}`);
  };

  render(): React.ReactNode {
    const {
      currentUser = {
        username: '',
      },
      menu = true,
    } = this.props;
    const menuHeaderDropdown = (
      <Menu className={styles.menu} selectedKeys={[]} onClick={this.onMenuClick}>
        {menu && (
          <Menu.Item key="center">
            <UserOutlined />
            个人中心
          </Menu.Item>
        )}
        {menu && (
          <Menu.Item key="settings">
            <SettingOutlined />
            个人设置
          </Menu.Item>
        )}
        {menu && <Menu.Divider />}

        <Menu.Item key="logout">
          <LogoutOutlined />
          退出登录
        </Menu.Item>
      </Menu>
    );
    return currentUser && currentUser.username ? (
      <HeaderDropdown overlay={menuHeaderDropdown}>
        <span className={`${styles.action} ${styles.account}`}>
          <Avatar
            size="small"
            className={styles.avatar}
            src={`${API_HEAD}/platform/systemframe/getuserfavicon.do`}
            alt="avatar"
          />
          <span className={styles.name}>{currentUser.username}</span>
        </span>
      </HeaderDropdown>
    ) : (
      <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }} />
    );
  }
}

export default connect(({ user }: ConnectState) => ({
  currentUser: user.currentUser,
}))(AvatarDropdown);
