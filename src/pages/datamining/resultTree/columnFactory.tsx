/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { apply } from '@/utils/utils';
import {
  dateRender,
  datetimeRender,
  integerRender,
  monetaryRender,
  percentRenderWithTooltip,
} from '@/pages/module/grid/columnRender';
import { getSortOrder } from '@/pages/module/grid/sortUtils';
import { fieldTitleTransform, getColumnDataIndex } from '../utils';
import styles from '../index.less';
import type { ColumnGroupModal, DataminingModal, FieldModal } from '../data';
import { categoryFieldRender } from './categoryFieldRender';
import { PARENT_ROWID, ROWID, TEXTUNDERLINE } from '../constants';
import { adjustColumnGroupToggleButton } from './columnUtils';
import { getLeafColumns } from '@/pages/module/moduleUtils';

const groupText = '分 组 项 目';

const updateColumnsToChildren = (columns: any[]): any[] => {
  columns.forEach((column) => {
    const col = column;
    if (col.columns) {
      col.children = col.columns;
      delete col.columns;
      updateColumnsToChildren(col.children);
    }
  });
  return columns;
};

const getColumnText = (column: any, state: DataminingModal) => {
  let text = column[TEXTUNDERLINE] || column.text;
  const { unittext } = column;
  const agg = column.aggregate;
  const { ismonetary } = column;
  if (!text) text = '未定义';
  let result: string = text.replace(new RegExp('--', 'gm'), '<br/>');
  if (agg === 'sum' || agg === 'avg' || agg === 'max' || agg === 'min') {
    let mtext = '';
    if (ismonetary && state.monetaryPosition === 'columntitle') {
      mtext = state.monetary.unittext === '个' ? '' : state.monetary.unittext;
    }
    if (mtext || unittext) {
      // 如果最后一行只有2个字，那不要加<br/>
      const array: string[] = result.split('<br/>');
      if (array[array.length - 1].length > 2) result += '<br/>';
      result += `<span style="color:green;">(${mtext}${unittext || ''})</span>`;
    }
  }
  return result;
};

const setColumnXtypeAndDataIndex = (acolumn: any, state: DataminingModal) => {
  const column = acolumn;
  let t = column.fieldtype;
  if (typeof t === 'string') {
    t = t.toLowerCase();
  }
  // 生成列的字段名称
  column.dataIndex = getColumnDataIndex(column.aggregatefieldname, column.condition);
  // 当生成 cell的时候的附加属性，用于显示该单元格的明细数据，见 resultTree--index.tsx中的 components--body--cell
  column.onCell = (record: any) => ({
    record,
    column,
    isDataCell: true,
  });
  column.sorter = true;
  column.sortDirections = ['ascend', 'descend', 'ascend'];
  column.sortOrder = getSortOrder(state.schemeState.sorts, column.dataIndex);
  // 所有底层的聚合字段加入dataindex
  const agg = column.aggregatefieldname.substr(0, column.aggregatefieldname.indexOf('.'));
  column.aggregateType = agg;
  if (column.text) {
    // 对有些相对字段进行处理，比如 下01个月，前01个月等
    column[TEXTUNDERLINE] = fieldTitleTransform(column.text);
    column.menuText = column.text.replace(new RegExp('--', 'gm'), '');
    column.title = fieldTitleTransform(column.text.replace(new RegExp('--', 'gm'), '<br/>'));
    // column.title = getColumnText(column);
  }
  // const addCountSumPercent = me.getController().getViewModel().isAddCountSumPercent();
  // 加入tooltip 分子和分母
  if (agg === 'wavg') {
    apply(column, {
      align: 'center',
      render: (value: number, record: object) =>
        percentRenderWithTooltip(
          value,
          record[`${column.dataIndex}1`],
          record[`${column.dataIndex}2`],
        ),
      minWidth: 60,
      filter: 'number',
      width: 110,
    });
  } else if (agg === 'count') {
    // 如果是count 那么 ismonetary unittext 都无效
    delete column.ismonetary;
    delete column.unittext;
    apply(column, {
      align: 'right',
      tdCls: 'intcolor',
      format: '#',
      render: integerRender,
      filter: 'number',
    });
  } else if (
    (agg === 'max' || agg === 'min') &&
    (t === 'date' || t === 'datetime' || t === 'timestamp')
  ) {
    apply(column, {
      align: 'center',
      xtype: 'datecolumn',
      render: t === 'date' ? dateRender : datetimeRender,
    });
  } else if (agg === 'sum' || agg === 'avg' || agg === 'max' || agg === 'min') {
    if (agg === 'sum') {
      apply(column, {
        align: 'right',
        // renderer: addCountSumPercent ? (column.ismonetary ? Ext.util.Format.aggregateSumRenderer : Ext.util.Format.aggregateSumFloatRenderer) : (column.ismonetary ? Ext.util.Format.monetaryRenderer : Ext.util.Format.floatRenderer),
        filter: 'number',
      });
    } else {
      apply(column, {
        align: 'right',
        // renderer: column.ismonetary ? Ext.util.Format.monetaryRenderer : Ext.util.Format.floatRenderer,
        filter: 'number',
      });
    }
    if (column.fieldtype && (column.fieldtype as string).toLowerCase() === 'integer') {
      apply(column, {
        // 整数平均值会有小数部分
        render: (value: number) => integerRender(Math.round(value || 0)),
      });
    }
    if (column.ismonetary) {
      column.render = (value: number, record: object, _recno: number) =>
        monetaryRender(value, record, _recno, state, undefined);
    }
  }
};

