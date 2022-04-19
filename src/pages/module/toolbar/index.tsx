/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Button, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ModuleModal, ModuleState, TextValue } from '../data';
import FilterInfoButton from './FilterInfoButton';
import ExportButton from './export/ExportButton';
import BatchOperateButton, { getToolbarButton } from './BatchOperateButton';
import { getGridBatchImport, hasInsert, hasInsertImport } from '../modules';
import BatchImportButton from '../grid/batchImport';

const ModuleToolbar = ({
  moduleState,
  moduleInfo,
  dispatch,
  manyToOneInfo,
  readOnly,
}: {
  moduleState: ModuleState;
  moduleInfo: ModuleModal;
  dispatch: any;
  manyToOneInfo: any;
  readOnly?: boolean;
}) => {
  const { moduleName, formState } = moduleState;
  return (
    <span>
      <Space size="small">
        {manyToOneInfo ? (
          <Button
            type="primary"
            onClick={() => {
              if (moduleState.selectedRowKeys.length === 0) {
                message.warn(`请先选择一条${moduleInfo.title}记录，再执行此操作！`);
                return;
              }
              const selectValue = moduleState.selectedRowKeys[0];
              manyToOneInfo.setTextValue(
                moduleState.selectedTextValue.find((rec: TextValue) => rec.value === selectValue),
              );
            }}
          >
            选中返回
          </Button>
        ) : null}
        {manyToOneInfo ? (
          <Button
            onClick={() => {
              manyToOneInfo.setTextValue({});
            }}
          >
            清除选择
          </Button>
        ) : null}
        {hasInsert(moduleInfo) && !readOnly ? (
          <Button
            type="primary"
            onClick={() => {
              dispatch({
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
            <PlusOutlined /> 新建
          </Button>
        ) : null}

        {hasInsertImport(moduleInfo) && getGridBatchImport(moduleInfo) && !readOnly ? (
          <BatchImportButton moduleState={moduleState} dispatch={dispatch} />
        ) : null}

        {!readOnly
          ? // 模块附加功能中菜单名称是toolbar的
            getToolbarButton({ moduleState, dispatch, position: 'toolbar' })
          : null}
        {moduleState.selectedRowKeys.length ? (
          <BatchOperateButton moduleState={moduleState} dispatch={dispatch} readOnly={readOnly} />
        ) : null}
        <ExportButton moduleState={moduleState} dispatch={dispatch} />
        {/* <Tooltip title="参数设置">
                <Popover
                    content={<SettingForm moduleState={moduleState} dispatch={dispatch}></SettingForm>}
                    title="参数设置"
                    trigger="click"
                >
                    <SettingOutlined></SettingOutlined>
                </Popover>
            </Tooltip> */}
        <FilterInfoButton moduleState={moduleState} dispatch={dispatch} />
      </Space>
    </span>
  );
};

export default ModuleToolbar;
