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
    const data = response.map((rec) => {
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
      return record;
    });
    return new Promise((resolve) => {
      console.log(data);
      resolve(data);
    });
  });
};
