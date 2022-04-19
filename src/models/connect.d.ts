/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { AnyAction } from 'redux';
import type { MenuDataItem } from '@ant-design/pro-layout';
import type { RouterTypes } from 'umi';
import { GlobalModelState } from './global';
import { DefaultSettings as SettingModelState } from '../../config/defaultSettings';
import { UserModelState } from './user';
import type { StateType } from './login';
import type { SystemInfoState } from './systeminfo';

export { GlobalModelState, SettingModelState, UserModelState };

export interface Loading {
  global: boolean;
  effects: Record<string, boolean | undefined>;
  models: {
    global?: boolean;
    menu?: boolean;
    setting?: boolean;
    user?: boolean;
    login?: boolean;
    systemInfo?: boolean;
  };
}

export interface ConnectState {
  global: GlobalModelState;
  loading: Loading;
  settings: SettingModelState;
  user: UserModelState;
  login: StateType;
  systemInfo: SystemInfoState;
}

export interface Route extends MenuDataItem {
  routes?: Route[];
}

/**
 * @type T: Params matched in dynamic routing
 */
export interface ConnectProps<T = {}> extends Partial<RouterTypes<Route, T>> {
  dispatch?: Dispatch<AnyAction>;
}
