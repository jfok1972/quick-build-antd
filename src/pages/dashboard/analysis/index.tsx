import React from 'react';
import { BlockSchemes } from '@/pages/module/blockScheme';
import { UserApprove } from '../monitor/userApprove';

export default (): React.ReactNode => (
  <div style={{ margin: '-24px' }}>
    <BlockSchemes type="01" />
    <UserApprove />
  </div>
);
