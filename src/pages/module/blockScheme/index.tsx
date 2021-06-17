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
    <Row gutter={[12, 12]}>
      {block.items[0].items
        ? block.items[0].items.map((item: any) => (
            <Col key={item.detailid} {...getColSpan(item.cols)} style={{ height: '100px' }}>
              <Card style={{ height: '100%' }}>{item.title}</Card>
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
              <BlockScheme key={block.detailid} block={block} />
            </TabPane>
          ))}
        </Tabs>
      );
    }
    return (
      <Card>
        <BlockScheme key={BlockSchemes[0]} block={BlockSchemes[0]} />
      </Card>
    );
  }
  return <Card title="未找到可以使用的主页方案"></Card>;
};
