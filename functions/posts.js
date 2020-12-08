import { unescape_html, parse_html } from '../functions/handle_html'
import { post_matcher } from '../functions/make_urls'

export const get_post_links = data => {
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
