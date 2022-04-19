/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useState } from 'react';
import type { Dispatch } from 'redux';
import type { UserModelState } from '@/models/connect';
import { ApiOutlined } from '@ant-design/icons';
import { connect } from 'dva';
import classNames from 'classnames';
import type { CanSelectDataRole } from 'umi';
import { Badge, Dropdown, Menu, message, Switch } from 'antd';
import request, { API_HEAD } from '@/utils/request';
import actionstyles from './index.less';
import styles from '../NoticeIcon/index.less';

interface CanSelectRoleProps {
  dispatch: Dispatch<any>;
  dataRole?: CanSelectDataRole[];
}

const CanSelectRoleIconView: React.FC<CanSelectRoleProps> = ({ dataRole, dispatch }) => {
  const [refreshImmediately, setRefreshImmediately] = useState<boolean>(
    localStorage.getItem('roleChangeRefreshImmediately') === 'true',
  );
  const refreshModuleData = (moduleName: string) => {
    dispatch({
      type: 'modules/fetchData',
      payload: {
        moduleName,
        forceUpdate: true,
      },
    });
  };
  const refreshAllSelected = () => {
    const selected: Set<string> = new Set<string>();
    if (dataRole)
      dataRole.forEach((role) => {
        if (role.checked) {
          role.moduleNames.forEach((moduleName) => selected.add(moduleName));
        }
      });
    selected.forEach((moduleName) => refreshModuleData(moduleName));
  };
  const refreshLinkedModuleData = (role: CanSelectDataRole) => {
    role.moduleNames.forEach((moduleName) => refreshModuleData(moduleName));
  };
  const onRoleSwitch = (checked: boolean, event: Event, role: CanSelectDataRole) => {
    event.stopPropagation();
    request(`${API_HEAD}/platform/userfavourite/toggledatarole.do`, {
      params: {
        roleid: role.roleId,
        checked,
      },
    }).then((response: any) => {
      if (response.success) {
        if (refreshImmediately) {
          window.location.reload();
          return;
        }
        dispatch({
          type: 'user/dataRoleCheckChanged',
          payload: {
            roleId: role.roleId,
            checked,
          },
        });
        refreshLinkedModuleData(role);
        message.warn('当前数据权限已改变，请刷新当前数据或刷新网页！');
      }
    });
  };

  const saveToDefault = () => {
    if (dataRole) {
      const roleStates = dataRole.map((role) => ({
        roleId: role.roleId,
        checked: role.checked,
      }));
      request(`${API_HEAD}/platform/userfavourite/updatedefaultdatarole.do`, {
        params: {
          rolestates: JSON.stringify(roleStates),
        },
      }).then((response: any) => {
        if (response.success) {
          message.success('已将当前数据权限的选择状态保存为默认值！');
        }
      });
    }
  };

  const resetToDefault = () => {
    request(`${API_HEAD}/platform/userfavourite/resetdefaultdatarole.do`, {
      params: {},
    }).then((response: any) => {
      if (response.success) {
        dispatch({
          type: 'user/dataRoleCheckReset',
        });
        refreshAllSelected();
        message.success('已将数据权限的默认状态设置为系统默认值！');
      }
    });
  };

  const notificationBox = (
    <Menu>
      <Menu.ItemGroup title="可以选择的数据权限">
        {dataRole
          ? dataRole.map((role) => (
              <Menu.Item key={role.roleId}>
                <span style={{ marginRight: '24px' }}>{role.roleName}</span>
                <Switch
                  checked={role.checked}
                  onChange={(checked, event) => onRoleSwitch(checked, event, role)}
                  style={{ float: 'right' }}
                />
              </Menu.Item>
            ))
          : null}
      </Menu.ItemGroup>
      <Menu.Divider />
      <Menu.Item key="saveToDefault" onClick={saveToDefault}>
        保存为我的默认设置
      </Menu.Item>
      <Menu.Item key="resetToDefault" onClick={resetToDefault}>
        重置为系统默认选项
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="refreshimmediately">
        <span style={{ marginRight: '24px' }}>数据权限更改后立即刷新网页</span>
        <Switch
          checked={refreshImmediately}
          onChange={(checked, event) => {
            event.stopPropagation();
            setRefreshImmediately(checked);
            localStorage.setItem('roleChangeRefreshImmediately', checked ? 'true' : 'false');
          }}
          style={{ float: 'right' }}
        />
      </Menu.Item>
    </Menu>
  );

  const noticeButtonClass = classNames(actionstyles.action, styles.noticeButton);
  const NoticeBellIcon = <ApiOutlined className={styles.icon} />;
  const trigger = (
    <span className={classNames(noticeButtonClass)}>
      <Badge
        count={dataRole?.filter((role) => role.checked).length}
        style={{ boxShadow: 'none', background: 'green' }}
        className={styles.badge}
      >
        {NoticeBellIcon}
      </Badge>
    </span>
  );
  return dataRole ? (
    <Dropdown placement="bottomRight" overlay={notificationBox} trigger={['click']}>
      {trigger}
    </Dropdown>
  ) : null;
};

export default connect(({ user }: { user: UserModelState }) => ({
  user,
  dataRole: user.currentUser?.canselectdatarole,
}))(CanSelectRoleIconView);
