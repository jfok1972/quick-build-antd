/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { fetchModuleHierarchyData } from '../service';
import { Button, Card, Tabs } from 'antd';
import OrganizationChart from '@madnessxd/react-orgchart';
import { getAllTreeRecord } from '../moduleUtils';
import './chartNode.css';

const { TabPane } = Tabs;

const moduleHierarchyData: Map<string, any> = new Map();

const getModuleHierarchyData = (moduleName: string) => {
  if (!moduleHierarchyData.has(moduleName)) {
    moduleHierarchyData.set(
      moduleName,
      fetchModuleHierarchyData({
        moduleName,
      }),
    );
  }
  return JSON.parse(JSON.stringify(moduleHierarchyData.get(moduleName)));
};

interface PropTypes {
  nodeData: any;
}

interface ModuleHierarchyChartProps {
  moduleName: string;
  onClick?: Function; // 单击了某个模块
  onSelect?: Function; // 需要选中返回
  defaultFieldahead?: string; // 默认选中的值
  ref: any;
}

const changeTextToName = (object: any) => {
  if (Array.isArray(object)) {
    object.forEach((o: any) => changeTextToName(o));
  } else if (Object.prototype.toString.call(object) === '[object Object]') {
    const obj = object;
    obj.name = object.text.replace(/<[^>]+>/g, '');
    obj.id = object.itemId;
    if (object.children) {
      changeTextToName(object.children);
    }
  }
};

// 在useState没有结束的时候，用这个来替代 parentTree,ChildTree
let ptree: any;
let ctree: any;

export const ModuleHierarchyChart: React.FC<ModuleHierarchyChartProps> = forwardRef(
  ({ moduleName, onClick, onSelect, defaultFieldahead }, ref) => {
    const [parentTree, setParentTree] = useState<any>({});
    const [childTree, setChildTree] = useState<any>({});
    const [activeKey, setActiveKey] = useState<'parent' | 'child'>('parent');
    const [currModule, setCurrModule] = useState<any>({});

    const ChartNode: React.FC<PropTypes> = ({ nodeData }) => {
      const { isBase, isParent, isChild, disabled, itemId } = nodeData;
      const currentClassName = itemId === currModule.itemId ? ' current' : '';
      const name = nodeData.iconCls ? (
        <span className={nodeData.iconCls}>{` ${nodeData.name}`}</span>
      ) : (
        nodeData.name
      );
      if (isBase) {
        return (
          <div>
            <div className={`base${currentClassName}`}>{name}</div>
            <div className="type">{nodeData.title}</div>
          </div>
        );
      }
      let className = 'disabled';
      if (isParent && !disabled) {
        className = `parent${currentClassName}`;
      }
      if (isChild && !disabled) {
        className = `child${currentClassName}`;
      }
      return (
        <div>
          <div className={className}>{name}</div>
        </div>
      );
    };

    useImperativeHandle(ref, () => ({
      // 如果获取当前path,说明当前是选中的模块
      getNodeFromItemId: (path: string): Record<string, unknown> => {
        let curr: any = parentTree;
        if (path) {
          const plist = getAllTreeRecord(
            parentTree.children ? parentTree.children[0].children : ptree.children[0].children,
          );
          const clist = getAllTreeRecord(
            childTree.children ? childTree.children[0].children : ctree.children[0].children,
          );
          curr =
            plist.find((rec) => rec.itemId === path) || clist.find((rec) => rec.itemId === path);
        }
        setCurrModule(curr);
        return curr;
      },
      getCurrentModule: () => {
        return currModule;
      },
    }));

    useEffect(() => {
      const data = getModuleHierarchyData(moduleName);
      changeTextToName(data);
      const p = { ...data.children[0] };
      p.name = p.moduleTitle;
      p.title = '基准模块';
      p.children = p.children.filter((child: any) => child.isParent);
      ptree = p;
      setParentTree(p);
      const c = { ...data.children[0] };
      c.name = c.moduleTitle;
      c.title = '基准模块';
      c.children = c.children.filter((child: any) => child.isChild);
      ctree = c;
      setChildTree(c);
      if (defaultFieldahead) {
        const plist = getAllTreeRecord(p.children);
        const clist = getAllTreeRecord(c.children);
        setCurrModule(
          plist.find((rec) => rec.itemId === defaultFieldahead) ||
            clist.find((rec) => rec.itemId === defaultFieldahead),
        );
      } else setCurrModule(p);
    }, [moduleName]);

    useEffect(() => {
      if (currModule.itemId && currModule.itemId.indexOf('.with.') !== -1) {
        setActiveKey('child');
      } else if (currModule.itemId) setActiveKey('parent');
    }, [currModule]);

    return (
      <Card
        title="模块关联关系图"
        size="small"
        style={{ height: '100%' }}
        bodyStyle={{ paddingTop: 0, paddingBottom: 0, height: 'calc(100% -24px)' }}
        extra={
          <span>
            {currModule.qtip ? (
              <span>
                当前选中模块：
                {
                  <Button
                    type={onSelect ? 'primary' : 'link'}
                    onClick={() => {
                      if (onSelect) onSelect(currModule);
                    }}
                  >
                    {currModule.qtip}
                  </Button>
                }
              </span>
            ) : (
              ''
            )}
          </span>
        }
      >
        <Tabs
          activeKey={activeKey}
          onChange={(key: any) => {
            setActiveKey(key);
          }}
        >
          <TabPane tab="父模块" key="parent">
            <OrganizationChart
              datasource={parentTree}
              direction="b2t"
              collapsible={true}
              chartClass="moduleChart"
              NodeTemplate={ChartNode}
              // pan={true}
              // zoom={true}
              onClickNode={(node: any) => {
                if (node.disabled) return;
                setCurrModule(node);
                if (onClick) onClick(node);
              }}
            />
          </TabPane>
          <TabPane tab="子模块" key="child">
            <OrganizationChart
              datasource={childTree}
              direction="b2t"
              collapsible={true}
              chartClass="moduleChart"
              NodeTemplate={ChartNode}
              // pan={true}
              // zoom={true}
              onClickNode={(node: any) => {
                if (node.disabled) return;
                setCurrModule(node);
                if (onClick) onClick(node);
              }}
            />
          </TabPane>
        </Tabs>
      </Card>
    );
  },
);
