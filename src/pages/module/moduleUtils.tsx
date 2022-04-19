/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useState } from 'react';
import { apply } from '@/utils/utils';
import { CloseOutlined, LinkOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Card, Input, message, Popover, Tabs, Tooltip } from 'antd';
import { history } from 'umi';
import request, { API_HEAD } from '@/utils/request';
import { serialize } from 'object-to-formdata';
import { isAdmin, isAdministrator } from '@/utils/Authorized';
import { CHILDREN } from '../datamining/constants';
import styles from './index.less';
import { getModuleInfo } from './modules';
import type { ModuleState, ParentFilterModal, ModuleModal } from './data';
import { PARENT_RECORD } from './constants';

const marked = require('marked');

export const DateFormat = 'YYYY-MM-DD';
export const DateTimeFormat = 'YYYY-MM-DD HH:mm:ss';
export const DateTimeFormatWithOutSecond = 'YYYY-MM-DD HH:mm';

// 取得某一个级数的长度，从1开始
const getLevelLen = (level: number, codelevel: string[]): number => {
  let result = 0;
  for (let i = 0; i < level; i += 1) {
    result += parseInt(codelevel[i], 10);
  }
  return result;
};
// 返回一个字符串是第几级，从1开始
const getLevel = (code: string, codelevel: string[]): number => {
  if (!code) return 0;
  const strlen = code.length;
  for (let i = 0; i < codelevel.length; i += 1) {
    if (strlen === getLevelLen(i + 1, codelevel)) return i + 1;
  }
  return -1;
};

/**
 * 用record 替换掉 records 中相同的key的记录，children留着
 * @param records
 * @param record
 */
export const updateTreeRecord = (records: any[], newRecord: any, primarykey: string) => {
  const result: any[] = [...records];
  const updateRecord = (recs: any[]) => {
    recs.forEach((record) => {
      const rec = record;
      if (rec[primarykey] === newRecord[primarykey]) {
        Object.keys(rec).forEach((key) => {
          if (key !== CHILDREN && key !== PARENT_RECORD)
            // 只留下children属性
            delete rec[key];
        });
        apply(rec, newRecord);
      }
      if (rec.children && rec.children.length) {
        updateRecord(rec.children);
      }
    });
  };
  updateRecord(result);
  return result;
};

/**
 * 将一条记录根据codelevel插入到权势中
 * @param records
 * @param newRecord
 * @param primarykey
 * @param codelevelstr
 */
export const addRecordToTree = (
  records: any[],
  newRecord: any,
  primarykey: string,
  codelevelstr: string,
): any[] => {
  const codelevel: string[] = codelevelstr.split(',');
  const newRecordLevel = getLevel(newRecord[primarykey], codelevel);
  // 如果是pid类型，或者是根节点的，那么直接加入后返回
  if (!codelevelstr || newRecordLevel === 1) return [...records, newRecord];
  const parentkey = (newRecord[primarykey] as string).substr(
    0,
    getLevelLen(newRecordLevel - 1, codelevel),
  );
  const result = [...records];
  let alreadyAdd = false;
  const addTo = (recs: any[]) => {
    recs.forEach((record: any) => {
      const rec = record;
      if (!alreadyAdd)
        if (rec[primarykey] === parentkey) {
          if (!rec.children) rec.children = [];
          rec.children.push(newRecord);
          apply(newRecord, { [PARENT_RECORD]: rec });
          alreadyAdd = true;
        }
      if (!alreadyAdd && rec.children && Array.isArray(rec.children)) addTo(rec.children);
    });
  };
  addTo(result);
  return result;
};

/**
 * 根据codelevel取得当前key节点的父节点值
 * @param key
 * @param codelevel
 */
export const getTreeRecordParentKey = (key: string, codelevelstr: string) => {
  const codelevel: string[] = codelevelstr.split(',');
  const level = getLevel(key, codelevel);
  if (level === 1) return '';
  return key.substr(0, getLevelLen(level - 1, codelevel));
};

/**
 * 从onetomany的格式中取得模块名称      Set<FUser>  => FUser
 * @param str
 */
export const getModuleNameFromOneToMany = (str: string) => {
  // eslint-disable-next-line
  const regex = /(\<.+?\>)/g;
  const s: any = str.match(regex);
  if (s.length > 0) return s[0].replace(/[<|>]/g, '');
  return null;
};

