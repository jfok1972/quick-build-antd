/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { AppstoreOutlined, BarsOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import type { Dispatch } from 'redux';
import type { ModuleState } from '../data';

interface GridCardToggleButtonProps {
  moduleState: ModuleState;
  dispatch: Dispatch;
}

export const GridCardToggleButton: React.FC<GridCardToggleButtonProps> = ({
  moduleState,
  dispatch,
}) => {
  const {
    moduleName,
    currSetting: { isShowListCard },
  } = moduleState;
  const onClick = () =>
    dispatch({
      type: 'modules/toggleIsShowListCard',
      payload: {
        moduleName,
      },
    });
  return (
    <span style={{ cursor: 'pointer' }}>
      {isShowListCard ? (
        <Tooltip title="显示标准列表">
          <BarsOutlined onClick={onClick} />
        </Tooltip>
      ) : (
        <Tooltip title="显示卡片列表">
          <AppstoreOutlined onClick={onClick} />
        </Tooltip>
      )}
    </span>
  );
};
