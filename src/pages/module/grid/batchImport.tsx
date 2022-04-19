/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useMemo, useState } from 'react';
import { applyIf, download } from '@/utils/utils';
import { FileExcelOutlined, LikeOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Input,
  Space,
  Form,
  Table,
  Drawer,
  Switch,
  Badge,
  Alert,
  Progress,
  Statistic,
  message,
} from 'antd';
import moment from 'moment';
import { API_HEAD } from '@/utils/request';
import type { ModuleFieldType, ModuleState, ParentFilterModal, TextValue } from '../data';
import { getFieldDefine, getGridBatchImport, getModuleInfo } from '../modules';
import { integerRender } from './columnRender';
import { fetchObjectComboData, getAjaxNewDefault, saveOrUpdateRecord } from '../service';
import { DateTimeFormat } from '../moduleUtils';
import { getDictionaryData } from '../dictionary/dictionarys';

interface BatchImportParams {
  moduleState: ModuleState;
  dispatch: Function;
}

enum Steps {
  Init, // 导入页面刚进来的状态
  CopyCliboard, // 已经将导入数据通过剪切版或者上传文件转入到了Table中
  FirstValidate, // 已经初步验证过了
  Import, // 已经导入过了
}

// style={{ whiteSpace: "nowrap" }}
const getTitle = (title: string) => <span>{title}</span>;
const DICTNAME = '_dictname';
const MANYTOONENAME = '_manytoonename';

const moduleComboDataSource: Record<string, TextValue[]> = {};
const getModuleComboDataSource = (moduleName: string): TextValue[] => {
  if (!moduleComboDataSource[moduleName]) {
    moduleComboDataSource[moduleName] = fetchObjectComboData({
      moduleName,
      mainlinkage: false, // 如果该模块有主链接，则加入，例如人员，则会在前面加上 部门 / 人员
    }) as TextValue[];
  }
  return moduleComboDataSource[moduleName];
};
/**
 * 模块数据导入
 *
 * 1、在表单form方案中创建gridimportfields类型的方案，把要导入的字段都加进去；
 * 2、下载模块导入数据的模板Excel文件；
 * 3、把模块数据填写到模板文件中；
 * 4、上传填写好的Excel文件；
 * 5、在表单中查看预处理的信息；
 * 6、选中记录，进行导入操作（每条记录单独导入，不是整体事务，写入一条算一条的方式）。
 *
 * @param param0
 * @returns
 */
