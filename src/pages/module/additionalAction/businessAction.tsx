/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useContext } from 'react';
import { Button, message, Modal } from 'antd';
import request, { API_HEAD } from '@/utils/request';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { getMenuAwesomeIcon, showResultInfo } from '@/utils/utils';
import type { ModuleModal, ModuleState, ParentFormModal, ParentFilterModal } from '../data';
import { getModuleInfo } from '../modules';
import { DetailModelProvider } from '../detailGrid/provider';
import ModuleForm from '../form';
import { DetailModelContext } from '../detailGrid/model';
import type { ActionParamsModal } from './systemAction';
import { NAME } from '../constants';
import { deviceCheckOnline, dispatchEmployeePhoto } from './abcGate/Actions';

const AGREEMENTID = 'agreementId';
const PLANID = 'planId';
const AUDITINGDATE = 'auditingDate';
const PAYMENTID = 'paymentId';

// 在改变了合同的子模块后,更新合同form中的值
const refreshParentAgreementForm = (parentForm?: ParentFormModal) => {
  if (parentForm) {
    parentForm.dispatch({
      type: 'modules/refreshRecord',
      payload: {
        moduleName: 'PmAgreement',
        recordId: parentForm.currRecord[AGREEMENTID],
      },
    });
  }
};

export const agreementPlanAutoCreate = (params: ActionParamsModal) => {
  const { moduleState, dispatch } = params;
  const {
    moduleName,
    filters: { parentfilter },
    parentForm,
  } = moduleState as ModuleState;
  if (!parentfilter || parentfilter?.fieldahead !== 'pmAgreement') {
    message.warn('需要选择一个合同，或者合同付款计划模块在合同之下！');
    return;
  }
  // fieldName: "agreementId"
  // fieldahead: "pmAgreement"
  // fieldtitle: "项目合同"
  // fieldvalue: "ff808081751aea7e01751aec3bde0001"
  // moduleName: "PmAgreement"
  // operator: "="
  // text: "asfasfadfdfdss这是国际电子商务平台土建施工平台的的施工合同"
  const text = `『${parentfilter.text}』`;
  request(`${API_HEAD}/pm/plan/autoplan.do`, {
    params: {
      agreementId: parentfilter.fieldvalue,
    },
  }).then((response) => {
    if (response.success) {
      message.success(`合同${text}的付款计划已制作完成！`);
      dispatch({
        type: 'modules/fetchData',
        payload: {
          moduleName,
          forceUpdate: true,
        },
      });
      refreshParentAgreementForm(parentForm);
    } else {
      Modal.error({
        title: `合同${text}的付款计划制作失败！`,
        width: 500,
        content: response.msg,
      });
    }
  });
};

export const agreementPlanAutoBalance = (params: ActionParamsModal) => {
  const { moduleState, dispatch } = params;
  const {
    moduleName,
    filters: { parentfilter },
    parentForm,
  } = moduleState;
  if (!parentfilter || parentfilter?.fieldahead !== 'pmAgreement') {
    message.warn('需要选择一个合同，或者合同付款计划模块在合同之下！');
    return;
  }
  const text = `『${parentfilter.text}』`;
  request(`${API_HEAD}/pm/plan/autobalance.do`, {
    params: {
      agreementId: parentfilter.fieldvalue,
    },
  }).then((response) => {
    if (response.success) {
      message.success(`合同${text}的付款计划末条平衡已完成！`);
      showResultInfo(response.resultInfo);
      dispatch({
        type: 'modules/fetchData',
        payload: {
          moduleName,
          forceUpdate: true,
        },
      });
      refreshParentAgreementForm(parentForm);
    } else {
      Modal.error({
        title: `合同${text}的付款计划末条平衡失败！`,
        width: 500,
        content: response.msg,
      });
    }
  });
};

