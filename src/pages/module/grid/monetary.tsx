import { getLocalMonetaryPosition, getLocalMonetaryType } from '@/utils/utils';
import React from 'react';

import type { TextValue } from '../data';

export type MonetaryUnit = 100000000 | 1000000 | 10000 | 1000 | 1;

export const getMonetaryUnitText = (unit: number | undefined, unitText = '') => {
  let text = '';
  if (unit === 100000000) text = '亿';
  else if (unit === 1000000) text = '百万';
  else if (unit === 10000) text = '万';
  else if (unit === 1000) text = '千';
  return text + unitText;
};

export interface MonetaryType {
  type: string;
  monetaryColoredText: any;
  monetaryText: string;
  monetaryUnit: number;
  unittext: string;
}

const createAMonetary = (
  type: string,
  monetaryText: string,
  monetaryUnit: number,
  unittext: string,
): MonetaryType => {
  return {
    type,
    monetaryColoredText: monetaryText ? (
      <span style={{ color: 'green' }}>{monetaryText}</span>
    ) : null,
    monetaryText, // 跟在数值后面的金额单位文字,如
    // 100.00万
    monetaryUnit, // 显示的数值需要除的分子
    unittext,
    // 跟在字段后面的单位如 合同金额(万元)
  };
};

const monetarys = [
  {
    type: 'unit',
    monerary: createAMonetary('unit', '', 1, '个'),
  },
  {
    type: 'thousand',
    monerary: createAMonetary('thousand', '千', 1000, '千'),
  },
  {
    type: 'tenthousand',
    monerary: createAMonetary('tenthousand', '万', 10000, '万'),
  },
  {
    type: 'million',
    monerary: createAMonetary('million', 'M', 100 * 10000, '百万'),
  },
  {
    type: 'hundredmillion',
    monerary: createAMonetary('hundredmillion', '亿', 10000 * 10000, '亿'),
  },
];

export const getMonetarysValueText = (): TextValue[] => {
  return monetarys.map((monerary): TextValue => {
    return {
      text: monerary.monerary.unittext,
      value: monerary.type,
    };
  });
};

export const getMonetary = (key: string): MonetaryType => {
  const result = monetarys.find((monetary) => monetary.type === key);
  return result ? result.monerary : monetarys[2].monerary;
};

export const getMonetaryUnit = (key: string): number => {
  const monetary = monetarys.find((m) => m.type === key)?.monerary;
  return monetary ? monetary.monetaryUnit : 1;
};

// 每一个模块的数值单位的当前选中值
const moduleMonetaryTypes = {};
export const getDefaultMonetaryType = (moduleName: string) => {
  return moduleMonetaryTypes[moduleName] || getLocalMonetaryType();
};
export const setDefaultMonetaryType = (moduleName: string, type: MonetaryType) => {
  moduleMonetaryTypes[moduleName] = type.type;
};

// 每一个模块的数值单位的放置位置 'behindnumber' | 'columntitle'
const moduleMonetaryPositions = {};
export const getDefaultMonetaryPosition = (moduleName: string) => {
  return moduleMonetaryPositions[moduleName] || getLocalMonetaryPosition();
};

export const setDefaultMonetaryPosition = (moduleName: string, position: string) => {
  moduleMonetaryPositions[moduleName] = position;
};
