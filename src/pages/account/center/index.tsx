/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

import React, { Component } from 'react';
import {
  TagOutlined,
  PlusOutlined,
  GiftOutlined,
  ClusterOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { Card, Col, Divider, Input, Row, Tag, Tabs } from 'antd';
import type { Dispatch } from 'redux';
import { GridContent } from '@ant-design/pro-layout';
import type { RouteChildrenProps } from 'react-router';
import { connect } from 'dva';
import type { ModalState } from '@/models/accountCenter';
import { DisplayUserLimits } from '@/pages/module/additionalAction/userLimit';
import type { DetailGridPrpos } from '@/pages/module/detailGrid';
import DetailGrid from '@/pages/module/detailGrid';
import { API_HEAD } from '@/utils/request';
import { currentUser } from 'umi';
import styles from './Center.less';
import type { CurrentUser } from './data.d';
import { getCityText, getProvinceText } from '../settings/components/baseView';

const operationTabList = [
  {
    key: 'userLimits',
    tab: <span>我的操作权限</span>,
  },
  {
    key: 'userLoginLog',
    tab: <span>我的登录日志</span>,
  },
  {
    key: 'userOperateLog',
    tab: <span>我的操作日志</span>,
  },
];

interface CenterProps extends RouteChildrenProps {
  dispatch: Dispatch<any>;
  currentUser: Partial<CurrentUser>;
  currentUserLoading: boolean;
  userid: string;
}
interface CenterState {
  tabKey: 'userLimits' | 'userLoginLog' | 'userOperateLog';
  inputVisible: boolean;
  inputValue: string;
  signatureInputVisible: boolean;
}

const { TabPane } = Tabs;

class Center extends Component<CenterProps, CenterState> {
  state: CenterState = {
    // eslint-disable-next-line react/no-unused-state
    tabKey: 'userLimits',
    inputVisible: false,
    inputValue: '',
    signatureInputVisible: false,
  };

  public input: any | null | undefined = undefined;

  public signatureInput: any | null | undefined = undefined;

  componentDidMount() {
    const {
      dispatch,
      currentUser: { personnel },
    } = this.props;
    if (!(personnel && personnel.name)) {
      dispatch({
        type: 'accountCenter/fetchCurrent',
      });
    }
  }

  onTabChange = (key: string) => {
    this.setState({
      // eslint-disable-next-line react/no-unused-state
      tabKey: key as CenterState['tabKey'],
    });
  };

  showInput = () => {
    this.setState({ inputVisible: true }, () => this.input && this.input.focus());
  };

  saveInputRef = (input: any | null) => {
    this.input = input;
  };

  saveSignatureInputRef = (input: any | null) => {
    this.signatureInput = input;
  };

  handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ inputValue: e.target.value });
  };

  signatureInputConfirm = () => {
    const { dispatch } = this.props;
    let text: string = this.signatureInput && this.signatureInput.state.value;
    if (text) text = text.trim();
    dispatch({
      type: 'accountCenter/editSignature',
      payload: {
        text: text || '',
      },
    });
    this.setState({
      signatureInputVisible: false,
    });
  };

  handleInputConfirm = () => {
    const { state } = this;
    let { inputValue } = state;
    const { dispatch } = this.props;
    const {
      currentUser: { personnel },
    } = this.props;
    const { tags } = personnel;
    inputValue = inputValue && inputValue.trim();
    if (inputValue && tags.filter((tag: any) => tag.label === inputValue).length === 0) {
      dispatch({
        type: 'accountCenter/addTag',
        payload: {
          label: inputValue,
        },
      });
    }
    this.setState({
      inputVisible: false,
      inputValue: '',
    });
  };

  removeTag = (label: string) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'accountCenter/removeTag',
      payload: {
        label,
      },
    });
  };

  renderChildrenByTabKey = (tabKey: CenterState['tabKey'], userid: string) => {
    if (tabKey === 'userOperateLog') {
      const params: DetailGridPrpos = {
        moduleName: 'FUseroperatelog',
        parentOperateType: 'display',
        enableUserFilter: true,
        parentFilter: {
          moduleName: 'FUser', // 父模块名称
          fieldahead: 'FUser', // 子模块到父模块的路径
          fieldName: 'userid', // 子模块中的关联？
          fieldtitle: '系统用户',
          operator: '=',
          fieldvalue: currentUser.userid || '',
          text: '我的操作日志',
        },
      };
      return <DetailGrid {...params} key="userOperateLog" />;
    }
    if (tabKey === 'userLimits') {
      return <DisplayUserLimits userid={userid} />;
    }
    if (tabKey === 'userLoginLog') {
      const params: DetailGridPrpos = {
        moduleName: 'FUserloginlog',
        parentOperateType: 'display',
        enableUserFilter: true,
        parentFilter: {
          moduleName: 'FUser', // 父模块名称
          fieldahead: 'FUser', // 子模块到父模块的路径
          fieldName: 'userid', // 子模块中的关联？
          fieldtitle: '系统用户',
          operator: '=',
          fieldvalue: currentUser.userid || '',
          text: '我的登录日志',
        },
      };
      return <DetailGrid {...params} key="userLoginLog" />;
    }
    return null;
  };

  render() {
    const { inputVisible, inputValue, signatureInputVisible } = this.state;
    const {
      currentUser: { personnel, user },
      currentUserLoading,
      userid,
    } = this.props;
    const dataLoading = currentUserLoading || !(personnel && Object.keys(personnel).length);
    return (
      <GridContent>
        <Row gutter={24}>
          <Col lg={6} md={24}>
            <Card bordered={false} style={{ marginBottom: 24 }} loading={dataLoading}>
              {!dataLoading ? (
                <div>
                  <div className={styles.avatarHolder}>
                    <img
                      alt="用户头像"
                      src={`${API_HEAD}/platform/systemframe/getuserfavicon.do`}
                      style={{ borderRadius: '50%' }}
                    />
                    <div className={styles.name}>{personnel.name}</div>
                    {signatureInputVisible ? (
                      <Input
                        ref={(ref) => this.saveSignatureInputRef(ref)}
                        type="text"
                        size="small"
                        style={{ width: '80%' }}
                        maxLength={30}
                        defaultValue={personnel.signature}
                        onBlur={this.signatureInputConfirm}
                        onPressEnter={this.signatureInputConfirm}
                      />
                    ) : (
                      <div
                        onClick={() => {
                          this.setState(
                            { signatureInputVisible: true },
                            () => this.signatureInput && this.signatureInput.focus(),
                          );
                        }}
                      >
                        {personnel.signature ? personnel.signature : '上善若水，厚德载物'}
                      </div>
                    )}
                  </div>
                  <div className={styles.detail}>
                    <p>
                      <GiftOutlined style={{ marginRight: '4px' }} />
                      {personnel.technical} {personnel.stationname}
                    </p>
                    <p>
                      <ClusterOutlined style={{ marginRight: '4px' }} />
                      {personnel.orgfullname}
                    </p>
                    <p>
                      <EnvironmentOutlined style={{ marginRight: '4px' }} />
                      {getProvinceText(personnel.province)} {getCityText(personnel.city)}
                    </p>
                  </div>
                  <Divider dashed />
                  <div className={styles.tags}>
                    <div className={styles.tagsTitle}>个人标签</div>
                    {personnel.tags.map((item: any) => (
                      <Tag key={item.key} closable onClose={() => this.removeTag(item.label)}>
                        {item.label}
                      </Tag>
                    ))}
                    {inputVisible && (
                      <Input
                        ref={(ref) => this.saveInputRef(ref)}
                        type="text"
                        size="small"
                        style={{ width: 78 }}
                        maxLength={20}
                        value={inputValue}
                        onChange={this.handleInputChange}
                        onBlur={this.handleInputConfirm}
                        onPressEnter={this.handleInputConfirm}
                      />
                    )}
                    {!inputVisible && (
                      <Tag onClick={this.showInput} style={{ borderStyle: 'dashed' }}>
                        <PlusOutlined />
                      </Tag>
                    )}
                  </div>
                  <Divider style={{ marginTop: 16 }} dashed />
                  <div className={styles.team}>
                    <div className={styles.teamTitle}>权限组</div>
                    <Row gutter={36}>
                      {user.roles &&
                        user.roles.map((item: any) => (
                          <Col key={item} lg={24} xl={24}>
                            <TagOutlined /> <i />
                            {item}
                          </Col>
                        ))}
                    </Row>
                  </div>
                </div>
              ) : null}
            </Card>
          </Col>
          <Col lg={18} md={24}>
            <Card bodyStyle={{ paddingTop: 0 }}>
              <Tabs>
                {operationTabList.map((tab) => (
                  <TabPane key={tab.key} tab={tab.tab}>
                    {this.renderChildrenByTabKey(tab.key as CenterState['tabKey'], userid)}
                  </TabPane>
                ))}
              </Tabs>
            </Card>
          </Col>
        </Row>
      </GridContent>
    );
  }
}

export default connect(
  ({
    loading,
    accountCenter,
    user,
  }: {
    loading: { effects: Record<string, boolean> };
    accountCenter: ModalState;
    user: any;
  }) => ({
    userid: user.currentUser.userid,
    currentUser: accountCenter.currentUser,
    currentUserLoading: loading.effects['accountCenter/fetchCurrent'],
  }),
)(Center);
