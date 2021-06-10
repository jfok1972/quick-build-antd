import { getColumnDataIndex } from '@/pages/datamining/utils';
import request, { API_HEAD } from '@/utils/request';
import { stringifyObjectField } from '@/utils/utils';
import { Area, Column, Line } from '@ant-design/charts';
import { InfoCircleOutlined } from '@ant-design/icons';
import { StatisticCard } from '@ant-design/pro-card';
import { message, Popover, Tooltip } from 'antd';
import type { Moment } from 'moment';
import moment from 'moment';
import { serialize } from 'object-to-formdata';
import React, { useEffect, useState } from 'react';
import { DateFormat } from '../moduleUtils';
import styles from './StaticCard.less';

const numeral = require('numeral');

const { Statistic } = StatisticCard;

interface TextValue {
  text: string;   // 当前记录的文本
  value: number;  // 当前记录的值
}

interface ChartProps {
  type: 'line' | 'area' | 'column'; // 迷你折线图，迷你面积图，迷你柱状图
  sectionType: 'day' | 'week' | 'month' | 'year'; // 分组类型
  maxCount?: number; // 迷你图最大的记录个数
  orderby?: 'text' | 'value' | 'code'; // 按什么排序,对于有序的如数据字典，可以按code排序
  orderDesc?: boolean; // 排序顺序
}

