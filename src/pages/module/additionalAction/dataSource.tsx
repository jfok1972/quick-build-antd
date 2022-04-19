/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import request, { API_HEAD } from '@/utils/request';
import { useEffect, useState } from 'react';
import { Modal, message, Form, Select, Input, Button } from 'antd';
import { setGlobalModalProps } from '@/layouts/BasicLayout';
import { serialize } from 'object-to-formdata';
import type { ActionParamsModal } from './systemAction';

/**
 * 测试数据源是否能连接成功
 * @param params
 */
export const testDataSource = (params: ActionParamsModal) => {
  const { record, moduleInfo } = params;
  const datasourceid = record[moduleInfo.primarykey];
  request(`${API_HEAD}/platform/datasource/testconnect.do`, {
    timeout: 60 * 1000,
    params: {
      datasourceid,
    },
  }).then((response) => {
    if (response.success) {
      Modal.info({
        width: 500,
        title: '数据源连接测试成功',
        // eslint-disable-next-line
        content: <span dangerouslySetInnerHTML={{ __html: `连接字符串：${response.tag}` }} />,
      });
    } else {
      Modal.error({
        width: 500,
        title: '数据源连接测试失败',
        /* eslint-disable */
        content: (
          <span
            dangerouslySetInnerHTML={{
              __html: `连接字符串：${response.tag}<br/><br/>错误原因：${response.msg}`,
            }}
          />
        ),
        /* eslint-enable */
      });
    }
  });
};

/**
 * 断开数据源
 * @param params
 */
export const breakDataSource = (params: ActionParamsModal) => {
  const { record, moduleInfo } = params;
  const datasourceid = record[moduleInfo.primarykey];
  request(`${API_HEAD}/platform/datasource/breakconnect.do`, {
    timeout: 60 * 1000,
    params: {
      datasourceid,
    },
  }).then((response) => {
    if (response.success) {
      message.success('数据源已从后台断开');
    } else {
      Modal.error({
        width: 500,
        title: '数据源断开失败',
        /* eslint-disable */
        content: <span dangerouslySetInnerHTML={{ __html: `<br/>错误原因：${response.msg}` }} />,
        /* eslint-enable */
      });
    }
  });
};

/**
 * 导入一个数据库连接的数据库
 * @param params
 */
export const importSchema = (params: ActionParamsModal) => {
  const { record, moduleInfo } = params;
  const ImportForm = () => {
    const [form] = Form.useForm();
    const [fieldsValidate, setFieldsValidate] = useState<any>({});
    const [schemes, setSchemes] = useState<string[]>([]);
    const datasourceid = record[moduleInfo.primarykey];
    useEffect(() => {
      request(`${API_HEAD}/platform/datasource/getschemas.do`, {
        method: 'POST',
        data: serialize({
          datasourceid,
        }),
      }).then((response) => {
        setSchemes(response);
      });
    }, []);
    return (
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} autoComplete="off">
        <Form.Item label="业务数据库名" name="name" rules={[{ required: true }]}>
          <Select
            dropdownStyle={{ zIndex: 10001 }}
            onChange={(value) => {
              form.setFieldsValue({ title: value });
            }}
          >
            {schemes.map((scheme) => (
              <Select.Option key={scheme} value={scheme}>
                {scheme}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="表对象前缀"
          name="objectnameahead"
          // regexg 不起作用？
          rules={[
            {
              type: 'regexp',
              pattern: /^[A-Za-z][\w]{0,5}$/,
              message: '字母开头,只包含字母数字下划线',
            },
            { required: true },
          ]}
          validateStatus={fieldsValidate.objectnameahead ? 'error' : undefined}
          help={fieldsValidate.objectnameahead}
        >
          <Input maxLength={6} placeholder="用于区分其他数据库的唯一标识符" />
        </Form.Item>
        <Form.Item
          label="数据库说明"
          name="title"
          help="详细描述此业务数据库的用途等信息"
          rules={[{ required: true }]}
        >
          <Input maxLength={50} />
        </Form.Item>
        <Form.Item style={{ marginTop: '24px' }} wrapperCol={{ span: 14, offset: 6 }}>
          <Button
            type="primary"
            onClick={() => {
              form.validateFields().then(() => {
                setFieldsValidate({});
                const values = form.getFieldsValue();
                if (!/^[A-Za-z][\w]{0,5}$/.test(values.objectnameahead)) {
                  setFieldsValidate({
                    objectnameahead: '表对象前缀必须以字母开头,只包含字母数字下划线。',
                  });
                  return;
                }
                request(`${API_HEAD}/platform/datasource/addschema.do`, {
                  params: {
                    datasourceid,
                    name: values.name,
                    title: values.title,
                    objectnameahead: values.objectnameahead,
                  },
                }).then((result) => {
                  if (result.success) {
                    message.info(
                      `业务数据库『${values.title}』导入成功!,请去业务数据库模块中导入表。`,
                    );
                    setSchemes(schemes.filter((scheme) => scheme !== values.name));
                    form.resetFields();
                  } else {
                    message.error(`导入数据库失败!${result.msg}`);
                  }
                });
              });
            }}
          >
            导入
          </Button>
        </Form.Item>
      </Form>
    );
  };
  setGlobalModalProps({
    visible: true,
    zIndex: 10000,
    title: `『${record.title}』业务数据库导入`,
    onCancel: () => setGlobalModalProps({ visible: false }),
    children: <ImportForm />,
    footer: null,
  });
};
