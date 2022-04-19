/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect } from 'react';
import type { TabPaneProps } from 'antd/es/tabs';
import { Tabs } from 'antd';
import type { LoginContextProps } from './LoginContext';
import LoginContext from './LoginContext';

const { TabPane } = Tabs;

const generateId = (() => {
  let i = 0;
  return (prefix = '') => {
    i += 1;
    return `${prefix}${i}`;
  };
})();

interface LoginTabProps extends TabPaneProps {
  tabUtil: LoginContextProps['tabUtil'];
  active?: boolean;
}

const LoginTab: React.FC<LoginTabProps> = (props) => {
  useEffect(() => {
    const uniqueId = generateId('login-tab-');
    const { tabUtil } = props;
    if (tabUtil) {
      tabUtil.addTab(uniqueId);
    }
  }, []);
  const { children } = props;
  return <TabPane {...props}>{props.active && children}</TabPane>;
};

const WrapContext: React.FC<TabPaneProps> & {
  typeName: string;
} = (props) => (
  <LoginContext.Consumer>
    {(value) => <LoginTab tabUtil={value.tabUtil} {...props} />}
  </LoginContext.Consumer>
);

// 标志位 用来判断是不是自定义组件
WrapContext.typeName = 'LoginTab';

export default WrapContext;
