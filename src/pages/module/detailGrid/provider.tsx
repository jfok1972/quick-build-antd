/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { useReducer } from 'react';
import type { DataminingFilterModal, ParentFilterModal, ParentFormModal } from '../data';
import { getDefaultModuleState } from '../modules';
import {
  moduleStateReducer,
  DetailModelContext,
  wrapperDispatch,
  wrapperSelectDispatch,
} from './model';

interface DetailModelProviderProps {
  moduleName: string;
  parentFilter?: ParentFilterModal;
  dataminingFilter?: DataminingFilterModal;
  parentForm?: ParentFormModal;
  children: any;
}

export const DetailModelProvider: React.FC<DetailModelProviderProps> = ({
  moduleName,
  parentFilter,
  dataminingFilter,
  parentForm,
  children,
}) => {
  const [moduleState, dispatch] = useReducer(
    moduleStateReducer,
    getDefaultModuleState({ moduleName, parentFilter, dataminingFilter, parentForm }),
  );
  return (
    <DetailModelContext.Provider
      value={{
        moduleState,
        dispatch: wrapperDispatch(moduleState, dispatch),
      }}
    >
      {children}
    </DetailModelContext.Provider>
  );
};

interface SelectModelProviderProps {
  moduleName: string;
  children: any;
}

export const SelectModelProvider: React.FC<SelectModelProviderProps> = ({
  moduleName,
  children,
}) => {
  const [moduleState, dispatch] = useReducer(
    moduleStateReducer,
    getDefaultModuleState({ moduleName }),
  );
  return (
    <DetailModelContext.Provider
      value={{
        moduleState,
        dispatch: wrapperSelectDispatch(moduleState, dispatch),
      }}
    >
      {children}
    </DetailModelContext.Provider>
  );
};
