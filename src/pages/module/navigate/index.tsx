/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { createContext, useContext, useState } from 'react';
import Highlighter from 'react-highlight-words';
import { Card, Tabs, Tree, Space, Tooltip, Input, message, Typography, Modal } from 'antd';
import {
  ReloadOutlined,
  NodeExpandOutlined,
  NodeCollapseOutlined,
  LinkOutlined,
  DisconnectOutlined,
  EllipsisOutlined,
  MoreOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import PinyinMatch from 'pinyin-match';
import type { Dispatch } from 'redux';
import { apply } from '@/utils/utils';
import { useDrop } from 'react-dnd';
import type { ModuleFieldType, ModuleModal, ModuleState } from '../data';
import { fetchNavigateTreeData, saveOrUpdateRecord } from '../service';
import type { ModuleNavigates, NavigateStateModal } from './data';
import { canEdit, getFieldDefine, getModuleInfo, hasEdit } from '../modules';
import { getSqlparamFilter } from '../grid/filterUtils';
import { DATA } from '../constants';
import styles from '../index.less';

const { TabPane } = Tabs;
const { DirectoryTree } = Tree;
const { Search } = Input;
const { Text } = Typography;

// NavigateTree 中存放的上下文的字段值
export interface NavigateStateContext {
  state?: ModuleState;
  moduleInfo?: ModuleModal;
  dispatch: Function;
}

// NavigateTree 的上下文
const NavigateContext = createContext<NavigateStateContext>({
  dispatch: () => {},
});

// 所有的模块的导航信息，每次只用到当前模块的数据，state初始化的时候会使用相应模块的数据
const moduleNavigates: ModuleNavigates = {};

// 将修改过的scheme更新进去，并且返回schemes,给state使用
const updateTo = (moduleName: string, updateScheme: NavigateStateModal): NavigateStateModal[] => {
  moduleNavigates[moduleName] = moduleNavigates[moduleName].map(
    (scheme: NavigateStateModal): NavigateStateModal =>
      scheme.navigateschemeid === updateScheme.navigateschemeid ? updateScheme : scheme,
  );
  return moduleNavigates[moduleName];
};

// 修改了导航后，将该模块的导航全部删除，下次进入模块时可以重新刷新
export const removeModuleNavigate = (moduleName: string) => {
  if (moduleNavigates[moduleName]) {
    delete moduleNavigates[moduleName];
  }
};

// 所有导航当前选中的记录值，这个值没有放在state中，刷新时，每一个导航对属性defaultSelectedKeys进行初始化
const selectedKeys: object = {};
const setSelectedKeys = (navigateschemeid: string, keys: any) => {
  selectedKeys[navigateschemeid] = keys;
};
const getSelectedKeys = (navigateschemeid: string) => {
  return selectedKeys[navigateschemeid];
};

// 每个模块当前选中的活动Tab
const moduleActiveTab: object = {};
const setModuleActiveTab = (moduleName: string, tabName: string) => {
  moduleActiveTab[moduleName] = tabName;
};
const getModuleActiveTab = (moduleName: string, defaultKey: string) => {
  if (!moduleActiveTab[moduleName]) moduleActiveTab[moduleName] = defaultKey;
  return moduleActiveTab[moduleName];
};

// 判断从Table中拖动进来的记录是否可以移动到当前节点之下
const canRecordDrop = (moduleInfo: ModuleModal, dragRecord: any, node: any) => {
  const { modulename: moduleName, fields } = moduleInfo;
  let field = null;
  if (hasEdit(moduleInfo)) {
    // 如果是相同的model表示，当前导航这段是本模块的自有字段，检查此字段，如果是可修改，并且是字符串的才可以拖放
    if (node.moduleName === moduleName) {
      for (let i = 0; i < fields.length; i += 1) {
        // 如果node有schemeDetailId，表示在此字段上加入了函数,有numberGroupId表示加入了数值分组，不可以拖动
        if (fields[i].fieldname === node.fieldName && !node.schemeDetailId && !node.numberGroupId) {
          field = fields[i];
          break;
        }
      }
    } else {
      for (let i = 0; i < fields.length; i += 1) {
        // 判断 treeModuleName 是不是 拖动来的grid记录的直接父模块，如果是并且允许修改，才可以修改
        if (fields[i].fieldtype === node.moduleName && fields[i].fieldname === node.fieldahead) {
          const minfo = getModuleInfo(fields[i].fieldtype);
          if (!minfo)
            // eslint-disable-next-line
            continue;
          // 是作用在主键之上，即为manytoone字段
          if (minfo.primarykey === node.fieldName) {
            field = fields[i];
            break;
          }
        }
      }
    }
  }
  // 判断是否允许选择非叶节点的值
  if (field) {
    if (!field.allowedit) return null;
    if (field.isManyToOne && !field.allowParentValue) return node.children ? null : field;
    return field;
  }
  return null;
};

/**
 * 生成DirectoryTree的树形treeData数据
 * 如果有搜索的值，那么对搜索的结果加高亮显示
 */
const type = 'ModuleDragableBodyRow';
const NodeTitle: React.FC<any> = ({ node, search = '' }: { node: any; search: string }) => {
  const { moduleInfo: modinfo, state, dispatch } = useContext(NavigateContext);
  const moduleInfo = modinfo as ModuleModal;
  const { modulename: moduleName } = moduleInfo;
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: `${type + state?.moduleName}toNavigate`,
    canDrop: (item) => {
      return !!canRecordDrop(moduleInfo, item.record, node);
    },
    /**
     * 当用户拖动模块记录到此模块上时。
     */
    drop: (item: any) => {
      const field = canRecordDrop(moduleInfo, item.record, node);
      const primarykey = moduleInfo.primarykey || '';
      const canE = canEdit(moduleInfo, item.record);
      if (!canE.canEdit) {
        message.warn(canE.message);
        return;
      }
      if (field) {
        Modal.confirm({
          width: 500,
          title: `确定要将${moduleInfo.title}『${item.record[moduleInfo.namefield]}』的${
            field.fieldtitle
          }改为“${node.title}”吗？`,
          icon: <QuestionCircleOutlined />,
          onOk: () => {
            const data = { [primarykey]: item.record[primarykey] };
            if (field.isManyToOne) {
              const pinfo = getModuleInfo(field.fieldtype);
              data[`${field.fieldname}.${pinfo.primarykey}`] = node.fieldvalue;
            } else {
              data[field.fieldname] = node.fieldvalue;
            }
            saveOrUpdateRecord({
              moduleName,
              opertype: 'edit',
              data,
            }).then((response: any) => {
              const { data: updatedRecord } = response; // 从后台返回过来的数据
              if (response.success) {
                message.success(
                  `${moduleInfo.title}的『${updatedRecord[moduleInfo.namefield]}』保存成功！`,
                );
                dispatch({
                  type: 'modules/updateRecord',
                  payload: {
                    moduleName,
                    record: updatedRecord,
                  },
                });
              } else {
                // response.data没处理，参考extjs版
                const errorMessage = response.message
                  ? [
                      <div>
                        <li>
                          {typeof response.message === 'string'
                            ? response.message
                            : JSON.stringify(response.message)}
                        </li>
                      </div>,
                    ]
                  : [];
                //  样式 { personnelage : '必须小于200岁'}
                const { data: errors } = response;
                if (errors) {
                  Object.keys(errors).forEach((fn) => {
                    const fi: ModuleFieldType = getFieldDefine(fn, moduleInfo);
                    errorMessage.push(
                      <div>
                        <li>
                          <b>{fi ? fi.fieldtitle : fn}</b>：{errors[fn]}
                        </li>
                      </div>,
                    );
                  });
                }
                Modal.error({
                  width: 500,
                  title: '记录保存时发生错误',
                  content: <ul style={{ listStyle: 'decimal' }}>{errorMessage}</ul>,
                });
              }
            });
          },
        });
      }
    },
    collect: (monitor) => {
      return {
        isOver: !!monitor.isOver(),
        canDrop: monitor.canDrop(),
      };
    },
  });
  return (
    <div
      style={{ display: 'inline-block', height: '100%' }}
      ref={hasEdit(moduleInfo as ModuleModal) ? drop : null}
      className={isOver && canDrop ? styles.navigatedragover : ''}
    >
      {search ? (
        <Highlighter
          highlightClassName="ant-btn-link"
          searchWords={[search]}
          textToHighlight={node.title}
        />
      ) : (
        node.title || '未定义'
      )}
      <Text type="secondary">({node.count})</Text>
    </div>
  );
};

