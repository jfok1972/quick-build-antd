/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  getAllhasChildrenRowids,
  getAllLeafRecords,
  getAllleafRowids,
} from '@/pages/datamining/utils';
import { apply, loop } from '@/utils/utils';
import { FileOutlined } from '@ant-design/icons';
import { Card, Col, message, Modal, Row, Space, Tree, Form, Input, Radio, Select } from 'antd';
import type { Key } from 'antd/es/table/interface';
import { fetchSortDetails, fetchModuleFields, saveSortSchemeDetails } from '../service';
import { ModuleHierarchyChart } from '../widget/ModuleHierarchyChart';
import './designForm.css';
import { getFunctionOptions } from './DesignDefaultOrder';

interface DesignSortProps {
  objectRecord: any;
}

const getTitle = (node: any, text?: string) => {
  if (node.cls) return <span className={node.cls}>{text || node.text}</span>;
  return text || node.text;
};

const farray = ['itemId', 'direction', 'functionid', 'fieldfunction'];

const getChildNodesArray = (pnode: any) => {
  const result: any[] = [];
  pnode.children.forEach((node: any) => {
    const nodedata: any = {};
    farray.forEach((f) => {
      if (node[f]) nodedata[f] = node[f];
    });
    result.push(nodedata);
  });
  return result;
};

const saveSortScheme = (details: any[], objectRecord: any) => {
  saveSortSchemeDetails({
    dataObjectId: objectRecord['FDataobject.objectid'],
    sortSchemeId: objectRecord.schemeid,
    sortSchemeName: objectRecord.title,
    schemeDefine: JSON.stringify(getChildNodesArray(details[0])),
  }).then((response) => {
    if (response.success) {
      message.success(`排序方案『${objectRecord.title}』已保存。`);
    } else {
      Modal.error({
        title: `排序方案保存失败！`,
        width: 500,
        content: response.msg,
      });
    }
  });
};

