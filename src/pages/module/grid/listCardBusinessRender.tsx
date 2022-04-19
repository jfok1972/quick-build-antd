/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Col, Row, Tag } from 'antd';
import type { Dispatch } from 'redux';
import moment from 'moment';
import { getFieldDefine } from '../modules';
import { booleanRenderer, oneToManyFieldRender } from './columnRender';
import type { ModuleModal, ModuleState } from '../data';
import { DateTimeFormat } from '../moduleUtils';

interface ListCardBusinessRenderProps {
  moduleInfo: ModuleModal;
  moduleState: ModuleState;
  dispatch: Dispatch;
  record: any;
  recno: number;
}

const updateFontWeight = (value: any) => {
  return <span style={{ fontWeight: 500 }}>{value}</span>;
};

const fPersonnel: React.FC<ListCardBusinessRenderProps> = ({
  record,
  moduleInfo,
  dispatch,
  moduleState,
}) => {
  const field: any = {
    dataIndex: 'FUsers',
    fieldDefine: getFieldDefine('FUsers', moduleInfo),
  };
  return (
    <Row>
      <Col span={24}>所属部门：{updateFontWeight(record['FOrganization.orgname'])}</Col>
      <Col span={24}>人员编码：{updateFontWeight(record.personnelcode)}</Col>
      <Col span={16}>
        系统用户：
        {oneToManyFieldRender(record.FUsers, record, 0, {
          fieldtitle: '系统用户',
          childModuleName: 'FUser',
          fieldahead: field.fieldDefine.fieldahead,
          moduleInfo,
          dispatch,
          field,
          moduleState,
        })}
      </Col>
      <Col span={8}>有效：{booleanRenderer(record.isvalid)}</Col>
    </Row>
  );
};

/**
 * 我的待办任务listCard的内容
 * @param param0
 * @returns
 */
const ownerRuTask: React.FC<ListCardBusinessRenderProps> = ({ record }) => {
  const receveDays = moment().diff(moment(record.actTaskCreateTime, DateTimeFormat), 'days');
  return (
    <Row>
      <Col span={24}>模块名称：{updateFontWeight(record.objecttitle)}</Col>
      <Col span={24}>任务名称：{updateFontWeight(record.actExecuteTaskName)}</Col>
      <Col span={16}>
        任务接受时间：{updateFontWeight(record.actTaskCreateTime.substring(0, 16))}
      </Col>
      <Col span={8}>
        <Tag style={{ float: 'right' }} color={receveDays >= 2 ? 'warning' : 'processing'}>
          {moment(record.actTaskCreateTime, DateTimeFormat).fromNow()}
        </Tag>
      </Col>
      <Col span={24}>流程启动时间：{updateFontWeight(record.actStartTime.substring(0, 16))}</Col>
    </Row>
  );
};

/**
 * ListCard中自定义的渲染函数
 */
export const ListCardBusinessRender: Record<string, Function> = {
  FPersonnel: fPersonnel,
  VActRuTask: ownerRuTask,
};
