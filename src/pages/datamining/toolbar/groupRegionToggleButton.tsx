/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Tooltip, Button } from 'antd';
import { NodeExpandOutlined } from '@ant-design/icons';
import type { DataminingModal } from '../data';
import { ACT_TOGGLE_GROUP_REGION } from '../constants';

const GroupRegionToggleButton = ({
  state,
  dispatch,
}: {
  state: DataminingModal;
  dispatch: any;
}) => {
  const visible = state.currSetting.groupRegionVisible;
  const changeVisible = () => {
    dispatch({
      type: ACT_TOGGLE_GROUP_REGION,
      payload: {},
    });
  };
  return (
    <Tooltip title={visible ? '隐藏分组列表' : '显示分组列表'}>
      <Button type={visible ? 'link' : 'text'} size="small" onClick={changeVisible}>
        <NodeExpandOutlined /> 分组
      </Button>
    </Tooltip>
  );
};

export default GroupRegionToggleButton;
