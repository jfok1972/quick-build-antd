/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Alert, Checkbox, Row, Col, Button, Popover, Modal, Form, Tooltip } from 'antd';
import React, { useState } from 'react';
import { useIntl } from 'umi';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { Dispatch, AnyAction } from 'redux';
import { connect } from 'dva';
import type { StateType } from '@/models/login';
import type { LoginParamsType } from '@/services/login';
import type { ConnectState } from '@/models/connect';
import type { SystemInfo } from '@/models/systeminfo';
import { decryptString } from '@/utils/utils';
import {
  QqOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import { API_HEAD } from '@/utils/request';
import LoginFrom from './components/Login';
import styles from './style.less';

const { sm4 } = require('sm-crypto');

export const LOGINSLATKEY = 'login-user-loginslatkey';
export const PASSWORD = 'login-user-password';
export const USERCODE = 'login-user-code';
export const SAVEPWD = 'login-allow-save-pwd';
export const VALIDATIONCODE = 'login_validation_code';

const { Tab, UserCode, Password, Mobile, Captcha, Submit, IdentifingCode } = LoginFrom;
interface LoginProps {
  dispatch: Dispatch<AnyAction>;
  userLogin: StateType;
  submitting?: boolean;
  systemInfo?: SystemInfo;
}

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => (
  <Alert
    style={{
      marginBottom: 24,
    }}
    message={content}
    type="error"
    showIcon
  />
);

const renderMessage = (content: string) => (
  <Alert style={{ marginBottom: 24 }} message={content} type="error" showIcon />
);

const Login: React.FC<LoginProps> = ({ dispatch, userLogin, submitting, systemInfo }) => {
  const {
    systeminfo: { forgetpassword = '' },
    loginsettinginfo,
  } = systemInfo!;
  const { alwaysneedidentifingcode, needidentifingcode, allowsavepassword } = loginsettinginfo;
  const { status, errorcode, type: loginType } = userLogin;
  const [type, setType] = useState<string>('account');
  const [savePassword, setSavePassword] = useState<boolean>(
    localStorage.getItem(SAVEPWD) === 'true',
  );
  const [identifingcodeT] = useState<number>(new Date().getTime());
  const handleSubmit = (values: LoginParamsType) => {
    dispatch({
      type: 'login/login',
      payload: { ...values, type },
    });
  };

  const changeSavePassword = (e: CheckboxChangeEvent) => {
    localStorage.setItem(SAVEPWD, e.target.checked ? 'true' : 'false');
    if (!e.target.checked) {
      localStorage.removeItem(LOGINSLATKEY);
      localStorage.removeItem(PASSWORD);
    }
    setSavePassword(e.target.checked);
  };

  const [form] = Form.useForm(); // form为下面LoginFrom的实例
  const { formatMessage } = useIntl();
  return (
    <div className={styles.main}>
      <LoginFrom
        activeKey={type}
        onTabChange={setType}
        onSubmit={handleSubmit}
        from={form}
        initialValues={{
          usercode: localStorage.getItem(USERCODE) || undefined,
          password:
            savePassword && localStorage.getItem(PASSWORD) && localStorage.getItem(LOGINSLATKEY)
              ? sm4.decrypt(
                  decryptString(localStorage.getItem(PASSWORD) as string),
                  decryptString(localStorage.getItem(LOGINSLATKEY) as string)
                    .split('')
                    .reverse()
                    .join(''),
                )
              : '',
        }}
      >
        <Tab key="account" tab={formatMessage({ id: 'user-login.login.tab-login-credentials' })}>
          {status === 'error' &&
            loginType === 'account' &&
            !submitting &&
            renderMessage(
              formatMessage({ id: `user-login.login.message-invalid-code-${errorcode}` }),
            )}
          <UserCode
            name="usercode"
            placeholder={formatMessage({ id: 'user-login.login.usercode' })}
            rules={[
              {
                required: true,
                message: formatMessage({ id: 'user-login.usercode.required' }),
              },
            ]}
          />
          <Password
            name="password"
            placeholder={formatMessage({ id: 'user-login.login.password' })}
            rules={[
              {
                required: true,
                message: formatMessage({ id: 'user-login.password.required' }),
              },
            ]}
          />

          {alwaysneedidentifingcode ||
          (status === 'error' && loginType === 'account' && needidentifingcode) ? (
            <Row>
              <Col span={9}>
                <IdentifingCode
                  name="identifingcode"
                  placeholder={formatMessage({ id: 'user-login.verification-code.placeholder' })}
                  rules={[
                    {
                      required: true,
                      message: formatMessage({ id: 'user-login.verification-code.required' }),
                    },
                    {
                      max: 4,
                      message: formatMessage({ id: 'user-login.verification-code.max4' }),
                    },
                  ]}
                />
              </Col>
              <Col span={7}>
                <img
                  id={VALIDATIONCODE}
                  alt=""
                  style={{ height: '38px', width: '100px', paddingLeft: 10 }}
                  src={`${API_HEAD}/login/validatecode.do?t=${identifingcodeT}`}
                />
              </Col>
              <Col span={6}>
                <Button
                  type="link"
                  onClick={() => {
                    const node: any = document.getElementById(VALIDATIONCODE);
                    node.src = `${API_HEAD}/login/validatecode.do?t=${new Date().getTime()}`;
                    form.setFieldsValue({
                      identifingcode: '',
                    });
                    document.getElementById('identifingcode')?.focus();
                  }}
                >
                  换一张
                </Button>
              </Col>
            </Row>
          ) : null}
          <div>
            <Checkbox
              checked={savePassword}
              onChange={changeSavePassword}
              style={{ visibility: allowsavepassword ? 'visible' : 'hidden' }}
            >
              {formatMessage({ id: 'user-login.login.remember-password' })}
            </Checkbox>
            <Popover
              trigger="click"
              content={
                <div
                  style={{ padding: 5 }}
                  // eslint-disable-next-line
                  dangerouslySetInnerHTML={{ __html: forgetpassword }}
                />
              }
              title={
                <div>
                  <WarningOutlined style={{ color: 'red' }} />
                  {` ${formatMessage({ id: 'user-login.login.forgot-password' })}?`}
                </div>
              }
            >
              <a style={{ float: 'right' }} href="">
                {formatMessage({ id: 'user-login.login.forgot-password' })}
              </a>
            </Popover>
          </div>
        </Tab>
        <Tab key="mobile" tab="手机号登录" disabled>
          {status === 'error' && loginType === 'mobile' && !submitting && (
            <LoginMessage content="验证码错误" />
          )}
          <Mobile
            name="mobile"
            placeholder="手机号"
            rules={[
              {
                required: true,
                message: '请输入手机号！',
              },
              {
                pattern: /^1\d{10}$/,
                message: '手机号格式错误！',
              },
            ]}
          />
          <Captcha
            name="captcha"
            placeholder="验证码"
            countDown={120}
            getCaptchaButtonText=""
            getCaptchaSecondText="秒"
            rules={[
              {
                required: true,
                message: '请输入验证码！',
              },
            ]}
          />
        </Tab>
        {/* <div>
          <Checkbox checked={autoLogin} onChange={e => setAutoLogin(e.target.checked)}>
            自动登录
          </Checkbox>
          <a
            style={{
              float: 'right',
            }}
          >
            忘记密码
          </a>
        </div> */}
        <Submit loading={submitting}>登录</Submit>
        <div className={styles.other} style={{ display: 'none' }}>
          其他登录方式：
          <Tooltip title="QQ扫码登录">
            <QqOutlined className={styles.icon} />
          </Tooltip>
          <Tooltip title="微信扫码登录">
            <WechatOutlined className={styles.icon} />
          </Tooltip>
          {/* <Link className={styles.register} to="/user/register">
            注册账户
          </Link> */}
        </div>
      </LoginFrom>

      <Modal
        title={
          <span>
            <QuestionCircleOutlined style={{ marginRight: '4px' }} />
            {formatMessage({ id: 'user-login.login.message-invalidate-title' })}
          </span>
        }
        closable={false}
        visible={status === 'warnning'}
        okText="确定登录"
        cancelText="取消"
        onOk={() => {
          if (form) {
            const fieldsValue: any = form.getFieldsValue();
            fieldsValue.invalidate = true;
            handleSubmit(fieldsValue);
          }
        }}
        onCancel={() => {
          dispatch({
            type: 'login/loginErrorCode7',
          });
        }}
      >
        {formatMessage({ id: 'user-login.login.message-invalidate' })}
      </Modal>
    </div>
  );
};

export default connect(({ login, loading, systemInfo }: ConnectState) => ({
  userLogin: login,
  submitting: loading.effects['login/login'],
  ...systemInfo,
}))(Login);
