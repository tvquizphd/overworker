import { Component } from 'react'
import Head from 'next/head'
import Checkbox from '../components/checkbox'
import HubPost from '../components/hub_post'
import TreeMap from '../containers/tree_map'
import { equal_sets } from '../functions/math'
import styles from './dash.module.css'

export default class Dash extends Component {

  constructor(props) {
    super()
    const { allPosts } = props
    this.state = {
      allPosts: allPosts,
      openPostsCache: new Set([...allPosts.keys()]),
      openPosts: new Set()
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
      equal_sets(openPosts, new Set()),
      equal_sets(openPosts, new Set([...allPosts.keys()]))
    ]]
    return old_status == str
  }

  toggleAllOrNone = (s) => {

    const { openPostsCache, openPosts, allPosts } = this.state
    const str = (['all', 'none'].indexOf(s) < 0) ? '' : s
    const new_status = this.isAllOrNone(str)? 'history' : str
    const result = {
      '': openPosts,
      'none': new Set(),
      'all': new Set([...allPosts.keys()]),
      'history': new Set(openPostsCache)
    }[new_status]

    this.setState({
      openPostsCache: new Set(openPosts),
      openPosts: result
    })
  }

  updatePost = (post, params) => {
    const {allPosts} = this.state
    
    const oldParams = allPosts.get(post) || {
      title: "Untitled Post",
      sub: "hubposts",
      post: post,
      allSubposts: new Map()
    }

    allPosts.set(post, {
      ...oldParams,
      ...params,
      allSubposts: new Map([
        ...oldParams.allSubposts,
        ...params.allSubposts
      ]),
    })

    this.setState({
      allPosts: allPosts
    })
  }

  togglePost = (post) => {
    const {openPosts} = this.state
    !openPosts.has(post)? openPosts.add(post): openPosts.delete(post)
    this.setState({
      openPosts: openPosts
    })
  }

  render() {
    const {sub, post, score, subList} = this.props
    const {inputText, inputTextChange} = this.props
    const dashes = '––.–'
    const float_rounder = float => +(+(100*float).toPrecision(3)).toFixed(2)
    const round_score = score < 0? dashes : float_rounder(Number.parseFloat(score))
    return (
      <div className={`${styles.dash}`}>
        <Head>
          <title>{`${sub} viewer`}</title>
          <meta name="viewport"
            content="initial-scale=1.0, maximum-scale=1, width=device-width"
          />
        </Head>
        <div className={`${styles.primary} ${styles.box}`}>
          <div className={`${styles.header} ${styles.row}`}>
            <div className={`${styles.inline} ${styles.col}`}>
              "{inputText}" is {round_score}% happy!
            </div>
          </div>
          <div className={`${styles.header} ${styles.row}`}>
            {["all", "none"].map((s, i) => (
              <div key={i} className={`${styles.inline} ${styles.col}`}>
                <span>
                  Expand {s}:
                </span>
                <Checkbox
                  name={s}
                  toggle={this.toggleAllOrNone}
                  checked={this.isAllOrNone(s)}
                />
              </div>
            ))}
          </div>
          <div className={`${styles.primary} ${styles.row}`}>
            <HubPost
              sub={sub}
              post={post}
              subList={subList}
              toggleAllOrNone={this.toggleAllOrNone}
              openPosts={this.state.openPosts}
              allPosts={this.state.allPosts}
              togglePost={this.togglePost}
              updatePost={this.updatePost}
            />
          </div>
        </div>
      </div>
    )
  }
}
