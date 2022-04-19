/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { CSSProperties } from 'react';
import React, { useEffect, useState } from 'react';
import { Descriptions, Card, Popover, Tag, Space, Tooltip, Tabs, Typography, Rate } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  BlockOutlined,
  LoadingOutlined,
  DownloadOutlined,
  DownOutlined,
  RightOutlined,
  InfoCircleOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
// https://github.com/Caldis/react-zmage
import Zmage from 'react-zmage';
import type { Dispatch } from 'redux';
import { apply, getLastLevelLabel, getNumberDigitsFormat } from '@/utils/utils';
import type { ModuleModal, ModuleFieldType } from '../data';
import { fetchObjectRecord, downloadRecordExcel, fetchObjectRecordSync } from '../service';
import {
  getModuleInfo,
  addParentAdditionField,
  getFieldDefine,
  addChildAdditionField,
} from '../modules';
import { AttachemntRenderer } from '../attachment/utils';
import styles from './index.less';
import columnStyles from '../grid/columnFactory.less';
import { getModuleNameFromOneToMany } from '../moduleUtils';
import { isStartProcess, getApproveSteps, getApproveIconClass } from '../approve/utils';
import DetailGrid from '../detailGrid';
import { DrawerRecordPdfScheme } from '../toolbar/export/DrawerRecordPdfScheme';
import ProgressField from '../form/field/ProgressField';
import { isAudited } from '../audit/utils';
import { execPrintRecordScheme } from '../toolbar/export/PrintRecordScheme';
import { AuditFinished, AuditWaititng, NOIMAGE_PNG } from '../constants';
import { getBusinessDescriptionItemRender } from './itemBusinessRender';
import { getOneToManyInfoButton } from '../form/formFactory';

const { TabPane } = Tabs;
const { Text } = Typography;
const numeral = require('numeral');

const yes = (
  <Text type="success">
    <CheckOutlined />
  </Text>
);
const no = (
  <Text type="danger">
    <CloseOutlined />
  </Text>
);
const booleannull = <Text type="warning">〇</Text>;

const numberStyle: React.CSSProperties = {
  color: 'blue',
  textAlign: 'right',
  display: 'block',
  minWidth: '80px',
  whiteSpace: 'nowrap',
};

const getDateValue = (value: any) => {
  return (
    <span style={{ color: '#a40', whiteSpace: 'nowrap' }}>
      {value ? value.substr(0, 10) : null}
    </span>
  );
};

const getDatetimeValue = (value: any, field: ModuleFieldType) => {
  return (
    <span style={{ color: '#a40', whiteSpace: 'nowrap' }}>
      {value ? value.substr(0, field.disableSecond === false ? 19 : 16) : null}
    </span>
  );
};

const getRateValue = (value: number) => {
  return <Rate disabled value={value} />;
};

const getIntegerValue = (
  value: number,
  field: ModuleFieldType,
  {
    moduleInfo,
    dispatch,
    record,
    formFieldDefine,
  }: { moduleInfo: ModuleModal; dispatch: any; record: any; formFieldDefine: any },
) => {
  return (
    <span style={numberStyle}>
      {value || ''}{' '}
      {field.unittext ? (
        <span style={{ color: 'green' }}>
          {field.unittext}
          {field.aggregate
            ? getOneToManyInfoButton(record, {
                fieldtitle: field.fieldtitle,
                // fieldname: field.fieldname,
                childModuleName: formFieldDefine.additionObjectname,
                fieldahead: formFieldDefine.fieldahead,
                moduleInfo,
                dispatch,
              })
            : null}
        </span>
      ) : (
        ''
      )}
    </span>
  );
};

