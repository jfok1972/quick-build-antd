/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Dropdown, Menu, Button } from 'antd';
import type { Dispatch } from 'redux';
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  DownOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { ModuleState, ModuleModal, SortModal } from '../data';
import { getModuleInfo, getSortSchemes } from '../modules';

const hiddenIcon = <CheckOutlined style={{ visibility: 'hidden' }} />;

const SortInfoButton = ({
  moduleState,
  dispatch,
}: {
  moduleState: ModuleState;
  dispatch: Dispatch;
}) => {
  const { moduleName } = moduleState;
  const moduleInfo: ModuleModal = getModuleInfo(moduleName);
  const sortSchemes = getSortSchemes(moduleInfo);
  const { sorts } = moduleState;
  const hassort: boolean = sorts.length > 0 || !!moduleState.sortschemeid;
  const { multiple } = moduleState.sortMultiple;
  const menu = (
    <Menu>
      <Menu.Item
        key="reset"
        disabled={!hassort}
        onClick={() => {
          dispatch({
            type: 'modules/resetSorts',
            payload: {
              moduleName,
            },
          });
        }}
      >
        恢复默认排序
      </Menu.Item>
      <Menu.Divider />
      {sortSchemes.length > 0 ? (
        <Menu.ItemGroup title="排序方案">
          {sortSchemes.map((scheme: any) => {
            const { sortschemeid } = scheme;
            return (
              <Menu.Item
                key={sortschemeid}
                icon={sortschemeid === moduleState.sortschemeid ? <CheckOutlined /> : hiddenIcon}
                onClick={() => {
                  dispatch({
                    type: 'modules/sortSchemeChanged',
                    payload: {
                      moduleName,
                      sortschemeid,
                    },
                  });
                }}
              >
                {scheme.schemename}
              </Menu.Item>
            );
          })}
        </Menu.ItemGroup>
      ) : null}
      {sortSchemes.length > 0 ? <Menu.Divider /> : null}
      <Menu.Item
        key="single"
        icon={multiple ? hiddenIcon : <CheckOutlined />}
        onClick={() => {
          dispatch({
            type: 'modules/sortMultipleChanged',
            payload: {
              moduleName,
              sortMultiple: {},
            },
          });
        }}
      >
        单字段排段
      </Menu.Item>
      <Menu.Item
        key="mult"
        icon={multiple ? <CheckOutlined /> : hiddenIcon}
        onClick={() => {
          dispatch({
            type: 'modules/sortMultipleChanged',
            payload: {
              moduleName,
              sortMultiple: { multiple: 1 },
            },
          });
        }}
      >
        多字段排序
      </Menu.Item>
      {sorts.length > 0 ? <Menu.Divider /> : null}
      {sorts.length > 0 ? (
        <Menu.ItemGroup title="当前排序">
          {sorts.map((sort: SortModal) => (
            <Menu.Item
              key={sort.property}
              icon={
                sort.direction === 'ASC' ? <SortAscendingOutlined /> : <SortDescendingOutlined />
              }
            >
              {sort.title}
            </Menu.Item>
          ))}
        </Menu.ItemGroup>
      ) : null}
    </Menu>
  );
  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <Button size="small" type={hassort ? 'link' : 'text'} style={{ padding: '0px' }}>
        <SortAscendingOutlined />
        <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default SortInfoButton;
