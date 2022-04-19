/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { useEffect, useState } from 'react';
import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/zh-cn';
import themes from 'react-json-editor-ajrm/es/themes';

interface JsonFieldProps {
  value?: string; // json的字符串值
  onChange?: (value: string) => void; // 修改过后的字符串值
  jsonFieldProps?: object;
  readOnly?: boolean; // 只读
}

export const JsonField: React.FC<JsonFieldProps> = ({
  value,
  readOnly,
  jsonFieldProps = {},
  onChange = () => {},
}) => {
  const [editValue, setEditValue] = useState<any>({});
  useEffect(() => {
    if (value) {
      let s = `{${value}}`;
      if (value.startsWith('{')) {
        s = `${value}`;
      }
      try {
        // eslint-disable-next-line
        setEditValue(eval(`(${s})`));
      } catch (e) {
        // alert(`JSON解析错误：${s}`);
      }
    }
  }, [value]);
  debugger;
  return (
    <JSONInput
      placeholder={editValue}
      colors={themes.light_mitsuketa_tribute}
      locale={locale}
      height={'380px'}
      width="100%"
      viewOnly={readOnly}
      style={{ body: { border: '1px solid #d9d9d9' } }}
      onChange={(valueObject: any) => {
        // 不正确的json不能保存
        if (!valueObject.error) onChange(valueObject.plainText);
      }}
      {...jsonFieldProps}
    />
  );
};
