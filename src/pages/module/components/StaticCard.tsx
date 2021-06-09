import { getColumnDataIndex } from '@/pages/datamining/utils';
import request, { API_HEAD } from '@/utils/request';
import { stringifyObjectField } from '@/utils/utils';
import { InfoCircleOutlined } from '@ant-design/icons';
import { StatisticCard } from '@ant-design/pro-card';
import { Tooltip } from 'antd';
import { serialize } from 'object-to-formdata';
import React, { useEffect, useState } from 'react';

const { Statistic } = StatisticCard;

interface StaticCardProps {
  moduleName: string; // 模块名称
  title: string; // 指标名称
  fieldName: string; // 统计的字段名称
  aggregate: 'sum' | 'count'; // 聚合类型;
  description?: string; // 指标的描述，放在右上角的圆形感叹号里
  prefix?: React.ReactNode | string; // 金额前面的符号
  suffix?: React.ReactNode | string; // 金额前面的单位
  icon?: React.ReactNode; // 指标标题前面的图标
  monetary?: any; // 金额单位
  unittext?: string; // 数值单位，个，米
  relatives?: Relative[];
  chart?: {
    type: 'line' | 'area' | 'column'; // 迷你折线图，迷你面积图，迷你柱状图
    sectionType: 'day' | 'week' | 'month' | 'year'; // 分组类型
    maxCount: number; // 迷你图最大的记录个数
  };
}

interface Relative {
  section: 'day' | 'week' | 'month' | 'days';
  sectionDays?: number;
  type: 'whole' | 'beforedays'; // 完整的一个周期 或 从当前天开始往前的周期
  containerToday: boolean; // 同比的最后一天是否包含今天
}

export const StaticCard: React.FC<StaticCardProps> = ({
  moduleName,
  title,
  fieldName,
  aggregate,
  prefix,
  suffix,
  icon,
  description,
}) => {
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const aggregateField = `${aggregate}.${fieldName}`;
  const aggregateFieldName = getColumnDataIndex(aggregateField);

  const getTitle = () => {
    if (description) {
      return (
        <div>
          <span>{title}</span>
          <span style={{ float: 'right' }}>
            <Tooltip title={description} trigger={['click']}>
              <InfoCircleOutlined />
            </Tooltip>
          </span>
        </div>
      );
    }
    return title;
  };

  useEffect(() => {
    setLoading(true);
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName,
          fields: [aggregateField],
        }),
      ),
    }).then((response: any[]) => {
      setTotal(response[0][aggregateFieldName]);
      setLoading(false);
    });
  }, []);

  return (
    <StatisticCard
      loading={loading}
      statistic={{
        title: getTitle(),
        value: total,
        prefix,
        suffix,
        icon,
        description: (
          <div style={{ display: 'flex' }}>
            <Statistic style={{ flex: 1 }} title="日同比" value="6.47%" trend="up" />
            <span></span>
            <Statistic style={{ flex: 1 }} title="日同比" value="6.47%" trend="down" />
          </div>
        ),
      }}
    />
  );
};