interface StaticCardProps {
  moduleName: string; // 模块名称
  title: string; // 指标名称
  fieldName: string; // 统计的字段名称
  aggregate: 'sum' | 'count'; // 聚合类型;
  dateFieldName: string; // 日期字段
  description?: string; // 指标的描述，放在右上角的圆形感叹号里
  filters?: any[]; // 查询的条件
  formatPattern?: string; // 数值format样式, 默认 0,000 , 0.000.00
  prefix?: React.ReactNode | string; // 金额前面的符号
  suffix?: React.ReactNode | string; // 金额前面的单位
  icon?: React.ReactNode; // 指标标题前面的图标
  monetary?: any; // 金额单位
  unittext?: string; // 数值单位，个，米
  relatives?: Relative[]; //
  chart?: ChartProps;
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
  containerToday?: boolean; // 同比的最后一天是否包含今天 , 默认不包含
  inFooter?: boolean; // 是否放在 StaticCard 的 footer 区域中, 默认不包含
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
  prefix,
  suffix,
  icon,
  description,
  relatives,
  formatPattern = '0,000',
  chart,
}) => {
  const [total, setTotal] = useState<number>(0);
  const [relativeDatas, setRelativeDatas] = useState<RelativeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const aggregateField = `${aggregate}.${fieldName}`;
  const aggregateFieldName = getColumnDataIndex(aggregateField);

  const getTitle = () => {
    if (description) {
      return (
        <div>
          <span>{title}</span>
          <span style={{ float: 'right' }}>
            <Tooltip title={description} trigger={['click']}>
              <InfoCircleOutlined />
            </Tooltip>
          </span>
        </div>
      );
    }
    return title;
  };

  const getRelativeDate = async (relative: Relative): Promise<RelativeData> => {
    const {
      sectionNumber = 1,
      monthOnMonth = false,
      containerToday = false,
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
      return await request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
        method: 'POST',
        data: serialize(
          stringifyObjectField({
            moduleName,
            fields: [aggregateField],
            navigatefilters: filters,
            userfilters: [
              {
                property: dateFieldName,
                operator: 'daysection',
                value: `${start.format(DateFormat)}--${end.format(DateFormat)}`,
              },
            ],
          }),
        ),
      });
    };
    let rec = await getSectionValue(startDate, endDate);
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
          <span>
            {sectionTitle}
            <Popover
              title={`${sectionTitle}计算过程`}
              content={
                <table className={styles.tooltiptable}>
                  <tr>
                    <th></th>
                    <th>起始日期</th>
                    <th>终止日期</th>
                    <th>指标数值</th>
                  </tr>
                  <tr>
                    <th>本期期间</th>
                    <td>{startDate}</td>
                    <td>{endDate}</td>
                    <td className={styles.tdvalue}>{numeral(thisValue).format(formatPattern)}</td>
                  </tr>
                  <tr>
                    <th>对比期间</th>
                    <td>{lastStartDate}</td>
                    <td>{lastEndDate}</td>
                    <td className={styles.tdvalue}>{numeral(lastValue).format(formatPattern)}</td>
                  </tr>
                  <tr>
                    <th>增长比例</th>
                    <td></td>
                    <td></td>
                    <td className={styles.tdvalue}>
                      {typeof ratio === 'undefined' ? '无对比数据' : numeral(ratio).format('0.00%')}
                    </td>
                  </tr>
                </table>
              }
              trigger={['click']}
            >
              <InfoCircleOutlined style={{ paddingLeft: '4px' }} />
            </Popover>
          </span>
        }
        value={typeof ratio === 'undefined' ? '无对比数据' : numeral(ratio).format('0.00%')}
        // eslint-disable-next-line
        trend={typeof ratio === 'undefined' ? undefined : ratio > 0 ? 'up' : 'down'}
        layout="horizontal"
      />
    );
  };

  const MiniChart: React.FC<any> = ({ chart }: { chart: ChartProps }) => {
    const [data, setData] = useState<TextValue[]>([]);
    const {
      type,
      sectionType,
      maxCount = 18,
      orderby = 'text',
      orderDesc = false,
    } = chart;

    useEffect(() => {
      request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
        method: 'POST',
        data: serialize(
          stringifyObjectField({
            moduleName,
            fields: [aggregateField],
            navigatefilters: filters,
            groupfieldid: { fieldname: dateFieldName, function: 'yyyy年mm月dd日' },
          }),
        ),
      }).then((response: any[]) => {
        const detailArray: TextValue[] = response
          .map((rec) => {
            const obj = {
              text: rec.text,
              value: rec[aggregateFieldName],
            };
            return obj;
          })
          .sort((rec1, rec2) => {
            if (rec1[orderby] > rec2[orderby]) return orderDesc ? -1 : 1;
            if (rec1[orderby] < rec2[orderby]) return orderDesc ? 1 : -1;
            return 0;
          }).filter((value, index, array) => array.length - index <= maxCount);
        console.log(detailArray);
        setData(detailArray);
      });
    }, []);

    var config: any = {
      height: 40,
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
        tickCount: 1
      },
      tooltip: {
        showTitle: false,
        formatter: (datum: any) => {
          return { name: datum.text, value: datum.value };
        },
      },
    };
    return <Column {...config} />;
  };

  useEffect(() => {
    setLoading(true);
    request(`${API_HEAD}/platform/datamining/fetchdata.do`, {
      method: 'POST',
      data: serialize(
        stringifyObjectField({
          moduleName,
          fields: [aggregateField],
          navigatefilters: filters,
        }),
      ),
    }).then(async (response: any[]) => {
      setTotal(response[0][aggregateFieldName]);
      if (relatives && relatives.length) {
        for (let i = 0; i < relatives.length; i += 1) {
          // eslint-disable-next-line
          const value = await getRelativeDate(relatives[i]);
          relativeDatas.push(value);
        }
        setRelativeDatas([...relativeDatas]);
      }
      setLoading(false);
    });
  }, []);

  return (
    <StatisticCard
      loading={loading}
      footer={
        <>
          {relativeDatas.length
            ? relativeDatas.map((relative) => getRelativeSection(relative))
            : null}

          {/* { <div style={{ display: 'flex', marginBottom: '4px' }}>
            <Statistic style={{ flex: 1 }} title="日同比" value="6.47%" trend="up" layout="vertical" />
            <span style={{ width: '16px' }}></span>
            <Statistic style={{ flex: 1 }} title="日同比" value="6.47%" trend="down" layout="vertical" />
          </div>} */}
        </>
      }
      statistic={{
        title: getTitle(),
        value: total,
        prefix,
        suffix,
        icon,
        // description
      }}
      chart={chart ? <MiniChart chart={chart} /> : null}
    />
  );
};

