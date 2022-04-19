/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { getMenuAwesomeIcon } from '@/utils/utils';
import { ArrowsAltOutlined, CloseOutlined, ShrinkOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Rnd } from 'react-rnd';
import { ACT_NAVIGATE_ADD_GROUP, ACT_TOGGLE_GROUP_REGION, DRAG_ITEM_GROUPFIELD } from './constants';
import type { DataminingModal } from './data';
import styles from './index.less';

interface GroupRegionProps {
  state: DataminingModal;
  dispatch: Function;
}

const GroupTag: React.FC<any> = ({ fieldid, title, iconCls, dispatch }) => {
  const [{ isDragging }, drag] = useDrag({
    item: { type: DRAG_ITEM_GROUPFIELD, fieldid, title },
    options: {
      dropEffect: 'copy', // 'copy' : 'move'
    },
    canDrag: true,
    collect: (monitor) => {
      return { isDragging: !!monitor.isDragging() };
    },
  });
  return (
    <span ref={drag}>
      <Button
        icon={iconCls ? getMenuAwesomeIcon(iconCls) : null}
        type={isDragging ? 'dashed' : 'default'}
        size="small"
        key={fieldid}
        onClick={() => {
          dispatch({
            type: ACT_NAVIGATE_ADD_GROUP,
            payload: {
              navigateGroup: {
                fieldid,
                title,
                iconCls,
              },
            },
          });
        }}
        color={isDragging ? 'warning' : 'default'}
      >
        {title}
      </Button>
    </span>
  );
};

const GroupRegion: React.FC<GroupRegionProps> = ({ state, dispatch }) => {
  const [bgc, setBgc] = useState('#fff');
  const [collapse, setCollapse] = useState(false);
  const [pos, setPos] = useState({
    left: document.documentElement.clientWidth - 240 - 24,
    top: 65 + 24,
  });
  let rndRef: any;
  const toggleVisible = () => {
    dispatch({
      type: ACT_TOGGLE_GROUP_REGION,
      payload: {},
    });
  };
  const toggleCollapse = () => {
    setCollapse((v) => !v);
  };
  return (
    <div
      className={styles.groupregion}
      style={{
        display: state.currSetting.groupRegionVisible ? 'block' : 'none',
        backgroundColor: bgc,
        left: pos.left,
        top: pos.top,
      }}
    >
      <Rnd
        style={{ zIndex: 10001 }}
        ref={(c) => {
          rndRef = c;
        }}
        enableResizing={false}
        default={{
          x: 0,
          y: 0,
          width: '100%',
          height: '24px',
        }}
        onDragStart={() => {
          setBgc('#fafafa');
        }}
        onDrag={() => {}}
        onDragStop={(e, d) => {
          rndRef.updatePosition({ x: 0, y: 0 });
          setBgc('#fff');
          setPos({
            left: Math.max(pos.left + d.x, 0),
            top: Math.max(pos.top + d.y, 0),
          });
        }}
      >
        <div style={{ height: '24px', backgroundColor: '#e0e2e5' }}>
          <span className={styles.groupregiontitle}>可分组项目</span>
          <CloseOutlined className={styles.tool} onClick={toggleVisible} />
          {collapse ? (
            <ArrowsAltOutlined className={styles.tool} onClick={toggleCollapse} />
          ) : (
            <ShrinkOutlined className={styles.tool} onClick={toggleCollapse} />
          )}
        </div>
      </Rnd>
      <div className={styles.groupregindeephead} />
      <div className={styles.groupregionbody} style={{ display: collapse ? 'none' : 'block' }}>
        <Space size={[6, 6]} wrap>
          {state.expandGroupFields?.map((group) => (
            <GroupTag
              key={group.fieldid}
              fieldid={group.fieldid}
              title={group.title}
              iconCls={group.iconCls}
              dispatch={dispatch}
            />
          ))}
        </Space>
      </div>
    </div>
  );
};

export default GroupRegion;
