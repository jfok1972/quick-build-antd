/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Menu, Dropdown, Button } from 'antd';
import { ApiOutlined, CheckOutlined } from '@ant-design/icons';
import type { ModuleModal, TextValue, ModuleState } from '../data';
import { getViewSchemes } from '../modules';

const spaceIcon = <ApiOutlined style={{ visibility: 'hidden' }} />;
const selectIcon = <CheckOutlined />;

const ViewSchemeButton = ({
  moduleState,
  moduleInfo,
  dispatch,
}: {
  moduleState: ModuleState;
  moduleInfo: ModuleModal;
  dispatch: any;
}) => {
  const { modulename: moduleName, viewschemes } = moduleInfo;
  const { filters } = moduleState;
  const { viewscheme: currScheme }: { viewscheme: any } = filters;
  const handleMenuClick = (e: any) => {
    const { key }: { key: string } = e;
    dispatch({
      type: 'modules/filterChanged',
      payload: {
        type: 'viewSchemeChange',
        moduleName,
        viewscheme:
          key === 'cancelviewscheme'
            ? {}
            : {
                viewschemeid: key,
                title: getViewSchemes(viewschemes).find((scheme: TextValue) => scheme.value === key)
                  ?.text,
              },
      },
    });
  };

  const menu = (
    <Menu onClick={handleMenuClick} key="navigateScheme">
      {currScheme.title ? <Menu.Item key="cancelviewscheme">取消视图方案</Menu.Item> : null}
      {currScheme.title ? <Menu.Divider /> : null}
      <Menu.ItemGroup title="视图方案">
        {getViewSchemes(viewschemes).map((scheme) => (
          <Menu.Item
            key={scheme.value}
            icon={currScheme.viewschemeid === scheme.value ? selectIcon : spaceIcon}
          >
            {scheme.text}
          </Menu.Item>
        ))}
      </Menu.ItemGroup>
    </Menu>
  );
  return (
    <Dropdown overlay={menu}>
      <Button size="small" type={currScheme.title ? 'link' : 'text'}>
        <ApiOutlined /> 视图方案 {currScheme.title ? `：${currScheme.title}` : null}
      </Button>
    </Dropdown>
  );
};

export default ViewSchemeButton;
