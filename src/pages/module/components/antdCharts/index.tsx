import React, { useState, useMemo, useEffect } from 'react';
import { Card, Tooltip } from 'antd';
import type { MonetaryUnit } from '../../grid/monetary';
import { getMonetaryUnitText } from '../../grid/monetary';
import { Area, Bar, Column, Line, Pie, Rose } from '@ant-design/charts';
import { apply, uuid } from '@/utils/utils';
import { getDataSet } from './dataset';
import styles from './index.less';
import { InfoCircleOutlined } from '@ant-design/icons';

const numeral = require('numeral');

interface AntdChartsProps {
  type: 'line' | 'area' | 'column' | 'bar' | 'pie' | 'rose' | 'dualAxes' | 'gauge';
  title: string;
  description?: string;
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
  categoryName: string; // 第一个指标的名称，默认为text，可以用中文作为字段名称
  groupfieldid2?: string; // 第二个指标的字段定义
  categoryName2?: string; // 第二个指标的名称，可以用中文作为字段名称
  filters?: any[]; // 查询的条件
  maxCount?: number; // 最大的记录个数
  otherTitle?: string; // 剩余的所有的描述,如果没有设置otherTitle,则后面的全部删除
  orderby?: 'text' | 'code' | any; // 按什么排序,对于有序的如数据字典，可以按code排序 , 或者第一个数值 jf001
  orderDesc?: boolean; // 排序顺序
  callback?: Function; // 数据获取后的回调函数
}

export const AntdCharts: React.FC<AntdChartsProps> = ({
  type,
  title,
  description,
  datasetProperty,
  config,
}) => {
  const [dataSet, setDataSet] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    setLoading(true);
    getDataSet(datasetProperty).then((response: any) => {
      setDataSet(response);
      setLoading(false);
    });
  }, []);

  const chartConfig = useMemo(() => {
    const cConfig: any = { ...config };
    apply(cConfig, {
      data: dataSet,
      appendPadding: 12,
      loading,
      type,
    });
    // 如果没有定义,则设置一个缺省的
    if (cConfig.tooltip === undefined) {
      const field_1 = datasetProperty.fields[0];
      cConfig.tooltip = {
        showTitle: false,
        formatter: (datum: any) => {
          return {
            name: datum[datasetProperty.categoryName],
            value:
              numeral(datum[field_1.title] / (field_1.monetaryUnit || 1)).format(
                field_1.formatPattern || '0',
              ) + getMonetaryUnitText(field_1.monetaryUnit, field_1.unitText),
          };
        },
      };
    }
    if (cConfig.label === undefined) {
      cConfig.label = {
        formatter: (datum: any) => {
          const field_1 = datasetProperty.fields[0];
          return (
            numeral(datum[field_1.title] / (field_1.monetaryUnit || 1)).format(
              field_1.formatPattern || '0',
            ) + getMonetaryUnitText(field_1.monetaryUnit)
          );
        },
      };
    }
    return cConfig;
  }, [config, loading, dataSet]);

  console.log('render chart');
  console.log(datasetProperty);
  return (
    <Card
      className={styles.imagecard}
      title={
        <span>
          {[
            title,
            description ? (
              <Tooltip key={uuid()} title={description} trigger={['click']}>
                <InfoCircleOutlined className={styles.infoicon} />
              </Tooltip>
            ) : null,
          ]}
        </span>
      }
      bordered={false}
    >
      {type === 'column' ? <Column {...chartConfig} /> : null}
      {type === 'bar' ? <Bar {...chartConfig} /> : null}
      {type === 'line' ? <Line {...chartConfig} /> : null}
      {type === 'area' ? <Area {...chartConfig} /> : null}
      {type === 'pie' ? <Pie {...chartConfig} /> : null}
      {type === 'rose' ? <Rose {...chartConfig} /> : null}
    </Card>
  );
};