const getNode = (node: any, search: string = '') => {
  const result: any = {
    title: <NodeTitle node={node} search={search} />,
    key: node.key,
    isLeaf: node.isLeaf,
    icon: node.iconCls ? <span className={node.iconCls} /> : null,
    data: node,
  };
  return result;
};

let restkey: number = 1;
const getRestNode = (restCount: number) => ({
  title: <a>{`还有 ${restCount} 条记录，请搜索关键字查找`}</a>,
  // eslint-disable-next-line
  key: `__restkey--${restkey++}`,
  isLeaf: true,
  selectable: false,
  data: null,
});

/**
 * 返回每个节点最多LEVELMAXCOUNT的值,并且collapsed的子节点不加入
 * @param nodes
 */
const EXPANDALLCOUNT = 200; // 当总数小于多少时，全部展开
const LEVELMAXCOUNT = 20; // 一级里最多显示行数，其他的都显示在更多里面
const EXPANDLEVELMAXCOUNT = 50; // 展开一级时最多显示的行数
const WARNSEARCHMAX = 100; // 查找时符合条件的记录数超过此值时，给一个警告

const genMiniTreeData = (nodes: any[]): any => {
  const result: any[] = [];
  result.push(
    ...nodes
      .filter((_, index: number) => index < LEVELMAXCOUNT)
      .map((node: any) => {
        const { children } = node;
        const item: any = getNode(node);
        if (Array.isArray(children) && children.length && node.expanded) {
          item.children = genMiniTreeData(children);
        }
        return item;
      }),
  );
  if (nodes.length > LEVELMAXCOUNT) {
    result.push(getRestNode(nodes.length - LEVELMAXCOUNT));
  }
  return result;
};
/**
 * 返回所有节点，在总节点比较少的情况下就是这样
 * @param nodes
 */
