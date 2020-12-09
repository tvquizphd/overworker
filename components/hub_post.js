import useSWR from 'swr'
import Post from './post'
import Checkbox from './checkbox'
import { Virtuoso } from 'react-virtuoso'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShare } from '@fortawesome/free-solid-svg-icons'
import { post_matcher, get_post_url } from '../functions/make_urls'
import { get_post_links } from '../functions/posts'

const fetcher_simple = (url) => fetch(url).then((res) => res.json())

const post_renderer = (props, posts_i, sub_regex) => {
  const { subList, openPosts, togglePost } = props
  const match_sub_post = post_matcher(sub_regex)

  return index => {
    const a = posts_i[index]
    const a_title = a.innerText
    const a_match = match_sub_post.exec(a)
    const a_post = a_match.groups.post
    const a_sub = a_match.groups.sub
    const a_checked = openPosts.has(a_post)
    const a_sub_post = a_checked ? (
      <Post
        sub={a_sub}
        subList={subList}
        post={a_post}
      /> 
    ) : ""
    return (
      <div key={index}> 
				<Checkbox
					name={a_post}
					toggle={togglePost}
					checked={a_checked}
				/>
				<button onClick={e => togglePost(a_post)}>{a_title}</button>
				<a href={get_post_url(a_sub, a_post)}>
					<FontAwesomeIcon icon={faShare} />
				</a>
        <div>
          {a_sub_post}
        </div>
      </div>
    )
  }
}

export default function HubPost(props) {
  const { sub, subList, post } = props
  const { allPosts, openPosts, togglePost, toggleAllOrNone } = props

  const url = get_post_url(sub, post, true)
  const { data, error } = useSWR(url, fetcher_simple, {
    onSuccess: (data) => {
			const post_links = 
			get_post_links(data).forEach(a => {
				const a_post = post_matcher('.*').exec(a).groups.post
				if (!openPosts.has(post)) togglePost(a_post)	
			})
			toggleAllOrNone('none')
    }
  })

  if (error) return <div>Failed to load</div>
  if (!data) return <div>Loading...</div>
  const post_links = get_post_links(data)

  // level 0 returns a Virtuoso list with all posts
	return (
		<Virtuoso
			totalCount={post_links.length}
			itemContent={post_renderer(props, post_links, '.*')}
			style={{ width: '100%', height: '100%' }}
		/>
	)
}
