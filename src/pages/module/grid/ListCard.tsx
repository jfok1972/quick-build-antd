/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { getAwesomeIcon, templateReplace } from '@/utils/utils';
import { BarsOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { Card, Image, List, Tooltip } from 'antd';
import Avatar from 'antd/lib/avatar/avatar';
import classNames from 'classnames';
import { approveRenderer, approveVActRuTaskRenderer } from '../approve/utils';
import { attachemntRenderer } from '../attachment/utils';
import { auditRenderer } from '../audit/utils';
import type { ModuleModal, ModuleState } from '../data';
import { PopoverDescription } from '../descriptions';
import { getFieldDefine, hasDelete, hasEdit } from '../modules';
import { downloadRecordExcel } from '../service';
import { DrawerRecordPdfScheme } from '../toolbar/export/DrawerRecordPdfScheme';
import { execPrintRecordScheme } from '../toolbar/export/PrintRecordScheme';
import { DeleteAction, DisplayAction, EditAction, getAdditionFunction } from './actions';
import { getBusinessColumnRender } from './columnBusinessRender';
import styles from './listcard.less';
import { ListCardBusinessRender } from './listCardBusinessRender';

const marked = require('marked');

interface ListCardProps {
  moduleState: ModuleState;
  moduleInfo: ModuleModal;
  dispatch: any;
  paginationProps: any;
  selectRow: Function;
  size: string;
}

export const ListCard: React.FC<ListCardProps> = ({
  moduleState,
  moduleInfo,
  dispatch,
  paginationProps,
  selectRow,
  size,
}) => {
  const grid = {
    gutter: 16,
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 3,
    xxl: 3,
    // xxl: moduleState.currSetting.navigate.visible ? 3 : 4,
  };
  const key = `listgridkey${!!moduleState.currSetting.navigate.visible}`;
  const renderItem = (record: any, index: number) => {
    const actions: any[] = [];
    const param = {
      dispatch,
      moduleInfo,
      moduleState,
      record,
    };
    const getRecordExcelScheme = () => {
      const { excelSchemes } = moduleInfo;
      const result = [];
      if (excelSchemes && excelSchemes.length > 0) {
        // 只加入第一个，全部加入比较乱
        const ascheme = excelSchemes[0];
        const download = (filetype: any) => {
          downloadRecordExcel({
            recordids: record[moduleInfo.primarykey],
            moduleName: moduleInfo.modulename,
            schemeid: ascheme.schemeid,
            filetype,
          });
        };
        if (!ascheme.onlypdf)
          result.push(
            <Tooltip title={`导出${ascheme.title}`} key="_download_">
              <DownloadOutlined
                onClick={() => {
                  download(null);
                }}
              />
            </Tooltip>,
          );
        result.push(
          <DrawerRecordPdfScheme
            moduleInfo={moduleInfo}
            record={record}
            scheme={ascheme}
            key="_recordpdf_"
          />,
        );
        return result;
      }
      return [];
    };
    const getRecordPrintScheme = () => {
      const { recordPrintSchemes } = moduleInfo;
      if (recordPrintSchemes && recordPrintSchemes.length > 0) {
        return recordPrintSchemes.map((ascheme) => (
          <Tooltip title={`打印${ascheme.title}`} key="_printrecord_">
            <PrinterOutlined
              onClick={() => {
                execPrintRecordScheme({
                  moduleName: moduleState.moduleName,
                  scheme: ascheme,
                  record,
                });
              }}
            />
          </Tooltip>
        ));
      }
      return [];
    };
    // 审批
    if (moduleInfo.moduleLimit.hasapprove)
      actions.push(
        <span>
          {moduleState.moduleName === 'VActRuTask'
            ? approveVActRuTaskRenderer({
                value: undefined,
                record,
                _recno: index,
                moduleState,
                dispatch,
              })
            : approveRenderer({ value: undefined, record, _recno: index, moduleState, dispatch })}
        </span>,
      );
    // 审核
    if (moduleInfo.moduleLimit.hasaudit)
      actions.push(
        auditRenderer({ value: undefined, record, _recno: index, moduleState, dispatch }),
      );
    actions.push(...(getRecordExcelScheme() as any[]));
    actions.push(...(getRecordPrintScheme() as any[]));
    actions.push(
      ...(getAdditionFunction({
        moduleInfo,
        moduleState,
        dispatch,
        record,
      }) as unknown as any[]),
    );
    actions.push(<DisplayAction {...param} />);
    if (hasEdit(moduleInfo)) actions.push(<EditAction {...param} />);
    if (hasDelete(moduleInfo)) actions.push(<DeleteAction {...param} />);
    // 最少要有6个，这样按钮不会太宽
    for (let i = actions.length; i < 6; i += 1) actions.splice(0, 0, null);
    const businessRender = getBusinessColumnRender(moduleState.moduleName, moduleInfo.namefield);
    const selected = moduleState.selectedRowKeys.includes(record[moduleInfo.primarykey]);
    return (
      <List.Item
        className={classNames({
          selected,
          notselected: !selected,
        })}
      >
        <Card.Grid>
          <Card
            size={moduleState.currSetting.gridSize === 'small' ? 'small' : 'default'}
            onClick={() => {
              selectRow(record);
            }}
            bordered={false}
            actions={actions}
            key={`${moduleState.moduleName}--${record[moduleInfo.primarykey]}`}
          >
            <Card.Meta
              avatar={
                record.favicon || record.iconfile ? (
                  <Avatar
                    className="hiddedeyes"
                    src={
                      <Image src={`data:image/jpeg;base64,${record.favicon || record.iconfile}`} />
                    }
                  />
                ) : (
                  <Avatar
                    // 没有 src 的情况下会显示 icon
                    icon={
                      moduleInfo.iconcls ? getAwesomeIcon(moduleInfo.iconcls) : <BarsOutlined />
                    }
                  />
                )
              }
              title={[
                moduleInfo.moduleLimit.hasattachment && moduleInfo.userLimit.attachment?.query && (
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 300,
                      marginLeft: '12px',
                      float: 'right',
                    }}
                  >
                    {attachemntRenderer({ record, _recno: index, moduleInfo, dispatch })}
                  </span>
                ),
                businessRender ? (
                  businessRender({
                    value: record[moduleInfo.namefield],
                    record,
                    recno: index,
                    dataIndex: moduleInfo.namefield,
                    fieldDefine: getFieldDefine(moduleInfo.namefield, moduleInfo),
                    dispatch,
                    moduleState,
                  })
                ) : (
                  <PopoverDescription
                    moduleInfo={moduleInfo}
                    dispatch={dispatch}
                    record={record}
                    key={`pd--${moduleState.moduleName}--${record[moduleInfo.primarykey]}`}
                  >
                    <a className={'title'}>{record[moduleInfo.namefield]}</a>
                  </PopoverDescription>
                ),
              ]}
              description={
                ListCardBusinessRender[moduleState.moduleName] ? (
                  ListCardBusinessRender[moduleState.moduleName]({
                    moduleInfo,
                    moduleState,
                    dispatch,
                    record,
                    recno: index,
                  })
                ) : (
                  <span className="markdowncard">
                    <span
                      className="markdown"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(templateReplace(moduleInfo.tooltiptpl || '', record)),
                      }}
                    />
                  </span>
                )
              }
            />
          </Card>
        </Card.Grid>
      </List.Item>
    );
  };
  return (
    <List
      style={{ marginBottom: '16px' }}
      key={key}
      className={styles.listcard}
      grid={grid}
      dataSource={moduleState.dataSource}
      pagination={{ ...paginationProps, position: undefined, size }}
      renderItem={renderItem}
    />
  );
};
