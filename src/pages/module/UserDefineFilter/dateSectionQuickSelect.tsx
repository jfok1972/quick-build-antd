/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { useState } from 'react';
import { Button, Popover, Space } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import moment from 'moment';
import type { FormInstance } from 'antd/es/form';

const allSections: any[] = [
  [
    { text: '前年', prop: 'year', add: -2 },
    { text: '去年', prop: 'year', add: -1 },
    { text: '今年', prop: 'year', add: 0 },
    { text: '明年', prop: 'year', add: 1 },
    { text: '后年', prop: 'year', add: 2 },
  ],
  [
    { text: '前月', prop: 'month', add: -2 },
    { text: '上月', prop: 'month', add: -1 },
    { text: '本月', prop: 'month', add: 0 },
    { text: '次月', prop: 'month', add: 1 },
    { text: '隔月', prop: 'month', add: 2 },
  ],
  [
    { text: '前周', prop: 'week', add: -2 },
    { text: '上周', prop: 'week', add: -1 },
    { text: '本周', prop: 'week', add: 0 },
    { text: '下周', prop: 'week', add: 1 },
    { text: '隔周', prop: 'week', add: 2 },
  ],
  [
    { text: '前天', prop: 'day', add: -2 },
    { text: '昨天', prop: 'day', add: -1 },
    { text: '今天', prop: 'day', add: 0 },
    { text: '明天', prop: 'day', add: 1 },
    { text: '后天', prop: 'day', add: 2 },
  ],
  [
    { text: '前季', prop: 'quarter', add: -2 },
    { text: '上季', prop: 'quarter', add: -1 },
    { text: '本季', prop: 'quarter', add: 0 },
    { text: '次季', prop: 'quarter', add: 1 },
    { text: '隔季', prop: 'quarter', add: 2 },
  ],
  [
    { text: '一年之内', prop: 'year', before: true },
    { text: '一月之内', prop: 'month', before: true },
    { text: '一周之内', prop: 'week', before: true },
  ],
];

/**
 * form,fieldName 用于自定义筛选，callback用于table中的日期字段的筛选
 * @param param0
 */
export const DateSectionQuickSelect = ({
  form,
  fieldName,
  callback,
  autoHidden,
}: {
  form?: FormInstance<any>;
  fieldName?: string;
  callback?: Function;
  autoHidden?: boolean;
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const onButtonClick = (section: any) => {
    const name: any = [fieldName, 'value'];
    if (!section.before) {
      const startDate = moment().add(section.add, section.prop).startOf(section.prop);
      const endDate = moment().add(section.add, section.prop).endOf(section.prop);
      const value = [startDate, endDate];
      if (form) {
        form.setFields([
          {
            name,
            value,
          },
        ]);
      } else if (callback) callback(value);
    } else {
      const value = [moment().add(-1, section.prop), moment().add(-1, 'day')];
      if (form) {
        form.setFields([
          {
            name,
            value,
          },
        ]);
      } else if (callback) callback(value);
    }
    if (autoHidden) setVisible(false);
  };
  const getButtons = () => {
    let key = 1;
    return (
      <Space direction="vertical" size="small" key="space_1">
        {allSections.map((sections: any[]) => {
          key += 1;
          return (
            <Space size="small" key={`space-${key.toString()}`}>
              {sections.map((section: any) => (
                <Button
                  key={`button-${key.toString()}`}
                  onClick={() => onButtonClick(section)}
                  type={section.add !== 0 ? 'text' : 'link'}
                >
                  {section.text}
                </Button>
              ))}
            </Space>
          );
        })}
      </Space>
    );
  };
  const props: any = {};
  if (autoHidden) {
    props.visible = visible;
    props.onVisibleChange = (v: boolean) => setVisible(v);
  }
  return (
    <Popover title="日期区间快速设置" content={getButtons()} {...props}>
      <Button style={{ paddingLeft: '6px', paddingRight: '6px' }}>
        <LinkOutlined />
      </Button>
    </Popover>
  );
};