const getDoubleValue = (
  value: number,
  field: ModuleFieldType,
  {
    moduleInfo,
    dispatch,
    record,
    formFieldDefine,
  }: { moduleInfo: ModuleModal; dispatch: any; record: any; formFieldDefine: any },
) => {
  const numberFormat = getNumberDigitsFormat(field.digitslen);
  return (
    <span style={numberStyle}>
      {value ? numeral(value).format(numberFormat) : ''}{' '}
      {field.unittext ? (
        <span style={{ color: 'green' }}>
          {field.unittext}
          {field.aggregate
            ? getOneToManyInfoButton(record, {
                fieldtitle: field.fieldtitle,
                // fieldname: field.fieldname,
                childModuleName: formFieldDefine.additionObjectname,
                fieldahead: formFieldDefine.fieldahead,
                moduleInfo,
                dispatch,
              })
            : null}
        </span>
      ) : (
        ''
      )}
    </span>
  );
};

const getPercentValue = (value: number, field: ModuleFieldType) => {
  return (
    <ProgressField style={{ minWidth: '80px' }} value={value} symbol digitslen={field.digitslen} />
  );
  // return <span style={numberStyle}>{value ? numeral(value * 100).format('0,0.00') : ''} %</span>
};

const getOneToManyValue = (
  value: number,
  field: ModuleFieldType,
  { moduleInfo, dispatch, record }: { moduleInfo: ModuleModal; dispatch: any; record: any },
) => {
  return (
    <span style={numberStyle}>
      {value}
      <span style={{ color: 'green' }}>
        {` ${field.unittext || '条'}`}
        {getOneToManyInfoButton(record, {
          fieldtitle: field.fieldtitle,
          // fieldname: field.fieldname,
          childModuleName: field.fieldtype.substring(
            field.fieldtype.indexOf('<') + 1,
            field.fieldtype.indexOf('>'),
          ),
          fieldahead: field.fieldahead as string,
          moduleInfo,
          dispatch,
        })}
      </span>
    </span>
  );
};

/**
 * 取得显示记录信息右上角的附件按钮
 *
 * @param param0
 *   isLink = true  表示生成一个链接，否则是默认颜色的文字
 */
const getAttachmentButton = ({
  moduleInfo,
  record,
  dispatch,
}: {
  moduleInfo: ModuleModal;
  record: any;
  dispatch: Dispatch;
}) => {
  if (moduleInfo.moduleLimit.hasattachment && moduleInfo.userLimit.attachment?.query) {
    return (
      <AttachemntRenderer
        value={record?.attachmentdata}
        record={record}
        _recno={0}
        moduleInfo={moduleInfo}
        dispatch={dispatch}
        isLink={false}
        readonly
        key="_attachment_button_"
      />
    );
  }
  return null;
};

let descVisible = {}; // 存放所有可折叠面版的折叠属性

interface DescriptionFormProps {
  moduleInfo: ModuleModal;
  record: object;
  dispatch: Dispatch;
}

