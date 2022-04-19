/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import { API_HEAD } from '@/utils/request';
import { getPdfjsUrl, isSafari } from '@/utils/utils';
import { Button, Card, Result } from 'antd';
import { connect, history } from 'umi';
import type { ConnectProps } from '@/models/connect';

interface AttachmentPreviewProps extends Partial<ConnectProps> {
  route: any;
  location: any;
  match: any;
}

const baseurl = `${API_HEAD}/platform/attachment`;
const errorTitle = '预览已过期';
/**
 * http://localhost:8000/attachment/preview?attachmentid=id&saveName=filename.pdf
 * 可以用上面的网址预览附件
 *
 * @param param0
 */

const preview: React.FC<AttachmentPreviewProps> = ({ location }) => {
  let { attachmentid } = location.query;
  let { saveName } = location.query;
  if (!attachmentid) {
    attachmentid = sessionStorage.getItem('attachmentid');
    saveName = sessionStorage.getItem('saveName');
    sessionStorage.removeItem('attachmentid');
    sessionStorage.removeItem('saveName');
  }
  document.title = saveName || errorTitle;
  const url = `${baseurl}/preview.do?attachmentid=${attachmentid}`;
  // 使用pdfjs的  pdfjsurl
  const pdfjsurl = getPdfjsUrl(url, saveName);
  return attachmentid ? (
    <Card
      title={document.title}
      style={{ height: '100%' }}
      bodyStyle={{
        padding: 0,
        margin: 0,
        height: '100%',
      }}
    >
      <iframe
        title="pdfpreview"
        style={isSafari ? { height: `${document.body.clientHeight - 32 - 22}px` } : {}}
        src={pdfjsurl}
        width="100%"
        height="100%"
        marginWidth={0}
      />
    </Card>
  ) : (
    <Result
      status="404"
      title="预览已过期"
      subTitle="附件文件预览已过期，请在原模块界面中重新发起请求。"
      extra={
        <Button type="primary" onClick={() => history.push('/')}>
          返回主页
        </Button>
      }
    />
  );
};

export const attachmentPdfOpenPreview = (attachmentid: string, saveName: string) => {
  sessionStorage.setItem('attachmentid', attachmentid);
  const fn = saveName.replaceAll('}', '｝').replaceAll('{', '｛');
  sessionStorage.setItem('saveName', fn);
  // 参数通过sessionStorage传递的请求
  window.open(`/attachment/preview`);
  // 参数显示在地址栏的请求
  // window.open(`/attachment/preview?attachmentid=${attachmentid}&saveName=${saveName}`);
};

export default connect()(preview);
