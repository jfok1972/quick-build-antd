/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Checkbox, Col, Form, Input, InputNumber, Row } from 'antd';
import { deleteObjectPropertys } from '@/utils/utils';
import { JsonField } from '../form/field/JsonField';

interface Prpos {
  moduleName: string;
  init: any;
  ref: any;
}

export const GridFieldDesignForm: React.FC<Prpos> = forwardRef(({ init }, ref) => {
  const [form] = Form.useForm();
  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(deleteObjectPropertys({ ...init }));
  }, [init]);

  useImperativeHandle(ref, () => ({
    getValues: (): any => {
      return form.getFieldsValue();
    },
  }));

  return (
    <Form
      className="moduleform"
      form={form}
      size="middle"
      autoComplete="off"
      labelCol={{ flex: '0 0 90px' }}
    >
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="显示内容" name="tf_title">
            <Input placeholder="如果为默认显示内容，请不要修改此字段。" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="列锁定" name="tf_locked" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="隐藏列" name="tf_hidden" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="显示字段tip" name="tf_showdetailtip" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="列宽" name="tf_width">
            <InputNumber />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="最小列宽" name="tf_minwidth">
            <InputNumber />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="最大列宽" name="tf_maxwidth">
            <InputNumber />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="列flex" name="tf_flex">
            <InputNumber />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="列宽自动调整次数" name="tf_autosizetimes">
            <InputNumber />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item label="附加设置" name="tf_otherSetting">
            {/* <Input.TextArea
              autoSize={{ maxRows: 10 }}
              placeholder="附加设置格式: 属性 : 值, 属性 : 值"
            /> */}
            <JsonField jsonFieldProps={{ height: '180px' }} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
});
