/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useState } from 'react';
import type { ColumnConfig, DualAxesConfig, PieConfig } from '@ant-design/charts';
import { Column, DualAxes, Pie } from '@ant-design/charts';
import request, { API_HEAD } from '@/utils/request';
import { Card, Col, Form, Row, Select, Switch } from 'antd';
import type { CardProps } from 'antd/lib/card';
import { serialize } from 'object-to-formdata';
import { getColumnsDataIndex } from '@/pages/datamining/utils';
import { stringifyObjectField } from '@/utils/utils';
import FOrganizationTreeSelect from './components/OrganizationTreeSelect';
import DataTable from './components/DataTable';
import ToggleTableChartButton from './components/ToggleTableChartButton';
import { chartsColSpan } from '..';

const numeral = require('numeral');

const columnStyle = {
  fillOpacity: 0.5,
  strokeOpacity: 0.7,
  shadowColor: 'black',
  shadowBlur: 10,
  shadowOffsetX: 5,
  shadowOffsetY: 5,
  cursor: 'pointer',
};

const cardParams: CardProps = {
  size: 'default',
  bodyStyle: { height: '360px', paddingTop: 12, paddingBottom: 12 },
};

// 合同结算金额、可支付计划金额、已支付金额、
const PmAgreementGlobal: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);
  const [unitText, setUnitText] = useState<'万' | '亿'>('万');
  const [payoutPercent, setPayoutPercent] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const asyncFetch = (orgid: string | null, containFinished: boolean) => {
    const fields = [
      'count.agreementId',
      'sum.amount',
      'sum.planCanpaymentAmount',
      'sum.paymentDetailAmount',
      'wavg.paymentDetailPercent',
    ];
    const [COUNT, AMOUNT, CANPAYMENT, DETAILAMOUNT, PAYOUTPERCENT] = getColumnsDataIndex(fields);
    // 已完成和已存在档的合同90,99
    const filters: any[] = [];
    if (!containFinished)
      filters.push({
        property_: {
          moduleName: 'PmAgreement',
          fieldahead: 'pmAgreementState',
        },
        operator: '<',
        value: '90',
      });
    if (orgid)
      filters.push({
        property_: {
          moduleName: 'PmAgreement',
          fieldahead: 'pmProject.pmGlobal.FOrganization',
        },
        operator: 'startwith',
        value: orgid,
      });
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName: 'PmAgreement',
          fields,
          navigatefilters: filters.length ? filters : null,
        }),
      ),
    }).then((response) => {
      if (response[0]) {
        const obj = response[0];
        let unitdiv = 10000;
        // 大于10亿，改用亿为单位
        if (obj[AMOUNT] > 10000 * 10000 * 10) {
          setUnitText('亿');
          unitdiv = 10000 * 10000;
        } else {
          setUnitText('万');
          unitdiv = 10000;
        }
        setCount(obj[COUNT] || 0);
        setPayoutPercent(obj[PAYOUTPERCENT] || 0);
        setAmount((obj[AMOUNT] || 0) / unitdiv);
        setData(
          [
            { type: '合同结算金额', value: obj[AMOUNT] || 0, group: '1' },
            {
              type: '不可支付计划',
              value: obj[AMOUNT] - obj[CANPAYMENT] || 0,
              group: '2',
            },
            { type: '可支付计划', value: obj[CANPAYMENT] || 0, group: '2' },
            {
              type: '不可请款金额',
              value: obj[AMOUNT] - obj[CANPAYMENT] || 0,
              group: '3',
            },
            {
              type: '可请款金额',
              value: obj[CANPAYMENT] - obj[DETAILAMOUNT] || 0,
              group: '3',
            },
            { type: '已支付金额', value: obj[DETAILAMOUNT] || 0, group: '3' },
          ].map((rec) => ({
            ...rec,
            value: parseFloat(numeral(rec.value / unitdiv).format('0.00')),
          })),
        );
      }
      setLoading(false);
    });
  };
  const refreshData = () => {
    const values = form.getFieldsValue();
    asyncFetch(values.orgid, values.containerFinished);
  };
  const config: ColumnConfig = {
    data,
    loading,
    columnWidthRatio: 0.7,
    isStack: true,
    xField: 'group',
    yField: 'value',
    seriesField: 'type',
    columnStyle,
    meta: {
      group: {
        alias: '类别',
        formatter: () => null,
      },
      value: {
        alias: '金额',
        formatter: (value: number) => {
          return numeral(value).format('0,0') + unitText;
        },
      },
    },
    tooltip: {
      title: `项目合同: ${count} 个`,
      formatter: (datum) => {
        return { name: datum.type, value: numeral(datum.value).format('0,0.00') + unitText };
      },
    },
    label: {
      position: 'middle',
      layout: [{ type: 'interval-adjust-position' }, { type: 'adjust-color' }],
      formatter: (datum) => {
        if (!amount || !datum.value || datum.value <= 0 || datum.value / amount < 0.08) return '';
        const result = `${datum.type}\n${numeral(datum.value).format('0,0.00')}${unitText}`;
        if (datum.type === '已支付金额')
          return `${result}\n( ${numeral(payoutPercent).format('0.00%')} )`;
        return result;
      },
    },
  };
  useEffect(() => {
    setTimeout(() => {
      asyncFetch(null, false);
    }, 0);
  }, []);
  return (
    <Card
      title={
        <React.Fragment>
          项目合同金额分析图
          <ToggleTableChartButton showGrid={showGrid} setShowGrid={setShowGrid} />
        </React.Fragment>
      }
      {...cardParams}
      extra={
        <Form form={form} layout="inline" style={{ width: '400px', display: 'flex' }}>
          <span style={{ flex: 1 }}>
            <FOrganizationTreeSelect
              callback={() => {
                refreshData();
              }}
            />
          </span>
          <Form.Item name="containerFinished" valuePropName="checked">
            <Switch
              checkedChildren="含已完成合同"
              unCheckedChildren="不含已完成合同"
              defaultChecked={false}
              onChange={() => {
                refreshData();
              }}
            />
          </Form.Item>
        </Form>
      }
    >
      {showGrid ? <DataTable data={data} unitText={unitText} /> : <Column {...config} />}
    </Card>
  );
};

