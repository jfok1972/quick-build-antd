/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useContext, useState } from 'react';
import type { Dispatch } from 'redux';
import {
  Steps,
  Popover,
  message,
  Popconfirm,
  Modal,
  Card,
  Tooltip,
  Space,
  Divider,
  Form,
  Button,
  TreeSelect,
} from 'antd';
import { currentUser } from 'umi';
import request, { API_HEAD, syncRequest } from '@/utils/request';
import {
  QuestionCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  AuditOutlined,
  StopOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  PartitionOutlined,
  UndoOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { refreshNotices } from '@/components/GlobalHeader/NoticeIconView';
import { deleteSecond, getSplitArray } from '@/utils/utils';
import { getModuleInfo, getModulTreePathDataSource } from '../modules';
import type { ModuleModal, ModuleState, TextValue } from '../data';
import { DetailModelProvider } from '../detailGrid/provider';
import { DetailModelContext } from '../detailGrid/model';
import ModuleForm from '../form';
import { fetchObjectRecordSync } from '../service';

interface ApproveRenderProps {
  moduleState: ModuleState;
  dispatch: Dispatch<any>;
  value: any;
  record: any;
  _recno: any;
  isLink?: boolean;
  readonly?: boolean;
}

interface ApproveTask {
  taskname: string;
  username: string;
  processresult: string;
  processdate: string;
  processtitle: string;
}

/**
 * 在一个字符串中查找另一个串，以逗号分隔，比如在 'user1', 'user1,user2,user3' 为true
 */
const findInSet = (str: string = '', liststr: string = '') => {
  if (liststr) {
    const listarray: any[] = liststr.split(',');
    for (let i = 0; i < listarray.length; i += 1) {
      if (listarray[i] === str) return true;
    }
  }
  return false;
};

// 根据审批的按钮文字或者审批的最终名称来判断是通过还是不通过
export const isApproveFromActionName = (name: string) => {
  return !(
    name.indexOf('不') >= 0 ||
    name.indexOf('暂') >= 0 ||
    name.indexOf('终') >= 0 ||
    name.indexOf('退') >= 0
  );
};

// 所有的状态：
// 流程未启动--黄色感叹号
// 我可以启动流程--绿色三角符号
// 我可以接受任务--绿色盒子符号
// 等待接受任务--黄色盒子符号
// 我可以处理任务--绿色笔的符号 可以改一下
// 正在审批中--timeout图标
// 任务暂停--红色暂停键
// 流程审批通过--勾号
// 流程审批驳回--红色的感叹号

/**
 * 只要最终审批按钮中不包括 不，暂，终，退，则表示同意的审批结果，有以上四个字的表示不同意的结果
 * @param record
 */
const approveEndState = (record: any): 'approve' | 'reject' => {
  const endName = record.actEndActName;
  if (!endName) {
    message.error('审批流程的结束没有设置名称！');
    return 'approve';
  }
  return isApproveFromActionName(endName) ? 'approve' : 'reject';
};

/**
 * 是否能启动流程, 只有录入人员才可以启动流程
 * @param moduleInfo
 */
export const canStartProcess = (moduleInfo: ModuleModal, record: any): boolean => {
  return (
    !!moduleInfo.userLimit.approve &&
    moduleInfo.userLimit.approve.start &&
    record &&
    record.creater === currentUser.username
  );
};

/**
 * 流程是否启动了
 * @return {}
 */
export const isStartProcess = (record: any) => {
  return !!record.actProcInstId;
};

/**
 * 是否处于审批状态
 * @return {}
 */
const isInProcess = (record: any) => {
  return record.actProcState === '审批中' || record.actProcState === '审核中';
};

/**
 * 是否审批结束了
 * @param record
 */
const isFinishProcess = (record: any) => {
  return !!record.actEndTime;
};

/**
 * 是否是暂停状态
 * @return {}
 */
const isPauseProcess = (record: any) => {
  return record.actProcInstState === '2';
};

/**
 * 当前记录能不能被当前用户审批
 */
export const canApprove = (record: any) => {
  // 审批人员是当前用户
  return !isPauseProcess(record) && record.actAssignee === currentUser.userid;
};

/**
 * 是否可以拾取任务
 * @param record
 */
const canClaim = (record: any) => {
  // 审批人员为空的情况下，在候选人名单中有
  return (
    !isPauseProcess(record) &&
    !record.actAssignee &&
    findInSet(currentUser.userid, record.actCandidate)
  );
};

/**
 * 是否可以退回任务,在刷新记录后将不能退回
 * @param record
 */
const canUnClaim = (record: any) => {
  // 审批人员是当前用户，并且在候选人名单中有
  return (
    !isPauseProcess(record) &&
    record.actAssignee === currentUser.userid &&
    findInSet(currentUser.userid, record.actCandidate)
  );
};

/**
 * 接受或退回任务
 */
const claimOrUnClaim = (moduleName: string, record: any, dispatch: Dispatch) => {
  if (['VActAllRuTask', 'VActAllFinishTask'].includes(moduleName)) {
    // 所有待办任务和已完成任务之中不允许操作
    return;
  }
  const moduleInfo = getModuleInfo(moduleName);
  const id = record[moduleInfo.primarykey];
  const name = record[moduleInfo.namefield];
  let act = 'claim';
  let text = '接受';
  if (canClaim(record) || canUnClaim(record)) {
    if (canUnClaim(record)) {
      // 已经指定了办理人，就可以退回
      act = 'unclaim';
      text = '退回';
    }
    request(`${API_HEAD}/platform/workflow/runtime/${act}.do`, {
      params: {
        objectName: moduleName,
        id,
        name,
        taskId: record.actExecuteTaskId,
      },
    }).then((result) => {
      if (result.success) {
        message.success(`『${name}』的审批流程已${text}!`);
        const rec = { ...record };
        // 只有在接受了任务，且没有刷新页面的情况下可以回退任务，否则只能取消所有流程了
        rec.actAssignee = rec.actAssignee ? null : currentUser.userid;
        dispatch({
          type: 'modules/updateRecord',
          payload: {
            moduleName,
            record: rec,
          },
        });
        refreshNotices();
      } else {
        Modal.warning({
          okText: '知道了',
          title: `${name}工作流${text}失败`,
          /* eslint-disable */
          content: <span dangerouslySetInnerHTML={{ __html: result.msg }} />,
          /* eslint-enable */
        });
      }
    });
  }
};

const executeProcess = (moduleState: ModuleState, record: any, dispatch: Dispatch) => {
  const { moduleName, formState } = moduleState;
  if (['VActAllRuTask', 'VActAllFinishTask'].includes(moduleState.moduleName)) {
    // 所有待办任务和已完成任务之中不允许操作
  } else {
    dispatch({
      type: 'modules/formStateChanged',
      payload: {
        moduleName,
        formState: {
          ...formState,
          visible: true,
          formType: 'approve',
          currRecord: record,
        },
      },
    });
  }
};

/**
 * 取得当前记录的tooltip的文字
 */
const MAXTITLELENGTH = 30; // 审批内容的最大长度，超出之后显示一个tooltip
const { Step } = Steps;
export const getApproveSteps = ({
  moduleState,
  record,
  dispatch,
  direction = 'horizontal',
  breakNumber = 0, // 有的审批过程太长，横排时设置n个过程就换行
  readonly = false,
  onExecuteApprove,
}: {
  moduleState?: ModuleState;
  record: any;
  dispatch?: Dispatch;
  direction?: 'horizontal' | 'vertical';
  breakNumber?: number;
  readonly?: boolean;
  onExecuteApprove?: Function;
}) => {
  const steps: any[] = [];
  if (!record || !isStartProcess(record)) return <span>审批流程尚未启动</span>;
  steps.push(
    <Step
      title="流程启动"
      key="process_start"
      icon={<PlayCircleOutlined />}
      subTitle=""
      status="finish"
      description={
        <span>
          {`${record['actStartUser.username'] || record.actStartUserName}(${deleteSecond(
            record.actStartTime,
          )})`}{' '}
        </span>
      }
    />,
  );
  steps.push(
    ...record.actCompleteTaskInfo.map((task: ApproveTask) => {
      return (
        <Step
          title={task.taskname}
          key={task.taskname}
          subTitle={task.processresult}
          status={isApproveFromActionName(task.processresult) ? 'finish' : 'error'}
          description={
            <span>
              {`${task.username}(${deleteSecond(task.processdate)})`} <br />
              {task.processtitle &&
              task.processtitle.length > MAXTITLELENGTH &&
              direction === 'horizontal' ? (
                <Tooltip title={task.processtitle}>
                  <span>
                    <InfoCircleOutlined /> 审批意见
                  </span>
                </Tooltip>
              ) : (
                <span style={{ maxWidth: '300px', display: 'block' }}>{task.processtitle}</span>
              )}
            </span>
          }
        />
      );
    }),
  );
  if (isFinishProcess(record)) {
    steps.push(
      <Step
        title={record.actEndActName}
        key="process_finished"
        icon={
          approveEndState(record) === 'approve' ? (
            <CheckCircleOutlined />
          ) : (
            <span style={{ color: 'red' }}>
              <StopOutlined />
            </span>
          )
        }
        status="finish"
        description={<span>{`${'审批结束('}${deleteSecond(record.actEndTime)})`} </span>}
      />,
    );
  } else {
    const cad = record.actCurrentCandidateName;
    // 如果没传dispatch和moduleState进来，那么就不能进行操作
    if (canClaim(record) && dispatch && moduleState) {
      steps.push(
        <Step
          title={record.actTaskNames} // '等待接受任务'
          key="process_claim"
          icon={<ClockCircleOutlined />}
          status="process"
          description={
            <span>
              {cad ? (
                <>
                  {`正在等待 ${cad} `}
                  <a onClick={() => claimOrUnClaim(moduleState.moduleName, record, dispatch)}>
                    接受任务
                  </a>
                </>
              ) : (
                ''
              )}
            </span>
          }
        />,
      );
    } else if (canApprove(record) && dispatch && moduleState) {
      // 有当前用户的任务id
      steps.push(
        <Step
          title={record.actTaskNames} // '等待处理任务'
          icon={<ClockCircleOutlined />}
          key="process_process"
          status="process"
          description={
            <span>
              正在等待 我 对任务进行处理
              {readonly && moduleState.moduleName !== 'VActRuTask' ? null : (
                <a
                  onClick={() =>
                    onExecuteApprove
                      ? onExecuteApprove()
                      : executeProcess(moduleState, record, dispatch)
                  }
                  style={{ marginLeft: '24px' }}
                >
                  开始审批
                </a>
              )}
              {
                // 记录刷新之后，就无法退回任务了,接受任务之后，在当前记录不刷新的情况下可以退回任务
                canUnClaim(record) ? (
                  <a
                    style={{ marginLeft: '12px' }}
                    onClick={() => claimOrUnClaim(moduleState.moduleName, record, dispatch)}
                  >
                    退回任务
                  </a>
                ) : null
              }
            </span>
          }
        />,
      );
    } else if (isInProcess(record)) {
      const ass = record.actCurrentAssignName;
      const dotext = cad ? '接受任务' : '处理任务';
      steps.push(
        <Step
          title={record.actTaskNames} // {`等待${dotext}`}
          key={`process_${cad}`}
          status="process"
          icon={<ClockCircleOutlined />}
          description={
            <span>
              {(cad ? `正在等待 ${cad} ${dotext}` : '') + (ass ? `正在等待 ${ass} ${dotext}` : '')}
            </span>
          }
        />,
      );
    }
  }
  if (direction === 'horizontal' && breakNumber && steps.length > breakNumber) {
    const splitSteps = getSplitArray(steps, breakNumber);
    return (
      <Space
        direction="vertical"
        size="small"
        split={<Divider type="horizontal" dashed style={{ margin: '8px 0' }} />}
        style={{ width: '100%' }}
      >
        {splitSteps.map((step) => (
          <Steps size="small" direction={direction}>
            {step}
          </Steps>
        ))}
      </Space>
    );
  }
  return (
    <Steps size="small" direction={direction}>
      {steps}
    </Steps>
  );
};

/**
 * 启动当前记录的工作流
 */
export const startProcess = (moduleInfo: ModuleModal, record: any, dispatch: Dispatch) => {
  const moduleName = moduleInfo.objectname;
  const id = record[moduleInfo.primarykey];
  const name = record[moduleInfo.namefield];
  request(`${API_HEAD}/platform/workflow/runtime/start.do`, {
    params: {
      objectName: moduleName,
      id,
      name,
    },
  }).then((result: any) => {
    if (result.success) {
      message.success(`『${name}』的审批流程已启动!`);
      dispatch({
        type: 'modules/refreshRecord',
        payload: {
          moduleName,
          recordId: id,
        },
      });
      refreshNotices();
      // const hintMessageButton = app.viewport.down('hintmessagebutton');
      // if (hintMessageButton) hintMessageButton.fireEvent('taskcomplete', hintMessageButton);
    } else {
      Modal.warning({
        okText: '知道了',
        title: '审批流程启动失败',
        /* eslint-disable */
        content: <span dangerouslySetInnerHTML={{ __html: result.msg }} />,
        /* eslint-enable */
      });
    }
  });
};

/**
 * 取消当前记录的所有审批信息，状回复到未开始审批
 */
const cancelProcess = (moduleName: string, record: any, dispatch: Dispatch) => {
  const moduleInfo = getModuleInfo(moduleName);
  if (!moduleInfo.userLimit.approve?.cancel) {
    message.warn('你没有取消当前模块审批流程的权限');
    return;
  }
  const id = record[moduleInfo.primarykey];
  const name = record[moduleInfo.namefield];
  request(`${API_HEAD}/platform/workflow/runtime/cancel.do`, {
    params: {
      objectName: moduleName,
      id,
      name,
    },
  }).then((result: any) => {
    if (result.success) {
      message.success(`『${name}』的审批流程已全部取消`);
      dispatch({
        type: 'modules/refreshRecord',
        payload: {
          moduleName,
          recordId: id,
        },
      });
      refreshNotices();
    } else {
      Modal.warning({
        okText: '知道了',
        title: '审批流程取消失败',
        /* eslint-disable */
        content: <span dangerouslySetInnerHTML={{ __html: result.msg || result.data }} />,
        /* eslint-enable */
      });
    }
  });
};

/**
 * 暂停当前记录的所有审批信息，状回复到未开始审批,（现在没用，流程不能暂停，以后有业务需求再启用）
 */
export const pauseProcess = (moduleInfo: ModuleModal, record: any, dispatch: Dispatch) => {
  if (!moduleInfo.userLimit.approve?.pause) {
    message.warn('你没有暂停当前模块流程的权限');
    return;
  }
  const moduleName = moduleInfo.objectname;
  const id = record[moduleInfo.primarykey];
  const name = record[moduleInfo.namefield];
  request(`${API_HEAD}/platform/workflow/runtime/pause.do`, {
    params: {
      objectName: moduleName,
      id,
      name,
    },
  }).then((result: any) => {
    if (result.success) {
      message.success(`『${name}』的审批流程已暂停`);
      dispatch({
        type: 'modules/refreshRecord',
        payload: {
          moduleName,
          recordId: id,
        },
      });
      refreshNotices();
    } else {
      Modal.warning({
        okText: '知道了',
        title: '审批流程暂停失败',
        /* eslint-disable */
        content: <span dangerouslySetInnerHTML={{ __html: result.msg }} />,
        /* eslint-enable */
      });
    }
  });
};

/**
 * 尚未启动审批流程的，可以启动与不能启动流程的二种情况
 * @param param0
 */
const getCanStartPopover = ({
  moduleInfo,
  record,
  className,
  dispatch,
}: {
  moduleInfo: ModuleModal;
  record: any;
  className: string;
  dispatch: Dispatch;
}) => {
  const text = `『${record[moduleInfo.namefield]}』`;
  const state = '审批流程尚未启动';
  const start = () => startProcess(moduleInfo, record, dispatch);
  return canStartProcess(moduleInfo, record) ? (
    <Popover
      content={
        <span>
          {state}
          <span style={{ marginLeft: '12px' }}>
            <a onClick={start}>启动流程</a>
          </span>
        </span>
      }
    >
      <Popconfirm
        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
        title={`要启动 ${text} 的审批流程吗?`}
        onConfirm={start}
      >
        <a>
          <span className={className} />
        </a>
      </Popconfirm>
    </Popover>
  ) : (
    <Popover placement="rightTop" trigger="hover" content={state}>
      <span className={className} />
    </Popover>
  );
};

/**
 * 正在等待 我 接受审批的情况
 * @param param0
 */
const getCanClaimPopover = ({
  moduleName,
  record,
  className,
  tips,
  dispatch,
}: {
  moduleName: string;
  record: any;
  className: string;
  tips: any;
  dispatch: Dispatch;
}) => {
  return (
    <Popover content={tips}>
      <a onClick={() => claimOrUnClaim(moduleName, record, dispatch)}>
        <span className={className} />
      </a>
    </Popover>
  );
};

/**
 * 正在等待我 进行审批，审批操作
 * @param param0
 */
const getCanProcessPopover = ({
  moduleState,
  record,
  className,
  tips,
  dispatch,
}: {
  moduleState: ModuleState;
  record: any;
  className: string;
  tips: any;
  dispatch: Dispatch;
}) => {
  return (
    <Popover content={tips}>
      <a onClick={() => executeProcess(moduleState, record, dispatch)}>
        <span className={className} />
      </a>
    </Popover>
  );
};

const procDefIdSVGMap = new Map<string, string>();
const getSVGFromProcDefId = (procDefId: string): string => {
  if (!procDefIdSVGMap.has(procDefId)) {
    procDefIdSVGMap.set(
      procDefId,
      syncRequest(`${API_HEAD}/platform/workflowdesign/getsvg.do`, { params: { procDefId } }),
    );
  }
  return procDefIdSVGMap.get(procDefId) || '';
};

export const getApproveIconClass = (moduleInfo: ModuleModal, record: any): string => {
  if (!isStartProcess(record)) {
    if (canStartProcess(moduleInfo, record)) return 'approveaction x-fa fa-play fa-fw'; // 可以启动
    return 'actionyellow x-fa fa-exclamation-triangle fa-fw'; // 不能启动
  }
  if (canClaim(record)) return 'approveaction x-fa fa-inbox fa-fw'; // 可以拾取
  if (canApprove(record))
    // 有当前用户的任务id,并且是当前人员,即是当前用户可以审批
    return 'approveaction x-fa fa-pencil fa-fw'; // 返回一个可以审批的class
  if (record.actProcState) {
    if (record.actProcState === '审批中' || record.actProcState === '审核中')
      return 'actionblue x-fa fa-sign-in fa-rotate-90 fa-fw'; // 'approveexec fa-fw'
    if (record.actProcState === '已暂停') return 'approvepause fa-fw';
    if (record.actProcState.indexOf('已结束') === 0) {
      if (approveEndState(record) === 'reject') return 'approveno x-fa fa-ban fa-rotate-90 fa-fw';
      return 'actionblue x-fa fa-check fa-fw'; // 'approveyes fa-fw'
    }
    return '';
  }
  if (isStartProcess(record)) return 'actionblue x-fa fa-sign-in fa-rotate-90 fa-fw'; // 'approveexec fa-fw'
  return '';
};

export const ApproveRenderer: React.FC<ApproveRenderProps> = ({
  record,
  moduleState,
  dispatch,
}) => {
  const { moduleName } = moduleState;
  const moduleInfo = getModuleInfo(moduleName);
  const className = getApproveIconClass(moduleInfo, record);
  const text = `『${record[moduleInfo.namefield]}』`;
  const [changeAssignVisible, setChangeAssignVisible] = useState<boolean>(false);
  // 流程还没有启动
  if (!isStartProcess(record)) {
    return getCanStartPopover({ moduleInfo, record, className, dispatch });
  }
  const getChangeAssignForm = () => {
    const arrageTreeNode = (array: any): TextValue[] => {
      return array.map((rec: TextValue) => ({
        value: rec.objectid || '',
        label: rec.text,
        key: rec.objectid,
        isLeaf: rec.leaf,
        disabled: !rec.leaf,
        children:
          rec.children && rec.children.length > 0 ? arrageTreeNode(rec.children) : undefined,
      }));
    };
    const manytooneData = arrageTreeNode(getModulTreePathDataSource('FUser'));
    return (
      <Form
        autoComplete="off"
        onFinish={(values: any) => {
          request(`${API_HEAD}/platform/workflow/task/changeassign.do`, {
            params: {
              taskid: record.actTasks,
              assignid: values.user,
            },
          }).then((result: any) => {
            if (result.success) {
              message.info(`${record.actTaskNames} 的审批人员已更换！`);
              setChangeAssignVisible(false);
              refreshNotices();
              dispatch({
                type: 'modules/refreshRecord',
                payload: {
                  moduleName,
                  recordId: record[moduleInfo.primarykey],
                },
              });
            } else {
              message.error(`${record.actTaskNames} 的审批人员更换失败！`);
            }
          });
        }}
      >
        <Form.Item
          label="审批用户"
          name="user"
          rules={[{ required: true, message: '请选择一个审批用户' }]}
        >
          <TreeSelect
            style={{ width: '300px' }}
            treeDefaultExpandAll
            allowClear
            showSearch
            treeNodeFilterProp="label"
            treeData={manytooneData}
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
          />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 10, span: 16 }}>
          <Button type="primary" htmlType="submit">
            确定更换
          </Button>
        </Form.Item>
      </Form>
    );
  };
  const tips = (
    <Card
      title={
        <>
          <AuditOutlined /> 流程审批记录
        </>
      }
      extra={
        <Space size="middle">
          <Tooltip title="显示审批流程图" placement="bottom">
            <Popover
              title={
                <Space>
                  <AuditOutlined />
                  {`${moduleInfo.title}的审批流程图`}
                </Space>
              }
              content={
                /* eslint-disable */
                <div>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: getSVGFromProcDefId(record.actProcDefId),
                    }}
                  />
                </div>
                /* eslint-enable */
              }
              trigger="click"
            >
              <PartitionOutlined />
            </Popover>
          </Tooltip>
          {moduleInfo.userLimit.approve?.cancel ? (
            <Tooltip title="取消当前记录的所有审批信息" placement="bottom" key="cancelapprove">
              <Popconfirm
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                title={`要取消 ${text} 的所有审批信息吗?`}
                onConfirm={() => cancelProcess(moduleName, record, dispatch)}
              >
                <UndoOutlined />
              </Popconfirm>
            </Tooltip>
          ) : null}
          {/* 修改当前任务的审批人员 */}
          {moduleInfo.userLimit.approve?.changeassign && record.actTasks ? (
            <Popover
              visible={changeAssignVisible}
              onVisibleChange={(v) => setChangeAssignVisible(v)}
              trigger="click"
              title={`更换 ${record.actTaskNames} 的审批人员`}
              content={getChangeAssignForm()}
            >
              <Tooltip title="更换当前任务的审批人员" placement="bottom" key="changeassign">
                <UserSwitchOutlined />
              </Tooltip>
            </Popover>
          ) : null}
        </Space>
      }
    >
      {getApproveSteps({ moduleState, record, dispatch, direction: 'vertical' })}
    </Card>
  );
  if (canClaim(record))
    return getCanClaimPopover({ moduleName, record, className, tips, dispatch });

  if (canApprove(record))
    return getCanProcessPopover({ moduleState, record, className, tips, dispatch });

  if (isFinishProcess(record)) {
    return (
      <Popover placement="rightTop" trigger="hover" content={tips}>
        {approveEndState(record) === 'approve' ? (
          <CheckOutlined />
        ) : (
          <span style={{ color: 'red' }}>
            <StopOutlined />
          </span>
        )}
      </Popover>
    );
  }
  return (
    <Popover placement="rightTop" trigger="hover" content={tips}>
      <ClockCircleOutlined />
    </Popover>
  );
};

