/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useState } from 'react';
import { getFileExt, apply, isSafari, getPdfjsUrl, onOpenInNewWindow } from '@/utils/utils';
import {
  FileAddOutlined,
  UploadOutlined,
  CloudDownloadOutlined,
  OrderedListOutlined,
  DatabaseOutlined,
  TableOutlined,
  PaperClipOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  SelectOutlined,
  MenuOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import {
  Button,
  message,
  Popover,
  Card,
  Space,
  Tooltip,
  Upload,
  Drawer,
  Menu,
  Dropdown,
  Modal,
  Popconfirm,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
// react-zmage 只能使用 "0.8.5-beta.36" , .37图像跑到最下面去了，以后再查查原因
import type { IStaticSetParams } from 'react-zmage';
import Zmage from 'react-zmage';
import type { UploadListType } from 'antd/lib/upload/interface';
import type { Dispatch } from 'redux';
import { API_HEAD } from '@/utils/request';
import { deleteModuleRecord } from '../service';
import type { AttachmentModal, ModuleModal } from '../data';
import styles from '../grid/columnFactory.less';
import { canAttachmentInsert, canAttachmentDelete } from '../modules';
import { attachmentPdfOpenPreview } from './preview';
import { AttachmentGrid } from './grid';

const ImageMime = {
  bmp: 'image/bmp',
  gif: 'image/gif',
  jpe: 'image/jpeg',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  jif: 'image/pipeg',
  jfif: 'image/pipeg',
};
const getImageType = (fileext: string): string => {
  return ImageMime[fileext] || 'notimagefile';
};
const isImageType = (fileext: string): boolean => {
  return !!ImageMime[fileext];
};

/**
 * 有四种附件
 * 1.图片附件：          thumbnail.do，显示缩略图
 *                      preview.do,  预览原图
 * 2.可用PDF预览的文件。  不可预览缩略图
 *                      preview.do   预览PDF图
 *                      download.do  下载原文件
 * 3.可以在浏览器中打开的  不可预览缩略图
 *                      preview.do   预览原文件
 *                      download.do  下载原文件
 * 4.不可预览的文件       download.do  下载原文件
 *
 * @param value
 * @param record
 * @param _recno
 * @param param3
 * @param isLink       是否要 <a> 标签
 */

const baseurl = `${API_HEAD}/platform/attachment`;
let openInNewWindowGlobal = false; // 打开PDF或者可直接预览的文件时是否在新的标签页中

interface AttachmentRenderProps {
  moduleInfo: ModuleModal;
  dispatch: Dispatch<any>;
  value: any;
  record: any;
  _recno: any;
  isLink?: boolean;
  readonly?: boolean;
}

interface OwnUploadFile extends UploadFile {
  fileext: string;
  filename: string;
  previewmode: string;
  pdfpreview: boolean;
}

export const AttachemntRenderer: React.FC<AttachmentRenderProps> = ({
  value = [],
  record,
  moduleInfo,
  dispatch,
  isLink = true,
  readonly = false,
}) => {
  let holding = false; // 是否正在预览图片或在当前页显示pdf了，如果是则不关闭Popover
  const count = value.length;
  const { primarykey, namefield, modulename: moduleName, attachmentTypes } = moduleInfo;
  const { attachment = {} } = moduleInfo.userLimit;
  const [attachmentChanged, setAttachmentChanged] = useState(false);
  const [openInNewWindow, setOpenInNewWindow] = useState(openInNewWindowGlobal);
  const [listType, setListType] = useState(count <= 5 ? 'picture' : 'text');
  const [visible, setVisible] = useState(false);
  const [showpdf, setShowpdf] = useState(false);
  const [fileinfo, setFileinfo] = useState({
    url: '',
    title: '',
    uid: '',
    filename: '',
    ispdf: false,
  });
  const [gridVisible, setGridVisible] = useState<boolean>(false);
  // const [uploadParamData, setUploadParamData] = useState({ atype: null });   // 上传附件时的附加参数
  const [atype, setAtype] = useState('99'); // 附件类型
  let deleted = false;
  if (!record) return null;
  let currFileList: any[] = []; // 记录下实时的Attachment中的文件，用于图片预览时可以显示所有的图片
  let text: any = null; // 如果没有附件,则在column中不显示
  if (count)
    // 如果有值的话，就显示附件个数
    text = `${count >= 10 ? '' : '0'}${count}`;
  else if (attachment.add && !readonly)
    // 如果有附件的上传权限，那么就显示一个可以上传的标记
    text = (
      <Tooltip title={`点击${readonly ? '查看' : '上传'}附件`}>
        <FileAddOutlined />
      </Tooltip>
    );
  const getFile = (item: AttachmentModal) => ({
    uid: item.id,
    status: 'done',
    name: `${item.title}  `,
    filename: item.filename,
    fileext: item.fileext || '',
    type: getImageType(item.fileext),
    pdfpreview: item.pdfpreview,
    previewmode: item.previewmode,
    // 只有图片是直接的url,其他类型的在点击后才生成url,如果没有预览图片，会直接读取原图片
    /* eslint-disable */
    url:
      item.thumbnail || isImageType(item.fileext)
        ? `${baseurl}/thumbnail.do?attachmentid=${item.id}`
        : item.previewmode === 'direct' || item.fileext?.toLowerCase() === 'pdf' || item.pdfpreview
        ? `${item.id}`
        : null,
    /* eslint-enable */
  });
  // 所有的文件按类型+文件名排序
  /* eslint-disable */
  const defaultFileList = value
    .map(getFile)
    .sort((f1: any, f2: any) =>
      f1.fileext > f2.fileext
        ? 1
        : f1.fileext === f2.fileext
        ? f1.filename > f2.filename
          ? 1
          : -1
        : -1,
    );
  /* eslint-enable */
  currFileList = defaultFileList;
  // 如果有上传权限，生成上传按钮

  // 如果上传附件的时候需要选择附件类型，那么就加入如下的代码，可以在菜单中选择，然后上传数据把附加的参数加进去
  const menu = (
    <Menu
      onClick={(item: any) => {
        setAtype(item.key);
      }}
    >
      {moduleInfo.attachmentTypes?.map((type) => (
        <Menu.Item key={type.value}>{type.text}</Menu.Item>
      ))}
    </Menu>
  );
  /* eslint-disable */
  const uploadButton =
    attachment.add && !readonly && canAttachmentInsert(moduleInfo, record) ? (
      attachmentTypes && attachmentTypes.length ? (
        <Dropdown overlay={menu}>
          {/* 必须选择一个附件类型 */}
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              message.warn('请选择一个附件类型');
            }}
          >
            <UploadOutlined />
            上传附件
          </Button>
        </Dropdown>
      ) : (
        <Button size="small">
          <UploadOutlined />
          上传附件
        </Button>
      )
    ) : null;
  /* eslint-enable */
  const uploadProps: any = {
    defaultFileList,
    withCredentials: true,
    // 上传附件的地址
    action: `${baseurl}/upload.do?objectid=${moduleName}&idvalue=${record[primarykey]}&atype=${
      atype || '99'
    }&ftype=99`,
    multiple: true,
    listType, // 'text', 'picture','picture-card',
    onRemove: (file: any) => {
      // 如果文件是刚上传的并且上传失败，那么删除的时候不用确认
      if (file.response && !file.response.success) return true;
      // 正在上传的就不要删除了，虽然有删除图标
      if (file.status === 'uploading') return false;
      const filetext = `附件『${file.name.trim()}』`;
      // eslint-disable-next-line
      // const msg = `确定要删除${filetext}吗？`;
      // if (confirm(msg)) {
      // 如果用这种控制确定删除的方法不能用了，就用上面二行的方式
      if (deleted) {
        deleted = false;
        return deleteModuleRecord({
          moduleName: 'FDataobjectattachment',
          recordId: file.uid,
        }).then((result: any) => {
          if (result.resultCode === 0) {
            setAttachmentChanged(true);
            message.success(`${record[namefield]}的${filetext}已成功删除！`);
            return true;
          }
          message.error(
            /* eslint-disable */
            <span
              dangerouslySetInnerHTML={{
                __html: `${record[namefield]}的${filetext}删除失败！<br /><br />${result.message}`,
              }}
            />,
            /* eslint-enable */
          );
          return false;
        });
      }
      return false;
    },
    onChange: (param: any) => {
      const {
        file,
        file: { status, response },
      } = param;
      const errorMsg = response ? <span>附件文件上传失败：{response.msg}</span> : '';
      currFileList = param.fileList;
      if (status === 'error') {
        message.error(errorMsg);
        file.error.statusText = response.msg;
      } else if (status === 'done') {
        // 文件上传成功，判断后台的success是否成功了。
        if (!response.success) {
          message.error(errorMsg);
          file.error.statusText = response.msg;
        } else {
          // 更新当前记录的 附件 信息
          setAttachmentChanged(true);
          const { uid } = file;
          param.fileList.forEach((f: any) => {
            if (f.uid === uid) {
              response.msg.fileext = getFileExt(response.msg.filename);
              apply(f, getFile(response.msg));
            }
          });
        }
      }
    },
    showUploadList: {
      removeIcon: (
        <Popconfirm
          icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          title="确定删除此附件？"
          onConfirm={() => {
            deleted = true;
          }}
        >
          <DeleteOutlined />
        </Popconfirm>
      ),
      showRemoveIcon: !!attachment.delete && !readonly && canAttachmentDelete(moduleInfo, record),
      showDownloadIcon: true,
      showPreviewIcon: true,
    },
  };
  const onDownload = (file: UploadFile<any>) => {
    window.location.href = `${baseurl}/download.do?attachmentid=${file.uid}`;
  };
  const onDownloadAll = () => {
    window.location.href = `${baseurl}/downloadall.do?moduleName=${moduleName}&idkey=${record[primarykey]}`;
  };
  const onPreview = (pfile: UploadFile<any>) => {
    const file = pfile as OwnUploadFile;
    if (file.status === 'uploading') {
      message.warn('文件正在上传中，请稍候预览...');
      return;
    }
    if (file.status === 'error') {
      message.warn('文件上传失败，无法预览...');
      return;
    }
    const ispdf = file.fileext.toLowerCase() === 'pdf' || file.pdfpreview;
    if (file.previewmode === 'image') {
      const images: IStaticSetParams[] = currFileList
        .filter((afile: any) => afile.previewmode === 'image')
        .map((bfile: any): IStaticSetParams => {
          return {
            src: `${baseurl}/preview.do?attachmentid=${bfile.uid}`,
            alt: bfile.filename,
          };
        });
      let defaultPage = currFileList
        .filter((cfile: any) => cfile.previewmode === 'image')
        .findIndex((afile) => afile.uid === file.uid);
      if (defaultPage === -1) {
        // 最近上传的一个没有加入到currFileList中
        images.push({ src: `${baseurl}/preview.do?attachmentid=${file.uid}`, alt: file.filename });
        defaultPage = images.length;
      }
      Zmage.browsing({
        // src: baseurl + `/preview.do?attachmentid=${file.uid}`,
        set: images,
        defaultPage,
        zIndex: 19260817,
        hideOnScroll: false,
        onBrowsing: (browsing: boolean) => {
          holding = browsing;
        },
        controller: {
          close: true, // 关闭按钮
          zoom: true, // 缩放按钮
          download: false, // 下载按钮
          rotate: true, // 旋转按钮
          flip: true, // 翻页按钮
          pagination: true, // 多页指示
        },
        animate: { flip: 'swipe' },
      });
    } else if (file.previewmode === 'direct' || ispdf) {
      const title = `${record[namefield]}的附件『${file.name.trim()}』`;
      // 使用浏览器内置pdf的  url
      let url = `${baseurl}/preview.do?attachmentid=${file.uid}`;
      const fn = `${file.name.substr(0, file.name.lastIndexOf('.'))}.pdf`;
      // 使用pdfjs的  pdfjsurl
      url = ispdf ? getPdfjsUrl(url, fn) : url;
      if (openInNewWindow) {
        if (ispdf) attachmentPdfOpenPreview(file.uid, fn);
        else onOpenInNewWindow(url, title, file.previewmode);
      } else {
        setFileinfo({
          url,
          title,
          uid: file.uid,
          filename: fn,
          ispdf,
        });
        setShowpdf(true);
      }
    } else message.warn('此附件文件不能在浏览器中预览，你可下载后再进行操作！');
  };

  const iconRender = (pfile: UploadFile, alistType?: UploadListType) => {
    const file = pfile as OwnUploadFile;
    const n = file.fileext;
    /* eslint-disable */
    if (alistType === 'text')
      return file.previewmode === 'image' ? (
        <FileImageOutlined />
      ) : n === 'pdf' ? (
        <FilePdfOutlined />
      ) : (
        <PaperClipOutlined />
      );
    /* eslint-enable */
    if (
      [
        'doc',
        'docx',
        'html',
        'mov',
        'mp3',
        'mp4',
        'pdf',
        'ppt',
        'pptx',
        'psd',
        'rar',
        'wav',
        'xls',
        'xlsx',
        'zip',
      ].includes(n)
    )
      return <img src={`/attachment/${n}.png`} alt="" />;
    return (
      <Tooltip title={file.name}>
        <>
          <img src="/attachment/otherfile.png" alt="" />{' '}
        </>
      </Tooltip>
    );
  };

  // 如果附件有变化，则刷新记录
  const refreshRecord = () => {
    if (attachmentChanged) {
      setAttachmentChanged(false);
      dispatch({
        type: 'modules/refreshRecord',
        payload: {
          moduleName,
          recordId: record[primarykey],
        },
      });
    }
  };

  if (value.length === 0 && (!attachment.add || !canAttachmentInsert(moduleInfo, record)))
    return null;
  return (
    <>
      <Popover
        placement="rightTop"
        trigger="click"
        visible={visible}
        destroyTooltipOnHide
        // 隐藏时删除，下次再显示时再生成，这样附件在其他地方修改过后也会正确显示了
        onVisibleChange={(v: boolean) => {
          // 如果附件有过变动了，在退出的时候刷新
          setVisible(holding || v); // 如果在图片或pdf预览，则不关闭
          refreshRecord();
        }}
        content={
          <Card
            size="small"
            title={`${record[namefield]}的附件`}
            extra={
              <Space>
                <span />
                <Tooltip title="将所有附件文件压缩成.zip文件后下载">
                  <CloudDownloadOutlined onClick={onDownloadAll} />
                </Tooltip>
                <span />
                {listType === 'text' ? (
                  <a>
                    <OrderedListOutlined onClick={() => setListType('text')} />
                  </a>
                ) : (
                  <OrderedListOutlined onClick={() => setListType('text')} />
                )}
                {listType === 'picture' ? (
                  <a>
                    <DatabaseOutlined onClick={() => setListType('picture')} />
                  </a>
                ) : (
                  <DatabaseOutlined onClick={() => setListType('picture')} />
                )}
                {listType === 'picture-card' ? (
                  <a>
                    <TableOutlined onClick={() => setListType('picture-card')} />
                  </a>
                ) : (
                  <TableOutlined onClick={() => setListType('picture-card')} />
                )}
                <span />
                <Tooltip title={`${openInNewWindow ? '在新标签页' : '在当前页'}中预览PDF类文件`}>
                  <SelectOutlined
                    rotate={openInNewWindow ? 90 : -90}
                    onClick={() => {
                      openInNewWindowGlobal = !openInNewWindowGlobal;
                      setOpenInNewWindow(openInNewWindowGlobal);
                    }}
                  />
                </Tooltip>
                <Tooltip title="附件所有属性">
                  <MenuOutlined
                    onClick={() => {
                      refreshRecord();
                      setVisible(false);
                      setGridVisible(true);
                    }}
                  />
                </Tooltip>
              </Space>
            }
          >
            <Upload
              {...uploadProps}
              onPreview={onPreview}
              onDownload={onDownload}
              // data={uploadParamData}           //选择的附件类型加在了url里，如果有其他参数放在此处传
              iconRender={iconRender}
            >
              {uploadButton}
            </Upload>
          </Card>
        }
      >
        {isLink ? (
          <span className={styles.attachmentfield}>
            {value.length === 0 ? '' : <PaperClipOutlined />}
            {text}
          </span>
        ) : (
          <span className={styles.attachmentfield}>
            {value.length === 0 ? '' : <PaperClipOutlined />}
            {text}
          </span>
        )}
      </Popover>
      <Drawer
        title={
          <span style={{ display: 'flex' }}>
            <span style={{ flex: 1 }}>{fileinfo.title}</span>
            <span style={{ marginRight: '32px' }} className="ant-drawer-close">
              <Tooltip title="在新标签页中打开pdf文件">
                <SelectOutlined
                  rotate={90}
                  onClick={() => {
                    if (fileinfo.ispdf) attachmentPdfOpenPreview(fileinfo.uid, fileinfo.filename);
                    else onOpenInNewWindow(fileinfo.url, fileinfo.title, 'notimage');
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
        onClose={() => {
          setShowpdf(false);
        }}
        afterVisibleChange={(v: boolean) => {
          holding = v;
        }}
      >
        <iframe
          style={isSafari ? { height: `${document.body.clientHeight - 32 - 22}px` } : {}}
          src={fileinfo.url}
          width="100%"
          height="100%"
          marginWidth={0}
          title="drawepdfpreview"
        />
      </Drawer>

      <Modal
        visible={gridVisible}
        destroyOnClose
        onCancel={() => {
          setGridVisible(false);
        }}
        title={
          <>
            {' '}
            <PaperClipOutlined />
            {` ${record[namefield]}的附件列表`}
          </>
        }
        footer={false}
        width={'80%'}
      >
        <AttachmentGrid
          moduleName={moduleName}
          idvalue={record[moduleInfo.primarykey]}
          titlevalue={record[moduleInfo.namefield]}
          readOnly={!attachment.edit}
        />
      </Modal>
    </>
  );
};

export const attachemntRenderer = ({
  record,
  _recno,
  moduleInfo,
  dispatch,
}: {
  record: any;
  _recno: number;
  moduleInfo: ModuleModal;
  dispatch: Dispatch<any>;
}) => {
  return (
    <AttachemntRenderer
      value={record.attachmentdata}
      record={record}
      _recno={_recno}
      moduleInfo={moduleInfo}
      dispatch={dispatch}
      isLink
      readonly={false}
    />
  );
};
