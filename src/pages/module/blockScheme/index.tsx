import React, { createContext, useContext, useState } from 'react';
import { useEffect } from 'react';
import { Col, List, Row, Tabs, Result, Empty, Collapse } from 'antd';
import RcResizeObserver from 'rc-resize-observer';
import classNames from 'classnames';
import request, { API_HEAD } from '@/utils/request';
import styles from './index.less';
import { apply, applyAllOtherSetting, getAwesomeIcon, replaceRef } from '@/utils/utils';
import { DataobjectWidget } from './DataobjectWidget';

const { TabPane } = Tabs;
const blockSchemes: any[] = [];

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
  lg: 12,
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
          <Col key={item.detailid} {...response} style={style}>
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
  const context = useContext(BlockCompactContext);
  let compact = false;
  if (context) {
    compact = context.compact;
  }
  const outsideClass = classNames({
    [styles.outsiderectcompact]: compact,
    [styles.outsiderect]: !compact,
  });
  // 防止echarts 在切换tabs后不渲染的问题,需要弄一个tabs转换的计数器，现在没有加
  if (block.xtype) {
    const xtype = (block.xtype as string).toLowerCase();
    if (xtype === 'tabpanel' && !compact) {
      return (
        <Tabs tabPosition={block.tabPosition || 'top'} className="blocktabs">
          {block.items.map((tab: any, index: number) => (
            <TabPane tab={getTitle(tab)} tabKey={`block-${index}`} key={tab.detailid}>
              <div className={outsideClass}>
                <BlockDetail key={tab.detailid} block={tab} />
              </div>
            </TabPane>
          ))}
        </Tabs>
      );
    }
    if (xtype === 'collapse' || (xtype === 'tabpanel' && compact)) {
      return (
        <Collapse
          className="blockcollapse"
          bordered
          // 是否是手风琴模式，只多只能展开一个
          accordion={block.accordion}
          // 设置 active: false ,默认折叠
          defaultActiveKey={block.items.map((b: any) => (b.active === false ? null : b.detailid))}
        >
          {block.items.map((tab: any) => (
            <Collapse.Panel header={getTitle(tab)} key={tab.detailid}>
              <div className={outsideClass}>
                <BlockDetail key={tab.detailid} block={tab} />
              </div>
            </Collapse.Panel>
          ))}
        </Collapse>
      );
    }
    if (xtype === 'list') {
      return (
        <List className="blocklist" bordered header={getTitle(block)}>
          {block.items.map((tab: any) => (
            <List.Item key={tab.detailid}>
              <div className={outsideClass}>
                <BlockDetail key={tab.detailid} block={tab} />
              </div>
            </List.Item>
          ))}
        </List>
      );
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
  return <Empty description="未设置实体对象组件"></Empty>;
};

export const BlockSchemes: React.FC = () => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  // 如果宽度小于480，设置xtype=collapse,则tabpanel作为 collapse
  const [compact, setCompact] = useState<boolean>(false);
  useEffect(() => {
    if (blockSchemes.length === 0) {
      request(`${API_HEAD}/platform/homepage/getinfo.do`, {
        method: 'POST',
      }).then((response: any[]) => {
        blockSchemes.push(...response);
        replaceRef(blockSchemes, blockSchemes);
        applyAllOtherSetting(blockSchemes);
        setSchemes(blockSchemes);
        setLoaded(true);
      });
    } else {
      setSchemes(blockSchemes);
    }
  }, []);
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
        console.log(offset.width);
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
