/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { Form, Switch, Row, Col, Radio, InputNumber, Card, Divider } from 'antd';
import type { Dispatch } from 'redux';
import type { ModuleState } from '../../data';
import { SettingOutlined } from '@ant-design/icons';

const SettingForm = ({
  moduleState,
  dispatch,
}: {
  moduleState: ModuleState;
  dispatch: Dispatch;
}) => {
  const [form] = Form.useForm();
  const { moduleName, gridExportSetting: setting } = moduleState;
  const style: React.CSSProperties = {
    padding: 0,
    margin: 0,
  };
  return (
    <Card
      title={
        <>
          <SettingOutlined />
          {' 列表导出设置'}
        </>
      }
      size="small"
      style={{ border: '0px' }}
    >
      <Form
        form={form}
        autoComplete="off"
        className="moduleform"
        labelCol={{ flex: '1 1 120px' }}
        style={{ width: '460px' }}
        initialValues={setting}
        onValuesChange={() => {
          dispatch({
            type: 'modules/gridExportSettingChanged',
            payload: {
              moduleName,
              gridExportSetting: form.getFieldsValue(),
            },
          });
        }}
      >
        <Row gutter={0}>
          <Col span={12}>
            <Form.Item
              name="usemonetary"
              label="加入当前数值单位"
              valuePropName="checked"
              style={style}
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="colorless" label="无前景背景色" valuePropName="checked" style={style}>
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="sumless" label="不加入总计行" valuePropName="checked" style={style}>
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="unitalone"
              label="计量单位单独一行"
              valuePropName="checked"
              style={style}
            >
              <Switch />
            </Form.Item>
          </Col>
          <Divider style={{ height: '3px', margin: '4px' }} />
          <Col span={24}>
            <Form.Item
              name="pagesize"
              label="导出纸张设置"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
            >
              <Radio.Group>
                <Radio value="pageautofit">自动适应</Radio>
                <br />
                <Radio value="A4">A4纵向</Radio>
                <Radio value="A4landscape">A4横向</Radio>
                <br />
                <Radio value="A3">A3纵向</Radio>
                <Radio value="A3landscape">A3横向</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="scale" label="缩放比例(%)">
              <InputNumber disabled={setting.pagesize === 'pageautofit'} min={1} max={10000} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="autofitwidth" label="自动适应列宽" valuePropName="checked">
              <Switch disabled={setting.pagesize === 'pageautofit'} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default SettingForm;
