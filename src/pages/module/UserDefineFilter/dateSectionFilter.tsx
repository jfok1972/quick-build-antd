import React from 'react';
import { Form, Input, DatePicker } from 'antd';
import { DateSectionQuickSelect } from './dateSectionQuickSelect';
import { DateFormat } from '../moduleUtils';
import type { UserFilterProps } from '.';

const { RangePicker } = DatePicker;

const rangeFormat = {
  year: 'YYYY年',
  month: 'YYYY年MM月',
  quarter: 'YYYY年Q季度',
  week: 'YYYY年w周',
  date: DateFormat,
  day: DateFormat,
};

const getDateSectionFilter = ({
  filterField,
  form,
  labelWarrapCol,
}: {
  filterField: any;
  form: any;
  labelWarrapCol: any;
}): any => {
  return (
    <Form.Item label={filterField.defaulttitle} {...labelWarrapCol}>
      <Input.Group compact style={{ display: 'flex' }}>
        <Form.Item name={[filterField.fieldname, 'operator']} noStyle>
          <Input style={{ display: 'none' }} />
        </Form.Item>
        <DateSectionQuickSelect form={form} fieldName={filterField.fieldname} autoHidden />
        <Form.Item noStyle name={[filterField.fieldname, 'value']}>
          <RangePicker
            allowEmpty={[true, true]}
            picker="date"
            style={{ flex: 1 }}
            format={rangeFormat.day}
          />
        </Form.Item>
      </Input.Group>
    </Form.Item>
  );
};

const getSectionFilter = ({
  filterField,
  labelWarrapCol,
}: {
  filterField: any;
  labelWarrapCol: any;
}): any => {
  const picker = filterField.operator;
  return (
    <Form.Item label={filterField.defaulttitle} {...labelWarrapCol}>
      <Input.Group compact style={{ display: 'flex' }}>
        <Form.Item name={[filterField.fieldname, 'operator']} noStyle>
          <Input style={{ display: 'none' }} />
        </Form.Item>
        <Form.Item noStyle name={[filterField.fieldname, 'value']}>
          <RangePicker
            allowEmpty={[true, true]}
            picker={picker}
            style={{ flex: 1 }}
            format={rangeFormat[picker]}
          />
        </Form.Item>
      </Input.Group>
    </Form.Item>
  );
};

/**
 * 可以在filterField中指定 operator 'all|year|monthquarter|day' ,operator1 'select|section|relative'
 * @param filterField
 * @param initValues
 * @param form
 * @param labelWarrapCol
 */
export const getDateFilter: React.FC<UserFilterProps> = ({ filterField, form, labelWarrapCol }) => {
  if (!filterField.operator || filterField.operator === 'date' || filterField.operator === 'day') {
    return getDateSectionFilter({ filterField, form, labelWarrapCol });
  }
  return getSectionFilter({ filterField, labelWarrapCol });
};
