import React from 'react';
import { Badge, Popover, Tooltip } from 'antd';
import type { Dispatch } from 'redux';
import type { PresetStatusColorType } from 'antd/lib/_util/colors';
import { CheckOutlined, ClockCircleOutlined } from '@ant-design/icons';
import styles from './columnFactory.less';
import type { ModuleFieldType, ModuleState } from '../data';
import { getModuleInfo } from '../modules';
import { paymentCreatePaymentDetailButton } from '../additionalAction/businessAction';
import { PopoverDescriptionWithId } from '../descriptions';

interface BusinessRenderProps {
  value: any;
  record: any;
  recno: number;
  dataIndex: string;
  fieldDefine: ModuleFieldType; // fDataobjectfield的值
  dispatch: Dispatch;
  moduleState: ModuleState;
}

// 工程项目的状态，在建中，已竣工，已停建
const pmGlobalState: React.FC<BusinessRenderProps> = ({ record, dataIndex }) => {
  const value = record[`${dataIndex}_dictname`];
  /* eslint-disable */
  const status: PresetStatusColorType =
    value === '在建中'
      ? 'processing'
      : value === '已竣工'
      ? 'success'
      : value === '已停建'
      ? 'warning'
      : 'default';
  /* eslint-enable */
  return (
    <span className={styles.directionaryfield}>
      <Badge status={status} text={value} />
    </span>
  );
};

// 工程合同的状态
// 10	未审核
// 20	已审核
// 30	执行中
// 40	已过半
// 50	已竣工
// 60	已验收
// 70	已审计
// 90	已完成
// 99	已存档
const pmAgreementState: React.FC<BusinessRenderProps> = ({ value, record, fieldDefine }) => {
  const code = record[fieldDefine.manyToOneInfo.keyField];
  /* eslint-disable */
  const status: PresetStatusColorType =
    code === '10'
      ? 'warning'
      : code === '90'
      ? 'success'
      : code === '99'
      ? 'default'
      : 'processing';
  /* eslint-enable */
  return (
    <span className={styles.directionaryfield}>
      <Badge status={status} text={value} />
    </span>
  );
};

// 合同请款单状态 在 grid 中的 render 方法
// 10 正在审核，20 可以支付， 30 支付完成
const pmPaymentPayoutStatus: React.FC<BusinessRenderProps> = ({
  value,
  dataIndex,
  record,
  dispatch,
  moduleState,
}) => {
  const moduleInfo = getModuleInfo('PmPayment');
  const { additionFunctions } = moduleInfo;
  const funcDefine = additionFunctions.find((fun) => fun.fcode === 'paymentCreatePaymentDetail');
  if (value === '20' && funcDefine) {
    return paymentCreatePaymentDetailButton({
      moduleInfo,
      moduleState,
      record,
      funcDefine: {
        ...funcDefine,
        iconcls: null,
        buttonType: 'link',
      },
      dispatch,
    });
  }
  /* eslint-disable */
  return (
    <Popover content={record[`${dataIndex}_dictname`]}>
      {value === '10' ? (
        <ClockCircleOutlined />
      ) : value === '20' ? (
        <a>
          <span className="approveaction x-fa fa-jpy fa-fw" />
        </a>
      ) : (
        <CheckOutlined />
      )}
    </Popover>
  );
  /* eslint-enable */
};

export const abcEmployeeTodayState: React.FC<BusinessRenderProps> = ({ value }) => {
  /* eslint-disable */
  const status: PresetStatusColorType =
    value === '体温正常'
      ? 'success'
      : value === '体温过高异常' || value === '体温过低异常'
      ? 'error'
      : 'default';
  /* eslint-enable */
  return value ? (
    <span>
      <Badge status={status} text={value} />
    </span>
  ) : null;
};

/**
 * 人脸状态0识别，1未识别，2未上传
 * @param param0
 * @returns
 */
export const abcEmployeefaceState: React.FC<BusinessRenderProps> = ({ value, record }) => {
  /* eslint-disable */
  const status: PresetStatusColorType =
    value === '0' ? 'success' : value === '1' ? 'error' : 'default';
  /* eslint-enable */
  return (
    <span>
      <Badge status={status} text={record.faceState_dictname} />
    </span>
  );
};

// 我的待办事项的namefield，点击显示该记录的信息
const VActRuTaskTitle: React.FC<BusinessRenderProps> = ({ value, record, dispatch }) => {
  return (
    <PopoverDescriptionWithId
      id={record.actBusinessKey}
      moduleInfo={getModuleInfo(record.objectname)}
      dispatch={dispatch}
    >
      <a>
        <span className={styles.namefield}>
          {typeof value === 'string' && value.length > 30 ? (
            <Tooltip title={value}>{`${value.substr(0, 28)}...`}</Tooltip>
          ) : (
            value
          )}
        </span>
      </a>
    </PopoverDescriptionWithId>
  );
};

const BusinessColumnRender: Record<string, Function> = {
  // system
  'VActRuTask--actBusinessName': VActRuTaskTitle,
  'VActFinishTask--actBusinessName': VActRuTaskTitle,
  'VActAllRuTask--actBusinessName': VActRuTaskTitle,
  'VActAllFinishTask--actBusinessName': VActRuTaskTitle,

  // pm
  'PmGlobal--state': pmGlobalState,
  'PmAgreement--pmAgreementState.name': pmAgreementState,
  'PmPayment--payoutStatus': pmPaymentPayoutStatus,

  // abcgate
  'AbcEmployee--todayState': abcEmployeeTodayState,
  'AbcEmployee--faceState': abcEmployeefaceState,
  'AbcInoutEmployeeRecord--state': abcEmployeeTodayState,
};

export const getBusinessColumnRender = (moduleName: string, dataIndex: string) => {
  return BusinessColumnRender[`${moduleName}--${dataIndex}`];
};
