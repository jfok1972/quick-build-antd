/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { CardProps } from 'antd';
import { Card, Col, Radio, Row } from 'antd';
import { currentUser } from 'umi';
import { serialize } from 'object-to-formdata';
import request, { API_HEAD } from '@/utils/request';
import moment from 'moment';
import { stringifyObjectField } from '@/utils/utils';
import { getColumnDataIndex } from '@/pages/datamining/utils';
import type { PieConfig, ColumnConfig } from '@ant-design/charts';
import { Column, Pie } from '@ant-design/charts';
import type { TextValue } from '@/pages/module/data';
import { DateFormat } from '@/pages/module/moduleUtils';
import { DateSectionSelect } from '../../utils/DateSectionSelect';
import { chartsColSpan, staticColSpan } from '../../charts';
import { StaticMasterDetailCard } from '../../../module/components/StaticMasterDetailCard';
import { StaticCard } from '@/pages/module/components/StaticCard';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';

const numeral = require('numeral');

const cardParams: CardProps = {
  size: 'default',
  bodyStyle: { height: '360px', paddingTop: 12, paddingBottom: 12 },
};

const COUNT = getColumnDataIndex('count.*');

const UserOperatorPie: React.FC<any> = ({
  title,
  groupfieldid,
}: {
  title: string;
  groupfieldid: any;
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateSection, setDateSection] = useState<[any, any]>([null, null]);
  const fetchData = () => {
    setLoading(true);
    const fields = ['count.*'];
    const filter = {
      property_: {
        moduleName: 'FUseroperatelog',
        fieldahead: 'FUser',
      },
      operator: '=',
      value: currentUser.userid,
    };
    const navigatefilters: any[] = [filter];
    const [d1, d2] = dateSection;
    if (d1 || d2) {
      navigatefilters.push({
        property: 'odate',
        operator: 'daysection',
        searchfor: 'date',
        value: `${d1 ? moment(d1).format(DateFormat) : ''}--${
          d2 ? moment(d2).format(DateFormat) : ''
        }`,
      });
    }
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName: 'FUseroperatelog',
          fields,
          navigatefilters,
          groupfieldid,
        }),
      ),
    }).then((response: any[]) => {
      const result = response
        .map((rec) => ({
          type: rec.text,
          value: rec[COUNT],
        }))
        .sort((rec1, rec2) => rec2.value - rec1.value);
      // 只取前19个最大的，其他放在其他之中
      let restValue = 0;
      let restCount = 0;
      result
        .filter((value, index) => index >= 19)
        .forEach((rec) => {
          restValue += rec.value;
          restCount += 1;
        });
      const adata = result.filter((value, index) => index < 19);
      if (restValue)
        adata.push({
          type: `其他模块(${restCount}个)`,
          value: restValue,
        });
      setData(adata);
      setLoading(false);
    });
  };
  const config: PieConfig = useMemo(
    () => ({
      appendPadding: 10,
      data,
      loading,
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      innerRadius: 0.64,
      label: {
        type: 'outer',
        formatter: (datum) => `${datum.value}次(${numeral(datum.percent).format('0.00%')})`,
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
            return `${numeral(sum).format('0,0')}次`;
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
          return { name: datum.type, value: `${numeral(datum.value).format('0,0')}次` };
        },
      },
    }),
    [data, loading],
  );
  useEffect(() => {
    fetchData();
  }, [dateSection]);
  return (
    <Card
      {...cardParams}
      title={title}
      extra={<DateSectionSelect dateSection={dateSection} setDateSection={setDateSection} />}
    >
      <Card
        bordered={false}
        style={{ padding: 0, margin: 0, height: '100%' }}
        bodyStyle={{ padding: 0, margin: 0, height: '100%' }}
      >
        <Pie {...config} />
      </Card>
    </Card>
  );
};

