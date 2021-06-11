import React, { useEffect, useState } from 'react';
import request, { API_HEAD } from '@/utils/request';
import { apply, stringifyObjectField } from '@/utils/utils';
import { StatisticCard } from '@ant-design/pro-card';
import { serialize } from 'object-to-formdata';
import RcResizeObserver from 'rc-resize-observer';
import { getColumnDataIndex } from '@/pages/datamining/utils';
import { Badge, Progress, Tooltip } from 'antd';
import styles from './StaticMasterDetailCard.less';

const numeral = require('numeral');

const { Divider } = StatisticCard;

interface TextValue {
  code?: string; // 主键或数据字典的代码
  text: string; // 当前记录的文本
  value: number; // 当前记录的值
  percent: number; // 总占比
  icon?: React.ReactNode; // 图标
}

interface StaticMasterDetailCardProps {
  moduleName: string; // 模块名称
  aggregateField: string; // 聚合字段， count.* ,sum.fieldname , avg.fieldname
  title: string; // 指标名称
  detailCount: number; // 明细里面个数，超过的全部放在其他里
  formatPattern?: string; // 数值format样式, 默认 0,000 , 0.000.00
  monetaryUnit?: 100000000 | 1000000 | 10000 | 1000 | 1; // 数值单位 亿 百万 万 千
  unitText?: string; // 数值单位，个，米，万元。
  filters?: any[];
  items: CardCategoryProps[];
}

// 可以有多个选项，在总计里面呆以进行选择
interface CardCategoryProps {
  groupField: any; // 分组的字段  { fieldname : dotype} ,
  groupTitle: string; // 指标名称
  otherTitle?: string;
  description?: string; // 汇总指标的描述
  orderby?: 'text' | 'value' | 'code'; // 按什么排序,对于有序的如数据字典，可以按code排序
  orderDesc?: boolean; // 排序顺序
  detailCallback?: Function; // detail数据获取后的回调
}

export const StaticMasterDetailCard: React.FC<StaticMasterDetailCardProps> = ({
  moduleName,
  aggregateField,
  detailCount,
  formatPattern = '0,000',
  monetaryUnit = 1,
  unitText = '',
  title,
  filters,
  items,
}) => {
  const aggregateFieldName = getColumnDataIndex(aggregateField);
  const [responsive, setResponsive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [firstloading, setFirstloading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [detailData, setDetailData] = useState<TextValue[]>([]);
  const [itemIndex, setItemIndex] = useState<number>(0);

  const getUnitText = () => {
    let text = '';
    if (monetaryUnit === 100000000) text = '亿';
    else if (monetaryUnit === 1000000) text = '百万';
    else if (monetaryUnit === 10000) text = '万';
    else if (monetaryUnit === 1000) text = '千';
    return text + unitText;
  };

  const getValueText = (value: number) => {
    return numeral(value / monetaryUnit).format(formatPattern) + getUnitText();
  };

  useEffect(() => {
    setLoading(true);
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName,
          fields: [aggregateField],
          groupfieldid: items[itemIndex].groupField,
          navigatefilters: filters,
        }),
      ),
    }).then((response: any[]) => {
      // 生成 detailData , 根据结果排序，生成后取前count-1个，其他的全部加在一起
      const callback = items[itemIndex].detailCallback;
      if (callback) {
        callback(response);
      }
      let sumValue: number = 0;
      const sortField = items[itemIndex].orderby || 'value';
      const detailArray: TextValue[] = response
        .map((rec) => {
          const obj = {
            code: rec.value,
            text: rec.text,
            value: rec[aggregateFieldName],
            percent: 0,
            icon: rec.icon,
          };
          sumValue += obj.value;
          return obj;
        })
        .sort((rec1, rec2) => {
          if (rec1[sortField] > rec2[sortField]) return items[itemIndex].orderDesc ? -1 : 1;
          if (rec1[sortField] < rec2[sortField]) return items[itemIndex].orderDesc ? 1 : -1;
          return 0;
        });
      if (detailArray.length > detailCount) {
        let restCount = 0;
        const other: TextValue = {
          text: items[itemIndex].otherTitle || '其他',
          value: 0,
          percent: 0,
        };
        detailArray
          .filter((rec, order) => order >= detailCount - 1)
          .forEach((rec) => {
            other.value += rec.value;
            restCount += 1;
          });
        other.text += `(${restCount}个)`;
        detailArray.splice(detailCount - 1, detailArray.length - detailCount + 1, other);
      }
      detailArray.forEach((rec) => {
        if (sumValue) apply(rec, { percent: Math.round((rec.value * 10000) / sumValue) / 10000 });
      });
      setDetailData(detailArray);
      setTotal(sumValue);
      setLoading(false);
      setFirstloading(false);
    });
  }, [itemIndex]);

  const getRingProgress = (value: number, color: string) => {
    return (
      <Progress
        type="circle"
        percent={Math.round(value * 1000) / 10}
        width={72}
        strokeLinecap="butt"
        strokeColor={color}
        format={(percent) => {
          return <span style={{ fontSize: '14px' }}>{`${percent}%`}</span>;
        }}
      />
    );
  };
  const getSumCard = () => (
    <StatisticCard
      className={styles.staticcard}
      statistic={{
        title,
        value: getValueText(total),
        description:
          items.length > 1
            ? items.map((item, index) => (
                <Tooltip title={item.groupTitle} placement="bottom">
                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setItemIndex(index);
                    }}
                  >
                    <Badge
                      status={index === itemIndex ? 'success' : 'default'}
                      title={item.groupTitle}
                    />
                  </span>
                </Tooltip>
              ))
            : null,
      }}
      footer={items[itemIndex].description}
    />
  );
  const getDetailCard = (detail: TextValue) => (
    <StatisticCard
      loading={!firstloading && loading}
      className={styles.staticcard}
      statistic={{
        title: [detail.icon, detail.text],
        value: getValueText(detail.value),
        // description: <Statistic title="占比" value={numeral(detail.percent).format('0.00%')} />,
      }}
      chart={getRingProgress(
        detail.percent,
        detail.text === items[itemIndex].otherTitle ? '#F4664A' : 'default',
      )}
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
        <StatisticCard.Group
          className={styles.staticcardgroup}
          direction="column"
          loading={firstloading && loading}
        >
          {getResponsiveChildren()}
        </StatisticCard.Group>
      ) : (
        <StatisticCard.Group className={styles.staticcardgroup} loading={firstloading && loading}>
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