export const agreementPlanbalanceByRecord = (params: ActionParamsModal) => {
  const { record, moduleState, dispatch } = params;
  const {
    moduleName,
    filters: { parentfilter },
    parentForm,
  } = moduleState;
  if (!parentfilter || parentfilter?.fieldahead !== 'pmAgreement') {
    message.warn('需要选择一个合同，或者合同付款计划模块在合同之下！');
    return;
  }
  Modal.confirm({
    title: `确定要从当前的选中记录处开始执行结算金额的按比例平衡吗?`,
    icon: <QuestionCircleOutlined />,
    onOk() {
      const text = `『${parentfilter.text}』`;
      request(`${API_HEAD}/pm/plan/balancebyrecord.do`, {
        params: {
          planId: record[PLANID],
        },
      }).then((response) => {
        if (response.success) {
          message.success(`合同${text}的审计或结算金额变更后平衡已完成，请复核平衡后的付款计划！`);
          dispatch({
            type: 'modules/fetchData',
            payload: {
              moduleName,
              forceUpdate: true,
            },
          });
          refreshParentAgreementForm(parentForm);
        } else {
          Modal.error({
            title: `合同${text}的审计或结算金额变更后平衡失败！`,
            width: 500,
            content: response.msg,
          });
        }
      });
    },
  });
};

// 显示在合同上的可请款的按钮
export const agreementCreatePaymentButton = (params: ActionParamsModal) => {
  const { record, funcDefine, dispatch } = params;
  // 这里不用判断是否有pmpayment的权限,按钮已经设置权限了
  if (!record || !record[AUDITINGDATE] || !record.paymentAllowAmount) return null;
  const moduleName = 'PmPayment';
  const primarykey = AGREEMENTID;
  const moduleInfo: ModuleModal = getModuleInfo(moduleName);
  const parentFilter: ParentFilterModal = {
    moduleName: 'PmAgreement', // 父模块名称
    fieldahead: 'pmAgreement', // 子模块到父模块的路径
    fieldName: primarykey, // 子模块中的关联？
    fieldtitle: '项目合同',
    operator: '=',
    fieldvalue: record[primarykey],
    text: record[NAME],
  };
  const CreatePaymentButton = () => {
    const context = useContext(DetailModelContext);
    const moduleState = context.moduleState as ModuleState;
    const { formState } = moduleState;
    const { dispatch: paymenyDispatch } = context;
    return (
      <>
        <Button
          icon={getMenuAwesomeIcon(funcDefine.iconcls)}
          key={`button-${record[primarykey]}`}
          onClick={() => {
            paymenyDispatch({
              type: 'modules/formStateChanged',
              payload: {
                moduleName,
                formState: {
                  ...formState,
                  visible: true,
                  formType: 'insert',
                  currRecord: {},
                },
              },
            });
          }}
        >
          {funcDefine.title}
        </Button>
        <ModuleForm
          moduleInfo={moduleInfo}
          moduleState={moduleState}
          dispatch={paymenyDispatch}
          callback={() => {
            dispatch({
              type: 'modules/refreshRecord',
              payload: {
                moduleName: 'PmAgreement',
                recordId: record[primarykey],
              },
            });
          }}
        />
      </>
    );
  };
  return (
    <DetailModelProvider
      key={record[primarykey]}
      moduleName={moduleName}
      parentFilter={parentFilter}
    >
      <CreatePaymentButton />
    </DetailModelProvider>
  );
};

