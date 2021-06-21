import React, { useEffect, useState } from 'react';
import request, { API_HEAD } from '@/utils/request';
import { apply, stringifyObjectField, uuid } from '@/utils/utils';
import { StatisticCard } from '@ant-design/pro-card';
import { serialize } from 'object-to-formdata';
import RcResizeObserver from 'rc-resize-observer';
import { getColumnDataIndex } from '@/pages/datamining/utils';
import { Badge, Progress, Tooltip } from 'antd';
import styles from './StaticMasterDetailCard.less';
import type { MonetaryUnit } from '../grid/monetary';
import { getMonetaryUnitText } from '../grid/monetary';
import { InfoCircleOutlined } from '@ant-design/icons';

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
  maxColCount?: number; // 每行最多显示几列，默认为4
  formatPattern?: string; // 数值format样式, 默认 0,000 , 0.000.00
  monetaryUnit?: MonetaryUnit;
  unitText?: string; // 数值单位，个，米，万元。
  filters?: any[];
  description?: any;
  items: CardCategoryProps[];
}

// 可以有多个选项，在总计里面呆以进行选择
interface CardCategoryProps {
  groupField: any; // 分组的字段  { fieldname : dotype} ,
  groupTitle: string; // 指标名称
  otherTitle?: string;
  detailCount?: number; // 明细里面个数，超过的全部放在其他里, 如果没设置，使用上面的
  description?: string; // 汇总指标的描述
  orderby?: 'text' | 'value' | 'code'; // 按什么排序,对于有序的如数据字典，可以按code排序
  orderDesc?: boolean; // 排序顺序
  detailCallback?: Function; // detail数据获取后的回调
}

