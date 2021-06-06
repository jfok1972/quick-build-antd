import React, { useEffect, useState } from 'react';
import type { CardProps } from 'antd';
import { Card, Col, Radio, Row } from 'antd';
import request, { API_HEAD } from '@/utils/request';
import { serialize } from 'object-to-formdata';
import { stringifyObjectField } from '@/utils/utils';
import { getColumnDataIndex } from '@/pages/datamining/utils';
import { currentUser } from 'umi';
import moment from 'moment';

import type { PieConfig } from '@ant-design/charts/es/pie';
import { Column, Pie, RingProgress } from '@ant-design/charts';
import type { TextValue } from '@/pages/module/data';
import type { ColumnConfig } from '@ant-design/charts/es/column';
import { DateFormat } from '@/pages/module/moduleUtils';
import { DateSectionSelect } from '../../utils/DateSectionSelect';
import { chartsColSpan } from '../../charts';
import { StatisticCard } from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';

const { Statistic, Divider } = StatisticCard;
const numeral = require('numeral');

const cardParams: CardProps = {
  size: 'default',
  bodyStyle: { height: '360px', paddingTop: 12, paddingBottom: 12 },
};

const COUNT = getColumnDataIndex('count.*');
const AVG = getColumnDataIndex('avg.udfloginminute');

