/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { useState } from 'react';
import { SheetComponent } from '@antv/s2-react';
import '@antv/s2-react/dist/style.min.css';
import { useEffect } from 'react';
import request, { API_HEAD } from '@/utils/request';
import { apply, applyIf } from '@/utils/utils';
import { DataCell } from '@antv/s2';
import { Card, Radio } from 'antd';
import type { MonetaryType } from '../../grid/monetary';
import { getMonetary, getMonetarysValueText } from '../../grid/monetary';
import type { TextValue } from '../../data';

const numeral = require('numeral');

const s2Palette = {
  // --------- basic colors -----------
  basicColors: [
    '#000000', // 表头前景色
    '#FAFAFB', // category背景色
    '#F4F5F7', // 选中单元格和联动的背景色
    '#F3F4F6', // 表头背景色
    '#E7E8EA', // 选中单元格的表头联动背景色
    '#CECFD1', //
    '#A9AAAB', //
    '#616162', // resize 颜色
    '#FFFFFF', // 偶数行背景色
    '#F0F0F0', // 数据区边框线颜色
    '#E8E6E6', // 表头区边框线颜色
    '#D1D4DC', // category和数据区分隔线颜色
    '#BEC2CB', // 表头区和数据区分隔线颜色
    '#282B33', // 数值前景色
    '#121826', // category前景色
  ],
  // ---------- semantic colors ----------
  semanticColors: {
    red: '#FF4D4F',
    green: '#29A294',
  },
};

const getDefaultConditions = (dataCfg: any) => {
  const meta: any[] = dataCfg.meta || [];
  const options: any = {
    text: [],
    background: [],
  };
  const texts: string[] = [];
  meta.forEach((field: any) => {
    if ((field.field as string).startsWith('text')) {
      texts.push(field.field);
    }
  });
  // 是否在data中有所有的text值，有的话就是明细数据，缺一个就是汇总或者分类汇总数据
  const hasTextValue = (data: any) => {
    let hasValue = true;
    texts.forEach((element) => {
      hasValue = hasValue && data[element];
    });
    return hasValue;
  };
  meta.forEach((field: any) => {
    if ((field.field as string).startsWith('jf')) {
      // 数值指标
      options.text.push({
        field: field.field,
        mapping(fieldValue: any, data: any) {
          if (!fieldValue || (data && hasTextValue(data))) {
            return {
              fill: '#0050b3', // 明细单元格
            };
          } else {
            return {
              fill: '#003a8c', // 总计和小计单元格
            };
          }
        },
      });
      options.background.push({
        field: field.field,
        mapping: (fieldValue: any, data: any) => {
          if (!fieldValue || (data && hasTextValue(data)))
            return {
              fill: '#ffffff', // 明细单元格
            };
          else
            return {
              fill: '#f8f9ff', // 总计和小计单元格"#f8f9ff"
            };
        },
      });
    }
  });
  return options;
};

/**
 * 根据数据分析的数据生成的 Block Sheet , 用于定义好的数据，不可以进行展开等交互操作
 * @returns
 */
export const AntdVS2Sheet = (params: any) => {
  const { disableMonetary: globalDisableMonerary } = params; // 是否全部禁用金额单位
  const [loading, setLoading] = useState<boolean>(true);
  const [monetary, setMonetary] = useState<MonetaryType>(
    getMonetary(globalDisableMonerary ? 'unit' : 'tenthousand'),
  );
  const [dataCfg, setDataCfg] = useState<any>(params.dataCfg || {});

  const options: any = { ...params.options };

  apply(options, {
    dataCell: (viewMeta: any) => {
      const { dataCfg: userDataCfg } = viewMeta.spreadsheet;
      const { fieldValue, valueField } = viewMeta;
      const meta: any = (userDataCfg.meta as any[]).filter((m) => m.field === valueField)[0];
      if (fieldValue !== null && fieldValue !== undefined) {
        let value = fieldValue;
        if (!globalDisableMonerary && !meta.disableMonetary) {
          value /= monetary.monetaryUnit;
        }
        value = numeral(value).format(meta.valueFormatter || '0,0.00');
        if (!globalDisableMonerary && !meta.disableMonetary) {
          value = `${value} ${monetary.monetaryText}`;
        }
        apply(viewMeta, {
          fieldValue: value,
        });
      }
      return new DataCell(viewMeta, viewMeta?.spreadsheet);
    },
  });
  // 单元格的默认值，如果未设置conditions,则使用默认值
  if (!options.conditions) {
    apply(options, { conditions: getDefaultConditions(params.dataCfg) });
  }
  applyIf(options, {
    height: 480,
  });
  useEffect(() => {
    setTimeout(() => {
      request(`${API_HEAD}/platform/datamining/fetchpivotdata.do`, {
        method: 'GET',
        params: {
          schemeid: params.dataminingSchememeid,
          addTotal: !!params.addTotal,
        },
      }).then((response) => {
        setLoading(false);
        setDataCfg({ ...dataCfg, data: response });
      });
    }, 100);
  }, []);

  return (
    <Card
      title={params.title}
      extra={
        globalDisableMonerary ? null : (
          <Radio.Group
            value={monetary.type}
            size="small"
            onChange={(e: any) => {
              setMonetary(getMonetary(e.target.value));
            }}
          >
            {getMonetarysValueText().map((rec: TextValue) => (
              <Radio.Button key={rec.value} value={rec.value}>
                {rec.text}
              </Radio.Button>
            ))}
          </Radio.Group>
        )
      }
    >
      <SheetComponent
        dataCfg={dataCfg}
        options={options}
        header={params.header}
        // 宽度自适应，高度设置
        adaptive={{ width: true, height: false }}
        themeCfg={{ palette: s2Palette }}
        loading={loading}
      />
    </Card>
  );
};

/**
const params = {
  disableMonetary: true, // 所有列都禁用金额单位
  dataCfg: {
    fields: {
      columns: ['text1'], // 列字段
      rows: ['text3'], // 行字段
      values: ['jf001', 'jf002'], // 值字段
      valueInCols: true, // 值在列上，为false,则值在行上
    },
    meta: [
      {
        field: 'text1',
        name: '年度',
      },
      {
        field: 'text3',
        name: '部门',
      },
      {
        field: 'jf001',
        name: '下达金额',
        valueFormatter: '0,', // 数值格式 0,0.00 , 0 ,默认为 '0,'
        disableMonetary: true, // 禁用金额单位,默认为false
      },
      {
        field: 'jf002',
        name: '使用金额',
        valueFormatter: '0,',
        disableMonetary: true,
      },
    ],
  },
};
*/
