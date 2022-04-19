/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { Card, Form, Radio, Switch } from 'antd';
import { BlockOutlined } from '@ant-design/icons';
import { getMonetarysValueText } from '@/pages/module/grid/monetary';
import type { TextValue } from '@/pages/module/data';
import type { DefaultSettings as SettingModelState } from '../../../../../config/defaultSettings';

interface FavoriteViewProps {
  dispatch: Function;
  settings: SettingModelState;
}

const FavoriteView: React.FC<FavoriteViewProps> = ({ dispatch, settings }) => {
  const [form] = Form.useForm();
  const dispatchChange = (key: string, value: string | boolean) => {
    localStorage.setItem(`settings-${key}`, value.toString());
    dispatch({
      type: 'settings/changeSetting',
      payload: {
        [key]: value,
      },
    });
  };
  return (
    <Card title="偏好设置" bordered={false} bodyStyle={{ padding: 0, margin: 0, marginTop: '2px' }}>
      <Form form={form} labelCol={{ flex: '0 0 120px' }}>
        <Card
          className="card_border_top_first"
          title={
            <>
              <BlockOutlined /> 界面总体设置
            </>
          }
          size="small"
          bordered={false}
        >
          <Form.Item label="整体风格设置">
            <Radio.Group
              value={settings.navTheme}
              onChange={(e) => {
                dispatchChange('navTheme', e.target.value);
              }}
            >
              <Radio.Button value="light">亮色菜单</Radio.Button>
              <Radio.Button value="dark">暗色菜单</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="导航模式">
            <Radio.Group
              value={settings.layout}
              onChange={(e) => {
                dispatchChange('layout', e.target.value);
              }}
            >
              <Radio.Button value="side">侧边菜单</Radio.Button>
              <Radio.Button value="top">顶部菜单</Radio.Button>
              <Radio.Button value="mix">混合菜单</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="内容区域宽度">
            <Radio.Group
              value={settings.contentWidth}
              onChange={(e) => {
                dispatchChange('contentWidth', e.target.value);
              }}
            >
              <Radio.Button value="Fluid">流式</Radio.Button>
              <Radio.Button value="Fixed">定宽</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="固定 Header">
            <Switch
              checked={settings.fixedHeader}
              onChange={(value) => {
                dispatchChange('fixedHeader', value);
              }}
            />
          </Form.Item>
          <Form.Item label="固定侧边菜单">
            <Switch
              checked={settings.fixSiderbar}
              onChange={(value) => {
                dispatchChange('fixSiderbar', value);
              }}
            />
          </Form.Item>
        </Card>
        <Card
          className="card_border_top_first"
          title={
            <>
              <BlockOutlined /> 列表和表单设置
            </>
          }
          size="small"
          bordered={false}
        >
          <Form.Item key="monerarytype" label="数值单位">
            <Radio.Group
              value={settings.monetaryType}
              onChange={(e) => {
                dispatchChange('monetaryType', e.target.value);
              }}
            >
              {getMonetarysValueText().map((rec: TextValue) => (
                <Radio.Button key={rec.value} value={rec.value}>
                  {rec.text}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item key="moneraryposition" label="显示位置">
            <span>
              <Radio.Group
                value={settings.monetaryPosition}
                onChange={(e) => {
                  dispatchChange('monetaryPosition', e.target.value);
                }}
              >
                <Radio.Button value="behindnumber">显示在数值后</Radio.Button>
                <Radio.Button value="columntitle">显示在列头上</Radio.Button>
              </Radio.Group>
            </span>
          </Form.Item>
        </Card>
      </Form>
    </Card>
  );
};

export default FavoriteView;