const columnStyle = {
  fillOpacity: 0.5,
  strokeOpacity: 0.7,
  shadowColor: 'black',
  shadowBlur: 10,
  shadowOffsetX: 5,
  shadowOffsetY: 5,
  cursor: 'pointer',
};

const sectionTypes: TextValue[] = [
  {
    text: '每日',
    value: 'yyyy年mm月dd日',
  },
  {
    text: '月度',
    value: 'yyyy年mm月',
  },
  {
    text: '年度',
    value: 'yyyy年',
  },
  {
    text: '季度',
    value: 'yyyy年n季度',
  },
];

const UserOperatorYearMonthColumn: React.FC = (params) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any[]>([]);
  const [sectionType, setSectionType] = useState<string>(sectionTypes[0].value || '');
  const asyncFetch = () => {
    setLoading(true);
    const filter = {
      property_: {
        moduleName: 'FUseroperatelog',
        fieldahead: 'FUser',
      },
      operator: '=',
      value: currentUser.userid,
    };
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName: 'FUseroperatelog',
          fields: ['count.*'],
          navigatefilters: [filter],
          groupfieldid: {
            fieldname: 'odate',
            function: sectionType,
          },
        }),
      ),
    }).then((response) => {
      setData(
        (response as any[])
          .map((rec) => ({
            type: rec.text,
            value: rec[COUNT],
          }))
          .sort((a, b) => (a.type > b.type ? 1 : -1)),
      );
      setLoading(false);
    });
  };
  const config: ColumnConfig = {
    style: { height: '100%' },
    loading,
    data,
    xField: 'type',
    yField: 'value',
    columnWidthRatio: 0.618,
    xAxis: { label: { autoRotate: false } },
    slider: {
      start: data.length > 13 ? 1 - 12 / data.length : 0,
      end: 1,
    },
    columnStyle,
    label: {
      position: 'top',
      formatter: (datum) => {
        return `${numeral(datum.value).format('0,0')}次`;
      },
    },
    tooltip: {
      formatter: (datum) => {
        return { name: '操作', value: `${numeral(datum.value).format('0,0')}次` };
      },
    },
    meta: {
      type: { alias: '年月' },
      value: {
        alias: '操作',
        formatter: (value: number) => {
          return `${numeral(value).format('0,0')}次`;
        },
      },
    },
  };
  useEffect(() => {
    asyncFetch();
  }, [sectionType]);
  return (
    <Card
      title={
        <>
          <span>用户操作</span>
          <Radio.Group
            value={sectionType}
            size="small"
            style={{ margin: '0px 8px', fontWeight: 400 }}
            onChange={(e) => {
              setSectionType(e.target.value);
            }}
          >
            {sectionTypes.map((type) => (
              <Radio.Button key={type.value} value={type.value}>
                {type.text}
              </Radio.Button>
            ))}
          </Radio.Group>
          <span>柱状图</span>
        </>
      }
      {...params}
    >
      <Card
        bordered={false}
        style={{ height: '100%' }}
        bodyStyle={{ padding: '0px 12px', margin: 0, height: '100%' }}
      >
        <Column {...config} />
      </Card>
    </Card>
  );
};

