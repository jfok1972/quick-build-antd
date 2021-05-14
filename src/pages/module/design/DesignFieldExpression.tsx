import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, message, Row, Select, Tree } from 'antd';
import { getFunctionOptions } from './DesignDefaultOrder';
import { fetchFieldExpression } from '../service';
import { apply, loop, uuid } from '@/utils/utils';
import { getAllhasChildrenRowids } from '@/pages/datamining/utils';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { SelectModuleField } from './SelectModuleField';

interface DesignFieldExpressionProps {
  record: Record<string, unknown>;
}

export const DesignFieldExpression: React.FC<DesignFieldExpressionProps> = ({ record }) => {
  const moduleName = record['FDataobject.objectid'] as string;
  const { additionfieldid } = record;
  const [form] = Form.useForm();

  const [details, setDetails] = useState<any[]>([]);
  const [detailsExpandKey, setDetailsExpandKey] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string[]>([]);
  const [editRecord, setEditRecord] = useState<any>(null);

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
    fetchFieldExpression({
      additionfieldid,
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
  }, [additionfieldid]);

  useEffect(() => {
    form.resetFields();
    if (editRecord) {
      form.setFieldsValue({
        fieldtitle: editRecord.fieldtitle,
        fieldid: editRecord.fieldid,
        title: editRecord.title,
        functionid: editRecord.functionid,
        userfunction: editRecord.userfunction,
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
          <>
            <Button
              size="small"
              type="link"
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
              type="link"
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
            <Button size="small" type="link">
              测试表达式
            </Button>
            <Button size="small" type="link">
              <SaveOutlined />
              保存
            </Button>
          </>
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
      <Card size="small" title="表达式内容设置" style={{ marginTop: '16px' }}>
        <Form
          className="moduleform"
          form={form}
          size="middle"
          autoComplete="off"
          labelCol={{ flex: '0 0 120px' }}
          onValuesChange={(changedValues) => {
            apply(editRecord, changedValues);
          }}
        >
          <Row>
            <Col span={24}>
              <Form.Item label="模块字段" name="fieldtitle">
                <Input
                  readOnly
                  addonAfter={
                    <SelectModuleField moduleName={moduleName} title="aa" callback={() => {}} />
                  }
                />
              </Form.Item>
            </Col>
            <Col span={24}>
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
