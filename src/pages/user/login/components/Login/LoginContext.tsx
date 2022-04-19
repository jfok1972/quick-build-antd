/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { createContext } from 'react';

export interface LoginContextProps {
  tabUtil?: {
    addTab: (id: string) => void;
    removeTab: (id: string) => void;
  };
  updateActive?: (activeItem: Record<string, string> | string) => void;
}

const LoginContext: React.Context<LoginContextProps> = createContext({});

export default LoginContext;
