/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { CSSProperties } from 'react';
import { Progress } from 'antd';

/**
 * 显示只读的百分比进度条
 * @param param0
 */
const ProgressField = ({
  value,
  style,
  digitslen,
  symbol,
}: {
  value?: number;
  style?: CSSProperties;
  digitslen: number;
  symbol: boolean;
}) => {
  const val = value || 0;
  return val <= 1 ? (
    <Progress style={style} percent={Math.round(val * 100)} size="default" />
  ) : (
    <span>{`${parseFloat((val * 100).toFixed(digitslen - 2))}${symbol ? '%' : ''}`}</span>
  );
};

export default ProgressField;
