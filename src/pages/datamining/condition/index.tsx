/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useCallback, useContext } from 'react';
import { integerRender, stringRenderer } from '@/pages/module/grid/columnRender';
import { DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { Card, Table, Tooltip } from 'antd';
import update from 'immutability-helper';
import { useDrag, useDrop } from 'react-dnd';
import type { DataminingStateContext } from '..';
import { DataminingContext } from '..';
import type { FilterDataSourceModal } from '../data';
import { deleteFilterDataSourceRecord } from './conditionUtils';
import styles from '../index.less';
import { ACT_FILTER_DATASOURCE_UPDATE } from '../constants';

export const ConditionGrid = () => {
  const context = useContext<DataminingStateContext>(DataminingContext);
  const { state, dispatch } = context;

  const columns: any = [
    {
      title: '条件来源',
      dataIndex: 'source',
      width: 90,
      render: stringRenderer,
    },
    {
      title: '查询字段',
      dataIndex: 'fieldtitle',
      width: 150,
      render: (value: string) => <span style={{ fontWeight: 700 }}>{value}</span>,
    },
    {
      title: '比较符',
      dataIndex: 'operator',
      width: 90,
    },
    {
      title: '查询条件',
      dataIndex: 'displaycond',
      flex: 1,
      render: (value: string) => <span className={styles.filtertitle}>{value}</span>,
    },
    {
      title: '记录数',
      dataIndex: 'recordnum',
      width: 80,
      align: 'right',
      render: (value: number) => (value === -1 ? <LoadingOutlined /> : integerRender(value)),
    },
    {
      width: 36,
      align: 'center',
      render: (value: any, record: FilterDataSourceModal) => (
        <Tooltip title="删除此条件">
          <DeleteOutlined
            onClick={() => {
              deleteFilterDataSourceRecord(state, dispatch, record);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  const type = 'DataminingConditionDragableBodyRow';
  const DragableBodyRow = ({
    index,
    moverow,
    className,
    style,
    ...restProps
  }: {
    index: number;
    record: any;
    moverow: Function;
    className: string;
    style: any;
  }) => {
    const ref: any = React.useRef();
    const [{ isOver, dropClassName }, drop] = useDrop({
      accept: type,
      collect: (monitor) => {
        const { index: dragIndex } = monitor.getItem() || {};
        if (dragIndex === index) {
          return {};
        }
        return {
          isOver: monitor.isOver(),
          dropClassName: dragIndex < index ? ' drop-over-downward' : ' drop-over-upward',
        };
      },
      drop: (dragItem: any) => {
        moverow(dragItem.index, index);
      },
    });
    const [, drag] = useDrag({
      item: { type, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });
    drop(drag(ref));
    return (
      <tr
        ref={ref}
        className={`${className}${isOver ? dropClassName : ''}`}
        style={{ ...style }} // cursor: 'move'
        {...restProps}
      />
    );
  };

  const components = {
    body: {
      row: DragableBodyRow,
    },
  };

  const moverow = useCallback(
    (dragIndex, hoverIndex) => {
      const data: FilterDataSourceModal[] = state.filterDataSource;
      const dragRow = data[dragIndex];
      if (dragIndex !== hoverIndex)
        dispatch({
          type: ACT_FILTER_DATASOURCE_UPDATE,
          payload: {
            filterDataSource: update(data, {
              $splice: [
                [dragIndex, 1],
                [hoverIndex, 0, dragRow],
              ],
            }).map((rec) => ({ ...rec, recordnum: -1 })),
            refreshCount: true,
          },
        });
    },
    [state.filterDataSource],
  );
  return (
    <Card className="dataminingcard" style={{ marginBottom: '16px', height: 'auto' }}>
      <Table
        className="dataminingconditiontable"
        columns={columns}
        dataSource={state.filterDataSource}
        bordered
        size="small"
        pagination={false}
        components={state.filterDataSource.length > 1 ? components : undefined}
        onRow={(record, index) => ({
          index,
          moverow,
          onClick: () => {},
        })}
      />
    </Card>
  );
};
