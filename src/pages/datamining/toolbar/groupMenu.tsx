/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Menu } from 'antd';
import { getMenuAwesomeIcon } from '@/utils/utils';
import type { ExpandGroupTreeFieldModal } from '../data';

const groupMenu = (expandGroupFieldsTree: ExpandGroupTreeFieldModal[], callback: Function) => {
  let keyCount = 1;
  const getMenu = (groups: ExpandGroupTreeFieldModal[]) =>
    groups.map((group) => {
      if (group.text === '-')
        // eslint-disable-next-line
        return <Menu.Divider key={`dividerkey${keyCount++}`} />;
      if (group.menu)
        return [
          group.fieldid ? (
            <Menu.Item
              icon={getMenuAwesomeIcon(group.iconCls)}
              key={group.fieldid}
              onClick={() => {
                callback(group);
              }}
            >
              {group.text || group.title}
            </Menu.Item>
          ) : null,
          <Menu.SubMenu
            title={group.text}
            icon={getMenuAwesomeIcon(group.iconCls)}
            // eslint-disable-next-line
            key={(group.fieldid || 'submenu') + keyCount++}
          >
            {getMenu(group.menu)}
          </Menu.SubMenu>,
        ];
      return (
        <Menu.Item
          icon={getMenuAwesomeIcon(group.iconCls)}
          key={group.fieldid}
          onClick={() => {
            callback(group);
          }}
        >
          {group.text || group.title}
        </Menu.Item>
      );
    });
  return getMenu(expandGroupFieldsTree || []);
};

export default groupMenu;
