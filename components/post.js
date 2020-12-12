import useSWR from 'swr'
import ClassedList from './classed_list'
import { post_matcher, get_post_url } from '../functions/make_urls'
import { get_post_links } from '../functions/posts'
import styles from './post.module.css'

const fetcher_simple = (url) => fetch(url).then((res) => res.json())

const post_renderer = (posts_i, sub_regex) => {
  const match_sub_post = post_matcher(sub_regex)

  return index => {
    const a = posts_i[index]
    const a_title = a.innerText.replace(/([\/_])/g, '$1\u200B')
    const a_match = match_sub_post.exec(a)
    const a_post = a_match.groups.post
    const a_sub = a_match.groups.sub
    return (
      <div key={index}> 
        <a href={get_post_url(a_sub, a_post)}>{a_title}</a>
      </div>
    )
  }
}

const list_unique_subs = sub_list => {
  // Create Map of unique subs
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

  // Create list of unique subs
  return sub_list.reduce((list, sub) => {
    const lower_sub = sub.toLowerCase()
    if (list.map(s=>s.toLowerCase()).indexOf(lower_sub) < 0) {
      list.push(sub)
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

export default function Post(props) {
  const { sub, subList, post } = props

  const url = get_post_url(sub, post, true)
  const { data, error } = useSWR(url, fetcher_simple)

  if (error) return <div>Failed to load</div>
  if (!data) return <div>Loading...</div>
  const post_links = get_post_links(data)

  // level 1+ returns labeled sections for all subreddits
  const new_sub_list = get_sub_list(post_links, subList)
  const sections = new_sub_list.map((sub_i, index) => {
    const posts_i = post_links.filter(a => !!post_matcher(sub_i).exec(a))
    const post_renderer_i = post_renderer(posts_i, sub_i)
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
