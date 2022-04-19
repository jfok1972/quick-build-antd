/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useContext } from 'react';
import { Popover } from 'antd';
import DetailGrid from '@/pages/module/detailGrid';
import { changeDataminingConditionsToUserFilters } from '../utils';
import { changeUserFilterToParam } from '@/pages/module/UserDefineFilter';
import { getSqlparamFilter } from '@/pages/module/grid/filterUtils';
import { DataminingContext } from '..';

interface CellModuleDetailPopoverProps {
  conditions: string[];
  children: any;
}
/**
 * 数据分析一个单元格的模块记录的明细。
 * 当前的条件包括：所有行条件，所有列的条件，所有当前商业数据的筛选条件
 * @param param0
 * @returns
 */
export const CellModuleDetailPopover: React.FC<CellModuleDetailPopoverProps> = ({
  conditions,
  children,
}) => {
  const { state } = useContext(DataminingContext);
  return (
    <Popover
      style={{ width: '100%' }}
      destroyTooltipOnHide
      trigger={['click']}
      content={
        <DetailGrid
          moduleName={state.moduleName}
          parentOperateType="display"
          displayTitle
          readOnly
          parentFilter={undefined}
          dataminingFilter={{
            conditions: changeDataminingConditionsToUserFilters(conditions),
            navigatefilters: state.filters.navigatefilters,
            viewschemeid: state.filters.viewscheme.viewschemeid,
            userfilters: changeUserFilterToParam(state.filters.userfilter),
            sqlparamstr: state.filters.sqlparam ? getSqlparamFilter(state.filters.sqlparam) : null,
          }}
        />
      }
    >
      {children}
    </Popover>
  );
};