const genAllTreeData = (nodes: any[]): any => {
  const result: any[] = [];
  result.push(
    ...nodes.map((node: any) => {
      const { children } = node;
      const item: any = getNode(node);
      if (Array.isArray(children) && children.length) {
        item.children = genAllTreeData(children);
      }
      return item;
    }),
  );
  return result;
};

const genSearchedPingYingTreeData = (
  nodes: any[],
  search: string,
  expandedKeys: string[],
  mCount: number[],
): any[] => {
  const result: any[] = [];
  const matchedCount = mCount;
  nodes.forEach((node: any) => {
    const find = PinyinMatch.match(node.title, search);
    if (find) matchedCount[0] += 1;
    const treeNode = getNode(node, find ? node.title.substring(find[0], find[1] + 1) : '');
    if (node.isLeaf) {
      if (find) {
        result.push(treeNode);
      }
    } else {
      const findChildren: any[] = genSearchedPingYingTreeData(
        node.children || [],
        search,
        expandedKeys,
        matchedCount,
      );
      if (find || findChildren.length) {
        if (findChildren.length) {
          treeNode.children = findChildren;
          expandedKeys.push(node.key);
        }
        result.push(treeNode);
      }
    }
  });
  return result;
};

const genSearchedTreeData = (
  nodes: any[],
  search: string,
  expandedKeys: string[],
  mCount: number[],
): any[] => {
  const result: any[] = [];
  const matchedCount = mCount;
  nodes.forEach((node: any) => {
    const find = node.title.indexOf(search) > -1;
    if (find) matchedCount[0] += 1;
    const treeNode = getNode(node, search);
    if (node.isLeaf) {
      if (find) {
        result.push(treeNode);
      }
    } else {
      const findChildren: any[] = genSearchedTreeData(
        node.children || [],
        search,
        expandedKeys,
        matchedCount,
      );
      if (find || findChildren.length) {
        if (findChildren.length) {
          treeNode.children = findChildren;
          expandedKeys.push(node.key);
        }
        result.push(treeNode);
      }
    }
  });
  return result;
};

