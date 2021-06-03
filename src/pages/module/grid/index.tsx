import React, { useCallback, useEffect, useMemo } from 'react';
import type { Dispatch } from 'redux';
import { Table, Tooltip, Space, Empty } from 'antd';
import type { PaginationConfig } from 'antd/lib/pagination';
import { ReloadOutlined } from '@ant-design/icons';
import type {
  Key,
  SorterResult,
  TableCurrentDataSource,
  TablePaginationConfig,
} from 'antd/lib/table/interface';
import { apply, templateReplace } from '@/utils/utils';
import type { ModuleModal, ModuleState, GridOperateType } from '../data';
import { getAllFilterCount } from './filterUtils';
import { getGridScheme, hasAssociatesSouth } from '../modules';
import SortInfoButton from './sortInfoButton';
import { getPinRecord } from '../moduleUtils';
import { getColumns, getSubTotalFields } from './columnFactory';
import { getAssociatesSouthDetails } from '../associates/assoclate';
import { tableSummary } from './summary';
import GridSizeButton from './GridSizeButton';
import GridSettingButton from './GridSettingButton';
import { getToolbarButton } from '../toolbar/BatchOperateButton';
import StartEndDateSectionSelect from './sqlparams';
import { DragableBodyRow } from './bodyRowDragDrop';
import { SimpleDescription } from '../descriptions';
import { UpdateRecordOrderNoButton } from './updateRecordOrderno';
import { RemoteExpandBody } from './RemoteExpandBody';
import { PARENT_RECORD } from '../constants';
import { updateParentKey } from '../service';

const marked = require('marked');

interface ModuleGridProps {
  moduleState: ModuleState;
  moduleInfo: ModuleModal;
  dispatch: Dispatch;
  fetchLoading: boolean;
  gridType: GridOperateType;
  readOnly?: boolean;
  manyToOneInfo?: any; // gridType是 selectfield,双击选中并返回
}

