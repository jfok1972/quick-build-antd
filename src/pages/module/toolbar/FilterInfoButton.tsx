/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { List, Badge, Tooltip, Descriptions, Popover, Space } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import type { ColumnFilter, ModuleState, UserFilter } from '../data';
import {
  getGridColumnFiltersDescription,
  getColumnFiltersInfo,
  getOperateTitle,
  getAllFilterCount,
  getSqlparamCount,
  getSqlparamFilterAjaxText,
} from '../grid/filterUtils';
import { changeUserFilterToParam, getFilterInitValues } from '../UserDefineFilter';

const { Item } = Descriptions;

const FilterInfoButton = ({
  moduleState,
  dispatch,
}: {
  moduleState: ModuleState;
  dispatch: any;
}) => {
  const { moduleName } = moduleState;
  const allColumnFilter = getGridColumnFiltersDescription(
    moduleState.filters.columnfilter || [],
    getColumnFiltersInfo(moduleName),
    '<br/>',
  );
  const columnFilterMenu = (
    <List style={{ border: '1px solid #f0f0f0' }} size="small">
      <List.Item
        key="info"
        actions={[
          <a
            onClick={() => {
              dispatch({
                type: 'modules/filterChanged',
                payload: {
                  moduleName,
                  type: 'clearAllColumnFilter',
                },
              });
            }}
            key="removeAll"
          >
            全部取消
          </a>,
        ]}
      >
        <b>表头筛选条件</b>
      </List.Item>
      {allColumnFilter.map((item: ColumnFilter, index: number) => {
        return (
          <List.Item key={`key_${index.toString()}`}>
            <Descriptions bordered={false} column={5} size="small" style={{ width: 420 }}>
              <Item style={{ width: 25, paddingBottom: 0 }} key="no.">
                {index + 1}.
              </Item>
              <Item style={{ width: 100, paddingBottom: 0 }} key="property">
                {item.property}
              </Item>
              <Item style={{ width: 60, paddingBottom: 0 }} key="operator">
                <span>{getOperateTitle(item.operator)}</span>
              </Item>
              <Item style={{ width: 205, paddingBottom: 0 }} key="value">
                {/* eslint-disable */}
                <span dangerouslySetInnerHTML={{ __html: item.value as string }} />
                {/* eslint-enable */}
              </Item>
              <Item style={{ width: 40, paddingBottom: 0 }} key="action">
                <a
                  onClick={() => {
                    dispatch({
                      type: 'modules/filterChanged',
                      payload: {
                        type: 'clearColumnFilter',
                        moduleName,
                        dataIndex: item.dataIndex,
                      },
                    });
                  }}
                  key="remove"
                >
                  取消
                </a>
              </Item>
            </Descriptions>
          </List.Item>
        );
      })}
    </List>
  );

  const navigateFilterMenu = (
    <List style={{ border: '1px solid #f0f0f0' }} size="small">
      <List.Item
        key="info"
        actions={[
          <a
            onClick={() => {
              dispatch({
                type: 'modules/filterChanged',
                payload: {
                  type: 'clearNavigateFilter',
                  moduleName,
                  index: -1,
                },
              });
            }}
            key="removeAll"
          >
            全部取消
          </a>,
        ]}
      >
        <b>导航条件列表</b>
      </List.Item>
      {moduleState.filters.navigate?.map((item: any, index: number) => {
        return (
          <List.Item>
            <Descriptions bordered={false} column={5} size="small" style={{ width: 420 }}>
              <Item style={{ width: 25, paddingBottom: 0 }} key="no.">
                {index + 1}.
              </Item>
              <Item style={{ width: 100, paddingBottom: 0 }} key="property">
                {item.fieldtitle}
              </Item>
              <Item style={{ width: 60, paddingBottom: 0 }} key="operator">
                <span>{getOperateTitle(item.operator)}</span>
              </Item>
              <Item style={{ width: 205, paddingBottom: 0 }} key="value">
                {/* eslint-disable */}
                <span dangerouslySetInnerHTML={{ __html: item.text }} />
                {/* eslint-enable */}
              </Item>
              <Item style={{ width: 40, paddingBottom: 0 }} key="action">
                <a
                  onClick={() => {
                    dispatch({
                      type: 'modules/filterChanged',
                      payload: {
                        type: 'clearNavigateFilter',
                        moduleName,
                        index,
                      },
                    });
                  }}
                  key="remove"
                >
                  取消
                </a>
              </Item>
            </Descriptions>
          </List.Item>
        );
      })}
    </List>
  );
  const viewSchemeMenu = (
    <List style={{ border: '1px solid #f0f0f0' }} size="small">
      <List.Item
        key="info"
        actions={[
          <a
            onClick={() => {
              dispatch({
                type: 'modules/filterChanged',
                payload: {
                  type: 'viewSchemeChange',
                  moduleName,
                  viewSchemeChanged: {},
                },
              });
            }}
            key="removeAll"
          >
            取消
          </a>,
        ]}
      >
        <b>视图方案：{moduleState.filters.viewscheme.title}</b>
      </List.Item>
    </List>
  );
  const gridStringFieldQueryMenu = (
    <List style={{ border: '1px solid #f0f0f0' }} size="small">
      <List.Item
        key="info"
        actions={[
          <a
            onClick={() => {
              dispatch({
                type: 'modules/filterChanged',
                payload: {
                  type: 'searchfilter',
                  moduleName,
                  query: '',
                },
              });
            }}
            key="removeAll"
          >
            取消
          </a>,
        ]}
      >
        <b>文本字段中包含：{moduleState.filters.searchfilter}</b>
      </List.Item>
    </List>
  );
  const userFilter = changeUserFilterToParam(moduleState.filters.userfilter, true, '<br />');
  const userFilterMenu = (
    <List style={{ border: '1px solid #f0f0f0' }} size="small">
      <List.Item
        key="info"
        actions={[
          <a
            onClick={() => {
              const userfilter: any[] = [];
              const filter: object = JSON.parse(
                JSON.stringify(getFilterInitValues(moduleState.moduleName)),
              );
              Object.keys(filter).forEach((key) => {
                userfilter.push(filter[key]);
              });
              dispatch({
                type: 'modules/filterChanged',
                payload: {
                  moduleName,
                  type: 'userDefineFilter',
                  userfilter,
                },
              });
            }}
            key="removeAll"
          >
            全部取消
          </a>,
        ]}
      >
        <b>自定义条件列表</b>
      </List.Item>
      {userFilter.map((item: UserFilter, index: number) => {
        return (
          <List.Item key={`li.${index + 1}`}>
            <Descriptions bordered={false} column={5} size="small" style={{ width: 420 }}>
              <Item style={{ width: 25, paddingBottom: 0 }} key="no.">
                {index + 1}.
              </Item>
              <Item style={{ width: 100, paddingBottom: 0 }} key="title">
                {item.title}
              </Item>
              <Item style={{ width: 60, paddingBottom: 0 }} key="operator">
                <span>{getOperateTitle(item.operator)}</span>
              </Item>
              <Item style={{ width: 205, paddingBottom: 0 }} key="value">
                {/* eslint-disable */}
                <span dangerouslySetInnerHTML={{ __html: item.value }} />
                {/* eslint-enable */}
              </Item>
              <Item style={{ width: 40, paddingBottom: 0 }} key="action">
                &nbsp;
              </Item>
            </Descriptions>
          </List.Item>
        );
      })}
    </List>
  );

  const sqlparamMenu = (
    <List style={{ border: '1px solid #f0f0f0' }} size="small">
      <List.Item
        key="sqlparam"
        actions={[
          <a
            onClick={() => {
              dispatch({
                type: 'modules/filterChanged',
                payload: {
                  moduleName,
                  type: 'resetSqlparam',
                },
              });
            }}
            key="removeAll"
          >
            全部取消
          </a>,
        ]}
      >
        <b>查询参数</b>
      </List.Item>
      {getSqlparamFilterAjaxText(moduleState.filters.sqlparam).map(
        (item: UserFilter, index: number) => {
          return (
            <List.Item key={`li.${index + 1}`}>
              <Descriptions bordered={false} column={5} size="small" style={{ width: 420 }}>
                <Item style={{ width: 25, paddingBottom: 0 }} key="no.">
                  {index + 1}.
                </Item>
                <Item style={{ width: 100, paddingBottom: 0 }} key="title">
                  {item.property}
                </Item>
                <Item style={{ width: 60, paddingBottom: 0 }} key="operator">
                  <span>{getOperateTitle(item.operator)}</span>
                </Item>
                <Item style={{ width: 205, paddingBottom: 0 }} key="value">
                  {/* eslint-disable */}
                  <span dangerouslySetInnerHTML={{ __html: item.value }} />
                  {/* eslint-enable */}
                </Item>
                <Item style={{ width: 40, paddingBottom: 0 }} key="action">
                  &nbsp;
                </Item>
              </Descriptions>
            </List.Item>
          );
        },
      )}
    </List>
  );

  const getAllMenu = () => (
    <Space direction="vertical">
      {moduleState.filters.sqlparam && getSqlparamCount(moduleState.filters.sqlparam)
        ? sqlparamMenu
        : null}
      {moduleState.filters.viewscheme.viewschemeid ? viewSchemeMenu : null}
      {moduleState.filters.navigate && moduleState.filters.navigate.length > 0
        ? navigateFilterMenu
        : null}
      {allColumnFilter.length > 0 ? columnFilterMenu : null}
      {userFilter.length > 0 ? userFilterMenu : null}
      {moduleState.filters.searchfilter ? gridStringFieldQueryMenu : null}
    </Space>
  );

  const allFilter: number = getAllFilterCount(moduleState);
  return allFilter > 0 ? (
    <Tooltip title={`筛选条件: ${allFilter}个`}>
      <Popover content={getAllMenu()} trigger={['click']} placement="bottom">
        <Badge
          count={allFilter}
          dot={false}
          offset={[-6, 6]}
          style={{ backgroundColor: '#108ee9' }}
        >
          <FilterOutlined style={{ paddingRight: 20 }} />
        </Badge>
      </Popover>
    </Tooltip>
  ) : null;
  // <Tooltip title={"无筛选条件"}>
  //     <FilterOutlined ></FilterOutlined>
  // </Tooltip>
};
export default FilterInfoButton;
