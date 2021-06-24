import React, { useState, useMemo, useEffect } from 'react';
import { Card, Tooltip, Popover, Button } from 'antd';
import { getMonetaryUnitText } from '../../grid/monetary';
import { Area, Bar, Column, Line, Pie, Rose } from '@ant-design/charts';
import { apply, uuid } from '@/utils/utils';
import type { DataSetProps } from './dataset';
import { getDataSet } from './dataset';
import styles from './index.less';
import { FilterOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { DateSectionSelect } from '@/pages/dashboard/utils/DateSectionSelect';
import { getDefaultModuleState } from '../../modules';
import UserDefineFilter from '../../../module/UserDefineFilter';


const numeral = require('numeral');

interface AntdChartsProps {
  moduleName: string;
  type: 'line' | 'area' | 'column' | 'bar' | 'pie' | 'rose' | 'dualAxes' | 'gauge';
  title: string;
  description?: string;
  datasetProperty: DataSetProps; // 可以有二个dataSet
  config: any;
}

export const AntdCharts: React.FC<AntdChartsProps> = ({
  moduleName,
  type,
  title,
  description,
  datasetProperty,
  config,
}) => {
  const [dataSet, setDataSet] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    setLoading(true);
    getDataSet(datasetProperty).then((response: any) => {
      setDataSet(response);
      setLoading(false);
    });
  }, []);

  const chartConfig = useMemo(() => {
    const cConfig: any = { ...config };
    apply(cConfig, {
      data: dataSet,
      appendPadding: 12,
      loading,
      type,
    });
    // 如果没有定义,则设置一个缺省的
    if (cConfig.tooltip === undefined) {
      const field_1 = datasetProperty.fields[0];
      cConfig.tooltip = {
        showTitle: false,
        formatter: (datum: any) => {
          return {
            name: datum[datasetProperty.categoryName],
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
    return cConfig;
  }, [config, loading, dataSet]);

  console.log('render chart');
  console.log(datasetProperty);
  return (
    <Card
      className="imagecard"
      title={
        <span>
          {[
            title,
            description ? (
              <Tooltip key={uuid()} title={description} trigger={['click']}>
                <InfoCircleOutlined className={styles.infoicon} />
              </Tooltip>
            ) : null,
          ]}
        </span>
      }
      bordered={false}
      extra={<>
        <DateSectionSelect dateSection={[]} setDateSection={() => { }} />
        <Popover trigger={['click']}
          title={<span>设置筛选条件
            <span style={{ float: 'right' }}>
              <Button size='small' type='link'>重置</Button>
              <Button size='small' type='link'>查询</Button>
            </span>
          </span>}
          content={
          
            <UserDefineFilter
            visible={true}
            moduleState={getDefaultModuleState({moduleName})}
            dispatch={()=>{}}
          />
        
        
        }
        >
          <FilterOutlined />
        </Popover>
      </>}
    >
      {/* 加这个 Card 是为了 loading 的时候标题正常显示 */}
      <Card className="spacecard" bordered={false}>
        {type === 'column' ? <Column {...chartConfig} /> : null}
        {type === 'bar' ? <Bar {...chartConfig} /> : null}
        {type === 'line' ? <Line {...chartConfig} /> : null}
        {type === 'area' ? <Area {...chartConfig} /> : null}
        {type === 'pie' ? <Pie {...chartConfig} /> : null}
        {type === 'rose' ? <Rose {...chartConfig} /> : null}
      </Card>
    </Card>
  );
};
