import { Component } from 'react'
import Head from 'next/head'
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
							Sentiment of {round_score}% happy!
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
          <div className={`${styles.virtuoso} ${styles.row}`}>
            <HubPost
              sub={sub}
              post={post}
              subList={subList}
              openPosts={this.state.openPosts}
              allPosts={this.state.allPosts}
              togglePost={this.togglePost}
              toggleAllOrNone={this.toggleAllOrNone}
            />
          </div>
        </div>
        <div className={`${styles.secondary} ${styles.box}`}>
					<div className={`${styles.row}`}>
            <div className={`${styles.col}`}>
              <textarea value={inputText}
                onChange={e => inputTextChange(e.target.value)}
              />	
            </div>	
					</div>
        </div>
      </div>
    )
  } 
}
