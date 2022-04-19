/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { useState } from 'react';
import { Dropdown, Menu, Button, Modal, notification, Badge, Tooltip, message } from 'antd';
import {
  DeleteOutlined,
  QuestionCircleOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { Dispatch } from 'redux';
import { getMenuAwesomeIcon } from '@/utils/utils';
import type { ModuleState, ModuleModal, AdditionFunctionModal } from '../data';
import { getModuleInfo, hasDelete, canDelete } from '../modules';
import { batchAuditModuleRecords, deleteModuleRecords } from '../service';
import ExportRecordScheme from './export/ExportRecordScheme';
import ExportGridScheme, { downloadGridSchemeFile } from './export/ExportGridScheme';
import type { ActionParamsModal } from '../additionalAction/systemAction';
import { systemActions } from '../additionalAction/systemAction';
import { getSelectedRecord, getSelectedRecords } from '../moduleUtils';
import { businessActionButtons } from '../additionalAction/businessAction';
import PrintRecordScheme from './export/PrintRecordScheme';
import { canAudited } from '../audit/utils';

const spaceIcon = <QuestionCircleOutlined style={{ visibility: 'hidden' }} />;

const BatchOperateButton = ({
  moduleState,
  dispatch,
  readOnly,
}: {
  moduleState: ModuleState;
  dispatch: Dispatch;
  readOnly?: boolean;
}) => {
  const { moduleName } = moduleState;
  const moduleInfo: ModuleModal = getModuleInfo(moduleName);
  const { length: count } = moduleState.selectedRowKeys;

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const titles: string[] = moduleState.selectedRowKeys.map(
    (key: string): any => moduleState.selectedTextValue.find((rec) => rec.value === key)?.text,
  );
  const text = `<ol style="list-style-type:decimal;"><li>${titles.join('</li><li>')}</li></ol>`;
  const deleteTitle = (
    <>
      <QuestionCircleOutlined style={{ color: '#faad14', fontSize: '18px', marginRight: '6px' }} />
      {`确定要删除${moduleInfo.title}当前选中的 ${moduleState.selectedRowKeys.length} 条记录吗?`}
    </>
  );

  const onConfireDelete = () => {
    setConfirmLoading(true);
    // params : {
    //   moduleName : grid.moduleInfo.fDataobject.objectname,
    //   ids : grid.getSelectionIds().join(","),
    //   titles : grid.getSelectionTitleTpl().join("~~")
    // },
    deleteModuleRecords({
      moduleName,
      ids: moduleState.selectedRowKeys.join(','),
      titles: titles.join('~~'),
    })
      .then((response: any) => {
        if (response.resultCode === 0 || response.okMessageList.length > 0) {
          const okText = `<ol style="list-style-type:decimal;"><li>${response.okMessageList.join(
            '</li><li>',
          )}</li></ol>`;
          notification.success({
            message: `${moduleInfo.title}以下 ${response.okMessageList.length} 条记录已被删除`,
            // eslint-disable-next-line
            description: <span dangerouslySetInnerHTML={{ __html: okText }} />,
          });
          dispatch({
            type: 'modules/fetchData',
            payload: {
              moduleName,
              forceUpdate: true,
            },
          });
        }
        if (response.errorMessageList.length > 0) {
          const errorText = `<ol style="list-style-type:decimal;"><li>${response.errorMessageList.join(
            '</li><li>',
          )}</li></ol>`;
          Modal.warning({
            width: 550,
            okText: '知道了',
            title: `${moduleInfo.title}以下 ${response.errorMessageList.length} 条记录删除失败`,
            // eslint-disable-next-line
            content: <span dangerouslySetInnerHTML={{ __html: errorText }} />,
          });
        }
      })
      .finally(() => {
        setConfirmLoading(false);
        setDeleteModalVisible(false);
      });
  };

  const doAudits = () => {
    batchAuditModuleRecords({
      moduleName,
      ids: moduleState.selectedRowKeys.join(','),
      titles: titles.join('~~'),
    }).then((response: any) => {
      const { resultInfo } = response;
      if (resultInfo.success && resultInfo.success.length > 0) {
        const okText = `<ol style="list-style-type:decimal;"><li>${resultInfo.success.join(
          '</li><li>',
        )}</li></ol>`;
        notification.success({
          message: `${moduleInfo.title}以下 ${resultInfo.success.length} 条记录已被审核`,
          // eslint-disable-next-line
          description: <span dangerouslySetInnerHTML={{ __html: okText }} />,
        });
        dispatch({
          type: 'modules/fetchData',
          payload: {
            moduleName,
            forceUpdate: true,
          },
        });
      }
      if (resultInfo.error && resultInfo.error.length > 0) {
        const errorText = `<ol style="list-style-type:decimal;"><li>${resultInfo.error.join(
          '</li><li>',
        )}</li></ol>`;
        Modal.warning({
          width: 550,
          okText: '知道了',
          title: `${moduleInfo.title}以下 ${resultInfo.error.length} 条记录审核失败`,
          // eslint-disable-next-line
          content: <span dangerouslySetInnerHTML={{ __html: errorText }} />,
        });
      }
    });
  };

  const getAdditionFunctionItems = () => {
    const { additionFunctions: functions } = moduleInfo;
    if (!functions.length) return null;
    // 菜单名称是toolbar的全显示在toolbar上
    const funs = functions.filter((fun: AdditionFunctionModal) => fun.menuname !== 'toolbar');
    if (!funs.length) return null;
    const result: any[] = funs.map((fun: AdditionFunctionModal) => (
      <Menu.Item
        icon={getMenuAwesomeIcon(fun.iconcls)}
        key={fun.fcode}
        onClick={() => {
          setVisible(false);
          const { minselectrecordnum: min, maxselectrecordnum: max } = fun;
          const selectCount = moduleState.selectedRowKeys.length;
          if (min > selectCount) {
            message.warn(`请先选择 ${min} 条记录,然后再${fun.title}！`);
            return;
          }
          if (max && max < selectCount) {
            message.warn(`要${fun.title}${max === 1 ? '只能' : '最多'}选择 ${max} 条记录！`);
            return;
          }
          const params: ActionParamsModal = {
            moduleInfo,
            moduleState,
            dispatch,
            funcDefine: fun,
            record: getSelectedRecord(moduleState),
            records: getSelectedRecords(moduleState),
          };
          if (systemActions[fun.fcode]) systemActions[fun.fcode](params);
          else
            message.error(
              `${moduleInfo.title}功能『${fun.title}』的执行函数“${fun.fcode}”没有找到！`,
            );
        }}
      >
        {fun.title}
      </Menu.Item>
    ));
    result.push(<Menu.Divider key="_menu_divider3_" />);
    return result;
  };

  /**
   * 检查是否所有的选中记录都能被删除，如果有一条不能被删除，则在删除时提醒重新选择
   */
  const checkAllCanDelete = (mState: ModuleState) => {
    const mInfo = getModuleInfo(mState.moduleName);
    const items: string[] = [];
    getSelectedRecords(mState).forEach((record: any) => {
      const r = canDelete(mInfo, record);
      if (!r.canDelete) items.push(r.message);
    });
    if (items.length) {
      notification.warning({
        message: `以下 ${items.length} 条不能删除，请重新选择后再删除。`,
        description: items.map((t, index) => <div>{`${index + 1}、${t}`}</div>),
        style: { width: '500px' },
      });
    }
    return !items.length;
  };

  /**
   * 检查是否所有的选中记录都能被审核，如果有一条不能被审核，则在审核时提醒重新选择
   */
  const checkAllCanAudit = (mState: ModuleState) => {
    const mInfo = getModuleInfo(mState.moduleName);
    const items: string[] = [];
    getSelectedRecords(mState).forEach((record: any) => {
      const r: boolean = canAudited(record);
      if (!r) items.push(record[mInfo.namefield]);
    });
    if (items.length) {
      notification.warning({
        message: `以下 ${items.length} 条不能审核，请重新选择后再批量审核。`,
        description: items.map((t, index) => <div>{`${index + 1}、${t}`}</div>),
        style: { width: '500px' },
      });
    }
    return !items.length;
  };

  /**
   * 检查是否有可以审核的记录，有一条可以审核的记录，则显示批量审核的菜单
   * @param mState
   * @returns
   */
  const checkCanAudit = (mState: ModuleState) => {
    let canAuditcount = 0;
    getSelectedRecords(mState).forEach((record: any) => {
      if (canAudited(record)) canAuditcount += 1;
    });
    return canAuditcount;
  };

  const menu = (
    <Menu>
      {/* 批量审核 */}
      {moduleInfo.moduleLimit.hasaudit && checkCanAudit(moduleState)
        ? [
            <Menu.Item
              key="auditSelectRecords"
              icon={<EditOutlined />}
              onClick={() => {
                setVisible(false);
                if (checkAllCanAudit(moduleState)) doAudits();
              }}
            >
              批量审核选中的 {count} 条记录
            </Menu.Item>,
            <Menu.Divider />,
          ]
        : null}
      {hasDelete(moduleInfo) && !readOnly ? (
        <Menu.Item
          danger
          key="deleteSelectRecords"
          icon={<DeleteOutlined />}
          onClick={() => {
            setVisible(false);
            if (checkAllCanDelete(moduleState)) setDeleteModalVisible(true);
          }}
        >
          删除选中的 {count} 条记录
        </Menu.Item>
      ) : null}
      {hasDelete(moduleInfo) && !readOnly ? <Menu.Divider /> : null}
      {!readOnly ? getAdditionFunctionItems() : null}
      <Menu.Item
        key="toExcel"
        icon={<FileExcelOutlined />}
        onClick={() => {
          downloadGridSchemeFile({ moduleState, key: 'toExcel', topdf: false, onlyselected: true });
        }}
      >
        选中记录导出Excel文档
        <Tooltip title="导出Pdf文件" placement="topRight">
          <Button
            style={{ float: 'right', paddingRight: '5px' }}
            type="link"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setVisible(false);
              downloadGridSchemeFile({
                moduleState,
                key: 'toExcel',
                topdf: true,
                onlyselected: true,
              });
            }}
          >
            <FilePdfOutlined style={{ marginLeft: '10px' }} />
          </Button>
        </Tooltip>
      </Menu.Item>
      <Menu.Divider />
      {ExportGridScheme({ moduleState, setVisible, onlyselected: true })}
      {ExportRecordScheme({ moduleState, setVisible })}
      {PrintRecordScheme({ moduleState, setVisible })}
      <Menu.Item
        key="none"
        icon={spaceIcon}
        onClick={() => {
          dispatch({
            type: 'modules/resetSelectedRow',
            payload: {
              moduleName: moduleState.moduleName,
            },
          });
        }}
      >
        取消所有选中记录
      </Menu.Item>
    </Menu>
  );
  return (
    <>
      <Dropdown overlay={menu} visible={visible} onVisibleChange={(v: boolean) => setVisible(v)}>
        <Button>
          批量操作
          <Badge count={count} offset={[5, 0]} style={{ backgroundColor: '#108ee9' }} />
        </Button>
      </Dropdown>
      <Modal
        title={deleteTitle}
        visible={deleteModalVisible}
        okText={
          <>
            <DeleteOutlined /> 删 除
          </>
        }
        okType="danger"
        okButtonProps={{ type: 'primary' }}
        onOk={onConfireDelete}
        onCancel={() => setDeleteModalVisible(false)}
        confirmLoading={confirmLoading}
      >
        {/* eslint-disable */}
        <span dangerouslySetInnerHTML={{ __html: text }} />
        {/* eslint-enable */}
      </Modal>
    </>
  );
};

