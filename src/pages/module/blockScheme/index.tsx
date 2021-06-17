import React, { useState } from 'react';
import { useEffect } from 'react';
import { Card, Col, Row, Tabs } from 'antd';
import request, { API_HEAD } from '@/utils/request';
import styles from './index.less';
import { getAwesomeIcon } from '@/utils/utils';

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
 * @param cols
 * @returns
 */
const getColSpan = (cols: number | undefined) => {
  if (cols === 2) return halfColSpan;
  if (cols === 4) return { span: 24 };
  return quarterBlockColSpan;
};

/**
 * 在一个格子中再次进行进行分拆时获取宽度
 * @param cols
 * @returns
 */
const getInnerColSpan = (cols: number | undefined) => {
  if (cols === 2) return halfInnerColSpan;
  if (cols === 4) return { span: 24 };
  return quarterInnerBlockColSpan;
};

const BlockDetail = ({ block, inner = false }: { block: any; inner?: boolean }) => {
  console.log(block);
  if (block.xtype && (block.xtype as string).toLowerCase() === 'tabpanel') {
    return (
      <Card>
        <Tabs>
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
              <BlockDetail key={tab.detailid} block={tab} />
            </TabPane>
          ))}
        </Tabs>
      </Card>
    );
  }
  return block.items && block.items.length ? (
    <Row gutter={[12, 12]} className={styles.subcol}>
      {block.items.map((item: any) => (
        <Col
          key={item.detailid}
          {...(inner && block.cols !== 4 ? getInnerColSpan(item.cols) : getColSpan(item.cols))}
          className={item.items ? styles.subcol : ''}
          style={{ height: item.height ? `${item.height}px` : 'auto' }}
        >
          <div className={styles.innercard}>
            {item.items ? (
              <BlockDetail block={item} inner={true}></BlockDetail>
            ) : (
              <span>111{item.title}</span>
            )}
          </div>
        </Col>
      ))}
    </Row>
  ) : (
    <span style={{ height: '100%' }}>{block.title}adfasd</span>
  );
};

export const BlockSchemes: React.FC = () => {
  const [schemes, setSchemes] = useState<any[]>([]);
  useEffect(() => {
    if (blockSchemes.length === 0) {
      request(`${API_HEAD}/platform/homepage/getinfo.do`, {
        method: 'POST',
      }).then((response: any[]) => {
        blockSchemes.push(...response);
        setSchemes(blockSchemes);
      });
    } else {
      setSchemes(blockSchemes);
    }
  }, []);
  if (schemes.length > 0) {
    if (schemes.length > 1) {
      return (
        <Tabs>
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
              <BlockDetail key={block.items[0].detailid} block={block.items[0]} />
            </TabPane>
          ))}
        </Tabs>
      );
    }
    return (
      <div className={styles.innercard}>
        <BlockDetail key={schemes[0].items[0].detailid} block={schemes[0].items[0]} />
      </div>
    );
  }
  return <Card className={styles.innercard} title="未找到可以使用的主页方案"></Card>;
};
