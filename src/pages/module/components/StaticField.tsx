import { getColumnDataIndex } from '@/pages/datamining/utils';
import request, { API_HEAD } from '@/utils/request';
import { stringifyObjectField } from '@/utils/utils';
import { StatisticCard } from '@ant-design/pro-card';
import { serialize } from 'object-to-formdata';
import React, { useEffect, useState } from 'react';
import type { MonetaryUnit } from '../grid/monetary';
import { getMonetaryUnitText } from '../grid/monetary';

const numeral = require('numeral');

const { Statistic } = StatisticCard;

export interface StaticFieldProps {
  moduleName: string; // 模块名称
  title: string; // 指标名称
  fieldName: string; // 统计的字段名称
  aggregate?: 'sum' | 'count' | 'avg' | 'max' | 'min'; // 聚合类型;
  filters?: any[]; // 查询的条件
  formatPattern?: string; // 数值format样式, 默认 0,000 , 0.000.00
  prefix?: React.ReactNode | string; // 金额前面的符号
  suffix?: React.ReactNode | string; // 金额前面的单位
  monetaryUnit?: MonetaryUnit;
  unitText?: string; // 数值单位，个，米，万元。
}

export const StaticField: React.FC<StaticFieldProps> = ({
  moduleName,
  title,
  fieldName,
  aggregate,
  filters,
  formatPattern = '0,000',
  prefix,
  suffix,
  monetaryUnit = 1,
  unitText = '',
}) => {
  const [data, setData] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const aggregateField = aggregate ? `${aggregate}.${fieldName}` : fieldName;
  const aggregateFieldName = getColumnDataIndex(aggregateField);

  useEffect(() => {
    setLoading(true);
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName,
          fields: [aggregateField],
          navigatefilters: filters,
        }),
      ),
    }).then(async (response: any[]) => {
      setData(response[0][aggregateFieldName]);
      setLoading(false);
    });
  }, []);

  return (
    <Statistic
      title={[prefix, title, suffix]}
      value={
        loading
          ? ''
          : `${numeral(data / monetaryUnit).format(formatPattern)}${getMonetaryUnitText(
              monetaryUnit,
              unitText,
            )}`
      }
    />
  );
};
