import React, { useEffect, useState } from 'react';
import request, { API_HEAD } from '@/utils/request';
import { apply, stringifyObjectField } from '@/utils/utils';
import { StatisticCard } from '@ant-design/pro-card';
import { serialize } from 'object-to-formdata';
import RcResizeObserver from 'rc-resize-observer';
import { RingProgress } from '@ant-design/charts';
import { getColumnDataIndex } from '@/pages/datamining/utils';

const numeral = require('numeral');

const { Statistic, Divider } = StatisticCard;

interface TextValue {
  text: string;
  value: number;
  percent: number;
}

interface StaticMasterDetailCardProps {
  moduleName: string; // 模块名称
  aggregateField: string; // 聚合字段， count.* ,sum.fieldname , avg.fieldname
  groupField: any; // 分组的字段  { fieldname : dotype} ,
  detailCount: number; // 明细里面个数，超过的全部放在其他里
  title: string; // 指标名称
  otherTitle: string;
  description?: string; // 汇总指标的描述
  orderby?: 'text' | 'value'; // 按什么排序
  orderDesc?: boolean; // 排序顺序
  monetary?: any; // 金额单位
  unittext?: string; // 数值单位，个，米
  detailCallback?: Function; // detail数据获取后的回调
}

export const StaticMasterDetailCard: React.FC<StaticMasterDetailCardProps> = ({
  moduleName,
  aggregateField,
  groupField,
  detailCount,
  title,
  otherTitle,
  orderby,
  orderDesc,
  description,
  detailCallback,
}) => {
  const aggregateFieldName = getColumnDataIndex(aggregateField);
  const [responsive, setResponsive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [detailData, setDetailData] = useState<TextValue[]>([]);
  useEffect(() => {
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName,
          fields: [aggregateField],
          groupfieldid: groupField,
        }),
      ),
    }).then((response: any[]) => {
      // 生成 detailData , 根据结果排序，生成后取前count-1个，其他的全部加在一起
      if (detailCallback) {
        detailCallback(response);
      }
      let sumValue: number = 0;
      const sortField = orderby || 'value';
      const detailArray: TextValue[] = response
        .map((rec) => {
          const obj = {
            text: rec.text,
            value: rec[aggregateFieldName],
            percent: 0,
          };
          sumValue += obj.value;
          return obj;
        })
        .sort((rec1, rec2) => {
          if (rec1[sortField] > rec2[sortField]) return orderDesc ? -1 : 1;
          if (rec1[sortField] < rec2[sortField]) return orderDesc ? 1 : -1;
          return 0;
        });
      if (detailArray.length > detailCount) {
        const other: TextValue = {
          text: otherTitle || '其他',
          value: 0,
          percent: 0,
        };
        detailArray
          .filter((rec, order) => order >= detailCount - 1)
          .forEach((rec) => {
            other.value += rec.value;
          });
        detailArray.splice(detailCount - 1, detailArray.length - detailCount + 1, other);
      }
      detailArray.forEach((rec) => {
        if (sumValue) apply(rec, { percent: Math.round((rec.value * 10000) / sumValue) / 10000 });
      });
      setDetailData(detailArray);
      setTotal(sumValue);
      setLoading(false);
    });
  }, []);

  const getRingProgress = (value: number, color: string) => {
    const config = {
      height: 100,
      width: 100,
      autoFit: false,
      percent: value,
      color: [color, '#E8EDF3'],
      innerRadius: 0.85,
      radius: 0.98,
    };
    return <RingProgress {...config} />;
  };
  const getSumCard = () => (
    <StatisticCard
      statistic={{
        title,
        value: total,
        description,
      }}
    />
  );
  const getDetailCard = (detail: TextValue) => (
    <StatisticCard
      statistic={{
        title: detail.text,
        value: detail.value,
        description: <Statistic title="占比" value={numeral(detail.percent).format('0.00%')} />,
      }}
      chart={getRingProgress(detail.percent, detail.text === otherTitle ? '#F4664A' : '#531dab')}
      chartPlacement="left"
    />
  );

  const getResponsiveChildren = () => {
    const children: any[] = [];
    if (detailData.length % 2 === 1) {
      // 如果有奇数个，则总计和第一个在一起
      children.push(
        <StatisticCard.Group>
          {getSumCard()}
          <Divider type="vertical" />
          {getDetailCard(detailData[0])}
        </StatisticCard.Group>,
      );
      for (let i = 0; i < (detailData.length - 1) / 2; i += 1) {
        children.push(
          <StatisticCard.Group>
            {getDetailCard(detailData[i * 2 + 1])}
            <Divider type="vertical" />
            {getDetailCard(detailData[i * 2 + 2])}
          </StatisticCard.Group>,
        );
      }
    } else {
      // 有偶数个，总计占一行
      children.push(<StatisticCard.Group>{getSumCard()}</StatisticCard.Group>);
      for (let i = 0; i < detailData.length / 2; i += 1) {
        children.push(
          <StatisticCard.Group>
            {getDetailCard(detailData[i * 2])}
            <Divider type="vertical" />
            {getDetailCard(detailData[i * 2 + 1])}
          </StatisticCard.Group>,
        );
      }
    }
    for (let i = children.length - 1; i >= 0; i -= 1) {
      children.splice(i, 0, <Divider type="horizontal" />);
    }
    return children;
  };

  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 768);
      }}
    >
      {responsive && detailData.length > 1 ? (
        <StatisticCard.Group direction="column" loading={loading}>
          {getResponsiveChildren()}
        </StatisticCard.Group>
      ) : (
        <StatisticCard.Group loading={loading}>
          {getSumCard()}
          {detailData.length ? <Divider type="vertical" /> : null}
          {detailData.map((detail, index) => [
            getDetailCard(detail),
            index === detailData.length - 1 ? null : <Divider type="vertical" />,
          ])}
        </StatisticCard.Group>
      )}
    </RcResizeObserver>
  );
};
