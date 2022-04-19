/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import type { Dispatch } from 'redux';
import { Dropdown, Menu, message } from 'antd';
import { SettingOutlined, CheckOutlined } from '@ant-design/icons';
import type { FormState, ModuleState } from '../../data';

const FormShowTypes = ['modal', 'drawer', 'mainregion'];
const FormShowTypeTexts = {
  modal: '窗口式',
  drawer: '抽屉式',
  mainregion: '主区域',
};

/**
 * 选择窗口的显示类型，
 */
interface ShowTypeSelectProps {
  moduleName: string;
  formState: FormState;
  dispatch: Dispatch;
  moduleState: ModuleState;
  changed: boolean; // 改变了值，就不要切换了，保存了
}

const menuTitle = '表单显示位置';

export const ShowTypeSelect: React.FC<ShowTypeSelectProps> = ({
  moduleName,
  formState,
  dispatch,
  changed,
  moduleState,
}) => {
  const { showType } = formState;
  const menu = (
    <Menu
      onClick={({ key }) => {
        if (changed) {
          message.warn(`请先保存此记录再执行改变${menuTitle}的操作！`);
        } else
          dispatch({
            type: 'modules/formStateChanged',
            payload: {
              moduleName,
              formState: { ...formState, showType: key },
            },
          });
      }}
    >
      <Menu.ItemGroup title={menuTitle}>
        {FormShowTypes.map((type) => (
          <Menu.Item
            disabled={!!(type === 'mainregion' && moduleState.filters.parentfilter)}
            icon={
              <CheckOutlined style={{ visibility: showType === type ? 'visible' : 'hidden' }} />
            }
            key={type}
          >
            {FormShowTypeTexts[type]}
          </Menu.Item>
        ))}
      </Menu.ItemGroup>
    </Menu>
  );
  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <SettingOutlined />
    </Dropdown>
  );
};
