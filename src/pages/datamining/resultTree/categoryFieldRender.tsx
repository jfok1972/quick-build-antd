/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Dropdown, Menu, Tooltip, Modal, Input, Form, message } from 'antd';
import { useContext } from 'react';
import {
  ClearOutlined,
  DeleteRowOutlined,
  NodeCollapseOutlined,
  NodeExpandOutlined,
  ScissorOutlined,
  SisternodeOutlined,
  SubnodeOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { apply, EMPTY_MENU_ICON } from '@/utils/utils';
import { PopoverDescriptionWithId } from '../../module/descriptions';
import { getModuleInfo } from '../../module/modules';
import type { DataminingStateContext } from '..';
import { DataminingContext } from '..';
import { getTreeRecordByKey, getAllLeafRecords } from '../utils';
import {
  combineNotSelectedRows,
  combineSelectedRows,
  deleteSelectedRows,
  deleteSelectedRowsChildren,
  expandRowsWithGroup,
} from '../rowActionUtils';
import groupMenu from '../toolbar/groupMenu';
import {
  ACT_CLEAR_ALL_ROWEXPAND,
  ACT_DATAMINING_FETCHDATA,
  ACT_SELECTED_ROWKEYS_CHANGED,
  CHILDREN,
  ACT_DELETE_ROWGROUP_FROM_INDEX,
  ROWID,
  TITLE,
  ROOTROWID,
} from '../constants';
import columnStyles from '../../module/grid/columnFactory.less';
import { rowOperTypes } from '../rowActionHistory';

const CategoryField = ({ value, record }: { value: any; record: any }) => {
  const context = useContext<DataminingStateContext>(DataminingContext);
  const { state, dispatch } = context;
  const selectCount = state.selectedRowKeys.length;
  const {
    schemeState: { rowGroup },
  } = state;
  // 右键弹出在category上的context菜单
  const menu = (
    <Menu
      onClick={({ domEvent }) => {
        domEvent.stopPropagation();
      }}
    >
      {/* 如果当前记录是选中记录，则展开所有选中记录，否则只展开当前记录 */}
      <Menu.SubMenu
        key="expandselected"
        icon={<NodeExpandOutlined />}
        title={`${selectCount === 0 ? `当前行` : `选中的 ${selectCount} 行`}按分组展开`}
      >
        {groupMenu(state.expandGroupFieldsTree || [], (group: any) => {
          const records: any[] = [];
          if (selectCount)
            records.push(
              ...state.selectedRowKeys.map((key) =>
                getTreeRecordByKey(state.schemeState.dataSource, key, ROWID),
              ),
            );
          else records.push(record);
          expandRowsWithGroup({ state, dispatch, records, group });
        })}
      </Menu.SubMenu>
      <Menu.SubMenu
        key="expandallleaf"
        title={`${getAllLeafRecords(state.schemeState.dataSource).length}个末级节点按分组展开`}
        icon={<SubnodeOutlined />}
      >
        {groupMenu(state.expandGroupFieldsTree || [], (group: any) => {
          expandRowsWithGroup({
            state,
            dispatch,
            group,
            expandallleaf: true,
            records: getAllLeafRecords(state.schemeState.dataSource),
          });
        })}
      </Menu.SubMenu>
      <Menu.Divider />
      <Menu.Item
        key="combine"
        icon={<NodeCollapseOutlined />}
        disabled={selectCount <= 1}
        onClick={() => {
          combineSelectedRows(state, dispatch, false);
        }}
      >
        合并选中行
      </Menu.Item>
      <Menu.Item
        key="combineadd"
        icon={<SisternodeOutlined rotate={180} />}
        disabled={selectCount <= 1}
        onClick={() => {
          combineSelectedRows(state, dispatch, true);
        }}
      >
        合并后加入原选中行
      </Menu.Item>
      <Menu.Item
        key="combineother"
        icon={EMPTY_MENU_ICON}
        disabled={selectCount <= 0}
        onClick={() => {
          combineNotSelectedRows(state, dispatch, false);
        }}
      >
        合并非选中行
      </Menu.Item>
      <Menu.Item
        key="combineothradd"
        icon={EMPTY_MENU_ICON}
        disabled={selectCount <= 0}
        onClick={() => {
          combineNotSelectedRows(state, dispatch, true);
        }}
      >
        合并后加入原非选中行
      </Menu.Item>
      <Menu.Item
        key="edittext"
        icon={EMPTY_MENU_ICON}
        onClick={() => {
          let textvalue = value;
          Modal.confirm({
            title: '请输入分组描述',
            icon: null,
            content: (
              <Form autoComplete="off">
                <Input
                  name="text"
                  defaultValue={value}
                  maxLength={100}
                  onChange={(e) => {
                    textvalue = e.target.value;
                  }}
                />
              </Form>
            ),
            onOk: () => {
              apply(record, { text: textvalue });
              dispatch({
                type: ACT_DATAMINING_FETCHDATA,
                payload: {
                  dataSource: [...state.schemeState.dataSource],
                  expandPaths: [
                    {
                      type: 'edittext',
                      conditionpath: record[ROWID],
                      text: textvalue,
                    },
                  ],
                },
              });
            },
          });
        }}
      >
        修改当前行分组描述
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="clearrow"
        icon={<DeleteRowOutlined />}
        disabled={!state.schemeState.dataSource[0].children}
        onClick={() =>
          deleteSelectedRows({ state, dispatch, deletedRecord: selectCount ? null : record })
        }
      >
        {selectCount ? `删除选中行` : `删除当前行`}
      </Menu.Item>
      <Menu.Item
        key="clearrowchildren"
        icon={<ScissorOutlined />}
        disabled={selectCount === 0 && !record[CHILDREN]}
        onClick={() =>
          deleteSelectedRowsChildren({
            state,
            dispatch,
            deletedRecord: selectCount ? null : record,
          })
        }
      >
        {selectCount ? `删除选中行` : `删除当前行`}的子节点
      </Menu.Item>
      <Menu.Divider />
      {selectCount ? (
        <Menu.Item
          key="clearallselected"
          icon={EMPTY_MENU_ICON}
          onClick={() => {
            dispatch({
              type: ACT_SELECTED_ROWKEYS_CHANGED,
              payload: {
                selectedRowKeys: [],
              },
            });
          }}
        >
          取消所有选中记录
        </Menu.Item>
      ) : null}
      <Menu.Item
        key="undo"
        icon={<UndoOutlined />}
        disabled={rowGroup.length === 0}
        onClick={() => {
          const last = rowGroup[rowGroup.length - 1];
          const type = rowOperTypes[last.type];
          message.info(
            `最后一次行操作:${type} ${last[TITLE] || ''} ${
              last.conditiontext || last.text || ''
            } 已撤消！`,
          );
          dispatch({
            type: ACT_DELETE_ROWGROUP_FROM_INDEX,
            payload: {
              deleteFormIndex: rowGroup.length - 1,
            },
          });
        }}
      >
        撤消行操作 {rowGroup.length === 0 ? '' : rowOperTypes[rowGroup[rowGroup.length - 1].type]}
      </Menu.Item>
      <Menu.Item
        key="clearallrow"
        icon={<ClearOutlined />}
        disabled={!state.schemeState.dataSource[0].children}
        onClick={() => {
          dispatch({
            type: ACT_CLEAR_ALL_ROWEXPAND,
            payload: {},
          });
        }}
      >
        清除所有行展开数据
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Dropdown overlay={menu} trigger={['contextMenu']}>
        <div
          className={columnStyles.manytoonefield}
          style={{ flex: 1, transition: 'all 1s', padding: '8px 0px', margin: '-8px 0px' }}
        >
          <span
            className={columnStyles.manytoonefieldvalue}
            style={{ marginRight: record[ROWID] === ROOTROWID ? '90px' : '' }}
          >
            {typeof value === 'string' && value.length > 30 ? (
              <Tooltip title={value}>{`${value.substr(0, 28)}...`}</Tooltip>
            ) : (
              value
            )}
          </span>
        </div>
      </Dropdown>
      {record.moduleName ? (
        <span className={columnStyles.manytoonefieldicon}>
          <PopoverDescriptionWithId
            id={record.value}
            moduleInfo={getModuleInfo(record.moduleName)}
            dispatch={() => {}}
          />
        </span>
      ) : null}{' '}
    </>
  );
};

/**
 * 分组项目字段的render
 * 如果是模块数据，在最后加一个可以显示模块的info按钮
 *
 * 可以对当前列进行操作的按钮
 *
 * @param value
 * @param record
 * @param recno_
 * @param param3
 */
export const categoryFieldRender = (value: any, record: any) => {
  return <CategoryField value={value} record={record} key={record[ROWID]} />;
};