/**
 * 给所有的记录加上父记录的属性 _parent_record_
 * @param nodes
 */
export const generateTreeParent = (nodes: any[]) => {
  const addParent = (item: any) => {
    if (Array.isArray(item.children)) {
      item.children.forEach((c: any) => {
        apply(c, { [PARENT_RECORD]: item });
        addParent(c);
      });
    }
  };
  nodes.forEach((node) => addParent(node));
  return nodes;
};

// 在树形结构中找到主键是pinkey的记录并返回
export const getPinRecord = (records: any[], pinkey: string, primarykey: string): any => {
  let result: any = null;
  const findPinRecord = (recs: any[]) => {
    recs.forEach((rec: any) => {
      if (!result)
        if (rec[primarykey] === pinkey) {
          result = rec;
        }
      if (!result && rec.children && Array.isArray(rec.children)) findPinRecord(rec.children);
    });
  };
  findPinRecord(records);
  // 如果没找到pinkey可能被别人删了，那就返回所有的
  if (!result) return records;
  return result;
};

/**
 * 将一个树形结构的记录全部放到一个数组中去
 * @param records
 */
export const getAllTreeRecord = (records: any[]) => {
  const result: any[] = [];
  const getThislevel = (record: any) => {
    result.push(record);
    if (record.children && record.children.length)
      record.children.forEach((rec: any) => getThislevel(rec));
  };
  records.forEach((record) => getThislevel(record));
  return result;
};

/**
 * 根据主键的定义，在树形结构中找到当前层下面的最大的主键的值
 * @param key
 * @param data
 */
export const getMaxPrimaryKeyFromKey = (data: any[], key: string, primarykey: string): string => {
  const record = getPinRecord(data, key, primarykey);
  if (!record || Array.isArray(record)) return '';
  const parent = record[PARENT_RECORD];
  // 是根节点的
  if (!parent) {
    return data.reduce((a, b) => (b[primarykey] > a[primarykey] ? b : a))[primarykey];
  }
  return (parent.children as any[]).reduce((a, b) => (b[primarykey] > a[primarykey] ? b : a))[
    primarykey
  ];
};

export const getRecordByKey = (dataSource: any[], key: string, primarykey: string) => {
  for (let i = 0; i < dataSource.length; i += 1) {
    if (dataSource[i][primarykey] === key) return dataSource[i];
  }
  return null;
};

/**
 * 获取当前选中的一条记录，如果选中有多条，则返回null
 * @param moduleState
 */
export const getSelectedRecord = (moduleState: ModuleState): any => {
  const { selectedRowKeys, moduleName, dataSource } = moduleState;
  const { primarykey, istreemodel } = getModuleInfo(moduleName);
  if (selectedRowKeys.length !== 1) return null;
  return getRecordByKey(
    istreemodel ? getAllTreeRecord(dataSource) : dataSource,
    selectedRowKeys[0],
    primarykey,
  );
};

/**
 * 获取当前选中的所有记录的数组
 * @param moduleState
 */
export const getSelectedRecords = (moduleState: ModuleState): any[] => {
  const { selectedRowKeys, moduleName, dataSource } = moduleState;
  const moduleInfo = getModuleInfo(moduleName);
  const { primarykey, istreemodel } = moduleInfo;
  return selectedRowKeys.map((key: string) =>
    getRecordByKey(istreemodel ? getAllTreeRecord(dataSource) : dataSource, key, primarykey),
  );
};

// 如果网址中有父模块的限定条件。
// 1.现在有限定条件
//   a.原来没有
//   b.原来也有限定条件，判断主键路径等是否一致，如果不一致，则重置moduleState
// 2.现在无限定条件,原来有限定条件，则重置moduleState
//
export const isParentFilterChanged = ({
  moduleState,
  parentFilter: newpf,
}: {
  moduleState: ModuleState;
  parentFilter: ParentFilterModal | undefined;
}) => {
  const { parentfilter: mpf } = moduleState.filters;
  // 如果一个有，一个没有，那么就不相同
  if (mpf) {
    if (!newpf) return true;
    return (
      mpf.moduleName !== newpf.moduleName ||
      mpf.fieldahead !== newpf.fieldahead ||
      mpf.fieldvalue !== newpf.fieldvalue ||
      mpf.fieldName !== newpf.fieldName ||
      mpf.operator !== newpf.operator
    );
  }
  if (newpf) return true;
  return false;
};

