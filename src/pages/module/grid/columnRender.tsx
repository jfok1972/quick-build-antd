/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import type { CSSProperties } from 'react';
import { history } from 'umi';
import { Popover, Tag, Tooltip, Space, Image, Rate, Typography, Progress } from 'antd';
import {
  SelectOutlined,
  FormOutlined,
  PushpinOutlined,
  RollbackOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
// https://github.com/Caldis/react-zmage
import Zmage from 'react-zmage';
import type { Dispatch } from 'redux';
import { getModuleUrlFormSysMenu } from '@/layouts/BasicLayout';
import { apply, getNumberDigitsFormat } from '@/utils/utils';
import { getBooleanText, PopoverDescription, PopoverDescriptionWithId } from '../descriptions';
import type { ModuleModal, ModuleState, ParentFilterModal } from '../data';
import { getFormSchemeFormType, getModuleInfo } from '../modules';
import OneTowManyTooltip from '../widget/oneTwoManyTooltip';
import styles from './columnFactory.less';
import { NOIMAGE_PNG, PARENT_RECORD } from '../constants';

const numeral = require('numeral');

const { Text } = Typography;

export const iconClsRender = (value: string) => {
  return value ? (
    <span style={{ marginRight: '4px', whiteSpace: 'nowrap' }}>
      <span className={value} /> {` ${value}`}
    </span>
  ) : null;
};

export const imageRender = (value: any, _record: object, _recno: number, field: any) => {
  const imageStyle = {
    width: field.imageWidth || 64,
    height: field.imageHeight || 64,
    style: field.imageStyle || {},
  };
  return value ? (
    <Image {...imageStyle} fallback={NOIMAGE_PNG} src={`data:image/jpeg;base64,${value}`} />
  ) : null;
};

export const zimageRender = (value: any, _record: object, _recno: number, field: any) => {
  const imageStyle = {
    width: field.imageWidth || 64,
    height: field.imageHeight || 64,
    style: field.imageStyle || {},
  };
  return value ? (
    <Zmage
      zIndex={19260817}
      {...imageStyle}
      controller={{
        close: true, // 关闭按钮
        zoom: true, // 缩放按钮
        download: true, // 下载按钮
        rotate: true, // 旋转按钮
        flip: true, // 翻页按钮
        pagination: false, // 多页指示
      }}
      animate={{
        flip: 'fade',
      }}
      src={`data:image/jpeg;base64,${value}`}
    />
  ) : null;
};

export const stringRenderer = (value: any, field: any) => {
  const style: CSSProperties = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };
  if (field) {
    // 设置列宽
    if (field.width) style.width = field.width;
    // 缩略显示
    if (field.ellipsis) style.textOverflow = 'ellipsis';
    // 多行显示
    if (field.multiple) style.whiteSpace = 'normal';
    if (field.style) {
      apply(style, field.style);
    }
  }
  return <div style={style}>{value}</div>;
};

/**
 * 设置了 width 和 ellipsis，表示缩略显示，设置 width 和 ellipsis 则表示多行显示。不设置 width 表示自动列宽。
 * 设置了 width 未设置其他的，则按宽度截断显示文本
 * @param value
 * @param record
 * @param recno_
 * @param param3
 * @returns
 */
export const nameFieldRender = (
  value: any,
  record: object,
  recno_: number,
  { moduleInfo, dispatch, field }: { moduleInfo: ModuleModal; dispatch: Dispatch; field: any },
) => {
  const ellipsis = field && field.ellipsis;
  const width = field && field.width;
  const multiple = field && field.multiple;
  return ellipsis && width ? (
    <Text
      style={{
        width: width,
      }}
      ellipsis={ellipsis ? { tooltip: value } : false}
      strong
    >
      <PopoverDescription moduleInfo={moduleInfo} dispatch={dispatch} record={record}>
        <a>{value}</a>
      </PopoverDescription>
    </Text>
  ) : (
    <div
      style={{
        width: width,
        overflow: 'hidden',
        whiteSpace: width && multiple ? 'normal' : 'nowrap',
        fontWeight: 600,
      }}
    >
      <PopoverDescription moduleInfo={moduleInfo} dispatch={dispatch} record={record}>
        <a>{value}</a>
      </PopoverDescription>
    </div>
  );
};

