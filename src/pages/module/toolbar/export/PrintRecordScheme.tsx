/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Button, Card, Menu, message, Space } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { API_HEAD } from '@/utils/request';
import { setGlobalDrawerProps } from '@/layouts/BasicLayout';
import type { ModuleState, RecordPrintSchemeModal } from '../../data';
import { getModuleInfo } from '../../modules';
import { getRecordByKey } from '../../moduleUtils';

const RECORDPRINT = 'recordprint';

/**
 * 打印记录的print方案
 * @param key
 */
export const execPrintRecordScheme = ({
  moduleName,
  scheme,
  record,
}: {
  moduleName: string;
  scheme: RecordPrintSchemeModal;
  record: any;
}) => {
  const moduleInfo = getModuleInfo(moduleName);
  const props = {
    visible: true,
    style: { zIndex: 1000000 },
    bodyStyle: {
      margin: 0,
      padding: 0,
      height: '100%',
    },
    width: '800px',
    closeIcon: null,
    footer: null,
    destroyOnClose: true,
    onClose: () => setGlobalDrawerProps(() => ({ visible: false })),
    children: (
      <Card
        size="default"
        bordered={false}
        title={
          <span>
            <PrinterOutlined /> {`${record[moduleInfo.namefield]} 的 ${scheme.title}`}
          </span>
        }
        style={{ height: '100%' }}
        bodyStyle={{ padding: '8px', height: '90%' }}
        extra={
          <Space>
            <Button
              type="primary"
              onClick={() => {
                const iframe: any = document.getElementById('_printrecord_');
                iframe.contentWindow.print();
              }}
            >
              打印
            </Button>
            <Button
              onClick={() => {
                setGlobalDrawerProps(() => ({ visible: false }));
              }}
            >
              关闭
            </Button>
          </Space>
        }
      >
        <iframe
          title="_printrecord_"
          id="_printrecord_"
          src={
            `${API_HEAD}/platform/dataobjectexport/printrecord.do?` +
            `moduleName=${moduleName}&schemeId=${scheme.schemeid}&` +
            `id=${record[moduleInfo.primarykey]}&title=${moduleInfo.title}` +
            `&t=${new Date().getTime()}`
          }
          width="100%"
          height="100%"
          frameBorder={0}
        />
      </Card>
    ),
  };
  setGlobalDrawerProps(props);
};

const PrintRecordScheme = ({
  moduleState,
  setVisible,
}: {
  moduleState: ModuleState;
  setVisible: Function;
}) => {
  const { moduleName } = moduleState;
  const moduleInfo = getModuleInfo(moduleName);
  const getRecordExcelExportItems = () => {
    const { recordPrintSchemes } = moduleInfo;
    if (!recordPrintSchemes) return null;
    const result: any[] = [];
    const items: any[] = recordPrintSchemes.map((scheme) => (
      <Menu.Item
        key={`${RECORDPRINT}||${scheme.schemeid}||${scheme.title}`}
        title={scheme.title}
        icon={scheme.iconcls ? <span className={scheme.iconcls} /> : <PrinterOutlined />}
        onClick={() => {
          const { selectedRowKeys, selectedTextValue } = moduleState;
          if (selectedRowKeys.length !== 1) {
            message.warn('先选择一条记录，才能执行此导出操作！');
            return;
          }
          setVisible(false);
          execPrintRecordScheme({
            moduleName,
            scheme,
            record: getRecordByKey(
              moduleState.dataSource,
              selectedTextValue[0].value || '',
              moduleInfo.primarykey,
            ),
          });
        }}
      >
        {scheme.title}
      </Menu.Item>
    ));
    if (items.length > 0) {
      result.push(
        <Menu.ItemGroup title="记录打印方案" key="_export_record_key1_">
          {items}
        </Menu.ItemGroup>,
      );
      result.push(<Menu.Divider key="_print_record_key_div" />);
    }
    return result;
  };
  return getRecordExcelExportItems();
};

export default PrintRecordScheme;
