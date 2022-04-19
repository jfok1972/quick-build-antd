/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import { SearchOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import useMergeValue from 'use-merge-value';
import type { AutoCompleteProps } from 'antd/es/auto-complete';
import React, { useRef } from 'react';
import PinyinMatch from 'pinyin-match';
import classNames from 'classnames';
import styles from './index.less';

export interface HeaderSearchProps {
  onChange?: (value?: string) => void;
  onFocus?: () => void;
  onVisibleChange?: (b: boolean) => void;
  className?: string;
  placeholder?: string;
  options: AutoCompleteProps['options'];
  defaultOpen?: boolean;
  open?: boolean;
  defaultValue?: string;
  value?: string;
}

const HeaderSearch: React.FC<HeaderSearchProps> = (props) => {
  const {
    className,
    defaultValue,
    onVisibleChange,
    onFocus,
    placeholder,
    open,
    defaultOpen,
    ...restProps
  } = props;

  const inputRef: any = useRef<any | null>(null);

  const [value, setValue] = useMergeValue<string | undefined>(defaultValue, {
    value: props.value,
    onChange: props.onChange,
  });

  const [searchMode, setSearchMode] = useMergeValue(defaultOpen || false, {
    value: props.open,
    onChange: onVisibleChange,
  });

  const inputClass = classNames(styles.input, {
    [styles.show]: searchMode,
  });

  return (
    <div
      className={classNames(className, styles.headerSearch)}
      onClick={() => {
        setSearchMode(true);
        if (searchMode && inputRef.current) {
          inputRef.current.focus();
        }
      }}
      onTransitionEnd={({ propertyName }) => {
        if (propertyName === 'width' && !searchMode) {
          if (onVisibleChange) {
            onVisibleChange(searchMode);
          }
        }
      }}
    >
      <SearchOutlined
        key="Icon"
        style={{
          cursor: 'pointer',
        }}
      />
      <Select
        key="AutoComplete"
        className={inputClass}
        showSearch
        allowClear
        value={value}
        style={{
          height: 28,
          marginTop: -6,
        }}
        options={restProps.options}
        onChange={setValue}
        onFocus={onFocus}
        filterOption={(fvalue, option: any) => {
          return !!PinyinMatch.match(option.label, fvalue);
        }}
        ref={inputRef}
        defaultValue={defaultValue}
        aria-label={placeholder}
        placeholder={placeholder}
        onBlur={() => {
          setSearchMode(false);
        }}
      />
    </div>
  );
};

export default HeaderSearch;
