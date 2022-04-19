/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useContext } from 'react';
import type { ReactChild } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { ModuleStateContext } from '../index';
import { ModuleContext } from '../index';
import { DetailModelContext } from '../detailGrid/model';
import type { ModuleState } from '../data';

const type = 'ModuleDragableHeaderCell';
/**
 * 数据分析结果的表头单元格的拖动和菜单的设置
 * @param param0
 */
export const DragDropHeaderCell = ({
  children,
  column,
  className,
  ...restProps
}: {
  column: any;
  children: ReactChild;
  className: string;
  restProps: any;
}) => {
  // 如果没有指定column,那就是分组cell,不用进行拖协
  // if (!column)
  //    return <th {...restProps} className={className} children={children} />;

  const detailContext = useContext(DetailModelContext);
  const context = useContext<ModuleStateContext>(ModuleContext);
  let state: ModuleState;
  // let dispatch: any;
  if (detailContext && detailContext.moduleState) {
    state = detailContext.moduleState;
    // dispatch = detailContext.dispatch;
  } else {
    state = context.state;
    // dispatch = context.dispatch;
  }
  const ref: any = React.useRef();
  // 字段拖动的drag和drop
  const [{ isMoveOver, canMoveDrop, dropClassName }, moveDrop] = useDrop({
    accept: `${type}-${state.moduleName}`,
    canDrop: () => {
      // const { column: dragColumn } = monitor.getItem() || {};
      // 拖动和目标不相同
      return true;
    },
    collect: (monitor) => {
      // const { column: dragColumn } = monitor.getItem() || {};
      // if (dragRowid === column[ROWID]) {
      //     return {};
      // }
      return {
        isMoveOver: monitor.isOver(),
        // 在相同的父节点下才可以进行记录的拖动
        canMoveDrop: true,
        dropClassName: ' drop-over-right', // true ? ' drop-over-right' : ' drop-over-left',  // dragRowid < column[ROWID]
      };
    },
    drop: () => {
      // const { column: dragColumn } = dragItem;
      // moveColumnGroup(state, dispatch, column[PARENT_ROWID], dragColumn[ROWID], column[ROWID]);
    },
  });
  const [, moveDrag] = useDrag({
    item: { type: `${type}-${state.moduleName}`, column },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  moveDrop(moveDrag(ref));

  const th = (
    <th
      ref={ref}
      {...restProps}
      className={className + (isMoveOver && canMoveDrop ? ` ${dropClassName}` : '')}
    >
      {children}
    </th>
  );
  return th;
};
