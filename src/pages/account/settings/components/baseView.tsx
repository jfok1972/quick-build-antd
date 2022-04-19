/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { useEffect, useState } from 'react';
import type { Dispatch } from 'redux';
import { Button, Card, Col, Form, Input, message, Row, Select, Modal, Typography } from 'antd';
import { apply, applyIf } from '@/utils/utils';
import request, { API_HEAD } from '@/utils/request';
import ImageField from '@/pages/module/form/field/ImageField';
import { serialize } from 'object-to-formdata';
import PhoneView from './PhoneView';

const { Text } = Typography;

const province: any[] = require('../geographic/province.json');
const city: object = require('../geographic/city.json');

export const getProvinceText = (id: string) => {
  if (!id) return null;
  return province.find((value) => value.id === id).name;
};

export const getCityText = (id: string) => {
  if (!id) return null;
  return city[`${id.substr(0, 2)}0000`].find((value: any) => value.id === id).name;
};

const BaseView = ({ personnel, dispatch }: { personnel: any; dispatch: Dispatch }) => {
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [form] = Form.useForm();

  const onProvinceSelected = (value: string) => {
    const citys = city[value as string];
    if (citys)
      setCityOptions(city[value as string].map((rec: any) => ({ label: rec.name, value: rec.id })));
    else setCityOptions([]);
    form.setFieldsValue(apply(form.getFieldsValue(), { city: undefined }));
  };

  const onSavingSetting = () => {
    setSaving(true);
    form.validateFields().then((fieldValues) => {
      const values = { ...fieldValues };
      Object.keys(values).forEach((key) => {
        if (values[key] === '') values[key] = undefined;
        if (personnel[key] === values[key]) {
          delete values[key];
        }
      });
      Object.keys(values).forEach((key) => {
        if (values[key] === undefined) values[key] = null;
      });
      request(`${API_HEAD}/platform/systemframe/savepersonnelinfo.do`, {
        method: 'POST',
        data: serialize({ data: JSON.stringify(values) }),
      })
        .then((response) => {
          if (response.success) {
            message.success('我的基本信息已更新');
            dispatch({
              type: 'accountCenter/fetchCurrent',
            });
          } else {
            Modal.error({
              width: 500,
              title: '更新基本信息错误',
              content: `错误原因：${response.msg}`,
            });
          }
        })
        .finally(() => {
          setSaving(false);
        });
    });
  };

  useEffect(() => {
    if (personnel) {
      applyIf(personnel, { country: 'china' });
      if (personnel.province) onProvinceSelected(personnel.province);
      form.setFieldsValue(personnel);
    }
  }, [personnel]);
  return (
    <Card title="基本设置" bordered={false}>
      <Form layout="vertical" form={form}>
        <Row gutter={96}>
          <Col flex="500px">
            <Form.Item
              label={
                <>
                  手机号码
                  <Text style={{ marginLeft: '24px' }} type="secondary">
                    (非常重要，用于手机登录和接受短消息)
                  </Text>
                </>
              }
              name="mobile"
            >
              <Input />
            </Form.Item>
            <Form.Item label="联系电话" name="officetel">
              <PhoneView />
            </Form.Item>
            <Form.Item label="邮箱" name="email">
              <Input />
            </Form.Item>
            <Form.Item label="个人简介" name="profile">
              <Input.TextArea rows={4} placeholder="个人简介" />
            </Form.Item>

            <Form.Item label="国家/地区" name="country">
              <Select>
                <Select.Option value="china">中国</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item noStyle>
              <Form.Item
                name="province"
                label="所在省市"
                style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  onSelect={(value: any) => onProvinceSelected(value as string)}
                  options={province.map((v: any) => ({ label: v.name, value: v.id }))}
                />
              </Form.Item>
              <Form.Item
                name="city"
                label=" "
                style={{ display: 'inline-block', width: 'calc(50% - 8px)', margin: '0 8px' }}
              >
                <Select showSearch optionFilterProp="label" options={cityOptions} />
              </Form.Item>
            </Form.Item>
            <Form.Item label="街道地址" name="street">
              <Input />
            </Form.Item>
          </Col>
          <Col flex="auto">
            <Form.Item label="头像" name="avatar" style={{ width: '136px', marginLeft: '50px' }}>
              <ImageField imageHeight={128} imageWidth={128} imageStyle={{ borderRadius: '50%' }} />
            </Form.Item>
            <Form.Item label="个人照片" name="photo" style={{ width: '136px' }}>
              <ImageField
                imageHeight={350}
                imageWidth={250}
                imageStyle={{ borderRadius: '10px' }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Button type="primary" loading={saving} onClick={onSavingSetting}>
            更新基本信息
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default BaseView;
