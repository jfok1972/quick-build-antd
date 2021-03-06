import React, { useEffect, useMemo, useState } from 'react';
import type { CardProps } from 'antd';
import { Card, Col, Radio, Row } from 'antd';
import { currentUser } from 'umi';
import { serialize } from 'object-to-formdata';
import request, { API_HEAD } from '@/utils/request';
import moment from 'moment';
import { stringifyObjectField } from '@/utils/utils';
import type { PieConfig } from '@ant-design/charts/es/pie';
import { getColumnDataIndex } from '@/pages/datamining/utils';
import { Column, Pie } from '@ant-design/charts';
import type { TextValue } from '@/pages/module/data';
import type { ColumnConfig } from '@ant-design/charts/es/column';
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
      // ?????????19???????????????????????????????????????
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
          type: `????????????(${restCount}???)`,
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
        formatter: (datum) => `${datum.value}???(${numeral(datum.percent).format('0.00%')})`,
      },
      statistic: {
        title: {
          formatter: () => '??????',
          offsetY: -15,
        },
        content: {
          formatter: (value, datum) => {
            let sum = 0;
            if (datum)
              datum.forEach((rec) => {
                sum += rec.value;
              });
            return `${numeral(sum).format('0,0')}???`;
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
          return { name: datum.type, value: `${numeral(datum.value).format('0,0')}???` };
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
    text: '??????',
    value: 'yyyy???mm???dd???',
  },
  {
    text: '??????',
    value: 'yyyy???mm???',
  },
  {
    text: '??????',
    value: 'yyyy???',
  },
  {
    text: '??????',
    value: 'yyyy???n??????',
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
        return `${numeral(datum.value).format('0,0')}???`;
      },
    },
    tooltip: {
      formatter: (datum) => {
        return { name: '??????', value: `${numeral(datum.value).format('0,0')}???` };
      },
    },
    meta: {
      type: { alias: '??????' },
      value: {
        alias: '??????',
        formatter: (value: number) => {
          return `${numeral(value).format('0,0')}???`;
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
          <span>????????????</span>
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
          <span>?????????</span>
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
          title="??????????????????"
          aggregate="count"
          fieldName="*"
          dateFieldName="odate"
          description="??????????????????????????????????????????????????????????????????????????????????????????SQL????????????"
          unitText="???"
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
              title: '??????????????????',
              aggregate: 'count',
              fieldName: '*',
              unitText: '???',
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
              title: '??????????????????',
              aggregate: 'count',
              fieldName: '*',
              unitText: '???',
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
          title="??????????????????"
          icon={<EditOutlined />}
          aggregate="count"
          fieldName="*"
          dateFieldName="odate"
          height={180}
          filters={[
            {
              property: 'dotype',
              operator: '=',
              value: '??????',
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
          title="??????????????????"
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
              value: '??????',
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
          title="??????????????????"
          icon={<DeleteOutlined />}
          aggregate="count"
          fieldName="*"
          dateFieldName="odate"
          unitText="???"
          height={180}
          chartHeight={68}
          filters={[
            {
              property: 'dotype',
              operator: '=',
              value: '??????',
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
          title="??????????????????"
          unitText="???"
          items={[
            {
              groupField: { fieldname: 'dotype' },
              groupTitle: '????????????',
              description: '????????????????????????????????????',
              otherTitle: '????????????',
              orderby: 'value',
              orderDesc: true,
            },
            {
              groupField: { fieldahead: 'FDataobject' },
              groupTitle: '????????????',
              otherTitle: '????????????',
              orderby: 'value',
              orderDesc: true,
            },
            {
              groupField: { fieldname: 'odate', function: 'yyyy???' },
              groupTitle: '????????????',
              otherTitle: '????????????',
              orderby: 'text',
              orderDesc: true,
            },
            {
              groupField: { fieldahead: 'FUser' },
              groupTitle: '????????????',
              otherTitle: '????????????',
              orderby: 'value',
              orderDesc: true,
            },
          ]}
        />
      </Col>
      <Col {...chartsColSpan}>
        <UserOperatorPie title="????????????????????????" groupfieldid={{ fieldname: 'dotype' }} />
      </Col>
      <Col {...chartsColSpan}>
        <UserOperatorPie title="????????????????????????" groupfieldid={{ fieldahead: 'FDataobject' }} />
      </Col>
      <Col span={24}>
        <UserOperatorYearMonthColumn {...cardParams} />
      </Col>
    </Row>
  );
};
