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
import { apply, loop, uuid } from '@/utils/utils';
import { EditOutlined, FileOutlined, MenuFoldOutlined, SaveOutlined } from '@ant-design/icons';
import { Card, Col, message, Modal, Row, Space, Tooltip, Tree } from 'antd';
import type { Key } from 'antd/es/table/interface';
import { fetchGridDetails, fetchModuleFields, saveGridSchemeDetails } from '../service';
import { ModuleHierarchyChart } from '../widget/ModuleHierarchyChart';
import { GridFieldDesignForm } from './DesignGridField';
import './designForm.css';
import { getAllTreeRecord } from '../moduleUtils';
import { removeModuleInfo } from '../modules';

interface DesignGridProps {
  gridScheme: any;
}

const getTitle = (node: any, text?: string) => {
  if (node.cls) return <span className={node.cls}>{text || node.text}</span>;
  return text || node.text;
};

const farray = [
  'tf_title',
  'tf_hidden',
  'tf_locked',
  'tf_showdetailtip',
  'tf_width',
  'tf_minwidth',
  'tf_maxwidth',
  'tf_flex',
  'tf_autosizetimes',
  'tf_otherSetting',
];

const getChildNodesArray = (pnode: any) => {
  const result: any[] = [];
  pnode.children.forEach((node: any) => {
    const nodedata: any = {
      text: node.text,
    };
    if (!node.children && node.itemId) nodedata.tf_itemId = node.itemId;
    farray.forEach((f) => {
      if (node[f]) nodedata[f] = node[f];
    });
    if (node.children && node.children.length) nodedata.children = getChildNodesArray(node);
    // 空的合并表头不要
    if (node.itemId || (node.children && node.children.length)) result.push(nodedata);
  });
  return result;
};

const saveGridScheme = (details: any[], gridScheme: any) => {
  const moduleName = gridScheme['FDataobject.objectid'];
  saveGridSchemeDetails({
    dataObjectId: moduleName,
    gridSchemeId: gridScheme.gridschemeid,
    gridSchemeName: gridScheme.schemename,
    schemeDefine: JSON.stringify(getChildNodesArray(details[0])),
  }).then((response) => {
    if (response.success) {
      message.success(`列表方案『${gridScheme.schemename}』已保存。`);
      // 删除内存中的该模块的moduleInfo的定义，再次进入该模块时，可以再次从服务器获取
      removeModuleInfo(moduleName);
    } else {
      Modal.error({
        title: `列表方案保存失败！`,
        width: 500,
        content: response.msg,
      });
    }
  });
};

