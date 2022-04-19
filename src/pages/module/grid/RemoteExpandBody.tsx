/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useState } from 'react';
import request, { API_HEAD } from '@/utils/request';
import { Card } from 'antd';
import type { ModuleModal } from '../data';
import styles from './RemoteExpandBody.less';

const marked = require('marked');

interface ExpandBodyParams {
  moduleInfo: ModuleModal;
  record: any;
}

export const RemoteExpandBody: React.FC<ExpandBodyParams> = ({ moduleInfo, record }) => {
  const { modulename: moduleName, primarykey } = moduleInfo;
  const [data, setData] = useState<string>('loading');
  useEffect(() => {
    request(`${API_HEAD}/platform/dataobject/getexpandbody.do`, {
      params: {
        moduleName,
        recordId: record[primarykey],
      },
    }).then((result) => {
      setData(result.msg || '暂无内容');
    });
  }, []);
  /* eslint-disable */
  // 使用markdown语法来显示
  return (
    <Card className="markdowncard">
      <span
        className={`markdown ${styles._}`}
        dangerouslySetInnerHTML={{ __html: marked.parse(data) }}
      />
    </Card>
  );
  /* eslint-enable */
};
