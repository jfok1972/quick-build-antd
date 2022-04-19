/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Table, Typography } from 'antd';
import type { ModuleFieldType, ModuleState } from '../data';
import {
  floatRender,
  integerRender,
  monetaryRender,
  percentRenderWithTooltip,
} from './columnRender';
import styles from './columnFactory.less';

const { Text } = Typography;

export const tableSummary = (pageData: any[], moduleState: ModuleState, subTotalFields: any[]) => {
  const getTotal = (fieldname: string) => {
    let sum: number = 0;
    pageData.forEach((rec: any) => {
      sum += rec[fieldname] || 0;
    });
    return sum;
  };

  const getFieldTotal = (field: any) => {
    // 如果要显示onetomany加权平均，要建立附加字段
    if (field.dataIndex.startsWith('wavg')) return null;
    const fieldDefine = field.fieldDefine as ModuleFieldType;
    const sum: number = getTotal(field.dataIndex);
    if (fieldDefine.ismonetary)
      return monetaryRender(sum, {}, 0, moduleState, fieldDefine.digitslen);
    if (fieldDefine.divisor && fieldDefine.denominator) {
      const divisor = getTotal(fieldDefine.divisor);
      const denominator = getTotal(fieldDefine.denominator);
      return percentRenderWithTooltip(
        denominator !== 0 ? divisor / denominator : 0,
        divisor,
        denominator,
      );
    }
    if (field.isOneToMany) {
      if (field.dataIndex.startsWith('count'))
        return (
          <span style={{ marginRight: '17px' }}>
            {integerRender(sum)}
            <span className={styles.onetomanyfield}> 条</span>
          </span>
        );
      return floatRender(sum, 2);
    }
    return field.render(sum);
  };
  const getRemoteFieldTotal = (field: any) => {
    // 如果要显示onetomany加权平均，要建立附加字段
    if (field.dataIndex.startsWith('wavg')) return null;
    const fieldDefine = field.fieldDefine as ModuleFieldType;
    const { remoteRoot } = moduleState;
    const value = remoteRoot[field.dataIndex];
    if (fieldDefine.ismonetary)
      return monetaryRender(value, {}, 0, moduleState, fieldDefine.digitslen);
    if (fieldDefine.divisor && fieldDefine.denominator) {
      const divisor = remoteRoot[fieldDefine.divisor];
      const denominator = remoteRoot[fieldDefine.denominator];
      return percentRenderWithTooltip(
        denominator !== 0 ? divisor / denominator : 0,
        divisor,
        denominator,
      );
    }
    if (field.isOneToMany) {
      if (field.dataIndex.startsWith('count'))
        return (
          <span style={{ marginRight: '17px' }}>
            {integerRender(value)}
            <span className={styles.onetomanyfield}> 条</span>
          </span>
        );
      return floatRender(value, 2);
    }
    return field.render(value);
  };

  return pageData.length === 0 ? null : (
    <>
      <Table.Summary.Row key={`${moduleState.moduleName}_summary`}>
        {subTotalFields.map((field: any, index: number) => {
          let value: any = null;
          let colSpan = 1;
          if (field) {
            if (field.namefield) {
              colSpan = field.colSpan || 1;
              value = (
                <span className={styles.totalfield}>
                  <Text strong>
                    {moduleState.gridParams.total > pageData.length ? '本页小计' : '小计'}
                  </Text>
                  <Text type="secondary">{` (${pageData.length}条)`}</Text>
                </span>
              );
            } else
              value = (
                <Text
                  strong
                  style={{
                    float: field.fieldDefine.divisor ? 'left' : 'right', // 百分比靠左对齐，数值靠右
                  }}
                >
                  {getFieldTotal(field)}
                </Text>
              );
          }
          return (
            <Table.Summary.Cell
              className={styles.summarycell}
              key={`${moduleState.moduleName}_summary${index.toString()}`}
              index={index}
              colSpan={colSpan}
            >
              {value}
            </Table.Summary.Cell>
          );
        })}
      </Table.Summary.Row>
      {moduleState.remoteRoot &&
      Object.getOwnPropertyNames(moduleState.remoteRoot).length &&
      moduleState.gridParams.total > pageData.length ? (
        <Table.Summary.Row key={`${moduleState.moduleName}_total`}>
          {subTotalFields.map((field: any, index: number) => {
            let value: any = null;
            let colSpan = 1;
            if (field) {
              if (field.namefield) {
                colSpan = field.colSpan || 1;
                value = (
                  <span className={styles.totalfield}>
                    <Text strong>总&nbsp;&nbsp;&nbsp;&nbsp;计</Text>
                    <Text type="secondary">{` (${moduleState.gridParams.total}条)`}</Text>
                  </span>
                );
              } else
                value = (
                  <Text
                    strong
                    style={{
                      float: field.fieldDefine.divisor ? 'left' : 'right', // 百分比靠左对齐，数值靠右
                    }}
                  >
                    {getRemoteFieldTotal(field)}
                  </Text>
                );
            }
            return (
              <Table.Summary.Cell
                className={styles.totalcell}
                key={`${moduleState.moduleName}_total${index.toString()}`}
                index={index}
                colSpan={colSpan}
              >
                {value}
              </Table.Summary.Cell>
            );
          })}
        </Table.Summary.Row>
      ) : null}
    </>
  );
};
