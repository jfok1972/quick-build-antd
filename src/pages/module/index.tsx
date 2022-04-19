/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { createContext, useEffect } from 'react';
import { PageHeaderWrapper, GridContent, WaterMark } from '@ant-design/pro-layout';
import { Spin, Card, Skeleton, Space, Layout } from 'antd';
import type { Dispatch } from 'redux';
import { connect } from 'dva';
import { getTitleFromSysMenu } from '@/layouts/BasicLayout';
import HOCDndProvider from '@/utils/HOCDndProvider';
import ModuleGrid from './grid';
import type { ModuleModal, ModuleState, ParentFilterModal } from './data';
import ModuleToolbar from './toolbar';
import PageHeaderToolbar from './PageHeaderToolbar';
import UserDefineFilter from './UserDefineFilter';
import { getModuleInfo, getFilterScheme } from './modules';
import { NavigateSider } from './navigate/sider';
import {
  isParentFilterChanged,
  getParentFilterTitle,
  getModuleIcon,
  ModuleHelpMarkDown,
} from './moduleUtils';
import PinStatus from './widget/pinStatus';
import ModuleForm from './form';
import StartEndDateSectionSelect from './grid/sqlparams';
import { moduleStaticCards } from './staticCard/system';
import { TableBlockDetails } from './blockScheme';
import { TabParentFilters } from './grid/TabParentFilters';

interface ModuleProps {
  dispatch: Dispatch<any>;
  fetchLoading: boolean;
  route: any;
  location: any;
  modules: ModuleState[];
  match: any;
}

// DataminingContext 中存放的上下文的字段值
export interface ModuleStateContext {
  state: ModuleState | any;
  dispatch: Function;
}

// DataminingContext 的上下文
export const ModuleContext = createContext<ModuleStateContext>({
  state: undefined,
  dispatch: () => {},
});

/**
 * 使用网址进入模块的入口。进入的是一个全界面的入口，
 * 可以加入参数，不显示菜单，不显示头部区域，只显示该模块
 *
 * @param params
 */
