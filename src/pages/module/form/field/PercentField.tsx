/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import type { InputNumberProps } from 'antd';
import { InputNumber } from 'antd';
import { getNumberDigitsFormat } from '@/utils/utils';

const numeral = require('numeral');

const DIGITSLEN = 'digitslen';

export const PercentField: React.FC<InputNumberProps<number>> = ({
  value,
  onChange,
  name,
  ...rest
}) => {
  const digitslen = rest[DIGITSLEN];
  return (
    <InputNumber
      className="percent"
      value={parseFloat(((value || 0) * 100).toFixed(digitslen - 2))}
      onChange={(val) => {
        const v = parseFloat((val / 100).toFixed(digitslen));
        onChange!(v);
      }}
      {...rest}
      formatter={(val) => {
        if (!val || !parseFloat(`${val}`)) return '';
        // 在不是焦点的时候才进行转换
        if (document.activeElement!.id !== name) {
          return numeral(val).format(getNumberDigitsFormat(digitslen - 2));
        }
        return val;
      }}
    />
  );
};
