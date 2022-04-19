/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { createContext, useContext, useState } from 'react';
import { useEffect } from 'react';
import { Col, Row, Tabs, Result, Empty, Collapse, Popover, Badge } from 'antd';
import RcResizeObserver from 'rc-resize-observer';
import classNames from 'classnames';
import request, { API_HEAD } from '@/utils/request';
import styles from './index.less';
import { apply, applyAllOtherSetting, getAwesomeIcon, replaceRef } from '@/utils/utils';
import { DataobjectWidget } from './DataobjectWidget';
import UserDefineFilter, {
  changeUserFilterToParam,
  UserInlineDefineFilter,
} from '../UserDefineFilter';
import { getDefaultModuleState } from '../modules';
import type { ModuleState } from '../data';
import { FilterOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

// 01 分析页，02 数据页
const blockTypeSchemes: Record<string, any[]> = {};

export const quarterBlockColSpan: any = {
  xs: 24,
  sm: 12,
  md: 12,
  lg: 12,
  xl: 6,
  xxl: 6,
};

export const threequartersBlockColSpan: any = {
  xs: 24,
  sm: 24,
  md: 24,
  lg: 18,
  xl: 18,
  xxl: 18,
};

// 和三个排在一起的剩余的一个的设置，和三个是对应的
export const threeRestQuartersBlockColSpan: any = {
  xs: 24,
  sm: 24,
  md: 24,
  lg: 6,
  xl: 6,
  xxl: 6,
};

export const halfColSpan: any = {
  xs: 24,
  sm: 24,
  md: 24,
  lg: 24,
  xl: 12,
  xxl: 12,
};

export const quarterInnerBlockColSpan: any = {
  xs: 24,
  sm: 12,
  md: 6,
  lg: 12,
  xl: 6,
  xxl: 6,
};

export const halfInnerColSpan: any = {
  xs: 24,
  sm: 12,
  md: 12,
  lg: 24,
  xl: 12,
  xxl: 12,
};

/**
 * 顶层的格子获取宽度
 * @param colspan
 * @returns
 */
const getColSpan = (colspan: number | string | undefined) => {
  if (colspan === 2 || colspan === '2') return halfColSpan;
  if (colspan === 4 || colspan === '4') return { span: 24 };
  if (colspan === 3 || colspan === '3') return threequartersBlockColSpan;
  if (colspan === -1 || colspan === '-1') return threeRestQuartersBlockColSpan;
  return quarterBlockColSpan;
};

/**
 * 在一个格子中再次进行进行分拆时获取宽度
 * @param colspan
 * @returns
 */
const getInnerColSpan = (colspan: number | undefined) => {
  if (colspan === 2) return halfInnerColSpan;
  if (colspan === 4) return { span: 24 };
  if (colspan === -1) return threeRestQuartersBlockColSpan;
  if (colspan === 3) return threequartersBlockColSpan;
  return quarterInnerBlockColSpan;
};

const getTitle = (block: any) => {
  return (
    <span>
      {block.iconCls ? getAwesomeIcon(block.iconCls) : null} {block.title}
    </span>
  );
};

const BlockCompactContext = createContext<Record<string, any>>({
  compact: false,
});

// 记录组件的筛选条件
const detailIdFilterModuleState: Record<string, ModuleState> = {};
const getDetailFilterModuleState = (detailid: string, moduleName: string) => {
  if (!detailIdFilterModuleState[detailid]) {
    detailIdFilterModuleState[detailid] = getDefaultModuleState({ moduleName });
  }
  return detailIdFilterModuleState[detailid];
};

// 父容器筛选Context
export const WidgetParentUserFiltersContext = createContext<any>({ parnetUserFilters: [] });

// 父容器中直接加入筛选界面
const UserInlineDefineFilterArea: React.FC<any> = ({
  tab,
  states,
  setStates,
}: {
  tab: any;
  states: Record<string, ModuleState>;
  setStates: Function;
}) => {
  return (
    <UserInlineDefineFilter
      moduleState={states[tab.detailid]}
      dispatch={(params: any) => {
        // 在重置的时候，需要把UserDefineFilter中的记录都清空，因此加了这一个moduleState
        if (params.type === 'modules/filterChanged') {
          const state = states[tab.detailid];
          state.filters.userfilter = params.payload.userfilter;
          setStates({ ...states });
        }
      }}
      filterSchemeid={tab.filterSchemeid}
    />
  );
};

/**
 * 放在分组组件的后面的条件按钮，放在 Collapse, list , 和 Tabs 上面
 * @param param0
 * @returns
 */
const PopoverFilterButton: React.FC<any> = ({
  tab,
  states,
  setStates,
}: {
  tab: any;
  states: Record<string, ModuleState>;
  setStates: Function;
}) => {
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const {
    filters: { userfilter },
  } = states[tab.detailid];
  const userfilters = changeUserFilterToParam(userfilter);
  return (
    <Popover
      visible={filterVisible}
      onVisibleChange={(v) => {
        setFilterVisible(v);
      }}
      trigger={['click']}
      title="设置筛选条件"
      content={
        <UserDefineFilter
          visible={true}
          moduleState={states[tab.detailid]}
          dispatch={(params: any) => {
            // 在重置的时候，需要把UserDefineFilter中的记录都清空，因此加了这一个moduleState
            if (params.type === 'modules/filterChanged') {
              const state = states[tab.detailid];
              state.filters.userfilter = params.payload.userfilter;
              setStates({ ...states });
            }
            setFilterVisible(false);
          }}
          filterSchemeid={tab.filterSchemeid}
          inPopover
        />
      }
    >
      <span style={{ paddingRight: '16px' }}>
        {userfilters.length ? (
          <Badge
            count={userfilters.length}
            dot={false}
            offset={[-6, 6]}
            style={{ backgroundColor: '#108ee9' }}
          >
            <FilterOutlined
              style={{
                paddingRight: '20px',
              }}
              className={styles.filtericon}
            />
          </Badge>
        ) : (
          <FilterOutlined className={styles.filtericon} />
        )}
      </span>
    </Popover>
  );
};

const getInitStates = (block: any) => {
  const result: Record<string, ModuleState> = {};
  block.items.forEach((tab: any) => {
    if (tab.filterSchemeid && tab.moduleName) {
      result[tab.detailid] = getDetailFilterModuleState(tab.detailid, tab.moduleName);
    }
  });
  return result;
};

/**
 * 如果某一个定义的容器组件有 filterSchemeid , 则可以把筛选条件加在组件上，其所有子组件都可以响应用户自定义条件的事件
 * @param param0
 * @returns
 */
const DetailCollapse = ({
  block,
  outsideClass,
  list = false,
}: {
  block: any;
  outsideClass: string;
  list?: boolean;
}) => {
  const [states, setStates] = useState<Record<string, ModuleState>>(getInitStates(block));
  const keySet = list
    ? {
        // list 全部展开，不允许折叠
        activeKey: block.items.map((b: any) => b.detailid),
      }
    : {
        // 设置 active: false ,默认折叠
        defaultActiveKey: block.items.map((b: any) => (b.active === false ? null : b.detailid)),
      };
  return (
    <Collapse
      className="blockcollapse"
      collapsible="header"
      bordered
      // 是否是手风琴模式，只多只能展开一个
      accordion={block.accordion && !list}
      {...keySet}
    >
      {block.items.map((tab: any) => {
        let filter = null;
        if (tab.filterSchemeid) {
          filter =
            tab.filterPosition === 'inline' ? (
              <UserInlineDefineFilterArea tab={tab} states={states} setStates={setStates} />
            ) : (
              <PopoverFilterButton tab={tab} states={states} setStates={setStates} />
            );
        }
        /* eslint-disable */
        const tabChildren = (
          <div className={outsideClass}>
            <BlockDetail key={tab.detailid} block={tab} />
          </div>
        );
        /* eslint-enable */
        return (
          <Collapse.Panel
            showArrow={!list}
            className={classNames({
              [styles.filtercollapsepanel]: tab.filterPosition === 'inline',
            })}
            header={getTitle(tab)}
            key={tab.detailid}
            extra={filter}
          >
            {tab.filterSchemeid ? (
              <WidgetParentUserFiltersContext.Provider
                value={{
                  parnetUserFilters: changeUserFilterToParam(
                    states[tab.detailid].filters.userfilter,
                  ),
                }}
              >
                {tabChildren}
              </WidgetParentUserFiltersContext.Provider>
            ) : (
              tabChildren
            )}
          </Collapse.Panel>
        );
      })}
    </Collapse>
  );
};

/**
 * 如果Tabs下的tab有 filterSchemeid , 则可以把筛选条件加在组件上，其所有子组件都可以响应用户自定义条件的事件
 * @param param0
 * @returns
 */
const DetailTabs = ({ block, outsideClass }: { block: any; outsideClass: string }) => {
  const [states, setStates] = useState<Record<string, ModuleState>>(getInitStates(block));
  const [activeKey, setActiveKey] = useState<string>(block.items[0].detailid);
  const currTab: any = (block.items as []).find((item: any) => item.detailid === activeKey);
  let filter = null;
  if (currTab && currTab.filterSchemeid) {
    filter =
      currTab.filterPosition === 'inline' ? (
        <UserInlineDefineFilterArea tab={currTab} states={states} setStates={setStates} />
      ) : (
        <PopoverFilterButton tab={currTab} states={states} setStates={setStates} />
      );
  }
  return (
    <Tabs
      tabPosition={block.tabPosition || 'top'}
      className="blocktabs"
      tabBarExtraContent={filter}
      activeKey={activeKey}
      onChange={(key) => setActiveKey(key)}
    >
      {block.items.map((tab: any, index: number) => {
        /* eslint-disable */
        const tabChildren = (
          <div className={outsideClass}>
            <BlockDetail key={tab.detailid} block={tab} />
          </div>
        );
        /* eslint-enable */
        return (
          <TabPane tab={getTitle(tab)} tabKey={`block-${index}`} key={tab.detailid}>
            {tab.filterSchemeid ? (
              <WidgetParentUserFiltersContext.Provider
                value={{
                  parnetUserFilters: changeUserFilterToParam(
                    states[tab.detailid].filters.userfilter,
                  ),
                }}
              >
                {tabChildren}
              </WidgetParentUserFiltersContext.Provider>
            ) : (
              tabChildren
            )}
          </TabPane>
        );
      })}
    </Tabs>
  );
};

// 生成table 上面自定义的组件
export const TableBlockDetails = ({ tableWidgets }: { tableWidgets: any[] }) => {
  return (
    <Row gutter={[12, 12]} className={styles.blockrow}>
      {tableWidgets.map((item: any) => {
        // 如果在附加设置中设置了response,如果没设置，就用内置的
        let { response } = item;
        if (!response) response = getColSpan(item.colspan);
        const style = { height: item.height ? `${item.height}px` : 'auto' };
        if (item.style) apply(style, item.style);
        return (
          <Col key={item.widgetid} {...response} style={style}>
            <div className="innercard">
              <DataobjectWidget widget={item} />
            </div>
          </Col>
        );
      })}
    </Row>
  );
};

export const BlockDetail = ({ block, inner = false }: { block: any; inner?: boolean }) => {
  const { compact } = useContext(BlockCompactContext);
  const outsideClass = classNames({
    [styles.outsiderectcompact]: compact,
    [styles.outsiderect]: !compact,
  });
  // 防止echarts 在切换tabs后不渲染的问题,需要弄一个tabs转换的计数器，现在没有加
  if (block.xtype) {
    const xtype = (block.xtype as string).toLowerCase();
    if (xtype === 'tabpanel' && !compact) {
      return <DetailTabs block={block} outsideClass={outsideClass} />;
    }
    if (xtype === 'collapse' || (xtype === 'tabpanel' && compact)) {
      return <DetailCollapse block={block} outsideClass={outsideClass} />;
    }
    if (xtype === 'list') {
      return <DetailCollapse block={block} outsideClass={outsideClass} list />;
    }
  }
  // 如果当前的块级有子块
  if (block.items && block.items.length) {
    return (
      <Row gutter={compact ? [0, 1] : [12, 12]} className={styles.blockrow}>
        {block.items.map((item: any) => {
          // 如果在附加设置中设置了response,如果没设置，就用内置的
          let { response } = item;
          if (!response)
            response =
              inner && block.colspan !== 4
                ? getInnerColSpan(item.colspan)
                : getColSpan(item.colspan);
          const style = { height: item.height ? `${item.height}px` : 'auto' };
          if (item.style) apply(style, item.style);
          return (
            <Col key={item.detailid} {...response} style={style}>
              <div className="innercard">
                <BlockDetail block={item} inner={true} />
              </div>
            </Col>
          );
        })}
      </Row>
    );
  }
  if (block.fovDataobjectwidget) return <DataobjectWidget widget={block.fovDataobjectwidget} />;
  return <Empty description="未设置实体对象组件" />;
};

export const BlockSchemes: React.FC<any> = ({ type }: { type: string }) => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  // 如果宽度小于480，设置xtype=collapse,则tabpanel作为 collapse
  const [compact, setCompact] = useState<boolean>(false);
  useEffect(() => {
    if (!blockTypeSchemes[type]) {
      request(`${API_HEAD}/platform/homepage/getinfo.do`, {
        method: 'POST',
        params: {
          type,
        },
      }).then((response: any[]) => {
        const typeSchemes = [];
        typeSchemes.push(...response);
        replaceRef(typeSchemes, typeSchemes);
        applyAllOtherSetting(typeSchemes);
        blockTypeSchemes[type] = typeSchemes;
        setSchemes(typeSchemes);
        setLoaded(true);
      });
    } else {
      setSchemes(blockTypeSchemes[type]);
      setLoaded(true);
    }
  }, [type]);
  let schemeWidget: any = null;
  const outsideClass = classNames({
    [styles.outsiderectcompact]: compact,
    [styles.outsiderect]: !compact,
  });
  if (schemes.length > 0) {
    if (schemes.length > 1) {
      schemeWidget = compact ? (
        <Collapse
          className="blockcollapse"
          bordered
          defaultActiveKey={schemes.map((b: any) => b.homepageschemeid)}
        >
          {schemes.map((block: any) => (
            <Collapse.Panel header={getTitle(block)} key={block.homepageschemeid}>
              <div className={outsideClass}>
                <BlockDetail key={block.items[0].detailid} block={block.items[0]} />
              </div>
            </Collapse.Panel>
          ))}
        </Collapse>
      ) : (
        <Tabs tabPosition="top" className="blocktabs">
          {schemes.map((block, index) => (
            <TabPane tab={getTitle(block)} tabKey={`block-${index}`} key={block.homepageschemeid}>
              <div className={outsideClass}>
                <BlockDetail key={block.items[0].detailid} block={block.items[0]} />
              </div>
            </TabPane>
          ))}
        </Tabs>
      );
    } else
      schemeWidget = (
        <div className="innercard">
          <BlockDetail key={schemes[0].items[0].detailid} block={schemes[0].items[0]} />
        </div>
      );
  } else
    schemeWidget = loaded ? (
      <Result
        status="warning"
        title="未设置分析页方案"
        subTitle="尚未设置您的分析页方案，请咨询管理员进行设置！"
      />
    ) : null;

  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        if (offset.width <= 576) {
          if (!compact) setCompact(true);
        } else if (compact) setCompact(false);
      }}
    >
      <BlockCompactContext.Provider value={{ compact }}>
        <div className={outsideClass}>{schemeWidget}</div>
      </BlockCompactContext.Provider>
    </RcResizeObserver>
  );
};
