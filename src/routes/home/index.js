import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { List, Button, Toast, ActivityIndicator } from 'antd-mobile';
import Icon from '../../components/icon';
import './style.less';
import { getDynamics, dynamicLikes } from '../../services/api_dynamics';
import { NavOpen } from '../../components/AnimateNavios';
import { dialogOpen } from '../../components/dialog/test2';
import Event from '../../components/dialog/event';
import ListView from '../../components/scrollView';

const Item = List.Item;


export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.fetchData = this.fetchData.bind(this);
    this.state = {
      dataSource: [],
      isLoading: true,
      offset: 0,
      hasMore: 1,
      refreshing: false,
    };
  }

  componentDidMount() {
    // you can scroll to the specified position
    // setTimeout(() => this.lv.scrollTo(0, 120), 800);

    // simulate initial Ajax
    this.fetchData();
    Event.addEvent('_list_refresh', this.onRefresh);
  }

  onEndReached = () => {
    // load new data
    // hasMore: from backend data, indicates whether it is the last page, here is false
    if (this.state.isLoading || !this.state.hasMore) {
      return;
    }
    this.setState({ isLoading: true });
    this.fetchData(this.state.offset);
  };
  onRefresh = () => {
    if (this.state && this.state.refreshing || this.state.isLoading) {
      return;
    }
    this.setState({ refreshing: true });
    // simulate initial Ajax
    Event.fireEvent('wrappers_scrollTo', 0, 0);
    this.fetchData(0, true);
  };
  async fetchData(now = 0, isRefresh = false) {
    const data = await getDynamics({ offset: now });
    if (!data) {
      this.setState({
        isLoading: false,
      });
      return;
    }
    const { dynamics, hasMore, offset } = data;
    if (now === 0) {
      Toast.success(`已拉取${dynamics.length}条动态：）`);
    }
    this.setState({
      dataSource: isRefresh ? dynamics : this.state.dataSource.concat(dynamics),
      offset,
      hasMore: !!hasMore,
      isLoading: false,
      refreshing: false,
    });
  }
  renderFooter = isLoading => (
    <div
      className="home-footer"
    >{isLoading ? <ActivityIndicator text="正在加载" /> : '我也是有底线的'}</div>
  );
  render() {
    const { dataSource, isLoading, refreshing } = this.state;
    return [
      refreshing ? <div className="center" key={1}><ActivityIndicator text="正在刷新" /></div> : null,
      <ListView
        key={2}
        isLoading={isLoading}
        onEndReached={this.onEndReached}
        renderFooter={this.renderFooter}
        dataSource={dataSource}
        row={Row}
      />,
    ];
  }
}
const Row = (prop) => {
  const {
    headImgUrl,
    nickname,
    brief,
    pubTime,
    likeNum,
    commentNum,
    id,
    img = [],
    isLike = false,
    isWhole = true,
  } = prop;
  return (
    <div
      key={id}
      style={{ backgroundImage: 'url(\'https://img.t.sinajs.cn/t6/skin/public/feed_cover/star_108_os7.png\')' }}
      className={'home-row test2'}
      onClick={() => open({ title: nickname, id })}
    >
      <Item
        align="top"
        thumb={headImgUrl}
      >
        {nickname}
        <div className="time">{pubTime}</div>
      </Item>
      <pre className={'row-brief'}>
        {brief}
        {!!isWhole || <span className="readMore">全文</span>}
      </pre>
      {
        img.map(item => (<img src={item} alt="" />))
      }
      <div className={'btn-group'}>
        <Button
          onClick={openForward}
          size={'small'}
          icon={<Icon type={require('../../assets/icon/forward.svg')} />}
        >转发</Button>
        <Button
          onClick={openComment}
          size={'small'}
          icon={<Icon type={require('../../assets/icon/comment.svg')} />}
        >{ commentNum || '评论'}</Button>
        <WrapButton size={'small'} id={id} isLike={!!isLike} likeNum={likeNum} />
      </div>
    </div>
  );
};

Home.rightBtn = () => {
  return <Icon type={require('../../assets/icon/post.svg')} onClick={() => dialogOpen('write')} />;
};
Home.leftBtn = () => {
  return <Icon type={require('../../assets/icon/refresh.svg')} onClick={() => Event.fireEvent('_list_refresh')} />;
};

Home.Row = Row;

function openComment(e) {
  e.stopPropagation();
  dialogOpen('comment');
}
function openForward(e) {
  e.stopPropagation();
  dialogOpen('forward');
}
function open({ title, id }) {
  NavOpen('detail', { title, id });
}


class WrapButton extends React.PureComponent {
  constructor(...arg) {
    super(...arg);
    this.clickHandle = this.clickHandle.bind(this);
  }
  state = {
    isLike: this.props.isLike,
    num: this.props.likeNum,
    loading: false,
  };
  componentWillReceiveProps({ isLike, likeNum }) {
    this.setState({
      isLike,
      num: likeNum,
    });
  }
  async clickHandle(e) {
    e.stopPropagation();
    if (this.state.loading) {
      Toast.info('操作太快啦😣', 1);
      return;
    }
    this.setState({
      loading: true,
    });
    const data = await dynamicLikes(this.state.isLike ? 'DELETE' : 'POST', this.props.id);
    if (!data) {
      this.setState({
        loading: false,
      });
      return;
    }
    const num = this.state.isLike ? this.state.num - 1 : this.state.num + 1;
    this.setState({
      isLike: !this.state.isLike,
      num,
      loading: false,
    });
  }
  render() {
    return (
      <Button
        size={'small'}
        onClick={this.clickHandle}
        className={classnames({
          isLike: this.state.isLike,
        })}
        icon={<Icon
          type={
            this.state.isLike ?
              require('../../assets/icon/appreciate_fill.svg') :
              require('../../assets/icon/appreciate.svg')}
        />}
      >
        {this.state.num || '点赞'}
      </Button>
    );
  }
}
WrapButton.propTypes = {
  id: PropTypes.number.isRequired,
  likeNum: PropTypes.number.isRequired,
  isLike: PropTypes.bool.isRequired,
};