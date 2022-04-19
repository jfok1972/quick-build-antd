/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { StaticMasterDetailCard } from '../../components/StaticMasterDetailCard';

export const VActFinishTask: React.FC = () => {
  return (
    <StaticMasterDetailCard
      moduleName="VActFinishTask"
      aggregateField="count.*"
      title="完成审批任务次数"
      detailCount={4}
      unitText="次"
      items={[
        {
          groupField: { fieldname: 'objecttitle' },
          groupTitle: '审批模块',
          otherTitle: '其他模块',
          orderby: 'value',
          orderDesc: true,
        },
        {
          groupField: { fieldname: 'actTaskEndTime', function: 'YYYY年' },
          groupTitle: '任务完成年度',
          otherTitle: '其他年度',
          orderby: 'value',
          orderDesc: true,
        },
        {
          groupField: { fieldname: 'actExecuteTaskName' },
          groupTitle: '任务名称',
          otherTitle: '其他',
          orderby: 'value',
          orderDesc: true,
        },
        {
          groupField: { fieldname: 'actTaskType' },
          groupTitle: '任务处理结果',
          otherTitle: '其他',
          orderby: 'value',
          orderDesc: true,
        },
      ]}
    />
  );
};
