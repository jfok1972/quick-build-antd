/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { useContext } from 'react';
import { DetailDrawerContext } from '.';
import { getRecordAllCondition } from '../schemeUtils';
import { CellModuleDetailPopover } from './CellModuleDetail';

/**
 * 数据分析单元格的处理，可以选择弹出式窗口中显示记录明细，也可以用抽屉式向上展开
 * @param param0
 * @returns
 */

export const DataminingDataCell = ({
  isDataCell,
  column,
  record,
  children,
  ...restProps
}: {
  isDataCell: boolean;
  column: any;
  record: any;
  children: any;
  restProps: any;
}) => {
  const context = useContext(DetailDrawerContext);
  if (isDataCell && record[column.dataIndex]) {
    if (1 > 2) {
      // 显示在弹出式窗口中
      const parentConditions: string[] = [];
      getRecordAllCondition(record, parentConditions); // 行的递归条件
      if (column.condition) parentConditions.push(column.condition); // 列的条件, 以|||分隔每层
      return (
        <CellModuleDetailPopover conditions={parentConditions}>
          <td {...restProps}>
            <span style={{ cursor: 'pointer' }}>{children}</span>
          </td>
        </CellModuleDetailPopover>
      );
    }
    //  显示在底层的Drawer中
    return (
      <td {...restProps}>
        <span
          style={{ cursor: 'pointer' }}
          onDoubleClick={() => {
            const parentConditions: string[] = [];
            getRecordAllCondition(record, parentConditions); // 行的递归条件
            if (column.condition) parentConditions.push(column.condition); // 列的条件, 以|||分隔每层
            context.setDetailDrawerProps({ visible: true, conditions: parentConditions });
          }}
        >
          {children}
        </span>
      </td>
    );
  }
  return <td {...restProps}>{children}</td>;
};