// 显示在合同上的可付款的按钮
export const agreementCreatePaymentDetailButton = (params: ActionParamsModal) => {
  const { record, funcDefine, dispatch } = params;
  // 这里不用判断是否有pmpaymentdetail的权限,按钮已经设置权限了
  // 已经支付金额 和 批准请款金额 不等，则需要进行支付
  if (
    !record ||
    !record[AUDITINGDATE] ||
    record.paymentDetailAmount === record.paymentFinishedAmount
  )
    return null;
  const moduleName = 'PmPaymentDetail';
  const primarykey = AGREEMENTID;
  const moduleInfo: ModuleModal = getModuleInfo(moduleName);
  const parentFilter: ParentFilterModal = {
    moduleName: 'PmAgreement', // 父模块名称
    fieldahead: 'pmPayment.pmAgreement', // 子模块到父模块的路径
    fieldName: primarykey, // 子模块中的关联？
    fieldtitle: '项目合同',
    operator: '=',
    fieldvalue: record[primarykey],
    text: record[NAME],
  };
  const CreatePaymentDetailButton = () => {
    const context = useContext(DetailModelContext);
    const moduleState = context.moduleState as ModuleState;
    const { formState } = moduleState;
    const { dispatch: DetailDispatch } = context;
    return (
      <>
        <Button
          icon={getMenuAwesomeIcon(funcDefine.iconcls)}
          key={`button-${record[primarykey]}`}
          onClick={() => {
            DetailDispatch({
              type: 'modules/formStateChanged',
              payload: {
                moduleName,
                formState: {
                  ...formState,
                  visible: true,
                  formType: 'insert',
                  currRecord: {},
                },
              },
            });
          }}
        >
          {funcDefine.title}
        </Button>
        <ModuleForm
          moduleInfo={moduleInfo}
          moduleState={moduleState}
          dispatch={DetailDispatch}
          callback={() => {
            dispatch({
              type: 'modules/refreshRecord',
              payload: {
                moduleName: 'PmAgreement',
                recordId: record[primarykey],
              },
            });
          }}
        />
      </>
    );
  };
  return (
    <DetailModelProvider
      key={record[primarykey]}
      moduleName={moduleName}
      parentFilter={parentFilter}
    >
      <CreatePaymentDetailButton />
    </DetailModelProvider>
  );
};

// 显示在合同上的可付款的按钮
export const agreementFiledButton = (params: ActionParamsModal) => {
  const { moduleState, record, funcDefine, dispatch } = params;
  // 这里不用判断是否有pmpaymentdetail的权限,按钮已经设置权限了
  // 如果付款比率是100%，并且合同状态不是99，则可进行存档操作
  if (!record) return null;
  const primarykey = AGREEMENTID;
  const text = `『${record[NAME]}』`;
  if (
    record[AUDITINGDATE] &&
    record.amount === record.paymentDetailAmount &&
    record['pmAgreementState.stateCode'] < '99'
  ) {
    return (
      <Button
        icon={getMenuAwesomeIcon(funcDefine.iconcls)}
        key={`button-${record[primarykey]}`}
        onClick={() => {
          Modal.confirm({
            title: `确定要把合同${text}存档吗？`,
            icon: <QuestionCircleOutlined />,
            width: 500,
            onOk() {
              request(`${API_HEAD}/pm/agreement/filed.do`, {
                params: {
                  agreementId: record[primarykey],
                },
              }).then((response) => {
                if (response.success) {
                  message.success(`合同${text}已存档！`);
                  dispatch({
                    type: 'modules/refreshRecord',
                    payload: {
                      moduleName: moduleState.moduleName,
                      recordId: record[primarykey],
                    },
                  });
                } else {
                  Modal.error({
                    title: `合同${text}存档失败！`,
                    width: 500,
                    content: response.msg,
                  });
                }
              });
            },
          });
        }}
      >
        {funcDefine.title}
      </Button>
    );
  }
  return null;
};

/**
 * 可以直接启动，并且审批结束，用于以前已经支付的请款单，或者未在线上审批的请款单
 * @param params
 * @returns
 */
export const paymentAutoApproveButton = (params: ActionParamsModal) => {
  const { moduleState, record, funcDefine, dispatch } = params;
  if (!record) return null;
  const primarykey = PAYMENTID;
  const text = `合同『${record['pmAgreement.name']}』的付款审批表『${record.reason}』`;
  if (record.actProcState === '未启动') {
    return (
      <Button
        icon={getMenuAwesomeIcon(funcDefine.iconcls)}
        key={`button-${record[primarykey]}`}
        onClick={() => {
          Modal.confirm({
            title: `确定要对${text}直接审批通过吗？(只对于以前已经审批过的和未在线上审批的适用)`,
            icon: <QuestionCircleOutlined />,
            width: 500,
            onOk() {
              request(`${API_HEAD}/pm/payment/autoapprove.do`, {
                params: {
                  paymentId: record[primarykey],
                },
              }).then((response) => {
                if (response.success) {
                  message.success(`${text}已设置为通过审批，可以进行支付！`);
                  dispatch({
                    type: 'modules/refreshRecord',
                    payload: {
                      moduleName: moduleState.moduleName,
                      recordId: record[primarykey],
                    },
                  });
                } else {
                  Modal.error({
                    title: `${text}直接审批通过失败！`,
                    width: 500,
                    content: response.msg,
                  });
                }
              });
            },
          });
        }}
      >
        {funcDefine.title}
      </Button>
    );
  }
  return null;
};

