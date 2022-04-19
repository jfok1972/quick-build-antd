/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useContext, useEffect } from 'react';
import { Card, Divider, Layout, Space } from 'antd';
import type { ModuleState } from '../data';
import { DetailModelContext } from './model';
import ModuleGrid from '../grid';
import { getModuleInfo, getDefaultModuleState, getFilterScheme } from '../modules';
import { SelectModelProvider } from './provider';
import ModuleForm from '../form';
import ModuleToolbar from '../toolbar';
import UserDefineFilter from '../UserDefineFilter';
import PageHeaderToolbar from '../PageHeaderToolbar';
import { NavigateSider } from '../navigate/sider';

export interface SelectGridPrpos {
  moduleName: string; // 选择模块的模块名称
  manyToOneInfo: any;
}

const SelectTable = ({ manyToOneInfo }: { manyToOneInfo: any }) => {
  const context = useContext(DetailModelContext);
  const { dispatch } = context;
  const moduleState = context.moduleState as ModuleState;
  const { moduleName } = moduleState;
  const moduleInfo = getModuleInfo(moduleState.moduleName);

  useEffect(() => {
    const state: ModuleState = getDefaultModuleState({ moduleName });
    dispatch({
      type: 'modules/init',
      payload: {
        initState: {
          ...state,
          currSetting: {
            ...state.currSetting,
            gridSize: 'small',
          },
        },
      },
    });
  }, [moduleName]);

  // 对于新建的记录，在看看combo中有没有记录，如果有，就把刚新建的加进去。不然马上新建detailgrid的时候显示不对
  const readOnly = true;
  const hasCardNavigate = moduleInfo.navigateSchemes.length;
  const navVisible = moduleState.currSetting.navigate.visible;
  return (
    <div>
      <div style={{ display: 'flex' }}>
        <span style={{ flex: 1, fontSize: '16px', fontWeight: 'bold', margin: '8px 8px' }}>
          {`选择 ${moduleInfo.title}`}
        </span>
        <Space>
          <ModuleToolbar
            moduleInfo={moduleInfo}
            moduleState={moduleState}
            manyToOneInfo={manyToOneInfo}
            dispatch={dispatch}
            readOnly={readOnly}
          />
          <PageHeaderToolbar
            moduleState={moduleState}
            moduleInfo={moduleInfo}
            dispatch={dispatch}
          />
        </Space>
      </div>
      <Divider style={{ margin: '8px 0px 0px', padding: 0 }} />
      <Layout style={{ padding: '16px' }}>
        <NavigateSider moduleState={moduleState} dispatch={dispatch} />
        <Layout.Content style={hasCardNavigate && navVisible ? { margin: '0 0 0 16px' } : {}}>
          {getFilterScheme(moduleInfo) ? (
            <UserDefineFilter
              visible={moduleState.currSetting.userFilterRegionVisible}
              moduleState={moduleState}
              dispatch={dispatch}
            />
          ) : null}
          <Card bordered={false} bodyStyle={{ paddingTop: '0px', paddingBottom: '0px' }}>
            <ModuleGrid
              moduleState={moduleState}
              moduleInfo={moduleInfo}
              dispatch={dispatch}
              fetchLoading={moduleState.fetchLoading}
              gridType="selectfield"
              readOnly={readOnly}
              manyToOneInfo={manyToOneInfo}
            />
          </Card>
        </Layout.Content>
      </Layout>
      <ModuleForm moduleInfo={moduleInfo} moduleState={moduleState} dispatch={dispatch} />
    </div>
  );
};

const SelectGrid: React.FC<SelectGridPrpos> = ({ moduleName, manyToOneInfo }) => {
  return (
    <SelectModelProvider moduleName={moduleName}>
      <SelectTable manyToOneInfo={manyToOneInfo} />
    </SelectModelProvider>
  );
};

export default SelectGrid;
