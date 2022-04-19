import { Button, Result } from 'antd';
import React from 'react';
import { history } from 'umi';

const NoFoundPage: React.FC<{}> = () => (
  <Result
    status="404"
    title="404"
    subTitle="非常抱欠的通知您, 您要访问的网页真的就这么不见了。"
    extra={
      <Button type="primary" onClick={() => history.push('/')}>
        返回主页
      </Button>
    }
  />
);

export default NoFoundPage;
