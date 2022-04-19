/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Card, List, Switch } from 'antd';
import { Component, Fragment } from 'react';

type Unpacked<T> = T extends (infer U)[] ? U : T;

class NotificationView extends Component {
  getData = () => {
    const Action = <Switch checkedChildren="开" unCheckedChildren="关" defaultChecked />;
    return [
      {
        title: '账户密码',
        description: '其他用户的消息将以站内信的形式通知',
        actions: [Action],
      },
      {
        title: '系统消息',
        description: '系统消息将以站内信的形式通知',
        actions: [Action],
      },
      {
        title: '待办任务',
        description: '待办任务将以站内信的形式通知',
        actions: [Action],
      },
    ];
  };

  render() {
    const data = this.getData();
    return (
      <Card title="消息通知" bordered={false}>
        <Fragment>
          <List<Unpacked<typeof data>>
            itemLayout="horizontal"
            dataSource={data}
            renderItem={(item) => (
              <List.Item actions={item.actions}>
                <List.Item.Meta title={item.title} description={item.description} />
              </List.Item>
            )}
          />
        </Fragment>
      </Card>
    );
  }
}

export default NotificationView;
