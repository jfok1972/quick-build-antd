/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { Layout } from 'antd';
import type { Dispatch } from 'redux';
import type { ResizableProps } from 're-resizable';
import { Resizable } from 're-resizable';
import type { ModuleState } from '../data';
import Navigate from '.';
import { getModuleInfo } from '../modules';

const { Sider } = Layout;

export const NavigateSider = ({
  moduleState,
  dispatch,
}: {
  moduleState: ModuleState;
  dispatch: Dispatch;
}) => {
  const { moduleName } = moduleState;
  const moduleInfo = getModuleInfo(moduleName);
  if (!moduleInfo.navigateSchemes.length) return null;
  const { visible } = moduleState.currSetting.navigate;
  const toggleNavigateVisible = () => {
    dispatch({
      type: 'modules/toggleNavigate',
      payload: {
        moduleName,
        toggle: 'visible',
      },
    });
  };

  const MINWIDTH = 120;
  const resizableProps: ResizableProps = {
    enable: {
      top: false,
      right: true,
      bottom: false,
      left: false,
      topRight: false,
      bottomRight: false,
      bottomLeft: false,
      topLeft: false,
    },
    minWidth: visible ? MINWIDTH : undefined,
    maxWidth: 500,
    size: !visible ? { width: 0, height: 0 } : undefined,
    onResizeStop: (event, direction, elementRef: HTMLElement) => {
      const width = parseInt(elementRef.style.width, 10);
      if (width <= MINWIDTH) {
        setTimeout(() => {
          toggleNavigateVisible();
        }, 0);
      }
    },
  };

  return visible ? (
    <Resizable {...resizableProps}>
      <Sider
        key="visibleSider"
        style={{ marginBottom: '20px', minWidth: '120px' }}
        collapsed={false}
        collapsible
        theme="light" // {defineConfig.antd.dark ?  "light" : 'dark'}
        breakpoint="lg"
        width="auto"
        collapsedWidth="0"
        zeroWidthTriggerStyle={{
          width: '24px',
          right: visible ? '-24px' : '-8px',
        }}
        onBreakpoint={(broken) => {
          if (broken) {
            // 如果缩小到指定宽度了
            if (visible)
              // 如果当前正在显示
              toggleNavigateVisible(); // 拉大的时候不自动显示了
          }
        }}
        onCollapse={(_collapsed, type) => {
          if (type === 'clickTrigger') {
            toggleNavigateVisible();
          }
        }}
      >
        <Navigate moduleState={moduleState} dispatch={dispatch} />
      </Sider>
    </Resizable>
  ) : (
    <Sider
      key="invisibleSider"
      style={{ marginBottom: '20px', minWidth: '120px' }}
      collapsed
      collapsible
      theme="light" // {defineConfig.antd.dark ?  "light" : 'dark'}
      collapsedWidth="0"
      zeroWidthTriggerStyle={{
        width: '24px',
        right: visible ? '-24px' : '-8px',
      }}
      onCollapse={(_collapsed, type) => {
        if (type === 'clickTrigger') {
          toggleNavigateVisible();
        }
      }}
    />
  );
};
