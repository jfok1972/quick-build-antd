/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useState } from 'react';
import type { CardProps } from 'antd';
import { Card, Col, Radio, Row } from 'antd';
import { getColumnDataIndex } from '@/pages/datamining/utils';
import { currentUser } from 'umi';
import request, { API_HEAD } from '@/utils/request';
import moment from 'moment';
import { serialize } from 'object-to-formdata';
import { apply, stringifyObjectField } from '@/utils/utils';
import type { ColumnConfig, PieConfig } from '@ant-design/charts';
import { Column, Pie } from '@ant-design/charts';
import type { TextValue } from '@/pages/module/data';
import { DateFormat } from '@/pages/module/moduleUtils';
import { DateSectionSelect } from '../../utils/DateSectionSelect';
import { chartsColSpan, staticColSpan } from '../../charts';
import { StaticMasterDetailCard } from '@/pages/module/components/StaticMasterDetailCard';
import { StaticCard } from '@/pages/module/components/StaticCard';

const numeral = require('numeral');

const cardParams: CardProps = {
  size: 'default',
  bodyStyle: { height: '360px', paddingTop: 12, paddingBottom: 12 },
};

const COUNT = getColumnDataIndex('count.*');

const UserApprovePie: React.FC<any> = ({
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
    const fields = ['count.*'];
    const filter = {
      property_: {
        moduleName: 'VActFinishTask',
        fieldahead: 'actAssignee',
      },
      operator: '=',
      value: currentUser.userid,
    };
    const navigatefilters: any[] = [filter];
    const [d1, d2] = dateSection;
    if (d1 || d2) {
      navigatefilters.push({
        property: 'actTaskEndTime',
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
          moduleName: 'VActFinishTask',
          fields,
          navigatefilters,
          groupfieldid,
        }),
      ),
    }).then((response) => {
      setData(
        (response as any[])
          .map((rec) => ({
            type: rec.text,
            value: rec[COUNT],
          }))
          .sort((rec1, rec2) => rec2.value - rec1.value),
      );
    });
    setLoading(false);
  };

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
  };
  useEffect(() => {
    fetchData();
  }, [dateSection]);
  return (
    <Card
      title={title}
      {...cardParams}
      extra={<DateSectionSelect dateSection={dateSection} setDateSection={setDateSection} />}
    >
      <Pie {...config} />
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

const UserApproveYearMonthColumn: React.FC = (params) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any[]>([]);
  const [sectionType, setSectionType] = useState<string>(sectionTypes[0].value || '');
  const asyncFetch = () => {
    setLoading(true);
    const filter = {
      property_: {
        moduleName: 'VActFinishTask',
        fieldahead: 'actAssignee',
      },
      operator: '=',
      value: currentUser.userid,
    };
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName: 'VActFinishTask',
          fields: ['count.*'],
          navigatefilters: [filter],
          groupfieldid: {
            fieldname: 'actTaskEndTime',
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
          .sort((a, b) => (a.type > b.type ? 1 : -1))
          .reverse()
          .filter((value, index) => index < 300)
          .reverse(),
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
        return { name: '审批', value: `${numeral(datum.value).format('0,0')}次` };
      },
    },
    meta: {
      type: { alias: '年月' },
      value: {
        alias: '审批',
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
          <span>已审批任务</span>
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
      <Column {...config} />
    </Card>
  );
};

export const UserApprove: React.FC = () => {
  return (
    <Row gutter={[12, 12]}>
      <Col {...staticColSpan}>
        <StaticCard
          moduleName="VActHiProcinst"
          fieldName="*"
          aggregate="count"
          title="审批记录总数"
          unitText="条"
          dateFieldName="endTime"
          description="所有模块的已经开始审批的记录总数"
          footerRegion="staticfield"
          height={205}
          chart={{
            type: 'column',
            sectionType: 'day',
          }}
          staticFields={[
            {
              moduleName: 'VActHiProcinst',
              fieldName: '*',
              aggregate: 'count',
              title: '已审批完成',
              filters: [
                {
                  property: 'endTime',
                  operator: 'is not null',
                },
              ],
              unitText: '条',
              addRatio: true,
            },
            {
              moduleName: 'VActHiProcinst',
              fieldName: '*',
              aggregate: 'count',
              title: '未审批完成',
              filters: [
                {
                  property: 'endTime',
                  operator: 'is null',
                },
              ],
              unitText: '条',
              addRatio: true,
            },
          ]}
        />
      </Col>
      <Col {...staticColSpan}>
        <StaticCard
          moduleName="VActHiProcinst"
          fieldName="*"
          aggregate="count"
          filters={[
            {
              property: 'endTime',
              operator: 'is not null',
            },
          ]}
          title="已审批记录数"
          unitText="条"
          dateFieldName="endTime"
          footerRegion="staticfield"
          height={205}
          chart={{
            type: 'line',
            sectionType: 'day',
          }}
          staticFields={[
            {
              moduleName: 'VActHiProcinst',
              fieldName: 'duration',
              aggregate: 'max',
              monetaryUnit: 3600000,
              title: '最长审批时间',
              unitText: '小时',
            },
            {
              moduleName: 'VActHiProcinst',
              fieldName: 'duration',
              aggregate: 'min',
              monetaryUnit: 3600000,
              title: '最短审批时间',
              unitText: '小时',
            },
            {
              moduleName: 'VActHiProcinst',
              fieldName: 'duration',
              aggregate: 'avg',
              monetaryUnit: 3600000,
              title: '平均审批时间',
              unitText: '小时',
            },
          ]}
        />
      </Col>
      <Col {...staticColSpan}>
        <StaticCard
          moduleName="VActAllFinishTask"
          fieldName="*"
          aggregate="count"
          title="已完成任务总数"
          unitText="次"
          dateFieldName="actTaskEndTime"
          description="所有模块的所有审批记录的任务总次数"
          footerRegion="staticfield"
          height={205}
          chart={{
            type: 'area',
            sectionType: 'day',
          }}
          relatives={[
            {
              section: 'day',
              monthOnMonth: true,
            },
            {
              section: 'week',
            },
            {
              section: 'month',
            },
          ]}
        />
      </Col>
      <Col {...staticColSpan}>
        <StaticCard
          moduleName="VActRuTask1"
          fieldName="*"
          aggregate="count"
          title="未完成任务数"
          unitText="次"
          dateFieldName="createTime"
          footerRegion="staticfield"
          height={205}
          chart={{
            type: 'column',
            sectionType: 'day',
          }}
          relatives={[
            {
              section: 'day',
              monthOnMonth: true,
            },
            {
              section: 'week',
            },
            {
              section: 'month',
            },
          ]}
        />
      </Col>

      <Col span={24}>
        <StaticMasterDetailCard
          moduleName="VActHiProcinst"
          aggregateField="count.*"
          detailCount={4}
          title="审批记录条数"
          unitText="条"
          items={[
            {
              groupField: { fieldname: 'objecttitle' },
              groupTitle: '审批模块',
              otherTitle: '其他模块',
              orderby: 'value',
              orderDesc: true,
            },
            {
              groupField: { fieldname: 'endTime', function: 'yyyy年' },
              groupTitle: '审批完成年度',
              otherTitle: '其他年度',
              orderby: 'text',
              orderDesc: true,
              detailCallback: (details: any[]) => {
                details.forEach((rec) => {
                  if (rec.text === '空') {
                    apply(rec, {
                      text: '审批尚未完成',
                    });
                  }
                });
              },
            },
            {
              groupField: { fieldname: 'endActName' },
              groupTitle: '审批结果',
              otherTitle: '其他结果',
              orderby: 'value',
              orderDesc: true,
              detailCallback: (details: any[]) => {
                details.forEach((rec) => {
                  if (rec.text === '空') {
                    apply(rec, {
                      text: '审批尚未完成',
                    });
                  }
                });
              },
            },
          ]}
        />
      </Col>
      {
        <Col span={24}>
          <StaticMasterDetailCard
            moduleName="VActFinishTask"
            aggregateField="count.*"
            title="完成审批任务次数"
            detailCount={4}
            unitText="次"
            items={[
              {
                groupField: { fieldname: 'objecttitle' },
                groupTitle: '审批模块',
                otherTitle: '其他模块',
                orderby: 'value',
                orderDesc: true,
              },
              {
                groupField: { fieldahead: 'actAssignee' },
                groupTitle: '任务完成人员',
                otherTitle: '其他人员',
                orderby: 'value',
                orderDesc: true,
              },
              {
                groupField: { fieldname: 'actTaskEndTime', function: 'YYYY年' },
                groupTitle: '任务完成年度',
                otherTitle: '其他年度',
                orderby: 'value',
                orderDesc: true,
              },
            ]}
          />
        </Col>
      }
      <Col {...chartsColSpan}>
        <UserApprovePie title="已审批任务模块分析" groupfieldid={{ fieldname: 'objecttitle' }} />
      </Col>
      <Col {...chartsColSpan}>
        <UserApprovePie title="已审批任务结果分析" groupfieldid={{ fieldname: 'actEndActName' }} />
      </Col>
      <Col span={24}>
        <UserApproveYearMonthColumn {...cardParams} />
      </Col>
    </Row>
  );
};
