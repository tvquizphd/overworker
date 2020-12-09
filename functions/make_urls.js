export const post_matcher = sub => (
  new RegExp(`.*/r/(?<sub>${sub})/comments/(?<post>[^/]*)/?`, 'i')
)
export const get_post_url = (sub, post, json=false) => {
  const ext = json? '.json' : ''
  return `https://www.reddit.com/r/${sub}/comments/${post}${ext}`
}
