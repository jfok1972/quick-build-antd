/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { Layout, PageHeader, Typography } from 'antd';
import HOCDndProvider from '@/utils/HOCDndProvider';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { getFilterScheme, getModuleInfo } from '../module/modules';
import UserDefineFilter from '../module/UserDefineFilter';
import type { DataminingModal } from './data';
import GroupRegion from './groupRegion';
import { DataminingReducer, getDataminingModal } from './model';
import ResultTree from './resultTree/index';
import { currentSchemeChanged, refreshAllDataminingData } from './schemeUtils';
import Toolbar from './toolbar';
import { getInitDataminingState } from './utils';
import { ConditionGrid } from './condition';
import { refreshFilterCount } from './condition/conditionUtils';
import { DataminingNavigate } from './navigate';
import { ACT_DATAMINING_FETCH_SCHEMES } from './constants';
import { getModuleIcon } from '../module/moduleUtils';
import styles from './index.less';
/**
 *
 * 商业数据分析BI的主文件
 *
 * 包含的区域为
 *
 * 1、工具栏
 * 2、当前选中条件
 * 3、自定义条件
 * 4、数据分析结果GRID
 * 5、导航区域
 * 6、设置区域
 *
 * 当前选中条件
 *
 */

interface DataminingModuleProps {
  inContainer?: boolean; // 是否是独立的一页，如果否，则表示在tab页中
  onlyTable?: boolean; // 仅显示一个table,无任何其他组件
  disableOperate?: boolean; // 不允许进行操作,不可以进行展开合同操作
  disableSchemeButton?: boolean; // 禁用分析方案按钮，不允许修改和新建方案
}

interface DataminingParams {
  moduleName: string;
  defaultSchemeid?: string; // 默认的方案
  dataminingProps?: DataminingModuleProps; // datamining的一些设置
}

// DataminingContext 中存放的上下文的字段值
export interface DataminingStateContext {
  state: DataminingModal;
  dispatch: Function;
}

// DataminingContext 的上下文
export const DataminingContext = createContext<DataminingStateContext>({
  state: getInitDataminingState('undefined'),
  dispatch: () => {},
});