/**
 * 生成所有模块附加功能中菜单名称是toolbar的
 * @param param0
 */
export const getToolbarButton = ({
  moduleState,
  dispatch,
  position,
}: {
  moduleState: ModuleState;
  dispatch: Dispatch;
  position: string;
}): any => {
  const { moduleName } = moduleState;
  const moduleInfo: ModuleModal = getModuleInfo(moduleName);
  const { additionFunctions: functions } = moduleInfo;
  if (!functions.length) return null;
  const funs = functions.filter((fun: AdditionFunctionModal) => {
    const { minselectrecordnum: min } = fun;
    if (min > 0 && moduleState.selectedRowKeys.length === 0) return false;
    return (
      fun.menuname === position &&
      (!fun.visibleWithEmpty || (fun.visibleWithEmpty && moduleState.dataSource.length === 0)) &&
      (!fun.visibleWithRecord || (fun.visibleWithRecord && moduleState.dataSource.length > 0)) &&
      (!fun.needParentFilter || (fun.needParentFilter && moduleState.filters.parentfilter))
    );
  });
  if (!funs.length) return null;
  const result: any[] = funs.map((fun: AdditionFunctionModal) => {
    const params: ActionParamsModal = {
      moduleInfo,
      moduleState,
      dispatch,
      funcDefine: fun,
      record: getSelectedRecord(moduleState),
      records: getSelectedRecords(moduleState),
    };
    // 查一下是否有按钮字义，有则先加入按钮定义。按钮定义里面有全部的处理过程
    if (businessActionButtons[fun.fcode]) {
      return businessActionButtons[fun.fcode](params);
    }
    return (
      <Button
        icon={getMenuAwesomeIcon(fun.iconcls)}
        key={fun.fcode}
        onClick={() => {
          const { minselectrecordnum: min, maxselectrecordnum: max } = fun;
          const selectCount = moduleState.selectedRowKeys.length;
          if (min > selectCount) {
            message.warn(`请先选择 ${min} 条记录,然后再${fun.title}！`);
            return;
          }
          if (max && max < selectCount) {
            message.warn(`要${fun.title}${max === 1 ? '只能' : '最多'}选择 ${max} 条记录！`);
            return;
          }
          if (systemActions[fun.fcode]) systemActions[fun.fcode](params);
          else
            message.error(
              `${moduleInfo.title}功能『${fun.title}』的执行函数“${fun.fcode}”没有找到！`,
            );
        }}
      >
        {fun.title}
      </Button>
    );
  });
  return result;
};

export default BatchOperateButton;