export const rateRender = (value: number) => {
  return <Rate allowHalf className={styles.ratefield} disabled value={value} />;
};

export const integerRender = (value: number) => {
  if (!value) return null; // value = 0;
  return (
    <span className={value >= 0 ? styles.numberpositive : styles.numbernegative}>{value}</span>
  );
};

export const floatRender = (value: number, digitslen: number | undefined) => {
  if (!value) return null; // value = 0;
  /* eslint-disable */
  const numberFormat = getNumberDigitsFormat(digitslen);
  return (
    <span
      className={
        value > 0 ? styles.numberpositive : value === 0 ? styles.nubmerzero : styles.numbernegative
      }
    >
      {numeral(value).format(numberFormat)}
    </span>
  );
  /* eslint-enable */
};

export const monetaryRender = (
  value: number,
  record_: Object,
  recno_: number,
  moduleState: ModuleState | any,
  digitslen: number | undefined,
) => {
  const { monetary } = moduleState;
  if (value) {
    if (monetary.monetaryUnit === 1) {
      return floatRender(value, digitslen);
    }
    let v = value;
    v /= monetary.monetaryUnit;
    return (
      <span className={styles.monetaryfield}>
        {floatRender(v, digitslen)}{' '}
        {moduleState.monetaryPosition === 'columntitle'
          ? ''
          : moduleState.monetary.monetaryColoredText}
      </span>
    );
  }
  return null; // 如果为0,则不显示
};

export const percentRender = (value: number) => {
  const val = value || 0;
  if (val < 0 || val > 1) {
    return `${numeral(val * 100).format('0,0')} %`;
  }
  return (
    <div className={styles.progresspercent}>
      <Progress percent={Number.parseFloat((val * 100).toFixed(0))} size="small" />
    </div>
  );
};

// 加权平均的可以显示分子和分母的百分比
export const percentRenderWithTooltip = (value: number, divisor: number, denominator: number) => {
  const val = value || 0;
  const v: string = Math.floor(val * 100).toFixed(0);
  const tooltip =
    denominator > 10000 * 100
      ? `${numeral(divisor / 10000).format('0,0.00')}万 / ${numeral(denominator / 10000).format(
          '0,0.00',
        )}万`
      : `${numeral(divisor).format('0,0.00')} / ${numeral(denominator).format('0,0.00')}`;
  return (
    <Popover
      trigger="click"
      title="计算公式"
      content={<span style={{ whiteSpace: 'nowrap' }}>{tooltip}</span>}
    >
      <div className={styles.progresspercent}>
        <Progress percent={Number.parseFloat(v)} size="small" />
      </div>
    </Popover>
  );
};

export const percentRenderWaitToUse = (value: number) => {
  const val = value || 0;
  let width = val <= 1 ? val : 1;
  width = width >= 0 ? width : 0;
  return (
    <div className={styles.percent_border}>
      <div className={styles.percent_text}>{numeral(val).format('0.00%')}</div>
      <div className={styles.percent_area} style={{ width: `${width * 100}%` }} />
    </div>
  );
};

export const dateRender = (
  value: string,
  record?: Object,
  recno?: number,
  isShortYear?: boolean,
) => (
  <span className={styles.datefield}>
    {value ? value.substring(isShortYear ? 2 : 0, 10) : null}
  </span>
);
// 日期时间大多数都是不显示秒，只显示到分钟,设置了isShortYear 则只显示2位年份。现在多是20开头的
export const datetimeRender = (
  value: string,
  record: Object,
  recno: number,
  disableSecond: boolean = true,
  isShortYear: boolean = false,
) => (
  <span className={styles.datefield}>
    {value ? value.substring(isShortYear ? 2 : 0, disableSecond === false ? 19 : 16) : null}
  </span>
);

export const booleanRenderer = (value: boolean) => getBooleanText(value);

