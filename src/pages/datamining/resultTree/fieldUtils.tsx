/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Menu } from 'antd';
import type { DataminingModal } from '../data';

/**
 * 获取当前未选中的所有可聚合字段的菜单条
 * @param state
 * @param callback
 */
export const getAggregateFieldMenu = (state: DataminingModal, callback: Function): any[] => {
  const menu: any = state.aggregateFields
    ?.filter(
      (field) =>
        !state.schemeState.fieldGroup.find(
          (f) => f.aggregatefieldname === field.aggregatefieldname,
        ),
    )
    .map((field) => (
      <Menu.Item key={field.aggregatefieldname} onClick={() => callback(field)}>
        {field.text}
      </Menu.Item>
    ));
  if (!menu || !menu.length) {
    return [
      <Menu.Item key="noanymore">定义的聚合字段都已加入，如需要更多字段请咨询管理员</Menu.Item>,
    ];
  }
  return menu;
};
