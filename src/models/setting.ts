/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { getLocalMonetaryPosition, getLocalMonetaryType } from '@/utils/utils';
import type { Reducer } from 'umi';
import type { DefaultSettings as SettingModelState } from '../../config/defaultSettings';
import defaultSettings from '../../config/defaultSettings';

export interface SettingModelType {
  namespace: 'settings';
  state: SettingModelState;
  reducers: {
    changeSetting: Reducer<SettingModelState>;
  };
}

const updateColorWeak: (colorWeak: boolean) => void = (colorWeak) => {
  const root = document.getElementById('root');
  if (root) {
    root.className = colorWeak ? 'colorWeak' : '';
  }
};

// 获取用户自定义的界面和菜单设置
const getFavoriteSetting = (settings: SettingModelState) => {
  const favoriteSetting: SettingModelState = {
    ...settings,
    navTheme: (localStorage.getItem('settings-navTheme') as any) || 'dark',
    layout: (localStorage.getItem('settings-layout') as any) || 'side',
    contentWidth: (localStorage.getItem('settings-contentWidth') as any) || 'Fluid',
    fixedHeader: localStorage.getItem('settings-fixedHeader') !== 'false',
    fixSiderbar: localStorage.getItem('settings-fixSiderbar') !== 'false',

    monetaryType: getLocalMonetaryType('default'),
    monetaryPosition: getLocalMonetaryPosition('default'),
  };
  return favoriteSetting;
};

const SettingModel: SettingModelType = {
  namespace: 'settings',
  state: getFavoriteSetting(defaultSettings),
  reducers: {
    changeSetting(state = defaultSettings, { payload }) {
      const { colorWeak, contentWidth } = payload;

      if (state.contentWidth !== contentWidth && window.dispatchEvent) {
        window.dispatchEvent(new Event('resize'));
      }
      updateColorWeak(!!colorWeak);
      return {
        ...state,
        ...payload,
      };
    },
  },
};
export default SettingModel;