export const directionaryFieldRender = (
  value: any,
  record: Object,
  recno: number,
  { fieldname }: { fieldname: string },
) => {
  return <span className={styles.directionaryfield}> {record[`${fieldname}_dictname`]}</span>;
};

// 树形结构，所有的叶节点，可以执行pin操作, unpin 是返回到上一个节点， 根节点不能pin 和 unpin
export const treeNodePinFieldRender = (
  value: any,
  record: any,
  recno: number,
  { moduleState, dispatch }: { moduleState: ModuleState; dispatch: Dispatch },
) => {
  const { moduleName } = moduleState;
  const { primarykey } = getModuleInfo(moduleName);
  const ispinkey = moduleState.pinkey === record[primarykey];
  const parentRecord = record[PARENT_RECORD];
  const parentkey = parentRecord ? parentRecord[primarykey] : '';
  const hasChildren = Array.isArray(record.children) && record.children.length;
  // 如果当前记录是pinkey,并且当前记录下没有children,那就转到上一级
  if (ispinkey && !hasChildren) {
    dispatch({
      type: 'modules/pinkeyChanged',
      payload: {
        moduleName,
        pinkey: parentkey,
      },
    });
  }
  return (
    <span style={{ wordBreak: 'keep-all', verticalAlign: 'middle', display: 'flex' }}>
      <span style={{ flex: 1 }}>{value}</span>
      {(parentkey || moduleState.dataSource.length > 1) && hasChildren ? (
        <a
          onClick={() => {
            dispatch({
              type: 'modules/pinkeyChanged',
              payload: {
                moduleName,
                /* eslint-disable */
                pinkey: ispinkey
                  ? // 如果父节点是根节点，并且只有一个
                    parentRecord &&
                    !parentRecord[PARENT_RECORD] &&
                    moduleState.dataSource.length === 1
                    ? ''
                    : parentkey
                  : record[primarykey],
                /* eslint-enable */
              },
            });
          }}
        >
          {ispinkey ? <RollbackOutlined /> : <PushpinOutlined />}
        </a>
      ) : null}
    </span>
  );
};

/**
 * manytoone  字段的显示，可以点击图标显示manytoone记录的信息
 * @param value
 * @param record
 * @param recno_
 * @param param3
 */
export const manyToOneFieldRender = (
  value: any,
  record: Object,
  recno_: number,
  {
    moduleInfo,
    keyField,
    dispatch,
    field,
  }: { moduleInfo: ModuleModal; keyField: string; dispatch: Dispatch; field: any },
) => {
  const ellipsis = field && field.ellipsis;
  const width = field && field.width;
  const multiple = field && field.multiple;
  return (
    <div className={styles.manytoonefield}>
      {ellipsis && width ? (
        <Text
          style={{
            width: width,
          }}
          ellipsis={ellipsis ? { tooltip: value } : false}
        >
          {value}
        </Text>
      ) : (
        <div
          style={{
            width: width,
            overflow: 'hidden',
            whiteSpace: width && multiple ? 'normal' : 'nowrap',
          }}
        >
          {value}
        </div>
      )}
      <span className={styles.manytoonefieldicon}>
        <PopoverDescriptionWithId
          id={record[keyField]}
          moduleInfo={moduleInfo}
          dispatch={dispatch}
        />
      </span>
    </div>
  );
};

