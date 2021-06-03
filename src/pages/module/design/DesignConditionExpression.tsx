import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Tooltip,
  Tree,
} from 'antd';
import { getFunctionOptions } from './DesignDefaultOrder';
import {
  fetchConditionExpression,
  updateConditionExpression,
  testConditionExpression,
} from '../service';
import { apply, loop, uuid } from '@/utils/utils';
import { getAllhasChildrenRowids } from '@/pages/datamining/utils';
import { CloseOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { SelectModuleFieldPopover } from './SelectModuleField';

interface DesignConditionExpressionProps {
  record: Record<string, unknown>;
}

const farray = [
  'fieldtitle',
  'fieldid',
  'title',
  'functionid',
  'userfunction',
  'operator',
  'ovalue',
  'remark',
];

const fieldOperator = [
  {
    value: 'eq',
    label: '=',
  },
  {
    value: 'gt',
    label: '>',
  },
  {
    value: 'ge',
    label: '>=',
  },
  {
    value: 'lt',
    label: '<',
  },
  {
    value: 'le',
    label: '<=',
  },
  {
    value: 'ne',
    label: '<>',
  },
  {
    value: 'in',
    label: '列表',
  },
  {
    value: 'not in',
    label: '列表外',
  },
  {
    value: 'between',
    label: '区间',
  },
  {
    value: 'not between',
    label: '区间外',
  },
  {
    value: 'like',
    label: '包含',
  },
  {
    value: 'not like',
    label: '不包含',
  },
  {
    value: 'startwith',
    label: '开始于',
  },
  {
    value: 'not startwith',
    label: '不开始',
  },
  {
    value: 'regexp',
    label: '正则',
  },
];

const getChildNodesArray = (pnode: any) => {
  const result: any[] = [];
  pnode.children.forEach((node: any) => {
    const nodedata: any = {};
    farray.forEach((f) => {
      if (node[f]) nodedata[f] = node[f];
    });
    if (node.children && node.children.length) nodedata.children = getChildNodesArray(node);
    result.push(nodedata);
  });
  return result;
};

const saveConditionExpression = (details: any[], record: any) => {
  updateConditionExpression({
    conditionid: record.conditionid,
    schemename: record.title,
    schemeDefine: JSON.stringify(getChildNodesArray(details[0])),
  }).then((response) => {
    if (response.success) {
      message.success(`自定义条件『${record.title}』的定义已保存。`);
    } else {
      Modal.error({
        title: `自定义条件定义保存失败！`,
        width: 500,
        content: response.msg,
      });
    }
  });
};

const testExpression = (record: any) => {
  testConditionExpression({
    objectid: record['FDataobject.objectid'],
    conditionid: record.conditionid,
  }).then((response) => {
    if (response.success) {
      message.success(
        `自定义条件可以使用。满足条件的记录有${response.tag}条，表达式为：${response.msg}`,
      );
    } else {
      Modal.error({
        title: `条件表达式不能解析！`,
        width: 500,
        content: response.msg,
      });
    }
  });
};

export const DesignConditionExpression: React.FC<DesignConditionExpressionProps> = ({ record }) => {
  const moduleName = record['FDataobject.objectid'] as string;
  const { conditionid } = record;
  const [form] = Form.useForm();

  const [details, setDetails] = useState<any[]>([]);
  const [detailsExpandKey, setDetailsExpandKey] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string[]>([]);
  const [editRecord, setEditRecord] = useState<any>(null);

  const updateText = (rec: any) => {
    if (rec) {
      apply(rec, { text: rec.title || rec.fieldtitle || rec.text });
      setDetails((v) => [...v]);
    }
  };

  // 从后台传过来的数据中，有title的表示是修改过后的，如果只有text,那就是默认的
  const changeTextToTitle = (object: any) => {
    if (Array.isArray(object)) {
      object.forEach((o: any) => changeTextToTitle(o));
    } else if (Object.prototype.toString.call(object) === '[object Object]') {
      if (object.children) {
        object.children.forEach((child: any) => {
          apply(child, {
            parent: object,
          });
        });
        changeTextToTitle(object.children);
      }
    }
  };

  useEffect(() => {
    fetchConditionExpression({
      conditionId: conditionid,
    }).then((response) => {
      const ds = [
        {
          key: 'root',
          children: response.children,
          text: '已经设置的字段',
          selectable: false,
        },
      ];
      setDetailsExpandKey(getAllhasChildrenRowids(ds, 'key'));
      changeTextToTitle(ds);
      setDetails(ds);
    });
  }, [conditionid]);

  useEffect(() => {
    form.resetFields();
    if (editRecord) {
      form.setFieldsValue({
        fieldtitle: editRecord.fieldtitle,
        fieldid: editRecord.fieldid,
        title: editRecord.title,
        functionid: editRecord.functionid,
        userfunction: editRecord.userfunction,
        operator: editRecord.operator,
        ovalue: editRecord.ovalue,
        remark: editRecord.remark,
      });
    }
  }, [editRecord]);

  return (
    <>
      <Card
        size="small"
        title="已经设置的条件表达式"
        extra={
          <Space>
            <Button
              size="small"
              onClick={() => {
                details[0].children.push({
                  text: '新增的字段组',
                  key: uuid(),
                  parent: details[0],
                });
                setDetails((v) => [...v]);
              }}
            >
              <PlusOutlined />
            </Button>
            <Button
              size="small"
              onClick={() => {
                if (selectedKey.length === 1) {
                  loop(details, selectedKey[0], (srecord) => {
                    const pchild: any[] = srecord.parent.children;
                    pchild.splice(
                      pchild.findIndex((rec) => rec === srecord),
                      1,
                    );
                    setSelectedKey([]);
                    setDetails((v) => [...v]);
                    setEditRecord(null);
                  });
                } else {
                  message.warn('请先选择一个节点！');
                }
              }}
            >
              <DeleteOutlined />
            </Button>
            <Tooltip title="如果修改过条件表达式，请先保存再测试">
              <Button
                size="small"
                onClick={() => {
                  testExpression(record);
                }}
              >
                测试表达式
              </Button>
            </Tooltip>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                saveConditionExpression(details, record);
              }}
            >
              <SaveOutlined />
              保存
            </Button>
          </Space>
        }
      >
        <Tree
          className="selectedgroupandfield"
          showLine
          treeData={details}
          titleRender={(node: any) => node.text}
          expandedKeys={detailsExpandKey}
          onExpand={(expandKeys) => setDetailsExpandKey(expandKeys as string[])}
          selectedKeys={selectedKey}
          onSelect={(selectedKeys) => {
            setSelectedKey(selectedKeys as string[]);
            setEditRecord(null);
            if (selectedKeys.length === 1) {
              loop(details, selectedKeys[0] as string, (rec) => {
                setEditRecord(rec);
              });
            }
          }}
          draggable
          onDrop={(info: any) => {
            const targetKey = info.node.key as string;
            // 放在目标节点的下面
            if ((info.dropToGap && targetKey !== 'root') || info.node.fieldid) {
              loop(details, targetKey, (targetRecord, targetPos) => {
                loop(details, info.dragNode.key as string, (dragRecord, dragPos) => {
                  dragRecord.parent.children.splice(dragPos, 1);
                  apply(dragRecord, { parent: targetRecord.parent });
                  targetRecord.parent.children.splice(targetPos + 1, 0, dragRecord);
                });
              });
            } else {
              // 放在目标节点的子节点的第一个位置
              loop(details, targetKey, (targetRecord) => {
                loop(details, info.dragNode.key as string, (dragRecord, dragPos) => {
                  dragRecord.parent.children.splice(dragPos, 1);
                  apply(dragRecord, { parent: targetRecord });
                  if (!targetRecord.children) {
                    apply(targetRecord, { children: [] });
                    setDetailsExpandKey([...detailsExpandKey, targetRecord.key]);
                  }
                  targetRecord.children.unshift(dragRecord);
                });
              });
            }
            setDetails([...details]);
          }}
        />
      </Card>
      <Card size="small" title="条件表达式内容设置" style={{ marginTop: '16px' }}>
        <Form
          className="moduleform"
          form={form}
          size="middle"
          autoComplete="off"
          labelCol={{ flex: '0 0 120px' }}
          onValuesChange={(changedValues) => {
            apply(editRecord, changedValues);
            updateText(editRecord);
          }}
        >
          <Row>
            <Col span={24}>
              <Form.Item label="模块字段" name="fieldtitle">
                <Input
                  readOnly
                  suffix={
                    <CloseOutlined
                      onClick={() => {
                        const val = {
                          fieldtitle: undefined,
                          fieldid: undefined,
                        };
                        form.setFieldsValue(val);
                        apply(editRecord, val);
                        updateText(editRecord);
                      }}
                    />
                  }
                  addonAfter={
                    <SelectModuleFieldPopover
                      moduleName={moduleName}
                      defaultFieldId={editRecord && editRecord.fieldid}
                      callback={(field: any) => {
                        const val = {
                          fieldtitle: field.title,
                          fieldid: field.fieldid,
                        };
                        form.setFieldsValue(val);
                        apply(editRecord, val);
                        updateText(editRecord);
                      }}
                    />
                  }
                />
              </Form.Item>
            </Col>
            <Col span={24} style={{ display: 'none' }}>
              <Form.Item label="模块字段" name="fieldid">
                <Input readOnly />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="显示内容" name="title">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="系统自定义函数" name="functionid">
                <Select
                  allowClear
                  showSearch={true}
                  options={getFunctionOptions()}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  filterOption={(input, option: any) => {
                    return (
                      option.label && option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    );
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="自定义函数" name="userfunction">
                <Input.TextArea
                  autoSize={{ maxRows: 5 }}
                  placeholder="this 表示当前字段, 1%,2% 表示子节点的顺序"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="比较符" name="operator">
                <Select
                  allowClear
                  showSearch={true}
                  options={fieldOperator}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  filterOption={(input, option: any) => {
                    return (
                      option.label && option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    );
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={16}>
              <Form.Item label="比较值" name="ovalue">
                <Input.TextArea autoSize={{ maxRows: 5 }} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="备注" name="remark">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </>
  );
};
