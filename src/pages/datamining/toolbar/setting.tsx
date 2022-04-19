/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useContext, useState } from 'react';
import type { TextValue } from '@/pages/module/data';
import { getMonetarysValueText } from '@/pages/module/grid/monetary';
import { SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, InputNumber, Menu, Radio, Switch } from 'antd';
import type { DataminingStateContext } from '..';
import { DataminingContext } from '..';
import { ACT_MONETARY_CHANGED, ACT_SETTING_CHANGE } from '../constants';

const DataminingSetting: React.FC = () => {
  const context = useContext<DataminingStateContext>(DataminingContext);
  const { state, dispatch } = context;
  const {
    schemeState: { setting },
  } = state;
  const [visible, setVisible] = useState<boolean>(false);
  const settingChange = ({ property, value }: { property: string; value: any }) => {
    dispatch({
      type: ACT_SETTING_CHANGE,
      payload: {
        [property]: value,
      },
    });
  };

  const actionMenu = [
    <Menu.ItemGroup title="数值单位设置" key="itemgroupmonerary">
      <Menu.Item key="monetarytype">
        <div>
          数值单位：
          <Radio.Group
            value={state.monetary.type}
            onChange={(e: any) => {
              dispatch({
                type: ACT_MONETARY_CHANGED,
                payload: {
                  monetaryType: e.target.value,
                },
              });
            }}
          >
            {getMonetarysValueText().map((rec: TextValue) => (
              <Radio.Button key={rec.value} value={rec.value}>
                {rec.text}
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>
      </Menu.Item>
      <Menu.Item key="monetaryposition">
        <div>
          显示位置：
          <Radio.Group
            value={state.monetaryPosition}
            onChange={(e: any) => {
              dispatch({
                type: ACT_MONETARY_CHANGED,
                payload: {
                  position: e.target.value,
                },
              });
            }}
          >
            <Radio.Button value="behindnumber">显示在数值后</Radio.Button>
            <Radio.Button value="columntitle">显示在列头上</Radio.Button>
          </Radio.Group>
        </div>
      </Menu.Item>
    </Menu.ItemGroup>,
    <Menu.ItemGroup title="数据分析设置" key="itemgroupexpandrowadd">
      <Menu.Item key="expandRowAddGroupName">
        <div>
          展开行时加入分组名称行：
          <Switch
            checked={setting.expandRowAddGroupName === 'yes'}
            onChange={(value) => {
              settingChange({
                property: 'expandRowAddGroupName',
                value: value ? 'yes' : 'no',
              });
            }}
          />
        </div>
      </Menu.Item>
      <Menu.Item key="expandColAddGroupName">
        <div>
          展开列时加入分组名称组：
          <Switch
            checked={setting.expandColAddGroupName === 'yes'}
            onChange={(value) => {
              settingChange({
                property: 'expandColAddGroupName',
                value: value ? 'yes' : 'no',
              });
            }}
          />
        </div>
      </Menu.Item>
      <Menu.Item key="expandMaxCol">
        <div>
          列展开时的最大子项数：
          <InputNumber
            value={setting.expandMaxCol}
            min={0}
            onChange={(value) => {
              settingChange({
                property: 'expandMaxCol',
                value,
              });
            }}
          />
        </div>
      </Menu.Item>
      <Menu.Item key="autoHiddenZeroCol">
        <div>
          总计为空分组列自动隐藏：
          <Switch
            checked={setting.autoHiddenZeroCol === 'yes'}
            onChange={(value) => {
              settingChange({
                property: 'autoHiddenZeroCol',
                value: value ? 'yes' : 'no',
              });
            }}
          />
        </div>
      </Menu.Item>
      <Menu.Item key="expandMultiGroup">
        <div>
          行可以展开多个分组：
          <Switch
            checked={setting.expandMultiGroup === 'yes'}
            onChange={(value) => {
              settingChange({
                property: 'expandMultiGroup',
                value: value ? 'yes' : 'no',
              });
            }}
          />
        </div>
      </Menu.Item>
    </Menu.ItemGroup>,
  ];

  return (
    <Dropdown
      overlay={<Menu>{actionMenu}</Menu>}
      visible={visible}
      onVisibleChange={() => setVisible((v) => !v)}
    >
      <Button type="text" size="small">
        <SettingOutlined />
        设置
      </Button>
    </Dropdown>
  );
};

export default DataminingSetting;
