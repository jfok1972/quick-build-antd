/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Tooltip, Radio } from 'antd';
import type { Dispatch } from 'redux';
import type { RadioChangeEvent } from 'antd/lib/radio';
import type { ModuleModal, ModuleState } from '../data';
import { getModuleInfo, getAllGridSchemes } from '../modules';

const GridSchemeButton = ({
  moduleState,
  dispatch,
}: {
  moduleState: ModuleState;
  dispatch: Dispatch;
}) => {
  const { moduleName } = moduleState;
  const moduleInfo: ModuleModal = getModuleInfo(moduleName);
  const schemes: any[] = getAllGridSchemes(moduleInfo.gridschemes);
  if (schemes.length < 2) return <span style={{ visibility: 'hidden', width: '0px' }}>1</span>;
  return (
    <Radio.Group
      value={moduleState.currentGridschemeid}
      size="small"
      onChange={(e: RadioChangeEvent) => {
        dispatch({
          type: 'modules/gridSchemeChanged',
          payload: {
            moduleName,
            gridschemeid: e.target.value,
          },
        });
      }}
    >
      {schemes.map((scheme: any, index: number) => (
        <Tooltip title={scheme.schemename} key={`key-${index.toString()}`}>
          <Radio.Button value={scheme.gridschemeid} key={`radio-${index.toString()}`}>
            <span>{index + 1}</span>
          </Radio.Button>
        </Tooltip>
      ))}
    </Radio.Group>
  );
};

export default GridSchemeButton;