// 对树形结构的每一级加入uuid,上一级为101开始，下一级为 101-101,以此类推
const addRowidToTree = (columns: any[], parentId: string, firstCount: number) => {
  let rowidCount = firstCount;
  columns.forEach((acolumn) => {
    const column = acolumn;
    column[PARENT_ROWID] = parentId;
    column[ROWID] = parentId + (parentId && '-') + rowidCount;
    rowidCount += 1;
    if (column.children) addRowidToTree(column.children, column[ROWID], firstCount);
  });
};

const adjustCloneGroupColumns = (cloneGroupColumns: any[], state: DataminingModal) => {
  cloneGroupColumns.forEach((col) => {
    const colu = col;
    if (!colu.isCategory && !colu.onHeaderCell) {
      // 传递参数给 DragDropHeaderCell
      colu.onHeaderCell = (column: any) => ({ column });
    }
    if (colu.children) colu.style = 'background-color:#f6f5ec;';
    else colu.style = 'background-color:#fffef9;';
    if (colu.isCategory) {
      // eslint-disable-next-line
    } else if (colu.children) {
      delete colu.width;
      adjustCloneGroupColumns(colu.children, state);
      colu.className = styles.parentcolumnheader;
      colu.title = (
        // eslint-disable-next-line
        <span dangerouslySetInnerHTML={{ __html: fieldTitleTransform(colu.text) }} />
      );
    } else {
      if (!colu.className) colu.className = styles.leafcolumnheader;
      colu.title = (
        <span
          className={styles.columnheader}
          // eslint-disable-next-line
          dangerouslySetInnerHTML={{ __html: getColumnText(colu, state) }}
        />
      );
    }
  });
};

/**
 * 根据选 中的聚合字段 和 分组条件 来生成一个 二维的 分组条件+聚合字段，个数是二个的乘法
 */
