/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Cascader } from 'antd';

interface TreeCascaderProps {
  value: any;
  onChange: (value: any) => void;
  options: any;
  children: any;
  [propName: string]: any;
}

/**
 * 根据value的值，找到options中的位置，并加入上级值
 * @param options
 * @param value
 * 例如 value 为 '110112',返回 ['11','1101','110112'];
 */
const getArrayValue = (options: any[], value?: string): any => {
  if (value) {
    const result: string[] = [];
    let find: boolean = false;
    const loop = (data: any[], deep: number) => {
      for (let i = 0; i < data.length; i += 1) {
        if (!find) {
          // 只保存当前级别的值，后面的全删掉
          result.splice(deep, result.length, data[i].value);
          if (data[i].value === value) {
            find = true;
            return;
          }
          if (data[i].children) {
            if (!find) loop(data[i].children, deep + 1);
            else return;
          }
        } else return;
      }
    };
    loop(options, 0);
    return find ? result : [];
  } else return [];
};

const TreeCascader: React.FC<TreeCascaderProps> = ({ value, onChange, options, ...fieldProps }) => {
  return (
    <Cascader
      {...fieldProps}
      // 如果 value 不为空，则根据options中的内容转换为 ['00','0001']样式
      value={getArrayValue(options, value)}
      allowClear
      showSearch
      options={options}
      onChange={(val: any) => {
        // 只返回选中结果的最后一个
        if (val && val.length) onChange(val[val.length - 1]);
        else onChange(undefined);
      }}
      fieldNames={{
        label: 'text',
        value: 'value',
        children: 'children',
      }}
      getPopupContainer={(triggerNode) => triggerNode.parentNode}
    />
  );
};

export default TreeCascader;
