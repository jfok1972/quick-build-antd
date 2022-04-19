/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useContext, useState, useMemo, useEffect } from 'react';
import { Card, Tooltip, Popover, Badge, Radio, Table } from 'antd';
import { getMonetaryUnitText } from '../../grid/monetary';
import { Area, Bar, BidirectionalBar, Column, DualAxes, Line, Pie, Rose } from '@ant-design/charts';
import { apply, uuid } from '@/utils/utils';
import type { DataSetProps } from './dataset';
import { getDataSet } from './dataset';
import styles from './index.less';
import {
  AreaChartOutlined,
  BarChartOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  OrderedListOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { getDefaultModuleState } from '../../modules';
import UserDefineFilter, {
  changeUserFilterToParam,
  UserInlineDefineFilter,
} from '../../../module/UserDefineFilter';
import type { ModuleState } from '../../data';
import { WidgetParentUserFiltersContext } from '../../blockScheme';

const numeral = require('numeral');

interface AntdChartsProps {
  moduleName: string;
  type:
    | 'line'
    | 'area'
    | 'column'
    | 'bar'
    | 'pie'
    | 'rose'
    | 'dualAxes'
    | 'bidirectionalBar'
    | 'gauge';
  title: string;
  filterSchemeid?: string;
  filterPosition?: 'inline' | 'inPopover';
  description?: string;
  datasetProperty: DataSetProps | DataSetProps[]; // 可以有二个dataSet
  config: any; // 如果有多个dataset,则可以定义 config : [{},{}]来对应每一个dataSet
}

export const AntdCharts: React.FC<AntdChartsProps> = ({
  moduleName,
  type,
  title,
  filterSchemeid,
  filterPosition,
  description,
  // 可以定义为DataSetProps，或者是一个数组，可以切换不同的分组方式
  datasetProperty: datasetDefine,
  config,
}) => {
  const [dataSet, setDataSet] = useState<any[]>([]);
  const [datasetProperty, setDatasetProperty] = useState<DataSetProps>(
    Array.isArray(datasetDefine) ? datasetDefine[0] : datasetDefine,
  );
  const [userfilters, setUserfilters] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [moduleState, setModuleState] = useState<ModuleState>(
    getDefaultModuleState({ moduleName }),
  );
  const [showTable, setShowTable] = useState<boolean>(false); // 是否显示数据页
  const [gridColumns, setGridColumns] = useState<any[]>([]); // table的column列表
  const [icon, setIcon] = useState<any>(null);
  // 父容器上面的用户筛选条件
  const { parnetUserFilters } = useContext(WidgetParentUserFiltersContext);
  // 获得数据
  useEffect(() => {
    setLoading(true);
    getDataSet(datasetProperty, userfilters.concat(parnetUserFilters)).then((response: any) => {
      setLoading(false);
      setDataSet(response);
    });
  }, [datasetProperty, userfilters, parnetUserFilters]);
  // 获得table columns
  useEffect(() => {
    const {
      categoryName = 'text',
      groupfieldid2,
      categoryName2 = 'text2',
      fields,
    } = datasetProperty;
    const columns = [];
    columns.push({
      dataIndex: categoryName,
      title: categoryName,
    });
    if (groupfieldid2) {
      columns.push({
        dataIndex: categoryName2,
        title: categoryName2,
      });
    }
    fields.forEach((field) => {
      columns.push({
        dataIndex: field.title,
        title: field.title,
        align: 'right',
        render: (value: any) => numeral(value).format(field.formatPattern || '0,0'),
      });
    });
    setGridColumns(columns);
  }, [datasetProperty]);

  const chartConfig = useMemo(() => {
    let cConfig: any = { type, ...config };
    if (Array.isArray(config)) {
      // 设置当前dataSet在数组中位置的config
      const index = (datasetDefine as DataSetProps[]).findIndex(
        (rec) => rec.menuText === datasetProperty.menuText,
      );
      cConfig = { type, ...config[Math.max(0, Math.min(config.length - 1, index))] };
    }
    apply(cConfig, {
      data: cConfig.type === 'dualAxes' ? [dataSet, dataSet] : dataSet,
      appendPadding: 12,
      loading,
    });
    // 如果没有定义,则设置一个缺省的
    if (!['dualAxes', 'bidirectionalBar'].includes(cConfig.type)) {
      if (cConfig.tooltip === undefined) {
        const field_1 = datasetProperty.fields[0];
        cConfig.tooltip = {
          showTitle: true,
          formatter: (datum: any) => {
            // 只有一个指标列，在tooltip中显示的是指标名称：数值，有seriesField则显示seriesField名称
            return {
              name: cConfig.seriesField ? datum[cConfig.seriesField] : field_1.title,
              // datum[datasetProperty.categoryName as string],
              value:
                numeral(datum[field_1.title] / (field_1.monetaryUnit || 1)).format(
                  field_1.formatPattern || '0',
                ) + getMonetaryUnitText(field_1.monetaryUnit, field_1.unitText),
            };
          },
        };
      }
      if (cConfig.label === undefined) {
        cConfig.label = {
          formatter: (datum: any) => {
            const field_1 = datasetProperty.fields[0];
            return (
              numeral(datum[field_1.title] / (field_1.monetaryUnit || 1)).format(
                field_1.formatPattern || '0',
              ) + getMonetaryUnitText(field_1.monetaryUnit)
            );
          },
        };
      }
    }
    // 在允许显示滚动条的情况，显示多少个，sliderVisibleCount = 正数，从头开始， = 负数，从尾开始
    if (cConfig.slider && cConfig.sliderVisibleCount) {
      const count = Math.abs(cConfig.sliderVisibleCount);
      const slider = {
        start: 0,
        end: 1,
      };
      if (dataSet.length > count) {
        if (cConfig.sliderVisibleCount > 0)
          apply(slider, {
            end: Math.min(1, dataSet.length > 0 ? count / dataSet.length : 1),
          });
        else
          apply(slider, {
            start: 1 - Math.min(1, dataSet.length > 0 ? count / dataSet.length : 1),
          });
        apply(cConfig.slider, slider);
      } else delete cConfig.slider;
    }
    console.log(cConfig);
    return cConfig;
  }, [loading, dataSet]);

  let userFilter = null;

  const PopoverFilter = () => {
    const [filterVisible, setFilterVisible] = useState<boolean>(false);
    return (
      <Popover
        visible={filterVisible}
        onVisibleChange={(v) => {
          setFilterVisible(v);
        }}
        trigger={['click']}
        title="设置筛选条件"
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
    );
  };

  if (filterSchemeid) {
    if (filterPosition === 'inline') {
      userFilter = (
        <UserInlineDefineFilter
          moduleState={moduleState}
          dispatch={(params: any) => {
            // 在重置的时候，需要把UserDefineFilter中的记录都清空，因此加了这一个moduleState
            if (params.type === 'modules/filterChanged') {
              moduleState.filters.userfilter = params.payload.userfilter;
              setModuleState({ ...moduleState });
              setUserfilters(changeUserFilterToParam(params.payload.userfilter));
            }
          }}
          filterSchemeid={filterSchemeid}
        />
      );
    } else {
      userFilter = <PopoverFilter />;
    }
  }

  const titleComponent: any[] = [];
  if (Array.isArray(datasetDefine)) {
    const sepa = title.split('--');
    titleComponent.push(sepa[0]);
    titleComponent.push(
      <Radio.Group
        value={datasetProperty.menuText}
        size="small"
        style={{ margin: '0px 8px', fontWeight: 400 }}
        onChange={(e) => {
          setDatasetProperty(
            datasetDefine.find((rec) => rec.menuText === e.target.value) as DataSetProps,
          );
        }}
      >
        {datasetDefine.map((rec) => (
          <Radio.Button key={rec.menuText} value={rec.menuText}>
            {rec.menuText}
          </Radio.Button>
        ))}
      </Radio.Group>,
    );
    if (sepa.length > 1) titleComponent.push(sepa[1]);
  } else titleComponent.push(title);

  const table = (
    <Table
      size="small"
      bordered
      columns={gridColumns}
      dataSource={dataSet}
      style={{ height: '100%' }}
      pagination={false}
      scroll={{ y: '300px' }}
      rowSelection={{}}
    />
  );

  const chart = useMemo(() => {
    const t = chartConfig.type;
    setIcon(<BarChartOutlined />);
    if (t === 'column') {
      return <Column key={uuid()} {...chartConfig} />; // 柱形图
    }
    if (t === 'bar') {
      return <Bar key={uuid()} {...chartConfig} />; // 条形图
    }
    if (t === 'line') {
      setIcon(<LineChartOutlined />);
      return <Line key={uuid()} {...chartConfig} />; // 折线图
    }
    if (t === 'area') {
      setIcon(<AreaChartOutlined />);
      return <Area key={uuid()} {...chartConfig} />; // 面积图
    }
    if (t === 'pie') {
      setIcon(<PieChartOutlined />);
      return <Pie key={uuid()} {...chartConfig} />; // 饼图
    }
    if (t === 'rose') {
      setIcon(<PieChartOutlined />);
      return <Rose key={uuid()} {...chartConfig} />; // 玫瑰图
    }
    if (t === 'dualAxes') return <DualAxes key={uuid()} {...chartConfig} />; // 双轴图
    if (t === 'bidirectionalBar') return <BidirectionalBar key={uuid()} {...chartConfig} />; // 对称条形图
    return null;
  }, [chartConfig]);

  return (
    <Card
      className="imagecard"
      title={
        <span>
          {[
            <span
              style={{ marginRight: '4px', cursor: 'pointer' }}
              onClick={() => {
                setShowTable((value) => !value);
              }}
            >
              {showTable ? <OrderedListOutlined /> : icon}
            </span>,
            titleComponent,
            description ? (
              <Tooltip key={uuid()} title={description} trigger={['click']}>
                <InfoCircleOutlined className={styles.infoicon} />
              </Tooltip>
            ) : null,
          ]}
        </span>
      }
      bordered={false}
      extra={userFilter}
    >
      {/* 加这个 Card 是为了 loading 的时候标题正常显示 */}
      <Card className="spacecard" bordered={false}>
        {showTable ? table : chart}
      </Card>
    </Card>
  );
};
