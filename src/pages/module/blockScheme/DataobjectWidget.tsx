/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { StaticCard } from '../components/StaticCard';
import { apply, applyIf, applyOtherSetting } from '@/utils/utils';
import moment from 'moment';
import { StaticMasterDetailCard } from '../components/StaticMasterDetailCard';
import { AntdCharts } from '../components/antdCharts';
import { Datamining } from '@/pages/datamining';
import { AntdVS2Sheet } from '@/pages/module/components/sheetComponent';

const numeral = require('numeral');

// 设置一些常用的函数
(window as any).moment = moment;
(window as any).numeral = numeral;
(window as any).apply = apply;
(window as any).applyIf = applyIf;

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
    dataminingSchememeid: widget.dataminingSchememeid, // 查询方案，可以供 AntdVS2Sheet 使用
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
  if (widget.widgettype === 'antv/s2') {
    return <AntdVS2Sheet {...params} />;
  }
  if (widget.widgettype === 'datamining') {
    if (!params.dataminingProps)
      params.dataminingProps = {
        inContainer: true,
        onlyTable: false,
        disableOperate: false,
        disableSchemeButton: false,
      };
    return (
      <div className="blocklist">
        <Datamining
          moduleName={widget.moduleName}
          defaultSchemeid={widget.dataminingSchememeid}
          dataminingProps={params.dataminingProps}
        />
      </div>
    );
  }
  return <span />;
};
