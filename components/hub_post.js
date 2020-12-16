import Post, {add_nbsp} from './post'
//import { Virtuoso } from 'react-virtuoso'
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//import { faShare } from '@fortawesome/free-solid-svg-icons'
import styles from './hub_post.module.css'

const post_renderer = (props, posts_i) => {
  const { subList, openPosts, updatePost, togglePost } = props

  return index => {
    const {sub, post, title, allSubposts} = posts_i[index]
    const safe_title = add_nbsp(title)
    const a_checked = openPosts.has(post)
    const a_post = a_checked ? (
      <Post
        sub={sub}
        post={post}
        title={title}
        subList={subList}
        updatePost={updatePost}
        allSubposts={allSubposts}
      /> 
    ) : ""
    const a_parity = index % 2 ? styles.odd : styles.even
    const a_on = a_checked? styles.on : ''
    return (
      <div key={index} className={`${styles.item} ${a_parity} ${a_on}`}>
        <div key={index} className={`${styles.title}`}> 
          <button className={`${styles.togglePost}`}
            onClick={e => togglePost(post)}
          >
            {safe_title}
          </button>
        </div>
        <div>
          {a_post}
        </div>
     </div>
    )
  }
}

export default function HubPost(props) {
  const { sub, subList, post, allPosts } = props
  const { openPosts, updatePost, togglePost, toggleAllOrNone } = props

  const post_links = [...allPosts.values()]

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ?'.split('') 
  const hash_table = alphabet.reduce((m, c) => m.set(c,[]), new Map())
  const content = Array.from(post_links.reduce((m, a) => {
    const c = a.title.match(/^[^a-z]*(?<a>[a-z])/i)?.groups.a
    m.get((c || '?').toUpperCase()).push(a)
    return m
  }, hash_table)).map(([letter, links]) => {
    const renderer = post_renderer(props, links)
    return links.length ? (
      <div key={letter} className={`${styles.title}`}>
        <h2>{letter == '?'? 'Other' : `${letter}`}</h2>
        {links.map((a,i) => renderer(i))}
      </div>
    ) : ''
  })
  
  return (
    <div style={{ width: "100%", height: undefined }}>
      {content}
    </div>
  )
}
