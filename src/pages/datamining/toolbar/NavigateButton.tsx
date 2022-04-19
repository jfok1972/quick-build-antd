/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Tooltip, Button } from 'antd';
import { BsCursor, BsCursorFill } from 'react-icons/bs';
import type { DataminingModal } from '../data';
import { ACT_TOGGLE_NAVIGATE_REGION } from '../constants';

const NavigateButton = ({ state, dispatch }: { state: DataminingModal; dispatch: any }) => {
  const { visible } = state.currSetting.navigate;
  const changeVisible = () => {
    dispatch({
      type: ACT_TOGGLE_NAVIGATE_REGION,
      payload: {},
    });
  };
  return (
    <Tooltip title={visible ? '隐藏导航' : '显示导航'}>
      <Button type={visible ? 'link' : 'text'} size="small" onClick={changeVisible}>
        {visible ? <BsCursorFill className="anticon" /> : <BsCursor className="anticon" />} 导航
      </Button>
    </Tooltip>
  );
};

export default NavigateButton;
