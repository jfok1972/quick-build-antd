/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { BlockSchemes } from '@/pages/module/blockScheme';
import { systemInfo } from '@/models/systeminfo';
import type { CardProps } from 'antd';
import { Card } from 'antd';
import { PmCharts } from '../charts/pm';
import { AbcgateCharts } from '../charts/abcgate';

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

  return (
    <div style={{ margin: '-24px' }}>
      <BlockSchemes type="01" />
      {/* <UserApprove /> */}
    </div>
  );
};