// 显示在请款单上的可付款的按钮
export const paymentCreatePaymentDetailButton = (params: ActionParamsModal) => {
  const {
    record,
    funcDefine,
    dispatch,
    moduleState: { parentForm },
  } = params;
  // 这里不用判断是否有pmpaymentdetail的权限,按钮已经设置权限了
  // 已经支付金额 和 批准请款金额 不等，则需要进行支付
  // 20 -- 可支付
  if (!record || record.payoutStatus !== '20') return null;
  const moduleName = 'PmPaymentDetail';
  const primarykey = 'paymentId';
  const moduleInfo: ModuleModal = getModuleInfo(moduleName);
  const parentFilter: ParentFilterModal = {
    moduleName: 'PmPayment', // 父模块名称
    fieldahead: 'pmPayment', // 子模块到父模块的路径
    fieldName: primarykey, // 子模块中的关联？
    fieldtitle: '项目合同请款单',
    operator: '=',
    fieldvalue: record[primarykey],
    text: record.reason,
  };
  const CreatePaymentDetailButton = () => {
    const detailContext = useContext(DetailModelContext);
    const moduleState = detailContext.moduleState as ModuleState;
    const { formState } = moduleState;
    const { dispatch: detailDispatch } = detailContext;
    return (
      <React.Fragment>
        <Button
          icon={funcDefine.buttonType === 'link' ? null : getMenuAwesomeIcon(funcDefine.iconcls)}
          type={funcDefine.buttonType || undefined}
          style={
            funcDefine.buttonType === 'link' ? { padding: 0, margin: 0, height: 'inherit' } : {}
          }
          key={`button-${record[primarykey]}`}
          onClick={() => {
            detailDispatch({
              type: 'modules/formStateChanged',
              payload: {
                moduleName,
                formState: {
                  ...formState,
                  visible: true,
                  formType: 'insert',
                  currRecord: {},
                },
              },
            });
          }}
        >
          {funcDefine.title}
        </Button>
        <ModuleForm
          moduleInfo={moduleInfo}
          moduleState={moduleState}
          dispatch={detailDispatch}
          hiddenSetNull // 放在grid的列上，由于实例比较多，因此不显示的都生成null
          callback={() => {
            dispatch({
              type: 'modules/refreshRecord',
              payload: {
                moduleName: 'PmPayment',
                recordId: record[primarykey],
              },
            });
            refreshParentAgreementForm(parentForm);
          }}
        />
      </React.Fragment>
    );
  };
  return (
    <DetailModelProvider
      key={record[primarykey]}
      moduleName={moduleName}
      parentFilter={parentFilter}
    >
      <CreatePaymentDetailButton />
    </DetailModelProvider>
  );
};

type BusinessActionStore = Record<string, Function>;

type BusinessActionButtonStore = Record<string, Function>;

/**
 * 所有的业务系统模块附加操作的函数的定义区域
 */
export const businessActions: BusinessActionStore = {
  agreementPlanAutoCreate,
  agreementPlanAutoBalance,
  agreementPlanbalanceByRecord,

  deviceCheckOnline,
  dispatchEmployeePhoto,
};

/**
 * 所有的业务系统模块附加操作的按钮的定义区域
 */
export const businessActionButtons: BusinessActionButtonStore = {
  agreementCreatePayment: agreementCreatePaymentButton,
  agreementCreatePaymentDetail: agreementCreatePaymentDetailButton,
  agreementFiled: agreementFiledButton,
  paymentCreatePaymentDetail: paymentCreatePaymentDetailButton,
  paymentAutoApprove: paymentAutoApproveButton,
};
