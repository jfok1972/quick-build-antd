/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { useRef } from 'react';
// 只能使用 11.1.3 版，再高的版本 createDndContext 无法使用
import { DndProvider, createDndContext } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const RNDContext = createDndContext(HTML5Backend);

/**
 * HTML5Backend 只能实例化一次，多次实例化会出错，因此使用Context来包含
 * @param {*} props
 */
const DragAndDropHOC = (props: any) => {
  const manager: any = useRef(RNDContext);
  return <DndProvider manager={manager.current.dragDropManager}>{props.children}</DndProvider>;
};

export default DragAndDropHOC;