const PmAgreementCountPie: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<any[]>([]);
  const [unitText, setUnitText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [selectTarget, setselectTarget] = useState<any>({});
  const fields = ['count.agreementId', 'sum.singAmount', 'sum.amount'];
  const [COUNT, SINGAMOUNT, AMOUNT] = getColumnsDataIndex(fields);
  const indextypes = [
    {
      label: '合同个数',
      value: 'count',
      fieldname: COUNT,
      unitText: '个',
      unit: 1,
    },
    {
      label: '合同结算金额',
      value: 'amount',
      fieldname: AMOUNT,
      unitText: '万元',
      unit: 10000,
    },
    {
      label: '合同签订金额',
      value: 'signAmount',
      fieldname: SINGAMOUNT,
      unitText: '万元',
      unit: 10000,
    },
  ];

  const grouptypes = [
    {
      label: '合同签订年度',
      value: 'signyear',
      groupfieldid: {
        fieldname: 'singDate',
        function: 'yyyy年',
      },
      sortby: 'label',
    },
    {
      label: '合同签订金额',
      value: 'singAmount',
      groupfieldid: {
        fieldname: 'singAmount',
        function: '按数量级分组',
      },
      sortby: 'label',
    },
    {
      label: '管理部门',
      value: 'FOrganization',
      groupfieldid: {
        fieldahead: 'pmProject.pmGlobal.FOrganization',
        codelevel: '2',
      },
      sortby: 'value',
    },
    {
      label: '支付平台',
      value: 'pmPayorg',
      groupfieldid: {
        fieldahead: 'pmPayorg',
      },
      sortby: 'value',
    },
    {
      label: '成本类型',
      value: 'pmAgreementCostType',
      groupfieldid: {
        fieldahead: 'pmAgreementCostType',
      },
      sortby: 'value',
    },
    {
      label: '预算类型',
      value: 'pmAgreementBudgetType',
      groupfieldid: {
        fieldahead: 'pmAgreementBudgetType',
      },
      sortby: 'value',
    },
    {
      label: '工程类型',
      value: 'pmAgreementClassType',
      groupfieldid: {
        fieldahead: 'pmAgreementClassType',
      },
      sortby: 'value',
    },
    {
      label: '合同状态',
      value: 'pmAgreementState',
      groupfieldid: {
        fieldahead: 'pmAgreementState',
      },
      sortby: 'value',
    },
  ];
  const asyncFetch = () => {
    setLoading(true);
    const fieldsValue = form.getFieldsValue();
    const grouptype: any = grouptypes.find(
      (rec) => rec.value === (fieldsValue.grouptype || grouptypes[0].value),
    );
    const indextype: any = indextypes.find(
      (rec) => rec.value === (fieldsValue.indextype || indextypes[0].value),
    );
    setselectTarget({
      indextype,
      grouptype,
    });
    setUnitText(indextype.unitText);
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName: 'PmAgreement',
          fields,
          groupfieldid: grouptype?.groupfieldid,
        }),
      ),
    }).then((response) => {
      const datas = (response as any[])
        .map((rec) => ({
          type: rec.text,
          value: rec[indextype.fieldname] / indextype.unit,
        }))
        .sort((a, b) =>
          // eslint-disable-next-line
          grouptype?.sortby === 'label' ? (a.type > b.type ? -1 : 1) : b.value - a.value,
        );
      // 第10个后面全部加在一起
      if (datas.length > 10) {
        let othersum = 0;
        datas.forEach((rec, index) => {
          othersum += index >= 9 ? rec.value : 0;
        });
        datas.splice(9, 10000, { type: '其他小计', value: othersum });
      }
      setData(datas);
      setLoading(false);
    });
  };
  useEffect(() => {
    setTimeout(() => {
      asyncFetch();
    }, 200);
  }, []);
  const config: PieConfig = {
    appendPadding: 10,
    data,
    loading,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.64,
    label: {
      type: 'outer',
      formatter: (datum) => {
        return `${numeral(datum.value).format('0,0') + unitText}(${numeral(datum.percent).format(
          '0.00%',
        )})`;
      },
    },
    statistic: {
      title: {
        formatter: () => '总计',
        offsetY: -15,
      },
      content: {
        formatter: (value, datum) => {
          let sum = 0;
          if (datum)
            datum.forEach((rec) => {
              sum += rec.value;
            });
          return numeral(sum).format('0,0') + unitText;
        },
        offsetY: 15,
        style: {
          fontSize: '20px',
        },
      },
    },
    interactions: [{ type: 'element-active' }],
    legend: {
      layout: 'vertical',
      position: 'right',
      animate: true,
    },
    tooltip: {
      formatter: (datum) => {
        return { name: datum.type, value: numeral(datum.value).format('0,0') + unitText };
      },
    },
  };
  return (
    <Card
      title={
        <React.Fragment>
          项目合同分类分析图
          <ToggleTableChartButton showGrid={showGrid} setShowGrid={setShowGrid} />
        </React.Fragment>
      }
      {...cardParams}
      extra={
        <Form
          form={form}
          layout="inline"
          style={{ width: '400px' }}
          initialValues={{
            indextype: 'count',
            grouptype: 'signyear',
          }}
        >
          <Form.Item label="指标" name="indextype" style={{ flex: 1 }}>
            <Select options={indextypes} onChange={asyncFetch} />
          </Form.Item>
          <Form.Item label="分组" name="grouptype" style={{ flex: 1 }}>
            <Select options={grouptypes} onChange={asyncFetch} />
          </Form.Item>
        </Form>
      }
    >
      {showGrid ? (
        <DataTable
          data={data}
          unitText={unitText}
          typeTitle={selectTarget.grouptype.label}
          valueTitle={selectTarget.indextype.label}
        />
      ) : (
        <Pie {...config} />
      )}
    </Card>
  );
};

