/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useState } from 'react';
import { OrderedListOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  InputNumber,
  message,
  Modal,
  Switch,
  Tabs,
  Tooltip,
  Typography,
} from 'antd';
import request, { API_HEAD } from '@/utils/request';
import { apply } from '@/utils/utils';
import { getTreeRecordByKey } from '@/pages/datamining/utils';
import type { ModuleState } from '../data';
import { getModuleInfo } from '../modules';
import { PARENT_RECORD } from '../constants';

interface Params {
  moduleState: ModuleState;
  dispatch: any;
}

export const UpdateRecordOrderNoButton: React.FC<Params> = ({ moduleState, dispatch }) => {
  const { moduleName, dataSource } = moduleState;
  const moduleInfo = getModuleInfo(moduleName);
  const [visible, setVisible] = useState<boolean>(false);
  const [activekey, setActiveKey] = useState<'reset' | 'update'>('reset');
  const [form] = Form.useForm();

  const resetOrderno = () => {
    const ids: string[] = [];
    dataSource.forEach((record) => ids.push(record[moduleInfo.primarykey]));
    request(`${API_HEAD}/platform/dataobject/updateorderno.do`, {
      params: {
        objectid: moduleName,
        ids: ids.join(','),
        addparent: form.getFieldValue('addparent'),
        startnumber: form.getFieldValue('startnumber'),
        stepnumber: form.getFieldValue('stepnumber'),
        // parentnumber: parentnumber
      },
    }).then((result) => {
      if (result.success) {
        let i = 0;
        dataSource.forEach((record) => {
          apply(record, {
            [result.tag]: result.msg[i].text,
          });
          i += 1;
        });
        dispatch({
          type: 'modules/updateDataSource',
          payload: {
            moduleName,
            dataSource: [...dataSource],
            recordOrderChanged: false,
          },
        });
        message.info('重新生成当前页记录的顺序号已完成！');
      } else {
        message.error(result.msg);
      }
    });
  };
  const updateOrderno = () => {
    const ids: string[] = [];
    dataSource.forEach((record) => ids.push(record[moduleInfo.primarykey]));
    request(`${API_HEAD}/platform/dataobject/updatepageorderno.do`, {
      params: {
        objectid: moduleName,
        ids: ids.join(','),
      },
    }).then((result) => {
      if (result.success) {
        let i = 0;
        dataSource.forEach((record) => {
          apply(record, {
            [result.tag]: result.msg[i],
          });
          i += 1;
        });
        dispatch({
          type: 'modules/updateDataSource',
          payload: {
            moduleName,
            dataSource: [...dataSource],
            recordOrderChanged: false,
          },
        });
        message.info('当前页记录的顺序号按照当前页中记录的顺序号重新排序已完成！');
      } else {
        message.error(result.msg);
      }
    });
  };

  // 更新树的某一级的顺序号
  const resetTreeLevelOrderno = () => {
    const ids: string[] = [];
    if (moduleState.selectedRowKeys.length !== 1) {
      message.warn('请选择一个需要更新的级别记录中的任意一条记录！');
      return;
    }
    // 找到选中记录的父节点，将选中记录的所有同级记录按当前顺序重新排列
    const selectRecord = getTreeRecordByKey(
      dataSource,
      moduleState.selectedRowKeys[0],
      moduleInfo.primarykey,
    );
    const items: any[] = selectRecord[PARENT_RECORD]
      ? selectRecord[PARENT_RECORD].children
      : dataSource;
    items.forEach((record) => ids.push(record[moduleInfo.primarykey]));
    request(`${API_HEAD}/platform/dataobject/updateorderno.do`, {
      params: {
        objectid: moduleName,
        ids: ids.join(','),
        addparent: form.getFieldValue('addparent'),
        startnumber: form.getFieldValue('startnumber'),
        stepnumber: form.getFieldValue('stepnumber'),
        parentnumber: selectRecord[PARENT_RECORD]
          ? selectRecord[PARENT_RECORD][moduleInfo.orderfield as string]
          : 0,
      },
    }).then((result) => {
      if (result.success) {
        dispatch({
          type: 'modules/fetchData',
          payload: {
            moduleName,
            forceUpdate: true,
          },
        });
        message.info('选中记录的所有同级记录已按当前顺序重新排列！');
      } else {
        message.error(result.msg);
      }
    });
  };

  return (
    <React.Fragment>
      <Tooltip title="更新顺序号">
        <Button type="link" style={{ padding: 0, margin: 0 }} onClick={() => setVisible(true)}>
          <OrderedListOutlined />
        </Button>
      </Tooltip>
      <Modal
        visible={visible}
        title={
          <>
            <QuestionCircleOutlined /> 确认更新顺序号
          </>
        }
        onCancel={() => setVisible(false)}
        destroyOnClose
        bodyStyle={{ paddingTop: '4px' }}
        onOk={() => {
          if (activekey === 'reset') {
            if (moduleInfo.istreemodel) resetTreeLevelOrderno();
            else resetOrderno();
          } else updateOrderno();
        }}
      >
        <Tabs activeKey={activekey} onTabClick={(key: any) => setActiveKey(key)}>
          <Tabs.TabPane tab="重新生成顺序号" key="reset">
            {moduleInfo.istreemodel ? (
              <Typography>
                <Typography.Paragraph style={{ textAlign: 'center' }}>
                  <Typography.Text strong>
                    将选中记录的所有同级记录按当前顺序重新排列
                  </Typography.Text>
                </Typography.Paragraph>
              </Typography>
            ) : (
              <Typography>
                <Typography.Paragraph style={{ textAlign: 'center' }}>
                  <Typography.Text strong>
                    对当前页的记录，按照下面的设置重新生成顺序号。
                  </Typography.Text>
                </Typography.Paragraph>
                <Typography.Paragraph>
                  注意：只会对当前页的记录进行操作更新，其他页的记录将不会进行更新；
                  <br />
                  如果没能显示所有要更新顺序号的记录，请改变页大小；
                </Typography.Paragraph>
              </Typography>
            )}
            <Typography.Paragraph style={{ textAlign: 'center' }}>
              <Typography.Text type="danger">
                (如果你不确定执行的结果，那么请不要执行此操作!!!)
              </Typography.Text>
            </Typography.Paragraph>
            <Card bodyStyle={{ padding: '12px' }}>
              <Form
                form={form}
                className="moduleform"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
              >
                <Form.Item
                  label="加入父记录顺序值"
                  name="addparent"
                  style={{ marginBottom: '8px' }}
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  label="起始顺序号"
                  name="startnumber"
                  initialValue={10}
                  style={{ marginBottom: '8px' }}
                >
                  <InputNumber />
                </Form.Item>
                <Form.Item
                  label="递进值"
                  name="stepnumber"
                  initialValue={10}
                  style={{ marginBottom: '8px' }}
                >
                  <InputNumber min={1} step={10} />
                </Form.Item>
              </Form>
            </Card>
          </Tabs.TabPane>
          <Tabs.TabPane tab="按原顺序号更新" key="updage" disabled={moduleInfo.istreemodel}>
            <Typography>
              <Typography.Paragraph style={{ textAlign: 'center' }}>
                <Typography.Text strong>
                  对当前页的记录按照记录的顺序号重新排序。(不会产生新的序号)
                </Typography.Text>
              </Typography.Paragraph>
              <Typography.Paragraph>
                注意：只会对当前页的记录进行操作更新，其他页的记录将不会进行更新；
                <br />
                如果没能显示所有要更新顺序号的记录，请改变页大小；
              </Typography.Paragraph>
            </Typography>
            <Typography.Paragraph style={{ textAlign: 'center' }}>
              <Typography.Text type="danger">
                (如果你不确定执行的结果，那么请不要执行此操作!!!)
              </Typography.Text>
            </Typography.Paragraph>
          </Tabs.TabPane>
        </Tabs>
      </Modal>
    </React.Fragment>
  );
};
