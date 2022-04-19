/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { useState } from 'react';
import type { Dispatch } from 'redux';
import { Card, Form, List, message, Modal } from 'antd';
import Password from 'antd/lib/input/Password';
import type { ValidateStatus } from 'antd/lib/form/FormItem';
import request, { API_HEAD } from '@/utils/request';
import { serialize } from 'object-to-formdata';
import { loginslatkey } from '@/models/systeminfo';

const { sm4 } = require('sm-crypto');

const SecurityView = ({ user, dispatch }: { user: any; dispatch: Dispatch }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [validateStatus, setValidateStatus] = useState<ValidateStatus>('');
  const [strong, setStrong] = useState<string>('未知');
  const [help, setHelp] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [form] = Form.useForm();

  const checkStrong = (val: string) => {
    let modes = 0;
    if (val.length < 6) return 0;
    if (/\d/.test(val)) modes += 1; // 数字
    if (/[a-z]/.test(val)) modes += 1; // 小写
    if (/[A-Z]/.test(val)) modes += 1; // 大写
    if (/\W/.test(val)) modes += 1; // 特殊字符
    if (val.length > 12) return 3;
    return modes;
  };

  const initStatus = () => {
    setStrong('未知');
    setValidateStatus('');
    setHelp(null);
  };

  const getStrong = (value: string) => {
    if (!value) {
      initStatus();
    }
    const level = checkStrong(value);
    /* eslint-disable */
    setStrong(level === 0 ? '太短' : level === 1 ? '弱' : level === 2 ? '中' : '强');
    setValidateStatus(
      level === 0 ? 'error' : level === 1 ? 'error' : level === 2 ? 'success' : 'success',
    );
    setHelp(
      level === 0
        ? '密码最少6个字符'
        : level === 1
        ? '密码强度弱'
        : level === 2
        ? '密码强度中'
        : '密码强度强',
    );
    /* eslint-enable */
  };

  const submitChange = () => {
    form.validateFields().then((values) => {
      setConfirmLoading(true);
      request(`${API_HEAD}/platform/systemframe/changepassword.do`, {
        method: 'post',
        data: serialize({
          oldPassword: sm4.encrypt(
            values.oldPassword,
            loginslatkey[0].split('').reverse().join(''),
          ),
          newPassword: sm4.encrypt(
            values.newPassword,
            loginslatkey[0].split('').reverse().join(''),
          ),
          strong,
        }),
      })
        .then((response) => {
          if (response.success) {
            message.success('新密码保存成功！');
            setVisible(false);
            dispatch({
              type: 'accountCenter/fetchCurrent',
            });
          } else {
            Modal.error({
              width: 500,
              title: '密码修改错误',
              content: `错误原因：${response.msg}`,
            });
          }
        })
        .finally(() => {
          setConfirmLoading(false);
        });
    });
  };

  const data = [
    {
      title: '账户密码',
      description: `当前密码强度：${user ? user.security : '未知'}`,
      actions: [
        <a
          key="Modify"
          onClick={() => {
            form.resetFields();
            initStatus();
            setVisible(true);
          }}
        >
          修改
        </a>,
      ],
    },
  ];

  return (
    <Card title="安全设置" bordered={false}>
      <List
        itemLayout="horizontal"
        dataSource={data}
        renderItem={(item) => (
          <List.Item actions={item.actions}>
            <List.Item.Meta title={item.title} description={item.description} />
          </List.Item>
        )}
      />
      <Modal
        title={<span className="x-fa fa-user-secret"> 修改密码</span>}
        destroyOnClose
        visible={visible}
        confirmLoading={confirmLoading}
        okText="确定"
        cancelText="取消"
        onOk={submitChange}
        onCancel={() => setVisible(false)}
      >
        <Card bordered={false} bodyStyle={{ padding: 0, margin: 0 }}>
          <Form form={form} labelCol={{ span: 8 }} wrapperCol={{ span: 12 }}>
            <Form.Item
              label="原密码"
              name="oldPassword"
              rules={[
                {
                  required: true,
                  message: '请输入原密码!',
                },
              ]}
            >
              <Password maxLength={16} />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPassword"
              hasFeedback
              validateStatus={validateStatus}
              help={help}
              rules={[
                {
                  required: true,
                  message: '请输入新密码!',
                },
                {
                  type: 'string',
                  min: 6,
                },
                () => ({
                  validator() {
                    if (strong === '中' || strong === '强') return Promise.resolve();
                    return Promise.reject(new Error('密码强度弱'));
                  },
                }),
              ]}
            >
              <Password onChange={(event) => getStrong(event.target.value)} maxLength={16} />
            </Form.Item>
            <Form.Item
              label="确认密码"
              name="newPasswordagain"
              hasFeedback
              dependencies={['newPassword']}
              rules={[
                {
                  required: true,
                  message: '请输入确认密码!',
                },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('确认密码和新密码不一致!'));
                  },
                }),
              ]}
            >
              <Password maxLength={16} />
            </Form.Item>
          </Form>
          <span style={{ textAlign: 'center', display: 'block' }}>密码强度：{strong}</span>
        </Card>
      </Modal>
    </Card>
  );
};

export default SecurityView;