export const rebuildColumns = (
  aggregateFields: FieldModal[],
  isMultFieldGroup: boolean,
  groupColumns: ColumnGroupModal[],
  state: DataminingModal,
  dispatch: Function,
  disableOperate?: boolean,
): any[] => {
  // message.warn('rebuild  -- columns');
  let allColumns: any[] = [
    {
      fixed: 'left',
      isCategory: true,
      text: groupText,
      title: groupText,
      dataIndex: 'text',
      key: 'text',
      className: styles.categorycolumn,
      render: disableOperate ? undefined : categoryFieldRender,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder:
        getSortOrder(state.schemeState.sorts, 'text') ||
        getSortOrder(state.schemeState.sorts, 'value'),
      rowid: 'category',
      // 传递参数给 DragDropHeaderCell
      onHeaderCell: () => ({ isCategoryField: true }),
      onCell: () => ({ isCategoryField: true }),
    },
  ];
  // 如果有多层表头的，只展示此多层表头，不可以展开和进行操作
  if (isMultFieldGroup) {
    const cloneFields = updateColumnsToChildren(JSON.parse(JSON.stringify(aggregateFields)));
    const leafAggregateFields: any[] = getLeafColumns(cloneFields);
    leafAggregateFields.forEach((fi) => {
      const f = fi;
      setColumnXtypeAndDataIndex(f, state); // 设置column的显示xtype以及 dataIndex名称
      f.isTotalColumn = true; // 这列是总计
      if (state.currSetting.fieldGroupFixedLeft) f.fixed = 'left';
    });
    allColumns = allColumns.concat(cloneFields);
    adjustCloneGroupColumns(allColumns, state);
    // adjustColumnGroupToggleButton(allColumns, dispatch);
    return allColumns;
  }

  const cloneAggregateFields = getLeafColumns(JSON.parse(JSON.stringify(aggregateFields)));
  // 要把最底层的dataindex设计好，有可能字段也是分组的多层的
  let rowidCount = 101;
  // 选中的字段的rowid,从101开始，也就是总计的字段的rowid，101,102,103
  cloneAggregateFields.forEach((afield: any) => {
    const field = afield;
    field[ROWID] = `field-${rowidCount}`;
    rowidCount += 1;
  });
  // 取得所有的底层的总计的字段，设计所有的列表字段的时候，可能会有分组
  // 这个太复杂，设计的时候不要设计二层以上的字段分组
  const leafAggregateFields: any[] = getLeafColumns(cloneAggregateFields);
  leafAggregateFields.forEach((fi) => {
    const f = fi;
    setColumnXtypeAndDataIndex(f, state); // 设置column的显示xtype以及 dataIndex名称
    f.isTotalColumn = true; // 这列是总计
    if (state.currSetting.fieldGroupFixedLeft) f.fixed = 'left';
  });
  allColumns = allColumns.concat(cloneAggregateFields); // 加入总计的字段到allcolumns中
  // 所有列分组是一个树形结构，也要加入rowid,从201开始，201，202，201-201，201-202
  addRowidToTree(groupColumns, '', 201);
  const cloneGroupColumns = JSON.parse(JSON.stringify(groupColumns)); // 深度复制一个包括所有分组的分组信息
  const cloneGroupDetails: any[] = getLeafColumns(cloneGroupColumns); // 所有的底层的分组
  // 如果聚合字段只有一个，那么就把选 中的分组加进去就行了。
  if (leafAggregateFields.length === 1) {
    // 总计不包括在设计器里
    cloneGroupDetails.forEach((de) => {
      const d = de;
      if (d.text === '总计') d.text = cloneAggregateFields[0].text;
      d.title = d.text;
      d.aggregatefieldname = leafAggregateFields[0].aggregatefieldname;
      d.aggregate = leafAggregateFields[0].aggregate;
      d.unitText = leafAggregateFields[0].unitText;
      d.ismonetary = leafAggregateFields[0].ismonetary;
      d.fieldname = leafAggregateFields[0].fieldname;
      d.fieldtype = leafAggregateFields[0].fieldtype;
      setColumnXtypeAndDataIndex(d, state);
    });
    allColumns = allColumns.concat(cloneGroupColumns);
  } else {
    // 选中的聚合字段有2个以上
    cloneGroupDetails.forEach((de) => {
      const d = de;
      // 对每一个分组的底层都要加入所有的aggregateFields 的一个拷贝
      const cloneAggFields: any[] = JSON.parse(JSON.stringify(cloneAggregateFields)).filter(
        (field: FieldModal) => !field.hiddenInColumnGroup,
      );
      // 取得所有的底层的总计的字段，设计所有的列表字段的时候，可能会有分组
      const cloneLeafAggregateFields: any[] = getLeafColumns(cloneAggFields);
      cloneLeafAggregateFields.forEach((fi) => {
        const f = fi;
        // 每一个末级的聚合字段，加上分组信息
        f.condition = d.condition;
        // 末级节点的rowid  201--field-101, 201-field-102;
        f[ROWID] = `${d[ROWID]}--${f[ROWID]}`;
        setColumnXtypeAndDataIndex(f, state);
      });
      d.children = cloneAggFields;
    });
    allColumns = allColumns.concat(cloneGroupColumns);
  }
  // me.clearSelectedColumns();
  adjustCloneGroupColumns(allColumns, state);
  adjustColumnGroupToggleButton(allColumns, dispatch);
  // console.log(allColumns);
  return allColumns;
};
