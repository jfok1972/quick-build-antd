import { Table } from 'antd';
import { BorderOutlined, CheckSquareOutlined, SwapOutlined } from '@ant-design/icons';
import { EMPTY_MENU_ICON } from '@/utils/utils';
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
        <>
          <CheckSquareOutlined />
          全选所有记录
        </>
      ),
      onSelect: () => {
        updateSelections(getAllChildRowids({ children: dataSource }));
      },
    },
    {
      key: 'selected_clear',
      text: (
        <>
          <BorderOutlined />
          取消所有选中记录
        </>
      ),
      onSelect: () => {
        updateSelections([]);
      },
    },
    {
      key: Table.SELECTION_INVERT,
      text: (
        <>
          <SwapOutlined />
          反选所有记录
        </>
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
      text: <>{EMPTY_MENU_ICON}选择所有末级节点</>,
      onSelect: () => {
        updateSelections(getAllleafRowids(dataSource));
      },
    },
    {
      key: 'select_allnotleaf',
      text: <>{EMPTY_MENU_ICON}选择所有非末级节点</>,
      onSelect: () => {
        updateSelections(getAllhasChildrenRowids(dataSource));
      },
    },
  ];
};
