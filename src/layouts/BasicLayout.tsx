/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useState } from 'react';
import type {
  MenuDataItem,
  BasicLayoutProps as ProLayoutProps,
  Settings,
} from '@ant-design/pro-layout';
import ProLayout from '@ant-design/pro-layout';
import type { Dispatch } from 'umi';
import { Link, useIntl, connect } from 'umi';
import {
  BankOutlined,
  PhoneOutlined,
  QqOutlined,
  MailOutlined,
  UserOutlined,
  CopyrightOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import '../../node_modules/font-awesome/css/font-awesome.min.css';
import { Result, Button, Popover, Drawer, Modal } from 'antd';
import Authorized from '@/utils/Authorized';
import RightContent from '@/components/GlobalHeader/RightContent';
import type { ConnectState } from '@/models/connect';
import { EMPTY_MENU_ICON, getAuthorityFromRouter, getMenuAwesomeIcon } from '@/utils/utils';
import type { SystemInfo } from '@/models/systeminfo';
import { getSystemMenu } from '@/services/systeminfo';
import { dataminingList } from '@/pages/dashboard/datamining';
import { PopoverDescriptionWithId } from '@/pages/module/descriptions';
import { getModuleInfo } from '@/pages/module/modules';
import { API_HEAD } from '@/utils/request';
import styles from './BasicLayout.less';
// 加入动态主题时可用
// import 'antd/dist/antd.variable.min.css';
const noMatch = (
  <Result
    status={403}
    title="403"
    subTitle="Sorry, you are not authorized to access this page."
    extra={
      <Button type="primary">
        <Link to="/user/login">Go Login</Link>
      </Button>
    }
  />
);

export interface BasicLayoutProps extends ProLayoutProps {
  breadcrumbNameMap: Record<string, MenuDataItem>;
  route: ProLayoutProps['route'] & {
    authority: string[];
  };
  settings: Settings;
  dispatch: Dispatch;
  systemInfo?: SystemInfo;
}

export type BasicLayoutContext = { [K in 'location']: BasicLayoutProps[K] } & {
  breadcrumbNameMap: Record<string, MenuDataItem>;
};

/**
 * use Authorized check all menu item
 */
// const menuDataRender = (menuList: MenuDataItem[]): MenuDataItem[] =>
//   menuList.map((item) => {
//     const localItem = { ...item, children: item.children ? menuDataRender(item.children) : [] };
//     return Authorized.check(item.authority, localItem, null) as MenuDataItem;
//   });

// 系统菜单，可供通过moduleName来取得title
export const sysMenuData = {};

export const hasModuleInSysMenu = (moduleName: string): boolean => {
  return !!sysMenuData[moduleName];
};

export const getTitleFromSysMenu = (moduleName: string): string => {
  if (sysMenuData[moduleName]) return sysMenuData[moduleName].title;
  return '未定义';
};
export const getModuleUrlFormSysMenu = (moduleName: string): string => {
  if (sysMenuData[moduleName]) return sysMenuData[moduleName].path;
  return `/module/${moduleName}`;
};

export const footerRender = (props: any) => {
  const {
    systemInfo: { company, systeminfo },
    isLogin,
  } = props;
  const { servicetelnumber: telnumber } = company;
  const companyText = (
    <a className={styles.serviceman} target="_blank" rel="noopener noreferrer">
      <BankOutlined className={styles.icon} />
      {company.companyname}
    </a>
  );
  let serviceDepartment = (
    <span className={styles.icon}>{`服务单位:${company.servicedepartment || ''}`}</span>
  );
  if (company.servicehomepage) {
    serviceDepartment = (
      <a
        className={styles.homepage}
        href={company.servicehomepage}
        target="_blank"
        rel="noopener noreferrer"
      >
        {serviceDepartment || ''}
      </a>
    );
  }
  const content = (
    <>
      {telnumber ? (
        <div>
          <PhoneOutlined rotate={180} style={{ marginRight: '10px' }} />
          {telnumber}
        </div>
      ) : null}
      {company.serviceqq ? (
        <div>
          <QqOutlined style={{ marginRight: '10px' }} />
          {company.serviceqq}
        </div>
      ) : null}
      {company.serviceemail ? (
        <div>
          <MailOutlined style={{ marginRight: '10px' }} />
          {company.serviceemail}
        </div>
      ) : null}
    </>
  );

  return (
    <>
      <div className={styles.footer}>
        {isLogin ? (
          <PopoverDescriptionWithId
            id="00"
            moduleInfo={getModuleInfo('FCompany')}
            dispatch={() => {}}
          >
            {companyText}
          </PopoverDescriptionWithId>
        ) : (
          companyText
        )}
        {serviceDepartment}
        {company.servicemen ? (
          <Popover trigger="click" title={<>服务人员：{company.servicemen}</>} content={content}>
            <a className={styles.serviceman} target="_blank" rel="noopener noreferrer">
              <UserOutlined />
              {company.servicemen}
              {telnumber ? (
                <span>
                  <PhoneOutlined rotate={180} style={{ marginRight: '2px', marginLeft: '10px' }} />
                  {telnumber}
                </span>
              ) : (
                ''
              )}
            </a>
          </Popover>
        ) : (
          ''
        )}
        <div className={styles.copyright}>
          {' '}
          Copyright <CopyrightOutlined /> {systeminfo.copyrightinfo}{' '}
        </div>
      </div>
    </>
  );
};

// 根据返回的菜单生成antd的菜单
const generateMenu = (
  menuDefine: {
    menuid: string;
    text: any;
    engname: string | undefined;
    objectid: any;
    iconCls: string;
    children: any[];
    visible: boolean;
    isdatamining: boolean;
  },
  parentPath: string,
  hasicon: boolean,
) => {
  if (menuDefine.text === '-') return null;
  // 隐藏的菜单在extjs的版本中才能看见
  if (!menuDefine.visible) return null;
  let menu: any = {
    path: `${parentPath}/${menuDefine.engname || menuDefine.text}`,
    name: menuDefine.text, // 菜单的标题
    title: menuDefine.text, // 面包屑里面的文字
    icon: menuDefine.iconCls,
  };
  if (menuDefine.objectid) {
    if (menuDefine.isdatamining) {
      menu = {
        ...menu,
        path: `${parentPath}/datamining/${menuDefine.objectid}`,
        moduleName: menuDefine.objectid,
      };
      if (!dataminingList.find((rec) => rec.moduleName === menuDefine.objectid))
        dataminingList.push({
          moduleName: menuDefine.objectid,
          title: menuDefine.text,
        });
    } else {
      menu = {
        ...menu,
        path: `${parentPath}/module/${menuDefine.objectid}`,
        moduleName: menuDefine.objectid,
      };
    }
    // 不要加入数据分析的模块的菜单，加入了地址就到了数据分析去了
    if (!menuDefine.isdatamining) sysMenuData[menuDefine.objectid] = menu;
  }
  // 菜单图标设置规则,
  // 顶层菜单项必须有一个图标
  // 二级以下菜单检测当前级是否有图标，有一个则加入图标，无图标的为空
  if (!parentPath) {
    // 顶层菜单
    if (menu.icon) menu.icon = getMenuAwesomeIcon(menu.icon);
    else menu.icon = getMenuAwesomeIcon('fa fa-flag-o');
  } else if (hasicon) {
    // 这一级是否有图标
    if (menu.icon) menu.icon = getMenuAwesomeIcon(menu.icon);
    else menu.icon = EMPTY_MENU_ICON;
  }
  if (menuDefine.children && menuDefine.children.length > 0) {
    let anyicon = false;
    menuDefine.children.forEach((value) => {
      anyicon = anyicon || !!value.iconCls;
    });
    menu.children = menuDefine.children.map((value) => generateMenu(value, menu.path, anyicon));
  }
  return menu;
};

// 如果有需要用到Drawer的地方，直接设置属性即可使用
let setGlobalDrawerPropsLocal: Function;
export const setGlobalDrawerProps: Function = (params: any) => {
  setGlobalDrawerPropsLocal(params);
};
let setGlobalModalPropsLocal: Function;
export const setGlobalModalProps: Function = (params: any) => {
  setGlobalModalPropsLocal(params);
};

// menuData 在 "@ant-design/pro-layout": "^6.14.0",中放在useState中，
// 网址带参数，刷新网页时无效。5.X 可以使用
let menuData: any = null;
const BasicLayout: React.FC<BasicLayoutProps> = (props) => {
  const {
    dispatch,
    children,
    settings,
    location = {
      pathname: '/',
    },
    systemInfo,
  } = props;

  const [drawerProps, setDrawerProps] = useState({});
  const [modalProps, setModalProps] = useState({});

  useEffect(() => {
    setGlobalDrawerPropsLocal = (arg: any) => {
      // zIndex 不能设置，设计太高combo会没有下拉选择, 在不需要设置时，设置zIndex:undefined
      setDrawerProps({ zIndex: 1000000, ...arg });
    };
    setGlobalModalPropsLocal = (arg: any) => {
      setModalProps({ zIndex: 1000000 - 10, ...arg });
    };
    if (dispatch) {
      dispatch({
        type: 'user/fetchCurrent',
      });
      dispatch({
        type: 'settings/getSetting',
      });
      if (systemInfo && !systemInfo.company.companyname) {
        dispatch({
          type: 'systemInfo/fetch',
          payload: {
            dispatch,
          },
        });
      }
    }
  }, []);

  const handleMenuCollapse = (payload: boolean): void => {
    if (dispatch) {
      dispatch({
        type: 'global/changeLayoutCollapsed',
        payload,
      });
    }
  };

  const authorized = getAuthorityFromRouter(props.route.routes, location.pathname || '/') || {
    authority: undefined,
  };
  const { formatMessage } = useIntl();
  // const [menuData, setMenuData] = useState([]);

  const getMenuData = () => {
    const menu: any = getSystemMenu().map((value: any) => generateMenu(value, '', true)) || [];
    menu.unshift({
      path: '/dashboard',
      name: formatMessage({ id: 'menu.dashboard' }),
      icon: <DashboardOutlined />,
      children: [
        {
          name: formatMessage({ id: 'menu.dashboard.analysis' }),
          path: '/dashboard/analysis',
        },
        {
          name: formatMessage({ id: 'menu.dashboard.datamining' }),
          path: '/dashboard/datamining',
        },
        {
          name: formatMessage({ id: 'menu.dashboard.workplace' }),
          path: '/dashboard/workplace',
        },
      ],
    });
    menu.push({
      name: formatMessage({ id: 'menu.account' }),
      icon: <UserOutlined />,
      path: '/account',
      children: [
        {
          name: formatMessage({ id: 'menu.account.center' }),
          path: '/account/center',
        },
        {
          name: formatMessage({ id: 'menu.account.settings' }),
          path: '/account/settings',
        },
      ],
    });
    return menu;
  };
  if (!menuData) menuData = getMenuData();

  // 加入动态主题时可用
  // const [color, setColor] = useState({
  //   primaryColor: '#25b864',
  //   errorColor: '#ff4d4f',
  //   warningColor: '#faad14',
  //   successColor: '#52c41a',
  //   infoColor: '#1890ff',
  // });
  // useEffect(() => {
  //   console.log(color)
  //     ConfigProvider.config({
  //   theme: color,
  // });
  // } , [])

  return (
    <ProLayout
      logo={`${API_HEAD}/login/systemfavicon.do`}
      // formatMessage={formatMessage}
      // menuHeaderRender={(logoDom, titleDom) => (
      //   <Link to="/">
      //     {logoDom}
      //     {titleDom}
      //   </Link>
      // )}
      onCollapse={handleMenuCollapse}
      menuItemRender={(menuItemProps, defaultDom) => {
        if (menuItemProps.isUrl || menuItemProps.children || !menuItemProps.path) {
          return defaultDom;
        }
        return <Link to={menuItemProps.path}>{defaultDom}</Link>;
      }}
      breadcrumbRender={(routers = []) => {
        return [
          {
            path: '/',
            breadcrumbName: formatMessage({ id: 'menu.home' }),
          },
          ...routers,
        ];
      }}
      itemRender={(route, params, routes, paths) => {
        const first = routes.indexOf(route) === 0;
        return first ? (
          <Link to={paths.join('/')}>{route.breadcrumbName}</Link>
        ) : (
          <span>{route.breadcrumbName}</span>
        );
      }}
      footerRender={footerRender}
      menuDataRender={() => menuData} // {menuDataRender}
      rightContentRender={() => <RightContent />}
      {...props}
      {...settings}
    >
      <Authorized authority={authorized!.authority} noMatch={noMatch}>
        {children}
      </Authorized>
      {/* 给附加功能使用的drawer和modal */}
      <Drawer {...drawerProps} />
      <Modal {...modalProps} />
    </ProLayout>
  );
};

export default connect(({ global, settings, systemInfo, user }: ConnectState) => ({
  collapsed: global.collapsed,
  settings,
  ...systemInfo,
  isLogin: !!user.currentUser?.usercode,
}))(BasicLayout);