export const UserOperator: React.FC = () => {
  return (
    <Row gutter={[12, 12]}>
      <Col {...staticColSpan}>
        <StaticCard
          moduleName="FUseroperatelog"
          title="记录操作次数"
          aggregate="count"
          fieldName="*"
          dateFieldName="odate"
          description="所有模块记录的各种操作都统计在内，包括新增、修改、删除、执行SQL语句等。"
          unitText="次"
          relatives={[
            {
              section: 'week',
            },
            {
              section: 'week',
              monthOnMonth: true,
            },
          ]}
          staticFields={[
            {
              moduleName: 'FUseroperatelog',
              title: '本日操作次数',
              aggregate: 'count',
              fieldName: '*',
              unitText: '次',
              filters: [
                {
                  property: 'odate',
                  operator: 'daysection',
                  value: `${moment().format(DateFormat)}--${moment().format(DateFormat)}`,
                },
              ],
            },
            {
              moduleName: 'FUseroperatelog',
              title: '本月操作次数',
              aggregate: 'count',
              fieldName: '*',
              unitText: '次',
              filters: [
                {
                  property: 'odate',
                  operator: 'daysection',
                  value: `${moment().set('date', 1).format(DateFormat)}--${moment().format(
                    DateFormat,
                  )}`,
                },
              ],
            },
          ]}
        />
      </Col>
      <Col {...staticColSpan}>
        <StaticCard
          moduleName="FUseroperatelog"
          title="记录修改次数"
          icon={<EditOutlined />}
          aggregate="count"
          fieldName="*"
          dateFieldName="odate"
          height={180}
          filters={[
            {
              property: 'dotype',
              operator: '=',
              value: '修改',
            },
          ]}
          relatives={[
            {
              section: 'day',
              sectionNumber: 10,
            },
            {
              section: 'month',
              monthOnMonth: true,
            },
          ]}
          chart={{
            type: 'column',
            sectionType: 'month',
          }}
        />
      </Col>
      <Col {...staticColSpan}>
        <StaticCard
          moduleName="FUseroperatelog"
          title="记录新增次数"
          icon={<PlusOutlined />}
          aggregate="count"
          fieldName="*"
          dateFieldName="odate"
          monetaryUnit={1000}
          height={180}
          filters={[
            {
              property: 'dotype',
              operator: '=',
              value: '新增',
            },
          ]}
          relatives={[
            {
              section: 'year',
            },
            {
              section: 'year',
              monthOnMonth: true,
            },
          ]}
          chart={{
            type: 'line',
            sectionType: 'day',
            maxCount: 360,
          }}
        />
      </Col>
      <Col {...staticColSpan}>
        <StaticCard
          moduleName="FUseroperatelog"
          title="记录删除次数"
          icon={<DeleteOutlined />}
          aggregate="count"
          fieldName="*"
          dateFieldName="odate"
          unitText="次"
          height={180}
          chartHeight={68}
          filters={[
            {
              property: 'dotype',
              operator: '=',
              value: '删除',
            },
          ]}
          chart={{
            type: 'area',
            sectionType: 'month',
          }}
        />
      </Col>

      <Col span={24}>
        <StaticMasterDetailCard
          moduleName="FUseroperatelog"
          aggregateField="count.*"
          detailCount={7}
          title="记录操作次数"
          unitText="次"
          items={[
            {
              groupField: { fieldname: 'dotype' },
              groupTitle: '操作类型',
              description: '所有操作根据操作类型分组',
              otherTitle: '其他操作',
              orderby: 'value',
              orderDesc: true,
            },
            {
              groupField: { fieldahead: 'FDataobject' },
              groupTitle: '操作模块',
              otherTitle: '其他模块',
              orderby: 'value',
              orderDesc: true,
            },
            {
              groupField: { fieldname: 'odate', function: 'yyyy年' },
              groupTitle: '操作年度',
              otherTitle: '其他年度',
              orderby: 'text',
              orderDesc: true,
            },
            {
              groupField: { fieldahead: 'FUser' },
              groupTitle: '操作人员',
              otherTitle: '其他人员',
              orderby: 'value',
              orderDesc: true,
            },
          ]}
        />
      </Col>
      <Col {...chartsColSpan}>
        <UserOperatorPie title="用户操作类型分析" groupfieldid={{ fieldname: 'dotype' }} />
      </Col>
      <Col {...chartsColSpan}>
        <UserOperatorPie title="用户操作模块分析" groupfieldid={{ fieldahead: 'FDataobject' }} />
      </Col>
      <Col span={24}>
        <UserOperatorYearMonthColumn {...cardParams} />
      </Col>
    </Row>
  );
};