const DescriptionForm: React.FC<DescriptionFormProps> = ({ moduleInfo, record, dispatch }) => {
  const scheme = moduleInfo.formschemes[0];
  const [, setV] = useState({});
  const genarateDetails = (details: any) => {
    details.forEach((panel: any) => {
      // 如果初始是折叠的，置为false
      if (descVisible[panel.detailid] === undefined && panel.collapsible) {
        descVisible[panel.detailid] = !panel.collapsed;
      }
    });
    return details.map((panel: any) => {
      const onCollsped = () => {
        descVisible = {
          ...descVisible,
          [panel.detailid]: !descVisible[panel.detailid],
        };
        setV({}); // 强制刷新当前组件
      };
      const collspaed = panel.collapsible && !descVisible[panel.detailid];
      let dpanel: any;
      let { title } = panel;
      if (panel.xtype === 'approvepanel') {
        // if (canApprove(record)) {
        //     const getCardProps = (title: string, defaultIcon: any = null) => {
        //         return {
        //             key: panel.detailid,
        //             size: 'small',      //'middle','large'
        //             bordered: true,
        //             title: <Space>{defaultIcon}<span >{`${title}`}</span></Space>,
        //         }
        //     }
        //     const cardParams: any = getCardProps(title || '流程任务审批', <AuditOutlined />);
        //     return <Card {...cardParams} >
        //         <span>
        //             <ApproveForm moduleInfo={moduleInfo} dispatch={dispatch} record={record} />
        //         </span>
        //     </Card >
        // } else
        return null;
      }
      if (panel.xtype === 'tabpanel') {
        panel.details.forEach((tab: any) => {
          apply(tab, { tabTitle: tab.title });
        });
        const children: any = genarateDetails(panel.details);
        const tabs: any = [];
        for (let index = 0; index < panel.details.length; index += 1) {
          const detail = panel.details[index];
          tabs.push(
            <TabPane
              key={detail.detailid}
              tab={
                detail.iconCls ? (
                  <span className={detail.iconCls}> {detail.tabTitle} </span>
                ) : (
                  detail.tabTitle
                )
              }
            >
              {children[index]}
            </TabPane>,
          );
        }
        return (
          <Tabs key={panel.detailid} tabPosition={panel.tabPosition || 'top'} centered={false}>
            {tabs}
          </Tabs>
        );
      }
      if (panel.xtype === 'approvehistory') {
        if (!title) title = '流程审批记录';
        if (moduleInfo.moduleLimit.hasapprove && isStartProcess(record))
          dpanel = (
            <div style={{ padding: '12px' }}>
              {getApproveSteps({
                record,
                dispatch,
                direction: 'horizontal',
                breakNumber: panel.breakNumber,
              })}
            </div>
          );
        else return null;
      } else if (panel.subobjectid) {
        // 子模块
        const { subobjectid, fieldahead } = panel;
        const config = {
          moduleName: subobjectid,
          parentOperateType: 'display', // 父模块的form当前操作类型
          readOnly: true,
          parentFilter: {
            moduleName: moduleInfo.objectname, // 父模块的名称
            fieldahead: fieldahead.split('.with.')[1],
            fieldName: moduleInfo.primarykey, // 父模块的限定字段,父模块主键
            fieldtitle: moduleInfo.title, // 父模块的标题
            operator: '=',
            text: record[moduleInfo.namefield],
            fieldvalue: record[moduleInfo.primarykey], // 父模块的记录id
          },
        };
        const subModuleInfo = getModuleInfo(config.moduleName);
        title = subModuleInfo.title;
        dpanel = (
          <div style={{ paddingTop: '12px' }}>
            <DetailGrid {...config} />
          </div>
        );
      } else if (panel.xtype === 'panel') {
        return genarateDetails(panel.details);
      } else if (panel.xtype === 'fieldset')
        /* eslint-disable */
        dpanel = generatePanel({ panel, moduleInfo, record, dispatch });
      const icon = panel.collapsible ? (
        descVisible[panel.detailid] ? (
          <DownOutlined onClick={onCollsped} />
        ) : (
          <RightOutlined onClick={onCollsped} />
        )
      ) : (
        <BlockOutlined />
      );
      /* eslint-enable */
      return (
        <Card
          size="small"
          key={panel.detailid}
          bordered
          bodyStyle={collspaed ? { padding: 0 } : { margin: '-1px -1px -1px -1px', padding: 0 }}
          className="desc_card_border_top"
          title={
            !panel.tabTitle && title && !panel.hiddenTitle ? (
              <Space>
                {icon}
                <span>{`${title}`}</span>
              </Space>
            ) : null
          }
        >
          <div style={collspaed ? { display: 'none' } : {}}>{dpanel}</div>
        </Card>
      );
    });
  };
  return <>{genarateDetails(scheme.details)}</>;
};

