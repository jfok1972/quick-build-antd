/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Tag } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { API_HEAD } from '@/utils/request';

export const RECNOUNDERLINE = '__recno__';
export const DATA = 'data';
export const NAME = 'name';

export const PARENT_RECORD = '_parent_record_';

export const NOIMAGE_PNG = `${API_HEAD}/resources/images/system/noimage.png`;

export const AuditWaititng = (
  <Tag icon={<ExclamationCircleOutlined />} color="warning">
    未审核
  </Tag>
);

export const AuditFinished = (
  <Tag icon={<CheckCircleOutlined />} color="success">
    已审核
  </Tag>
);
