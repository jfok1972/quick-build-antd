import React, { useState } from 'react';
import { useEffect } from 'react';
import { Card, Col, Row, Tabs, Result } from 'antd';
import request, { API_HEAD } from '@/utils/request';
import styles from './index.less';
import { apply, applyAllOtherSetting, getAwesomeIcon, replaceRef } from '@/utils/utils';
import { StaticCard } from '../components/StaticCard';
import { EchartsDemo } from '@/pages/dashboard/charts/pm/echartsDemo';
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
const getColSpan = (colspan: number | undefined) => {
  if (colspan === 2) return halfColSpan;
  if (colspan === 4) return { span: 24 };
  if (colspan === 3) return threequartersBlockColSpan;
  if (colspan === -1) return threeRestQuartersBlockColSpan;
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

const BlockDetail = ({
  block,
  inner = false,
  forceUpdateCount,
}: {
  block: any;
  inner?: boolean;
  forceUpdateCount: number;
}) => {
  // 防止echarts 在切换tabs后不渲染的问题
  const [innerForceUpdateCount, setInnerForceUpdateCount] = useState<number>(0);

  console.log(block);
  // 如果是一个tabPanel
  if (block.xtype && (block.xtype as string).toLowerCase() === 'tabpanel') {
    return (
      <Card bordered={false}>
        <Tabs
          className={styles.innertabs}
          onChange={() => {
            setInnerForceUpdateCount((value) => value + 1);
          }}
        >
          {block.items.map((tab: any, index: number) => (
            <TabPane
              tab={
                <span>
                  {tab.iconCls ? getAwesomeIcon(tab.iconCls) : null} {tab.title}
                </span>
              }
              tabKey={`block-${index}`}
              key={tab.detailid}
              className={styles.blocktab}
            >
              <BlockDetail
                key={tab.detailid}
                block={tab}
                forceUpdateCount={forceUpdateCount + innerForceUpdateCount}
              />
            </TabPane>
          ))}
        </Tabs>
      </Card>
    );
  }
  // 如果当前的块级有子块
  if (block.items && block.items.length) {
    return (
      <Row gutter={[12, 12]} className={styles.subcol}>
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
            <Col
              key={item.detailid}
              {...response}
              className={item.items ? styles.subcol : ''}
              style={style}
            >
              <div className={styles.innercard}>
                <BlockDetail block={item} inner={true} forceUpdateCount={forceUpdateCount} />
              </div>
            </Col>
          );
        })}
      </Row>
    );
  }
  let thisBlock = null;
  if (block.fovDataobjectwidget)
    thisBlock = <DataobjectWidget widget={block.fovDataobjectwidget} />;
  else if (block.staticCard) thisBlock = <StaticCard {...block.staticCard} />;
  else thisBlock = <EchartsDemo id={`${block.detailid}id`} forceUpdateCount={forceUpdateCount} />;
  return <div style={{ height: '100%' }}>{thisBlock}</div>;
};

export const BlockSchemes: React.FC = () => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  // 防止echarts 在切换tabs后不渲染的问题

  const [forceUpdateCount, setForceUpdateCount] = useState<number>(0);
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
  if (schemes.length > 0) {
    if (schemes.length > 1) {
      return (
        <Card bordered={false} className={styles.globalcard}>
          <Tabs
            onChange={() => {
              setForceUpdateCount((value) => value + 1);
            }}
          >
            {schemes.map((block, index) => (
              <TabPane
                tab={
                  <span>
                    {block.iconCls ? getAwesomeIcon(block.iconCls) : null} {block.title}
                  </span>
                }
                tabKey={`block-${index}`}
                key={block.homepageschemeid}
                className={styles.blockcard}
              >
                <BlockDetail
                  key={block.items[0].detailid}
                  block={block.items[0]}
                  forceUpdateCount={forceUpdateCount}
                />
              </TabPane>
            ))}
          </Tabs>
        </Card>
      );
    }
    return (
      <div className={styles.innercard}>
        <BlockDetail
          key={schemes[0].items[0].detailid}
          block={schemes[0].items[0]}
          forceUpdateCount={forceUpdateCount}
        />
      </div>
    );
  }
  return loaded ? (
    <Result
      status="warning"
      title="未设置分析页方案"
      subTitle="尚未设置您的分析页方案，请咨询管理员进行设置！"
    />
  ) : null;
};
