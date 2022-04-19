/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import type { ConnectProps } from 'umi';
import { Redirect, connect } from 'umi';
import Authorized from '@/utils/Authorized';
import { getRouteAuthority } from '@/utils/utils';
import type { ConnectState, UserModelState } from '@/models/connect';

interface AuthComponentProps extends ConnectProps {
  user: UserModelState;
}

const AuthComponent: React.FC<AuthComponentProps> = ({
  children,
  route = {
    routes: [],
  },
  location = {
    pathname: '',
  },
  user,
}) => {
  const { currentUser } = user;
  const { routes = [] } = route;
  const isLogin = currentUser && currentUser.username;
  return (
    <Authorized
      authority={getRouteAuthority(location.pathname, routes) || ''}
      noMatch={isLogin ? <Redirect to="/exception/403" /> : <Redirect to="/user/login" />}
    >
      {children}
    </Authorized>
  );
};

export default connect(({ user }: ConnectState) => ({
  user,
}))(AuthComponent);
