/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { Key } from 'react';
import { useEffect, useState } from 'react';
import type { DrawerProps } from 'antd/lib/drawer';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tooltip,
  Tree,
  Typography,
} from 'antd';
import { setGlobalDrawerProps } from '@/layouts/BasicLayout';
import { EditOutlined } from '@ant-design/icons';
import request, { API_HEAD } from '@/utils/request';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { serialize } from 'object-to-formdata';
import { download, getAwesomeIcon } from '@/utils/utils';
import type { ActionParamsModal } from './systemAction';
import { getParentOrNavigateIdAndText } from '../modules';
import { loginslatkey } from '@/models/systeminfo';

const { sm4 } = require('sm-crypto');

interface ImportDrawerProps extends DrawerProps {
  children: any;
}

interface LabelValue {
  label: string;
  value: string;
}

const context = (
  <Collapse defaultActiveKey={['remark']} style={{ marginBottom: '16px' }}>
    <Collapse.Panel header="转入相关说明" key="remark">
      <Typography>
        <ul>
          <li>
            表名转换成模块名以及字段名的转换都是按照驼峰命名规则进行,如果有实体bean,实体bean里的字段名必须和字段表里的名称一致；
          </li>
          <li>
            表必须有唯一主键,不能有复合主键;
            视图也必须有唯一主键,主键设置可以在导入表信息后自行设置;
            必须有名称字段，如果没有可以设置为主键字段;
          </li>
          <li>
            各表之间的关联关系是树状结构，不许有循环引用;表自顶向下导入;所有视图的关联关系需要自己设置。
          </li>
          <li>如果业务数据库的表仅用于查询，则不用建立实体bean;</li>
          <li>导入表信息后，请进行检查beanname,如果不对或者没找到系统中已有的bean请自行修正;</li>
          <li>
            具有树形结构的表(代码分级或id-pid类型)只能用做于基础模块，不能用于有大量数据的业务模块;
          </li>
        </ul>
      </Typography>
    </Collapse.Panel>
  </Collapse>
);

