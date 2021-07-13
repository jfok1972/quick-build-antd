import { Space, Table } from 'antd';
import {
  BorderOutlined,
  CheckSquareOutlined,
  EllipsisOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import type { DataminingModal } from '../data';
import { ACT_SELECTED_ROWKEYS_CHANGED } from '../constants';
import { getAllChildRowids, getAllhasChildrenRowids, getAllleafRowids } from '../utils';

export const selectionsMenu = (state: DataminingModal, dispatch: Function) => {
  const {
    schemeState: { dataSource },
  } = state;
  const updateSelections = (keys: string[]) => {
    dispatch({
      type: ACT_SELECTED_ROWKEYS_CHANGED,
      payload: { selectedRowKeys: keys },
    });
  };
  return [
    {
      key: Table.SELECTION_ALL,
      text: (
        <Space>
          <CheckSquareOutlined />
          全选所有记录
        </Space>
      ),
      onSelect: () => {
        updateSelections(getAllChildRowids({ children: dataSource }));
      },
    },
    {
      key: 'selected_clear',
      text: (
        <Space>
          <BorderOutlined />
          取消所有选中记录
        </Space>
      ),
      onSelect: () => {
        updateSelections([]);
      },
    },
    {
      key: Table.SELECTION_INVERT,
      text: (
        <Space>
          <SwapOutlined />
          反选所有记录
        </Space>
      ),
      onSelect: () => {
        updateSelections(
          getAllChildRowids({ children: dataSource }).filter(
            (key) => !state.selectedRowKeys.find((sk) => sk === key),
          ),
        );
      },
    },
    {
      key: 'select_allleaf',
      text: (
        <Space>
          <EllipsisOutlined style={{ visibility: 'hidden' }} />
          选择所有末级节点
        </Space>
      ),
      onSelect: () => {
        updateSelections(getAllleafRowids(dataSource));
      },
    },
    {
      key: 'select_allnotleaf',
      text: (
        <Space>
          <EllipsisOutlined style={{ visibility: 'hidden' }} />
          选择所有非末级节点
        </Space>
      ),
      onSelect: () => {
        updateSelections(getAllhasChildrenRowids(dataSource));
      },
    },
  ];
};
