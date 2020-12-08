import { Component } from 'react'
import HubPost from '../components/hub_post'

export default class Post extends Component {

  constructor(props) {
    super()
    const {sub, subList, post, depth} = props
    this.state = {
      sub: sub,
      post: post,
      depth: depth,
      maxDepth: 2,
      subList: subList,
      openPosts: new Set([])
    }  
  }

  togglePost = (post) => {
    const { openPosts } = this.state
    const yes = !openPosts.has(post)
    const result = yes? openPosts.add(post): openPosts.delete(post)

    this.setState({
      openPosts: openPosts
    })
    return yes? true: result
  }

  render(){
    const {depth, maxDepth} = this.state
    const {openPosts, sub, subList, post} = this.state
  
    return (
      <HubPost
        sub={sub}
        post={post}
        depth={depth}
        maxDepth={maxDepth}
        subList={subList}
        openPosts={openPosts}
        togglePost={this.togglePost}
      />
    )
  } 
}
