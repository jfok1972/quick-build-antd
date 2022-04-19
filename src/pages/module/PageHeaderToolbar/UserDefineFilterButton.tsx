/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Tooltip, Button } from 'antd';
import { FilterOutlined, FilterFilled } from '@ant-design/icons';
import type { ModuleState } from '../data';

const UserDefineFilterButton = ({
  moduleState,
  dispatch,
}: {
  moduleState: ModuleState | any;
  dispatch: any;
}) => {
  const { moduleName } = moduleState;
  const visible = moduleState.currSetting.userFilterRegionVisible;
  const changeVisible = () => {
    dispatch({
      type: 'modules/toggleUserFilter',
      payload: {
        moduleName,
      },
    });
  };
  return (
    <Tooltip title={visible ? '隐藏自定义筛选条件' : '显示自定义筛选条件'}>
      <Button type={visible ? 'link' : 'text'} size="small" onClick={changeVisible}>
        {visible ? <FilterFilled /> : <FilterOutlined />} 筛选
      </Button>
    </Tooltip>
  );
};

export default UserDefineFilterButton;