export const StaticMasterDetailCard: React.FC<StaticMasterDetailCardProps> = ({
  moduleName,
  aggregateField,
  detailCount,
  maxColCount = 4,
  formatPattern = '0,000',
  monetaryUnit = 1,
  unitText = '',
  title,
  description,
  filters,
  items,
}) => {
  const aggregateFieldName = getColumnDataIndex(aggregateField);
  const [colCount, setColCount] = useState<number>(maxColCount);
  const [loading, setLoading] = useState<boolean>(true);
  const [firstloading, setFirstloading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [detailData, setDetailData] = useState<TextValue[]>([]);
  const [itemIndex, setItemIndex] = useState<number>(0);
  const getValueText = (value: number) => {
    return (
      numeral(value / monetaryUnit).format(formatPattern) +
      getMonetaryUnitText(monetaryUnit, unitText)
    );
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
      const detailMaxCount = items[itemIndex].detailCount || detailCount;
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
      if (detailArray.length > detailMaxCount) {
        let restCount = 0;
        const other: TextValue = {
          text: items[itemIndex].otherTitle || '其他',
          value: 0,
          percent: 0,
        };
        detailArray
          .filter((rec, order) => order >= detailMaxCount - 1)
          .forEach((rec) => {
            other.value += rec.value;
            restCount += 1;
          });
        other.text += `(${restCount}个)`;
        detailArray.splice(detailMaxCount - 1, detailArray.length - detailMaxCount + 1, other);
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
      key={uuid()}
      className={styles.staticcard}
      statistic={{
        title: (
          <div>
            {[
              title,
              items.length > 1 ? (
                <span key={uuid()} style={{ marginLeft: '16px' }}>
                  {items.map((item, index) => (
                    <Tooltip key={uuid()} title={item.groupTitle} placement="bottom">
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
                  ))}
                </span>
              ) : null,
              description ? (
                <span style={{ float: 'right' }}>
                  <Tooltip title={description} trigger={['click']}>
                    <InfoCircleOutlined />
                  </Tooltip>
                </span>
              ) : null,
            ]}
          </div>
        ),
        value: getValueText(total),
        description: <div>{[items[itemIndex].description]}</div>,
      }}
    />
  );
  const getDetailCard = (detail: TextValue) => (
    <StatisticCard
      key={uuid()}
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

  const getTwoColChildren = () => {
    const children: any[] = [];
    if (detailData.length % 2 === 1) {
      // 如果有奇数个，则总计和第一个在一起
      children.push(
        <StatisticCard.Group key={uuid()}>
          {getSumCard()}
          <Divider type="vertical" />
          {getDetailCard(detailData[0])}
        </StatisticCard.Group>,
      );
      for (let i = 0; i < (detailData.length - 1) / 2; i += 1) {
        children.push(
          <StatisticCard.Group key={uuid()}>
            {getDetailCard(detailData[i * 2 + 1])}
            <Divider type="vertical" />
            {getDetailCard(detailData[i * 2 + 2])}
          </StatisticCard.Group>,
        );
      }
    } else {
      // 有偶数个，总计占一行
      children.push(<StatisticCard.Group key={uuid()}>{getSumCard()}</StatisticCard.Group>);
      for (let i = 0; i < detailData.length / 2; i += 1) {
        children.push(
          <StatisticCard.Group key={uuid()}>
            {getDetailCard(detailData[i * 2])}
            <Divider type="vertical" />
            {getDetailCard(detailData[i * 2 + 1])}
          </StatisticCard.Group>,
        );
      }
    }
    for (let i = children.length - 1; i > 0; i -= 1) {
      children.splice(i, 0, <Divider type="horizontal" />);
    }
    return children;
  };

  /**
   * 总数超过了总列，并且不是2列的
   * @returns
   */
  const getMultRowChildren = () => {
    const children: any[] = [];
    const allArray: any[] = [getSumCard(), ...detailData.map((detail) => getDetailCard(detail))];
    const row: any[] = [];
    for (let i = 0; i < allArray.length; i += 1) {
      const rownumber: number = Math.trunc(i / maxColCount);
      if (row.length < rownumber + 1) row.push([]);
      row[rownumber].push(allArray[i]);
    }
    for (let i = 0; i < row.length; i += 1) {
      children.push(
        <StatisticCard.Group key={uuid()}>
          {(row[i] as any[]).map((item, index, array) => [
            item,
            index === array.length - 1 ? null : <Divider type="vertical" />,
          ])}
        </StatisticCard.Group>,
      );
    }
    for (let i = children.length - 1; i > 0; i -= 1) {
      children.splice(i, 0, <Divider key={uuid()} type="horizontal" />);
    }
    return children;
  };

  let children;
  if (colCount === 2 && detailData.length > 1) {
    children = (
      <StatisticCard.Group
        className={styles.staticcardgroup}
        direction="column"
        loading={firstloading && loading}
      >
        {getTwoColChildren()}
      </StatisticCard.Group>
    );
  } else if (colCount !== 1 && detailData.length >= maxColCount) {
    children = (
      <StatisticCard.Group
        className={styles.staticcardgroup}
        loading={firstloading && loading}
        direction="column"
      >
        {getMultRowChildren()}
      </StatisticCard.Group>
    );
  } else {
    children = (
      <StatisticCard.Group
        className={styles.staticcardgroup}
        loading={firstloading && loading}
        direction={colCount === 1 ? 'column' : 'row'}
      >
        {getSumCard()}
        {detailData.length ? <Divider type={colCount === 1 ? 'horizontal' : 'vertical'} /> : null}
        {detailData.map((detail, index) => [
          getDetailCard(detail),
          index === detailData.length - 1 ? null : (
            <Divider type={colCount === 1 ? 'horizontal' : 'vertical'} />
          ),
        ])}
      </StatisticCard.Group>
    );
  }

  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        if (offset.width < 480) setColCount(1);
        else if (offset.width < 992) setColCount(2);
        else setColCount(maxColCount);
      }}
    >
      {children}
    </RcResizeObserver>
  );
};
