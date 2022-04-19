/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useState } from 'react';
import type { Dispatch } from 'redux';
import type { RouteChildrenProps } from 'react-router';
import { GridContent } from '@ant-design/pro-layout';
import { Card, Tabs } from 'antd';
import type { TabsPosition } from 'antd/lib/tabs';
import type { ModalState } from 'umi';
import { connect } from 'umi';
import type { DefaultSettings as SettingModelState } from '../../../../config/defaultSettings';
import type { CurrentUser } from '../center/data';
import BaseView from './components/baseView';
import SecurityView from './components/security';
import NotificationView from './components/notification';
import BindingView from './components/binding';
import FavoriteView from './components/Favorite';

const { TabPane } = Tabs;
const SettingsStateKeys: string[] = ['base', 'security', 'binding', 'notification', 'favorite'];
const TYPE = 'type';

interface SettingProps extends RouteChildrenProps {
  dispatch: Dispatch<any>;
  currentUser: Partial<CurrentUser>;
  currentUserLoading: boolean;
  userid: string;
  settings: SettingModelState;
}
const menuMap = {
  base: '基本设置',
  security: '安全设置',
  binding: '账号绑定',
  notification: '消息通知',
  favorite: '偏好设置',
};

const Settings: React.FC<SettingProps> = ({ currentUser, dispatch, location, settings }) => {
  const { personnel, user } = currentUser;
  const { state } = location;
  const [tabPosition, setTabPosition] = useState<TabsPosition>('left');
  let main: HTMLDivElement | undefined;

  const resize = () => {
    if (!main) return;
    const { offsetWidth } = main;
    setTabPosition(offsetWidth < 500 ? 'top' : 'left');
  };

  useEffect(() => {
    if (!(personnel && personnel.name)) {
      dispatch({
        type: 'accountCenter/fetchCurrent',
      });
    }
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);
  const renderChildren = (key: string) => {
    switch (key) {
      case 'base':
        return <BaseView personnel={personnel} dispatch={dispatch} />;
      case 'security':
        return <SecurityView user={user} dispatch={dispatch} />;
      case 'binding':
        return <BindingView />;
      case 'notification':
        return <NotificationView />;
      case 'favorite':
        return <FavoriteView dispatch={dispatch} settings={settings} />;
      default:
        break;
    }
    return null;
  };

  return (
    <GridContent>
      <div
        ref={(ref) => {
          if (ref) {
            main = ref;
          }
        }}
      >
        <Card>
          <Tabs tabPosition={tabPosition} defaultActiveKey={state ? (state as any)[TYPE] : 'base'}>
            {SettingsStateKeys.map((key) => (
              <TabPane key={key} tab={menuMap[key]}>
                {renderChildren(key)}
              </TabPane>
            ))}
          </Tabs>
        </Card>
      </div>
    </GridContent>
  );
};

export default connect(
  ({
    loading,
    accountCenter,
    user,
    settings,
  }: {
    loading: { effects: Record<string, boolean> };
    accountCenter: ModalState;
    user: any;
    settings: SettingModelState;
  }) => ({
    userid: user.currentUser.userid,
    currentUser: accountCenter.currentUser,
    currentUserLoading: loading.effects['accountCenter/fetchCurrent'],
    settings,
  }),
)(Settings);
