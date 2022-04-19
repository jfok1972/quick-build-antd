/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { useContext } from 'react';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { Card, Dropdown, Empty, Layout, Menu, message, Space, Tabs } from 'antd';
import type { ResizableProps } from 're-resizable';
import { Resizable } from 're-resizable';
import type { DataminingStateContext } from '..';
import { DataminingContext } from '..';
import groupMenu from '../toolbar/groupMenu';
import { NavigateTreeDiv } from './navigateTree';
import {
  ACT_NAVIGATE_ADD_GROUP,
  ACT_NAVIGATE_ACTIVETAB_CHANGE,
  ACT_NAVIGATE_REMOVE_GROUP,
  ACT_TOGGLE_NAVIGATE_REGION,
} from '../constants';

export const DataminingNavigate = () => {
  const context = useContext<DataminingStateContext>(DataminingContext);
  const { state, dispatch } = context;
  const {
    navigates,
    currSetting: {
      navigate: { visible },
    },
  } = state;
  const navigateTrees = (
    <Tabs
      onEdit={(targetKey, action) => {
        if (action === 'remove') {
          dispatch({
            type: ACT_NAVIGATE_REMOVE_GROUP,
            payload: {
              fieldid: targetKey,
            },
          });
        }
      }}
      activeKey={state.currSetting.navigate.activeKey}
      onChange={(activeKey) => {
        dispatch({
          type: ACT_NAVIGATE_ACTIVETAB_CHANGE,
          payload: {
            activeKey,
          },
        });
      }}
      type="editable-card"
      hideAdd
      size="small"
    >
      {navigates.map((navigate) => (
        <Tabs.TabPane
          closable
          tab={navigate.navigateGroup.title}
          key={navigate.navigateGroup.fieldid}
        >
          <NavigateTreeDiv navigate={navigate} state={state} dispatch={dispatch} />
        </Tabs.TabPane>
      ))}
    </Tabs>
  );

  const menu = (
    <Menu>
      {groupMenu(state.expandGroupFieldsTree || [], (group: any) => {
        if (state.navigates.find((nav) => nav.navigateGroup.fieldid === group.fieldid)) {
          message.warn(`${group.title}在导航区域中已经存在了！`);
        } else
          dispatch({
            type: ACT_NAVIGATE_ADD_GROUP,
            payload: {
              navigateGroup: group,
            },
          });
      })}
    </Menu>
  );

  const MINWIDTH = 120;
  const resizableProps: ResizableProps = {
    enable: {
      top: false,
      right: true,
      bottom: false,
      left: false,
      topRight: false,
      bottomRight: false,
      bottomLeft: false,
      topLeft: false,
    },
    minWidth: visible ? MINWIDTH : undefined,
    maxWidth: 500,
    size: !visible ? { width: 0, height: 0 } : undefined,
    style: {
      marginRight: '12px',
    },
  };

  return state.currSetting.navigate.visible ? (
    <Resizable {...resizableProps}>
      <Layout.Sider theme="light" width="auto">
        <Card
          bodyStyle={{ paddingTop: 0 }}
          title="条件导航"
          extra={
            <Space>
              <Dropdown overlay={menu} trigger={['click']}>
                <PlusOutlined />
              </Dropdown>
              <CloseOutlined
                onClick={() => {
                  dispatch({
                    type: ACT_TOGGLE_NAVIGATE_REGION,
                    payload: {},
                  });
                }}
              />
            </Space>
          }
          size="small"
        >
          {state.navigates.length === 0 ? (
            <Empty style={{ marginTop: '48px' }} description="暂无导航分组" />
          ) : null}
          {navigateTrees}
        </Card>
      </Layout.Sider>
    </Resizable>
  ) : null;
};