const Description = ({
  moduleInfo,
  record,
  dispatch,
  disableTitle,
  setVisible,
  isRecordExpand,
}: {
  moduleInfo: ModuleModal;
  record: any;
  dispatch: Dispatch;
  disableTitle?: boolean;
  setVisible?: Function;
  isRecordExpand?: boolean;
}) => {
  if (record === null) return null;
  const { modulename: moduleName, primarykey } = moduleInfo;
  const { excelSchemes } = moduleInfo;
  let downloadtips: any[] = [];
  if (excelSchemes && excelSchemes.length > 0) {
    // 只加入第一个，全部加入比较乱
    const scheme = excelSchemes[0];
    const download = (filetype: any) => {
      downloadRecordExcel({
        recordids: record[primarykey],
        moduleName: moduleInfo.modulename,
        schemeid: scheme.schemeid,
        filetype,
      });
    };
    downloadtips = [
      scheme.onlypdf ? null : (
        <Tooltip title={`导出${scheme.title}`} key="_download_">
          <DownloadOutlined
            onClick={() => {
              download(null);
            }}
          />
        </Tooltip>
      ),
      // 这个按钮加上，按钮太多了，可以在预览中下载
      // <Tooltip title={`导出${scheme.title}的pdf文件`} key='_exportfilepdf_'>
      //     <FilePdfOutlined onClick={
      //         () => { download('pdf') }} /></Tooltip>,
      <DrawerRecordPdfScheme
        moduleInfo={moduleInfo}
        record={record}
        scheme={scheme}
        key="_recordpdf_"
      />,
    ];
  }
  const getRecordPrintScheme = () => {
    const { recordPrintSchemes } = moduleInfo;
    if (recordPrintSchemes && recordPrintSchemes.length > 0) {
      return recordPrintSchemes.map((scheme) => (
        <Tooltip title={`打印${scheme.title}`} key="_printrecord_">
          <PrinterOutlined
            onClick={() => {
              execPrintRecordScheme({
                moduleName,
                scheme,
                record,
              });
            }}
          />
        </Tooltip>
      ));
    }
    return null;
  };
  const getTooltip = () => {
    const tooltips: any[] = [
      getAttachmentButton({ moduleInfo, record, dispatch }),
      ...downloadtips,
      getRecordPrintScheme(),
      setVisible ? (
        <Tooltip title="关闭" key="_close_">
          <CloseOutlined onClick={() => setVisible(false)} />
        </Tooltip>
      ) : null,
    ];
    return tooltips.filter((tip: any) => tip);
  };
  const scheme = moduleInfo.formschemes[0];
  const width = scheme.popoverWidth || 'auto';
  return (
    <Card
      size="default"
      title={
        disableTitle ? null : (
          <Space>
            {' '}
            {`${moduleInfo.title}：${record[moduleInfo.namefield]}`}
            {moduleInfo.moduleLimit.hasapprove && record[primarykey] ? (
              <Typography.Text type="secondary" code>
                <span
                  className={getApproveIconClass(moduleInfo, record)}
                  style={{ marginRight: '4px' }}
                />
                {record.actProcState}
              </Typography.Text>
            ) : null}
            {
              /* eslint-disable */
              moduleInfo.moduleLimit.hasaudit && record[primarykey]
                ? !isAudited(record)
                  ? AuditWaititng
                  : AuditFinished
                : null
              /* eslint-enable */
            }
          </Space>
        )
      }
      className="descriptionform"
      style={isRecordExpand ? {} : { maxWidth: `${document.body.clientWidth - 32}px`, width }}
      key={`key_${record[moduleInfo.primarykey]}`}
      bodyStyle={{ padding: 0, margin: -1 }}
      extra={
        disableTitle ? null : (
          <Space style={{ marginLeft: '24px', verticalAlign: 'middle' }}>{getTooltip()}</Space>
        )
      }
    >
      <DescriptionForm moduleInfo={moduleInfo} record={record} dispatch={dispatch} />
    </Card>
  );
};

/**
 * 气泡显示一个模块的记录信息，如果有children那么链接值就是children
 * 同步显示，先读取记录再显示，就不会有闪动的效果了
 * @param param0
 */