const FormComponent = () => {
  const [schemes, setSchemes] = useState<LabelValue[]>([]);
  const [groups, setGroups] = useState<LabelValue[]>([]);
  const [tableviews, setTableviews] = useState<any>([]);
  const [schema, setSchema] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>();
  const [fieldSource, setFieldSource] = useState<any[]>([]);
  const [form] = Form.useForm();

  const getComments = (tablename: string | null): string | null => {
    if (!tablename) return null;
    let comment = tablename;
    tableviews.forEach((rec: any) => {
      if (rec.children)
        rec.children.forEach((r: any) => {
          if (r.key === tablename) comment = r.comment;
        });
    });
    return comment;
  };

  const selectTableView = (selectedTableViewName: string | null) => {
    setSelected(selectedTableViewName);
    form.setFieldsValue({
      title: getComments(selectedTableViewName),
    });
    if (selectedTableViewName) {
      request(
        `${API_HEAD}/platform/database/getfields.do?schema=${
          schema || ''
        }&tablename=${selectedTableViewName}`,
      ).then((response: any) => {
        setFieldSource(response);
      });
    } else setFieldSource([]);
  };

  const columns: any = [
    {
      dataIndex: 'order',
      title: '序号',
      width: '48px',
      align: 'right',
      render: (_: any, record: any, index: number) => {
        return index + 1;
      },
    },
    {
      dataIndex: 'fieldname',
      title: '字段名',
    },
    {
      dataIndex: 'comments',
      title: '字段描述',
      render: (value: string, record: any) => {
        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              let textvalue = value;
              Modal.confirm({
                title: '请输入字段描述',
                icon: null,
                content: (
                  <Form autoComplete="off">
                    <Input
                      name="text"
                      defaultValue={value}
                      maxLength={50}
                      onChange={(e) => {
                        textvalue = e.target.value.trim();
                      }}
                    />
                  </Form>
                ),
                onOk: () => {
                  const rec = record;
                  rec.comments = textvalue || value;
                  setFieldSource([...fieldSource]);
                },
              });
            }}
          >
            <EditOutlined /> {value}
          </div>
        );
      },
    },
    {
      dataIndex: 'namefield',
      title: '名称字段',
      align: 'center',
      width: '76px',
      render: (value: any, record: any) => (
        <Checkbox
          checked={!!value}
          onChange={(e: CheckboxChangeEvent) => {
            fieldSource.forEach((f) => {
              const field = f;
              field.namefield = e.target.checked ? field.fieldname === record.fieldname : false;
            });
            setFieldSource([...fieldSource]);
          }}
        />
      ),
    },
    {
      dataIndex: 'fieldtype',
      title: '字段类型',
    },
    {
      dataIndex: 'fieldlen',
      title: '长度',
    },
    {
      dataIndex: 'fieldrelation',
      title: '关联关系',
    },
    {
      dataIndex: 'jointable',
      title: '关联表',
      render: (value: string, record: any) => {
        if (!value) return value;
        if (!record.by5) return value;
        return (
          <Tooltip title="转到此表或视图">
            <Button
              type="link"
              style={{ padding: 0, margin: 0 }}
              onClick={() => {
                selectTableView(value);
              }}
            >
              {value}
            </Button>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'by5',
      title: '备注',
      // eslint-disable-next-line
      render: (value: string) => <span dangerouslySetInnerHTML={{ __html: value }} />,
      flex: 1,
    },
  ];

  // 导入后把导入的表或视图从树中删除
  const removeTableView = (selectedTableViewName: string) => {
    tableviews.forEach((record: any) => {
      const rec = record;
      if (rec.children)
        rec.children = rec.children.filter((r: any) => r.key !== selectedTableViewName);
    });
    setTableviews([...tableviews]);
    selectTableView(null);
  };

  const importAction = () => {
    const objectgroup: string = form.getFieldValue('objectgroup');
    const title: string = form.getFieldValue('title');
    let namefield = null;
    fieldSource.forEach((rec) => {
      if (rec.namefield) namefield = rec.fieldname;
    });
    if (!selected) {
      message.warn('请先选择一个表或视图！');
      return;
    }
    if (!objectgroup) {
      message.warn('请先选择一个模块分组！');
      return;
    }
    if (!namefield) {
      message.warn(
        '没有选择名称字段，请在下面的grid中选择一个名称字段，如果没有名称字段，则选择主键！',
      );
      return;
    }
    if (!title) {
      message.warn('请录入模块中文名称！');
      return;
    }
    request(`${API_HEAD}/platform/database/importtableorview.do`, {
      params: {
        schema,
        tablename: selected,
        title,
        namefield,
        objectgroup,
        fields: JSON.stringify(
          fieldSource.map((field) => ({
            name: field.fieldname,
            title: field.comments,
          })),
        ),
      },
    }).then((response) => {
      if (response.status) message.error(`${selected}--表信息导入失败，请检查后台日志！`);
      else {
        message.info(`${selected}--表信息导入成功！`);
        removeTableView(selected);
      }
    });
  };

  // 获取数据库未导入的表和视图
  const getTableViews = (aschema: string | null) => {
    request(`${API_HEAD}/platform/database/getnotimporttableview.do`, {
      params: {
        schema: aschema,
      },
    }).then((response: any) => {
      setTableviews(
        response.children.map((child: any) => {
          return {
            title: child.text,
            key: child.value,
            selectable: false,
            children:
              child.children &&
              child.children.map((c: any) => ({
                title: c.value === c.text ? c.value : `${c.text}(${c.value})`,
                key: c.value,
                comment: c.text,
              })),
          };
        }),
      );
    });
  };

  const toolbar = (
    <div>
      <Card bodyStyle={{ padding: 0, margin: 0 }} style={{ marginBottom: '16px' }}>
        <Form form={form} style={{ padding: '16px' }} autoComplete="off">
          <Space size="large" style={{ margin: 0 }}>
            <Form.Item label="选择数据库：" name="schema" style={{ marginBottom: 0 }}>
              <Select
                showSearch
                onChange={(value: any) => {
                  const v = value === '默认数据库' ? null : value;
                  setSchema(v);
                  getTableViews(v);
                }}
                style={{ width: 200 }}
                options={schemes}
              />
            </Form.Item>
            <Form.Item label="模块中文名称：" name="title" style={{ marginBottom: 0 }}>
              <Input style={{ width: 200 }} />
            </Form.Item>
            <Form.Item label="选择模块分组：" name="objectgroup" style={{ marginBottom: 0 }}>
              <Select showSearch options={groups} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" onClick={importAction}>
                导入
              </Button>
            </Form.Item>
          </Space>
          <Space style={{ float: 'right' }}>
            <Tooltip title="在当前数据库中执行SQL语句">
              <Button
                onClick={() => {
                  let sql = '';
                  Modal.confirm({
                    width: '50%',
                    title: '请输入SQL语句',
                    icon: null,
                    okText: '执行',
                    cancelText: '关闭',
                    content: (
                      <Form autoComplete="off" style={{ height: '200px' }}>
                        <Input.TextArea
                          style={{ height: '100%' }}
                          name="sql"
                          onChange={(e) => {
                            sql = e.target.value.trim();
                          }}
                        />
                      </Form>
                    ),
                    onOk: () => {
                      if (sql)
                        request(`${API_HEAD}/platform/systemcommon/executesql.do`, {
                          params: {
                            sql: sm4.encrypt(sql, loginslatkey[0].split('').reverse().join('')),
                          },
                        }).then((response) => {
                          if (response.success) {
                            message.success('SQL语句执行成功！');
                          } else {
                            Modal.error({
                              title: `SQL语句执行失败!`,
                              width: 500,
                              content: response.msg,
                            });
                          }
                        });
                    },
                  });
                }}
              >
                执行SQL语句
              </Button>
            </Tooltip>
            <Tooltip title="打包下载当前选中数据库的Java Bean文件。">
              <Button
                onClick={() => {
                  download(`${API_HEAD}/platform/database/downloadbeanfiles.do`, {
                    schemeName: schema,
                  });
                }}
              >
                下载JavaBean文件
              </Button>
            </Tooltip>
          </Space>
        </Form>
      </Card>
      <Row gutter={16}>
        <Col span={6}>
          <Card title="未加入到系统的表和视图" size="small">
            <Tree
              treeData={tableviews}
              showLine
              key="_tableviewstree"
              style={{ height: '600px', overflowY: 'auto' }}
              expandedKeys={['table', 'view']}
              selectedKeys={[selected as string]}
              onSelect={(
                selectedKeys: Key[],
                info: {
                  event: 'select';
                  selected: boolean;
                },
              ) => {
                if (info.selected) {
                  selectTableView(selectedKeys[0] as string);
                } else {
                  selectTableView(null);
                }
              }}
            />
          </Card>
        </Col>
        <Col span={18}>
          <Card title="字段信息" size="small">
            <Table
              columns={columns}
              size="small"
              bordered
              dataSource={fieldSource}
              style={{ height: '600px', overflowY: 'auto' }}
              pagination={false}
              key="_fieldtable"
              rowKey="fieldname"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  useEffect(() => {
    request(`${API_HEAD}/platform/database/getschemas.do`).then((response: any[]) => {
      setSchemes(response.map(({ text }) => ({ label: text, value: text })));
      form.setFieldsValue({ schema: response[0].text });
      getTableViews(null);
    });

    request(`${API_HEAD}/platform/systemcommon/getobjectgroups.do`).then((response: any[]) => {
      setGroups(response.map(({ text, value }) => ({ label: text, value })));
    });
  }, []);

  return toolbar;
};

/**
 *
 * 导入表和字段
 * @param params
 *
 */
export const importTableAndView = () => {
  const props: ImportDrawerProps = {
    visible: true,
    title: <>{getAwesomeIcon('x-fa fa-sign-in fa-rotate-90')} 表和视图相关信息导入管理</>,
    width: '100%',
    zIndex: undefined,
    children: (
      <span>
        {context}
        <FormComponent />
      </span>
    ),
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
    bodyStyle: { backgroundColor: '#f0f2f5', padding: 16 },
  };
  setGlobalDrawerProps(props);
};

/**
 * 在实体对象字段模块中刷新字段
 * @param params
 */
const refreshFieldsInDataobjectFields = (params: ActionParamsModal) => {
  const { moduleState, dispatch } = params;
  const filter = getParentOrNavigateIdAndText(moduleState, 'FDataobject');
  if (!filter) {
    message.warn('请先在导航列表中选择一个实体对象！');
    return;
  }
  const title = filter.text;
  const objectid = filter.id;
  request(`${API_HEAD}/platform/database/refreshtablefields.do`, {
    method: 'POST',
    data: serialize({
      objectid,
    }),
  }).then((response) => {
    if (response.tag === 0) message.info(`模块${title}表中没有发现新增的字段`);
    else {
      message.info(
        `已成功刷新字段，共加入了 ${response.tag} 个字字段, 字段名称是: ${response.msg}`,
      );
      dispatch({
        type: 'modules/fetchData',
        payload: {
          moduleName: moduleState.moduleName,
          forceUpdate: true,
        },
      });
    }
  });
};

/**
 * 刷新一个表的字段，把表中没有的字段加进来。
 * @param params
 */
export const refreshFields = (params: ActionParamsModal) => {
  const { record, dispatch, moduleState } = params;
  const { moduleName } = moduleState;
  if (moduleName === 'FDataobjectfield') {
    refreshFieldsInDataobjectFields(params);
    return;
  }
  const { title } = record;
  const { objectid } = record;
  request(`${API_HEAD}/platform/database/refreshtablefields.do`, {
    method: 'POST',
    data: serialize({
      objectid,
    }),
  }).then((response) => {
    if (response.tag === 0) message.info(`模块${title}表中没有发现新增的字段`);
    else {
      message.info(
        `已成功刷新字段，共加入了 ${response.tag} 个字字段, 字段名称是: ${response.msg}`,
      );
      dispatch({
        type: 'modules/refreshRecord',
        payload: {
          moduleName,
          recordId: objectid,
        },
      });
    }
  });
};