const DataminingModule: React.FC<DataminingModuleProps> = ({
  inContainer,
  onlyTable,
  disableOperate,
  disableSchemeButton,
}) => {
  const context = useContext<DataminingStateContext>(DataminingContext);
  const { state, dispatch } = context;
  const { moduleName, currentScheme } = state;
  const moduleInfo = getModuleInfo(moduleName);
  // console.log('datamining rerender..........');
  // console.log(state);
  useEffect(() => {
    if (!state.schemes.length) {
      dispatch({
        type: ACT_DATAMINING_FETCH_SCHEMES,
        payload: {},
      });
    }
  }, []);

  // 筛选方案改变了以后
  useEffect(() => {
    if (!state.fromCache) {
      if (currentScheme.schemeid || (!currentScheme.schemeid && state.schemes.length === 0)) {
        currentSchemeChanged(state, dispatch);
      }
    }
  }, [currentScheme]);

  useEffect(() => {
    if (!state.fromCache) {
      if (state.refreshAllCount > 0) {
        // console.log(`需要刷新所有数据，刷新所有的数据`);
        // message.info('refresh all:' + state.refreshAllCount);
        refreshAllDataminingData(state, dispatch);
      }
    }
  }, [state.refreshAllCount]);

  // 在所有的筛选条件改变了，并且筛选列表在显示的状态下更新
  useEffect(() => {
    if (!state.fromCache) {
      if (state.refreshFilterDataSourceCount > 0) {
        if (state.currSetting.filtersRegionVisible) {
          // console.log(`需要刷新所有条件的记录值`);
          // message.info('refresh all filter datasource count:' + state.refreshFilterDataSourceCount);
          setTimeout(() => {
            refreshFilterCount(state, dispatch);
          }, 600);
        }
      }
    }
  }, [state.refreshFilterDataSourceCount]);

  // 在筛选条件列表显示时，如果未刷新，则进行刷新
  useEffect(() => {
    if (!state.fromCache) {
      if (
        state.currSetting.filtersRegionVisible &&
        state.filterDataSource.length &&
        state.filterDataSource[0].recordnum === -1
      ) {
        // console.log(`需要刷新所有条件的记录值`);
        // message.info('refresh all filter datasource count:' + state.refreshFilterDataSourceCount);
        refreshFilterCount(state, dispatch);
      }
    }
  }, [state.currSetting.filtersRegionVisible]);

  const resultTree = useMemo(
    () => <ResultTree state={state} dispatch={dispatch} disableOperate={disableOperate} />,
    [
      state.schemeState.dataSource,
      state.selectedRowKeys,
      state.expandedRowKeys,
      state.fetchLoading,
      state.monetary,
      state.monetaryPosition,
      state.schemeState.columnGroup,
      state.schemeState.fieldGroup,
      state.currSetting.fieldGroupFixedLeft,
    ],
  );
  const title = (
    <span>
      {getModuleIcon(moduleInfo)} {moduleInfo.title}
      <Typography.Text
        type="secondary"
        style={{ fontSize: '14px', marginLeft: '24px', fontWeight: 400 }}
      >
        {state.currentScheme.title}
      </Typography.Text>
    </span>
  );
  const dataminingComponent = (
    <React.Fragment>
      <GroupRegion state={state} dispatch={dispatch} key={state.moduleName} />
      <Layout className="datamininglayout">
        <DataminingNavigate />
        <Layout.Content>
          {getFilterScheme(moduleInfo) ? (
            <div className="dataminingcard">
              <UserDefineFilter
                visible={state.currSetting.userFilterRegionVisible}
                moduleState={state}
                dispatch={dispatch}
              />
            </div>
          ) : null}
          {state.currSetting.filtersRegionVisible ? <ConditionGrid /> : null}
          {resultTree}
          {/* </Space> */}
        </Layout.Content>
      </Layout>
    </React.Fragment>
  );
  return inContainer ? (
    <div>
      {onlyTable ? null : (
        <PageHeader
          title={title}
          extra={
            <Toolbar state={state} dispatch={dispatch} disableSchemeButton={disableSchemeButton} />
          }
        />
      )}
      <div className={onlyTable ? styles.dataminingcardintabonlytable : styles.dataminingcardintab}>
        {dataminingComponent}
      </div>
    </div>
  ) : (
    <PageHeaderWrapper title={title} extra={<Toolbar state={state} dispatch={dispatch} />}>
      {dataminingComponent}
    </PageHeaderWrapper>
  );
};

// 从菜单进入
interface DataminingProps {
  route: any;
  match: any;
}

export const Datamining: React.FC<DataminingParams> = ({
  moduleName,
  defaultSchemeid,
  dataminingProps,
}) => {
  // console.log("初始化DataminingModelProvider");
  const [state, dispatch] = useReducer(
    DataminingReducer,
    getDataminingModal(moduleName, defaultSchemeid),
  );
  const { inContainer, onlyTable, disableOperate, disableSchemeButton } = dataminingProps || {};
  return (
    <HOCDndProvider>
      <DataminingContext.Provider value={{ state, dispatch }}>
        <DataminingModule
          inContainer={inContainer}
          onlyTable={onlyTable}
          disableOperate={disableOperate}
          disableSchemeButton={disableSchemeButton}
        />
      </DataminingContext.Provider>
    </HOCDndProvider>
  );
};

const DataminingUrlEntry: React.FC<DataminingProps> = (params) => {
  const { route, match } = params;
  const moduleName = route.name || match.params.moduleName;
  return <Datamining moduleName={moduleName} key={moduleName} />;
};

export default DataminingUrlEntry;