/**
 * 模块有父模块限定，生成限定的内容
 * @param pf
 */
export const getParentFilterTitle = (
  pf: ParentFilterModal | undefined,
  moduleState: ModuleState,
  dispatch: any,
) => {
  return pf ? (
    <span className={styles.headerparenttext}>
      <LinkOutlined style={{ paddingRight: '2px' }} />
      {`${pf.fieldtitle}${pf.text ? `『${pf.text}』` : ''}`}
      <Tooltip title="取消限定条件">
        <span>
          <a
            onClick={() => {
              history.push({
                pathname: window.location.pathname,
              });
              setTimeout(() => {
                dispatch({
                  type: 'modules/parentFilterChanged',
                  payload: {
                    moduleName: moduleState.moduleName,
                    parentFilter: undefined,
                  },
                });
              }, 100);
            }}
          >
            <CloseOutlined style={{ paddingLeft: '6px' }} />
          </a>
        </span>
      </Tooltip>
    </span>
  ) : (
    <></>
  );
};

export const getModuleIcon = (moduleInfo: ModuleModal) => {
  return moduleInfo.iconcls ? <span className={moduleInfo.iconcls} /> : <></>;
};

interface ModuleHelpMarkDownProps {
  moduleInfo: ModuleModal;
}

export const ModuleHelpMarkDown: React.FC<ModuleHelpMarkDownProps> = ({ moduleInfo }) => {
  const { helpmarkdown } = moduleInfo;
  const [markdown, setMarkdown] = useState<string>('');
  useEffect(() => {
    setMarkdown(helpmarkdown || '');
  }, [moduleInfo.modulename]);
  const showMarkDown = (
    <div style={{ padding: 4, height: '520px', overflowY: 'auto', border: '1px solid gray' }}>
      {/* eslint-disable */}
      <Card className="markdowncard" bordered={false}>
        <span className="markdown" dangerouslySetInnerHTML={{ __html: marked.parse(markdown) }} />
      </Card>
      {/* eslint-enable */}
    </div>
  );
  const editMarkDown = (
    <>
      <Button
        type="primary"
        style={{ margin: 8, position: 'absolute', right: '18px', top: '40px', zIndex: 1 }}
        onClick={() => {
          request(`${API_HEAD}/platform/systemcommon/saveobjectmarkdown.do`, {
            method: 'post',
            body: serialize({
              moduleName: moduleInfo.modulename,
              text: markdown,
            }),
          }).then(() => {
            message.success('模块的帮助信息保存成功！');
          });
        }}
      >
        保存
      </Button>
      <Input.TextArea
        style={{ height: '520px' }}
        value={markdown}
        onChange={(e) => {
          setMarkdown(e.target.value);
        }}
      />
    </>
  );
  if (helpmarkdown || isAdmin() || isAdministrator()) {
    return (
      <Popover
        key={moduleInfo.modulename}
        trigger="click"
        placement="bottom"
        title={`${moduleInfo.title}的帮助说明`}
        content={
          <div style={{ width: '1000px', marginTop: '-12px' }}>
            {isAdmin() || isAdministrator() ? (
              <Tabs>
                <Tabs.TabPane tab="展示页" key="showtab">
                  {showMarkDown}
                </Tabs.TabPane>
                <Tabs.TabPane tab="编辑页" key="edittab">
                  {editMarkDown}
                </Tabs.TabPane>
              </Tabs>
            ) : (
              showMarkDown
            )}
          </div>
        }
      >
        <span className={styles.headerparenttext}>
          <QuestionCircleOutlined />
        </span>
      </Popover>
    );
  }
  return null;
};

export const getLeafColumns = (columns: any[]): any[] => {
  const result: any[] = [];
  columns.forEach((column) => {
    if (column.children && column.children.length) result.push(...getLeafColumns(column.children));
    else if (column.columns && column.columns.length)
      result.push(...getLeafColumns(column.columns));
    else result.push(column);
  });
  return result;
};