export const PopoverDescriptionWithId = ({
  moduleInfo,
  id,
  dispatch,
  children,
}: {
  moduleInfo: ModuleModal;
  id: string;
  dispatch: Dispatch | any;
  children?: any;
}) => {
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState(null);
  return id ? (
    <Popover
      trigger="click"
      key={moduleInfo.modulename + id}
      destroyTooltipOnHide
      visible={visible}
      onVisibleChange={(v) => {
        if (v && !record) {
          const { data } = fetchObjectRecordSync({ objectname: moduleInfo.modulename, id });
          setRecord(data);
        }
        setVisible(v);
      }}
      // 加入loading...是因为title和content都为空，则Popover不显示了
      content={
        record === undefined
          ? '无权查看详细信息'
          : Description({ moduleInfo, record, dispatch, setVisible }) || 'Loading......'
      }
    >
      {children || (
        <span className={styles.manytooneinfo}>
          <InfoCircleOutlined style={{ paddingLeft: '2px' }} />
        </span>
      )}
    </Popover>
  ) : null;
};

const maxTagCount = 5;
const getManyToManyValue = (value: any[], field: ModuleFieldType, dispatch: Dispatch) => {
  // manyToMany 另一端的模块名称，模块的字段名为Set<modulename>,或
  // List<module>,利用正则表达式，取得<>之间的内容。
  if (!value) return null;
  const manyToManyModuleName = getModuleNameFromOneToMany(field.fieldtype);
  const moduleInfo = getModuleInfo(manyToManyModuleName);
  const records: any[] = value;
  const getTag = (record: any) => (
    <PopoverDescriptionWithId id={record.key} moduleInfo={moduleInfo} dispatch={dispatch}>
      <Tag className={columnStyles.manytomanytag}>{record.title}</Tag>
    </PopoverDescriptionWithId>
  );
  let result: any[] = [];
  if (records.length <= maxTagCount)
    result = records.map((record: any) => {
      return getTag(record);
    });
  else {
    result = records
      .filter((_, index) => index < maxTagCount)
      .map((record: any) => {
        return getTag(record);
      });
    result.push(
      <Popover
        title={`其他${records.length - maxTagCount}个${moduleInfo.title}`}
        trigger="click"
        content={
          <div style={{ maxWidth: '600px' }}>
            <Space size={[0, 5]} wrap>
              {records
                .filter((_, index) => index >= maxTagCount)
                .map((record: any) => {
                  return getTag(record);
                })}
            </Space>
          </div>
        }
      >
        <Tag style={{ cursor: 'pointer' }} color="processing">
          更多...
        </Tag>
      </Popover>,
    );
  }
  return <div>{result}</div>;
};

const getImageItem = (value: string, field: any, formFieldDefine: any) => {
  const imageStyle = {
    width: formFieldDefine.imageWidth || 96,
    height: formFieldDefine.imageHeight || 96,
    style: formFieldDefine.imageStyle || { borderRadius: '8px' },
  };
  return value ? (
    <div style={{ textAlign: 'center' }}>
      <Zmage
        zIndex={19260817}
        {...imageStyle}
        controller={{
          close: true, // 关闭按钮
          zoom: true, // 缩放按钮
          download: true, // 下载按钮
          rotate: true, // 旋转按钮
          flip: true, // 翻页按钮
          pagination: true, // 多页指示
        }}
        animate={{ flip: 'fade' }}
        src={value ? `data:image/jpeg;base64,${value}` : NOIMAGE_PNG}
        alt={field.fieldtitle}
      />
    </div>
  ) : (
    <div style={{ textAlign: 'center' }}>
      <img alt="" {...imageStyle} width={32} height={32} src={NOIMAGE_PNG} />
    </div>
  );
};

export const getBooleanText = (value: boolean) => {
  if (value === null || value === undefined) return booleannull;
  return value ? yes : no;
};

