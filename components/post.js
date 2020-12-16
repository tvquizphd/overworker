import ClassedList from './classed_list'
import { get_post_url } from '../functions/make_urls'
import styles from './post.module.css'

export const fetcher_simple = (url) => fetch(url).then((res) => res.json())

export const add_nbsp = text => {
  return text.replace(/([\/_])/g, '$1\u200B')
}

const subpost_renderer = (posts_i) => {

  return index => {
    const {sub, post, title} = posts_i[index]
    const safe_title = add_nbsp(title)
    return (
      <div key={index}> 
        <a href={get_post_url(sub, post)}>{safe_title}</a>
      </div>
    )
  }
}

const list_unique_subs = sub_list => {
  // Create Map to uppercase versions of sub names
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

  return [...unique_subs.values()]
}

const get_sub_list = (subpost_links, subList=[]) => {
  // Ensure subList remains at front
  return list_unique_subs(subList.concat([
    ...new Set(subpost_links.map(a =>a.sub))
  ]))
 } 

export default function Post(props) {
  const { sub, post, subList, allSubposts } = props
  const subpost_links = [...allSubposts.values()]
  
  // level 1+ returns labeled sections for all subreddits
  const new_sub_list = get_sub_list(subpost_links, subList)
  const sections = new_sub_list.map((sub_i, index) => {
    const posts_i = subpost_links.filter(a => {
      return a.sub.toLowerCase() == sub_i.toLowerCase()
    })
    const subpost_renderer_i = subpost_renderer(posts_i)
    if (posts_i.length == 0) return ""
    return (
      <div key={index}>
        <span>{sub_i}</span>
        <ClassedList className={styles.sublist}>
          {posts_i.map((a,i) => subpost_renderer_i(i))}
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
