import React, { useState } from 'react';
import { useEffect } from 'react';
import { Card, Col, Row, Tabs } from 'antd';
import request, { API_HEAD } from '@/utils/request';
import styles from './index.less';

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

const getColSpan = (cols: number | undefined) => {
  if (cols === 2) return halfColSpan;
  if (cols === 4) return { span: 24 };
  return quarterBlockColSpan;
};

const BlockScheme = ({ block }: { block: any }) => {
  console.log(block);
  return (
    <Row gutter={[12, 12]} className={styles.subcol}>
      {block.items
        ? block.items.map((item: any) => (
            <Col
              key={item.detailid}
              {...getColSpan(item.cols)}
              className={item.items ? styles.subcol : ''}
              style={{ height: item.height ? `${item.height}px` : 'auto' }}
            >
              <Card
                title={item.title}
                style={{ height: '100%' }}
                bodyStyle={{ padding: 0, margin: 0, height: '100%' }}
              >
                {item.items ? (
                  <BlockScheme block={item}></BlockScheme>
                ) : (
                  <span>111{item.title}</span>
                )}
              </Card>
            </Col>
          ))
        : null}
    </Row>
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
              tab={block.title}
              tabKey={`block-${index}`}
              key={block.homepageschemeid}
              className={styles.blockcard}
            >
              <BlockScheme key={block.items[0].detailid} block={block.items[0]} />
            </TabPane>
          ))}
        </Tabs>
      );
    }
    return (
      <Card>
        <BlockScheme key={BlockSchemes[0].items[0].detailid} block={BlockSchemes[0].items[0]} />
      </Card>
    );
  }
  return <Card title="未找到可以使用的主页方案"></Card>;
};
