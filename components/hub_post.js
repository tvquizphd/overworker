import useSWR from 'swr'
import Post from '../containers/post'
import Checkbox from '../components/checkbox'
import ClassedList from '../components/classed_list'
import { unescape_html, parse_html } from '../functions/handle_html'
import { post_matcher, get_post_url } from '../functions/make_urls'

const fetcher_simple = (url) => fetch(url).then((res) => res.json())

const render_post = (props, sub_i) => {
  const { depth, maxDepth } = props
  const { subList, openPosts, togglePost } = props
  const match_sub_post = post_matcher(sub_i)

  return (a, id) => {
    const a_title = a.innerText
    const a_in_depth = depth + 1 < maxDepth
    const a_post = match_sub_post.exec(a).groups.post
    const a_checked = openPosts.has(a_post)
    const a_sub_post = a_checked && a_in_depth ? (
      <Post
        sub={sub_i}
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
      <div key={id}> 
          {a_checkbox}
        <a href={get_post_url(sub_i, a_post)}>{a_title}</a>
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
        const post_links = get_post_links(data)
        post_links.forEach(a => {
          const a_post = post_matcher('.*').exec(a).groups.post
          if (!openPosts.has(a_post)) togglePost(a_post)
        })
      }
    }
  })

  if (error) return <div>Failed to load</div>
  if (!data) return <div>Loading...</div>

  const post_links = get_post_links(data)
  const new_sub_list = get_sub_list(post_links, subList)

  const sections = new_sub_list.map((sub_i, id) => {
    const posts_i = post_links.filter(a => !!post_matcher(sub_i).exec(a))
    if (posts_i.length == 0) return <div key={id}></div>
    return (
      <div key={id}>
        <span>{sub_i}</span>
        <ClassedList className="posts-list">
          {posts_i.map(render_post(props, sub_i))}
        </ClassedList>
      </div>
    )
  })

  return (
    <div>
      {sections}
    </div>
  )
}
