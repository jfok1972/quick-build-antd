/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React from 'react';
import type { ParentFilterModal } from '../data';
import DetailGrid from '../detailGrid';
import { getModuleInfo } from '../modules';

interface AttachmentGridProps {
  moduleName: string;
  idvalue: string;
  titlevalue: string;
  readOnly: boolean;
}

export const AttachmentGrid: React.FC<AttachmentGridProps> = ({
  moduleName,
  idvalue,
  titlevalue,
  readOnly,
}) => {
  const moduleInfo = getModuleInfo(moduleName);
  const parentFilter: ParentFilterModal = {
    moduleName,
    fieldahead: null,
    fieldName: 'objectid',
    fieldtitle: moduleInfo.title,
    operator: '=',
    fieldvalue: idvalue,
    text: titlevalue,
  };

  return (
    <DetailGrid
      moduleName="FDataobjectattachment"
      parentFilter={parentFilter}
      parentOperateType="display"
      readOnly={readOnly}
    />
  );
};
