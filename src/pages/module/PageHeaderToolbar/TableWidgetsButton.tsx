import { Tooltip, Button } from 'antd';
import { FilterOutlined, FilterFilled } from '@ant-design/icons';
import type { ModuleState } from '../data';

const TableWidgetsButton = ({
  moduleState,
  dispatch,
}: {
  moduleState: ModuleState | any;
  dispatch: any;
}) => {
  const { moduleName } = moduleState;
  const visible = moduleState.currSetting.tableWidgetsVisible;
  const changeVisible = () => {
    dispatch({
      type: 'modules/toggleTableWidgets',
      payload: {
        moduleName,
      },
    });
  };
  return (
    <Tooltip title={visible ? '隐藏分析内容' : '显示分析内容'}>
      <Button type={visible ? 'link' : 'text'} size="small" onClick={changeVisible}>
        {visible ? <FilterFilled /> : <FilterOutlined />} 分析
      </Button>
    </Tooltip>
  );
};

export default TableWidgetsButton;