export const DesignSort: React.FC<DesignSortProps> = ({ objectRecord }) => {
  const moduleName = objectRecord['FDataobject.objectid'];
  const { schemeid } = objectRecord;
  const hierarchyRef: any = useRef();
  const [form] = Form.useForm();
  const [canSelectTree, setCanSelectTree] = useState<any[]>([]);
  const [canSelectTreeCheckedkey, setCanSelectTreeCheckedkey] = useState<string[]>([]);
  const [canSelectTreeExpandKey, setCanSelectTreeExpandKey] = useState<string[]>([]);
  const [canSelectTreeSelectedKey, setCanSelectTreeSelectedKey] = useState<string[]>([]);
  const [details, setDetails] = useState<any[]>([]);
  const [detailsExpandKey, setDetailsExpandKey] = useState<string[]>([]);
  const [detailsSelectedKey, setDetailsSelectedKey] = useState<string[]>([]);
  const [currModule, setCurrModule] = useState<any>({});
  const [editRecord, setEditRecord] = useState<Record<string, undefined>>({});

  const fetchSelectedModuleFields = (node: any, selectedKeys?: string[]) => {
    if (node === currModule) {
      setCanSelectTreeSelectedKey(selectedKeys || []);
      return;
    }
    setCurrModule(node);
    if (node.moduleName)
      fetchModuleFields({
        moduleName: node.moduleName,
        isChildModule: !!node.isChild,
        modulePath: node.itemId,
      }).then((response: any[]) => {
        const ekeys: string[] = [];
        response.forEach((rec) => {
          apply(rec, {
            key: rec.text,
            title: getTitle(rec),
          });
          ekeys.push(rec.key);
          if (rec.children) {
            (rec.children as any[]).forEach((crec) => {
              apply(crec, {
                key: crec.itemId,
                title: getTitle(crec),
                parent: rec,
              });
              if (crec.children) {
                ekeys.push(crec.key);
                (crec.children as any[]).forEach((ccrec) => {
                  apply(ccrec, {
                    key: ccrec.itemId,
                    title: getTitle(ccrec),
                    parent: crec,
                  });
                });
              }
            });
          }
        });
        setCanSelectTreeCheckedkey([]);
        setCanSelectTreeExpandKey(ekeys);
        setCanSelectTree(response);
        setCanSelectTreeSelectedKey(selectedKeys || detailsSelectedKey);
      });
  };

  // 从后台传过来的数据中，有title的表示是修改过后的，如果只有text,那就是默认的
  const changeTextToTitle = (object: any) => {
    if (Array.isArray(object)) {
      object.forEach((o: any) => changeTextToTitle(o));
    } else if (Object.prototype.toString.call(object) === '[object Object]') {
      if (object.key !== 'root') {
        apply(object, { title: getTitle(object) });
      }
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

  // 选择或取消选择后更新已设置的字段
  const syncSelected = (checked: Key[], info: any) => {
    setCanSelectTreeCheckedkey(checked as string[]);
    // 先检查checked的已选中列中有没有，没有的加入
    info.checkedNodes
      .filter((n: any) => !n.children)
      .forEach((node: any) => {
        if (!getAllleafRowids(details, 'itemId').includes(node.itemId)) {
          // 新选上的，加入，先看看当前选中节点的父节点有没有，有的话加在下面，没有则加入父节点
          let { text } = node;
          if (currModule.isParent) {
            text = `${currModule.qtip}--${text}`;
          } else if (currModule.isChild) {
            text = `${currModule.qtip}--${node.parent.text}--${text}`;
          }
          const snode: any = {
            key: node.itemId,
            itemId: node.itemId,
            text,
            iconCls: node.iconCls,
            cls: node.cls,
            icon: node.icon,
            leaf: true,
            parent: details[0],
          };
          snode.title = getTitle(snode, text);
          details[0].children.push(snode);
          setDetails((v) => [...v]);
        }
      });
    // 检查unchecked的在选中列表中有没有，有则删除
    getAllLeafRecords(canSelectTree)
      .filter((rec) => !info.checkedNodes.find((node: any) => node === rec))
      .forEach((crec) => {
        const deleted = getAllLeafRecords(details).find((rec) => rec.itemId === crec.itemId);
        if (deleted) {
          const arr = deleted.parent.children as [];
          arr.splice(
            arr.findIndex((item: any) => item.itemId === deleted.itemId),
            1,
          );
        }
      });
    setDetails([...details]);
  };

  useEffect(() => {
    // 在重新加载了可被选择的字段以后，把已经选中的都加进去。
    const canSelectTreeItems = getAllleafRowids(canSelectTree, 'itemId');
    const detailItems = getAllleafRowids(details, 'itemId');
    const keys = canSelectTreeItems.filter((key) => detailItems.find((dkey) => dkey === key));
    setCanSelectTreeCheckedkey(keys);
  }, [canSelectTree]);

  useEffect(() => {
    fetchSortDetails({
      sortSchemeId: schemeid,
    }).then((response) => {
      const ds = [
        {
          key: 'root',
          children: response.children,
          title: '已经选择的字段',
        },
      ];
      changeTextToTitle(ds);
      setDetailsExpandKey(getAllhasChildrenRowids(ds, 'key'));
      setDetails(ds);
      fetchSelectedModuleFields({ moduleName });
    });
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      direction: editRecord.direction,
      functionid: editRecord.functionid,
      fieldfunction: editRecord.fieldfunction,
    });
  }, [editRecord]);

  return (
    <>
      <Row gutter={16} style={{ height: 'calc(100% )' }}>
        <Col lg={12} md={24} sm={24} xs={24}>
          <ModuleHierarchyChart
            moduleName={moduleName}
            onClick={(node: any) => {
              fetchSelectedModuleFields(node);
            }}
            ref={hierarchyRef}
          />
        </Col>
        <Col lg={5} md={12} sm={12} xs={24}>
          <Card title="可供选择的字段" size="small">
            <Tree
              style={{ height: 'calc(100vh - 149px)', overflow: 'auto' }}
              checkable
              showIcon
              icon={(props: any) =>
                props.iconCls ? <span className={props.iconCls} /> : <FileOutlined />
              }
              treeData={canSelectTree}
              checkedKeys={canSelectTreeCheckedkey}
              onCheck={(checked, info) => {
                syncSelected(checked as Key[], info);
                setEditRecord({});
              }}
              expandedKeys={canSelectTreeExpandKey}
              onExpand={(expandKeys) => setCanSelectTreeExpandKey(expandKeys as string[])}
              selectedKeys={canSelectTreeSelectedKey}
              onSelect={(selectedKeys) => {
                setCanSelectTreeSelectedKey(selectedKeys as string[]);
                setDetailsSelectedKey(selectedKeys as string[]);
                setEditRecord({});
                if (selectedKeys.length === 1) {
                  const rec = (details[0].children as any[]).find((r) => r.key === selectedKeys[0]);
                  if (rec && rec.itemId) setEditRecord(rec);
                }
              }}
            />
          </Card>
        </Col>
        <Col lg={7} md={12} sm={12} xs={24}>
          <Card
            title="已经设置的字段"
            size="small"
            bodyStyle={{ height: 'calc(100vh - 125px)', display: 'flex', flexDirection: 'column' }}
            extra={
              <Space>
                <a href="#" onClick={() => saveSortScheme(details, objectRecord)}>
                  保存
                </a>
              </Space>
            }
          >
            <div style={{ flex: 1 }}>
              <Tree
                className="selectedgroupandfield"
                style={{ overflow: 'auto' }}
                checkable={false}
                showLine={false}
                showIcon
                icon={(props: any) =>
                  props.iconCls ? <span className={props.iconCls} /> : <FileOutlined />
                }
                draggable
                treeData={details}
                expandedKeys={detailsExpandKey}
                onExpand={(expandKeys) => setDetailsExpandKey(expandKeys as string[])}
                selectedKeys={detailsSelectedKey}
                onSelect={(selectedKeys, info) => {
                  setDetailsSelectedKey(selectedKeys as string[]);
                  const { itemId } = info.node as any;
                  setEditRecord({});
                  if (info.selected && itemId) {
                    setEditRecord(info.selectedNodes[0] as any);
                    const path = itemId.substring(0, itemId.indexOf('|'));
                    fetchSelectedModuleFields(
                      hierarchyRef.current.getNodeFromItemId(path),
                      selectedKeys as string[],
                    );
                  }
                }}
                onDrop={(info: any) => {
                  const targetKey = info.node.key as string;
                  // 放在目标节点的下面
                  if ((info.dropToGap && targetKey !== 'root') || info.node.itemId) {
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
            </div>
            {editRecord.itemId ? (
              <Card title="排序字段属性" size="small">
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
                      <Form.Item label="排序方向" name="direction">
                        <Radio.Group>
                          <Radio value="asc">正序</Radio>
                          <Radio value="desc">倒序</Radio>
                        </Radio.Group>
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
                              option.label &&
                              option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            );
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item label="自定义函数" name="fieldfunction">
                        <Input.TextArea autoSize={{ maxRows: 5 }} placeholder="this 代表当前字段" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            ) : null}
          </Card>
        </Col>
      </Row>
    </>
  );
};
