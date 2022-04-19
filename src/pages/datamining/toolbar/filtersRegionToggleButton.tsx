/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Tooltip, Button, Badge } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import type { DataminingModal } from '../data';
import { ACT_TOGGLE_FILTER_REGION } from '../constants';

const FiltersRegionToggleButton = ({
  state,
  dispatch,
}: {
  state: DataminingModal;
  dispatch: any;
}) => {
  const visible = state.currSetting.filtersRegionVisible;
  const changeVisible = () => {
    dispatch({
      type: ACT_TOGGLE_FILTER_REGION,
      payload: {},
    });
  };
  return (
    <Tooltip title={visible ? '隐藏条件列表' : '显示条件列表'}>
      <Button type={visible ? 'link' : 'text'} size="small" onClick={changeVisible}>
        <LinkOutlined /> 条件
        {state.filterDataSource.length ? (
          <Badge dot status="success" style={{ marginLeft: '4px' }} />
        ) : null}
      </Button>
    </Tooltip>
  );
};

export default FiltersRegionToggleButton;
