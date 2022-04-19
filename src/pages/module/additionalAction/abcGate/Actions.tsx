/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 * 业务系统的附加功能
 *
 */

import request, { API_HEAD } from '@/utils/request';
import { Alert, message, Modal, Space } from 'antd';
import type { ActionParamsModal } from '../systemAction';

/**
 * 更新设备的状态
 *
 * @param params
 */
export const deviceCheckOnline = (params: ActionParamsModal) => {
  const { dispatch } = params;
  request(`${API_HEAD}/abcgate/device/checkonline.do`, {}).then((response) => {
    if (response.success) {
      dispatch({
        type: 'modules/fetchData',
        payload: {
          moduleName: 'AbcDevice',
          forceUpdate: true,
        },
      });
      message.info(response.msg);
    } else {
      message.error(response.msg);
    }
  });
};

/**
 * 把分组附件里面的照片分配的人。文件名根据，姓名，工号，手机号
 * @param params
 */

let dispatchEmployeePhotoExecuting = false;

export const dispatchEmployeePhoto = (params: ActionParamsModal) => {
  if (dispatchEmployeePhotoExecuting) {
    message.warn('正在进行照片分配操作！');
    return;
  }
  dispatchEmployeePhotoExecuting = true;
  const { record, dispatch } = params;
  const { classId } = record;
  const { className } = record;
  const hide = message.loading(
    `正在将${className}的照片根据姓名、学号或工号、手机号分配给人员，请稍候`,
    0,
  );

  request(`${API_HEAD}/abcgate/class/dispatchemployeephoto.do`, {
    timeout: 10 * 60 * 1000,
    params: {
      classId,
    },
  })
    .then((response) => {
      if (response.success) {
        dispatch({
          type: 'modules/refreshRecord',
          payload: {
            moduleName: 'AbcClass',
            recordId: classId,
          },
        });
        const { msg } = response;
        const showMessage = (
          <Space direction="vertical">
            {msg.already.length ? (
              <Alert
                message="原已识别照片的人员"
                description={
                  <>
                    <b>{msg.already.join(',')}</b>
                    <br />
                    <>
                      一般是照片上传重复了。如果要重复上传，请到人员信息里继续上传，即可进行识别判断。
                    </>
                  </>
                }
                type="warning"
              />
            ) : null}

            {msg.success.length ? (
              <Alert
                message="本次识别照片的人员"
                description={
                  <>
                    <b>{msg.success.join(',')}</b>
                  </>
                }
                type="info"
              />
            ) : null}

            {msg.failure.length ? (
              <Alert
                message="本次未识别照片人员"
                description={
                  <>
                    <b>{msg.failure.join(',')}</b>
                    <br />
                    <>
                      照片未能被检测出人脸数据，需要重新拍照上传，原来的照片附件可以在人员里面删除。
                    </>
                  </>
                }
                type="warning"
              />
            ) : null}

            {msg.notFind.length ? (
              <Alert
                message="没有发现人员的照片"
                description={
                  <>
                    <b>{msg.notFind.join(',')}</b>
                    <br />
                    <>{`请检查文件名是否是人员姓名，工号或手机号码。
            这些附件可以删除，改名后再重新上传。`}</>
                  </>
                }
                type="error"
              />
            ) : null}
          </Space>
        );
        Modal.info({
          title: `人员照片分析结果`,
          width: 500,
          content: showMessage,
        });
      } else {
        message.error(response.msg);
      }
    })
    .finally(() => {
      dispatchEmployeePhotoExecuting = false;
      hide();
    });
};