export const DesignGrid: React.FC<DesignGridProps> = ({ gridScheme }) => {
  const moduleName = gridScheme['FDataobject.objectid'];
  const { gridschemeid } = gridScheme;
  const hierarchyRef: any = useRef();
  const form: any = useRef();
  const [canSelectTree, setCanSelectTree] = useState<any[]>([]);
  const [canSelectTreeCheckedkey, setCanSelectTreeCheckedkey] = useState<string[]>([]);
  const [canSelectTreeExpandKey, setCanSelectTreeExpandKey] = useState<string[]>([]);
  const [canSelectTreeSelectedKey, setCanSelectTreeSelectedKey] = useState<string[]>([]);
  const [details, setDetails] = useState<any[]>([]);
  const [detailsExpandKey, setDetailsExpandKey] = useState<string[]>([]);
  const [detailsSelectedKey, setDetailsSelectedKey] = useState<string[]>([]);
  const [currModule, setCurrModule] = useState<any>({});
  const [modalVisible, setModalVisible] = useState<boolean>(false);
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
          // delete rec.text;
          if (rec.children) {
            (rec.children as any[]).forEach((crec) => {
              apply(crec, {
                key: crec.itemId,
                title: getTitle(crec),
                parent: rec,
              });
              // delete crec.text;
              // 子模块的聚合字段
              if (crec.children) {
                ekeys.push(crec.key);
                (crec.children as any[]).forEach((ccrec) => {
                  apply(ccrec, {
                    key: ccrec.itemId,
                    title: getTitle(ccrec),
                    parent: crec,
                  });
                  // delete ccrec.text;
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
    // const { children, ...other } = node;
    // message.info(JSON.stringify(other));
  };

  const deleteNode = () => {
    if (detailsSelectedKey.length) {
      if (detailsSelectedKey[0] === 'root') {
        message.warn('不能删除根节点！');
        return;
      }
      const allDetails: any[] = getAllTreeRecord(details[0].children);
      const deleted = allDetails.find((rec) => rec.key === detailsSelectedKey[0]);
      if (deleted) {
        if (deleted.children && deleted.children.length) {
          message.warn('请先删除当前节点的所有子节点！');
          return;
        }
        if (deleted.itemId) {
          message.warn('请在可供选择的字段中取消勾选！');
          return;
        }
        const arr = deleted.parent.children;
        arr.splice(
          arr.findIndex((item: any) => item === deleted),
          1,
        );
        setDetailsSelectedKey([]);
        setDetails([...details]);
      }
    } else {
      message.warn('请先选择一个节点！');
    }
  };

  const getEditTitle = (node: any, text?: string) => {
    return (
      <>
        <span className={node.cls}>{text || node.tf_title || node.text}</span>
        <EditOutlined
          className="editbutton"
          onClick={() => {
            setEditRecord(node);
            setModalVisible(true);
          }}
        />
        {node.children && node.children.length ? (
          <Tooltip title="把所有子节点放在上级节点下">
            <MenuFoldOutlined
              className="editbutton"
              onClick={() => {
                const pchildren: any[] = node.parent.children;
                const index = pchildren.findIndex((r: any) => r === node);
                node.children.forEach((rec: any) => {
                  apply(rec, { parent: node.parent });
                });
                pchildren.splice(index, 1, ...node.children);
                setDetails((v) => [...v]);
              }}
            />
          </Tooltip>
        ) : null}
      </>
    );
  };

  // 从后台传过来的数据中，有title的表示是修改过后的，如果只有text,那就是默认的
  const changeTextToTitle = (object: any) => {
    if (Array.isArray(object)) {
      object.forEach((o: any) => changeTextToTitle(o));
    } else if (Object.prototype.toString.call(object) === '[object Object]') {
      if (object.key !== 'root') {
        if (object.title) {
          apply(object, { tf_title: object.title });
        }
        apply(object, { title: getEditTitle(object) });
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
          };
          snode.title = getEditTitle(snode, text);
          let snodeParent = (details[0].children as any[]).find(
            (d) => d.text === node.parent.text && !d.itemId,
          );
          if (snodeParent) {
            if (!snodeParent.children) snodeParent.children = [];
            snode.parent = snodeParent;
            snodeParent.children.push(snode);
          } else {
            snodeParent = {
              key: uuid(),
              text: node.parent.text || node.parent.title,
              tf_title: node.parent.text || node.parent.title,
              leaf: false,
              expanded: true,
              xtype: 'fieldset',
              children: [snode],
              parent: details[0],
            };
            snodeParent.title = getEditTitle(snodeParent);
            snode.parent = snodeParent;
            detailsExpandKey.push(snodeParent.key);
            details[0].children.push(snodeParent);
          }
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
    fetchGridDetails({
      gridSchemeId: gridschemeid,
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
              }}
              expandedKeys={canSelectTreeExpandKey}
              onExpand={(expandKeys) => setCanSelectTreeExpandKey(expandKeys as string[])}
              selectedKeys={canSelectTreeSelectedKey}
              onSelect={(selectedKeys) => {
                setCanSelectTreeSelectedKey(selectedKeys as string[]);
                setDetailsSelectedKey(selectedKeys as string[]);
              }}
            />
          </Card>
        </Col>
        <Col lg={7} md={12} sm={12} xs={24}>
          <Card
            title="已经设置的分组和字段"
            size="small"
            extra={
              <Space>
                <a
                  href="#"
                  onClick={() => {
                    const newNode: any = {
                      key: uuid(),
                      tf_title: '新增的字段组',
                      xtype: 'fieldset',
                      parent: details[0],
                    };
                    newNode.title = getEditTitle(newNode);
                    details[0].children.push(newNode);
                    setDetails([...details]);
                  }}
                >
                  新增
                </a>
                <a href="#" onClick={() => deleteNode()}>
                  删除
                </a>
                <span />
                <a href="#" onClick={() => saveGridScheme(details, gridScheme)}>
                  保存
                </a>
              </Space>
            }
          >
            <Tree
              className="selectedgroupandfield"
              style={{ height: 'calc(100vh - 149px)', overflow: 'auto' }}
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
                if (info.selected && itemId) {
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
          </Card>
        </Col>
      </Row>
      <Modal
        width={820}
        title={`编辑列表字段：${editRecord.tf_title || editRecord.text}`}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
        }}
        okText={
          <>
            <SaveOutlined /> 保存
          </>
        }
        onOk={() => {
          const { tf_otherSetting: othersetting } = form.current.getValues();
          if (othersetting) {
            const s = (othersetting as string).startsWith('{')
              ? `${othersetting}`
              : `{${othersetting}}`;
            try {
              // eslint-disable-next-line
              eval(`(${s})`);
            } catch (e) {
              // eslint-disable-next-line
              alert(`附加设置解析错误：${s}`);
              return;
            }
          }
          setModalVisible(false);
          apply(editRecord, form.current.getValues());
          // 如果不是字段
          if (!editRecord.itemId) {
            apply(editRecord, {
              text: editRecord.tf_title,
            });
          }
          apply(editRecord, {
            title: getEditTitle(editRecord),
          });
          setDetails([...details]);
        }}
      >
        <GridFieldDesignForm ref={form} moduleName={moduleName} init={{ ...editRecord }} />
      </Modal>
    </>
  );
};
