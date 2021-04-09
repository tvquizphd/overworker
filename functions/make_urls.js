export const get_post_url = (sub, post, ext="", rel=false) => {
  const method = sub ? `/r/${sub}/comments/` : '/comments/'
  const root = rel ? method : `https://www.reddit.com${method}`
  return `${root}${post}${ext}`
}

// If post id36 expands to 7 or 8 chars, manually replace 8xxcwtif typo with 8xxcwt
const post_id36 = '(?<post>[a-z0-9A-Z]{2,6})'
const comment_id36 = '(?<comment>[a-z0-9A-Z]{2,7})'

export const post_matcher = sub => {
  // .*/r/<sub>/comments/<post>.*
  // .*/comments/<post>.*
  // .*//redd.it/<post>.*
  //
  return new RegExp(`/(?:(?:r/(?<sub>${sub})/)?comments/|/redd\.it/)${post_id36}`, 'i')
}

export const comment_matcher = sub => {
  return new RegExp(`/r/(?<sub>${sub})/comments/${post_id36}/[^/]+/${comment_id36}`, 'i')
}

export const get_url = href => {
  const url_match = new RegExp('^(?<http>.+?:)?//(?<fullpath>.+)', 'i').exec(href)
  if (url_match) {
    const protocol = url_match.groups.http || 'https:'
    try {
      return new URL(`${protocol}//${url_match.groups.fullpath}`)
    }
    catch (e) {
      return null
    }
  }
  return null
}