const itemStyles: CSSProperties = {
  whiteSpace: 'pre-line',
  minWidth: '40px',
  // 加上下面的一行则不允许换行
  // wordBreak: 'keep-all',
};

const generateField = ({
  item,
  moduleInfo,
  record,
  dispatch,
}: {
  item: any;
  moduleInfo: ModuleModal;
  record: object;
  dispatch: Dispatch;
}) => {
  let field: ModuleFieldType = getFieldDefine(item.fieldid, moduleInfo);
  if (field === null) {
    if (item.fieldahead) {
      // 如果是父模的其他字段或者祖父模块
      if (item.aggregate) {
        field = addChildAdditionField(moduleInfo, item);
      } else {
        // 生成manytoone,onetoonefield
        field = addParentAdditionField(moduleInfo, item);
      }
    }
  }
  if (!field.fieldname) {
    apply(field, {
      fieldname: item.additionFieldname,
      fieldtitle: '', // item.title || item.defaulttitle,
      fieldtype: item.aggregate === 'count' ? 'Integer' : 'string',
      unittext: item.aggregate === 'count' ? '条' : undefined,
    });
  }
  if (field.ishidden || field.isdisable) return null;
  let value: any = record[field.fieldname];

  // 如果有自定义的渲染
  const render = getBusinessDescriptionItemRender(moduleInfo.modulename, field.fieldname);
  if (render) value = render({ value, record, dataIndex: field.fieldname, dispatch });
  else if (field.fDictionaryid) value = record[`${field.fieldname}_dictname`];
  else if (field.fieldname === moduleInfo.namefield) value = <b>{value}</b>;
  else if (field.isManyToOne) {
    value = record[field.manyToOneInfo.nameField];
    const id = record[field.manyToOneInfo.keyField];
    return (
      <Descriptions.Item
        key={item.fieldid}
        label={getLastLevelLabel(field.fieldtitle)}
        span={item.colspan || 1}
      >
        {value}
        {value ? (
          <span style={{ float: 'right' }}>
            <PopoverDescriptionWithId
              id={id}
              dispatch={dispatch}
              moduleInfo={getModuleInfo(field.fieldtype)}
            />
          </span>
        ) : null}
      </Descriptions.Item>
    );
  } else if (field.isOneToMany) {
    value = getOneToManyValue(value, field, {
      moduleInfo,
      dispatch,
      record,
    });
  } else if (field.isManyToMany) {
    value = getManyToManyValue(record[`${field.fieldname}_detail`], field, dispatch);
  } else
    switch (field.fieldtype.toLowerCase()) {
      case 'money':
      case 'double':
      case 'float':
        value = getDoubleValue(value, field, {
          moduleInfo,
          dispatch,
          record,
          formFieldDefine: item,
        });
        break;
      case 'integer':
        if (field.isRate) value = getRateValue(value);
        else
          value = getIntegerValue(value, field, {
            moduleInfo,
            dispatch,
            record,
            formFieldDefine: item,
          });
        break;
      case 'percent':
        value = getPercentValue(value, field);
        break;
      case 'date':
        value = getDateValue(value);
        break;
      case 'datetime':
      case 'timestamp':
        value = getDatetimeValue(value, field);
        break;
      case 'image':
        value = getImageItem(value, field, item);
        break;
      case 'boolean':
        value = getBooleanText(value);
        break;
      default:
    }
  return (
    <Descriptions.Item
      key={item.fieldid}
      label={getLastLevelLabel(field.fieldtitle)}
      span={item.colspan || 1}
      style={itemStyles}
    >
      {value}
    </Descriptions.Item>
  );
};

