/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { Table } from 'antd';
import { floatRender, integerRender } from '@/pages/module/grid/columnRender';

interface DataTableProps {
  data: any[];
  unitText?: string; // 金额单位，万，亿
  typeTitle?: string; // 指标列的标题
  valueTitle?: string; // 数值列的标题
}

/**
 * 分析图表的值的显示Table,只有二列，指标列和数值列
 * @param param0
 */
const DataTable: React.FC<DataTableProps> = ({ data, unitText, typeTitle, valueTitle }) => {
  const dataSource = data.map((rec, index) => ({ ...rec, key: index + 1 }));
  const columns: any[] = [
    {
      dataIndex: 'key',
      key: 'key',
      title: '序号',
      align: 'center',
    },
    {
      dataIndex: 'type',
      key: 'type',
      title: typeTitle || '指标项目',
    },
    {
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      title: valueTitle || '指标值',
      render: (value: any) => (
        <span>
          {unitText === '个' ? integerRender(value) : floatRender(value, undefined)}
          {unitText ? (
            <span style={{ color: 'green', paddingLeft: '4px' }}>{unitText}</span>
          ) : (
            <></>
          )}
        </span>
      ),
    },
  ];

  return (
    <Table
      size="small"
      pagination={{ pageSize: 6, hideOnSinglePage: true }}
      style={{ height: '120px' }}
      columns={columns}
      dataSource={dataSource}
    />
  );
};

export default DataTable;
