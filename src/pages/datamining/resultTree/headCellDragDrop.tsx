/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Dropdown, Form, Input, Menu, Modal } from 'antd';
import type { ReactChild } from 'react';
import React, { useContext } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  ApartmentOutlined,
  ClearOutlined,
  DeleteOutlined,
  DeleteRowOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  MergeCellsOutlined,
  NodeCollapseOutlined,
  NodeExpandOutlined,
  PlusOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ToTopOutlined,
} from '@ant-design/icons';
import { EMPTY_MENU_ICON } from '@/utils/utils';
import type { DataminingStateContext } from '..';
import { DataminingContext } from '..';
import {
  ACT_COLUMN_GROUP_EDIT_TEXT,
  ACT_COLUMN_GROPU_DESELECTEDALL,
  PARENT_ROWID,
  ROWID,
  ACT_COLUMN_GROUP_REMOVE,
  ACT_COLUMN_GROUP_VISIBLE_TOGGLE,
  ACT_COLUMN_GROUP_SELECTED_TOGGLE,
  ACT_COLUMN_GROUP_COMBINE_SELECTED,
  ACT_COLUMN_GROUP_REST_VISIBLE_TOGGLE,
  SELECTED,
  TEXT,
  ACT_FIELD_GROUP_REMOVE,
  ACT_FIELD_GROUP_HIDDEN_IN_TOGGLE,
  DRAG_ITEM_GROUPFIELD,
  ACT_FIELD_GROUP_FIXED_LEFT_TOGGLE,
  ACT_FIELD_GROUP_ADD,
  DRAG_NAVIGATE_RECORD,
  ACT_CLEAR_ALL_COLUMN_EXPAND,
  ACT_CLEAR_ALL_ROWEXPAND,
  ACT_SORT_CHANGE,
  ACT_DATAMINING_EXPAND_CHANGED,
} from '../constants';
import { getAllhasChildrenRowids, getTreeSelectedKeys } from '../utils';
import {
  expandHeadCellWithGroup,
  getCellType,
  moveColumnGroup,
  moveFieldGroup,
  expandHeadCellWithNavigate,
} from './columnUtils';
import groupMenu from '../toolbar/groupMenu';
import type { FieldModal, HeaderCellType } from '../data';
import { getAggregateFieldMenu } from './fieldUtils';
import { getNavigateSelectedRecords } from '../navigate/navigateUtils';

const type = 'DragableHeaderCell';
/**
 * 数据分析结果的表头单元格的拖动和菜单的设置
 * @param param0
 */

