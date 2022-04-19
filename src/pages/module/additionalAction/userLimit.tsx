/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useState } from 'react';
import { Table, Tag, Tree, Button, Space, Card, message, Modal, Tooltip } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { apply } from '@/utils/utils';
import {
  queryUserAllLimits,
  queryUserLimits,
  saveUserLimits,
  queryRoleLimits,
  saveRoleLimits,
} from './systemActionService';

const checkedRender = (value: any, fieldTitle: string) => (
  <Tooltip title={fieldTitle}> {value ? '●' : null}</Tooltip>
);

const booleanFields = [
  {
    dataIndex: 'query_',
    text: '可浏览',
  },
  {
    dataIndex: 'new_',
    text: '可新建',
  },
  {
    dataIndex: 'newnavigate_',
    text: '新建向导',
  },
  {
    dataIndex: 'edit_',
    text: '可修改',
  },
  {
    dataIndex: 'directedit_',
    text: '直接修改',
  },
  {
    dataIndex: 'delete_',
    text: '可删除',
  },
  {
    dataIndex: 'attachmentquery_',
    text: '浏览附件',
  },
  {
    dataIndex: 'attachmentadd_',
    text: '新建附件',
  },
  {
    dataIndex: 'attachmentedit_',
    text: '修改附件',
  },
  {
    dataIndex: 'attachmentdelete_',
    text: '删除附件',
  },
  {
    dataIndex: 'approvestart_',
    text: '启动流程',
  },
  {
    dataIndex: 'approvepause_',
    text: '暂停流程',
  },
  {
    dataIndex: 'approvecancel_',
    text: '取消流程',
  },
  {
    dataIndex: 'approvechangeassign_',
    text: '更换审批人',
  },
  {
    dataIndex: 'auditingcancel_',
    text: '取消审核',
  },
  {
    dataIndex: 'auditingchangeuser_',
    text: '更换审核人',
  },
];

const titleColumns = {
  title: '系统模块或分组',
  dataIndex: 'text',
  render: (value: any) => value,
};

const additionfunction = {
  title: '附加权限',
  dataIndex: 'additionfunction',
  render: (value: any) => {
    let array = null;
    if (Array.isArray(value)) {
      array = value;
    }
    if (typeof value === 'string') {
      array = value.split(',');
    }
    if (array) {
      return array.map((item: string) => <Tag key={item}>{item}</Tag>);
    }
    return null;
  },
};

