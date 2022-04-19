/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { Space } from 'antd';
import { getFilterScheme, getModuleInfo } from '@/pages/module/modules';
import UserDefineFilterButton from '@/pages/module/PageHeaderToolbar/UserDefineFilterButton';
import type { DataminingModal } from '../data';
import SelectScheme from './selectScheme';
import DataminingSetting from './setting';
import ViewSchemeButton from './viewSchemeButton';
import GroupRegionToggleButton from './groupRegionToggleButton';
import FiltersRegionToggleButton from './filtersRegionToggleButton';
import { RowActionHistoryButton } from '../rowActionHistory';
import NavigateButton from './NavigateButton';
import { getViewSchemes } from '../../module/modules';
import { DownLoadButton } from './exportSetting';

interface ToolbarParams {
  state: DataminingModal;
  dispatch: Function;
  disableSchemeButton?: boolean;
}

const Toolbar: React.FC<ToolbarParams> = ({ state, dispatch, disableSchemeButton }) => {
  const { moduleName } = state;
  const moduleInfo = getModuleInfo(moduleName);
  return (
    <Space size={[2, 0]} wrap style={{ paddingTop: '6px' }}>
      {disableSchemeButton ? null : <SelectScheme />}
      {getViewSchemes(moduleInfo.viewschemes).length ? <ViewSchemeButton /> : null}
      <NavigateButton state={state} dispatch={dispatch} />
      {getFilterScheme(moduleInfo) ? (
        <UserDefineFilterButton moduleState={state} dispatch={dispatch} />
      ) : null}
      <FiltersRegionToggleButton state={state} dispatch={dispatch} />
      <GroupRegionToggleButton state={state} dispatch={dispatch} />
      <RowActionHistoryButton />
      <DownLoadButton state={state} dispatch={dispatch} />
      <DataminingSetting />
    </Space>
  );
};

export default Toolbar;
