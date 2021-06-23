import request, { API_HEAD } from '@/utils/request';
import { apply, stringifyObjectField } from '@/utils/utils';
import { serialize } from 'object-to-formdata';
import type { DataSetProps } from '.';

/**
 * 根据设置获取数据然后加工成 chart 需要的格式
 *
 * @param dataSet
 */
export const getDataSet = (dataSet: DataSetProps) => {
  const {
    moduleName,
    fields,
    filters,
    groupfieldid,
    categoryName = 'text',
    groupfieldid2,
    orderby,
    orderDesc,
    maxCount,
    otherTitle,
  } = dataSet;
  return request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
    method: 'POST',
    data: serialize(
      stringifyObjectField({
        moduleName,
        fields: fields.map((field) => field.fieldname),
        navigatefilters: filters,
        groupfieldid,
        groupfieldid2,
        isnumberordername: true,
      }),
    ),
  }).then((response: any[]) => {
    const data: any[] = response.map((rec) => {
      const record: any = {
        code: rec.value,
        rowid: rec.rowid,
        [categoryName]: rec.text,
      };
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
        } else {
          // 如果没有设置otherTitle,则把后面的全部删除
          data.splice(maxCount, data.length - maxCount);
        }
      }
    }
    return new Promise((resolve) => {
      console.log(data);
      resolve(data);
    });
  });
};
