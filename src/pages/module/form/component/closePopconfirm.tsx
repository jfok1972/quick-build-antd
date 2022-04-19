/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useState } from 'react';
import { Popconfirm } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import type { TooltipPlacement } from 'antd/es/tooltip';

interface CreatePopconfirmProps {
  changed: boolean; // 窗口form中记录是否改变，
  title?: string; // 关闭窗口的说明文字
  confirmAction: Function; // 关闭窗口的事件
  children: React.ReactElement;
  placement?: TooltipPlacement;
}

/**
 * 窗口中关闭按钮的确定提示框
 * @param props
 */
const ClosePopconfirm: React.FC<CreatePopconfirmProps> = (props) => {
  const [visible, setVisible] = useState<boolean>(false);
  const { changed, title, confirmAction, children, placement } = props;
  const confirm = () => {
    setVisible(false);
    confirmAction();
  };
  const cancel = () => {
    setVisible(false);
  };
  const handleVisibleChange = (v: boolean) => {
    if (!v) {
      setVisible(v);
      return;
    }
    if (!changed) {
      confirm();
    } else {
      setVisible(true);
    }
  };
  return (
    <Popconfirm
      placement={placement || 'top'}
      title={title || '当前记录已修改尚未保存，确定要放弃修改吗？'}
      okText="放弃修改"
      cancelText="继续编辑"
      visible={visible}
      onVisibleChange={handleVisibleChange}
      onConfirm={confirm}
      onCancel={cancel}
      icon={<QuestionCircleOutlined />}
    >
      {children}
    </Popconfirm>
  );
};

export default ClosePopconfirm;
