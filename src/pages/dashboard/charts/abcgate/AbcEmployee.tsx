/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useState } from 'react';
import type { CardProps } from 'antd';
import { Card, Col, Row } from 'antd';
import { getColumnDataIndex } from '@/pages/datamining/utils';
import request, { API_HEAD } from '@/utils/request';
import { serialize } from 'object-to-formdata';
import { stringifyObjectField } from '@/utils/utils';
import type { PieConfig } from '@ant-design/charts';
import { Pie } from '@ant-design/charts';
import { chartsColSpan } from '..';

const numeral = require('numeral');

const cardParams: CardProps = {
  size: 'default',
  bodyStyle: { height: '360px', paddingTop: 12, paddingBottom: 12 },
};

const COUNT = getColumnDataIndex('count.*');
/**
 * 当天人员温度数据图形分析表
 * @param param0
 * @returns
 */
const EmployeeTemperaturePie: React.FC<any> = ({
  title,
  groupfieldid,
}: {
  title: string;
  groupfieldid: any;
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const fetchData = () => {
    setLoading(true);
    const fields = ['count.*'];
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName: 'AbcEmployee',
          fields,
          groupfieldid,
        }),
      ),
    }).then((response) => {
      setData(
        (response as any[])
          .map((rec) => ({
            type: rec.text ? `${rec.text}℃` : '未检测',
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
      formatter: (datum) => `${datum.value}人(${numeral(datum.percent).format('0.00%')})`,
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
          return `${numeral(sum).format('0,0')}人`;
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
        return { name: datum.type, value: `${numeral(datum.value).format('0,0')}人` };
      },
    },
  };
  useEffect(() => {
    fetchData();
  }, []);
  return (
    <Card title={title} {...cardParams} extra={null}>
      <Pie {...config} />
    </Card>
  );
};

export default () => {
  const result = (
    <Row gutter={[12, 12]}>
      <Col {...chartsColSpan}>
        <EmployeeTemperaturePie
          title="人员当天体温状态图"
          groupfieldid={{ fieldname: 'todayState' }}
        />
      </Col>
      <Col {...chartsColSpan}>
        <EmployeeTemperaturePie
          title="人员当天体温值图"
          groupfieldid={{ fieldname: 'todayTemperature' }}
        />
      </Col>
      {/* <Col span={24}>
                图表1
            </Col>
            <Col xs={24} sm={24} md={24} lg={12}>
                图表1
            </Col>
            <Col xs={24} sm={24} md={24} lg={12} /> */}
    </Row>
  );
  return result;
};
