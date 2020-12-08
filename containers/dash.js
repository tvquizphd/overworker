import { Component } from 'react'
import Checkbox from '../components/checkbox'
import HubPost from '../components/hub_post'
import { equal_sets } from '../functions/math'
import styles from './dash.module.css'

export default class Dash extends Component {

  constructor(props) {
    super()
    this.state = {
      openPostsCache: new Set([]),
      openPosts: new Set([]),
      allPosts: new Set([])
    }
  }

  isAllOrNone = (s) => {
    const { openPosts, allPosts } = this.state
    const str = (['all', 'none'].indexOf(s) < 0) ? '' : s
    const old_status = {
      'false,false': '',
      'true,false': 'none',
      'false,true': 'all',
      'true,true': 'none'
    }[[
      equal_sets(openPosts, new Set([])),
      equal_sets(openPosts, allPosts)
    ]]
    return old_status == str
  }

  toggleAllOrNone = (s) => {

    const { openPostsCache, openPosts, allPosts } = this.state
    const str = (['all', 'none'].indexOf(s) < 0) ? '' : s
    const new_status = this.isAllOrNone(str)? 'history' : str
    const result = {
      '': openPosts,
      'none': new Set([]),
      'all': new Set(allPosts),
      'history': new Set(openPostsCache)
    }[new_status]

    this.setState({
      openPostsCache: new Set(openPosts),
      openPosts: result 
    })
  }

  togglePost = (post) => {
    const {openPosts, allPosts} = this.state
    if (!allPosts.has(post)) allPosts.add(post)
    !openPosts.has(post)? openPosts.add(post): openPosts.delete(post)
    this.setState({
      openPosts: openPosts,
      allPosts: allPosts
    })
  }

  render() {
    const {sub, post, users, subList} = this.props
  
    return (
      <div className={`${styles.box}`}>
        <div className={`${styles.header} ${styles.row}`}>
          {users.map((user, i) => (
            <div key={i}>{user.name}</div>
          ))}
        </div>
        <div className={`${styles.header} ${styles.row}`}>
          {["all", "none"].map((s, i) => (
            <div key={i} className={styles.inline}>
              <span>
                Show {s}:
              </span>
              <Checkbox
                name={s}
                toggle={this.toggleAllOrNone}
                checked={this.isAllOrNone(s)}
              />
            </div>
          ))}
        </div>
        <div className={`${styles.virtuoso} ${styles.row}`}>
          <HubPost
            sub={sub}
            post={post}
            subList={subList}
            openPosts={this.state.openPosts}
            allPosts={this.state.allPosts}
            togglePost={this.togglePost}
          />
        </div>
      </div>
    )
  } 
}
