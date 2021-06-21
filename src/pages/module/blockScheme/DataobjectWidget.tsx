import React from 'react';
import { StaticCard } from '../components/StaticCard';
import { applyIf, applyOtherSetting } from '@/utils/utils';
import moment from 'moment';

// 设置一些常用的函数
window.moment = moment;

export const DataobjectWidget: React.FC<any> = ({ widget }: { widget: any }) => {
  const params: any = {};
  applyOtherSetting(params, widget.datasetproperty);
  applyOtherSetting(params, widget.relativesproperty);
  applyOtherSetting(params, widget.subfieldsproperty);
  applyOtherSetting(params, widget.chartproperty);
  applyIf(params, {
    moduleName: widget.moduleName,
    description: widget.description,
  });

  if (widget.widgettype === 'staticCard') {
    return <StaticCard {...params} />;
  }

  return <span></span>;
};