const generatePanel = ({
  panel,
  moduleInfo,
  record,
  dispatch,
  noborder,
  style,
}: {
  panel: any;
  moduleInfo: ModuleModal;
  record: object;
  dispatch: Dispatch;
  noborder?: boolean;
  style?: CSSProperties;
}) => {
  return panel.details && panel.details.length ? (
    <Descriptions
      bordered
      style={style}
      className={noborder ? 'noborder' : 'border'}
      column={
        panel.cols === 1 ? { lg: 1, md: 1, sm: 1, xs: 1 } : { lg: panel.cols, md: 2, sm: 1, xs: 1 }
      }
      size="small"
    >
      {panel.details.map((item: any) => {
        if (item.fieldid) return generateField({ item, moduleInfo, record, dispatch });
        if (item.xtype === 'panel') {
          return (
            <Descriptions.Item
              className="hiddenlabel"
              key={item.detailid}
              span={item.colspan || 1}
              style={{ padding: 0, border: '0px solid #f0f0f0 !important' }}
            >
              {generatePanel({ panel: item, moduleInfo, record, dispatch, noborder: true })}
            </Descriptions.Item>
          );
        }
        return (
          <Descriptions.Item key={item.detailid} span={item.colspan || 1} label="未定义的容器">
            未定义的容器
          </Descriptions.Item>
        );
      })}
    </Descriptions>
  ) : null;
};

/**
 * 气泡显示一个模块的记录信息，如果有children那么链接值就是children
 * 异步显示，会有一个闪烁的效果，看的有点头晕
 * @param param0
 */
export const PopoverDescriptionWithIdAsync = ({
  moduleInfo,
  id,
  dispatch,
  children,
}: {
  moduleInfo: ModuleModal;
  id: string;
  dispatch: Dispatch;
  children?: any;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <Popover
      trigger="click"
      key={moduleInfo.modulename + id}
      visible={visible}
      onVisibleChange={(v) => setVisible(v)}
      /* eslint-disable */
      content={
        <DescriptionWithId
          moduleInfo={moduleInfo}
          id={id}
          dispatch={dispatch}
          setVisible={setVisible}
        />
      }
      /* eslint-enable */
    >
      {children || (
        <span className={styles.manytooneinfo}>
          <InfoCircleOutlined />
        </span>
      )}
    </Popover>
  );
};

/**
 * 根据id读取数据，然后显示模块记录信息
 * 异步
 * @param param0
 */
const DescriptionWithId = ({
  moduleInfo,
  id,
  dispatch,
  setVisible,
}: {
  moduleInfo: ModuleModal;
  id: string;
  dispatch: Dispatch;
  setVisible?: Function;
}) => {
  const [record, setRecord] = useState({ __loading__: true });
  useEffect(() => {
    fetchObjectRecord({ objectname: moduleInfo.modulename, id }).then((response: any) => {
      setRecord(response.data);
    });
  }, []);
  return record[moduleInfo.primarykey] ? (
    Description({ moduleInfo, record, dispatch, setVisible })
  ) : (
    <>
      <LoadingOutlined /> 读取中......
    </>
  );
};

export const PopoverDescription = ({
  moduleInfo,
  record,
  dispatch,
  children,
}: {
  moduleInfo: ModuleModal;
  record: any;
  dispatch: Dispatch;
  children?: any;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <Popover
      trigger="click"
      destroyTooltipOnHide
      visible={visible}
      onVisibleChange={(v) => setVisible(v)}
      content={
        <Description
          moduleInfo={moduleInfo}
          record={record}
          dispatch={dispatch}
          setVisible={setVisible}
        />
      }
    >
      {children || (
        <span className={styles.manytooneinfo}>
          <InfoCircleOutlined />
        </span>
      )}
    </Popover>
  );
};

export const SimpleDescription = ({
  moduleInfo,
  record,
  dispatch,
  disableTitle,
  isRecordExpand,
}: {
  moduleInfo: ModuleModal;
  record: any;
  dispatch: Dispatch;
  disableTitle?: boolean;
  isRecordExpand?: boolean;
}) => {
  return (
    <Description
      moduleInfo={moduleInfo}
      record={record}
      disableTitle={disableTitle}
      dispatch={dispatch}
      isRecordExpand={isRecordExpand}
    />
  );
};

export default Description;