const UserLogginPie: React.FC<any> = ({
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
        moduleName: 'FUserloginlog',
        fieldahead: 'FUser',
      },
      operator: '=',
      value: currentUser.userid,
    };
    const navigatefilters: any[] = [filter];
    const [d1, d2] = dateSection;
    if (d1 || d2) {
      navigatefilters.push({
        property: 'logindate',
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
          moduleName: 'FUserloginlog',
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
      setLoading(false);
    });
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

const UserLogginInOutColumn: React.FC<any> = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateSection, setDateSection] = useState<[any, any]>([null, null]);
  const fetchData = () => {
    const fields = ['count.*'];
    let datas: any[];
    const filter = {
      property_: {
        moduleName: 'FUserloginlog',
        fieldahead: 'FUser',
      },
      operator: '=',
      value: currentUser.userid,
    };
    const navigatefilters: any[] = [filter];
    const [d1, d2] = dateSection;
    if (d1 || d2) {
      navigatefilters.push({
        property: 'logindate',
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
          moduleName: 'FUserloginlog',
          fields,
          navigatefilters,
          groupfieldid: { fieldname: 'logintype' },
        }),
      ),
    }).then((response) => {
      datas = (response as any[])
        .map((rec) => ({
          type: rec.text === '空' ? '正常登录' : rec.text,
          value: rec[COUNT],
          group: '登录',
        }))
        .sort((rec1, rec2) => rec2.value - rec1.value);
      request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
        method: 'POST',
        data: serialize(
          stringifyObjectField({
            moduleName: 'FUserloginlog',
            fields,
            navigatefilters,
            groupfieldid: { fieldname: 'logouttype' },
          }),
        ),
      }).then((response1) => {
        datas.splice(
          datas.length,
          0,
          ...(response1 as any[])
            .map((rec) => ({
              type: rec.text === '空' ? '登出异常' : rec.text,
              value: rec[COUNT],
              group: '登出',
            }))
            .sort((rec1, rec2) => rec2.value - rec1.value),
        );
        setData(datas);
        setLoading(false);
      });
    });
  };
  useEffect(() => {
    fetchData();
  }, [dateSection]);
  const config = {
    data,
    loading,
    xField: 'group',
    yField: 'value',
    isGroup: true,
    isStack: true,
    seriesField: 'type',
    groupField: 'group',
  };
  return (
    <Card
      title="用户登录登出方式分析"
      {...cardParams}
      extra={<DateSectionSelect dateSection={dateSection} setDateSection={setDateSection} />}
    >
      <Column {...config} />
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

const UserLogginYearMonthColumn: React.FC = (params) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any[]>([]);
  const [sectionType, setSectionType] = useState<string>(sectionTypes[0].value || '');
  const asyncFetch = () => {
    setLoading(true);
    const filter = {
      property_: {
        moduleName: 'FUserloginlog',
        fieldahead: 'FUser',
      },
      operator: '=',
      value: currentUser.userid,
    };
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName: 'FUserloginlog',
          fields: ['count.*', 'avg.udfloginminute'],
          navigatefilters: [filter],
          groupfieldid: {
            fieldname: 'logindate',
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
            avg: rec[AVG],
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
        return { name: '登录', value: `${numeral(datum.value).format('0,0')}次` };
      },
    },
    meta: {
      type: { alias: '年月' },
      value: {
        alias: '登录',
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
          <span>用户登录</span>
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

const UserOperatorStaticCard: React.FC = () => {
  const [responsive, setResponsive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>({});
  useEffect(() => {
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName: 'FUserloginlog',
          fields: ['count.*'],
          groupfieldid: { fieldname: 'logouttype' },
        }),
      ),
    }).then((response: any[]) => {
      const logData: any = {
        sumCount: 0,
        successCount: 0,
        timeoutCount: 0,
        otherCount: 0,
      };
      response.forEach((rec) => {
        logData.sumCount += rec[COUNT];
        if (rec.text === '正常登出') logData.successCount = rec[COUNT];
        else if (rec.text === '超时登出') logData.timeoutCount = rec[COUNT];
        else logData.otherCount += rec[COUNT];
      });
      if (logData.sumCount > 0) {
        logData.insertPer = Math.round((logData.successCount * 10000) / logData.sumCount) / 100;
        logData.updatePer = Math.round((logData.timeoutCount * 10000) / logData.sumCount) / 100;
        logData.otherPer = Math.round((logData.otherCount * 10000) / logData.sumCount) / 100;
      }
      setData(logData);
      setLoading(false);
    });
  }, []);

  const getRingProgress = (value: number, color: string) => {
    const config = {
      height: 100,
      width: 100,
      autoFit: false,
      percent: value / 100,
      color: [color, '#E8EDF3'],
      innerRadius: 0.85,
      radius: 0.98,
    };
    return <RingProgress {...config} />;
  };
  const sumCard = (
    <StatisticCard
      loading={loading}
      statistic={{
        title: '总登录次数',
        value: data.sumCount,
        description: '所有年度',
      }}
    />
  );
  const insertCard = (
    <StatisticCard
      loading={loading}
      statistic={{
        title: '正常登出',
        value: data.successCount,
        description: <Statistic title="占比" value={`${data.insertPer}%`} />,
      }}
      chart={getRingProgress(data.insertPer, '#531dab')}
      chartPlacement="left"
    />
  );
  const updateCard = (
    <StatisticCard
      loading={loading}
      statistic={{
        title: '超时登出',
        value: data.timeoutCount,
        description: <Statistic title="占比" value={`${data.updatePer}%`} />,
      }}
      chart={getRingProgress(data.updatePer, '#096dd9')}
      chartPlacement="left"
    />
  );
  const otherCard = (
    <StatisticCard
      loading={loading}
      statistic={{
        title: '登出异常',
        value: data.otherCount,
        description: <Statistic title="占比" value={`${data.otherPer}%`} />,
      }}
      chart={getRingProgress(data.otherPer, '#F4664A')}
      chartPlacement="left"
    />
  );

  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 768);
      }}
    >
      {responsive ? (
        <StatisticCard.Group direction="column">
          <StatisticCard.Group>
            {sumCard}
            <Divider type="vertical" />
            {insertCard}
          </StatisticCard.Group>
          <Divider type="horizontal" />
          <StatisticCard.Group>
            {updateCard}
            <Divider type="vertical" />
            {otherCard}
          </StatisticCard.Group>
        </StatisticCard.Group>
      ) : (
        <StatisticCard.Group>
          {sumCard}
          <Divider type="vertical" />
          {insertCard}
          <Divider type="vertical" />
          {updateCard}
          <Divider type="vertical" />
          {otherCard}
        </StatisticCard.Group>
      )}
    </RcResizeObserver>
  );
};

export const UserLogin: React.FC = () => {
  return (
    <Row gutter={[12, 12]}>
      <Col span={24}>
        <UserOperatorStaticCard />
      </Col>
      <Col {...chartsColSpan}>
        <UserLogginPie title="用户登录地址分析" groupfieldid={{ fieldname: 'ipaddress' }} />
      </Col>
      <Col {...chartsColSpan}>
        <UserLogginInOutColumn />
      </Col>
      <Col span={24}>
        <UserLogginYearMonthColumn {...cardParams} />
      </Col>
    </Row>
  );
};
