/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Checkbox, Col, Form, Input, InputNumber, Row, Select, Typography } from 'antd';
import { deleteObjectPropertys } from '@/utils/utils';
import { JsonField } from '../form/field/JsonField';

interface Prpos {
  moduleName: string;
  init: any;
  ref: any;
}

export const FilterUserFieldDesignForm: React.FC<Prpos> = forwardRef(({ init }, ref) => {
  const [form] = Form.useForm();
  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(deleteObjectPropertys({ init }));
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
          <Form.Item label="显示内容" name="udftitle">
            <Input placeholder="如果为默认显示内容，请不要修改此字段。" />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item label="xtype类型" name="xtype">
            <Select
              options={[
                { label: 'container', value: 'container' },
                { label: 'fieldset', value: 'fieldset' },
                { label: 'panel', value: 'panel' },
                { label: '多对一树形下拉框', value: 'usermanytoonetreefilter' },
              ]}
            />
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item label="行数" name="rows">
            <InputNumber />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="列数" name="cols">
            <InputNumber />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="合并行数" name="rowspan">
            <InputNumber />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="合并列数" name="colspan">
            <InputNumber />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="各列宽度" name="widths">
            <Input placeholder="如：150,50%,150,25%,25%" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="筛选类型" name="filtertype">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="比较符" name="operator">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="隐藏比较符" name="hiddenoperator" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item label="附加设置" name="othersetting">
            {/* <Input.TextArea
              autoSize={{ maxRows: 10 }}
              placeholder="附加设置格式: 属性 : 值, 属性 : 值"
            /> */}
            <JsonField jsonFieldProps={{ height: '180px' }} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item label="备注" name="remark">
            <Input.TextArea />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Typography>
            <Typography.Title level={5}>附加设置属性说明：</Typography.Title>
            <Typography.Paragraph>
              <ul>
                <li>
                  allowEmpty : boolean 允许为空值(默认为false)：boolean类型，manytoone, dictionary
                  都会加入 未定义值
                </li>
                <li>addCount : boolean 不加入boolean,manytoone,dictionary的记录数(默认为true)</li>
              </ul>
            </Typography.Paragraph>
          </Typography>
        </Col>
      </Row>
    </Form>
  );
});