export const approveRenderer: React.FC<ApproveRenderProps> = ({ record, ...props }) => {
  if (!record) return null;
  return <ApproveRenderer record={record} {...props} />;
};

// 我的待办事项里面的记录的审批图标
export const ApproveVActRuTaskButton: React.FC<ApproveRenderProps> = ({
  record,
  moduleState,
  dispatch,
}) => {
  // moduleState 为我的待办事项的state
  const moduleName = record.objectname;
  const moduleInfo = getModuleInfo(moduleName);
  const className = getApproveIconClass(moduleInfo, record);

  const context = useContext(DetailModelContext);
  const detailModuleState = context.moduleState as ModuleState;
  const { dispatch: approveDispatch } = context;
  const { formState } = detailModuleState;

  // 开始审批的按钮，要审批业务模块的记录
  const executeApprove = () => {
    const response = fetchObjectRecordSync({
      objectname: detailModuleState.moduleName,
      id: record.actBusinessKey,
    });
    const currRecord = response.data;
    approveDispatch({
      type: 'modules/formStateChanged',
      payload: {
        moduleName,
        formState: {
          ...formState,
          visible: true,
          formType: 'approve',
          currRecord,
        },
      },
    });
  };
  const tips = (
    <Card
      title={
        <>
          <AuditOutlined /> 流程审批记录
        </>
      }
      extra={
        <Tooltip title="显示审批流程图" placement="bottom">
          <Popover
            title={
              <Space>
                <AuditOutlined />
                {`${moduleInfo.title}的审批流程图`}
              </Space>
            }
            content={
              /* eslint-disable */
              <div>
                <span
                  dangerouslySetInnerHTML={{
                    __html: getSVGFromProcDefId(record.actProcDefId),
                  }}
                />
              </div>
              /* eslint-enable */
            }
            trigger="click"
          >
            <PartitionOutlined />
          </Popover>
        </Tooltip>
      }
    >
      {getApproveSteps({
        moduleState,
        record,
        dispatch,
        direction: 'vertical',
        // 在我的待办事项里面，流程图里面的 现在审批 按钮不可用，只能用列表里的按钮进行审批
        readonly: true,
        onExecuteApprove: executeApprove,
      })}
    </Card>
  );
  if (canClaim(record))
    return getCanClaimPopover({
      moduleName: moduleState.moduleName,
      record,
      className,
      tips,
      dispatch,
    });
  if (canApprove(record)) {
    const CreatePaymentButton = () => {
      return (
        <React.Fragment>
          <Popover content={tips}>
            <a key={`button-${record.actExecuteTaskId}`} onClick={executeApprove}>
              <span className={className} />
            </a>
          </Popover>
          <ModuleForm
            moduleInfo={moduleInfo}
            moduleState={detailModuleState}
            dispatch={approveDispatch}
            callback={() => {
              // 审批后刷新我的待办任务
              dispatch({
                type: 'modules/fetchData',
                payload: {
                  moduleName: 'VActRuTask',
                  forceUpdate: true,
                },
              });
            }}
          />
        </React.Fragment>
      );
    };
    return <CreatePaymentButton />;
  }
  if (isFinishProcess(record)) {
    return (
      <Popover placement="rightTop" trigger="hover" content={tips}>
        {approveEndState(record) === 'approve' ? (
          <CheckOutlined />
        ) : (
          <span style={{ color: 'red' }}>
            <StopOutlined />
          </span>
        )}
      </Popover>
    );
  }
  return (
    <Popover placement="rightTop" trigger="hover" content={tips}>
      <ClockCircleOutlined />
    </Popover>
  );
};

// 我的待办事项里面的记录的审批
export const approveVActRuTaskRenderer: React.FC<ApproveRenderProps> = ({
  record,
  moduleState,
  dispatch,
}) => {
  // moduleState 为我的待办事项的state
  const moduleName = record.objectname;
  return (
    <DetailModelProvider
      key={record.actExecuteTaskId}
      moduleName={moduleName}
      parentFilter={undefined}
    >
      <ApproveVActRuTaskButton
        moduleState={moduleState}
        dispatch={dispatch}
        record={record}
        value={null}
        _recno={0}
      />
    </DetailModelProvider>
  );
};