const DragDropHeaderCellActive = ({
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
  const context = useContext<DataminingStateContext>(DataminingContext);
  const { state, dispatch } = context;
  // 总计的字段分组，分组，单个字段的最后一个分组，多个字段最后的分数
  const cellType: HeaderCellType = getCellType(column);
  // rowid field-开头，有二个以上字段，可以拖动, 所有非叶节点的分组数据都可以拖动
  const canMoveDrag: boolean =
    (cellType === 'sumfield' && state.schemeState.fieldGroup.length > 1) ||
    cellType === 'group' ||
    cellType === 'fieldingroup';
  // 当前选中的表头数，如果聚合字段多大于1个，不包括最底层的字段。
  const selectCount = getTreeSelectedKeys(state.schemeState.columnGroup, ROWID, SELECTED).length;
  const ref: any = React.useRef();
  // 字段拖动的drag和drop
  const [{ isMoveOver, canMoveDrop, dropClassName }, moveDrop] = useDrop({
    accept: type,
    canDrop: (item, monitor) => {
      const { column: dragColumn } = monitor.getItem() || {};
      const {
        isTotalColumn: isDragTotalColumn,
        [ROWID]: dragRowid,
        [PARENT_ROWID]: dragParentRowid,
      } = dragColumn || {};
      // 拖动和目标不相同
      return (
        dragRowid !== column[ROWID] &&
        // 选择了多个聚合字段，在总计里，这些聚合字段可以拖动位置
        ((isDragTotalColumn && column.isTotalColumn) ||
          // 分组如果他们的父节点是相同的，那么也可以拖动顺序
          dragParentRowid === column[PARENT_ROWID])
      );
    },
    collect: (monitor) => {
      const { column: dragColumn } = monitor.getItem() || {};
      const {
        rowid: dragRowid,
        isTotalColumn: isDragTotalColumn,
        [PARENT_ROWID]: dragParentRowid,
      } = dragColumn || {};
      if (dragRowid === column[ROWID]) {
        return {};
      }
      return {
        isMoveOver: monitor.isOver(),
        // 在相同的父节点下才可以进行记录的拖动
        canMoveDrop:
          dragRowid !== column[ROWID] &&
          ((isDragTotalColumn && column.isTotalColumn) || dragParentRowid === column[PARENT_ROWID]),
        dropClassName: dragRowid < column[ROWID] ? ' drop-over-right' : ' drop-over-left',
      };
    },
    drop: (dragItem: any) => {
      const { column: dragColumn } = dragItem;
      if (column.isTotalColumn) moveFieldGroup(state, dispatch, dragColumn[ROWID], column[ROWID]);
      else moveColumnGroup(state, dispatch, column[PARENT_ROWID], dragColumn[ROWID], column[ROWID]);
    },
  });
  const [, moveDrag] = useDrag({
    item: { type, column },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  if (canMoveDrag) moveDrop(moveDrag(ref));

  // 可分组项目中的字段拖动到cell中
  const [{ isGroupExpandFieldOver }, groupExpandDrop] = useDrop({
    accept: DRAG_ITEM_GROUPFIELD,
    canDrop: () => true,
    /**
     * 当用户拖动分组字段放到记录上时进行展开。
     * 1、如果当前记录没有选中，则只展开当前记录。
     * 2、如果当前记录被选中了，则展开所有的选中记录。
     */
    drop: (item: any) => {
      expandHeadCellWithGroup(
        state,
        dispatch,
        cellType,
        cellType === 'group' || cellType === 'fieldingroup' ? column : {},
        item.fieldid,
        item.text || item.title,
      );
    },
    collect: (monitor) => {
      return {
        isGroupExpandFieldOver: !!monitor.isOver(),
        canDrop: monitor.canDrop(),
      };
    },
  });

  // 导航记录拖动到记录上
  const [{ isNavigateOver }, navigateDrop] = useDrop({
    accept: DRAG_NAVIGATE_RECORD,
    canDrop: () => true,
    drop: (item: any) => {
      const sourceRecords: any[] = getNavigateSelectedRecords(
        state,
        item.navigateGroup.fieldid,
        item.node,
      );
      const records: any[] = [];
      sourceRecords.forEach((record) => {
        records.push({
          condition: `${record.groupfieldid}=${record.value}`,
          text: record.text,
          value: record.value,
        });
      });
      expandHeadCellWithNavigate(
        state,
        dispatch,
        cellType,
        cellType === 'group' || cellType === 'fieldingroup' ? column : {},
        item.navigateGroup.fieldid,
        item.navigateGroup.text || item.navigateGroup.title,
        sourceRecords,
      );
    },
    collect: (monitor) => {
      return {
        isNavigateOver: !!monitor.isOver(),
        canDrop: monitor.canDrop(),
      };
    },
  });

  // 判断哪些是可以展开的
  if (
    cellType === 'sumfield' ||
    cellType === 'fieldingroup' ||
    (cellType === 'group' && column.condition)
  )
    groupExpandDrop(navigateDrop(ref));

  // 删除选中的分组，可保留子分组
  const removeColumnGroup = (keepChildren: boolean) => {
    dispatch({
      type: ACT_COLUMN_GROUP_REMOVE,
      payload: {
        rowids: selectCount
          ? getTreeSelectedKeys(state.schemeState.columnGroup, ROWID, SELECTED)
          : [column[ROWID]],
        keepChildren,
      },
    });
  };
  // 单元选中和反选互换
  const toggleCellSelected = () => {
    dispatch({
      type: ACT_COLUMN_GROUP_SELECTED_TOGGLE,
      payload: {
        rowid: column[ROWID],
      },
    });
  };
  // 合并选中的分组，参数为是否加入原分组
  const combineSelected = (keepChildren: boolean) => {
    dispatch({
      type: ACT_COLUMN_GROUP_COMBINE_SELECTED,
      payload: {
        keepChildren,
      },
    });
  };
  // 所有的合并分组的右键菜单
  const columnGroupMenu = (
    <Menu>
      {/* 单个聚合字段的末级，无法双击，只能用菜单来选择 */}
      {cellType === 'fieldingroup' ? (
        <Menu.Item key="toggleselected" icon={EMPTY_MENU_ICON} onClick={toggleCellSelected}>
          {column[SELECTED] ? '取消选中当前分组' : '选中当前分组'}
        </Menu.Item>
      ) : null}
      {selectCount >= 2 || (selectCount === 1 && !column[SELECTED]) ? (
        <Menu.Item
          key="clearallselected"
          icon={EMPTY_MENU_ICON}
          onClick={() => {
            dispatch({
              type: ACT_COLUMN_GROPU_DESELECTEDALL,
              payload: {},
            });
          }}
        >
          {`取消选中的 ${selectCount} 个分组`}
        </Menu.Item>
      ) : null}
      <Menu.Item
        key="togglevisible"
        icon={<EyeInvisibleOutlined />}
        onClick={() => {
          dispatch({
            type: ACT_COLUMN_GROUP_VISIBLE_TOGGLE,
            payload: {
              type: 'hidden',
              rowids: selectCount
                ? getTreeSelectedKeys(state.schemeState.columnGroup, ROWID, SELECTED)
                : [column[ROWID]],
            },
          });
        }}
      >
        {' '}
        {selectCount ? `隐藏选中的 ${selectCount} 个分组` : `隐藏当前分组`}
      </Menu.Item>
      <Menu.Item
        key="hiddenrest"
        icon={<ToTopOutlined rotate={column.hideRest ? 90 : 270} />}
        onClick={() => {
          dispatch({
            // 当前节点后面的同级节点都不显示
            type: ACT_COLUMN_GROUP_REST_VISIBLE_TOGGLE,
            payload: { rowid: column[ROWID] },
          });
        }}
      >
        {' '}
        {`${column.hideRest ? '显示' : '隐藏'}后面剩余的分组`}
      </Menu.Item>
      <Menu.Divider />
      {cellType === 'fieldingroup' || (cellType === 'group' && column.condition) ? (
        <>
          <Menu.SubMenu key="fieldexpand" icon={<NodeExpandOutlined />} title="按分组展开">
            {groupMenu(state.expandGroupFieldsTree || [], (group: any) => {
              expandHeadCellWithGroup(
                state,
                dispatch,
                cellType,
                column,
                group.fieldid,
                group.text || group.title,
              );
            })}
          </Menu.SubMenu>
          <Menu.Divider />
        </>
      ) : null}
      <Menu.Item
        key="combine"
        icon={<MergeCellsOutlined />}
        disabled={selectCount <= 1}
        onClick={() => combineSelected(false)}
      >
        {`合并选中的 ${selectCount} 个分组`}
      </Menu.Item>
      <Menu.Item
        key="combineadd"
        icon={<ApartmentOutlined />}
        disabled={selectCount <= 1}
        onClick={() => combineSelected(true)}
      >
        {`合并选中的 ${selectCount} 个后加入原分组`}
      </Menu.Item>
      {/* 修改分组描述 */}
      <Menu.Item
        key="edittext"
        icon={EMPTY_MENU_ICON}
        onClick={() => {
          let textvalue = column.text;
          Modal.confirm({
            title: '请输入分组描述',
            icon: null,
            content: (
              <Form autoComplete="off">
                <Input
                  name="text"
                  defaultValue={column.text}
                  maxLength={100}
                  onChange={(e) => {
                    textvalue = e.target.value;
                  }}
                />
              </Form>
            ),
            onOk: () => {
              dispatch({
                type: ACT_COLUMN_GROUP_EDIT_TEXT,
                payload: {
                  rowid: column[ROWID],
                  text: textvalue,
                },
              });
            },
          });
        }}
      >
        修改当前行分组描述
      </Menu.Item>
      <Menu.Divider />
      {/* 删除当前列或选中列（保留子分组） */}
      <Menu.Item
        key="removecolumnkeepchildren"
        icon={<DeleteRowOutlined />}
        onClick={() => {
          removeColumnGroup(true);
        }}
      >
        {`${selectCount ? `仅删除选中的 ${selectCount} 个分组` : `仅删除当前分组`}(保留子分组)`}
      </Menu.Item>
      {/* 删除当前列或选中列，包括所有子分组 */}
      <Menu.Item
        key="removecolumn"
        icon={<DeleteOutlined />}
        onClick={() => {
          removeColumnGroup(false);
        }}
      >
        {`${selectCount ? `删除选中的 ${selectCount} 个分组` : `删除当前分组`}及其子分组`}
      </Menu.Item>
    </Menu>
  );
  //

  // 所有的字段分组的右键菜单，仅在总计处有效
  const fieldGroupMenu = (
    <Menu>
      <Menu.SubMenu key="fieldexpand" icon={<NodeExpandOutlined />} title="聚合字段按分组展开">
        {groupMenu(state.expandGroupFieldsTree || [], (group: any) => {
          expandHeadCellWithGroup(
            state,
            dispatch,
            cellType,
            {},
            group.fieldid,
            group.text || group.title,
          );
        })}
      </Menu.SubMenu>
      <Menu.Divider />
      <Menu.Item
        key="fieldGroupFixedLeft"
        icon={EMPTY_MENU_ICON}
        onClick={() => {
          dispatch({
            type: ACT_FIELD_GROUP_FIXED_LEFT_TOGGLE,
            payload: {},
          });
        }}
      >
        {`${state.currSetting.fieldGroupFixedLeft ? '解除' : ''}总计列固定在左边`}
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key={ACT_FIELD_GROUP_HIDDEN_IN_TOGGLE}
        // 如果只有一个字段，或者当前字段没隐藏，并且没隐藏的字段只有一个
        disabled={
          state.schemeState.fieldGroup.length <= 1 ||
          (!column.hiddenInColumnGroup &&
            state.schemeState.fieldGroup.filter((field) => !field.hiddenInColumnGroup).length === 1)
        }
        icon={column.hiddenInColumnGroup ? <EyeOutlined /> : <EyeInvisibleOutlined />}
        onClick={() => {
          dispatch({
            type: ACT_FIELD_GROUP_HIDDEN_IN_TOGGLE,
            payload: {
              rowid: column[ROWID],
            },
          });
        }}
      >
        {(column.hiddenInColumnGroup ? `在分组中显示 ` : `在分组中隐藏 `) + column[TEXT]}
      </Menu.Item>
      <Menu.SubMenu key="addagreegatefield" icon={<PlusOutlined />} title="增加聚合字段">
        {getAggregateFieldMenu(state, (field: FieldModal) => {
          dispatch({
            type: ACT_FIELD_GROUP_ADD,
            payload: {
              field,
            },
          });
        })}
      </Menu.SubMenu>
      <Menu.Item
        key={ACT_FIELD_GROUP_REMOVE}
        icon={<DeleteOutlined />}
        disabled={state.schemeState.fieldGroup.length <= 1}
        onClick={() => {
          dispatch({
            type: ACT_FIELD_GROUP_REMOVE,
            payload: {
              rowid: column[ROWID],
            },
          });
        }}
      >
        删除当前分组字段
      </Menu.Item>
    </Menu>
  );
  const th = (
    <th
      ref={ref}
      onDoubleClick={toggleCellSelected}
      {...restProps}
      className={
        className +
        (isMoveOver && canMoveDrop ? ` ${dropClassName}` : '') +
        (isGroupExpandFieldOver || isNavigateOver ? ' groupexpandoverheadercell' : '')
      }
    >
      {children}
    </th>
  );
  return column.hidden || cellType === 'subfield' ? (
    th
  ) : (
    <Dropdown
      overlay={cellType === 'sumfield' ? fieldGroupMenu : columnGroupMenu}
      trigger={['contextMenu']}
    >
      {th}
    </Dropdown>
  );
};

/**
 * 分组项目的右键菜单
 * @returns
 */
const CategoryMenu = () => {
  const context = useContext<DataminingStateContext>(DataminingContext);
  const { state, dispatch } = context;
  const menu = (
    <Menu
      key="category_popup_menu"
      onClick={({ domEvent }) => {
        domEvent.stopPropagation();
      }}
    >
      <Menu.Item
        key="expandAll"
        icon={<NodeExpandOutlined />}
        onClick={() => {
          dispatch({
            type: ACT_DATAMINING_EXPAND_CHANGED,
            payload: { expandedRowKeys: getAllhasChildrenRowids(state.schemeState.dataSource) },
          });
        }}
      >
        展开所有行
      </Menu.Item>
      <Menu.Item
        key="collapseAll"
        icon={<NodeCollapseOutlined />}
        onClick={() => {
          dispatch({
            type: ACT_DATAMINING_EXPAND_CHANGED,
            payload: { expandedRowKeys: [state.schemeState.dataSource[0][ROWID]] },
          });
        }}
      >
        折叠至总计行
      </Menu.Item>
      <Menu.ItemGroup title="排序设置">
        <Menu.Item
          key="value-asc"
          icon={<SortAscendingOutlined />}
          onClick={() => {
            dispatch({
              type: ACT_SORT_CHANGE,
              payload: {
                property: 'value',
                direction: 'ASC',
              },
            });
          }}
        >
          分组编码升序
        </Menu.Item>
        <Menu.Item
          key="value-desc"
          icon={<SortDescendingOutlined />}
          onClick={() => {
            dispatch({
              type: ACT_SORT_CHANGE,
              payload: {
                property: 'value',
                direction: 'DESC',
              },
            });
          }}
        >
          分组编码降序
        </Menu.Item>
      </Menu.ItemGroup>
      <Menu.ItemGroup title="重置行或列">
        <Menu.Item
          key="clearrowexpand"
          icon={<ClearOutlined />}
          onClick={() => {
            dispatch({
              type: ACT_CLEAR_ALL_ROWEXPAND,
              payload: {},
            });
          }}
        >
          清除所有行展开数据
        </Menu.Item>
        <Menu.Item
          key="clearcolumnexpand"
          icon={<ClearOutlined />}
          onClick={() => {
            dispatch({
              type: ACT_CLEAR_ALL_COLUMN_EXPAND,
              payload: {},
            });
          }}
        >
          清除所有列展开分组
        </Menu.Item>
      </Menu.ItemGroup>
    </Menu>
  );
  return menu;
};

/**
 *
 * @param param0
 * @returns
 */
export const DragDropHeaderCell = ({
  children,
  // column.onHeaderCell 设置的当前字段的值
  column,
  isCategoryField,
  className,
  ...restProps
}: {
  column: any;
  isCategoryField: any;
  children: ReactChild;
  className: string;
  restProps: any;
}) => {
  if (column) {
    // 聚合字段总计和所有的分组字段
    return DragDropHeaderCellActive({ children, column, className, ...restProps });
  }
  return isCategoryField ? (
    // 分组项目列加上右键菜单
    <Dropdown overlay={CategoryMenu()} trigger={['contextMenu']}>
      <th {...restProps} className={className}>
        {children}
      </th>
    </Dropdown>
  ) : (
    // 选择列
    <th {...restProps} className={className}>
      {children}
    </th>
  );
};
