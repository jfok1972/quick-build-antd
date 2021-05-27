import React, { useState } from 'react';

import { Dropdown, Button, Menu, Tooltip } from 'antd';
import {
  FileExcelOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { Dispatch } from 'redux';
import type { ModuleState } from '../../data';

import SettingForm from './exportSetting';
import ExportRecordScheme from './ExportRecordScheme';
import ExportGridScheme, { downloadGridSchemeFile } from './ExportGridScheme';
import PrintRecordScheme from './PrintRecordScheme';

const { SubMenu } = Menu;

const ExportButton = ({
  moduleState,
  dispatch,
}: {
  moduleState: ModuleState;
  dispatch: Dispatch;
}) => {
  const [visible, setVisible] = useState(false);
  const menu = (
    <Menu key="exportButton">
      <Menu.Item
        key="toExcel"
        onClick={() => {
          downloadGridSchemeFile({
            moduleState,
            key: 'toExcel',
            topdf: false,
            onlyselected: false,
          });
        }}
      >
        <FileExcelOutlined />
        列表导出Excel文档
        <Tooltip title="导出pdf文件" placement="topRight">
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
                onlyselected: false,
              });
            }}
          >
            <FilePdfOutlined style={{ marginLeft: '10px' }} />
          </Button>
        </Tooltip>
      </Menu.Item>
      <Menu.Divider />
      {ExportGridScheme({ moduleState, setVisible, onlyselected: false })}
      {ExportRecordScheme({ moduleState, setVisible })}
      {PrintRecordScheme({ moduleState, setVisible })}
      <SubMenu key="sub3" title="列表导出设置" icon={<SettingOutlined />}>
        <Menu.Item style={{ padding: 0, margin: 0 }}>
          <SettingForm moduleState={moduleState} dispatch={dispatch} />
        </Menu.Item>
      </SubMenu>
    </Menu>
  );
  // <BsDownload className="anticon" />
  return (
    <Dropdown overlay={menu} visible={visible} onVisibleChange={(v: boolean) => setVisible(v)}>
      <Button>
        <DownloadOutlined /> 导出
      </Button>
    </Dropdown>
  );
};

export default ExportButton;
