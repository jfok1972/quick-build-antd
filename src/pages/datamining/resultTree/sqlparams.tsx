/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { useEffect } from 'react';
import { Form, Input, DatePicker, Card, Button } from 'antd';
import { isMoment } from 'moment';
import { DateSectionQuickSelect } from '@/pages/module/UserDefineFilter/dateSectionQuickSelect';
import type { DataminingModal } from '../data';
import { ACT_SQLPARAM_CHANGE } from '../constants';

const { RangePicker } = DatePicker;

const StartEndDateSectionSelect = ({
  state,
  dispatch,
}: {
  state: DataminingModal;
  dispatch: Function;
}) => {
  // 查询时的条件：  sqlparamstr: {"startDate":"2020-01-01","endDate":"2020-12-31"}
  const { sqlparam } = state.filters;
  const [form] = Form.useForm();
  useEffect(() => {
    setTimeout(() => {
      form.setFieldsValue({
        startEndDate: [sqlparam.startDate.value, sqlparam.endDate.value],
      });
    }, 0);
  }, [sqlparam]);

  const callback = (value: any[]) => {
    form.setFieldsValue({ startEndDate: value });
  };
  const onSearch = () => {
    const sqlparameters = { ...state.filters.sqlparam };
    const [s, e] = form.getFieldValue('startEndDate') as any[];
    sqlparameters.startDate.value = s;
    sqlparameters.endDate.value = e;
    dispatch({
      type: ACT_SQLPARAM_CHANGE,
      payload: {
        sqlparam: sqlparameters,
      },
    });
  };
  const onReset = () => {
    const sqlparameters = { ...state.filters.sqlparam };
    sqlparameters.startDate.value = null;
    sqlparameters.endDate.value = null;
    dispatch({
      type: ACT_SQLPARAM_CHANGE,
      payload: {
        sqlparam: sqlparameters,
      },
    });
  };
  const selectForm = (
    <Form form={form} size="middle">
      <Form.Item
        label="起止日期"
        style={{
          padding: 0,
          margin: 0,
        }}
      >
        <Input.Group compact style={{ display: 'flex' }}>
          <DateSectionQuickSelect callback={callback} />
          <Form.Item noStyle name={['startEndDate']}>
            <RangePicker
              allowEmpty={[false, false]}
              picker="date"
              style={{ flex: 1 }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Button type="primary" onClick={onSearch}>
            查询
          </Button>
          <Button onClick={onReset}>重置</Button>
        </Input.Group>
      </Form.Item>
    </Form>
  );
  return (
    <Card
      bodyStyle={{
        padding: '16px 32px',
        marginBottom: '16px',
      }}
      bordered={false}
    >
      <div style={{ display: 'flex' }}>
        {selectForm}
        <span style={{ flex: 1 }} />
      </div>
    </Card>
  );
};

export const getSqlparamExportStr = (sqlparam: any): any[] => {
  const result: any[] = [];
  if (sqlparam)
    Object.keys(sqlparam).forEach((key) => {
      const { value } = sqlparam[key];
      if (value !== null) {
        result.push({
          source: '查询参数',
          fieldtitle: sqlparam[key].title,
          operator: sqlparam[key].operator,
          displaycond: isMoment(value) ? value.format('YYYY-MM-DD') : value,
        });
      }
    });
  return result;
};

export default StartEndDateSectionSelect;
