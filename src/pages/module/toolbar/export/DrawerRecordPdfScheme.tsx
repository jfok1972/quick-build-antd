/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { API_HEAD } from '@/utils/request';
import { getPdfjsUrl, isSafari, onOpenInNewWindow, urlEncode } from '@/utils/utils';
import { FilePdfOutlined, SelectOutlined } from '@ant-design/icons';
import { Drawer, Tooltip } from 'antd';
import React, { useState } from 'react';
import type { ExcelSchemeState, ModuleModal } from '../../data';

interface DrawerRecordPdfSchemeParam {
  moduleInfo: ModuleModal;
  record: any;
  scheme: ExcelSchemeState;
}
/**
 * 在当前网页中以pdf方式显示一条记录的excel列表方案
 * @param param0
 */
export const DrawerRecordPdfScheme: React.FC<DrawerRecordPdfSchemeParam> = ({
  moduleInfo,
  record,
  scheme,
}) => {
  const [showpdf, setShowpdf] = useState<boolean>(false);

  const getPdfUrl = () => {
    const params: any = {
      recordids: record[moduleInfo.primarykey],
      moduleName: moduleInfo.modulename,
      schemeid: scheme.schemeid,
      title: scheme.title,
      filetype: 'pdf',
      inline: true,
    };
    // 使用浏览器内置pdf的  url
    const url = `${API_HEAD}/platform/dataobjectexport/exportexcelscheme.do?${urlEncode(params)}`;
    // 使用pdfjs的  pdfjsurl
    return getPdfjsUrl(url, `${scheme.title}.pdf`);
  };

  return (
    <Tooltip title={`预览${scheme.title}的pdf文件`}>
      <FilePdfOutlined
        onClick={() => {
          setShowpdf(true);
        }}
      />
      <Drawer
        title={
          <span style={{ display: 'flex' }}>
            <span style={{ flex: 1 }}>{`${record[moduleInfo.namefield]} 的 ${scheme.title}`}</span>
            <span style={{ marginRight: '32px' }} className="ant-drawer-close">
              <Tooltip title="在新标签页中打开pdf文件">
                <SelectOutlined
                  rotate={90}
                  onClick={() => {
                    onOpenInNewWindow(getPdfUrl(), record[moduleInfo.namefield], 'pdf');
                    setShowpdf(false);
                  }}
                />
              </Tooltip>
            </span>
          </span>
        }
        placement="right"
        closable
        visible={showpdf}
        width="80%"
        bodyStyle={{ padding: 0, margin: 0 }}
        style={{ zIndex: 1000000 }}
        onClose={() => setShowpdf(false)}
      >
        <iframe
          style={isSafari ? { height: `${document.body.clientHeight - 32 - 22}px` } : {}}
          src={getPdfUrl()}
          width="100%"
          height="100%"
          marginWidth={0}
          title="pdfpreview"
        />
      </Drawer>
    </Tooltip>
  );
};
