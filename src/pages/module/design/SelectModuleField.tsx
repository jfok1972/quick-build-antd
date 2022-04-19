/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useRef, useState } from 'react';
import { apply } from '@/utils/utils';
import { FileOutlined, SelectOutlined } from '@ant-design/icons';
import { Button, Card, Col, Popover, Row, Tree } from 'antd';
import { getModuleInfo } from '../modules';
import { fetchModuleFields } from '../service';
import { ModuleHierarchyChart } from '../widget/ModuleHierarchyChart';

interface SelectModuleFieldPopoverProps {
  moduleName: string;
  defaultFieldId?: string;
  callback: Function;
  children?: any; // 选择的文字，没有则为默认的
}

interface SelectModuleFieldProps extends SelectModuleFieldPopoverProps {
  setVisible: Function;
}

const getTitle = (node: any, text?: string) => {
  if (node.cls) return <span className={node.cls}>{text || node.text}</span>;
  return text || node.text;
};

const SelectModuleField: React.FC<SelectModuleFieldProps> = ({
  moduleName,
  defaultFieldId,
  callback,
  setVisible,
}) => {
  const hierarchyRef: any = useRef();
  const [canSelectTree, setCanSelectTree] = useState<any[]>([]);
  const [canSelectTreeExpandKey, setCanSelectTreeExpandKey] = useState<string[]>([]);
  const [canSelectTreeSelectedKey, setCanSelectTreeSelectedKey] = useState<string[]>([]);
  const [selected, setSelected] = useState<any>(null);

  const fetchSelectedModuleFields = (node: any) => {
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
        setCanSelectTreeExpandKey(ekeys);
        setCanSelectTree(response);
        setCanSelectTreeSelectedKey(defaultFieldId ? [defaultFieldId] : []);
      });
  };

  useEffect(() => {
    // 获取当前默认选中字段的模块的所有值
    if (defaultFieldId) {
      const path = defaultFieldId.substring(0, defaultFieldId.indexOf('|'));
      fetchSelectedModuleFields(
        path ? hierarchyRef.current.getNodeFromItemId(path) : { moduleName },
      );
    } else fetchSelectedModuleFields({ moduleName });
  }, []);

  return (
    <>
      <Row gutter={16} style={{ height: '600px', width: '900px', overflow: 'auto' }}>
        <Col span={16}>
          <ModuleHierarchyChart
            moduleName={moduleName}
            defaultFieldahead={
              defaultFieldId ? defaultFieldId.substring(0, defaultFieldId.indexOf('|')) : undefined
            }
            onClick={(node: any) => {
              fetchSelectedModuleFields(node);
            }}
            ref={hierarchyRef}
          />
        </Col>
        <Col span={8}>
          <Card
            title="可供选择的字段"
            size="small"
            extra={
              <Button
                type="primary"
                disabled={!selected}
                onClick={() => {
                  callback({
                    fieldid: selected.itemId,
                    fieldname: selected.fieldname,
                    title:
                      (selected.itemId.indexOf('|') !== -1
                        ? `${hierarchyRef.current.getCurrentModule().qtip}--`
                        : '') +
                      (selected.itemId.indexOf('.with.') !== -1
                        ? `${selected.parent.text}--`
                        : '') +
                      selected.text,
                  });
                  setVisible(false);
                }}
              >
                选中返回
              </Button>
            }
          >
            <Tree
              style={{ height: '526px', overflow: 'auto' }}
              showIcon
              icon={(props: any) =>
                props.iconCls ? <span className={props.iconCls} /> : <FileOutlined />
              }
              treeData={canSelectTree}
              expandedKeys={canSelectTreeExpandKey}
              onExpand={(expandKeys) => setCanSelectTreeExpandKey(expandKeys as string[])}
              selectedKeys={canSelectTreeSelectedKey}
              onSelect={(selectedKeys, info) => {
                setCanSelectTreeSelectedKey(selectedKeys as string[]);
                setSelected(null);
                if (info.selected && (info.selectedNodes[0] as any).itemId) {
                  setSelected(info.selectedNodes[0]);
                }
              }}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export const SelectModuleFieldPopover: React.FC<SelectModuleFieldPopoverProps> = ({
  moduleName,
  callback,
  defaultFieldId,
  children,
}) => {
  const moduleInfo = getModuleInfo(moduleName);
  const [visible, setVisible] = useState<boolean>(false);
  return (
    <Popover
      placement="left"
      visible={visible}
      onVisibleChange={(v) => setVisible(v)}
      title={`选择模块『${moduleInfo.title}』的关联字段`}
      trigger={['click']}
      content={
        <SelectModuleField
          moduleName={moduleName}
          defaultFieldId={defaultFieldId}
          callback={callback}
          setVisible={setVisible}
        />
      }
    >
      {children || <SelectOutlined />}
    </Popover>
  );
};
