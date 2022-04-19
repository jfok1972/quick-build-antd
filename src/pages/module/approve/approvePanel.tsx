/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useEffect, useState } from 'react';
import type { Dispatch } from 'redux';
import request, { API_HEAD, syncRequest } from '@/utils/request';
import {
  Form,
  Input,
  Space,
  message,
  Modal,
  Popconfirm,
  InputNumber,
  DatePicker,
  Checkbox,
  Row,
  Col,
  Tooltip,
  AutoComplete,
} from 'antd';
import Button from 'antd/es/button';
import { InfoCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { refreshNotices } from '@/components/GlobalHeader/NoticeIconView';
import type { ModuleFieldType, ModuleModal, ModuleState } from '../data';
import { DateFormat, DateTimeFormatWithOutSecond } from '../moduleUtils';
import { getPercentFormField } from '../form/formFactory';
import { convertToFormRecord } from '../form/formUtils';
import { getFieldDefine } from '../modules';
import type { ButtonType } from 'antd/lib/button';
import { getAwesomeIcon } from '@/utils/utils';
import { addApproveComments, getApproveComments } from './approveComment';

// 保存每一个流程定义的所有usertask的form和outgoing。在和当前的不一样的时候，如果有缓存就调用当前的

// {"outgoing":[{"name":"审批","id":"flow2"}],"formdata":[]}
interface ProcTaskButton {
  name: string;
  id: string;
  orderno?: number; // 顺序号
  type?: ButtonType; // buttonType
  danger?: boolean; // danger 标志
  style?: any; // style
  icon?: string; // 按钮上的icon
  tooltip?: string; // 按钮上的tooltip
}

interface ProcTaskDefine {
  outgoing: ProcTaskButton[];
  formdata: any[];
}

interface ApproveFormPrpos {
  moduleInfo: ModuleModal;
  moduleState: ModuleState;
  record: any;
  dispatch: Dispatch;
  callback?: Function;
}

const actProcTaskDefs = new Map<string, ProcTaskDefine>();

const FormItem = Form.Item;

// 根据流程定义id和任务定义id取得该任务的formdata和outgoing值
const getProcTaskDef = (procdefid: string, taskkey: string): any => {
  const key = `${procdefid}+${taskkey}`;
  if (!actProcTaskDefs.has(key)) {
    const result: ProcTaskDefine = syncRequest(`${API_HEAD}/platform/workflow/task/getdefinfo.do`, {
      params: {
        procdefid,
        taskkey,
      },
    });
    if (Array.isArray(result.outgoing)) {
      // 按照顺序排一下
      result.outgoing.sort((g1, g2) => {
        if (g1.orderno && g2.orderno) return g1.orderno - g2.orderno;
        return g1.id < g2.id ? -1 : 1;
      });
    }
    actProcTaskDefs.set(key, result);
  }
  return actProcTaskDefs.get(key);
};

const APPROVECONTEXT = 'approve_context_';

export const ApproveForm: React.FC<ApproveFormPrpos> = ({
  moduleInfo,
  record,
  dispatch,
  moduleState,
  callback,
}) => {
  const [form] = Form.useForm();
  const [fieldsValidate, setFieldsValidate] = useState({});
  useEffect(() => {
    setFieldsValidate({});
    form.resetFields();
    form.setFieldsValue(convertToFormRecord(record, moduleInfo));
  }, [record]);
  const labelCol = { flex: `0 0 120px` };
  const { actProcDefId } = record;
  const { actTaskDefKey } = record;
  const defs: ProcTaskDefine = getProcTaskDef(actProcDefId, actTaskDefKey);

  const submitApprove = ({ submitData, button }: { submitData: any; button: ProcTaskButton }) => {
    const { primarykey, namefield, modulename: moduleName } = moduleInfo;
    const id = record[primarykey];
    const name = record[namefield];
    const approveContext = submitData[APPROVECONTEXT]; // 审批意见
    addApproveComments(approveContext);
    let moduledata = { ...submitData };
    delete moduledata[APPROVECONTEXT];
    // 如果有修改的业务数据，加入id
    if (Object.getOwnPropertyNames(moduledata).length > 0) {
      moduledata[moduleInfo.primarykey] = id;
    } else moduledata = null;
    request(`${API_HEAD}/platform/workflow/runtime/complete.do`, {
      params: {
        objectName: moduleName,
        id,
        name,
        taskId: record.actExecuteTaskId,
        outgoingid: button.id, // 选中的连线的id
        outgoingname: button.name, // 选中的连线的name
        type: button.name, // 选中的连线的name
        content: approveContext || '', // 审批里写的文字
        moduledata: moduledata ? JSON.stringify(moduledata) : moduledata,
        // 业务系统的修改字段
      },
    }).then((response) => {
      if (response.success) {
        setFieldsValidate({});
        // 需要刷新主页上面的提示还有多少审批信息的内容。refresh
        const toastText = `『${name}』的 ${button.name} 操作已完成!`;
        message.success(toastText);
        refreshNotices();
        if (moduleState.dataSource.length === 0) {
          // 是从我的待办事项中进行审批的
          dispatch({
            type: 'modules/formStateChanged',
            payload: {
              moduleName,
              formState: {
                visible: false,
                formType: 'approve',
                currRecord: {},
              },
            },
          });
          if (callback) {
            setTimeout(() => {
              callback();
            }, 0);
          }
        } else
          dispatch({
            type: 'modules/refreshRecord',
            payload: {
              moduleName,
              recordId: id,
            },
          });
      } else {
        // response.data没处理，参考extjs版
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
        //  样式 { personnelage : '必须小于200岁'}
        const { data: errors } = response;
        if (errors) {
          setFieldsValidate(errors);
          Object.keys(errors).forEach((fn) => {
            const fi: ModuleFieldType = getFieldDefine(fn, moduleInfo);
            errorMessage.push(
              <div>
                <li key={`key_${fn}`}>
                  <b>{fi ? fi.fieldtitle : fn}</b>：{errors[fn]}
                </li>
              </div>,
            );
          });
        }
        Modal.error({
          width: 500,
          title: '记录保存时发生错误',
          content: <ul style={{ listStyle: 'decimal' }}>{errorMessage}</ul>,
        });
      }
    });
  };

  const getFormItem = () => {
    return defs.formdata?.map((item: any) => {
      const type = ((item.type || 'string') as string).toLowerCase();
      const colspan = item.colspan || 1;
      const formItemProp: any = {};
      let field: any;
      switch (type) {
        case 'double':
        case 'float':
          field = (
            <InputNumber
              className="double"
              precision={2}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value: any) => value.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '138px' }}
            />
          );
          break;
        case 'int':
        case 'integer':
          field = (
            <InputNumber
              precision={0}
              className="integer"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value: any) => value.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '120px' }}
            />
          );
          break;
        case 'percent':
          field = getPercentFormField(2, {});
          break;
        case 'date':
          field = <DatePicker format={DateFormat} />;
          break;
        case 'datetime':
        case 'timestamp':
          field = <DatePicker showTime format={DateTimeFormatWithOutSecond} />;
          break;
        case 'boolean':
          field = <Checkbox />;
          formItemProp.valuePropName = 'checked';
          break;
        case 'string': {
          const len = item.fieldlen;
          if (len > 0 && len <= 100)
            // allowClear={!fieldDefine.isrequired}
            field = (
              <Input maxLength={len} style={len <= 10 ? { maxWidth: `${len * 16 + 24}px` } : {}} />
            );
          else if (len === 0) field = <Input.TextArea autoSize />;
          else field = <Input.TextArea maxLength={len} autoSize={{ maxRows: 10 }} />;
          break;
        }
        default:
      }
      return (
        <Col
          xs={24}
          md={12 * Math.min(colspan, 2)}
          xl={(24 / 2) * Math.min(colspan, 2)}
          key={item.id}
        >
          {item.unittext ? (
            <FormItem label={item.label} key={`${item.id}1`} labelCol={labelCol}>
              <FormItem
                noStyle
                name={item.id}
                key={item.id}
                validateStatus={fieldsValidate[item.id] ? 'error' : undefined} // 'error'表示出错
                help={fieldsValidate[item.id] || item.help}
                {...formItemProp}
              >
                {field}
              </FormItem>
              <span style={{ paddingLeft: '5px' }}>{item.unittext}</span>
            </FormItem>
          ) : (
            <FormItem
              label={item.label}
              name={item.id}
              key={item.id}
              validateStatus={fieldsValidate[item.id] ? 'error' : undefined} // 'error'表示出错
              help={fieldsValidate[item.id] || item.help}
              {...formItemProp}
              labelCol={labelCol}
            >
              {field}
            </FormItem>
          )}
        </Col>
      );
    });
  };

  return (
    <Form className="moduleform" autoComplete="off" form={form}>
      <Row gutter={16}>
        {getFormItem()}
        <Col xs={24} key={APPROVECONTEXT}>
          <FormItem
            label="审批意见"
            name={APPROVECONTEXT}
            labelCol={labelCol}
            key={APPROVECONTEXT}
            rules={[
              {
                required: true,
                message: '请输入审批意见',
              },
            ]}
          >
            <AutoComplete
              options={getApproveComments()}
              // 当前文字在filterOption中没有的时候，不会有弹出选择界面
              filterOption={(inputValue, option) =>
                option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            >
              <Input.TextArea
                autoSize={{ maxRows: 10 }}
                maxLength={800}
                style={{ minHeight: '54px' }}
              />
            </AutoComplete>
          </FormItem>
        </Col>
        <Col xs={24} key="approve_buttons">
          <Space style={{ float: 'right', marginTop: '4px' }}>
            {defs.outgoing.map((button: ProcTaskButton, index) => (
              <Form.Item noStyle shouldUpdate>
                {(thisform: any) => {
                  return (
                    <Popconfirm
                      icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                      title={`确定要执行『${button.name}』的任务操作吗?`}
                      onConfirm={() => {
                        thisform.validateFields().then((submitData: any) => {
                          submitApprove({ submitData, button });
                        });
                      }}
                    >
                      <Button
                        icon={
                          button.icon ? (
                            <span style={{ paddingRight: '4px' }}>
                              {getAwesomeIcon(button.icon)}
                            </span>
                          ) : undefined
                        }
                        danger={button.danger}
                        style={button.style}
                        type={button.type || (index === 0 ? 'primary' : 'default')}
                      >
                        {button.name}
                        {button.tooltip ? (
                          <Tooltip title={button.tooltip} placement="bottom">
                            <InfoCircleOutlined />
                          </Tooltip>
                        ) : null}
                      </Button>
                    </Popconfirm>
                  );
                }}
              </Form.Item>
            ))}
          </Space>
        </Col>
      </Row>
    </Form>
  );
};
