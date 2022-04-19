/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import {
  Form,
  Switch,
  Row,
  Col,
  Radio,
  InputNumber,
  Card,
  Divider,
  Button,
  Popover,
  Space,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { DataminingModal } from '../data';
import { ACT_DATAMINING_EXPORT_SETTING_CHANGE } from '../constants';
import { exportExcelOrPdf } from '../utils';

const SettingForm = ({ state, dispatch }: { state: DataminingModal; dispatch: Function }) => {
  const [form] = Form.useForm();
  const { exportSetting } = state;
  const style: React.CSSProperties = {
    padding: 0,
    margin: 4,
  };
  return (
    <Card
      title="数据分析列表导出设置"
      size="small"
      bodyStyle={{ padding: 0, margin: 0 }}
      extra={
        <Space>
          <Button
            type="primary"
            onClick={() => {
              exportExcelOrPdf(state, false);
            }}
          >
            导出至Excel文档
          </Button>
          <Button
            onClick={() => {
              exportExcelOrPdf(state, true);
            }}
          >
            导出至PDF文档
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        autoComplete="off"
        labelCol={{ flex: '1 1 120px' }}
        style={{ width: '480px', padding: '4px', margin: 0 }}
        initialValues={exportSetting}
        onValuesChange={() => {
          dispatch({
            type: ACT_DATAMINING_EXPORT_SETTING_CHANGE,
            payload: {
              exportSetting: form.getFieldsValue(),
            },
          });
        }}
      >
        <Row gutter={0}>
          <Col span={12}>
            <Form.Item
              name="unittextalone"
              label="计量单位单独一行"
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
            <Form.Item
              name="disablecollapsed"
              label="不包括折叠行"
              valuePropName="checked"
              style={style}
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="disablerowgroup"
              label="不加入行组合"
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
              style={style}
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
            <Form.Item name="scale" label="缩放比例(%)" style={style}>
              <InputNumber
                disabled={exportSetting.pagesize === 'pageautofit'}
                min={1}
                max={10000}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="autofitwidth"
              label="自动适应列宽"
              valuePropName="checked"
              style={style}
            >
              <Switch disabled={exportSetting.pagesize === 'pageautofit'} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export const DownLoadButton = ({
  state,
  dispatch,
}: {
  state: DataminingModal;
  dispatch: Function;
}) => {
  return (
    <Popover
      content={<SettingForm state={state} dispatch={dispatch} />}
      style={{ padding: 0, margin: 0 }}
      placement="bottomRight"
    >
      <Button type="text" size="small">
        <DownloadOutlined />
        导出
      </Button>
    </Popover>
  );
};

export default SettingForm;
