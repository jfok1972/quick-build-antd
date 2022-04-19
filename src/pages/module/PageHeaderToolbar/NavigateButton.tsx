/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Tooltip, Button } from 'antd';
import { BsCursor, BsCursorFill } from 'react-icons/bs';
import type { ModuleState } from '../data';

const NavigateButton = ({ moduleState, dispatch }: { moduleState: ModuleState; dispatch: any }) => {
  const { moduleName } = moduleState;
  const { visible } = moduleState.currSetting.navigate;
  const changeVisible = () => {
    dispatch({
      type: 'modules/toggleNavigate',
      payload: {
        moduleName,
        toggle: 'visible',
      },
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
