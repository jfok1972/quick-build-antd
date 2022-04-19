/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { notification, message, Modal } from 'antd';
import type { Dispatch } from 'redux';
import { setGlobalModalProps } from '@/layouts/BasicLayout';
import BpmnModeler from './BpmnEditor/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css'; // 左边工具栏以及编辑节点的样式
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js-properties-panel/dist/assets/bpmn-js-properties-panel.css';
import './activitiProperties.less';
import getDefaultXml from './BpmnEditor/sources/xml';
import EditingTools from './BpmnEditor/EditingTools';
import { saveOrUpdateRecord } from '../../service';

const propertiesPanelModule = require('bpmn-js-properties-panel');
const propertiesProviderModule = require('./bpmn-js-properties-panel/lib/provider/flowable');
const activitiModdleDescriptor = require('./activiti.json');

let scale = 1;
const setScale = (n: number) => {
  scale = n;
};
export const activitiModeler = ({ record, dispatch }: { record: any; dispatch: Dispatch }) => {
  let bpmnModeler: any;
  /**
   * 下载xml/svg
   *  @param  type  类型  svg / xml
   *  @param  data  数据
   *  @param  name  文件名称
   */
  const download = (type: string, data: any, name: string) => {
    const dataTrack = type === 'xml' ? 'bpmn' : 'svg';
    const a = document.createElement('a');
    a.setAttribute('href', `data:application/bpmn20-xml;charset=UTF-8,${encodeURIComponent(data)}`);
    a.setAttribute('target', '_blank');
    a.setAttribute('dataTrack', `diagram:download-${dataTrack}`);
    a.setAttribute('download', name || `${record.name}的流程.${dataTrack}`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 渲染 xml 格式
  const renderDiagram = (xml: string) => {
    bpmnModeler.importXML(xml, (err: any) => {
      if (err) {
        notification.error({
          message: '流程文件导入',
          description: `流程文件导入失败：${err}`,
        });
      }
    });
  };

  // 导入 xml 文件
  const handleOpenFile = (e: any) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      let data: string = '';
      reader.readAsText(file);
      reader.onload = (event: any) => {
        data = event.target.result;
        renderDiagram(data);
      };
    }
  };

  // 保存
  const handleSave = () => {
    const moduleName = 'FWorkflowdesign';
    if (record.deployTime) {
      message.warn(`『${record.name}』的审批流程已发布，不允许保存`);
      return;
    }
    let bpmnxml: any = null;
    let bpmnsvg: any = null;
    bpmnModeler.saveXML({ format: true }).then(({ xml }: { xml: string }) => {
      bpmnxml = xml;
      bpmnModeler.saveSVG({ format: true }).then(({ svg }: { svg: string }) => {
        bpmnsvg = svg;
        // 将bpmnXml和svgXml传给后台
        saveOrUpdateRecord({
          moduleName,
          opertype: 'edit',
          data: {
            workflowid: record.workflowid,
            bpmnxml,
            bpmnsvg,
          },
        }).then((response: any) => {
          const { data: updatedRecord } = response; // 从后台返回过来的数据
          if (response.success) {
            message.success(`『${record.name}』的审批流程保存成功！`);
            dispatch({
              type: 'modules/updateRecord',
              payload: {
                moduleName,
                record: updatedRecord,
              },
            });
          } else {
            const errorMessage = response.message
              ? [
                  <div>
                    <li>
                      {typeof response.message === 'string'
                        ? response.message
                        : JSON.stringify(response.message)}
                    </li>
                  </div>,
                ]
              : [];
            Modal.error({
              width: 500,
              title: '记录保存时发生错误',
              content: <ul style={{ listStyle: 'decimal' }}>{errorMessage}</ul>,
            });
          }
        });
      });
    });
  };

  // 前进
  const handleRedo = () => {
    bpmnModeler.get('commandStack').redo();
  };

  // 后退
  const handleUndo = () => {
    bpmnModeler.get('commandStack').undo();
  };

  // 下载 SVG 格式
  const handleDownloadSvg = () => {
    bpmnModeler.saveSVG({ format: true }, (err: any, data: string) => {
      download('svg', data, '');
    });
  };

  // 下载 XML 格式
  const handleDownloadXml = () => {
    bpmnModeler.saveXML({ format: true }, (err: any, data: string) => {
      download('xml', data, '');
    });
  };

  // 流程图放大缩小
  const handleZoom = (radio: number) => {
    if (radio === 0) {
      setScale(1);
      bpmnModeler.get('canvas').zoom(1);
    }
    const newScale = scale + radio <= 0.2 ? 0.2 : scale + radio;
    setScale(newScale);
    bpmnModeler.get('canvas').zoom(newScale);
  };

  setTimeout(() => {
    bpmnModeler = new BpmnModeler({
      container: '#js-canvas',
      propertiesPanel: {
        parent: '#js-properties-panel',
      },
      additionalModules: [
        // 左边工具栏和节点
        propertiesProviderModule,
        // 右边属性面板
        propertiesPanelModule,
      ],
      moddleExtensions: {
        activiti: activitiModdleDescriptor,
      },
    });
    // 如果已经定义过了，就找到定义的xml,否则打开默认的xml
    const bpmnxml = record.bpmnxml ? record.bpmnxml : getDefaultXml(record.procDefKey, record.name);
    bpmnModeler.importXML(bpmnxml, (err: any) => {
      if (!err) {
        const canvas = bpmnModeler.get('canvas');
        canvas.zoom('fit-viewport');
        handleZoom(0);
      } else {
        Modal.error({
          width: 500,
          title: '读取流程文件时发生错误',
          content: err,
        });
      }
    });
  }, 0);

  setGlobalModalProps({
    onCancel: () => setGlobalModalProps(() => ({ visible: false })),
    zIndex: 120,
    destroyOnClose: true,
    visible: true,
    centered: true,
    okText: '保存',
    onOk: handleSave,
    width: '100%',
    title: `${record.name} 审批流程设计`,
    bodyStyle: { padding: 0 },
    children: (
      <div>
        <div
          style={{ height: `${document.documentElement.clientHeight - 56 - 52}px` }}
          className="content with-diagram"
        >
          <div className="canvas" id="js-canvas" />
          <div className="properties-panel-parent" id="js-properties-panel" />
          <EditingTools
            onOpenFIle={handleOpenFile}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDownloadSvg={handleDownloadSvg}
            onDownloadXml={handleDownloadXml}
            onZoomIn={() => handleZoom(+0.1)}
            onZoomOut={() => handleZoom(-0.1)}
            onZoomReset={() => handleZoom(0)}
          />
        </div>
      </div>
    ),
  });
};
