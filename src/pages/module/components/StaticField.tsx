/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useState } from 'react';
import { StatisticCard } from '@ant-design/pro-card';
import { Progress } from 'antd';
import type { MonetaryUnit } from '../grid/monetary';
import { getMonetaryUnitText } from '../grid/monetary';
import { fetchDataminingDataWithCache } from './antdCharts/dataset';

const numeral = require('numeral');

const { Statistic } = StatisticCard;

export interface StaticFieldProps {
  moduleName: string; // 模块名称
  title: string; // 指标名称
  fieldName: string; // 统计的字段名称
  aggregate?: 'sum' | 'count' | 'avg' | 'max' | 'min'; // 聚合类型;
  filters?: any[]; // 查询的条件
  userfilters?: any[];
  formatPattern?: string; // 数值format样式, 默认 0,000 , 0.000.00
  prefix?: React.ReactNode | string; // 金额前面的符号
  suffix?: React.ReactNode | string; // 金额前面的单位
  monetaryUnit?: MonetaryUnit | number;
  unitText?: string; // 数值单位，个，米，万元。
  addRatio?: boolean; // 是否加入和总计的比例
  total?: number; // 如果要加入比例，这是总计数
  value?: number; // 传入的已经计算好的数据，直接显示即可
  callback?: Function; // 生成数据后的回调函数
}

export const StaticField: React.FC<StaticFieldProps> = ({
  moduleName,
  title,
  fieldName,
  aggregate,
  filters,
  userfilters,
  formatPattern = '0,000',
  prefix,
  suffix,
  monetaryUnit = 1,
  unitText = '',
  addRatio,
  value,
  total,
  callback,
}) => {
  const [data, setData] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const aggregateField = aggregate ? `${aggregate}.${fieldName}` : fieldName;
  useEffect(() => {
    if (value) {
      setData(value);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchDataminingDataWithCache({
      moduleName,
      fields: [aggregateField],
      navigatefilters: filters,
      userfilters,
      isnumberordername: true,
    }).then(async (response: any) => {
      if (callback) callback(response);
      setData(response[0].jf001);
      setLoading(false);
    });
  }, [userfilters]);

  return (
    <div style={{ display: 'flex' }} className="staticfield">
      <Statistic
        title={[prefix, title, suffix]}
        value={
          loading
            ? ' '
            : `${numeral(data / monetaryUnit).format(formatPattern)}${getMonetaryUnitText(
                monetaryUnit,
                unitText,
              )}`
        }
      />
      {/* 防止 99.99% 显示成 100% */}
      {addRatio && total ? (
        <Progress
          percent={numeral(Math.floor((data / total) * 1000) / 10).format('0.0')}
          style={{ padding: '0px 12px', flex: 1 }}
        />
      ) : null}
    </div>
  );
};