/**
 * 生成带查询的数据形树，所有查到的数据的父节点都显示。
 * 对于找到的父节点，子节点没有对应值的，将其设置为未展开状态，在展开时可以加入children的值
 * 对于找到的节点，下面有找到children的，默认全部打开
 */
const genSearchedDataAndExpandedKeys = (nodes: any[], search: string): any => {
  const expandedKeys: string[] = [];
  const matchedCount: number[] = [0];
  const isletter = /^[a-zA-Z]+$/.test(search);
  let result: any;
  if (isletter) {
    result = {
      treeData: genSearchedPingYingTreeData(nodes, search, expandedKeys, matchedCount),
      expandedKeys,
    };
  } else
    result = {
      treeData: genSearchedTreeData(nodes, search, expandedKeys, matchedCount),
      expandedKeys,
    };
  if (matchedCount[0] > WARNSEARCHMAX)
    message.warn('符合当前查询关键字的记录太多,建议增加搜索字符的长度！', 5);
  return result;
};

/**
 * 生成当前可展开的所有节点，节点下没有children的不加进去
 * @param nodes
 */
const getCanExpandedKey = (nodes: any[]): string[] => {
  const result: string[] = [];
  nodes.forEach((node: any) => {
    if (!node.isLeaf && node.children && node.children.length) {
      result.push(node.key);
      result.push(...getCanExpandedKey(node.children));
    }
  });
  return result;
};