const BatchImportButton: React.FC<BatchImportParams> = ({ moduleState, dispatch }) => {
  const { moduleName } = moduleState;
  const moduleInfo = getModuleInfo(moduleName);
  const [batchImportVisible, setBatchImportVisible] = useState<boolean>(false);
  const [step, setStep] = useState<Steps>(Steps.Init);
  const [dataText, setDataText] = useState<string>('');
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [addParentFilter, setAddParentFilter] = useState<boolean>(true);
  const [addRemoteDefault, setAddRemoteDefault] = useState<boolean>(true);
  const [addDefaultValue, setAddDefaultValue] = useState<boolean>(true);
  // 本次一共导入了多少条记录，关闭才清零
  const [allSuccessCount, setAllSuccessCount] = useState<number>(0);
  const [executeCount, setExecuteCount] = useState<number>(0);
  const [percent, setPercent] = useState<number>(0);

  const getColumns = (): any[] => {
    return getGridBatchImport(moduleInfo)
      .details.map((col: any) => {
        const field: ModuleFieldType = getFieldDefine(col.fieldid, moduleInfo);
        if (!field) {
          message.warn('数据导入的Form方案中的字段要放在根节点下！');
          return {};
        }
        const column: any = {
          dataIndex: field.fieldname,
          title: field.fieldtitle,
        };
        if (field.fDictionaryid) {
          column.render = (value: any, record: any) => {
            return record[field.fieldname + DICTNAME] || record[field.fieldname];
          };
        } else if (field.isManyToOne) {
          column.render = (value: any, record: any) => {
            return record[field.fieldname + MANYTOONENAME] || record[field.fieldname];
          };
        }
        return column;
      })
      .filter((obj: any) => obj.dataIndex);
  };
  const [columns] = useState<any[]>(getColumns());

  const createDataSource = () => {
    if (!dataText) return;
    const separator = dataText.indexOf('\t') === -1 ? ',' : '\t';
    const records: any[] = dataText.split(/\r?\n/);
    setDataSource(
      records
        .filter((line) => line)
        .map((record, index) => {
          const arecord: any = { keyOfImportRecord: `${index + 1}` };
          const datas = record.split(separator);
          for (let i = 0; i < columns.length; i += 1) {
            const s: string = datas[i];
            arecord[columns[i].dataIndex] = s;
            const objectField: ModuleFieldType = getFieldDefine(columns[i].dataIndex, moduleInfo);
            if (objectField) {
              if (s) {
                if (objectField.isDateField) {
                  // 日期字符串如果是21/5/7,改为 2021-05-07
                  if (s.indexOf('/') !== -1) {
                    const parts: string[] = s.split('/');
                    if (parts.length === 3) {
                      if (parts[0].length === 2) parts[0] = `20${parts[0]}`;
                      if (parts[1].length === 1) parts[1] = `0${parts[1]}`;
                      if (parts[2].length === 1) parts[2] = `0${parts[2]}`;
                    }
                    arecord[columns[i].dataIndex] = parts.join('-');
                  }
                } else if (objectField.fieldtype.toLowerCase() === 'boolean') {
                  let v = s;
                  if (s === '是' || s.toLowerCase() === 'yes' || s.toLowerCase() === 'true')
                    v = 'true';
                  if (s === '否' || s.toLowerCase() === 'no' || s.toLowerCase() === 'false')
                    v = 'false';
                  if (['1', '0', 'true', 'false', '', 'null'].includes(v)) {
                    arecord[columns[i].dataIndex] = v;
                  } else {
                    arecord.statusOfImportRecord = `${
                      arecord.statusOfImportRecord || 'validerror:'
                    }${objectField.fieldtitle}的值不是一个布尔值；`;
                  }
                } else if (objectField.fDictionaryid) {
                  // {text: "软件开发", value: "01"}
                  const ds: TextValue[] = getDictionaryData(objectField.fDictionaryid);
                  const dict = ds.find((rec) => rec.text === s);
                  if (dict) {
                    arecord[columns[i].dataIndex + DICTNAME] = dict.text;
                    arecord[columns[i].dataIndex] = dict.value;
                  } else {
                    arecord.statusOfImportRecord = `${
                      arecord.statusOfImportRecord || 'validerror:'
                    }${objectField.fieldtitle}未在数据字典中找到；`;
                  }
                } else if (objectField.isManyToOne) {
                  const comboValues = getModuleComboDataSource(objectField.fieldtype);
                  const manytoone = comboValues.find((rec) => rec.value === s || rec.text === s);
                  if (manytoone) {
                    arecord[columns[i].dataIndex + MANYTOONENAME] = manytoone.text;
                    arecord[columns[i].dataIndex] = manytoone.value;
                  } else {
                    arecord.statusOfImportRecord = `${
                      arecord.statusOfImportRecord || 'validerror:'
                    }${objectField.fieldtitle}未找到；`;
                  }
                }
              } else if (objectField.isrequired) {
                arecord.statusOfImportRecord = `${arecord.statusOfImportRecord || 'validerror:'}${
                  objectField.fieldtitle
                }是必添字段；`;
              }
            }
          }
          return arecord;
        }),
    );
  };

  const importStatusRender = (value: string) => {
    if (!value) return null;
    if (value.startsWith('success')) {
      return <Badge status="success" text="写入成功" />;
    }
    if (value.startsWith('error')) {
      return <Badge status="error" text={value.substring(6)} />;
    }
    if (value.startsWith('validerror')) {
      return <Badge status="warning" text={value.substring(11)} />;
    }
    return value;
  };

  const fieldDefaultValue = useMemo(() => {
    const defaultValue: any = {};
    moduleInfo.fields
      .filter((field) => !field.isdisable && field.allownew && field.defaultvalue)
      .forEach((field) => {
        const v = field.defaultvalue;
        /* eslint-disable */
        defaultValue[field.fieldname] =
          v === 'true'
            ? true
            : v === 'false'
            ? false
            : v === 'now'
            ? moment().format(DateTimeFormat)
            : v;
        /* eslint-enable */
      });
    return defaultValue;
  }, []);

  const parentfilter: ParentFilterModal | null = useMemo(() => {
    const {
      filters: { parentfilter: pf },
    } = moduleState;
    if (pf) {
      const ahead: string | null = pf.fieldahead;
      if (ahead && ahead.indexOf('.') === -1) {
        return pf;
      }
    }
    return null;
  }, [moduleState.filters.parentfilter]);

  const saveRecord = async (rec: any) => {
    const record = rec;
    const data = { ...record };
    delete data.keyOfImportRecord;
    delete data.statusOfImportRecord;
    if (addDefaultValue) {
      applyIf(data, fieldDefaultValue);
    }
    if (addRemoteDefault) {
      // 从后台读取记录的缺省值
      const params: any = {
        objectname: moduleName,
        parentfilter: null,
        navigates: null,
      };
      const response = await getAjaxNewDefault(params);
      const ajaxDefault = response.data;
      if (ajaxDefault) {
        applyIf(data, ajaxDefault);
      }
    }
    // 加入父模块的限定条件值
    if (addParentFilter && parentfilter) {
      data[`${parentfilter.fieldahead}.${parentfilter.fieldName}`] = parentfilter.fieldvalue;
    }
    // 删除数据字典的名称字段
    Object.keys(data).forEach((key) => {
      if (key.indexOf(DICTNAME) !== -1) {
        delete data[key];
      }
    });
    // 修正manytoone的提交字段
    Object.keys(data).forEach((key) => {
      if (key.indexOf(MANYTOONENAME) !== -1) {
        delete data[key];
        const fn = key.replace(MANYTOONENAME, '');
        const fieldDefine = getFieldDefine(fn, moduleInfo);
        const pmodule = getModuleInfo(fieldDefine.fieldtype);
        data[`${fn}.${pmodule.primarykey}`] = data[fn];
        delete data[fn];
      }
      if (data[key] === 'null' || data[key] === '') {
        data[key] = null;
      }
    });
    return saveOrUpdateRecord({
      moduleName,
      opertype: 'insert',
      data,
    }).then((response: any) => {
      if (response.success) {
        setAllSuccessCount((c) => c + 1);
        record.statusOfImportRecord = 'success';
        setDataSource([...dataSource]);
      } else {
        let msg =
          (typeof response.message === 'string'
            ? response.message
            : JSON.stringify(response.message)) || '';
        const { data: errors } = response;
        if (errors) {
          Object.keys(errors).forEach((fn) => {
            const fi: ModuleFieldType = getFieldDefine(fn, moduleInfo);
            msg += `${fi ? fi.fieldtitle : fn}:${errors[fn]}`;
          });
        }
        record.statusOfImportRecord = `error:${msg}`;
        setDataSource([...dataSource]);
      }
      // console.log(`${record.keyOfImportRecord}完成`);
    });
  };

  const executeImport = async () => {
    const needSaves: any[] = dataSource.filter((rec) => !rec.statusOfImportRecord);
    if (needSaves.length === 0) {
      message.info('列表中所有无错误的记录都上传成功了！');
      return;
    }
    for (let i = 0; i < needSaves.length; i += 1) {
      setExecuteCount(i + 1);
      setPercent(Math.floor(((i + 1) * 100) / needSaves.length));
      const record = needSaves[i];
      // console.log(`${record.keyOfImportRecord}开始`);
      /* eslint-disable no-await-in-loop */
      await saveRecord(record);
      /* eslint-ensable no-await-in-loop */
    }
    setExecuteCount(0);
  };

  /**
   * 把错误的记录生成多条文本，重新放到textarea中，可以进行编辑，或复制后放到excel中加工再进行导入
   */
  const editErrorRecords = () => {
    setDataSource([]);
    setDataText(
      dataSource
        .filter((rec) => rec.statusOfImportRecord !== 'success')
        .map((rec) =>
          columns
            .map(
              (col) =>
                rec[col.dataIndex + DICTNAME] ||
                rec[col.dataIndex + MANYTOONENAME] ||
                rec[col.dataIndex],
            )
            .join('\t'),
        )
        .join('\r'),
    );
    setStep(Steps.Init);
    setExecuteCount(0);
  };

  // me.validAllRecord();
  const ImportGrid = () => {
    return (
      <Table
        title={() => '导入数据列表'}
        size="small"
        bordered
        rowSelection={{ type: 'checkbox' }}
        dataSource={dataSource}
        rowKey="keyOfImportRecord"
        pagination={{
          pageSize: 100,
          position: ['topRight', 'bottomRight'],
          hideOnSinglePage: true,
        }}
        columns={[
          {
            dataIndex: 'keyOfImportRecord',
            title: '序号',
            width: 48,
            align: 'right',
            render: (value: any) => integerRender(value),
          },
          {
            dataIndex: 'statusOfImportRecord',
            title: '导入状态',
            render: importStatusRender,
            // width: 96,
          },
          ...columns,
        ].map((column) => ({ ...column, title: getTitle(column.title) }))}
        scroll={{ x: true, y: '100%' }}
      />
    );
  };
  let errorCount = 0;
  let successCount = 0;
  let validerrorCount = 0;

  dataSource.forEach((rec) => {
    if (rec.statusOfImportRecord && rec.statusOfImportRecord.startsWith('error')) errorCount += 1;
    else if (rec.statusOfImportRecord && rec.statusOfImportRecord.startsWith('validerror'))
      validerrorCount += 1;
    else if (rec.statusOfImportRecord === 'success') successCount += 1;
  });

  const initState = () => {
    setStep(Steps.Init);
    setDataText('');
    setDataSource([]);
    setExecuteCount(0);
  };
  return (
    <React.Fragment>
      <Button onClick={() => setBatchImportVisible(true)}>导入</Button>
      <Drawer
        title={
          <span>
            <span>{`『${moduleInfo.title}』数据导入`}</span>
            <span style={{ float: 'right', marginRight: '36px' }}>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  download(`${API_HEAD}/platform/dataobjectimport/downloadimporttemplate.do`, {
                    objectid: moduleName,
                  });
                }}
              >
                <FileExcelOutlined />
                下载导入Excel模板
              </Button>
            </span>
          </span>
        }
        bodyStyle={{ border: '16px #f0f2f5 solid', margin: 0 }}
        visible={batchImportVisible}
        width="100%"
        onClose={() => {
          initState();
          setBatchImportVisible(false);
          setAllSuccessCount(0);
          dispatch({
            type: 'modules/fetchData',
            payload: {
              moduleName,
              forceUpdate: true,
            },
          });
        }}
      >
        <span style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Space style={{ paddingBottom: 16 }}>
                {/* <Button disabled={step !== Steps.Init} onClick={() => setStep(Steps.CopyCliboard)}>
                  <UploadOutlined /> 上传导入文件
                </Button> */}
                <Button
                  disabled={step !== Steps.CopyCliboard}
                  onClick={() => {
                    setStep(Steps.FirstValidate);
                    createDataSource();
                  }}
                >
                  数据校验
                </Button>
                <Button disabled={step !== Steps.FirstValidate} onClick={executeImport}>
                  数据导入
                </Button>
                {dataSource.length ? (
                  <>
                    {successCount + errorCount + validerrorCount === 0 ? (
                      <Button
                        onClick={() => {
                          setStep(Steps.CopyCliboard);
                          setDataSource([]);
                        }}
                        type="link"
                      >
                        重新编辑导入数据
                      </Button>
                    ) : null}
                    {dataSource.length === successCount ? (
                      <Button onClick={initState} type="primary">
                        开始新的导入
                      </Button>
                    ) : null}
                    {errorCount + validerrorCount && !executeCount ? (
                      <Button onClick={editErrorRecords} type="link">
                        未导入和错误的记录重新编辑
                      </Button>
                    ) : null}{' '}
                  </>
                ) : null}
              </Space>
              {executeCount ? <Progress style={{ marginBottom: 16 }} percent={percent} /> : null}
              {parentfilter && addParentFilter ? (
                <Alert
                  style={{ marginBottom: 16 }}
                  message={
                    <span>
                      {`${parentfilter.fieldtitle}『 `}
                      <b>{`${parentfilter.text} 』`}</b>
                    </span>
                  }
                  type="info"
                />
              ) : null}
              <Space style={{ paddingBottom: 16 }} size="large">
                {parentfilter ? (
                  <span>
                    加入限定条件或导航值：
                    <Switch
                      checkedChildren=" 请加入 "
                      unCheckedChildren=" 不加入 "
                      checked={addParentFilter}
                      onChange={(value) => setAddParentFilter(value)}
                    />
                  </span>
                ) : null}
                <span>
                  加入从服务端获得的缺省值：
                  <Switch
                    checkedChildren=" 请加入 "
                    unCheckedChildren=" 不加入 "
                    checked={addRemoteDefault}
                    onChange={(value) => setAddRemoteDefault(value)}
                  />
                </span>
                <span>
                  加入实体字段设置的默认值：
                  <Switch
                    checkedChildren=" 请加入 "
                    unCheckedChildren=" 不加入 "
                    checked={addDefaultValue}
                    onChange={(value) => setAddDefaultValue(value)}
                  />
                </span>
              </Space>
              {dataSource.length ? (
                <Space style={{ paddingBottom: 16 }} size="large">
                  <Badge status="default" text={`共有 ${dataSource.length} 条记录`} />
                  <Badge status="success" text={`已导入 ${successCount} 条记录`} />
                  <Badge status="warning" text={`校验错误 ${validerrorCount} 条记录`} />
                  <Badge status="error" text={`导入失败 ${errorCount} 条记录`} />
                </Space>
              ) : null}
            </div>
            <Statistic
              style={{ width: '200px', padding: 24 }}
              title="已导入记录数"
              value={allSuccessCount}
              prefix={<LikeOutlined />}
            />
          </div>
          <div style={{ padding: 16, flex: 1, backgroundColor: '#f0f2f5' }}>
            <Card style={{ height: '100%' }} bodyStyle={{ height: '100%' }}>
              {step === Steps.Init || step === Steps.CopyCliboard ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <span style={{ marginBottom: 12 }}>
                    字段顺序：{columns.map((col, index) => `${index + 1}.${col.title}`).join('  ')}
                  </span>
                  <Form style={{ flex: 1 }} initialValues={{ uploaddata: dataText }}>
                    <Form.Item noStyle name="uploaddata">
                      <Input.TextArea
                        style={{ height: '100%' }}
                        autoSize={false}
                        onChange={(element) => {
                          const { value } = element.target;
                          setDataText(value);
                          setStep(value ? Steps.CopyCliboard : Steps.Init);
                        }}
                        placeholder="请将导入的数据粘贴在此处，每行中以Tab或逗号分隔字段。可以在Excel中选择数据复制后，粘贴进来即可。"
                      />
                    </Form.Item>
                  </Form>
                </div>
              ) : null}
              {step === Steps.FirstValidate ? (
                <span>
                  <ImportGrid />
                </span>
              ) : null}
            </Card>
          </div>
        </span>
      </Drawer>
    </React.Fragment>
  );
};

export default BatchImportButton;