const DisplayUserLimits: React.FC<any> = ({
  userid,
  timestramp,
}: {
  userid: string;
  timestramp: number;
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([titleColumns]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  useEffect(() => {
    // console.log('display user limit execute......')
    setLoading(true);
    queryUserAllLimits({ userid }).then((limitData) => {
      const visibleColumn = {};
      let key = 1;
      const adjust = (rec: any) => {
        const record = rec;
        delete record.checked;
        const { type } = record;
        record.key = `${key}`;
        key += 1;
        if (type === 'homepagescheme' || type === 'dataobject') {
          // 如果是最基层的模块，把权限的定义转换一下
          delete record.children;
          const atti = record.attributes;
          Object.keys(atti).forEach((i) => {
            record[i] = atti[i];
            visibleColumn[i] = true;
          });
        } else {
          record.children.forEach((r: any) => {
            adjust(r);
          });
        }
      };
      // 所有展开的行的key
      const expandedRow: any = [];
      limitData.forEach((record: any) => {
        adjust(record);
        expandedRow.push(record.key);
      });
      const cols: any = [titleColumns];
      booleanFields.forEach((field) => {
        if (visibleColumn[field.dataIndex])
          cols.push({
            title: field.text.split('').map((c) => (
              <>
                {c}
                <br />
              </>
            )),
            dataIndex: field.dataIndex,
            render: (value: any) => checkedRender(value, field.text),
            align: 'center',
          });
      });
      cols.push(additionfunction);
      cols.forEach((element: any) => {
        apply(element, { key: element.dataIndex });
      });
      setColumns(cols);
      setData(limitData);
      setExpandedRowKeys(expandedRow);
      setLoading(false);
    });
  }, [timestramp]);
  return (
    <Table
      scroll={{ x: true, y: '500px' }}
      columns={columns}
      dataSource={data}
      pagination={false}
      expandedRowKeys={expandedRowKeys}
      onExpandedRowsChange={(v: any) => setExpandedRowKeys(v)}
      loading={loading}
      size="small"
      bordered
    />
  );
};

const SetUserLimits: React.FC<any> = ({
  userid,
  msg,
  timestramp,
}: {
  userid: string;
  msg: string;
  timestramp: number;
}) => {
  const [changed, setChanged] = useState<boolean>(false);
  const [data, setData] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  useEffect(() => {
    // console.log('set user limit execute......')
    queryUserLimits({ userid }).then((limitData) => {
      let key = 1;
      const keys: string[] = [];
      const adjust = (rec: any) => {
        const record = rec;
        record.title = record.text;
        if (record.objectid) record.key = record.objectid;
        else {
          record.key = `key-${key}`;
          key += 1;
        }
        if (record.checked) keys.push(record.key);
        if (record.children)
          record.children.forEach((r: any) => {
            adjust(r);
          });
      };
      // 所有展开的行的key
      const expandedRow: any = [];
      limitData.forEach((record: any) => {
        adjust(record);
        expandedRow.push(record.key);
      });
      setChanged(false);
      setCheckedKeys(keys);
      setData(limitData);
      setExpandedKeys(expandedRow);
      // console.log(limitData);
      // console.log(expandedRow);
    });
  }, [timestramp]);
  const checkall = () => {
    const keys: string[] = [];
    const addtokeys = (record: any) => {
      keys.push(record.key);
      if (record.children) record.children.forEach((rec: any) => addtokeys(rec));
    };
    data.forEach((record: any) => addtokeys(record));
    setCheckedKeys(keys);
    setChanged(true);
  };
  const checkquery = () => {
    const keys: string[] = [];
    const addtokeys = (record: any) => {
      const { type } = record;
      if (type === 'query' || type === 'attachmentquery') keys.push(record.key);
      if (record.children) record.children.forEach((rec: any) => addtokeys(rec));
    };
    data.forEach((record: any) => addtokeys(record));
    setCheckedKeys(keys);
    setChanged(true);
  };
  const reset = () => {
    setCheckedKeys([]);
    setChanged(true);
  };
  const save = () => {
    saveUserLimits({
      userid,
      ids: checkedKeys.filter((key) => !key.startsWith('key-')).join(','),
    }).then((response: any) => {
      if (response.success) {
        message.success(`${msg}保存成功`);
        setChanged(false);
      } else {
        Modal.warning({
          okText: '知道了',
          title: `${msg}保存失败`,
          // eslint-disable-next-line
          content: <span dangerouslySetInnerHTML={{ __html: response.msg }} />,
        });
      }
    });
  };
  return (
    <div style={{ height: '100%', display: 'flex', flexFlow: 'column' }}>
      <div style={{ display: 'flex' }}>
        <Space style={{ marginBottom: '16px' }}>
          <Button onClick={checkall}>全选</Button>
          <Button onClick={checkquery}>仅浏览</Button>
          <Button onClick={reset}>重置</Button>
          {/* <Button onClick={() => console.log(checkedKeys)}>显示值</Button> */}
        </Space>
        <span style={{ flex: 1 }} />
        <Button icon={<SaveOutlined />} type="primary" onClick={save} disabled={!changed}>
          保存
        </Button>
      </div>
      <Card style={{ flex: 1, overflowY: 'auto' }}>
        <Tree
          checkable
          treeData={data}
          expandedKeys={expandedKeys}
          checkedKeys={checkedKeys}
          onCheck={(v: any) => {
            setCheckedKeys(v);
            setChanged(true);
          }}
          onExpand={(v: any) => {
            setExpandedKeys(v);
            setAutoExpandParent(false);
          }}
          autoExpandParent={autoExpandParent}
        />
      </Card>
    </div>
  );
};

const SetRoleLimits: React.FC<any> = ({
  roleid,
  msg,
  display,
  timestramp,
}: {
  roleid: string;
  msg: string;
  display: boolean;
  timestramp: number;
}) => {
  const [changed, setChanged] = useState<boolean>(false);
  const [data, setData] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  useEffect(() => {
    // console.log('set role limit execute......')
    queryRoleLimits({ roleid }).then((limitData) => {
      let key = 1;
      const keys: string[] = [];
      const adjust = (rec: any) => {
        const record = rec;
        record.title = record.text;
        if (record.objectid) record.key = record.objectid;
        else {
          record.key = `key-${key}`;
          key += 1;
        }
        if (record.checked) keys.push(record.key);
        if (record.children)
          record.children.forEach((r: any) => {
            adjust(r);
          });
      };
      // 所有展开的行的key
      const expandedRow: any = [];
      limitData.forEach((record: any) => {
        adjust(record);
        expandedRow.push(record.key);
      });
      setChanged(false);
      setCheckedKeys(keys);
      setData(limitData);
      setExpandedKeys(expandedRow);
      // console.log(limitData);
      // console.log(expandedRow);
    });
  }, [timestramp]);
  const checkall = () => {
    const keys: string[] = [];
    const addtokeys = (record: any) => {
      keys.push(record.key);
      if (record.children) record.children.forEach((rec: any) => addtokeys(rec));
    };
    data.forEach((record: any) => addtokeys(record));
    setCheckedKeys(keys);
    setChanged(true);
  };
  const checkquery = () => {
    const keys: string[] = [];
    const addtokeys = (record: any) => {
      const { type } = record;
      if (type === 'query' || type === 'attachmentquery') keys.push(record.key);
      if (record.children) record.children.forEach((rec: any) => addtokeys(rec));
    };
    data.forEach((record: any) => addtokeys(record));
    setCheckedKeys(keys);
    setChanged(true);
  };
  const reset = () => {
    setCheckedKeys([]);
    setChanged(true);
  };
  const save = () => {
    saveRoleLimits({
      roleid,
      ids: checkedKeys.filter((key) => !key.startsWith('key-')).join(','),
    }).then((response: any) => {
      if (response.success) {
        message.success(`${msg}保存成功`);
        setChanged(false);
      } else {
        Modal.warning({
          okText: '知道了',
          title: `${msg}保存失败`,
          // eslint-disable-next-line
          content: <span dangerouslySetInnerHTML={{ __html: response.msg }} />,
        });
      }
    });
  };
  return (
    <div style={{ height: '100%', display: 'flex', flexFlow: 'column' }}>
      {display ? null : (
        <div style={{ display: 'flex' }}>
          <Space style={{ marginBottom: '16px' }}>
            <Button onClick={checkall}>全选</Button>
            <Button onClick={checkquery}>仅浏览</Button>
            <Button onClick={reset}>重置</Button>
            {/* <Button onClick={() => console.log(checkedKeys)}>显示值</Button> */}
          </Space>
          <span style={{ flex: 1 }} />
          <Button icon={<SaveOutlined />} type="primary" onClick={save} disabled={!changed}>
            保存
          </Button>
        </div>
      )}
      <Card style={{ flex: 1, overflowY: 'auto' }}>
        <Tree
          checkable
          treeData={data}
          expandedKeys={expandedKeys}
          checkedKeys={checkedKeys}
          onCheck={(v: any) => {
            setCheckedKeys(v);
            setChanged(true);
          }}
          onExpand={(v: any) => {
            setExpandedKeys(v);
            setAutoExpandParent(false);
          }}
          autoExpandParent={autoExpandParent}
        />
      </Card>
    </div>
  );
};

export { DisplayUserLimits, SetUserLimits, SetRoleLimits };
