/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Component, Fragment } from 'react';
import { WechatOutlined } from '@ant-design/icons';
import { Card, List, message } from 'antd';

class BindingView extends Component {
  getData = () => [
    {
      title: '微信绑定',
      description: '当前未绑定微信帐号',
      actions: [
        <a
          key="Bind"
          onClick={() => {
            message.warn('此功能尚未启用！');
          }}
        >
          绑定
        </a>,
      ],
      avatar: <WechatOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
    },
  ];

  render() {
    return (
      <Card title="帐号绑定" bordered={false}>
        <Fragment>
          <List
            itemLayout="horizontal"
            dataSource={this.getData()}
            renderItem={(item) => (
              <List.Item actions={item.actions}>
                <List.Item.Meta
                  avatar={item.avatar}
                  title={item.title}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </Fragment>
      </Card>
    );
  }
}

export default BindingView;
