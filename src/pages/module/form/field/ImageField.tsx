/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { notification, Button, Tooltip } from 'antd';
import { UploadOutlined, ClearOutlined } from '@ant-design/icons';
import styles from './ImageField.less';
import { NOIMAGE_PNG } from '../../constants';

interface ImageFieldProps {
  value?: string; // 图片的BASE64编码值
  onChange?: (value: string) => void; // 选择新的图片后的回调函数
  label?: string; // 字段label
  readOnly?: boolean; // 只读
  imageHeight?: number; // 图像高，默认128
  imageWidth?: number; // 图像宽，默认128
  imageStyle?: Object; // 图像的style
}

/**
 * 图像字段，可以和form中其他字段一样进行显示和提交的控件
 * @param param0
 * value 值已经是受控的了，在onChange中改变后，会自动更新到image中
 */

const ImageField: React.FC<ImageFieldProps> = ({
  value,
  onChange = () => {},
  label,
  readOnly,
  imageHeight = 96,
  imageWidth = 96,
  imageStyle = { borderRadius: '8px' },
}) => {
  const myRef: any = React.createRef();
  const fileChange = () => {
    if (window.FileReader) {
      const file = myRef.current.files[0];
      if (typeof file === 'object') {
        const filename = file.name;
        const allImgExt = '.jpg .jpeg .gif .bmp .png ';
        const fileExt = filename.substr(filename.lastIndexOf('.')).toLowerCase();
        if (allImgExt.indexOf(`${fileExt} `) === -1) {
          notification.error({
            message: '选择图像文件',
            description: `请选择后缀名为 ${allImgExt} 的图像文件！`,
          });
          return;
        }
        const reader = new FileReader();
        reader.onload = (event: any) => {
          onChange(window.btoa(event.target.result));
        };
        reader.readAsBinaryString(file);
      } else; // 取消了选择的文件
    } else
      notification.warn({
        message: '选择图像文件',
        description: `当前浏览器不支持选择图像文件，请更换为chrome,firefox浏览器！`,
      });
  };

  return (
    <div className={styles.avatar}>
      {label ? <div>{label}</div> : null}
      <img
        width={!readOnly || value ? imageWidth : 36}
        height={!readOnly || value ? imageHeight : 36}
        style={imageStyle}
        src={value ? `data:image/jpeg;base64,${value}` : NOIMAGE_PNG}
        alt="图像"
      />
      {!readOnly && (
        <div className={styles.buttongroup}>
          <Tooltip title="选择图像">
            <Button
              type="dashed"
              size="small"
              onClick={() => {
                myRef.current.click();
              }}
            >
              <UploadOutlined />
            </Button>
          </Tooltip>{' '}
          <Tooltip title="清除图像">
            <Button
              type="dashed"
              size="small"
              onClick={() => {
                onChange('');
              }}
            >
              <ClearOutlined />
            </Button>
          </Tooltip>
        </div>
      )}
      <input
        ref={myRef}
        type="file"
        style={{ visibility: 'hidden', width: 0, height: 0 }}
        onChange={fileChange}
      />
    </div>
  );
};

export default ImageField;
