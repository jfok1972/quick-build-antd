/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Table, Tooltip } from 'antd';
import { BarsOutlined } from '@ant-design/icons';
import type { Dispatch } from 'redux';
import { apply } from '@/utils/utils';
import { fetchChildModuleData } from '../service';
import { getModuleInfo, getFormSchemeFormType, getFieldDefine } from '../modules';
import type { ModuleModal, ModuleFieldType } from '../data';
import styles from '../grid/columnFactory.less';
import {
  booleanRenderer,
  dateRender,
  datetimeRender,
  floatRender,
  integerRender,
  nameFieldRender,
  percentRender,
} from '../grid/columnRender';
import { RECNOUNDERLINE } from '../constants';
/**
 *  post formdata
 *  /platform/dataobject/fetchchilddata.do
 *  objectid: FDictionary
    parentid: 8a53b78262ea6e6d0162ea6e8b9c009b
    childModuleName: FDictionarydetail
    fieldahead: FDictionarydetail.with.FDictionary
    limit: 20
    page: 1
    start: 0
 * 
 * @param param0 
 * 
 */

const OneTowManyTooltip = ({
  moduleName,
  parentid,
  childModuleName,
  fieldahead,
  dispatch,
}: {
  moduleName: string;
  parentid: string;
  childModuleName: string;
  fieldahead: string;
  dispatch: Dispatch;
}): any => {
  const limit = 10;
  const [data, setData] = useState([]);
  const [dataCount, setDataCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetchChildModuleData({
      objectid: moduleName,
      parentid,
      childModuleName,
      fieldahead,
      limit,
      page,
      start: (page - 1) * limit,
    }).then((response: any) => {
      setLoading(false);
      let recno = 1;
      if (response.msg)
        response.msg.forEach((record: any) => {
          const rec = record;
          rec[RECNOUNDERLINE] = recno + (page - 1) * limit;
          recno += 1;
        });
      setDataCount(response.tag);
      setData(response.msg || []);
    });
  }, [page]);
  const cModuleInfo: ModuleModal = getModuleInfo(childModuleName);
  const scheme = getFormSchemeFormType(childModuleName, 'onetomanytooltip');
  let columns: any[] = scheme.details.map((formField: any) => {
    const fieldDefine: ModuleFieldType = getFieldDefine(formField.fieldid, cModuleInfo);
    const ft = fieldDefine.fieldtype.toLowerCase();
    const isfloat = ft === 'double' || ft === 'float' || ft === 'money';
    const isinteger = ft === 'integer';
    const ispercent = ft === 'percent';
    const isdate = ft === 'date' || ft === 'datetime' || ft === 'timestamp';
    const style: CSSProperties = { wordBreak: 'keep-all', whiteSpace: 'nowrap' };
    if (isfloat || isdate || isinteger || ispercent)
      apply(style, {
        display: 'block',
        // textAlign: 'center',
      });
    return {
      title: (
        <span
          style={{
            wordBreak: 'keep-all',
            whiteSpace: 'nowrap',
            display: 'inline-block',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <>
            {fieldDefine.fieldtitle}{' '}
            {fieldDefine.unittext ? (
              <>
                <br />
                <span style={{ color: 'green' }}>({fieldDefine.unittext})</span>
              </>
            ) : null}
          </>
        </span>
      ),
      /* eslint-disable */
      dataIndex:
        fieldDefine.isManyToOne || fieldDefine.isOneToOne
          ? fieldDefine.manyToOneInfo.nameField
          : fieldDefine.fDictionaryid
          ? `${fieldDefine.fieldname}_dictname`
          : fieldDefine.fieldname,
      /* eslint-enable */
      key: fieldDefine.fieldname,
      align: isfloat ? 'right' : 'left',
      render: (value: any, record: Object, recno_: number) => {
        return (
          <span style={style}>
            {
              /* eslint-disable */
              cModuleInfo.namefield === fieldDefine.fieldname
                ? nameFieldRender(value, record, recno_, {
                    moduleInfo: cModuleInfo,
                    dispatch,
                    field: {},
                  })
                : ft === 'boolean'
                ? booleanRenderer(value)
                : ft === 'date'
                ? dateRender(value)
                : ft === 'datetime' || ft === 'timestamp'
                ? datetimeRender(value, record, recno_, true)
                : isfloat
                ? floatRender(value, fieldDefine.digitslen)
                : isinteger
                ? integerRender(value)
                : ispercent
                ? percentRender(value)
                : value
              /* eslint-disable */
            }
          </span>
        );
      },
    };
  });
  columns = [
    {
      title: (
        <Tooltip title="记录顺序号">
          <BarsOutlined />
        </Tooltip>
      ),
      dataIndex: RECNOUNDERLINE,
      key: RECNOUNDERLINE,
      className: styles.numberalignright,
    },
  ].concat(columns);
  return (
    <>
      {' '}
      <Table
        bordered
        loading={loading}
        dataSource={data}
        columns={columns}
        size="small"
        pagination={{
          pageSize: limit,
          current: page,
          total: dataCount,
          showSizeChanger: false,
          showLessItems: true,
          hideOnSinglePage: true,
          onChange: (p: number) => {
            setPage(p);
          },
          showTotal: (atotal, range) => <span style={{ float: 'right' }}>{`共 ${atotal} 条`}</span>,
        }}
      />
    </>
  );
};

export default OneTowManyTooltip;
