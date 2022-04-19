/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useMemo } from 'react';
import { Button, Dropdown, Input, Menu, Tooltip, Tree } from 'antd';
import { RetweetOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { EMPTY_MENU_ICON } from '@/utils/utils';
import type { DataminingModal } from '../data';
import type { DataminingNavigateModal } from './data';
import {
  fetchNavigateData,
  genAllTreeData,
  navigateDataSourceSort,
  onNavigateSearch,
  toggleNavigateSelected,
} from './navigateUtils';
import {
  ACT_NAVIGATE_FETCH_DATA,
  ACT_NAVIGATE_EXPAND,
  ACT_NAVIGATE_CHECKED,
  ACT_NAVIGATE_AFTER_CHANGE,
  NAVIGATE_CHECK_CHANGE_DELAY,
  ACT_NAVIGATE_SELECTED,
} from '../constants';

const { Search } = Input;

let changeCount: number = 1;

// 导航条件选中后延时刷新的执行过程
const refreshTreeGridAndCondition = (count: number, dispatch: Function) => {
  if (count === changeCount) {
    dispatch({
      type: ACT_NAVIGATE_AFTER_CHANGE,
      payload: {},
    });
  }
};

// 导航条件改变过后在delay毫秒后再进行数据刷新，
// 判断一下是否是全选到全清的，如果是则不需要刷新数据
export const navigateCheckedChange = (
  state: DataminingModal,
  dispatch: Function,
  fieldid: string,
  checkedKeys: any[],
  delay: number,
) => {
  dispatch({
    type: ACT_NAVIGATE_CHECKED,
    payload: {
      fieldid,
      checkedKeys,
    },
  });
  // 检查前后状态是否都是全空或全选
  const navigate = state.navigates.find((nav) => nav.navigateGroup.fieldid === fieldid);
  let needRefresh = true;
  if (navigate) {
    if (
      (checkedKeys.length === 0 || checkedKeys.find((key) => key === 'root')) &&
      (navigate.checkedKeys.length === 0 || navigate.checkedKeys.find((key) => key === 'root'))
    )
      needRefresh = false;
  }
  // 状态前后都是空或者都是选中，则不进行数据刷新
  if (needRefresh) {
    changeCount += 1;
    const i = changeCount;
    setTimeout(() => {
      refreshTreeGridAndCondition(i, dispatch);
    }, delay);
  }
};

export const NavigateTree: React.FC<any> = ({
  navigate,
  state,
  dispatch,
}: {
  navigate: DataminingNavigateModal;
  state: DataminingModal;
  dispatch: Function;
}) => {
  const { navigateGroup } = navigate;
  useEffect(() => {
    if (navigate.dataSource.length === 0)
      fetchNavigateData(state, navigate, []).then((records: any[]) => {
        const expandedKeys: string[] = ['root'];
        const dataSource = [
          {
            title: navigateGroup.title,
            selectable: false,
            key: 'root',
            rowid: 'root',
            children: genAllTreeData(
              records,
              navigateGroup,
              null,
              navigateGroup.fieldid,
              navigateGroup.title,
              expandedKeys,
            ),
          },
        ];
        dispatch({
          type: ACT_NAVIGATE_FETCH_DATA,
          payload: {
            fieldid: navigateGroup.fieldid,
            dataSource,
            expandedKeys,
          },
        });
      });
  }, []);
  const sortMenu = (
    <Menu
      onClick={({ key }) => {
        const parts = (key as string).split('-');
        navigateDataSourceSort(navigate, dispatch, parts[0], parts[1]);
      }}
    >
      <Menu.Item key="count-desc" icon={EMPTY_MENU_ICON}>
        记录数由大到小
      </Menu.Item>
      <Menu.Item key="count-asc" icon={<SortAscendingOutlined />}>
        记录数由小到大
      </Menu.Item>
      <Menu.Item key="value-asc" icon={<SortAscendingOutlined />}>
        记录编码升序
      </Menu.Item>
      <Menu.Item key="value-desc" icon={EMPTY_MENU_ICON}>
        记录编码降序
      </Menu.Item>
      <Menu.Item key="text-asc" icon={<SortAscendingOutlined />}>
        记录文本升序
      </Menu.Item>
      <Menu.Item key="text-desc" icon={EMPTY_MENU_ICON}>
        记录文本降序
      </Menu.Item>
    </Menu>
  );
  return (
    <>
      <div style={{ display: 'flex', marginBottom: '8px', marginTop: '-4px' }}>
        <Dropdown overlay={sortMenu} trigger={['click']}>
          <Button size="small" shape="circle" onClick={() => {}}>
            <SortAscendingOutlined />
          </Button>
        </Dropdown>
        <Tooltip title="选中和未选中条件互换">
          <Button
            style={{ margin: '0px 6px' }}
            size="small"
            shape="circle"
            onClick={() => {
              toggleNavigateSelected(state, dispatch, navigate);
            }}
          >
            <RetweetOutlined />
          </Button>
        </Tooltip>
        <Search
          size="small"
          placeholder="搜索文本或简全拼"
          style={{ flex: 1 }}
          defaultValue={navigate.search}
          allowClear
          onSearch={(search: string) => {
            onNavigateSearch(navigate, search, dispatch);
          }}
        />
      </div>

      <Tree
        checkable
        multiple
        draggable={false}
        blockNode
        style={{ whiteSpace: 'nowrap' }}
        treeData={navigate.dataSource}
        selectedKeys={navigate.selectedKeys}
        onSelect={(selectedKeys) => {
          dispatch({
            type: ACT_NAVIGATE_SELECTED,
            payload: {
              fieldid: navigateGroup.fieldid,
              selectedKeys,
            },
          });
        }}
        checkedKeys={navigate.checkedKeys}
        onCheck={(checkedKeys: any) => {
          navigateCheckedChange(
            state,
            dispatch,
            navigateGroup.fieldid,
            checkedKeys,
            NAVIGATE_CHECK_CHANGE_DELAY,
          );
        }}
        expandedKeys={navigate.expandedKeys}
        onExpand={(expandedKeys: any) => {
          dispatch({
            type: ACT_NAVIGATE_EXPAND,
            payload: {
              fieldid: navigateGroup.fieldid,
              expandedKeys,
            },
          });
        }}
      />
    </>
  );
};

export const NavigateTreeDiv: React.FC<any> = ({
  navigate,
  state,
  dispatch,
}: {
  navigate: DataminingNavigateModal;
  state: DataminingModal;
  dispatch: Function;
}) => {
  const navigateTree = useMemo(
    () => <NavigateTree navigate={navigate} state={state} dispatch={dispatch} />,
    [navigate.dataSource, navigate.expandedKeys, navigate.checkedKeys, navigate.selectedKeys],
  );
  return navigateTree;
};
