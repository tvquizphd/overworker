import { parse_html } from '../functions/handle_html'
import { post_matcher } from '../functions/make_urls'

export const get_post_links = data => {
  const match_post = post_matcher('.*')

  // Extract post elements from html selftext
  const post_html = data[0]? data[0].data.children[0].data.selftext_html : ''
  if (!post_html) return []

  const post_el = parse_html(post_html)
  const node_list = post_el.getElementsByTagName('a')
  if (!node_list.length) return []

  // Return links matching generic post format
  const post_links = Array.from(node_list).map(a=>{
    return {
      href: a.getAttribute('href'),
      title: a.firstChild.data
    } 
  }).filter(a => {
    return !!match_post.exec(a.href)
  }).map(a => {
    const match = match_post.exec(a.href)
    return {
      title: a.title,
      sub: match.groups.sub,
      post: match.groups.post
    }
  })

  // Make links unique by post, but keep order
  const post_set = new Set([])
  return [...post_links.reduce((m, a) => {
    if (!m.has(a.post)) {
      m.set(a.post, a)
    }
    return m
  }, new Map()).values()]
}
