/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { useEffect, useState } from 'react';
import type { Dispatch } from 'redux';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, Tabs, Tooltip } from 'antd';
import type { ModuleModal, ModuleState, ParentFilterModal } from '../data';
import { getModuleInfo } from '../modules';
import { fetchNavigateTreeData } from '../service';
import { getAwesomeIcon } from '@/utils/utils';

const { TabPane } = Tabs;
const ALLRECORDKEY = '__all_record__key_';
export const TabParentFilters: React.FC<any> = ({
  moduleState,
  dispatch,
}: {
  moduleState: ModuleState;
  dispatch: Dispatch;
}) => {
  const [reloadTabsData, setReloadTabsData] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { moduleName, tabParentFilters } = moduleState;
  const moduleInfo: ModuleModal = getModuleInfo(moduleName);
  const { tabParentNavigateScheme } = moduleInfo;
  const loadTabsData = () => {
    setLoading(true);
    const params: any = {
      moduleName,
      title: tabParentNavigateScheme.title,
      navigateschemeid: tabParentNavigateScheme.navigateschemeid,
      cascading: false,
      isContainNullRecord: tabParentNavigateScheme.tf_isContainNullRecord,
    };
    fetchNavigateTreeData(params).then((result) => {
      let arrays: ParentFilterModal[] = [];
      if (result && result.children[0] && result.children[0].children) {
        arrays = (result.children[0].children as any[]).map((rec: any) => {
          return {
            moduleName: rec.moduleName,
            fieldahead: rec.fieldahead,
            fieldName: rec.fieldName,
            fieldtitle: rec.fieldtitle,
            operator: rec.operator,
            fieldvalue: rec.fieldvalue,
            text: rec.text,
            count: rec.count,
            numberGroupId: rec.numberGroupId,
            schemeDetailId: rec.schemeDetailId,
            iconCls: rec.iconCls,
          };
        });
      }
      dispatch({
        type: 'modules/setTabParentFilters',
        payload: {
          moduleName,
          tabParentFilters: arrays,
        },
      });
      setTimeout(() => {
        setLoading(false);
      }, 500);
    });
  };
  useEffect(() => {
    loadTabsData();
  }, [reloadTabsData]);
  const tabPanes: any[] = [<TabPane tab="全部" key={ALLRECORDKEY} />];
  if (tabParentFilters) {
    tabPanes.push(
      ...tabParentFilters.map((tab: any) => (
        <TabPane
          tab={
            <>
              {tab.iconCls ? <>{getAwesomeIcon(tab.iconCls)} </> : ''}
              {`${tab.text}(${tab.count})`}
            </>
          }
          key={tab.fieldvalue}
        />
      )),
    );
  }
  return (
    <Tabs
      type="line"
      tabBarExtraContent={{
        left: (
          <Tooltip title="刷新标签页数据">
            <Button type="link" loading={loading}>
              <ReloadOutlined
                onClick={() => {
                  if (!loading) setReloadTabsData((data) => data + 1);
                }}
              />
            </Button>
          </Tooltip>
        ),
      }}
      style={{ paddingTop: '8px' }}
      activeKey={
        moduleState.filters.parentfilter
          ? moduleState.filters.parentfilter.fieldvalue
          : ALLRECORDKEY
      }
      onChange={(activeKey) => {
        dispatch({
          type: 'modules/parentFilterChanged',
          payload: {
            moduleName,
            parentFilter:
              activeKey === ALLRECORDKEY
                ? null
                : tabParentFilters?.find((filter) => filter.fieldvalue === activeKey),
          },
        });
      }}
    >
      {tabPanes}
    </Tabs>
  );
};
