import useSWR from 'swr'
import { Virtuoso } from 'react-virtuoso'
import Post from '../containers/post'
import Checkbox from '../components/checkbox'
import ClassedList from '../components/classed_list'
import { unescape_html, parse_html } from '../functions/handle_html'
import { post_matcher, get_post_url } from '../functions/make_urls'
import styles from './hub_post.module.css'

const fetcher_simple = (url) => fetch(url).then((res) => res.json())

const post_renderer = (props, posts_i, sub_regex) => {
  const { depth, maxDepth } = props
  const { subList, openPosts, togglePost } = props
  const match_sub_post = post_matcher(sub_regex)

  return index => {
    const a = posts_i[index]
    const a_title = a.innerText
    const a_in_depth = depth + 1 < maxDepth
    const a_match = match_sub_post.exec(a)
    const a_post = a_match.groups.post
    const a_sub = a_match.groups.sub
    const a_checked = openPosts.has(a_post)
    const a_sub_post = a_checked && a_in_depth ? (
      <Post
        sub={a_sub}
        depth={depth + 1}
        subList={subList}
        post={a_post}
      /> 
    ) : ""
    const a_checkbox = a_in_depth ? (
      <Checkbox
        name={a_post}
        toggle={togglePost}
        checked={a_checked}
      />
    ) : ""
    return (
      <div key={index}> 
          {a_checkbox}
        <a href={get_post_url(a_sub, a_post)}>{a_title}</a>
        <div>
          {a_sub_post}
        </div>
      </div>
    )
  }
}

const list_unique_subs = sub_list => {
  const unique_subs = sub_list.reduce((map, sub) => {
    const lower_sub = sub.toLowerCase()
    const match_sub = map.get(lower_sub) ? map.get(lower_sub) : sub
    const num_upper = sub.length - sub.replace(/[^A-Z]/g, "").length 
    const match_num_upper = sub.length - match_sub.replace(/[^A-Z]/g, "").length 
    
    if (num_upper >= match_num_upper) {
      map.set(lower_sub, sub)
    }
    return map
  }, new Map([]))

  return sub_list.reduce((list, sub) => {
    const lower_sub = sub.toLowerCase()
    if (list.map(s=>s.toLowerCase()).indexOf(lower_sub) < 0) {
      list.push(sub)
    }
    return list
  }, [])
}

const get_post_links = data => {
  const match_post = post_matcher('.*')

  // Extract post elements from html selftext
  const post_html = data[0].data.children[0].data.selftext_html
  if (!post_html) return []

  const post_el = parse_html(unescape_html(post_html))
  if (!post_el.querySelectorAll) return []

  // Return links matching generic post format
  const all_links = Array.from(post_el.querySelectorAll('a'))
  const post_links = all_links.filter(a => !!match_post.exec(a))

  // Make links unique by post, but keep order
  const post_link_set = new Set([])
  return post_links.reduce((list, a) => {
    const a_post = match_post.exec(a).groups.post
    if (!post_link_set.has(a_post)) {
      post_link_set.add(a_post)
      list.push(a)
    }
    return list
  }, [])
}

const get_sub_list = (post_links, subList=[]) => {
  const match_post = post_matcher('.*')
  // Ensure subList remains at front
  return list_unique_subs(subList.concat([
    ...new Set(post_links.map(a => match_post.exec(a).groups.sub))
  ]))
} 

export default function HubPost(props) {
  const { depth, maxDepth } = props
  const { sub, subList, post } = props
  const { openPosts, togglePost } = props

  // Render nothing if above max depth
  if (depth >= maxDepth) return <div>Error: too many nested lists</div>

  const url = get_post_url(sub, post)
  const { data, error } = useSWR(url, fetcher_simple, {
    onSuccess: (data) => {
      if (depth + 1 < maxDepth) {
        const post_links = 
        get_post_links(data).forEach(a => {
          const a_post = post_matcher('.*').exec(a).groups.post
          if (!openPosts.has(a_post)) togglePost(a_post)
        })
      }
    }
  })

  if (error) return <div>Failed to load</div>
  if (!data) return <div>Loading...</div>
  const post_links = get_post_links(data)

  // level 0 returns a Virtuoso list with all posts
  if (depth == 0) {
    return (
      <div className={`${styles.virtuoso} ${styles.row}`}>
        <Virtuoso
          totalCount={post_links.length}
          itemContent={post_renderer(props, post_links, '.*')}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    )
  }

  // level 1+ returns labeled sections for all subreddits
  const new_sub_list = get_sub_list(post_links, subList)
  const sections = new_sub_list.map((sub_i, index) => {
    const posts_i = post_links.filter(a => !!post_matcher(sub_i).exec(a))
    const post_renderer_i = post_renderer(props, posts_i, sub_i)
    if (posts_i.length == 0) return ""
    return (
      <div key={index}>
        <span>{sub_i}</span>
        <ClassedList className={styles.sublist}>
          {posts_i.map((a,i) => post_renderer_i(i))}
        </ClassedList>
      </div>
    )
  })

  return (
    <div className="container">
      {sections}
    </div>
  )
}
