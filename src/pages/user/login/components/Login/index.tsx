/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Tabs, Form } from 'antd';
import React, { useState } from 'react';
import useMergeValue from 'use-merge-value';
import classNames from 'classnames';
import type { FormInstance } from 'antd/es/form';
import type { LoginParamsType } from '@/services/login';
import LoginContext from './LoginContext';
import type { LoginItemProps } from './LoginItem';
import LoginItem from './LoginItem';
import LoginSubmit from './LoginSubmit';
import LoginTab from './LoginTab';
import styles from './index.less';

export interface LoginProps {
  activeKey?: string;
  onTabChange?: (key: string) => void;
  style?: React.CSSProperties;
  onSubmit?: (values: LoginParamsType) => void;
  initialValues?: object;
  className?: string;
  from?: FormInstance;
  children: React.ReactElement<typeof LoginTab>[];
}

interface LoginType extends React.FC<LoginProps> {
  Tab: typeof LoginTab;
  Submit: typeof LoginSubmit;
  UserCode: React.FunctionComponent<LoginItemProps>;
  Password: React.FunctionComponent<LoginItemProps>;
  IdentifingCode: React.FunctionComponent<LoginItemProps>;
  Mobile: React.FunctionComponent<LoginItemProps>;
  Captcha: React.FunctionComponent<LoginItemProps>;
}

const Login: LoginType = (props) => {
  const { className } = props;
  const [tabs, setTabs] = useState<string[]>([]);
  const [active, setActive] = useState({});
  const [type, setType] = useMergeValue('', {
    value: props.activeKey,
    onChange: props.onTabChange,
  });
  const TabChildren: React.ReactComponentElement<typeof LoginTab>[] = [];
  const otherChildren: React.ReactElement<unknown>[] = [];
  React.Children.forEach(
    props.children,
    (child: React.ReactComponentElement<typeof LoginTab> | React.ReactElement<unknown>) => {
      if (!child) {
        return;
      }
      if ((child.type as { typeName: string }).typeName === 'LoginTab') {
        TabChildren.push(child as React.ReactComponentElement<typeof LoginTab>);
      } else {
        otherChildren.push(child);
      }
    },
  );
  return (
    <LoginContext.Provider
      value={{
        tabUtil: {
          addTab: (id) => {
            setTabs([...tabs, id]);
          },
          removeTab: (id) => {
            setTabs(tabs.filter((currentId) => currentId !== id));
          },
        },
        updateActive: (activeItem) => {
          if (active[type]) {
            active[type].push(activeItem);
          } else {
            active[type] = [activeItem];
          }
          setActive(active);
        },
      }}
    >
      <div className={classNames(className, styles.login)}>
        <Form
          form={props.from}
          initialValues={props.initialValues}
          onFinish={(values) => {
            if (props.onSubmit) {
              props.onSubmit(values as LoginParamsType);
            }
          }}
        >
          {tabs.length ? (
            <React.Fragment>
              <Tabs
                centered
                animated={false}
                className={styles.tabs}
                activeKey={type}
                onChange={(activeKey) => {
                  setType(activeKey);
                }}
              >
                {TabChildren}
              </Tabs>
              {otherChildren}
            </React.Fragment>
          ) : (
            props.children
          )}
        </Form>
      </div>
    </LoginContext.Provider>
  );
};

Login.Tab = LoginTab;
Login.Submit = LoginSubmit;

Login.UserCode = LoginItem.UserCode;
Login.Password = LoginItem.Password;
Login.IdentifingCode = LoginItem.IdentifingCode;

Login.Mobile = LoginItem.Mobile;
Login.Captcha = LoginItem.Captcha;

export default Login;
