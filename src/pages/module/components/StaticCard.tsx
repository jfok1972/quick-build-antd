/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useContext, useEffect, useState } from 'react';
import { getAwesomeIcon } from '@/utils/utils';
import { Area, Column, Line } from '@ant-design/charts';
import { FilterOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { StatisticCard } from '@ant-design/pro-card';
import { Badge, Col, message, Popover, Row, Space, Tooltip } from 'antd';
import type { Moment } from 'moment';
import moment from 'moment';
import { DateFormat } from '../moduleUtils';
import type { StaticFieldProps } from './StaticField';
import { StaticField } from './StaticField';
import styles from './StaticCard.less';
import type { MonetaryUnit } from '../grid/monetary';
import { getMonetaryUnitText } from '../grid/monetary';
import { fetchDataminingDataWithCache } from './antdCharts/dataset';
import UserDefineFilter, { changeUserFilterToParam } from '../UserDefineFilter';
import type { ModuleState } from '../data';
import { getDefaultModuleState } from '../modules';
import { useMemo } from 'react';
import { WidgetParentUserFiltersContext } from '../blockScheme';

const numeral = require('numeral');

const { Statistic } = StatisticCard;

interface TextValue {
  text: string; // 当前记录的文本
  value: number; // 当前记录的值
}

interface ChartProps {
  type: 'line' | 'area' | 'column'; // 迷你折线图，迷你面积图，迷你柱状图
  sectionType?: 'day' | 'month' | 'year'; // 分组类型
  maxCount?: number; // 迷你图最大的记录个数,如果是负数，返回最后的count个，如果是正数，返回最前的count个
  orderby?: 'text' | 'value' | 'code'; // 按什么排序,对于有序的如数据字典，可以按code排序
  orderDesc?: boolean; // 排序顺序
}

interface StaticCardProps {
  moduleName: string; // 模块名称
  title: string; // 指标名称
  fieldName: string; // 统计的字段名称
  aggregate: 'sum' | 'count' | 'avg' | 'max' | 'min'; // 聚合类型;
  dateFieldName: string; // 日期字段
  filters?: any[]; // 查询的条件
  filterSchemeid?: string;
  description?: string; // 指标的描述，放在右上角的圆形感叹号里
  formatPattern?: string; // 数值format样式, 默认 0,000 , 0.000.00
  prefix?: React.ReactNode | string; // 金额前面的符号
  suffix?: React.ReactNode | string; // 金额前面的单位
  icon?: React.ReactNode; // 指标标题前面的图标
  monetaryUnit?: MonetaryUnit;
  unitText?: string; // 数值单位，个，米，万元。

  height?: number; // 整个Card的高度
  chartHeight?: number; // 中间区域的高度，chart 或者 description 属性

  staticFields?: StaticFieldProps[]; // 其他聚合字段的值
  relatives?: Relative[]; // 各种比较的数据
  chart?: ChartProps; // 图表定义
  // 有chart ,则 staticFields 和 relative  都在 foot 上;
  footerRegion?: 'relative' | 'staticfield'; // foot 放置内容
  chartRegion?: 'relative' | 'staticfield'; // chart区域放置内容
}

const sectionTitles = {
  day: '日',
  week: '周',
  month: '月',
  year: '年',
};

interface Relative {
  section: 'day' | 'week' | 'month' | 'year'; // day {n}日同比 , week 周同比 , month 月同比
  sectionNumber?: number; // 多少天、周、月之内的同比，默认为1
  monthOnMonth?: boolean; // true 为环比，其他为同比
  wholeMonth?: boolean; // 月度是否从1号开始 ，默认为false
  containerToday?: boolean; // 同比的最后一天是否包含今天 , 默认包含
}

interface RelativeData {
  sectionTitle: string;
  startDate: string;
  endDate: string;
  lastStartDate: string;
  lastEndDate: string;
  thisValue: number | undefined;
  lastValue: number | undefined;
  ratio: number | undefined;
}

export const StaticCard: React.FC<StaticCardProps> = ({
  moduleName,
  title,
  fieldName,
  aggregate,
  dateFieldName,
  filters,
  filterSchemeid,
  prefix,
  suffix,
  icon,
  description,
  formatPattern = '0,000',
  monetaryUnit = 1,
  unitText = '',
  height,
  chartHeight = 40,
  relatives,
  staticFields,
  chart,
  chartRegion = 'staticfield',
  footerRegion = 'relative',
}) => {
  const [total, setTotal] = useState<number>(0);
  const [relativeDatas, setRelativeDatas] = useState<RelativeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [userfilters, setUserfilters] = useState<any[]>([]);
  const [moduleState, setModuleState] = useState<ModuleState>(
    getDefaultModuleState({ moduleName }),
  );
  // 父容器上面的用户筛选条件
  const { parnetUserFilters } = useContext(WidgetParentUserFiltersContext);
  const aggregateField = `${aggregate}.${fieldName}`;
  const aggregateFieldName = 'jf001';
  const userFilter = filterSchemeid ? (
    <Popover
      visible={filterVisible}
      onVisibleChange={(v) => {
        setFilterVisible(v);
      }}
      trigger={['click']}
      title={<span>设置筛选条件</span>}
      content={
        <UserDefineFilter
          visible={true}
          moduleState={moduleState}
          dispatch={(params: any) => {
            // 在重置的时候，需要把UserDefineFilter中的记录都清空，因此加了这一个moduleState
            if (params.type === 'modules/filterChanged') {
              moduleState.filters.userfilter = params.payload.userfilter;
              setModuleState({ ...moduleState });
              setUserfilters(changeUserFilterToParam(params.payload.userfilter));
            }
            setFilterVisible(false);
          }}
          filterSchemeid={filterSchemeid}
          inPopover
        />
      }
    >
      {userfilters.length ? (
        <Badge
          count={userfilters.length}
          dot={false}
          offset={[-6, 6]}
          style={{ backgroundColor: '#108ee9' }}
        >
          <FilterOutlined
            style={{
              paddingRight: '20px',
            }}
            className={styles.filtericon}
          />
        </Badge>
      ) : (
        <FilterOutlined className={styles.filtericon} />
      )}
    </Popover>
  ) : null;

  const getTitle = () => {
    if (description || filterSchemeid) {
      return (
        <div>
          <span>{title}</span>
          <Space style={{ float: 'right' }}>
            {description ? (
              <Tooltip title={description} trigger={['click']}>
                <InfoCircleOutlined />
              </Tooltip>
            ) : null}
            {userFilter}
          </Space>
        </div>
      );
    }
    return title;
  };

  const getRelativeDate = async (relative: Relative): Promise<RelativeData> => {
    const {
      sectionNumber = 1,
      monthOnMonth = false,
      containerToday = true,
      wholeMonth = false,
    } = relative;
    // 算出数据当前区间和对比区间
    if (relative.section !== 'day' && sectionNumber !== 1 && wholeMonth) {
      message.error('对比区间设置为月和包含整月的数据时，区间数值只能是1。');
    }
    const endDate = moment().subtract(containerToday ? 0 : 1, 'day');
    let startDate;
    if (['year', 'month'].includes(relative.section) && wholeMonth) {
      // 整个月，从1号开始
      startDate =
        relative.section === 'year'
          ? moment(endDate).set('date', 1).set('month', 1)
          : moment(endDate).set('date', 1);
    } else {
      startDate = moment(endDate).subtract(sectionNumber, relative.section).add(1, 'day');
    }
    let lastStartDate;
    let lastEndDate;
    if (monthOnMonth) {
      // 环比 = 本周期 和 上一个周期 的比较
      if (['year', 'month'].includes(relative.section) && wholeMonth) {
        // 环比完整月对比，上一个月的今天
        lastEndDate = moment(endDate).subtract(1, relative.section);
      } else {
        lastEndDate = moment(startDate).subtract(1, 'day');
      }
    } else {
      // 同比 = 本周期 和 上一年度同周期 的比较
      lastEndDate = moment(endDate).subtract(1, 'year');
    }
    // 这样处理二月润月也对了，确保对比的天数是一样的
    if (['year', 'month'].includes(relative.section) && wholeMonth) {
      lastStartDate =
        relative.section === 'year'
          ? moment(lastEndDate).set('date', 1).set('month', 1)
          : moment(lastEndDate).set('date', 1);
    } else {
      lastStartDate = moment(lastEndDate).subtract(sectionNumber, relative.section).add(1, 'day');
    }
    const result: RelativeData = {
      sectionTitle:
        (sectionNumber > 1 ? sectionNumber : '') +
        sectionTitles[relative.section] +
        (monthOnMonth ? '环比' : '同比'),
      startDate: startDate.format(DateFormat),
      endDate: endDate.format(DateFormat),
      lastStartDate: lastStartDate.format(DateFormat),
      lastEndDate: lastEndDate.format(DateFormat),
      thisValue: undefined,
      lastValue: undefined,
      ratio: undefined,
    };
    const getSectionValue = async (start: Moment, end: Moment) => {
      return await fetchDataminingDataWithCache({
        moduleName,
        fields: [aggregateField],
        navigatefilters: filters,
        // 对比的时候，对于选择的条件和当前日期相同的，就不加入了，否则就没法比了。
        userfilters: [
          {
            property: dateFieldName,
            operator: 'daysection',
            value: `${start.format(DateFormat)}--${end.format(DateFormat)}`,
          },
        ].concat(
          ...userfilters.concat(parnetUserFilters).filter((f) => f.property !== dateFieldName),
        ),
        isnumberordername: true,
      });
    };
    let rec: any = await getSectionValue(startDate, endDate);
    result.thisValue = rec[0][aggregateFieldName];
    rec = await getSectionValue(lastStartDate, lastEndDate);
    result.lastValue = rec[0][aggregateFieldName];
    // result.lastValue = (result.thisValue || 0) * (Math.random() + 0.5);
    if (result.lastValue) {
      result.ratio = ((result.thisValue || 0) - result.lastValue) / result.lastValue;
    }
    return new Promise((resolve) => {
      resolve(result);
    });
  };

  const getRelativeSection = (relativeData: RelativeData) => {
    const {
      sectionTitle,
      startDate,
      endDate,
      lastStartDate,
      lastEndDate,
      thisValue,
      lastValue,
      ratio,
    } = relativeData;
    return (
      <Statistic
        style={{ flex: 1 }}
        title={
          <Popover
            title={`${sectionTitle}计算过程`}
            content={
              <table className={styles.tooltiptable}>
                <tr>
                  <th />
                  <th>起始日期</th>
                  <th>终止日期</th>
                  <th>指标数值</th>
                </tr>
                <tr>
                  <th>本期期间</th>
                  <td>{startDate}</td>
                  <td>{endDate}</td>
                  <td className={styles.tdvalue}>{`${numeral(thisValue).format(
                    formatPattern,
                  )} ${unitText}`}</td>
                </tr>
                <tr>
                  <th>对比期间</th>
                  <td>{lastStartDate}</td>
                  <td>{lastEndDate}</td>
                  <td className={styles.tdvalue}>{`${numeral(lastValue).format(
                    formatPattern,
                  )} ${unitText}`}</td>
                </tr>
                <tr>
                  <th>增长比例</th>
                  <td />
                  <td />
                  <td className={styles.tdvalue}>
                    {typeof ratio === 'undefined' ? '无对比数据' : numeral(ratio).format('0.00%')}
                  </td>
                </tr>
              </table>
            }
            trigger={['click']}
          >
            <span style={{ cursor: 'pointer' }}>{sectionTitle}</span>
          </Popover>
        }
        value={typeof ratio === 'undefined' ? ' ' : numeral(ratio).format('0%')}
        // eslint-disable-next-line
        trend={typeof ratio === 'undefined' ? undefined : ratio > 0 ? 'up' : 'down'}
        layout="horizontal"
      />
    );
  };

  const groupFunction = {
    day: 'yyyy年mm月dd日',
    month: 'yyyy年mm月',
    year: 'yyyy年',
  };

  const MiniChart: React.FC<any> = ({ chartDefine }: { chartDefine: ChartProps }) => {
    const [data, setData] = useState<TextValue[]>([]);
    const {
      type,
      sectionType = 'day',
      maxCount = 18,
      orderby = 'text',
      orderDesc = false,
    } = chartDefine;

    useEffect(() => {
      fetchDataminingDataWithCache({
        moduleName,
        fields: [aggregateField],
        navigatefilters: filters,
        userfilters: userfilters.concat(parnetUserFilters),
        groupfieldid: { fieldname: dateFieldName, function: groupFunction[sectionType] },
        isnumberordername: true,
      }).then((response: any) => {
        const detailArray: TextValue[] = (response as any[])
          .map((rec) => {
            const obj = {
              text: rec.text,
              value: rec[aggregateFieldName] / monetaryUnit,
            };
            return obj;
          })
          .sort((rec1, rec2) => {
            if (rec1[orderby] > rec2[orderby]) return orderDesc ? -1 : 1;
            if (rec1[orderby] < rec2[orderby]) return orderDesc ? 1 : -1;
            return 0;
          })
          .filter((value, index, array) => {
            if (maxCount > 0) return index < maxCount; // 前面的count项
            if (maxCount < 0) return array.length - index <= -maxCount; // 后面的count项
            return true;
          });
        setData(detailArray);
      });
    }, [userfilters, parnetUserFilters]);

    const config: any = {
      height: chartHeight,
      width: '100%',
      data,
      xField: 'text',
      yField: 'value',
      xAxis: {
        label: null,
        line: null,
      },
      yAxis: {
        label: null,
        line: null,
        tickCount: 1,
      },
      tooltip: {
        showTitle: false,
        // tooltip 显示的格式是  日期-数值 ,不加这一条显示的是 指标-数值
        formatter: (datum: any) => {
          return {
            name: datum.text,
            value: datum.value + getMonetaryUnitText(monetaryUnit, unitText),
          };
        },
      },
    };
    const meta = { text: { range: [0, 1] } };
    switch (type) {
      case 'column':
        return <Column {...config} />;
      case 'line':
        return <Line {...config} meta={meta} />;
      default:
        return <Area {...config} meta={meta} />;
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDataminingDataWithCache({
      moduleName,
      fields: [aggregateField],
      navigatefilters: filters,
      userfilters: userfilters.concat(parnetUserFilters),
      isnumberordername: true,
    }).then(async (response: any) => {
      setTotal(response[0][aggregateFieldName]);
      if (relatives && relatives.length) {
        const relaDatas = [];
        for (let i = 0; i < relatives.length; i += 1) {
          // eslint-disable-next-line
          const value = await getRelativeDate(relatives[i]);
          relaDatas.push(value);
        }
        setRelativeDatas(relaDatas);
      }
      setLoading(false);
    });
  }, [userfilters, parnetUserFilters]);

  const getStaticFieldsRegion = () => {
    let hasRatio = false;
    staticFields?.forEach((field) => {
      hasRatio = hasRatio || !!field.addRatio;
    });
    return (
      // 如果要显示比率，则把这一行撑足
      <Space key="spacekey" size={[8, 4]} wrap className={hasRatio ? styles.staticspace : ''}>
        {staticFields?.map((staticField, index) => (
          <StaticField
            key={`staticfieldkey-${index}`}
            {...staticField}
            userfilters={userfilters.concat(parnetUserFilters)}
            total={total}
          />
        ))}
      </Space>
    );
  };

  const getRelativeRegion = () => {
    return (
      <Row key="rowkey" gutter={8}>
        {relativeDatas.map((relative, index) => (
          <Col key={`colkey-${index}`} span={12}>
            {getRelativeSection(relative)}
          </Col>
        ))}{' '}
      </Row>
    );
  };

  const footer = useMemo(() => {
    const result: any[] = [];
    if (chart) {
      if (staticFields) result.push(getStaticFieldsRegion());
      if (relativeDatas.length) result.push(getRelativeRegion());
      return result;
    }
    if (footerRegion === 'staticfield' && staticFields) return getStaticFieldsRegion();
    if (footerRegion === 'relative' && relativeDatas.length) return getRelativeRegion();
    return null;
  }, [relativeDatas, userfilters, parnetUserFilters]);

  const descriptionRegion = useMemo(() => {
    const style: React.CSSProperties = {
      height: `${chartHeight}px`,
      marginTop: '6px',
      marginBottom: '10px',
    };
    if (chart) return null;
    if (chartRegion === 'staticfield' && staticFields)
      return <div style={style}>{getStaticFieldsRegion()}</div>;
    if (chartRegion === 'relative' && relativeDatas.length)
      return <div style={style}>{getRelativeRegion()}</div>;
    return null;
  }, [relativeDatas, userfilters, parnetUserFilters]);

  const miniChart = useMemo(() => {
    return chart ? <MiniChart chartDefine={chart} /> : null;
  }, [userfilters, parnetUserFilters]);

  return (
    <StatisticCard
      className={styles.staticcard}
      style={{ height: height ? `${height}px` : '' }}
      loading={loading}
      chart={miniChart}
      chartPlacement="bottom"
      statistic={{
        title: getTitle(),
        value: numeral(total / monetaryUnit).format(formatPattern),
        prefix,
        suffix: [getMonetaryUnitText(monetaryUnit, unitText), suffix],
        icon: typeof icon === 'string' ? getAwesomeIcon(icon) : icon,
        description: descriptionRegion,
      }}
      footer={footer}
    />
  );
};
