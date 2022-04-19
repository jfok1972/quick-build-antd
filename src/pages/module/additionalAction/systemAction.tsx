/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Card, message, Modal } from 'antd';
import type { Dispatch } from 'redux';
import { EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { DrawerProps } from 'antd/lib/drawer';
import request, { API_HEAD, syncRequest } from '@/utils/request';
import { apply, download, getAwesomeIcon } from '@/utils/utils';
import { setGlobalDrawerProps, setGlobalModalProps } from '@/layouts/BasicLayout';
import OrganizationChart from '@madnessxd/react-orgchart';
import type { ModuleModal, ModuleState, AdditionFunctionModal } from '../data';
import {
  queryCreatePersonnelUser,
  queryResetUserPassword,
  updateToModuleFunction,
  addHomePageToModuleApi,
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
import type { ConditionType } from '../design/DesignConditionExpression';
import { DesignConditionExpression } from '../design/DesignConditionExpression';
import { DataobjectWidget } from '../blockScheme/DataobjectWidget';
import { BlockDetail } from '../blockScheme';
import { ModuleHierarchyChart } from '../widget/ModuleHierarchyChart';
import { getParentOrNavigateIdAndText } from '../modules';

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
 * 将分析页方案（原主页方案）增加到公司模块中，可以在用户操作权限中进行设置是否启用
 * @param params
 */
const addHomePageToModule = (params: ActionParamsModal) => {
  const {
    record,
    moduleInfo: { primarykey, namefield },
  } = params;
  const mess = `将『${record[namefield]}』加入到到公司模块`;
  Modal.confirm({
    title: `确定要${mess}吗?`,
    width: 500,
    icon: <ExclamationCircleOutlined />,
    onOk() {
      addHomePageToModuleApi({ homepageschemeid: record[primarykey] }).then((response: any) => {
        if (response.success)
          if (response.msg)
            message.success(
              `${((response.msg || '') as string).replaceAll('<br/>', '')}加入成功！`,
            );
          else message.success('本分析页方案原先已经加入到公司模块了！');
        else message.error(`加入失败：${response.msg}`);
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
 * 设置当前记录为生效的流程
 * @param params
 */
const setWorkflowValid = (params: ActionParamsModal) => {
  const {
    record,
    moduleInfo: { primarykey, namefield, modulename: moduleName },
    dispatch,
  } = params;
  const workflowid = record[primarykey];
  request(`${API_HEAD}/platform/workflowdesign/setvalid.do`, {
    params: {
      workflowid,
    },
  }).then((result) => {
    if (result.success) {
      message.success(`『${record[namefield]}』已设置为当前生效的审批流程`);
      dispatch({
        type: 'modules/fetchData',
        payload: {
          moduleName,
          forceUpdate: true,
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

/**
 * 显示模块关联关系图
 * @param params
 */
const showModuleHierarchy = (params: ActionParamsModal) => {
  const { record } = params;
  setGlobalDrawerProps({
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
    zIndex: 120,
    destroyOnClose: true,
    visible: true,
    width: '100%',
    title: (
      <>
        {getAwesomeIcon('x-fa fa-sitemap')}
        {` 对象『${record.title}』的关联关系图`}
      </>
    ),
    bodyStyle: { padding: '16px', backgroundColor: '#f0f2f5' },
    children: <ModuleHierarchyChart moduleName={record.objectname} ref={null} />,
  });
};

const showOrganizationGraph = (params: ActionParamsModal) => {
  const { moduleState } = params;
  interface PropTypes {
    nodeData: any;
  }
  const ChartNode: React.FC<PropTypes> = ({ nodeData }) => {
    const { id, orgname } = nodeData;
    return (
      <div>
        <div className="base" style={{ textAlign: 'left' }}>
          &nbsp;&nbsp;{id}
        </div>
        <div className="type">{orgname}</div>
      </div>
    );
  };
  const getChildren = (array: any[]) =>
    array.map((rec) => {
      const result: any = {
        id: rec.orgcode,
        orgname: rec.orgname,
      };
      if (rec.children && rec.children.length) {
        result.children = getChildren(rec.children);
      }
      return result;
    });
  if (moduleState.dataSource.length) {
    setGlobalDrawerProps({
      onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
      zIndex: 120,
      destroyOnClose: true,
      visible: true,
      width: '100%',
      title: (
        <>
          {getAwesomeIcon('x-fa fa-sitemap')}
          {` 机构组织架构图`}
        </>
      ),
      bodyStyle: { padding: '16px', backgroundColor: '#f0f2f5' },
      children: (
        <Card style={{ height: '100%' }} bodyStyle={{ height: '100%' }}>
          <OrganizationChart
            datasource={getChildren(moduleState.dataSource)[0]}
            direction="b2t"
            collapsible={true}
            chartClass="moduleChart"
            NodeTemplate={ChartNode}
          />
        </Card>
      ),
    });
  } else message.warn('暂无组织机构可供显示！');
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

const setConditionBase = (params: ActionParamsModal, title: string, type: ConditionType) => {
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
        {` 设计 ${record['FDataobject.title']} ${title}『${
          record.title || record.rolename
        }』的表达式`}
      </>
    ),
    bodyStyle: { padding: '16px 16px 16px 16px', backgroundColor: '#f0f2f5' },
    children: <DesignConditionExpression record={record} type={type} />,
  });
};

/**
 * 设置模块自定义条件的表达式
 * @param params
 */
export const setConditionExpression = (params: ActionParamsModal) => {
  setConditionBase(params, '自定义条件', 'condition');
};

export const setDataFilterRoleLimit = (params: ActionParamsModal) => {
  setConditionBase(params, '数据角色', 'datarole');
};

export const setDataCanSelectFilterRoleLimit = (params: ActionParamsModal) => {
  setConditionBase(params, '可选数据角色', 'canselectrole');
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

/**
 * 预览实体对象组件
 * @param params
 */
const previewWidget = (params: ActionParamsModal) => {
  const { record } = params;
  setGlobalModalProps({
    onCancel: () => setGlobalModalProps(() => ({ visible: false })),
    zIndex: 1200,
    destroyOnClose: true,
    visible: true,
    width: '60%',
    footer: null,
    title: `预览 ${record['fDataobject.title']}『${record.title}』的组件`,
    bodyStyle: { padding: '16px 16px 16px 16px', backgroundColor: '#f0f2f5' },
    children: (
      <DataobjectWidget
        widget={syncRequest(`${API_HEAD}/platform/systemcommon/widgetdefine.do`, {
          params: {
            widgetid: record.widgetid,
          },
        })}
      />
    ),
  });
};

/**
 * 预览分析页方案
 * @param params
 */
const previewHopepageScheme = (params: ActionParamsModal) => {
  const { record } = params;
  const block = syncRequest(`${API_HEAD}/platform/systemcommon/homepageschemedefine.do`, {
    params: {
      homepageschemeid: record.homepageschemeid,
    },
  });
  setGlobalDrawerProps({
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
    zIndex: 120,
    destroyOnClose: true,
    visible: true,
    width: '90%',
    footer: null,
    title: `分析页方案『${record.schemename}』的预览`,
    bodyStyle: { padding: '16px 16px 16px 16px', backgroundColor: '#f0f2f5' },
    children: <BlockDetail key={block.items[0].detailid} block={block.items[0]} />,
  });
};

/**
 * 导入导航中所选择实体对象的所有可分组字段
 * @param params
 */
const importDataminingExpandGroup = (params: ActionParamsModal) => {
  const { moduleState, dispatch } = params;
  const filter = getParentOrNavigateIdAndText(moduleState, 'FDataobject');
  if (!filter) {
    message.warn('请先在导航列表中选择一个实体对象！');
    return;
  }
  const title = filter.text;
  const objectid = filter.id;
  request(`${API_HEAD}/platform/datamining/importexpandgroup.do`, {
    params: {
      dataobjectid: objectid,
    },
  }).then((response) => {
    if (response.tag === 0) message.info(`模块『${title}』中没有发现新的可分组字段`);
    else {
      message.info(`模块『${title}』的所有可分组字段导入成功，共加入了 ${response.tag} 条记录！`);
      dispatch({
        type: 'modules/fetchData',
        payload: {
          moduleName: moduleState.moduleName,
          forceUpdate: true,
        },
      });
    }
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
    setWorkflowValid,
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
    // 把分析页加入到公司模块中
    addHomePageToModule,
    designform: designForm,
    designGrid,
    designUserFilter,
    designNavigate,
    setdefaultorder: designDefaultOrder,
    designSort,
    showOrganizationGraph,
    showModuleHierarchy,
    setadditionfieldexpression: setAdditionFieldExpression,
    setConditionExpression,
    setDataFilterRoleLimit,
    setDataCanSelectFilterRoleLimit,
    createonetomanyfield: createOneToManyField,
    createmanytomanyfield: createManyToManyField,
    previewWidget,
    previewHopepageScheme,
    importDataminingExpandGroup,
  },
  businessActions,
) as ActionStore;