export const oneToManyFieldRender = (
  value: any,
  record: Object,
  recno: number,
  {
    fieldtitle,
    childModuleName,
    fieldahead,
    moduleInfo,
    dispatch,
    field,
    moduleState,
  }: {
    fieldtitle: string;
    childModuleName: string;
    fieldahead: string;
    moduleInfo: ModuleModal;
    dispatch: Dispatch;
    field: any;
    moduleState: ModuleState;
  },
) => {
  if (field.dataIndex.startsWith('wavg.')) {
    return percentRender(value);
  }
  const formScheme = getFormSchemeFormType(childModuleName, 'onetomanytooltip');
  const openOrEnter = (openInNewWindow: boolean) => {
    const parentFilter: ParentFilterModal = {
      moduleName: moduleInfo.modulename,
      fieldahead: fieldahead.split('.with.')[1],
      fieldName: moduleInfo.primarykey,
      fieldtitle: moduleInfo.title,
      operator: '=',
      fieldvalue: record[moduleInfo.primarykey],
      text: record[moduleInfo.namefield],
    };
    const parentFilterParam = encodeURIComponent(JSON.stringify(parentFilter));
    const pathname = getModuleUrlFormSysMenu(childModuleName);
    if (openInNewWindow) {
      const url = `${pathname}?parentFilter=${parentFilterParam}`;
      window.open(url);
    } else {
      history.push({
        pathname,
        // query ,可以用 location.query 获取值,
        // state ,可以用 location.state 获取值,state方式下，url中?后面的参数不显示在网址中，刷新后参数丢失
        state: {
          parentFilter: parentFilterParam,
        },
      });
    }
  };
  let valueText: any = '';
  if (value) {
    if ((field.dataIndex as string).startsWith('count') || field.fieldDefine.isOneToMany) {
      valueText = `${value} 条`;
    } else if (field.fieldDefine.ismonetary) {
      valueText = monetaryRender(value, record, recno, moduleState, field.fieldDefine.digitslen);
    } else if (field.fieldDefine.fieldtype.toLowerCase() === 'integer') {
      // 整型，浮点，百分比
      valueText = integerRender(value);
    } else {
      valueText = floatRender(value, field.fieldDefine.digitslen);
    }
  }
  return (
    <span className={styles.onetomanyfield}>
      {valueText}
      {formScheme && moduleInfo && !field.disableOneToManyTooltip ? (
        <Popover
          trigger="click"
          title={
            <span>
              {`${record[moduleInfo.namefield]} 的 ${fieldtitle}`}
              <Space style={{ float: 'right', marginRight: '12px', marginLeft: '12px' }}>
                <Tooltip title={`转到${fieldtitle}`}>
                  <a onClick={() => openOrEnter(false)}>
                    <FormOutlined />
                  </a>
                </Tooltip>
                <Tooltip title="新页面中打开">
                  <a onClick={() => openOrEnter(true)}>
                    <SelectOutlined rotate={90} />
                  </a>
                </Tooltip>
              </Space>
            </span>
          }
          content={
            <OneTowManyTooltip
              moduleName={moduleInfo.modulename}
              fieldahead={fieldahead}
              childModuleName={childModuleName}
              parentid={record[moduleInfo.primarykey]}
              dispatch={dispatch}
            />
          }
        >
          <Text type="secondary" className={styles.onetomanyfieldinfo}>
            <InfoCircleOutlined />
          </Text>
        </Popover>
      ) : null}
    </span>
  );
};

const maxTagCount = 5;

export const manyToManyFieldRender = (
  value: any,
  record_: Object,
  recno_: number,
  { moduleName, dispatch }: { moduleName: string; dispatch: Dispatch },
) => {
  if (!value) return null;
  const moduleInfo = getModuleInfo(moduleName);
  const getTag = (record: any) => (
    <PopoverDescriptionWithId id={record.key} moduleInfo={moduleInfo} dispatch={dispatch}>
      <Tag color="default" className={styles.manytomanytag} closable={false} onClose={() => {}}>
        {record.title}
      </Tag>
    </PopoverDescriptionWithId>
  );
  const records: any[] = value;
  let result: any[] = [];
  if (records.length <= maxTagCount)
    result = records.map((record: any) => {
      return getTag(record);
    });
  else {
    result = records
      .filter((_, index) => index < maxTagCount)
      .map((record: any) => {
        return getTag(record);
      });
    result.push(
      <Popover
        title={`其他${records.length - maxTagCount}个${moduleInfo.title}`}
        trigger="click"
        content={
          <div style={{ maxWidth: '600px' }}>
            <Space size={[0, 5]} wrap>
              {records
                .filter((_, index) => index >= maxTagCount)
                .map((record: any) => getTag(record))}
            </Space>
          </div>
        }
      >
        <Tag style={{ cursor: 'pointer' }} color="processing">
          更多...
        </Tag>
      </Popover>,
    );
  }
  return <div>{result}</div>;
};
