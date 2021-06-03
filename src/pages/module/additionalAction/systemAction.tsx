import React from 'react';
import { message, Modal } from 'antd';
import type { Dispatch } from 'redux';
import { EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { DrawerProps } from 'antd/lib/drawer';
import request, { API_HEAD } from '@/utils/request';
import { apply, download } from '@/utils/utils';
import { setGlobalDrawerProps, setGlobalModalProps } from '@/layouts/BasicLayout';
import type { ModuleModal, ModuleState, AdditionFunctionModal } from '../data';
import {
  queryCreatePersonnelUser,
  queryResetUserPassword,
  updateToModuleFunction,
} from './systemActionService';
import { DisplayUserLimits, SetUserLimits, SetRoleLimits } from './userLimit';
import { activitiModeler } from '../approve/ProcessManage/activitiModeler';
import { businessActions } from './businessAction';
import { importTableAndView, refreshFields } from './importTableAndView';
import { breakDataSource, testDataSource, importSchema } from './dataSource';
import { dataSourceImportTableAndView } from './dataSourceImportTableAndView';
import { DesignForm } from '../design/DesignForm';
import { DesignGrid } from '../design/DesignGrid';
import { DesignDefaultOrder } from '../design/DesignDefaultOrder';
import { DesignFieldExpression } from '../design/DesignFieldExpression';
import { DesignUserFilter } from '../design/DesignUserFilter';
import { DesignNavigate } from '../design/DesignNavigate';
import { DesignSort } from '../design/DesignSort';
import { DesignConditionExpression } from '../design/DesignConditionExpression';

export interface ActionParamsModal {
  moduleInfo: ModuleModal;
  moduleState: ModuleState | any;
  funcDefine: AdditionFunctionModal;
  dispatch: Dispatch;
  record?: any;
  records?: any[];
}

interface RefreshRecordParams {
  dispatch: Dispatch;
  moduleName: string;
  key: string;
}

interface UserDrawerProps extends DrawerProps {
  children: any;
}

/**
 * 根据模块名称和主键更新数据，更新好处会更新到moduleState中
 * @param params
 */
const refreshRecordByKey = (params: RefreshRecordParams) => {
  const { dispatch, moduleName, key } = params;
  dispatch({
    type: 'modules/refreshRecord',
    payload: {
      moduleName,
      recordId: key,
    },
  });
};

/**
 * 重置一个用户的密码为123456
 * @param params
 */
const resetUserPassword = (params: ActionParamsModal) => {
  const {
    record,
    moduleInfo: { primarykey, namefield },
  } = params;
  const username = record[namefield];
  Modal.confirm({
    title: `确定要重置用户『${username}』的密码吗?`,
    icon: <ExclamationCircleOutlined />,
    onOk() {
      queryResetUserPassword({ userid: record[primarykey] }).then((response: any) => {
        if (response.success)
          message.success(`用户『${username}』的密码已重置为“123456”请通知其尽快修改!`);
        else message.error(`用户『${username}』的密码已重置失败!`);
      });
    },
  });
};

/**
 * 对公司人员创建一个默认的用户
 * @param params
 */
const createPersonnelUser = (params: ActionParamsModal) => {
  const {
    record,
    moduleInfo: { primarykey, namefield, modulename: moduleName },
    dispatch,
  } = params;
  queryCreatePersonnelUser({
    personnelid: record[primarykey],
  }).then((response: any) => {
    const mess = `人员『${record[namefield]}』创建用户`;
    if (response.success) {
      Modal.info({
        title: `${mess}成功!`,
        width: 500,
        /* eslint-disable */
        content: (
          <span
            dangerouslySetInnerHTML={{
              __html: `<br/>${response.message}<br/><br/>请尽快通知其修改密码，并在用户模块中给其设置权限！`,
            }}
          />
        ),
        /* eslint-enable */
      });
      refreshRecordByKey({ dispatch, moduleName, key: record[primarykey] });
    } else
      Modal.error({
        title: `${mess}失败!`,
        width: 500,
        content: response.message,
      });
  });
};

/**
 * 将所有的附加功能更新到公司的模块功能里,在设置角色权限时可进行设置。
 * @param params
 */
const updateToCompanyModuleFunction = (params: ActionParamsModal) => {
  const {
    record,
    moduleInfo: { primarykey, namefield },
  } = params;
  const mess = `将『${record[namefield]}』更新到公司的模块功能里`;
  Modal.confirm({
    title: `确定要${mess}吗?`,
    icon: <ExclamationCircleOutlined />,
    onOk() {
      updateToModuleFunction({ functionid: record[primarykey] }).then((response: any) => {
        if (response.success)
          message.success(`${((response.msg || '') as string).replaceAll('<br/>', '')}更新成功！`);
        else message.error(`更新失败：${response.msg}`);
      });
    },
  });
};

/**
 * 根据选中的字段生成模块的excel模板，再加工一下就可以上传
 * @param params
 */
const exportExcelTemplate = (params: ActionParamsModal) => {
  const { moduleInfo, records } = params;
  const { primarykey } = moduleInfo;
  const fieldids = records?.map((record: any) => record[primarykey]);
  download(`${API_HEAD}/platform/dataobjectexport/exportexceltemplate.do`, {
    fieldids,
  });
};

/**
 * 显示用户的操作权限
 * 设置在grid定义的Drawer的参数，可以控制显示的内容
 * @param params
 */
const displayUserLimit = (params: ActionParamsModal) => {
  const {
    record,
    moduleInfo: { primarykey, namefield },
    funcDefine,
  } = params;
  const props: UserDrawerProps = {
    visible: true,
    title: (
      <>
        <span className={funcDefine.iconcls} />
        {` 用户『${record[namefield]}』的操作权限`}
      </>
    ),
    width: '60%',
    children: <DisplayUserLimits userid={record[primarykey]} timestramp={new Date().getTime()} />,
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
  };
  setGlobalDrawerProps(props);
};

/**
 * 设置用户的操作权限，这个是角色的辅助，在对于某个人有特殊权限时使用，一般用角色，好控制。
 * @param params
 */
const setUserLimit = (params: ActionParamsModal) => {
  const {
    record,
    moduleInfo: { primarykey, namefield },
    funcDefine,
  } = params;
  const msg = `用户『${record[namefield]}』操作权限设置`;
  const props: UserDrawerProps = {
    visible: true,
    title: (
      <>
        <span className={funcDefine.iconcls} /> {msg}
      </>
    ),
    width: '500px',
    children: (
      <>
        <div style={{ margin: '0px 12px 12px' }}>
          注意：此操作权限设置仅作为用户角色设置的辅助，只有某些用户有特殊权限时才进行设置，
          否则请使用用户角色控制权限。(此操作权限会和用户角色中的权限叠加)
        </div>
        <SetUserLimits userid={record[primarykey]} msg={msg} timestramp={new Date().getTime()} />
      </>
    ),
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
  };
  setGlobalDrawerProps(props);
};

/**
 * 显示系统操作角色的操作权限
 * @param params
 */
const displayRoleLimit = (params: ActionParamsModal) => {
  const {
    record,
    moduleInfo: { primarykey, namefield },
    funcDefine,
  } = params;
  const msg = `系统操作角色『${record[namefield]}』的操作权限`;
  const props: UserDrawerProps = {
    visible: true,
    title: (
      <>
        <span className={funcDefine.iconcls} /> {msg}
      </>
    ),
    width: '500px',
    children: (
      <SetRoleLimits
        display
        roleid={record[primarykey]}
        msg={msg}
        timestramp={new Date().getTime()}
      />
    ),
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
  };
  setGlobalDrawerProps(props);
};
/**
 * 修改系统操作角色的操作权限
 * @param params
 */
const setRoleLimit = (params: ActionParamsModal) => {
  const {
    record,
    moduleInfo: { primarykey, namefield },
    funcDefine,
  } = params;
  const msg = `系统操作角色『${record[namefield]}』操作权限设置`;
  const props: UserDrawerProps = {
    visible: true,
    title: (
      <>
        <span className={funcDefine.iconcls} /> {msg}
      </>
    ),
    width: '500px',
    children: (
      <SetRoleLimits
        display={false}
        roleid={record[primarykey]}
        msg={msg}
        timestramp={new Date().getTime()}
      />
    ),
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
  };
  setGlobalDrawerProps(props);
};

/**
 * 定义一个工作流
 * @param {} param
 */
const designWorkFlow = (params: ActionParamsModal) => {
  const { record, dispatch } = params;
  activitiModeler({ record, dispatch });
};

/**
 * 发布一个工作流
 * @param {} param
 */
const deployWorkFlow = (params: ActionParamsModal) => {
  const {
    record,
    moduleInfo: { primarykey, namefield, modulename: moduleName },
    dispatch,
  } = params;
  const workflowid = record[primarykey];
  request(`${API_HEAD}/platform/workflowdesign/deploy.do`, {
    params: {
      workflowid,
    },
  }).then((result) => {
    if (result.success) {
      message.success(`『${record[namefield]}』审批流程发布成功`);
      dispatch({
        type: 'modules/refreshRecord',
        payload: {
          moduleName,
          recordId: workflowid,
        },
      });
    } else {
      Modal.error({
        width: 500,
        title: '记录保存时发生错误',
        content: result.msg,
      });
    }
  });
};

/**
 * 设计form
 * @param params
 */
const designForm = (params: ActionParamsModal) => {
  const { record } = params;
  setGlobalDrawerProps({
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
    zIndex: 120,
    destroyOnClose: true,
    visible: true,
    width: '100%',
    title: (
      <>
        <EditOutlined />
        {` 设计${record['FDataobject.title']}的『${record.schemename}』表单方案`}
      </>
    ),
    bodyStyle: { padding: '16px 16px 16px 16px', backgroundColor: '#f0f2f5' },
    children: <DesignForm formScheme={record} />,
  });
};

/**
 * 设计表单列
 * @param params
 */
const designGrid = (params: ActionParamsModal) => {
  const { record } = params;
  setGlobalDrawerProps({
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
    zIndex: 120,
    destroyOnClose: true,
    visible: true,
    width: '100%',
    title: (
      <>
        <EditOutlined />
        {` 设计${record['FDataobject.title']}的『${record.schemename}』列表方案`}
      </>
    ),
    bodyStyle: { padding: '16px 16px 16px 16px', backgroundColor: '#f0f2f5' },
    children: <DesignGrid gridScheme={record} />,
  });
};

/**
 * 设置用户筛选方案
 * @param params
 */
const designUserFilter = (params: ActionParamsModal) => {
  const { record } = params;
  setGlobalDrawerProps({
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
    zIndex: 120,
    destroyOnClose: true,
    visible: true,
    width: '100%',
    title: (
      <>
        <EditOutlined />
        {` 设计${record['FDataobject.title']}的『${record.schemename}』筛选方案`}
      </>
    ),
    bodyStyle: { padding: '16px 16px 16px 16px', backgroundColor: '#f0f2f5' },
    children: <DesignUserFilter filterScheme={record} />,
  });
};

/**
 * 设计导航方案
 * @param params
 */
const designNavigate = (params: ActionParamsModal) => {
  const { record } = params;
  setGlobalDrawerProps({
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
    zIndex: 120,
    destroyOnClose: true,
    visible: true,
    width: '100%',
    title: (
      <>
        <EditOutlined />
        {` 设计${record['FDataobject.title']}的『${record.title}』导航方案`}
      </>
    ),
    bodyStyle: { padding: '16px 16px 16px 16px', backgroundColor: '#f0f2f5' },
    children: <DesignNavigate navigateScheme={record} />,
  });
};

const designDefaultOrder = (params: ActionParamsModal) => {
  const { record } = params;
  setGlobalDrawerProps({
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
    zIndex: 120,
    destroyOnClose: true,
    visible: true,
    width: '100%',
    title: (
      <>
        <EditOutlined />
        {` 设计『${record.title}』的默认排序方案`}
      </>
    ),
    bodyStyle: { padding: '16px 16px 16px 16px', backgroundColor: '#f0f2f5' },
    children: <DesignDefaultOrder objectRecord={record} />,
  });
};

const designSort = (params: ActionParamsModal) => {
  const { record } = params;
  setGlobalDrawerProps({
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
    zIndex: 120,
    destroyOnClose: true,
    visible: true,
    width: '100%',
    title: (
      <>
        <EditOutlined />
        {` 设计${record['FDataobject.title']}的『${record.title}』排序方案`}
      </>
    ),
    bodyStyle: { padding: '16px 16px 16px 16px', backgroundColor: '#f0f2f5' },
    children: <DesignSort objectRecord={record} />,
  });
};

/**
 * 设置自定义字段的表达式
 * @param params
 */
const setAdditionFieldExpression = (params: ActionParamsModal) => {
  const { record } = params;
  setGlobalModalProps({
    onCancel: () => setGlobalModalProps(() => ({ visible: false })),
    zIndex: 120,
    destroyOnClose: true,
    visible: true,
    width: '900px',
    footer: null,
    title: (
      <>
        <EditOutlined />
        {` 设计 ${record['FDataobject.title']} 附加字段『${record.title}』的字段表达式`}
      </>
    ),
    bodyStyle: { padding: '16px 16px 16px 16px', backgroundColor: '#f0f2f5' },
    children: <DesignFieldExpression record={record} />,
  });
};

/**
 * 设置模块自定义条件的表达式
 * @param params
 */
export const setConditionExpression = (params: ActionParamsModal) => {
  const { record } = params;
  setGlobalModalProps({
    onCancel: () => setGlobalModalProps(() => ({ visible: false })),
    zIndex: 120,
    destroyOnClose: true,
    visible: true,
    width: '900px',
    footer: null,
    title: (
      <>
        <EditOutlined />
        {` 设计 ${record['FDataobject.title']} 自定义条件『${record.title}』的表达式`}
      </>
    ),
    bodyStyle: { padding: '16px 16px 16px 16px', backgroundColor: '#f0f2f5' },
    children: <DesignConditionExpression record={record} />,
  });
};

/**
 * 在iframe中可以进行界面和表单列表配置的extjs的程序
 * @param params
 */
const extjsSetting = (params: ActionParamsModal) => {
  const title = '所有配置设置程序';
  const props = {
    visible: true,
    title: (
      <span>
        <span className="x-fa fa-link" style={{ marginRight: '8px' }} />
        {title}
      </span>
    ),
    width: '100%',
    zIndex: undefined,
    children: <iframe title={title} width="100%" height="100%" src={params.funcDefine.remark} />,
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
    bodyStyle: { backgroundColor: '#f0f2f5', padding: 0, margin: 0 },
  };
  setGlobalDrawerProps(props);
};

/**
 * 给选中的manytoone字段，在one端创建onetomany字段
 * @param params
 * @returns
 */
const createOneToManyField = (params: ActionParamsModal) => {
  const { record } = params;
  if (!(record.fieldrelation && record.fieldrelation.toLowerCase() === 'manytoone')) {
    message.warn('请选择一个多对一(manytoone)的字段！');
    return;
  }
  const mess = `模块『${record.fieldtitle}』中建立『${record['FDataobject.title']}』的一对多关系`;
  Modal.confirm({
    title: `确定要在${mess}吗?`,
    width: 500,
    icon: <ExclamationCircleOutlined />,
    onOk: () => {
      request(`${API_HEAD}/platform/dataobjectfield/createonetomanyfield.do`, {
        method: 'POST',
        params: {
          fieldid: record.fieldid,
        },
      }).then((response) => {
        if (response.success) {
          message.success(`${mess}已成功!`);
        } else {
          Modal.error({
            width: 500,
            title: '操作失败',
            content: response.msg,
          });
        }
      });
    },
  });
};

/**
 * 为二个manytoone字段在otherside 生成二个 manytomany的字段
 * @param params
 * @returns
 */
const createManyToManyField = (params: ActionParamsModal) => {
  const { records } = params;
  const [r1, r2] = records as any[];
  if (r1['FDataobject.objectid'] !== r2['FDataobject.objectid']) {
    message.warn('请选择相同模块下的二个字段！');
    return;
  }
  if (
    !(
      r1.fieldrelation &&
      r1.fieldrelation.toLowerCase() === 'manytoone' &&
      r2.fieldrelation &&
      r2.fieldrelation.toLowerCase() === 'manytoone'
    )
  ) {
    message.warn('请选择二个多对一(manytoone)的字段！');
    return;
  }
  const mess = `模块『${r1.fieldtitle}』和『${r2.fieldtitle}』之间建立多对多关系`;
  Modal.confirm({
    title: `确定要在${mess}吗?`,
    icon: <ExclamationCircleOutlined />,
    onOk: () => {
      request(`${API_HEAD}/platform/dataobjectfield/createmanytomanyfield.do`, {
        method: 'POST',
        params: {
          fieldid1: r1.fieldid,
          fieldid2: r2.fieldid,
          linkedobjectid: r1['FDataobject.objectid'],
        },
      }).then((response) => {
        if (response.success) {
          message.success(`${mess}已成功!`);
        } else {
          Modal.error({
            width: 500,
            title: '操作失败',
            content: response.msg,
          });
        }
      });
    },
  });
};

type ActionStore = Record<string, Function>;

/**
 * 所有的系统附加操作的函数的定义区域
 */
export const systemActions: ActionStore = apply(
  {
    createPersonnelUser,
    resetpassword: resetUserPassword,
    displayuserlimit: displayUserLimit,
    setuserlimit: setUserLimit,
    exportExcelTemplate,
    displayrolelimit: displayRoleLimit,
    setrolelimit: setRoleLimit,
    designworkflow: designWorkFlow,
    deployworkflow: deployWorkFlow,
    importtableandview: importTableAndView,
    extjsSetting,
    // 实体对象和实体对象共用
    refreshfields: refreshFields,
    // 数据源的操作
    testDataSource,
    breakDataSource,
    importSchema,
    importSchemaTable: dataSourceImportTableAndView,
    // 更新模块附加功能
    updatetocompanymodulefunction: updateToCompanyModuleFunction,
    designform: designForm,
    designGrid,
    designUserFilter,
    designNavigate,
    setdefaultorder: designDefaultOrder,
    designSort,
    setadditionfieldexpression: setAdditionFieldExpression,
    setConditionExpression,
    createonetomanyfield: createOneToManyField,
    createmanytomanyfield: createManyToManyField,
  },
  businessActions,
) as ActionStore;
