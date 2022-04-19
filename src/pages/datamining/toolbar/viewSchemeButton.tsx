/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useContext } from 'react';
import { Menu, Dropdown, Button } from 'antd';
import { ApiOutlined, CheckOutlined } from '@ant-design/icons';
import type { DataminingStateContext } from '..';
import { DataminingContext } from '..';
import { getModuleInfo, getViewSchemes } from '../../module/modules';
import type { TextValue } from '../../module/data';

const spaceIcon = <ApiOutlined style={{ visibility: 'hidden' }} />;
const selectIcon = <CheckOutlined />;

const ViewSchemeButton: React.FC = () => {
  const context = useContext<DataminingStateContext>(DataminingContext);
  const { state, dispatch } = context;
  const { moduleName, filters } = state;
  const { viewscheme } = filters;
  const moduleInfo = getModuleInfo(moduleName);
  const { viewschemes } = moduleInfo;

  const handleMenuClick = (e: any) => {
    const { key }: { key: string } = e;
    dispatch({
      type: 'filterChanged',
      payload: {
        type: 'viewSchemeChange',
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
    <Menu onClick={handleMenuClick} key="viewScheme">
      {viewscheme.title ? <Menu.Item key="cancelviewscheme">取消视图方案</Menu.Item> : null}
      {viewscheme.title ? <Menu.Divider /> : null}
      <Menu.ItemGroup title="视图方案">
        {getViewSchemes(viewschemes).map((scheme) => (
          <Menu.Item
            key={scheme.value}
            icon={viewscheme.viewschemeid === scheme.value ? selectIcon : spaceIcon}
          >
            {scheme.text}
          </Menu.Item>
        ))}
      </Menu.ItemGroup>
    </Menu>
  );
  return (
    <Dropdown overlay={menu}>
      <Button size="small" type={viewscheme.title ? 'link' : 'text'}>
        <ApiOutlined /> 视图方案 {viewscheme.title ? `：${viewscheme.title}` : null}
      </Button>
    </Dropdown>
  );
};

export default ViewSchemeButton;
