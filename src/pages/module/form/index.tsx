import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, message, Space, Drawer, Tooltip, Popconfirm, Typography } from 'antd';
import {
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
  CopyOutlined,
  CloseOutlined,
  FileTextOutlined,
  RollbackOutlined,
  DownloadOutlined,
  AuditOutlined,
  PlayCircleOutlined,
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  UndoOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import type { Dispatch } from 'redux';
import { apply, showResultInfo } from '@/utils/utils';
import { PageHeaderWrapper, GridContent } from '@ant-design/pro-layout';
import type {
  ModuleModal,
  ModuleFieldType,
  ModuleState,
  FormState,
  AdditionFunctionModal,
} from '../data';
import { getFormSchemePanel } from './formFactory';
import { saveOrUpdateRecord, downloadRecordExcel } from '../service';
import { AttachemntRenderer } from '../attachment/utils';
import ClosePopconfirm from './component/closePopconfirm';
import {
  getDifferentField,
  convertToFormRecord,
  getNewDefaultValues,
  convertMultiTagsToStr,
} from './formUtils';
import {
  getFieldDefine,
  hasInsert,
  hasEdit,
  canEdit,
  insertToModuleComboDataSource,
} from '../modules';
import { ShowTypeSelect } from './component/showTypeSelect';
import type { ActionParamsModal } from '../additionalAction/systemAction';
import { systemActions } from '../additionalAction/systemAction';
import {
  canStartProcess,
  startProcess,
  isStartProcess,
  getApproveIconClass,
} from '../approve/utils';
import FooterToolbar from './component/footToolbar';
import { getSelectedRecord } from '../moduleUtils';
import { DrawerRecordPdfScheme } from '../toolbar/export/DrawerRecordPdfScheme';
import { isAudited, canAudited, canCancelAudited, auditRecord, cancelAudit } from '../audit/utils';
import { businessActionButtons } from '../additionalAction/businessAction';
import { execPrintRecordScheme } from '../toolbar/export/PrintRecordScheme';
import { AuditFinished, AuditWaititng } from '../constants';

interface ModuleFormProps {
  moduleInfo: ModuleModal;
  moduleState: ModuleState;
  dispatch: Dispatch;
  callback?: Function; // form ????????????????????????
  hiddenSetNull?: boolean; // ???????????????????????????null,
}

const ModuleForm: React.FC<ModuleFormProps> = ({
  moduleInfo,
  moduleState,
  dispatch,
  callback,
  hiddenSetNull,
}) => {
  const { formState } = moduleState;
  const { visible, currRecord, formType, showType } = formState;
  const { modulename: moduleName, primarykey, namefield, moduleLimit, userLimit } = moduleInfo;
  const scheme = moduleInfo.formschemes[0];
  const [form] = Form.useForm();
  // ??????????????????setV????????????????????????panel
  const [, setV] = useState(0);
  // ?????????????????????????????????????????????true
  const [isAfterSave, setIsAfterSave] = useState(false);
  // ??????????????????????????????
  const [fieldsValidate, setFieldsValidate] = useState({});
  const [readOnly, setReadOnly] = useState(false);
  const [saveing, setSaving] = useState(false);
  const [changed, setChanged] = useState(0);
  const setFormState = (fState: FormState) => {
    dispatch({
      type: 'modules/formStateChanged',
      payload: {
        moduleName,
        formState: fState,
      },
    });
  };
  useEffect(() => {
    // ???currRecord?????????????????????????????????
    setChanged(0);
    form.resetFields();
    setFieldsValidate({});
    form.setFieldsValue(convertToFormRecord(currRecord, moduleInfo));
    if (visible && formType === 'insert' && !isAfterSave) {
      setTimeout(() => {
        form.setFieldsValue(
          apply(form.getFieldsValue(), getNewDefaultValues(form, moduleState, setV)),
        );
      }, 0);
    }
    if (formType === 'edit') {
      setReadOnly(!canEdit(moduleInfo, currRecord).canEdit);
    }
  }, [currRecord]);
  if ((showType === 'mainregion' || hiddenSetNull) && !visible)
    // ????????????????????????????????????????????????????????????????????????
    return null;
  const onCloseWindow = () => {
    setFormState({
      ...formState,
      visible: false,
    });
    setTimeout(() => {
      setReadOnly(false);
      setIsAfterSave(false);
      setChanged(0);
      form.resetFields();
    }, 0);
    if (callback) {
      setTimeout(() => {
        callback();
      }, 0);
    }
  };

  const getTitle = () => {
    const title = form.getFieldValue(moduleInfo.namefield) || currRecord[moduleInfo.namefield]; // + '--' + currRecord[primarykey];
    /* eslint-disable */
    return (
      <Space>
        {formType === 'edit' ? (
          <EditOutlined />
        ) : formType === 'insert' ? (
          <PlusOutlined />
        ) : formType === 'display' ? (
          <FileTextOutlined />
        ) : formType === 'approve' ? (
          <AuditOutlined />
        ) : formType === 'audit' ? (
          <CheckCircleOutlined />
        ) : (
          formType
        )}
        <span style={{ fontWeight: 400, marginLeft: '4px' }}> {moduleInfo.title}</span>
        <span style={{ fontSize: '16px' }}>{title ? ` ??? ${title}???` : null}</span>
        {moduleInfo.moduleLimit.hasapprove &&
        currRecord[primarykey] &&
        moduleName !== 'VActRuTask' ? (
          <Typography.Text type="secondary" code>
            <span
              className={getApproveIconClass(moduleInfo, currRecord)}
              style={{ marginRight: '4px' }}
            />
            {currRecord.actProcState}
          </Typography.Text>
        ) : null}
        {moduleInfo.moduleLimit.hasaudit && currRecord[primarykey]
          ? !isAudited(currRecord)
            ? AuditWaititng
            : AuditFinished
          : null}
      </Space>
    );
    /* eslint-enable */
  };

  const getHeaderButtons = () => {
    const getRefreshButon = () => {
      return formType !== 'insert' && !moduleInfo.moduleLimit.hassqlparam ? (
        <Tooltip title="??????????????????">
          <ReloadOutlined
            onClick={() => {
              dispatch({
                type: 'modules/refreshRecord',
                payload: {
                  moduleName,
                  recordId: currRecord[primarykey],
                },
              });
            }}
          />
        </Tooltip>
      ) : null;
    };
    const getAttachmentButton = () => {
      if (moduleLimit.hasattachment && userLimit.attachment?.query && currRecord[primarykey]) {
        return (
          <span style={{ verticalAlign: 'text-bottom' }}>
            <AttachemntRenderer
              value={currRecord?.attachmentdata}
              record={currRecord}
              _recno={0}
              moduleInfo={moduleInfo}
              dispatch={dispatch}
              isLink={false}
              readonly={!!changed}
            />
          </span>
        );
      }
      return null;
    };
    // ????????????????????????????????????????????????????????????
    const getAdditionFunction = () => {
      // ??????????????????????????????????????????????????????????????????
      if (!currRecord[primarykey] || changed) return null;
      const { additionFunctions: functions } = moduleInfo;
      const result: any = [];
      functions.forEach((fun: AdditionFunctionModal) => {
        if (fun.minselectrecordnum === 1 && fun.maxselectrecordnum === 1 && !fun.disableInForm) {
          const params: ActionParamsModal = {
            moduleInfo,
            moduleState,
            dispatch,
            funcDefine: fun,
            record: currRecord,
          };
          result.push(
            // ?????????????????????????????????????????????????????????????????????????????????????????????????????????
            businessActionButtons[fun.fcode] ? (
              businessActionButtons[fun.fcode](params)
            ) : (
              <Tooltip title={fun.title}>
                <span
                  className={fun.iconcls}
                  onClick={() => {
                    if (systemActions[fun.fcode]) systemActions[fun.fcode](params);
                    else
                      message.error(
                        `${moduleInfo.title}?????????${fun.title}?????????????????????${fun.fcode}??????????????????`,
                      );
                  }}
                />
              </Tooltip>
            ),
          );
        }
      });
      return result;
    };

    const getFirstRecordExcelScheme = () => {
      if (!currRecord[primarykey] || changed) return null;
      const { excelSchemes } = moduleInfo;
      if (excelSchemes && excelSchemes.length > 0) {
        // ??????????????????????????????????????????
        const ascheme = excelSchemes[0];
        const download = (filetype: any) => {
          downloadRecordExcel({
            recordids: currRecord[moduleInfo.primarykey],
            moduleName: moduleInfo.modulename,
            schemeid: ascheme.schemeid,
            filetype,
          });
        };
        return [
          ascheme.onlypdf ? null : (
            <Tooltip title={`??????${ascheme.title}`} key="_download_">
              <DownloadOutlined
                onClick={() => {
                  download(null);
                }}
              />
            </Tooltip>
          ),
          // ???????????????????????????????????????????????????????????????
          // <Tooltip title={`??????${scheme.title}???pdf??????`} key='_exportfilepdf_'>
          //     <FilePdfOutlined onClick={
          //         () => { download('pdf') }} /></Tooltip>,
          <DrawerRecordPdfScheme
            moduleInfo={moduleInfo}
            record={currRecord}
            scheme={ascheme}
            key="_recordpdf_"
          />,
        ];
      }
      return null;
    };

    const getRecordPrintScheme = () => {
      if (!currRecord[primarykey] || changed) return null;
      const { recordPrintSchemes } = moduleInfo;
      if (recordPrintSchemes && recordPrintSchemes.length > 0) {
        const ascheme = recordPrintSchemes[0];
        return (
          <Tooltip title={`??????${ascheme.title}`} key="_printrecord_">
            <PrinterOutlined
              onClick={() => {
                execPrintRecordScheme({
                  moduleName,
                  scheme: ascheme,
                  record: currRecord,
                });
              }}
            />
          </Tooltip>
        );
      }
      return null;
    };

    return (
      <Space>
        {getAttachmentButton()}
        {getFirstRecordExcelScheme()}
        {getRecordPrintScheme()}
        {getAdditionFunction()}
        <ShowTypeSelect
          moduleName={moduleName}
          moduleState={moduleState}
          dispatch={dispatch}
          formState={formState}
          changed={!!changed}
        />
        {getRefreshButon()}
        {/* <ClosePopconfirm
                    placement="bottom"
                    changed={!!changed}
                    confirmAction={onCloseWindow}>
                    {showType === 'mainregion' ?
                        <Tooltip title="??????????????????">
                            <a><RollbackOutlined /> ????????????</a>
                        </Tooltip> :
                        <CloseOutlined />}
                </ClosePopconfirm> */}
      </Space>
    );
  };

  const getTitleAndButtons = () => {
    return (
      <span style={{ display: 'flex' }}>
        {getTitle()}
        <span style={{ flex: 1 }} />
        {getHeaderButtons()}{' '}
      </span>
    );
  };

  const getCommitValues = (formValues: object) => {
    const destRecord = convertMultiTagsToStr(formValues, moduleInfo);
    if (formType === 'edit') {
      const values = getDifferentField({
        dest: destRecord,
        sour: currRecord,
        moduleInfo,
      });
      // ???????????????????????????????????????????????????????????????????????????
      values[primarykey] = currRecord[primarykey];
      return values;
    }
    if (formType === 'insert') return destRecord;
    message.error(`???????????????????????????${formType}`);
    return destRecord;
  };

  const saveRecord = () => {
    if (formType === 'edit') {
      const canedit = canEdit(moduleInfo, currRecord);
      if (!canedit.canEdit) {
        message.warn(canedit.message);
        return;
      }
    }
    form
      .validateFields()
      .then((fieldValues) => {
        setFieldsValidate({});
        setSaving(true);
        saveOrUpdateRecord({
          moduleName,
          opertype: formType,
          data: getCommitValues(fieldValues),
        })
          .then((response: any) => {
            // console.log(response);
            const { data: updatedRecord } = response; // ??????????????????????????????
            if (response.success) {
              setIsAfterSave(true);
              message.success(
                `${moduleInfo.title}??????${updatedRecord[moduleInfo.namefield]}??????????????????`,
              );
              // ?????? response.resultInfo ????????????
              showResultInfo(response.resultInfo);
              // ????????????form?????????
              if (formType === 'insert') {
                setReadOnly(true);
              }
              setFormState({
                ...formState,
                currRecord: updatedRecord,
              });
              if (formType === 'insert') {
                // ??????????????????????????????????????????????????????????????????
                insertToModuleComboDataSource(moduleName, updatedRecord);
                dispatch({
                  type: 'modules/insertRecord',
                  payload: {
                    moduleName,
                    record: updatedRecord,
                  },
                });
              } else
                dispatch({
                  type: 'modules/updateRecord',
                  payload: {
                    moduleName,
                    record: updatedRecord,
                  },
                });
            } else {
              // response.data??????????????????extjs???
              const errorMessage = response.message
                ? [
                    <div>
                      <li>
                        {typeof response.message === 'string'
                          ? response.message
                          : JSON.stringify(response.message)}
                      </li>
                    </div>,
                  ]
                : [];
              //  ?????? { personnelage : '????????????200???'}
              const { data: errors } = response;
              if (errors) {
                setFieldsValidate(errors);
                Object.keys(errors).forEach((fn) => {
                  const fi: ModuleFieldType = getFieldDefine(fn, moduleInfo);
                  errorMessage.push(
                    <div>
                      <li>
                        <b>{fi ? fi.fieldtitle : fn}</b>???{errors[fn]}
                      </li>
                    </div>,
                  );
                });
              }
              Modal.error({
                width: 500,
                title: '???????????????????????????',
                content: <ul style={{ listStyle: 'decimal' }}>{errorMessage}</ul>,
              });
            }
          })
          .finally(() => {
            setSaving(false);
          });
      })
      .catch((errorInfo) => {
        // eslint-disable-next-line
        console.warn(errorInfo);
      });
  };

  const getFooter = () => {
    const closeButton = (
      <ClosePopconfirm key="closeButton" changed={!!changed} confirmAction={onCloseWindow}>
        <Button
          key="closeButton"
          type={formType === 'audit' || changed || isAfterSave ? 'default' : 'primary'}
        >
          {showType === 'mainregion' ? (
            <>
              <RollbackOutlined /> ????????????
            </>
          ) : (
            <>
              <CloseOutlined /> ??????
            </>
          )}
        </Button>
      </ClosePopconfirm>
    );

    // ??????????????????????????????????????????????????????????????????????????????????????????????????????
    // ???????????????????????????
    const adjustCopyedRecord = (record: any) => {
      const result = { ...record };
      delete result[primarykey];
      moduleInfo.fields.forEach((field: ModuleFieldType) => {
        if (!field.allownew) delete result[field.fieldname];
      });
      return result;
    };

    const onButtonClick = (params: any) => {
      setReadOnly(false);
      setIsAfterSave(false);
      setFormState({
        ...formState,
        ...params,
      });
    };

    const gotoRecord = (record: any) => {
      dispatch({
        type: 'modules/selectedRowKeysChanged',
        payload: {
          moduleName,
          selectedRowKeys: [record[primarykey]],
        },
      });
      onButtonClick({
        currRecord: { ...record },
      });
    };
    const index = moduleState.dataSource.findIndex(
      (rec) => rec[primarykey] === currRecord[primarykey],
    );
    const priorButton =
      index !== -1 ? (
        <Button
          key="priorButton"
          disabled={index <= 0}
          onClick={() => {
            if (index > 0) {
              const record = moduleState.dataSource[index - 1];
              gotoRecord(record);
            }
          }}
        >
          <LeftOutlined />
        </Button>
      ) : null;
    const nextButton =
      index !== -1 ? (
        <Button
          key="nextButton"
          disabled={index === moduleState.dataSource.length - 1}
          onClick={() => {
            if (index < moduleState.dataSource.length - 1) {
              const record = moduleState.dataSource[index + 1];
              gotoRecord(record);
            }
          }}
        >
          <RightOutlined />
        </Button>
      ) : null;

    // ??????????????????????????????????????????????????????????????????????????????
    const editAfterInsertButton = hasEdit(moduleInfo) ? (
      <Button
        key="editAfterInsertButton"
        onClick={() =>
          onButtonClick({
            formType: 'edit',
            currRecord: { ...currRecord },
          })
        }
      >
        <EditOutlined />
        ??????
      </Button>
    ) : null;
    const startApproveAfterInsertButton = (
      <Button onClick={() => startProcess(moduleInfo, currRecord, dispatch)}>
        <PlayCircleOutlined />
        ????????????
      </Button>
    );
    const insertButton = hasInsert(moduleInfo) ? (
      <Button
        key="insertButton"
        type="primary"
        onClick={() =>
          onButtonClick({
            formType: 'insert',
            currRecord: {},
          })
        }
      >
        <PlusOutlined />
        ????????????
      </Button>
    ) : null;
    const insertAfterEditButton = hasInsert(moduleInfo) ? (
      <Button
        key="insertAfterEditButton"
        onClick={() =>
          onButtonClick({
            formType: 'insert',
            currRecord: {},
          })
        }
      >
        <PlusOutlined />
        ??????
      </Button>
    ) : null;
    const copyInsertButton =
      moduleInfo.moduleLimit.allownewinsert && hasInsert(moduleInfo) ? (
        <Button
          key="copyInsertButton"
          onClick={() =>
            onButtonClick({
              formType: 'insert',
              currRecord: adjustCopyedRecord(currRecord),
            })
          }
        >
          <CopyOutlined />
          ????????????
        </Button>
      ) : null;
    const importRecordInsertButton =
      moduleInfo.moduleLimit.allownewinsert &&
      moduleState.selectedRowKeys.length === 1 &&
      !changed &&
      Object.getOwnPropertyNames(currRecord).length === 0 ? (
        <Button
          key="importRecordInsertButton"
          onClick={() =>
            onButtonClick({
              formType: 'insert',
              currRecord: adjustCopyedRecord(getSelectedRecord(moduleState)),
            })
          }
        >
          <CopyOutlined />
          ??????????????????
        </Button>
      ) : null;
    const saveButton = (
      <Button
        key="saveButton"
        type="primary"
        loading={saveing}
        disabled={!changed}
        onClick={() => {
          saveRecord();
        }}
      >
        <SaveOutlined />
        ??????
      </Button>
    );
    const auditButton = (
      <Button
        key="auditButton"
        type="primary"
        loading={saveing}
        onClick={() => {
          auditRecord(currRecord, moduleInfo, dispatch);
        }}
      >
        <SaveOutlined />
        ????????????
      </Button>
    );
    const auditCancelButton = (
      <Popconfirm
        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
        title={`????????? ${currRecord[namefield]} ?????????????`}
        onConfirm={() => cancelAudit(currRecord, moduleInfo, dispatch)}
      >
        <Button key="auditButton" danger loading={saveing}>
          <UndoOutlined />
          ????????????
        </Button>
      </Popconfirm>
    );
    if (formType === 'insert') {
      if (isAfterSave) {
        return (
          <>
            {closeButton}
            {editAfterInsertButton}
            {moduleLimit.hasaudit && canAudited(currRecord) ? auditButton : null}
            {canStartProcess(moduleInfo) && !isStartProcess(currRecord)
              ? startApproveAfterInsertButton
              : null}
            {copyInsertButton}
            {insertButton}
          </>
        );
      }
      return (
        <>
          <span style={{ float: 'left', marginRight: '12px' }}>{importRecordInsertButton}</span>
          {closeButton}
          {saveButton}
          {/* <Button
                    onClick={() => {
                        console.log(form.getFieldsValue());
                    }} >???????????????
                    </Button> */}
        </>
      );
    }
    if (formType === 'edit') {
      if (!changed) {
        return (
          <>
            <span style={{ float: 'left', marginRight: '8px' }}>
              {priorButton}
              {nextButton}
              {insertAfterEditButton}
              {moduleLimit.hasaudit && canAudited(currRecord) ? auditButton : null}
              {/* {isAfterSave ? copyInsertButton : null} */}
            </span>
            {closeButton}
            {saveButton}
          </>
        );
      }
      return (
        <>
          {closeButton}
          {saveButton}
          {/* <Button
                    onClick={() => {
                        console.log(form.getFieldsValue());
                    }} >???????????????
                    </Button> */}
        </>
      );
    }
    if (formType === 'audit') {
      return (
        <>
          <span style={{ float: 'left', marginRight: '8px' }}>
            {priorButton}
            {nextButton}
          </span>
          {closeButton}
          {canAudited(currRecord) ? auditButton : null}
          {canCancelAudited(currRecord) ? auditCancelButton : null}
        </>
      );
    }
    return (
      <>
        <span style={{ float: 'left', marginRight: '8px' }}>
          {priorButton}
          {nextButton}
          {formType !== 'approve' ? insertAfterEditButton : null}
        </span>
        {closeButton}
      </>
    );
  };

  const onValuesChange = (_changedValues: any) => {
    if (formType === 'audit' || formType === 'approve' || formType === 'display') {
      message.warn('?????????????????????????????????');
      form.resetFields();
      form.setFieldsValue(convertToFormRecord(currRecord, moduleInfo));
      return;
    }
    // console.log(_changedValues)      // ?????????????????????
    // console.log(_values)             // ??????form????????????
    // ??????????????????????????????namefield??????????????????????????????
    if (!changed || _changedValues[namefield]) setChanged((value) => value + 1);
  };
  // ?????????manytoone???selecttable?????????????????????onChange?????????
  apply(form, { onValuesChange });
  const { centered } = scheme;
  let { formLayout, formSize, requiredMark } = scheme;
  requiredMark = requiredMark !== false;
  formLayout = formLayout === 'vertical' ? 'vertical' : 'horizontal';
  formSize = formSize === 'small' || formSize === 'large' ? formSize : 'middle';
  // ?????????horizontal???????????????label??????120px,vertical????????????;
  const labelCol =
    formLayout === 'vertical'
      ? {}
      : { flex: `0 0 ${scheme.labelWidth || (showType === 'mainregion' ? 120 : 120)}px` };
  const formPanel = getFormSchemePanel({
    moduleInfo,
    details: scheme.details,
    form,
    currRecord,
    showType,
    formType,
    fieldsValidate,
    readOnly,
    setV,
    dispatch,
    requiredMark,
    parentCols: 0, // ???????????????0???????????????????????????????????????
  });
  const schemeForm = (
    <Form
      className="moduleform"
      autoComplete="off"
      key={`form_${moduleName}_${formType}_${showType}`}
      onValuesChange={onValuesChange}
      form={form}
      labelCol={labelCol}
      layout={formLayout}
      requiredMark={requiredMark}
      size={formSize}
    >
      {showType === 'mainregion' ? (
        <Space direction="vertical" size="middle">
          {formPanel}
        </Space>
      ) : (
        formPanel
      )}
    </Form>
  );

  const width =
    scheme.width > 0 // ???????????????????????????????????????
      ? `${Math.min(document.body.clientWidth, scheme.width)}px`
      : `${Math.abs(scheme.width)}%`;
  const windowParams = {
    title: getTitleAndButtons(),
    visible,
    width,
    closable: false,
  };
  if (showType === 'mainregion')
    return (
      <PageHeaderWrapper
        className="pageheaderformwrapper"
        title={
          <>
            <ClosePopconfirm placement="bottom" changed={!!changed} confirmAction={onCloseWindow}>
              {showType === 'mainregion' ? (
                <Tooltip title="??????????????????">
                  <a>
                    <RollbackOutlined style={{ padding: '0 12px', fontSize: '16px' }} />
                  </a>
                </Tooltip>
              ) : (
                <CloseOutlined />
              )}
            </ClosePopconfirm>
            <span className="ant-page-header-heading-title">{getTitle()}</span>
          </>
        }
        extra={
          <span className="ant-modal-title" style={{ marginRight: '24px' }}>
            {getHeaderButtons()}
          </span>
        }
      >
        <GridContent>
          {schemeForm}
          <FooterToolbar>{getFooter()}</FooterToolbar>
        </GridContent>
      </PageHeaderWrapper>
    );
  if (showType === 'drawer')
    return (
      <Drawer
        onClose={!changed ? onCloseWindow : () => {}}
        destroyOnClose
        {...windowParams}
        footer={
          <div style={{ borderTop: '0px solid #f0f0f0', padding: 0 }} className="ant-modal-footer">
            {getFooter()}
          </div>
        }
        bodyStyle={{
          padding: '0px 24px',
        }}
      >
        {schemeForm}
      </Drawer>
    );
  return (
    <Modal
      onCancel={!changed ? onCloseWindow : () => {}}
      destroyOnClose
      {...windowParams}
      centered={!!centered}
      footer={getFooter()}
      bodyStyle={{
        // modal ????????? ?????????110???????????????footer?????????
        maxHeight: `${Math.floor((document.body.clientHeight - 110) * 0.9)}px`,
        overflowY: 'auto',
        padding: '0px 24px',
      }}
    >
      {schemeForm}
    </Modal>
  );
};

export default ModuleForm;