// 一个模块的导航区域
const Navigate = ({ moduleState, dispatch }: { moduleState: ModuleState; dispatch: Dispatch }) => {
  // console.log('navigate renderer......')
  const { moduleName } = moduleState;
  const moduleInfo = getModuleInfo(moduleName);
  const { parentfilter } = moduleState.filters;
  let nameAndParent = moduleName;
  if (parentfilter)
    nameAndParent = `${nameAndParent}-${parentfilter.fieldahead}-${parentfilter.fieldvalue}`;
  if (moduleState.filters.sqlparam) {
    nameAndParent = `${nameAndParent}-${JSON.stringify(
      getSqlparamFilter(moduleState.filters.sqlparam),
    )}`;
  }
  // 第一次加载，需要把所有的导航信息生成放在本模块的变量里
  if (!moduleNavigates[nameAndParent]) {
    moduleNavigates[nameAndParent] = moduleInfo.navigateSchemes.map(
      (scheme): NavigateStateModal => ({
        navigateschemeid: scheme.navigateschemeid, // 导航方案id
        title: scheme.tf_text, // 导航的名称
        loading: 'needload', // 需要请求数据
        allowNullRecordButton: scheme.tf_allowNullRecordButton, // 是否允许在包含无记录导航之间切换
        isContainNullRecord: scheme.tf_isContainNullRecord, // 是否包含无记录导航值，当allowNullRecordButton为true时，可以切换
        cascading: scheme.tf_cascading, // 是否层级，为false则定义的各级都平级展示，当allLevel大于1时可以切换
        allLevel: scheme.tf_allLevel, // 导航定义的层数
        expandedKeys: [],
        canExpandedKeys: [],
        nodeCount: 0,
        dataSource: [],
        dataSourceKeyIndex: {},
        treeData: [],
        initExpandedKeys: [],
        initTreeData: [],
      }),
    );
  }
  // 当前模块的所有方案的state
  const [schemes, setSchemes] = useState(moduleNavigates[nameAndParent]);
  // 下面不加判断的话，导航在改变模块的时候可能不重新渲染
  if (schemes !== moduleNavigates[nameAndParent]) setSchemes(moduleNavigates[nameAndParent]);
  const onNavigateSelected = (selKeys: any, e: any, navigateschemeid: string) => {
    const {
      node: { data },
    } = e;
    // 对于所有的parent,都必须查一个是否有 addParentFilter,有的需要加入上级
    setSelectedKeys(navigateschemeid, selKeys);
    const navigates: any[] = [];
    const getFitlers = (node: any, addTo: boolean) => {
      if (addTo && node.moduleName) {
        navigates.push({
          moduleName: node.moduleName,
          fieldahead: node.fieldahead,
          fieldName: node.fieldName,
          aggregate: node.aggregate,
          fieldtitle: node.fieldtitle,
          operator: node.operator,
          fieldvalue: node.fieldvalue,
          text: node.title,
          isCodeLevel: node.isCodeLevel,
          numberGroupId: node.numberGroupId,
          schemeDetailId: node.schemeDetailId,
        });
      }
      // 递归加入需要的导航条件
      if (node.parent) {
        getFitlers(node.parent, node.addParentFilter);
      }
    };
    getFitlers(data, true);
    dispatch({
      type: 'modules/filterChanged',
      payload: {
        type: 'navigateSelectChange',
        moduleName,
        navigates,
      },
    });
  };

  const buildNavigateData = (scheme: NavigateStateModal) => {
    const { title, navigateschemeid, cascading, isContainNullRecord } = scheme;
    if (scheme.loading === 'loading') {
      // console.log(moduleName, navigateschemeid, '导航数据正在加载');
      return;
    }
    setSchemes(updateTo(nameAndParent, { ...scheme, loading: 'loading', dataSource: [] }));
    // console.log(moduleState.filters)
    // message.error('buildNavigateData')
    const dataSourceKeyIndex = {}; // 每一个item的key的索引，用于以后需要快速找到
    const params: any = {
      moduleName,
      title,
      navigateschemeid,
      cascading,
      isContainNullRecord,
      parentFilter: moduleState.filters.parentfilter,
    };
    if (moduleState.filters.sqlparam) {
      params.sqlparamstr = JSON.stringify(getSqlparamFilter(moduleState.filters.sqlparam));
    }
    fetchNavigateTreeData(params).then((result) => {
      let data = result;
      const expandedKeys: any[] = [];
      const canExpandedKeys: any[] = [];
      let key = 1000;
      const rebuildData = (rec: any) => {
        const item = rec;
        item.title = item.text;
        item.isLeaf = item.leaf;
        delete item.cls;
        delete item.text;
        delete item.leaf;
        item.key = `${key.toString()}`;
        key += 1;
        if (item.expanded) expandedKeys.push(item.key);
        if (item.children) {
          canExpandedKeys.push(item.key);
          item.children.forEach((child: any) => {
            apply(child, { parent: item });
          });
          item.children = item.children.map(rebuildData);
        }
        dataSourceKeyIndex[item.key] = item;
        return item;
      };
      let { children } = data;
      // 如果根节点下只有一个节点，这个节点还有子节点，则删除一层根节点
      if (children && children.length === 1 && !children[0].leaf) {
        const c = children[0].children;
        if (c && c.length === 1 && !c[0].leaf) {
          delete children[0].moduleName; // 顶层节点，不用加入条件
          delete children[0].fieldvalue;
          [data] = children;
        }
      }
      children = data.children;
      if (children && children.length > 0) children[0].expanded = true; // root展开
      if (!data.children) data.children = [];
      const dataSource = data.children.map(rebuildData);
      // 1、导航的数据小于200条，则全部展开
      // 2、根据分级多层设置的收缩值来，只显示到第一级的所有数据，例如部门，会展开所有的部门，下一级的展开自动加入

      const nodeCount = key - 1000;
      // 有一个初始的状态，在取消搜索时回到初始状态
      let initExpandedKeys;
      let initTreeData;
      let treeData;
      if (nodeCount <= EXPANDALLCOUNT) {
        initExpandedKeys = [...canExpandedKeys]; // 所有的全部展开
        treeData = genAllTreeData(dataSource);
        initTreeData = [...treeData];
      } else {
        initExpandedKeys = [...expandedKeys];
        treeData = genMiniTreeData(dataSource);
        initTreeData = [...treeData];
      }
      let parameterss: NavigateStateModal = {
        ...scheme,
        expandedKeys: initExpandedKeys,
        canExpandedKeys,
        dataSource,
        dataSourceKeyIndex,
        loading: 'loaded',
        nodeCount,
        treeData,
        initExpandedKeys,
        initTreeData,
      };
      // 如果改变datasource之后有搜索值，则把搜索条件加上
      if (scheme.search)
        parameterss = {
          ...parameterss,
          ...genSearchedDataAndExpandedKeys(dataSource, scheme.search),
        };
      setSchemes(updateTo(nameAndParent, parameterss));
    });
  };

  const refreshAllNavigate = () =>
    schemes.forEach((scheme: NavigateStateModal) => {
      buildNavigateData(scheme);
    });

  const toggleCascading = (ascheme: NavigateStateModal) => {
    apply(ascheme, { cascading: !ascheme.cascading });
    buildNavigateData(ascheme);
  };

  const toggleContainNullRecord = (ascheme: NavigateStateModal) => {
    apply(ascheme, { isContainNullRecord: !ascheme.isContainNullRecord });
    buildNavigateData(ascheme);
  };

  /**
   * 把node的子节点全部加进去，返回一个新的treeData
   * @param scheme
   * @param node
   */
  const addChildrenDataToNode = (scheme: NavigateStateModal, node: any): any[] => {
    // 这里是一次性加树全部加载过来，在本地缓存，并不是展开一级就去后台取子记录的方式。
    const childrenSource: any[] = scheme.dataSourceKeyIndex[node.key].children;
    let isletter = false;
    const { search } = scheme;
    if (search) isletter = /^[a-zA-Z]+$/.test(search);
    // 找到node,在 treeData中的记录
    const cloneNode = (nodes: any[]) => {
      return nodes.map((n_: any) => {
        const n = { ...n_ };
        if (n.key === node.key) {
          n.children = childrenSource
            .filter((_, index: number) => index < EXPANDLEVELMAXCOUNT)
            .map((item: any) => {
              if (isletter) {
                const find = PinyinMatch.match(item.title, search as string);
                return getNode(item, find ? item.title.substring(find[0], find[1] + 1) : '');
              }
              return getNode(item, scheme.search);
            });
          if (childrenSource.length > EXPANDLEVELMAXCOUNT) {
            n.children.push(getRestNode(childrenSource.length - EXPANDLEVELMAXCOUNT));
          }
        }
        if (n.children) {
          n.children = cloneNode(n.children);
        }
        return n;
      });
    };
    return cloneNode(scheme.treeData);
  };

  // 生成树，折叠的时候，如果是当前级，则不要折叠了，例如部门

  // 生成一个导航树的所有node
  const getTree = (scheme: NavigateStateModal) => {
    return (
      <DirectoryTree
        blockNode
        style={{ whiteSpace: 'nowrap' }}
        expandAction="doubleClick"
        onSelect={(selKeys: any, e: any) =>
          onNavigateSelected(selKeys, e, nameAndParent + scheme.navigateschemeid)
        }
        selectedKeys={getSelectedKeys(nameAndParent + scheme.navigateschemeid)}
        onExpand={(expandedKeys: any, { expanded, node }) => {
          // 展开的时候如果没有子节点，那就加入,如果子节点的数目小于data里的
          if (
            expanded &&
            (!node.children ||
              (node.children.length !== node[DATA].children.length &&
                node.children.length !== EXPANDLEVELMAXCOUNT + 1))
          ) {
            // message.warn('展开时加入node:')
            const treeData: any[] = addChildrenDataToNode(scheme, node);
            setSchemes(updateTo(nameAndParent, { ...scheme, expandedKeys, treeData }));
          } else setSchemes(updateTo(nameAndParent, { ...scheme, expandedKeys }));
        }}
        expandedKeys={scheme.expandedKeys}
        treeData={scheme.treeData}
      />
    );
  };
  // 生成导航最上方的附加按钮
  const getExtra = () => (
    <Space>
      <Tooltip title="刷新所有导航数据">
        <ReloadOutlined onClick={refreshAllNavigate} />
      </Tooltip>
    </Space>
  );

  const getTool = (scheme: NavigateStateModal) =>
    // 如果是单层导航，并且节点少于15个，并且没有显示无记录导航的按钮，那就整个不显示
    scheme.allLevel === 1 &&
    scheme.nodeCount <= LEVELMAXCOUNT &&
    !scheme.allowNullRecordButton ? null : (
      <Input.Group size="small" style={{ display: 'flex', paddingBottom: 3 }}>
        <Space>
          <Tooltip title="全部展开">
            <NodeExpandOutlined
              style={{ cursor: 'pointer' }}
              onClick={() => {
                // 只展开可以展开的，有些node没有加入children则不置为展开状态
                const expandedKeys = getCanExpandedKey(scheme.treeData);
                setSchemes(updateTo(nameAndParent, { ...scheme, expandedKeys }));
              }}
            />
          </Tooltip>
          <Tooltip title="子级全部折叠">
            <NodeCollapseOutlined
              style={{ cursor: 'pointer' }}
              onClick={() => {
                const expandedKeys = scheme.treeData
                  .filter((node) => !node.isLeaf)
                  .map((node) => node.key);
                setSchemes(updateTo(nameAndParent, { ...scheme, expandedKeys }));
              }}
            />
          </Tooltip>
          {
            /* eslint-disable */
            scheme.allLevel > 1 ? (
              scheme.cascading ? (
                <Tooltip title="并列显示各导航">
                  <DisconnectOutlined
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleCascading(scheme)}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="层叠显示各导航">
                  <LinkOutlined
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleCascading(scheme)}
                  />
                </Tooltip>
              )
            ) : null
            /* eslint-enable */
          }
          {scheme.allowNullRecordButton &&
            (scheme.isContainNullRecord ? (
              <Tooltip title="隐藏无记录的导航项目">
                <MoreOutlined
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleContainNullRecord(scheme)}
                />
              </Tooltip>
            ) : (
              <Tooltip title="显示无记录的导航项目">
                <EllipsisOutlined
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleContainNullRecord(scheme)}
                />
              </Tooltip>
            ))}
          <span />
        </Space>
        <Search
          size="middle"
          placeholder="搜索文本或简全拼"
          style={{ flex: 1 }}
          defaultValue={scheme.search}
          allowClear
          onSearch={(search: string) => {
            if (search) {
              if (search.length === 1) {
                message.warn('请输入二个以上的文字或字符再进行查询');
                return;
              }
              setSchemes(
                updateTo(nameAndParent, {
                  ...scheme,
                  search,
                  ...genSearchedDataAndExpandedKeys(scheme.dataSource, search),
                }),
              );
            } else {
              setSchemes(
                updateTo(nameAndParent, {
                  ...scheme,
                  search,
                  treeData: [...scheme.initTreeData],
                  expandedKeys: [...scheme.initExpandedKeys],
                }),
              );
            }
          }}
        />
      </Input.Group>
    );

  if (schemes.length > 1)
    return (
      <NavigateContext.Provider value={{ state: moduleState, moduleInfo, dispatch }}>
        <Card
          title="导航"
          bordered={false}
          bodyStyle={{ overflowY: 'auto' }}
          extra={getExtra()}
          size="small"
        >
          <Tabs
            className="navigate"
            defaultActiveKey={getModuleActiveTab(moduleName, schemes[0].navigateschemeid)}
            onChange={(key: string) => setModuleActiveTab(moduleName, key)}
            style={{ marginTop: '-10px' }}
          >
            {schemes.map((scheme: NavigateStateModal) => {
              const { navigateschemeid, title } = scheme;
              return (
                <TabPane tab={title} key={navigateschemeid}>
                  {scheme.loading === 'loaded' ? (
                    <>
                      {' '}
                      {getTool(scheme)}
                      {getTree(scheme)}
                    </>
                  ) : (
                    <Card loading bordered={false}>
                      <>{buildNavigateData(scheme)}</>
                    </Card>
                  )}
                </TabPane>
              );
            })}
          </Tabs>
        </Card>
      </NavigateContext.Provider>
    );

  const scheme = schemes[0];
  if (scheme.loading === 'loaded')
    return (
      <NavigateContext.Provider value={{ state: moduleState, moduleInfo, dispatch }}>
        <Card
          bordered={false}
          bodyStyle={{ overflowY: 'auto' }}
          title={<>{scheme.title} 导航</>}
          extra={getExtra()}
          size="small"
        >
          <>
            {' '}
            {getTool(scheme)}
            {getTree(scheme)}
          </>
        </Card>
      </NavigateContext.Provider>
    );

  buildNavigateData(scheme);
  return (
    <Card
      loading
      bordered={false}
      title={<>{scheme.title} 导航</>}
      extra={getExtra()}
      size="small"
    />
  );
};

export default Navigate;
