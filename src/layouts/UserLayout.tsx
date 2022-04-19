/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { MenuDataItem } from '@ant-design/pro-layout';
import { getMenuData, getPageTitle } from '@ant-design/pro-layout';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import type { ConnectProps } from 'umi';
import { useIntl, connect } from 'umi';
import React, { useEffect } from 'react';
import type { ConnectState } from '@/models/connect';
import type { SystemInfo } from '@/models/systeminfo';
import { API_HEAD } from '@/utils/request';
import { footerRender } from './BasicLayout';
import styles from './UserLayout.less';

export interface UserLayoutProps extends Partial<ConnectProps> {
  breadcrumbNameMap: Record<string, MenuDataItem>;
  systemInfo?: SystemInfo;
}

const UserLayout: React.FC<UserLayoutProps> = (props) => {
  const {
    route = {
      routes: [],
    },
    dispatch = () => {},
    systemInfo,
  } = props;
  const { routes = [] } = route;
  const {
    children,
    location = {
      pathname: '',
    },
  } = props;
  const { formatMessage } = useIntl();
  const { breadcrumb } = getMenuData(routes);
  const title = getPageTitle({
    pathname: location.pathname,
    formatMessage,
    breadcrumb,
    ...props,
  });
  useEffect(() => {
    dispatch({
      type: 'user/fetchCurrent',
    });
    // 如果系统信息还没有读取的话，则要去读取信息
    if (!systemInfo!.company.companyname) {
      dispatch({
        type: 'systemInfo/fetch',
        payload: {
          dispatch,
        },
      });
    }
  });

  return (
    <HelmetProvider>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={title} />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.top}>
            <div className={styles.header}>
              <img alt="logo" className={styles.logo} src={`${API_HEAD}/login/systemfavicon.do`} />
              <span className={styles.title}>{systemInfo!.systeminfo.systemname}</span>
            </div>
            <div className={styles.desc}>{systemInfo!.systeminfo.systemaddition}</div>
          </div>
          {children}
        </div>
        <div style={{ marginBottom: 30 }}>{footerRender(props)}</div>
      </div>
    </HelmetProvider>
  );
};

export default connect(({ settings, systemInfo }: ConnectState) => ({
  ...settings,
  ...systemInfo,
}))(UserLayout);