const ModuleGrid: React.FC<ModuleGridProps> = ({
  moduleState,
  moduleInfo,
  dispatch,
  fetchLoading,
  gridType,
  readOnly,
  manyToOneInfo,
}) => {
  const { moduleName } = moduleState;
  useEffect(() => {
    dispatch({
      type: 'modules/fetchData',
      payload: {
        moduleName,
      },
    });
  }, [moduleState.dataSourceLoadCount]); // 在moduleInfo.dataSourceLoadCount改变过后重新刷新数据
  // console.log(`grid renderer.......${  moduleName}`)

  const pageChanged = (page: number) => {
    // 这里筛选也调用了，要排除掉筛选的事件,筛选改变后，页码会改为1
    if (page !== moduleState.gridParams.curpage)
      dispatch({
        type: 'modules/pageChanged',
        payload: {
          moduleName,
          page,
        },
      });
  };

  const onPageSizeChange = (page_: number, size: number) => {
    dispatch({
      type: 'modules/pageSizeChanged',
      payload: {
        moduleName,
        limit: size,
      },
    });
  };

  const handleTableChange = (
    pagination: PaginationConfig,
    filters: Record<string, Key[] | null>,
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: TableCurrentDataSource<any>,
  ) => {
    const { action } = extra;
    // 由于三个事件共用一个函数，因此要判断一下是什么事件
    // 如果是column的筛选事件
    if (action === 'filter') {
      dispatch({
        type: 'modules/filterChanged',
        payload: {
          type: 'columnFilterChange',
          moduleName,
          columnfilter: filters,
        },
      });
    } else if (action === 'sort') {
      // 如果是排序事件
      // 把column 中多余的属性去掉，不然json.strinfy时有问题
      const MENUTEXT = 'menuText';
      const getColumnsorter = (asorter: SorterResult<any>) => ({
        order: asorter.order,
        field: asorter.field,
        columnKey: asorter.columnKey,
        column: {
          menuText: asorter.column && asorter.column[MENUTEXT],
        },
      });
      const columnsorter: any = Array.isArray(sorter)
        ? (sorter as SorterResult<any>[]).map((sort) => getColumnsorter(sort))
        : getColumnsorter(sorter);
      dispatch({
        type: 'modules/columnSortChanged',
        payload: {
          moduleName,
          columnsorter,
        },
      });
    }
  };

  const handlerSelectedRowKeys = (selectedRowKeys: any[]) => {
    dispatch({
      type: 'modules/selectedRowKeysChanged',
      payload: {
        moduleName,
        selectedRowKeys,
      },
    });
  };

  // 如果是选中的同一条记录，那就不再重新触发事件
  const selectRow = (record: any) => {
    const { selectedRowKeys } = moduleState;
    const { primarykey } = moduleInfo;
    if (!(selectedRowKeys.length === 1 && selectedRowKeys[0] === record[primarykey])) {
      dispatch({
        type: 'modules/selectedRowKeysChanged',
        payload: {
          moduleName,
          selectedRowKeys: [record[primarykey]],
        },
      });
    }
  };

  const { limit, curpage, total }: { limit: number; curpage: number; total: number } =
    moduleState.gridParams;

  const refreshData = () => {
    dispatch({
      type: 'modules/fetchData',
      payload: {
        moduleName,
        forceUpdate: true,
      },
    });
  };

  const refreshButton = (
    <Tooltip title="刷新当前页数据">
      <ReloadOutlined onClick={refreshData} />
    </Tooltip>
  );

  const paginationProps: TablePaginationConfig = {
    // size: 'small',
    showLessItems: true,
    hideOnSinglePage: false,
    showSizeChanger: true,
    showQuickJumper: false,
    pageSize: limit,
    current: curpage,
    total,
    showTotal: (atotal, range) => (
      <div className="paginationtoolbar" style={{ display: 'flex', marginLeft: '16px' }}>
        {moduleInfo.moduleLimit.hassqlparam ? (
          <StartEndDateSectionSelect moduleState={moduleState} dispatch={dispatch} inPagination />
        ) : null}
        {!readOnly ? (
          // index.less 中加入了 .ant-pagination-total-text ：flex:1 的定义
          // 模块附加功能中菜单名称是toolbar的
          <Space size="middle">
            {getToolbarButton({ moduleState, dispatch, position: 'pagination' })}
          </Space>
        ) : null}
        <div style={{ flex: 1 }} />
        <Space size="middle" style={{ whiteSpace: 'nowrap' }}>
          {moduleState.recordOrderChanged ? (
            <UpdateRecordOrderNoButton moduleState={moduleState} dispatch={dispatch} />
          ) : null}
          <GridSizeButton moduleState={moduleState} dispatch={dispatch} />
          <SortInfoButton moduleState={moduleState} dispatch={dispatch} />
          <GridSettingButton moduleState={moduleState} dispatch={dispatch} gridType={gridType} />
          {document.body.clientWidth > 768 ? `显示${range[0]}-${range[1]},共${atotal}条` : null}
          {refreshButton}
        </Space>
      </div>
    ),
    onChange: pageChanged,
    onShowSizeChange: onPageSizeChange,
    position: gridType === 'onetomanygrid' ? ['bottomRight'] : ['topRight', 'bottomRight'],
    pageSizeOptions: ['10', '20', '50', '100', '200', '500'],
  };
  const gridScheme: any = getGridScheme(moduleState.currentGridschemeid, moduleInfo);
  const columns = useMemo(
    () => getColumns({ gridScheme, moduleInfo, moduleState, dispatch, gridType, readOnly }),
    [
      moduleState.currentGridschemeid,
      moduleState.monetary,
      moduleState.monetaryPosition,
      moduleState.filters.columnfilter,
      moduleState.sorts,
      // 记录显示方式改变以后，需要重新刷新，不然state还是原来的
      moduleState.formState.showType,
      // pinkey 改变以后也要更新一下
      moduleState.pinkey,
    ],
  );

  const params: any = {};
  if (gridScheme.width) params.scroll = { x: gridScheme.width };
  if (gridScheme.height) params.scroll = { y: gridScheme.height };
  if (moduleInfo.istreemodel) {
    params.expandedRowKeys = moduleState.expandedRowKeys;
    params.onExpand = (expanded: boolean, record: any) => {
      dispatch({
        type: 'modules/expandChanged',
        payload: {
          moduleName: moduleInfo.moduleid,
          expanded,
          key: record[moduleInfo.primarykey],
        },
      });
    };
  } else if (gridScheme.expandRecord) {
    // 设置了可以单击展开记录的功能
    params.expandable = {
      expandedRowRender: (record: any) => (
        <div style={{ borderCollapse: 'collapse' }}>
          <SimpleDescription
            record={record}
            disableTitle
            moduleInfo={moduleInfo}
            dispatch={dispatch}
            isRecordExpand
          />
        </div>
      ),
    };
  } else if (moduleInfo.rowbodytpl) {
    if (moduleInfo.rowbodytpl === 'loading...') {
      params.expandable = {
        expandedRowRender: (record: any) => (
          <RemoteExpandBody moduleInfo={moduleInfo} record={record} />
        ),
      };
    } else {
      params.expandable = {
        expandedRowRender: (record: any) => {
          /* eslint-disable */
          // 使用markdown显示内容
          return (
            <span
              dangerouslySetInnerHTML={{
                __html: marked(templateReplace(moduleInfo.rowbodytpl || '', record)),
              }}
            ></span>
          );
          /* eslint-enable */
        },
      };
    }
  } else if (hasAssociatesSouth(moduleInfo)) {
    // 可以展开下部设置的关联模块
    params.expandable = {
      expandedRowRender: (record: any) => getAssociatesSouthDetails({ record, moduleInfo }),
    };
  }
  if (params.expandable) {
    params.expandedRowKeys = moduleState.expandedRowKeys;
    // 每次只能展开一条记录，如要修改规则，在modules/expandChanged中进行修改
    params.onExpand = (expanded: boolean, record: any) => {
      dispatch({
        type: 'modules/expandChanged',
        payload: {
          moduleName: moduleInfo.moduleid,
          expanded,
          key: record[moduleInfo.primarykey],
          title: record[moduleInfo.namefield],
          selected: true,
        },
      });
    };
  }

  // 小计和总计的字段。
  const subTotalFields: any[] = getSubTotalFields(columns, moduleInfo.namefield);
  subTotalFields.splice(0, 0, null); // 选择列
  if (params.expandable) subTotalFields.splice(0, 0, null); // 展开列
  if (subTotalFields.some((sub) => sub && !sub.namefield)) {
    // 合并起来以后有些问题，在左右滚动的时候，效果不正确
    //     // 找到namefield前面和后面有多少个null列。合并起来
    //     let nullFieldCount = 0;
    //     let isbreak = false;
    //     subTotalFields.forEach((field: any) => {
    //         if (!isbreak) {
    //             if (!field || field.namefield)
    //                 nullFieldCount++;
    //             else
    //                 isbreak = true;
    //         }
    //     })
    //     if (nullFieldCount)
    //         subTotalFields.splice(0, nullFieldCount, { namefield: true, colSpan: nullFieldCount });
    params.summary = (pageData: any[]) => {
      return tableSummary(pageData, moduleState, subTotalFields);
    };
  }

  const components: any = {};
  if (moduleState.currSetting.canDragChangeRecno || moduleState.currSetting.canDragToNavigate) {
    apply(components, {
      body: {
        row: (props: any) => <DragableBodyRow {...props} />,
      },
    });
  }
  // header: {
  //     cell: (props: any) => <DragDropHeaderCell {...props} />
  // }

  // 鼠标拖动行移动位置
  const moveRow = useCallback(
    (dragIndex, hoverIndex, dragRecord) => {
      let data: any[] = moduleState.dataSource;
      if (dragRecord[PARENT_RECORD]) {
        // 如果是树形结构的移动
        data = dragRecord[PARENT_RECORD].children;
      }
      const dragRow = data[dragIndex];
      data.splice(dragIndex, 1);
      data.splice(hoverIndex, 0, dragRow);
      dispatch({
        type: 'modules/updateDataSource',
        payload: {
          moduleName,
          dataSource: [...moduleState.dataSource],
          recordOrderChanged: true,
        },
      });
    },
    [moduleState.dataSource],
  );

  // 鼠标拖动树形结构的位置,将一个节点拖动至另一个节点之下
  const moveToNewParent = useCallback(
    (dragIndex, hoverIndex, dragRecord, hoverRecord) => {
      let data: any[] = moduleState.dataSource;
      if (dragRecord[PARENT_RECORD]) {
        // 如果是树形结构的移动
        data = dragRecord[PARENT_RECORD].children;
      }
      const dragRow = data[dragIndex];
      data.splice(dragIndex, 1);
      let hoverData: any[] = moduleState.dataSource;
      apply(dragRecord, {
        [PARENT_RECORD]: hoverRecord[PARENT_RECORD],
      });
      if (hoverRecord[PARENT_RECORD]) {
        // 如果是树形结构的移动
        hoverData = hoverRecord[PARENT_RECORD].children;
      }
      hoverData.splice(hoverIndex + 1, 0, dragRow);
      dispatch({
        type: 'modules/updateDataSource',
        payload: {
          moduleName,
          dataSource: [...moduleState.dataSource],
          recordOrderChanged: true,
        },
      });
      updateParentKey({
        objectname: moduleName,
        id: dragRecord[moduleInfo.primarykey],
        parentkey: hoverRecord[PARENT_RECORD]
          ? hoverRecord[PARENT_RECORD][moduleInfo.primarykey]
          : null,
      });
    },
    [moduleState.dataSource],
  );

  return (
    <Table
      className="moduletable"
      columns={columns}
      size={moduleState.currSetting.gridSize} //  ={gridType === 'selectfield' || gridType === 'onetomanygrid' || moduleInfo.istreemodel ? 'small' : 'normal'}
      loading={fetchLoading}
      bordered
      showSorterTooltip={false}
      dataSource={
        moduleInfo.istreemodel && moduleState.pinkey && !getAllFilterCount(moduleState)
          ? [getPinRecord(moduleState.dataSource, moduleState.pinkey, moduleInfo.primarykey)]
          : moduleState.dataSource
      }
      rowKey={moduleInfo.primarykey}
      rowSelection={{
        type: gridType === 'selectfield' ? 'radio' : 'checkbox',
        selectedRowKeys: moduleState.selectedRowKeys,
        onChange: handlerSelectedRowKeys,
      }}
      onRow={(record, index) => ({
        record,
        index,
        moveRow,
        moveToNewParent,
        onClick: () => {
          selectRow(record);
        },
        onDoubleClick: () => {
          if (gridType === 'selectfield') {
            manyToOneInfo.setTextValue({
              value: record[moduleInfo.primarykey],
              text: record[moduleInfo.namefield],
            });
          }
        },
      })}
      pagination={paginationProps}
      locale={{
        emptyText: (
          <Empty
            description={
              <span>
                暂无数据
                <Tooltip title="刷新">
                  <ReloadOutlined
                    onClick={refreshData}
                    style={{ marginLeft: '8px', cursor: 'pointer' }}
                  />
                </Tooltip>
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ),
      }}
      onChange={handleTableChange}
      components={components}
      scroll={{ x: true }}
      {...params}
    />
  );
};

export default ModuleGrid;
