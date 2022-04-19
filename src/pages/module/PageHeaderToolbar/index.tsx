/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { ModuleModal, ModuleState } from '../data';
import NavigateButton from './NavigateButton';
import ViewSchemeButton from './ViewSchemeButton';
import UserDefineFilterButton from './UserDefineFilterButton';
import { getFilterScheme, hasTableWidgets } from '../modules';
import TableWidgetsButton from './TableWidgetsButton';

const PageHeaderToolbar = ({
  moduleState,
  moduleInfo,
  dispatch,
}: {
  moduleState: ModuleState;
  moduleInfo: ModuleModal;
  dispatch: any;
}) => {
  return (
    <>
      {Object.keys(moduleInfo.viewschemes).length ? (
        <ViewSchemeButton moduleState={moduleState} moduleInfo={moduleInfo} dispatch={dispatch} />
      ) : null}
      {moduleInfo.navigateSchemes.length > 0 ? (
        <NavigateButton moduleState={moduleState} dispatch={dispatch} />
      ) : null}
      {getFilterScheme(moduleInfo) ? (
        <UserDefineFilterButton moduleState={moduleState} dispatch={dispatch} />
      ) : null}
      {hasTableWidgets(moduleInfo) ? (
        <TableWidgetsButton moduleState={moduleState} dispatch={dispatch} />
      ) : null}
      <span />
      <span />
    </>
  );
};

export const DetailGridPageHeaderToolbar = ({
  moduleState,
  moduleInfo,
  dispatch,
  enableUserFilter,
}: {
  moduleState: ModuleState;
  moduleInfo: ModuleModal;
  dispatch: any;
  enableUserFilter: boolean;
}) => {
  return (
    <>
      {Object.keys(moduleInfo.viewschemes).length ? (
        <ViewSchemeButton moduleState={moduleState} moduleInfo={moduleInfo} dispatch={dispatch} />
      ) : null}
      {/* {moduleInfo.navigateSchemes.length > 0 ?
            <NavigateButton moduleState={moduleState} dispatch={dispatch} /> : null} */}
      {enableUserFilter && getFilterScheme(moduleInfo) ? (
        <UserDefineFilterButton moduleState={moduleState} dispatch={dispatch} />
      ) : null}
      <span />
      <span />
    </>
  );
};

export default PageHeaderToolbar;
