/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useContext, useEffect } from 'react';
import { Space } from 'antd';
import type {
  ParentFilterModal,
  ModuleState,
  ParentFormModal,
  DataminingFilterModal,
} from '../data';
import { DetailModelContext } from './model';
import ModuleGrid from '../grid';
import { getModuleInfo, getDefaultModuleState, getFilterScheme } from '../modules';
import { DetailModelProvider } from './provider';
import ModuleForm from '../form';
import ModuleToolbar from '../toolbar';
import UserDefineFilter from '../UserDefineFilter';
import { DetailGridPageHeaderToolbar } from '../PageHeaderToolbar';
import { getModuleIcon } from '../moduleUtils';
import { LinkOutlined } from '@ant-design/icons';

/**
 * 在masterdetail的form中显示的从表的grid，或者主表记录展开后的从表grid
 */

/**
 * 始发地 市   --- 始发地市 订单  startCity -- startCityid
 * 目的地 市   --- 目的地市 订单  endCity -- endCityid
 */

// {
//     "moduleName": "FDictionarydetail",
//     "parentOperateType": "edit",
//     "parentFilter": {
//         "moduleName": "FDictionary",           // 父模块名称
//         "fieldahead": "FDictionary",           // 子模块到父模块的路径
//         "fieldName": "dictionaryid",           // 子模块中的关联？
//         "fieldtitle": "数据字典",
//         "operator": "=",
//         "fieldvalue": 'value',
//         "text": '学历'
//     }

export interface DetailGridPrpos {
  moduleName: string; // 子模块的模块名称
  parentOperateType: string; // 父模块的当前操作类型
  parentFilter?: ParentFilterModal; //
  dataminingFilter?: DataminingFilterModal;
  readOnly?: boolean; // grid是否是只读的
  enableUserFilter?: boolean; // 允许使用用户自定义条件
  parentForm?: ParentFormModal; // 父模块记录的信息
  displayTitle?: boolean; // 是否在按钮最前面显示模块名称
  displayParentTitle?: boolean; // 是否显示父模块筛选信息
}

const DetailTable = ({
  pFilter,
  dataminingFilter,
  readOnly,
  enableUserFilter,
  displayTitle,
  displayParentTitle,
}: {
  pFilter?: ParentFilterModal;
  dataminingFilter?: DataminingFilterModal;
  readOnly: boolean;
  enableUserFilter: boolean;
  displayTitle?: boolean;
  displayParentTitle?: boolean;
}) => {
  const context = useContext(DetailModelContext);
  const { dispatch } = context;
  const moduleState = context.moduleState as ModuleState;
  const {
    moduleName,
    filters: { parentfilter: parentFilter, dataminingFilter: dataminingF },
  } = moduleState;
  const moduleInfo = getModuleInfo(moduleState.moduleName);

  useEffect(() => {
    if (
      (parentFilter && pFilter && pFilter.fieldvalue !== parentFilter.fieldvalue) ||
      JSON.stringify(dataminingFilter) !== JSON.stringify(dataminingF)
    ) {
      dispatch({
        type: 'modules/init',
        payload: {
          initState: getDefaultModuleState({ moduleName, parentFilter: pFilter, dataminingFilter }),
        },
      });
    }
  }, [pFilter, dataminingFilter]);

  // 对于新建的记录，在看看combo中有没有记录，如果有，就把刚新建的加进去。不然马上新建detailgrid的时候显示不对
  return (
    <>
      <div
        style={{
          marginBottom: '16px',
          display: parentFilter?.fieldvalue || dataminingFilter ? 'flex' : 'none',
        }}
      >
        {displayTitle ? (
          <span style={{ fontSize: '18px', padding: '8px 12px 0' }}>
            {getModuleIcon(moduleInfo)} {moduleInfo.title}
            {displayParentTitle && parentFilter ? (
              <span style={{ fontSize: '14px', paddingLeft: '24px' }}>
                <LinkOutlined style={{ paddingRight: '2px' }} />
                {parentFilter.fieldtitle}
              </span>
            ) : null}
          </span>
        ) : null}
        <span style={{ flex: 1 }} />
        <Space>
          <ModuleToolbar
            moduleInfo={moduleInfo}
            moduleState={moduleState}
            manyToOneInfo={null}
            dispatch={dispatch}
            readOnly={readOnly}
          />
          <DetailGridPageHeaderToolbar
            enableUserFilter={enableUserFilter}
            moduleState={moduleState}
            moduleInfo={moduleInfo}
            dispatch={dispatch}
          />
        </Space>
      </div>
      {enableUserFilter && getFilterScheme(moduleInfo) ? (
        <UserDefineFilter
          visible={moduleState.currSetting.userFilterRegionVisible}
          moduleState={moduleState}
          dispatch={dispatch}
        />
      ) : null}
      <ModuleGrid
        moduleState={moduleState}
        moduleInfo={moduleInfo}
        dispatch={dispatch}
        fetchLoading={moduleState.fetchLoading}
        gridType="onetomanygrid"
        readOnly={readOnly}
      />
      <ModuleForm moduleInfo={moduleInfo} moduleState={moduleState} dispatch={dispatch} />
    </>
  );
};

const DetailGrid: React.FC<DetailGridPrpos> = ({
  moduleName,
  parentFilter,
  dataminingFilter,
  readOnly,
  enableUserFilter = false,
  parentForm,
  displayTitle,
  displayParentTitle,
}) => {
  return (
    <DetailModelProvider
      moduleName={moduleName}
      parentFilter={parentFilter}
      dataminingFilter={dataminingFilter}
      parentForm={parentForm}
    >
      <DetailTable
        pFilter={parentFilter}
        dataminingFilter={dataminingFilter}
        readOnly={readOnly || false}
        enableUserFilter={enableUserFilter}
        displayTitle={displayTitle}
        displayParentTitle={displayParentTitle}
      />
    </DetailModelProvider>
  );
};
export default DetailGrid;
