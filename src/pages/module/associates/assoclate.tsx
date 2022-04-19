/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Card, Tabs } from 'antd';
import type { Dispatch } from 'redux';
import type { ModuleModal } from '../data';
import { getAssociatesSouth, getModuleInfo } from '../modules';
import DetailGrid from '../detailGrid';
import { SimpleDescription } from '../descriptions';

const getDetailGrid = ({
  moduleInfo,
  item,
  record,
  parentOperateType,
  displayTitle,
}: {
  moduleInfo: ModuleModal;
  item: any;
  record: any;
  parentOperateType: any;
  displayTitle?: boolean;
}) => {
  const config = {
    moduleName: item.subobjectname,
    parentOperateType, // 父模块的form当前操作类型
    parentFilter: {
      moduleName: moduleInfo.objectname, // 父模块的名称
      fieldahead: item.fieldahead.split('.with.')[1],
      fieldName: moduleInfo.primarykey, // 父模块的限定字段,父模块主键
      fieldtitle: moduleInfo.title, // 父模块的标题
      operator: '=',
      text: record[moduleInfo.namefield],
      fieldvalue: record[moduleInfo.primarykey], // 父模块的记录id
    },
    displayTitle,
  };
  return <DetailGrid {...config} />;
};

/**
 * 
 * @param param0 
 * 
        associatedetailid: "2c948a8262eae53c0162eb040043000f",
        defaulttitle: "数据字典属性值(字典)",
        fieldahead: "FDictionarydetail.with.FDictionary",
        issystem: true,
        subobjecteastregion: false,
        subobjectname: "FDictionarydetail",
        subobjectnavigate: false,
        subobjectsouthregion: false,
        title: "数据字典属性值"

    一个放在table里面，二个放在Tabs里面
 */
export const getAssociatesSouthDetails = ({
  record,
  moduleInfo,
  dispatch,
}: {
  record: any;
  moduleInfo: ModuleModal;
  dispatch: Dispatch;
}) => {
  const parentOperateType = 'display';
  const associates = getAssociatesSouth(moduleInfo);
  const getSubComnponent = (item: any) =>
    item.subobjectname ? (
      getDetailGrid({ moduleInfo, item, record, parentOperateType, displayTitle: true })
    ) : (
      <div style={{ borderCollapse: 'collapse' }}>
        <SimpleDescription
          record={record}
          disableTitle
          moduleInfo={moduleInfo}
          dispatch={dispatch}
          isRecordExpand
        />
      </div>
    );
  if (associates.length === 1) {
    return <Card>{getSubComnponent(associates[0])}</Card>;
  }
  return (
    <Card>
      <Tabs>
        {associates.map((item: any) => {
          if (item.subobjectname) {
            const subModuleInfo = getModuleInfo(item.subobjectname);
            return (
              <Tabs.TabPane key={item.associatedetailid} tab={item.title || subModuleInfo.title}>
                {getSubComnponent(item)}
              </Tabs.TabPane>
            );
          } else {
            return (
              <Tabs.TabPane key={item.associatedetailid} tab={item.title || moduleInfo.title}>
                {getSubComnponent(item)}
              </Tabs.TabPane>
            );
          }
        })}
      </Tabs>
    </Card>
  );
};
