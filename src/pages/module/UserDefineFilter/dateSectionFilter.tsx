/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { Form, Input, DatePicker } from 'antd';
import moment from 'moment';
import { DateSectionQuickSelect } from './dateSectionQuickSelect';
import { DateFormat } from '../moduleUtils';
import type { UserFilterProps } from '.';
import styles from './index.less';

const { RangePicker } = DatePicker;

const rangeFormat = {
  year: 'YYYY年',
  month: 'YYYY年MM月',
  quarter: 'YYYY年Q季度',
  week: 'YYYY年w周',
  date: DateFormat,
  day: DateFormat,
};

const ranges: any = {
  今天: [moment(), moment()],
  本周: [moment().startOf('week'), moment().endOf('week')],
  本月: [moment().startOf('month'), moment().endOf('month')],
  本季: [moment().startOf('quarter'), moment().endOf('quarter')],
  本年: [moment().startOf('year'), moment().endOf('year')],

  昨天: [moment().add(-1, 'day'), moment().add(-1, 'day')],
  上周: [moment().add(-1, 'week').startOf('week'), moment().add(-1, 'week').endOf('week')],
  上月: [moment().add(-1, 'month').startOf('month'), moment().add(-1, 'month').endOf('month')],
  上季: [
    moment().add(-1, 'quarter').startOf('quarter'),
    moment().add(-1, 'quarter').endOf('quarter'),
  ],
  去年: [moment().add(-1, 'year').startOf('year'), moment().add(-1, 'year').endOf('year')],

  // '前天': [moment().add(-2, 'day'), moment().add(-2, 'day')],
  // '前周': [moment().add(-2, 'week').startOf('week'), moment().add(-2, 'week').endOf('week')],
  // '前月': [moment().add(-2, 'month').startOf('month'), moment().add(-2, 'month').endOf('month')],
  // '前季': [moment().add(-2, 'quarter').startOf('quarter'), moment().add(-2, 'quarter').endOf('quarter')],
  // '前年': [moment().add(-2, 'year').startOf('year'), moment().add(-2, 'year').endOf('year')],

  过去一周内: [moment().add(-1, 'week'), moment().add(-1, 'day')],
  过去一月内: [moment().add(-1, 'month'), moment().add(-1, 'day')],
  过去一年内: [moment().add(-1, 'year'), moment().add(-1, 'day')],
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
  const title = filterField.title || filterField.defaulttitle;
  return (
    <Form.Item label={title} {...labelWarrapCol}>
      <Input.Group compact style={{ display: 'flex' }}>
        <Form.Item name={[filterField.fieldname, 'operator']} noStyle>
          <Input style={{ display: 'none' }} />
        </Form.Item>
        <Form.Item noStyle name={[filterField.fieldname, 'value']}>
          <RangePicker
            dropdownClassName={styles.daterangepicker}
            allowEmpty={[true, true]}
            picker={picker}
            style={{ flex: 1 }}
            format={rangeFormat[picker]}
            ranges={ranges}
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
  if (
    (!filterField.operator || filterField.operator === 'date' || filterField.operator === 'day') &&
    filterField.sectionButton
  ) {
    //  设置了sectionButton，才使用下面这个
    return getDateSectionFilter({ filterField, form, labelWarrapCol });
  }
  return getSectionFilter({ filterField, labelWarrapCol });
};
