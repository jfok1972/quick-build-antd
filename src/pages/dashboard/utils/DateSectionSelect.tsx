/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { DateFormat } from '@/pages/module/moduleUtils';
import { DateSectionQuickSelect } from '@/pages/module/UserDefineFilter/dateSectionQuickSelect';
import { DatePicker, Form, Input } from 'antd';

const { RangePicker } = DatePicker;

export interface DateSectionSelectProps {
  dateSection: any;
  setDateSection: Function;
  label?: string;
}
/**
 * 一个可以接收日期区间和设置日期区间的控件
 * @param param0
 */
export const DateSectionSelect: React.FC<DateSectionSelectProps> = ({
  dateSection,
  setDateSection,
  label = '日期区间',
}) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="inline" size="middle">
      <Form.Item label={label}>
        <Input.Group compact style={{ display: 'flex' }}>
          <DateSectionQuickSelect
            autoHidden
            callback={(value: any) => {
              setDateSection(value);
            }}
          />
          <Form.Item noStyle>
            <RangePicker
              value={dateSection}
              onChange={(values) => {
                setDateSection(values || [null, null]);
              }}
              allowEmpty={[true, true]}
              picker="date"
              style={{ flex: 1 }}
              format={DateFormat}
            />
          </Form.Item>
        </Input.Group>
      </Form.Item>
    </Form>
  );
};
