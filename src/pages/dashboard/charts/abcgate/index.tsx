/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Tabs } from 'antd';
import AbcEmployee from './AbcEmployee';
import styles from '../index.less';

export const AbcgateCharts = () => {
  return (
    <Tabs>
      <Tabs.TabPane
        tabKey="AbcEmployee"
        key="AbcEmployee"
        tab="人员当天体温"
        className={styles.dashboardcard}
      >
        <AbcEmployee />
      </Tabs.TabPane>
    </Tabs>
  );
};
