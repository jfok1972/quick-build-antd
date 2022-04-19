/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { AutoComplete, Checkbox, Col, Form, Input, InputNumber, message, Row, Select } from 'antd';
import { getDictionary } from '../dictionary/dictionarys';
import { CloseOutlined } from '@ant-design/icons';
import { SelectChildModule } from './SelectChildModule';
import { deleteObjectPropertys } from '@/utils/utils';
import { JsonField } from '../form/field/JsonField';

const xtypeOptions = [
  {
    value: 'fieldset',
  },
  {
    value: 'panel',
  },
  {
    value: 'tabpanel',
  },
  {
    value: 'fieldcontainer',
  },
  {
    value: 'container',
  },
  {
    value: 'approvepanel', // 当前用户审批的界面
  },
  {
    value: 'approvehistory', // 显示历史审批的界面
  },
  {
    value: 'approvediagram', // 当前审批流程图，当前审批环节加亮
  },
];

interface Prpos {
  moduleName: string;
  init: any;
  ref: any;
}

export const FormFieldDesignForm: React.FC<Prpos> = forwardRef(({ init, moduleName }, ref) => {
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
        <Col span={12}>
          <Form.Item label="显示内容" name="udftitle">
            <Input placeholder="如果为默认显示内容，请不要修改此字段。" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="xtype类型" name="xtype">
            <AutoComplete options={xtypeOptions} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="容器layout" name="layout">
            <Select allowClear>
              {getDictionary('990026').data.map(({ value, text }) => (
                <Select.Option key={`key-${value}`} value={value || ''}>
                  {text}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="布局位置" name="region">
            <Select allowClear>
              {getDictionary('990024').data.map(({ value, text }) => (
                <Select.Option key={`key-${value}`} value={value || ''}>
                  {text}
                </Select.Option>
              ))}
            </Select>
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
        <Col span={12}>
          <Form.Item label="各列宽度" name="widths">
            <Input placeholder="如：150,50%,150,25%,25%" />
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
        <Col span={6}>
          <Form.Item label="宽度" name="width">
            <InputNumber />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="高度" name="height">
            <InputNumber />
          </Form.Item>
        </Col>

        <Col span={5}>
          <Form.Item label="可折叠" name="collapsible" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item label="默认折叠" name="collapsed" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Col>

        <Col span={5}>
          <Form.Item label="分离label" name="separatelabel" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item label="隐藏label" name="hiddenlabel" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label="显示字段tip" name="showdetailtip" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item label="关联子模块" name="fieldahead">
            <Input
              readOnly
              addonAfter={
                <CloseOutlined
                  onClick={() => {
                    form.setFieldsValue({
                      subdataobjecttitle: undefined,
                      fieldahead: undefined,
                    });
                  }}
                />
              }
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item label="关联子模块" name="subdataobjecttitle">
            <Input
              readOnly
              addonAfter={
                <SelectChildModule
                  moduleName={moduleName}
                  title="选择子模块"
                  defaultFieldahead={init.fieldahead}
                  callback={(node: any) => {
                    if (node.itemId && node.itemId.indexOf('.with.') !== -1) {
                      form.setFieldsValue({
                        subdataobjecttitle: node.qtip,
                        fieldahead: node.itemId,
                      });
                    } else {
                      message.warn('请选择当前模块的子模块！');
                    }
                  }}
                />
              }
            />
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
      </Row>
    </Form>
  );
});