const PmAgreementSignYearMonthColumn: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any[]>([]);
  const fields = ['count.agreementId', 'sum.singAmount'];
  const [COUNT, SUMAMOUNT] = getColumnsDataIndex(fields);
  const asyncFetch = () => {
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName: 'PmAgreement',
          fields,
          groupfieldid: {
            fieldname: 'singDate',
            function: 'yyyy年mm月',
          },
        }),
      ),
    }).then((response) => {
      setData(
        (response as any[])
          .map((rec) => ({
            type: rec.text ? rec.text.substr(2) : rec.text,
            value: parseInt(numeral(rec[SUMAMOUNT] / 10000).format('0'), 10),
            count: rec[COUNT],
          }))
          .sort((a, b) => (a.type > b.type ? 1 : -1))
          .filter((_, index, array) => array.length - index <= 12),
      ); // 一年内，取最后12个
      setLoading(false);
    });
  };
  const config: DualAxesConfig = {
    loading,
    data: [data, data],
    xField: 'type',
    yField: ['value', 'count'],
    xAxis: { label: { autoRotate: false } },
    slider: {
      start: data.length > 13 ? 1 - 12 / data.length : 0,
      end: 1,
    },
    label: {
      position: 'top',
      formatter: (datum) => {
        return `${numeral(datum.value).format('0,0')}万元`;
      },
    },
    meta: {
      count: {
        alias: '合同个数',
        formatter: (value: number) => {
          return `${value}个`;
        },
      },
      value: {
        alias: '合同签订金额',
        formatter: (value: number) => {
          return `${numeral(value).format('0,0')}万元`;
        },
      },
    },
    geometryOptions: [
      {
        geometry: 'column',
        columnStyle,
        label: {
          position: 'top',
          formatter: (datum) => {
            return `${numeral(datum.value).format('0,0')}万元`;
          },
        },
      },
      {
        geometry: 'line',
        lineStyle: {
          lineWidth: 2,
        },
      },
    ],
  };
  useEffect(() => {
    setTimeout(() => {
      asyncFetch();
    }, 400);
  }, []);
  return <DualAxes {...config} />;
};

export default () => {
  const result = (
    <Row gutter={[12, 12]}>
      <Col {...chartsColSpan}>
        <PmAgreementGlobal />
      </Col>
      <Col {...chartsColSpan}>
        <PmAgreementCountPie />
      </Col>
      <Col span={24}>
        <Card title="项目合同一年内签订个数、签订金额分析图" {...cardParams}>
          <PmAgreementSignYearMonthColumn />
        </Card>
      </Col>
    </Row>
  );
  return result;
};
