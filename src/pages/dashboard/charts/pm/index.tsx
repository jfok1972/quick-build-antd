/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Tabs } from 'antd';
import styles from '../index.less';
import PmAgreement from './PmAgreement';
import PmAgreementPlan from './PmAgreementPlan';
import PmAgreementPayout from './PmAgreementPayout';
import PmAgreementApprove from './PmAgreementApprove';

export const PmCharts = () => {
  return (
    <Tabs>
      <Tabs.TabPane
        tabKey="PmAgreement"
        key="PmAgreement"
        tab="项目合同分析"
        className={styles.dashboardcard}
      >
        <PmAgreement />
      </Tabs.TabPane>
      <Tabs.TabPane
        tabKey="PmAgreementPlan"
        key="PmAgreementPlan"
        tab="合同付款计划分析"
        className={styles.dashboardcard}
      >
        <PmAgreementPlan />
      </Tabs.TabPane>
      <Tabs.TabPane
        tabKey="PmAgreementPayout"
        key="PmAgreementPayout"
        tab="合同付款分析"
        className={styles.dashboardcard}
      >
        <PmAgreementPayout />
      </Tabs.TabPane>
      <Tabs.TabPane
        tabKey="PmAgreementApprove"
        key="PmAgreementApprove"
        tab="文件审批表分析"
        className={styles.dashboardcard}
      >
        <PmAgreementApprove />
      </Tabs.TabPane>
    </Tabs>
  );
};
