/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { Card } from 'antd';
import type { CardProps } from 'antd/lib/card';
import { systemInfo } from '@/models/systeminfo';
import Monitor from '../monitor';
import { PmCharts } from './pm';
import { AbcgateCharts } from './abcgate';

// 图像Col的列数
export const chartsColSpan: any = {
  xs: 24,
  sm: 24,
  md: 24,
  lg: 12,
  xl: 12,
  xxl: 12,
};

export const staticColSpan: any = {
  xs: 24,
  sm: 12,
  md: 12,
  lg: 12,
  xl: 6,
  xxl: 6,
};

export default (): React.ReactNode => {
  const cardProps: CardProps = {
    bordered: false,
    bodyStyle: {
      padding: '0px 0px 16px 0px',
      margin: '0px 16px 16px',
    },
    style: {
      margin: '-8px',
    },
  };

  // 不同系统可以在此设置显示不同的图表页
  if (systemInfo.systeminfo.systemkey === 'pm') {
    return (
      <Card {...cardProps}>
        {/* 工程管理系统的图表 */}
        <PmCharts />
      </Card>
    );
  }

  if (systemInfo.systeminfo.systemkey === 'abcgate') {
    return (
      <Card {...cardProps}>
        {/* abcgate的图表 */}
        <AbcgateCharts />
      </Card>
    );
  }

  // 默认返回Monitor中的定义
  return <Monitor />;
};
