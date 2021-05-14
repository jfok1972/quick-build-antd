import { SelectOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import React, { useRef, useState } from 'react';
import { ModuleHierarchyChart } from '../widget/ModuleHierarchyChart';

interface SelectModuleFieldProps {
  title: string;
  moduleName: string;
  defaultField?: string;
  callback: Function;
}

export const SelectModuleField: React.FC<SelectModuleFieldProps> = ({
  title,
  moduleName,
  callback,
  // defaultField,
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const ref = useRef();
  return (
    <Popover
      visible={visible}
      onVisibleChange={(v) => setVisible(v)}
      title={title}
      trigger={['click']}
      overlayStyle={{
        maxWidth: '80%',
        maxHeight: `${document.body.clientHeight - 200}px`,
        minHeight: '300px',
        overflow: 'auto',
      }}
      content={
        <ModuleHierarchyChart
          moduleName={moduleName}
          // defaultFieldahead={defaultFieldahead}
          ref={ref}
          onClick={(node: any) => {
            setVisible(false);
            callback(node);
          }}
        />
      }
    >
      <SelectOutlined />
    </Popover>
  );
};
