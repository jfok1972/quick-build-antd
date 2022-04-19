/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */
// https://umijs.org/config/
import { defineConfig } from 'umi';
import defaultSettings from './defaultSettings';
import proxy from './proxy';

const { REACT_APP_ENV } = process.env;

export default defineConfig({
  hash: true,
  antd: {
    // dark: true, // 开启暗色主题
    compact: true, // 开启紧凑主题
  },
  dva: {
    hmr: true,
  },
  locale: {
    default: 'zh-CN',
    antd: true,
    baseNavigator: true,
  },
  dynamicImport: {
    loading: '@/components/PageLoading/index',
  },
  targets: {
    ie: 11,
  },
  // umi routes: https://umijs.org/docs/routing
  routes: [
    {
      path: '/user',
      component: '../layouts/UserLayout',
      routes: [
        {
          name: 'login',
          path: '/user/login',
          component: './user/login',
        },
      ],
    },
    {
      path: '/attachment/preview', // 附件预览,可以不用判断权限，权限在后台判断
      name: '附件预览',
      component: './module/attachment/preview.tsx',
    },
    {
      path: '/',
      component: '../layouts/SecurityLayout',
      routes: [
        {
          path: '/',
          component: '../layouts/BasicLayout',
          routes: [
            {
              path: '/',
              redirect: '/dashboard/analysis',
            },
            {
              path: '/dashboard',
              name: 'menu.dashboard',
              routes: [
                {
                  name: 'menu.dashboard.analysis',
                  path: '/dashboard/analysis',
                  component: './dashboard/analysis',
                },
                {
                  name: 'menu.dashboard.datamining',
                  path: '/dashboard/datamining',
                  component: './dashboard/datamining',
                },
                {
                  name: 'menu.dashboard.workplace',
                  path: '/dashboard/workplace',
                  component: './dashboard/workplace',
                },
                {
                  name: 'menu.dashboard.charts',
                  path: '/dashboard/charts',
                  component: './dashboard/charts',
                },
                {
                  name: 'menu.dashboard.monitor',
                  path: '/dashboard/monitor',
                  component: './dashboard/monitor',
                },
              ],
            },
            {
              name: 'account',
              icon: 'user',
              path: '/account',
              routes: [
                {
                  name: 'center',
                  path: '/account/center',
                  component: './account/center',
                },
                {
                  name: 'settings',
                  path: '/account/settings',
                  component: './account/settings',
                },
              ],
            },
            {
              path: '*/module/:moduleName?',
              component: './module/index',
            },
            {
              path: '/module/:moduleName?',
              component: './module/index',
            },
            {
              path: '*/datamining/:moduleName?',
              component: './datamining/index',
            },
            {
              path: '/datamining/:moduleName?',
              component: './datamining/index',
            },
            {
              component: './404',
            },
          ],
        },
        {
          component: './404',
        },
      ],
    },
    {
      component: './404',
    },
  ],
  // Theme for antd: https://ant.design/docs/react/customize-theme-cn
  theme: {
    // ...darkTheme,
    'primary-color': defaultSettings.primaryColor,
  },
  // @ts-ignore
  title: false,
  ignoreMomentLocale: true,
  proxy: proxy[REACT_APP_ENV || 'dev'],
  manifest: {
    basePath: '/',
  },
  // 快速启动，有问题不能用
  // "mfsu": {
  // }
});
