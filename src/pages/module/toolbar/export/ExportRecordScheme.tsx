/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Button, Menu, message, Tooltip } from 'antd';
import { FilePdfOutlined, FileTextOutlined, SelectOutlined } from '@ant-design/icons';
import { getPdfjsUrl, onOpenInNewWindow, urlEncode } from '@/utils/utils';
import { API_HEAD } from '@/utils/request';
import type { ModuleState } from '../../data';
import { downloadRecordExcel } from '../../service';
import { getModuleInfo } from '../../modules';

const RECOREXPORT = 'recordexport';

const ExportRecordScheme = ({
  moduleState,
  setVisible,
}: {
  moduleState: ModuleState;
  setVisible: Function;
}) => {
  const { moduleName } = moduleState;
  const moduleInfo = getModuleInfo(moduleName);
  /**
   * 导出记录excel或者word方案，可以下载，或者PDF。
   * @param key
   */
  const recordExport = ({
    schemeid,
    title,
    topdf,
    openinwindow,
  }: {
    schemeid: string;
    title: string;
    topdf: boolean;
    openinwindow: boolean;
  }) => {
    const { selectedRowKeys, selectedTextValue } = moduleState;
    if (selectedRowKeys.length === 0) {
      message.warn('请至少选择一条记录，才能执行此导出操作！');
      return;
    }
    const params: any = {
      recordids: selectedRowKeys.join(','),
      moduleName,
      schemeid,
      title,
      filetype: topdf ? 'pdf' : null,
      inline: openinwindow,
    };
    if (openinwindow) {
      const url = `${API_HEAD}/platform/dataobjectexport/exportexcelscheme.do?${urlEncode(params)}`;
      const windowtitle = `${
        selectedTextValue[0].text +
        (selectedRowKeys.length === 1 ? '' : `等${selectedTextValue.length}条记录`)
      }的${title}`;
      const pdfjsurl = getPdfjsUrl(url, `${windowtitle}.pdf`);
      onOpenInNewWindow(pdfjsurl, windowtitle, 'pdf');
    } else downloadRecordExcel(params);
  };
  const getRecordExcelExportItems = () => {
    const { excelSchemes } = moduleInfo;
    const result: any[] = [];
    const items: any[] = excelSchemes.map((scheme) => (
      <Menu.Item
        key={`${RECOREXPORT}||${scheme.schemeid}||${scheme.title}`}
        title={scheme.title}
        icon={scheme.onlypdf ? <FilePdfOutlined /> : <FileTextOutlined />}
        onClick={() => {
          recordExport({
            schemeid: scheme.schemeid,
            title: scheme.title,
            topdf: scheme.onlypdf || false,
            openinwindow: false,
          });
        }}
      >
        {scheme.title}
        <Tooltip title="下载pdf文件" placement="topRight">
          <Button
            style={{ float: 'right', marginRight: '0px', paddingRight: '0px' }}
            type="link"
            size="small"
            onClick={(e: any) => {
              e.stopPropagation();
              setVisible(false);
              recordExport({
                schemeid: scheme.schemeid,
                title: scheme.title,
                topdf: true,
                openinwindow: false,
              });
            }}
          >
            <FilePdfOutlined />
          </Button>
        </Tooltip>
        <Tooltip title="新窗口中打开pdf文件" placement="topRight">
          <Button
            style={{ float: 'right', margin: '0px', padding: '0px' }}
            type="link"
            size="small"
            onClick={(e: any) => {
              e.stopPropagation();
              setVisible(false);
              recordExport({
                schemeid: scheme.schemeid,
                title: scheme.title,
                topdf: true,
                openinwindow: true,
              });
            }}
          >
            <SelectOutlined rotate={90} style={{ marginLeft: '10px' }} />
          </Button>
        </Tooltip>
      </Menu.Item>
    ));
    if (items.length > 0) {
      result.push(
        <Menu.ItemGroup title="记录导出方案" key="_export_record_key_">
          {items}
        </Menu.ItemGroup>,
      );
      result.push(<Menu.Divider key="_export_record_key_div" />);
    }
    return result;
  };
  return getRecordExcelExportItems();
};

export default ExportRecordScheme;
