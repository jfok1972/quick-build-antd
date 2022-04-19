/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { useEffect } from 'react';
import type { Dispatch } from 'redux';
import { Form, Input, DatePicker, Card, Button } from 'antd';
import type { ModuleState } from '../data';
import { DateSectionQuickSelect } from '../UserDefineFilter/dateSectionQuickSelect';

const { RangePicker } = DatePicker;

const StartEndDateSectionSelect = ({
  moduleState,
  dispatch,
  inPagination,
}: {
  moduleState: ModuleState;
  dispatch: Dispatch;
  inPagination?: boolean;
}) => {
  // 查询时的条件： sqlparamstr: {"startDate":"2020-01-01","endDate":"2020-12-31"}
  const { moduleName } = moduleState;
  const { sqlparam: sqlpar } = moduleState.filters;
  const [form] = Form.useForm();
  useEffect(() => {
    setTimeout(() => {
      form.setFieldsValue({
        startEndDate: [sqlpar.startDate.value, sqlpar.endDate.value],
      });
    }, 0);
  }, [sqlpar]);

  const callback = (value: any[]) => {
    form.setFieldsValue({ startEndDate: value });
  };
  const onSearch = () => {
    const sqlparam = { ...moduleState.filters.sqlparam };
    const [s, e] = form.getFieldValue('startEndDate');
    sqlparam.startDate.value = s;
    sqlparam.endDate.value = e;
    dispatch({
      type: 'modules/filterChanged',
      payload: {
        type: 'sqlparamChange',
        moduleName,
        sqlparam,
      },
    });
  };
  const onReset = () => {
    const sqlparam = { ...moduleState.filters.sqlparam };
    sqlparam.startDate.value = null;
    sqlparam.endDate.value = null;
    dispatch({
      type: 'modules/filterChanged',
      payload: {
        type: 'sqlparamChange',
        moduleName,
        sqlparam,
      },
    });
  };
  const selectForm = (
    <Form
      form={form}
      size={
        moduleState.currSetting.gridSize === 'default' ? 'middle' : moduleState.currSetting.gridSize
      }
    >
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
  return inPagination ? (
    selectForm
  ) : (
    <Card
      bodyStyle={{
        paddingTop: '24px',
        paddingBottom: '0px',
        marginLeft: '16px',
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

export default StartEndDateSectionSelect;
