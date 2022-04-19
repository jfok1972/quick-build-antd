/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { querySyncDicrionaryDefine, querySyncDictionaryData, querySyncPropertys } from './service';

export interface TextValue {
  text: string | undefined;
  value: string | undefined;
}

export interface DictionaryDefine {
  columnsingle: boolean;
  dcode: string;
  dictionaryid: string;
  disablecolumnlist: boolean;
  disabled: boolean;
  inputmethod: string;
  isdisplaycode: boolean;
  isdisplayorderno: boolean;
  islinkedcode: boolean;
  islinkedkey: boolean;
  islinkedorderno: boolean;
  islinkedtext: boolean;
  title: string;
  data: TextValue[];
}

const dictionarys: Record<string, DictionaryDefine> = {};

// 字段属性值的缓存,缓存10分钟
const propertys: Record<string, TextValue[]> = {};

export const getPropertys = (
  propertyId: string | undefined,
  targetFieldId: string,
): TextValue[] => {
  const id = propertyId + targetFieldId;
  if (!propertys[id]) {
    propertys[id] = querySyncPropertys({ propertyId, targetFieldId });
    setTimeout(() => {
      delete propertys[id];
    }, 1000 * 60 * 10);
  }
  return propertys[id];
};

export const getDictionary = (dictionaryid: string): DictionaryDefine => {
  if (!dictionarys[dictionaryid]) {
    dictionarys[dictionaryid] = querySyncDicrionaryDefine({ id: dictionaryid });
    dictionarys[dictionaryid].data = querySyncDictionaryData({
      dictionaryId: dictionaryid,
    }) as TextValue[];
  }
  return dictionarys[dictionaryid];
};

export const getDictionaryData = (dictionaryid: string): TextValue[] => {
  if (!dictionarys[dictionaryid]) {
    dictionarys[dictionaryid] = querySyncDicrionaryDefine({ id: dictionaryid });
    dictionarys[dictionaryid].data = querySyncDictionaryData({
      dictionaryId: dictionaryid,
    }) as TextValue[];
  }
  return dictionarys[dictionaryid].data;
};

// 将某个数字典的数组值，转换为文字描述,如果有separator,转换成字符串，否则转换成 数组
export const convertDictionaryValueToText = (
  dictionaryid: string,
  arrays: any[],
  separator: string | undefined,
): any => {
  let values = arrays;
  if (!Array.isArray(values)) values = [values];
  const data = getDictionaryData(dictionaryid);
  const arrayResult: any[] = values.map((value: any) => {
    /* eslint-disable */
    for (const i in data) {
      if (data[i].value === value) return data[i].text;
    }
    /* eslint-enable */
    return value === 'null' ? '未定义' : value;
  });
  if (separator) return arrayResult.join(separator);
  return arrayResult;
};
