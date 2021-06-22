import React, { useState, useMemo, useEffect } from 'react';
import { Card } from 'antd';
import type { MonetaryUnit } from '../../grid/monetary';
import { Column } from '@ant-design/charts';
import { apply } from '@/utils/utils';
import { getDataSet } from './dataset';

interface AntdChartsProps {
  type: 'line' | 'area' | 'column' | 'bar' | 'pie' | 'dualAxes' | 'gauge';
  datasetProperty: DataSetProps; // 可以有二个dataSet
  config: any;
}

/**
 * 每一个聚合字段的设置
 */
interface AggregateFieldProps {
  fieldname: string; // 聚合字段的设置'count.*','sum.amount'
  title: string; // 指标的描述
  monetaryUnit?: MonetaryUnit; // 指标的数值单位
  formatPattern?: string; // 数值format样式, 默认 0,000 , 0.000.00
  unitText?: string; // 数值单位，个，米，万元。
}

export interface DataSetProps {
  moduleName: string; // 模块名称
  fields: AggregateFieldProps[]; // 聚合字段 ['count.*','sum.amount']
  groupfieldid: string; // 第一个指标的定义
  categoryName?: string; // 第一个指标的名称，默认为text，可以用中文作为字段名称
  groupfieldid2?: string; // 第二个指标的字段定义
  categoryName2?: string; // 第二个指标的名称，可以用中文作为字段名称
  filters?: any[]; // 查询的条件
  maxCount?: number; // 迷你图最大的记录个数
  orderby?: 'text' | 'value' | 'code'; // 按什么排序,对于有序的如数据字典，可以按code排序
  orderDesc?: boolean; // 排序顺序
  callback?: Function; // 数据获取后的回调函数
}

export const AntdCharts: React.FC<AntdChartsProps> = ({ type, datasetProperty, config }) => {
  const [dataSet, setDataSet] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    setLoading(true);
    getDataSet(datasetProperty).then((response: any) => {
      setDataSet(response);
    });
    setLoading(false);
  }, []);

  const chartConfig = useMemo(() => {
    const cConfig = { ...config };
    apply(cConfig, {
      data: dataSet,
      appendPadding: 12,
      loading,
      type,
    });
    return cConfig;
  }, [config, loading, dataSet]);

  console.log('render chart');
  console.log(datasetProperty);
  return (
    <Card bordered={false}>
      <Card
        bordered={false}
        style={{ padding: 0, margin: 0 }}
        bodyStyle={{ padding: '12px 0 0 0', margin: 0 }}
      >
        <Column {...chartConfig} />
      </Card>
    </Card>
  );
};
