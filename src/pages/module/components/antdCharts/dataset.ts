/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import request, { API_HEAD } from '@/utils/request';
import { apply, MD5, stringifyObjectField } from '@/utils/utils';
import { serialize } from 'object-to-formdata';
import type { MonetaryUnit } from '../../grid/monetary';

/**
 * 每一个聚合字段的设置
 */
interface AggregateFieldProps {
  fieldname: string; // 聚合字段的设置'count.*','sum.amount'
  title: string; // 指标的描述
  monetaryUnit?: MonetaryUnit; // 指标的数值单位
  formatPattern?: string; // 数值format样式, 默认 0,000 , 0.000.00
  unitText?: string; // 数值单位，个，米，万元。
}

export interface DataSetProps {
  moduleName: string; // 模块名称
  fields: AggregateFieldProps[]; // 聚合字段 ['count.*','sum.amount']
  groupfieldid?: string | Record<string, any>; // 第一个指标的定义
  categoryName?: string; // 第一个指标的名称，默认为text，可以用中文作为字段名称
  groupfieldid2?: string; // 第二个指标的字段定义
  categoryName2?: string; // 第二个指标的名称，可以用中文作为字段名称
  menuText?: string; // 如果有多个可以选择的dataSet,设置group中显示的文字
  filters?: any[]; // 查询的条件
  maxCount?: number; // 最大的记录个数
  restHead?: boolean; // 如果设置为true,则把头部的合并或删除，如果未设置，则将尾部的合并或删除
  otherTitle?: string; // 剩余的所有的描述,如果没有设置otherTitle,则后面的全部删除
  orderby?: 'text' | 'code' | any; // 按什么排序,对于有序的如数据字典，可以按code排序 , 或者第一个数值 jf001
  orderDesc?: boolean; // 排序顺序
  callback?: Function; // 数据获取后的回调函数
}

interface DataminingFetchProps {
  moduleName: string;
  fields?: any[];
  userfilters?: any[];
  navigatefilters?: any[];
  groupfieldid?: string | Object;
  groupfieldid2?: string;
  isnumberordername?: boolean;
}

/**
 * 存放datamining数据缓存的map,只限于分析页上面的实体对象组件和图表的数据分析查询
 */
const dataminingDataMap: Map<string, string> = new Map();

export const fetchDataminingDataWithCache = (params: DataminingFetchProps) => {
  const strobj = stringifyObjectField(params);
  const strmd5 = MD5(
    Object.keys(strobj)
      .sort((s1, s2) => (s1 > s2 ? 1 : -1))
      .map((key) => `${key}:${strobj[key]}`)
      .join(','),
  );
  if (!dataminingDataMap.has(strmd5)) {
    dataminingDataMap.set(strmd5, 'loading');
    return request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(strobj),
    }).then((response: any[]) => {
      if (dataminingDataMap.get(strmd5) === 'loading') {
        dataminingDataMap.set(strmd5, JSON.stringify(response));
      }
      return new Promise((resolve) => {
        resolve(JSON.parse(dataminingDataMap.get(strmd5) as string));
      });
    });
  }
  if (dataminingDataMap.get(strmd5) === 'loading') {
    // 如果数据正在读取，则等待读取结果后再返回
    return new Promise((resolve) => {
      // 每100毫秒检查一下数据是否已经获取成功
      setTimeout(() => resolve(fetchDataminingDataWithCache(params)), 100);
    });
  }
  return new Promise((resolve) => {
    resolve(JSON.parse(dataminingDataMap.get(strmd5) as string));
  });
};

/**
 * 根据设置获取数据然后加工成 chart 需要的格式
 *
 * @param dataSet
 */
export const getDataSet = (dataSet: DataSetProps, userfilters?: any[]) => {
  const {
    moduleName,
    fields,
    filters,
    groupfieldid,
    categoryName = 'text',
    groupfieldid2,
    categoryName2 = 'text2',
    orderby,
    orderDesc,
    maxCount,
    restHead,
    otherTitle,
    callback,
  } = dataSet;
  return fetchDataminingDataWithCache({
    moduleName,
    fields: fields.map((field) => field.fieldname),
    navigatefilters: filters,
    userfilters,
    groupfieldid,
    groupfieldid2,
    isnumberordername: true,
  }).then((response: any) => {
    if (callback) callback(response);
    const data: any[] = response.map((rec: any) => {
      const record: any = {
        code: rec.value,
        rowid: rec.rowid,
        [categoryName]: rec.text,
      };
      if (groupfieldid2) {
        // 如果设置了二个分组字段，那么第二级的所有都在 children 中
        const array = rec.children.map((crec: any) => {
          const crecord: any = {
            ...record,
            code2: crec.value, // 加入第二个指标的code值
            rowid: crec.rowid, // rowid 覆盖掉
            [categoryName2]: crec.text,
          };
          fields.forEach((field, index) => {
            const f = `jf${`${index + 1}`.padStart(3, '0')}`;
            apply(crecord, {
              [field.title]: crec[f],
            });
          });
          return crecord;
        });
        return array;
      }
      // 聚合字段从jf001开始，如果是有条件的，则是jf001jxy001
      fields.forEach((field, index) => {
        const f = `jf${`${index + 1}`.padStart(3, '0')}`;
        apply(record, {
          [field.title]: rec[f],
        });
      });
      /**
       * 生成的记录
       * {
       *    code : '01',
       *    rowid : 'rowid',
       *    category : '指标',      // 如果有第二个指标
       *    secondCategory:'副指标' //
       *    value : jf001
       * }
       */
      return record;
    });
    if (groupfieldid2) {
      const array: any[] = [];
      data.forEach((aArray) => array.push(...aArray));
      data.splice(0, data.length, ...array);
    }
    // 如果设置了排序字段，则根据设置的字段进行排序，orderby要设置成列名，可能是中文的
    if (orderby) {
      data.sort((rec1, rec2) => {
        if (rec1[orderby] > rec2[orderby]) return orderDesc ? -1 : 1;
        if (rec1[orderby] < rec2[orderby]) return orderDesc ? 1 : -1;
        return 0;
      });
    }
    if (maxCount) {
      if (data.length > maxCount) {
        if (otherTitle) {
          // 需要把剩下的全部汇总到一条
          let restCount = 0;
          const other: any = {
            [categoryName]: otherTitle,
          };
          fields.forEach((field) => {
            apply(other, {
              [field.title]: 0,
            });
          });
          // 如果是合并或删除头上的，先反转
          if (restHead) data.reverse();
          data
            .filter((rec, order) => order >= maxCount - 1)
            .forEach((rec) => {
              fields.forEach((field) => {
                other[field.title] += rec[field.title];
              });
              restCount += 1;
            });
          other[categoryName] += `(${restCount}个)`;
          data.splice(maxCount - 1, data.length - maxCount + 1, other);
          // 如果是合并或删除头上的，再反转过来
          if (restHead) data.reverse();
        } else if (restHead)
          // 把前面的全部删除
          data.splice(0, data.length - maxCount);
        // 如果没有设置otherTitle,则把后面的全部删除
        else data.splice(maxCount, data.length - maxCount);
      }
    }
    return new Promise((resolve) => {
      resolve(data);
    });
  });
};