const ModuleUrlEntry: React.FC<ModuleProps> = (params) => {
  const { location, route, dispatch, modules, fetchLoading, match } = params;
  /**
     *  {   name : 'FDictionary',               精确设置某个模块的路由
            path: '/* /module/FDictionary',
            component: './module/index'   }  这个会使用  route.name 来进行匹配name的值，

        {   path: '* /module/:moduleName?',     通过匹配来确定模块的路由
            component: './module/index', }   这种的路由会通过 match.params 来进行匹配moduleName的值
     */

  // console.log('url enter renderer.......');
  // console.log(params);
  // 确定模块名称
  const moduleName = route.name || match.params.moduleName;
  const moduleState: ModuleState = modules[moduleName];
  const moduleInfo: ModuleModal = getModuleInfo(moduleName);

  // 模块通过url加载时，一种是标准模块,一种是有父模块限定条件的模块
  // 如果有父模块限定，则在  location.query 或 location.state 中有 parentfilter 参数
  let urlParentFilter: ParentFilterModal | undefined = undefined;
  // 如果parentFilter的值改变了，先去执行modules/filterChanged，把数据改变之后再生成module
  let parentFilterChanged: boolean = false;
  // url中加了父模块限定
  const { query, state } = location;
  if (query && query.parentFilter) {
    // 使用   history.push({pathname,
    //                      query: { parentFilter }
    //          }); 的方式来传递值，URL参数显示在地址栏，刷新后参数不丢失
    // 显式的调用只能用这种方式
    urlParentFilter = JSON.parse(decodeURIComponent(query.parentFilter));
  } else if (state && state.parentFilter) {
    // 使用   history.push({pathname,
    //                      state: { parentFilter }
    //          }); 的方式来传递值，URL参数不显示在地址栏，刷新后参数也不会丢失
    urlParentFilter = JSON.parse(decodeURIComponent(state.parentFilter));
  }

  useEffect(() => {
    // 如果模块的定义信息还没有加载，则先去加载
    if (!moduleState)
      dispatch({
        type: 'modules/fetchModuleInfo',
        payload: {
          moduleName,
        },
      });
  }, [moduleName]);
  if (moduleState) {
    // url 改变了 parentFilter
    parentFilterChanged =
      !!urlParentFilter && isParentFilterChanged({ moduleState, parentFilter: urlParentFilter });
    if (parentFilterChanged)
      dispatch({
        type: 'modules/parentFilterChanged',
        payload: {
          moduleName,
          parentFilter: urlParentFilter,
        },
      });
  }
  if (!moduleState) {
    return (
      <PageHeaderWrapper
        title={
          <span>
            {getTitleFromSysMenu(moduleName)}
            {getParentFilterTitle(urlParentFilter, moduleState, dispatch)}
          </span>
        }
      >
        <Spin size="large">
          <Card style={{ textAlign: 'center' }}>
            <Skeleton paragraph={{ rows: 6 }} />
          </Card>
        </Spin>
      </PageHeaderWrapper>
    );
  }
  const moduleForm = (
    <ModuleForm moduleInfo={moduleInfo} moduleState={moduleState} dispatch={dispatch} />
  );
  const hasCardNavigate = moduleInfo.navigateSchemes.length;
  const navVisible = moduleState.currSetting.navigate.visible;
  const gridArea = (
    <>
      {getFilterScheme(moduleInfo) ? (
        <UserDefineFilter
          visible={moduleState.currSetting.userFilterRegionVisible}
          moduleState={moduleState}
          dispatch={dispatch}
        />
      ) : null}
      <Card
        style={{ marginBottom: '20px' }}
        bodyStyle={
          moduleState.dataSource.length === 0
            ? { paddingTop: '16px', paddingBottom: '16px' }
            : { paddingTop: '8px', paddingBottom: '8px' }
        }
        bordered={false}
      >
        <ModuleGrid
          moduleInfo={moduleInfo}
          moduleState={moduleState}
          gridType="normal"
          dispatch={dispatch}
          fetchLoading={fetchLoading}
        />
      </Card>
    </>
  );
  const moduleDescription = moduleInfo.description ? (
    // eslint-disable-next-line
    <span dangerouslySetInnerHTML={{ __html: moduleInfo.description || '' }} />
  ) : null;
  const { Content } = Layout;
  const component =
    moduleState.formState.showType === 'mainregion' && moduleState.formState.visible ? (
      moduleForm
    ) : (
      <PageHeaderWrapper
        title={
          <span>
            {getModuleIcon(moduleInfo)} {moduleInfo.title}
            <ModuleHelpMarkDown moduleInfo={moduleInfo} />
            <span>
              {!urlParentFilter && moduleInfo.tabParentNavigateScheme
                ? null
                : getParentFilterTitle(moduleState.filters.parentfilter, moduleState, dispatch)}
              <PinStatus dispatch={dispatch} moduleState={moduleState} />
            </span>
          </span>
        }
        extra={
          <Space size="large">
            <ModuleToolbar
              moduleInfo={moduleInfo}
              moduleState={moduleState}
              manyToOneInfo={null}
              dispatch={dispatch}
            />
            <PageHeaderToolbar
              moduleState={moduleState}
              moduleInfo={moduleInfo}
              dispatch={dispatch}
            />
          </Space>
        }
        content={
          moduleDescription || (!urlParentFilter && moduleInfo.tabParentNavigateScheme) ? (
            <>
              {moduleDescription ? <div>{moduleDescription}</div> : null}
              {!urlParentFilter && moduleInfo.tabParentNavigateScheme ? (
                <TabParentFilters moduleState={moduleState} dispatch={dispatch} />
              ) : null}
            </>
          ) : null
        }
        // extraContent={<span id={spanid}> </span>}
      >
        <GridContent>
          {moduleStaticCards[moduleName] && moduleState.currSetting.tableWidgetsVisible ? (
            <Layout style={{ marginBottom: '16px' }}>{moduleStaticCards[moduleName]}</Layout>
          ) : null}
          {moduleInfo.tableWidgets.length && moduleState.currSetting.tableWidgetsVisible ? (
            <Layout style={{ marginBottom: '16px' }}>
              {<TableBlockDetails tableWidgets={moduleInfo.tableWidgets} />}
            </Layout>
          ) : null}
          <Layout>
            <NavigateSider moduleState={moduleState} dispatch={dispatch} />
            <Content style={hasCardNavigate && navVisible ? { margin: '0 0 0 16px' } : {}}>
              {moduleState.dataSource.length === 0 && moduleInfo.moduleLimit.hassqlparam ? (
                <StartEndDateSectionSelect moduleState={moduleState} dispatch={dispatch} />
              ) : null}
              {gridArea}
            </Content>
          </Layout>
        </GridContent>
        {/* 模块的form的字义 */}
        {moduleForm}
      </PageHeaderWrapper>
    );

  return (
    <HOCDndProvider>
      <ModuleContext.Provider value={{ state: moduleState, dispatch }}>
        <WaterMark
          rotate={-22}
          // content="Quick Build System"
          fontColor="rgba(0,0,0,.15)"
          fontSize={16}
          zIndex={30009}
        >
          {component}
        </WaterMark>
      </ModuleContext.Provider>
    </HOCDndProvider>
  );
};

export default connect(
  ({
    modules,
    loading,
  }: {
    modules: ModuleState[];
    loading: { effects: Record<string, boolean> };
  }) => ({
    modules,
    fetchLoading: loading.effects['modules/fetchData'] || loading.effects['modules/filterChanged'],
  }),
)(ModuleUrlEntry);
