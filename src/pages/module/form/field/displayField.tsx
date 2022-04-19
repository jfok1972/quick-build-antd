/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { isMoment } from 'moment';
import { getBooleanText } from '../../descriptions';

/**
 * 对于只读的字符串字段和日期字段，只显示在form中
 * @param param0
 */
const DisplayField = ({
  value,
  dateFormat,
  checked,
}: {
  value?: any;
  dateFormat?: string;
  checked?: number;
}) => {
  let display: any = '';
  if (checked !== undefined) {
    display = getBooleanText(!!checked);
  } else {
    display = isMoment(value) ? value.format(dateFormat) : value;
  }
  return <div>{display}</div>;
  // <div className="ant-form-item-control-input">
  //     <div className="ant-form-item-control-input-content">
  //         <div className="ant-input">
  //             {display}&nbsp;
  //         </div>
  //     </div>
  // </div>
};

export default DisplayField;
