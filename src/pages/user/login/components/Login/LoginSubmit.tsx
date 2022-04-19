/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { Button, Form } from 'antd';
import type { ButtonProps } from 'antd/es/button';
import classNames from 'classnames';
import styles from './index.less';

const FormItem = Form.Item;

interface LoginSubmitProps extends ButtonProps {
  className?: string;
}

const LoginSubmit: React.FC<LoginSubmitProps> = ({ className, ...rest }) => {
  const clsString = classNames(styles.submit, className);
  return (
    <FormItem>
      <Button size="large" className={clsString} type="primary" htmlType="submit" {...rest} />
    </FormItem>
  );
};

export default LoginSubmit;
