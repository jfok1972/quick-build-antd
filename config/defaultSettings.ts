/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */
import { Settings as ProSettings } from '@ant-design/pro-layout';

type DefaultSettings = ProSettings & {
  pwa: boolean;
  monetaryType: 'unit' | 'thousand' | 'tenthousand' | 'million' | 'hundredmillion';
  monetaryPosition: 'behindnumber' | 'columntitle';
};

const proSettings: DefaultSettings = {
  navTheme: 'dark',
  // 拂晓蓝
  primaryColor: '#1890ff',
  // 'side' | 'top' | 'mix';
  layout: 'side',
  contentWidth: 'Fluid',
  fixedHeader: true,
  fixSiderbar: true,
  colorWeak: false,
  menu: {
    locale: true,
  },
  title: '快速架构系统',
  pwa: false,
  iconfontUrl: '',

  monetaryType: 'tenthousand',
  monetaryPosition: 'behindnumber',
};

export type { DefaultSettings };

export default proSettings;
