/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
// import { Card, Tabs } from 'antd';
// import { Datamining } from '@/pages/datamining';
import { BlockSchemes } from '@/pages/module/blockScheme';

interface DataminingListProps {
  moduleName: string;
  title: string;
}

// 所有可以进行数据分析的模块，在生成菜单时加进来
export const dataminingList: DataminingListProps[] = [];

export default (): React.ReactNode => (
  <div style={{ margin: '-24px' }}>
    <BlockSchemes type="02" />
    {/* <UserOperator /> */}
  </div>
);

// export default (): React.ReactNode => (
//   // 所有模块的数据分析都在一个tabs页面中展示
//   <Card
//     bordered={false}
//     bodyStyle={{ padding: '0px 0px 16px 0px', margin: '0px 16px 16px' }}
//     style={{ margin: '-8px' }}
//   >
//     <Tabs className="dataminingtabs">
//       {dataminingList.map((datamining) => (
//         <Tabs.TabPane
//           tabKey={datamining.moduleName}
//           tab={datamining.title}
//           key={datamining.moduleName}
//         >
//           <Datamining moduleName={datamining.moduleName} inTab />
//         </Tabs.TabPane>
//       ))}
//     </Tabs>
//   </Card>
// );
