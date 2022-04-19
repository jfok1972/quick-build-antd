/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useContext } from 'react';
import { Button, Dropdown, Menu, Modal } from 'antd';
import {
  AppstoreOutlined,
  CheckOutlined,
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { DataminingStateContext } from '..';
import { DataminingContext } from '..';
import { ACT_DATAMINING_CHANGE_SCHEME } from '../constants';
import { deleteCurrentScheme, saveEditScheme, saveNewScheme } from '../schemeUtils';

const SelectScheme: React.FC = () => {
  const context = useContext<DataminingStateContext>(DataminingContext);
  const { state, dispatch } = context;
  const { currentScheme } = state;
  const actionMenu = [
    <Menu.Item
      key="addscheme"
      icon={<PlusOutlined />}
      onClick={() => {
        saveNewScheme(state, dispatch);
      }}
    >
      当前数据分析方案另存为
    </Menu.Item>,
    <Menu.Item
      key="savescheme"
      icon={<SaveOutlined />}
      disabled={state.schemes.length === 0}
      onClick={() => {
        saveEditScheme(state);
      }}
    >
      保存到当前数据分析方案
    </Menu.Item>,
    <Menu.Item
      danger
      key="deletescheme"
      icon={<DeleteOutlined />}
      disabled={state.schemes.length === 0}
      onClick={() =>
        Modal.confirm({
          title: '确定删除',
          icon: <QuestionCircleOutlined />,
          width: 500,
          content: `确定要删除数据分析方案『${state.currentScheme.text}』吗？`,
          okText: '确认',
          okType: 'danger',
          cancelText: '取消',
          onOk: () => deleteCurrentScheme(state, dispatch),
        })
      }
    >
      删除当前数据分析方案
    </Menu.Item>,
    <Menu.ItemGroup key="schemes" title="所有数据分析方案">
      {state.schemes.length === 0 ? (
        <Menu.Item key="_noscheme_" disabled>
          暂无数据分析方案
        </Menu.Item>
      ) : (
        state.schemes.map((scheme) => (
          <Menu.Item
            key={scheme.schemeid}
            icon={
              currentScheme?.schemeid === scheme.schemeid ? (
                <CheckOutlined />
              ) : (
                <CheckOutlined style={{ visibility: 'hidden' }} />
              )
            }
            onClick={() => {
              dispatch({
                type: ACT_DATAMINING_CHANGE_SCHEME,
                payload: {
                  currentScheme: scheme,
                },
              });
            }}
          >
            {scheme.title}
          </Menu.Item>
        ))
      )}
    </Menu.ItemGroup>,
  ];

  const menu = <Menu>{actionMenu}</Menu>;

  return (
    <Dropdown overlay={menu}>
      <Button type="text" size="small">
        <AppstoreOutlined />
        分析方案
      </Button>
    </Dropdown>
  );
};

export default SelectScheme;
