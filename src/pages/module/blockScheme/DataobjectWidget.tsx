import React from 'react';
import { StaticCard } from '../components/StaticCard';
import { applyIf, applyOtherSetting } from '@/utils/utils';
import moment from 'moment';
import { StaticMasterDetailCard } from '../components/StaticMasterDetailCard';
import { AntdCharts } from '../components/antdCharts';
import { Datamining } from '@/pages/datamining';

const numeral = require('numeral');

// 设置一些常用的函数
window.moment = moment;
(window as any).numeral = numeral;

export const DataobjectWidget: React.FC<any> = ({ widget }: { widget: any }) => {
  const params: any = {};
  applyOtherSetting(params, widget.datasetproperty);
  applyOtherSetting(params, widget.relativesproperty);
  applyOtherSetting(params, widget.subfieldsproperty);
  applyOtherSetting(params, widget.chartproperty);
  applyOtherSetting(params, widget.detailsproperty);
  applyOtherSetting(params, widget.othersetting);
  applyIf(params, {
    moduleName: widget.moduleName,
    title: widget.title,
    description: widget.description,
    filterSchemeid: widget.filterSchemeid, // 筛选方案
  });

  if (widget.widgettype === 'staticCard') {
    return <StaticCard {...params} />;
  }
  if (widget.widgettype === 'staticMasterDetailCard') {
    return <StaticMasterDetailCard {...params} />;
  }
  if (widget.widgettype === 'antdCharts') {
    return <AntdCharts {...params} />;
  }
  if (widget.widgettype === 'datamining') {
    return (
      <div className="blocklist">
        <Datamining
          moduleName={widget.moduleName}
          inTab
          defaultSchemeid={widget.dataminingSchememeid}
        />
      </div>
    );
  }
  return <span></span>;
};
