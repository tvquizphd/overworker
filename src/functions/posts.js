import he from 'he'
import unified from 'unified'
import textdiff_patch from 'textdiff-patch'
import textdiff_create from 'textdiff-create'
import remark_gfm from 'remark-gfm'
import remark_parse from 'remark-parse'
import remark_retext from 'remark-retext'
import remark_stringify from 'remark-stringify'
import remark_autofix from 'remark-autofix'
import retext_quotes from 'retext-quotes'
import retext_english from 'retext-english'
import retext_stringify from 'retext-stringify'
import retext_contractions from 'retext-contractions'
import retext_syntax_urls from 'retext-syntax-urls'
import retext_syntax_mentions from 'retext-syntax-mentions'
import unist_remove from 'unist-util-remove'
import unist_is from 'unist-util-is'
import { parse_html } from '../functions/handle_html'
import { post_matcher, get_url } from '../functions/make_urls'

const remove_null = obj => {
  Object.keys(obj).forEach(key => obj[key] == null && delete obj[key]);
  return obj
};

// Recursively concatenate text from node children
const get_children_text = node => {
  return (node.children || []).reduce((_value, _node) => {
    if (unist_is(_node, 'text')) {
      return _value + (_node.value || '')
    }
    return _value + get_children_text(_node)
  }, '')
}

export const get_post_sub = (data) => {
  if (data.error) return null
  const a_json = data[0]? data[0].data.children[0].data : null
  if (!a_json) return null
  return a_json.subreddit
}

const md_to_mdast_processor = unified().use(remark_parse).use(remark_gfm)

// No tables allowed in markdown text
const md_to_md_processor = md_to_mdast_processor().use(() => {
  return (tree, file) => {
    return unist_remove(tree, {}, (node => unist_is(node, 'table')))
  }
})
.use(remark_retext,
  unified().use(retext_english)
  .use(retext_syntax_urls).use(retext_syntax_mentions, {
    style: /^(@|\/?u\/)[\w\-]{1,20}$/i
  })
  .use(retext_quotes, {preferred: 'straight'})
  .use(retext_contractions, {straight: true})
)
.use(remark_autofix)
.use(remark_stringify)

// No blockquotes, strikethroughs, or autolinks in output text
const md_to_text_processor = md_to_mdast_processor().use(() => {
  return (tree, file) => {
    const new_tree = unist_remove(tree, {}, (node => {
      const is_strikethrough = unist_is(node, 'delete')
      const is_blockquote = unist_is(node, 'blockquote')
      const is_url_link = unist_is(node, 'link')? (
        !!get_url(get_children_text(node))
      ): false
      return is_strikethrough || is_blockquote || is_url_link
    }))
    if (new_tree == null) {
      return md_to_mdast_processor().parse('')
    }
    return new_tree
  }
})
.use(remark_retext, retext_english.Parser)
.use(retext_stringify)


async function get_md_text(a_md, a_location){

  // No two spaces after a period
  a_md = a_md.replaceAll('.  ', '. ')
  // Replace superscripts and spoilers
  a_md = a_md.replaceAll('^^^', '')
  a_md = a_md.replaceAll(/\^\((.+?)\)/g, '$1')
  a_md = a_md.replaceAll(/>!(.+?)!</g, '~~$1~~')
  try {
    const a_md_vfile = await md_to_md_processor.process(a_md)
    a_md = a_md_vfile.contents.trim()
  }
  catch (error) {
    console.log({error})
    console.log({a_location, a_md})
  }

  // Handle common cases where escaped bracket is not necessary
  a_md = a_md.replaceAll('\\[deleted]', '[deleted]')
  a_md = a_md.replaceAll('\\[removed]', '[removed]')

  let a_text_vfile = await md_to_text_processor.process(a_md)
  let a_text = a_text_vfile.contents
  a_text = a_text.replaceAll(/\n{3,}/g, '\n\n')
  a_text = a_text.replaceAll(/ {2,}/g, ' ')

  let a_md_delta = textdiff_create(a_text, a_md)
  // Return an empty markdown delta if no change in text
  if (a_md_delta.length == 1 && a_md_delta[0][0] == 0) {
    a_md_delta = []
  }
  //const a_md_recovered = textdiff_patch(a_text, a_md_delta)
  //console.log('Recovered Markdown')
  //console.log(a_md_recovered)
  return {
    text: a_text,
    mdDelta: a_md_delta
  }
}

function sumarize_awards(awards) {
  const summary = (awards || []).reduce((s, award) => {
    return {
      awardNames: s.awardNames.add(award.name),
      awardCount: s.awardCount + award.count,
      awardCoins: s.awardCoins + award.coin_price
    }
  }, {
    awardNames: new Set(),
    awardCount: 0,
    awardCoin: 0
  })
  summary.awardNames = [...summary.awardNames]
  return summary
}

async function get_comment_info(a_json, a_post) {

  const a_comment = a_json.id
  const [parent_type, parent_id36] = a_json.parent_id.split('_')
  const a_children = a_json.replies? a_json.replies.data.children : []
  const a_replies = a_children.filter(n => n.kind != 'more').map(n => n.data)
  const a_more = a_children.filter(n => n.kind == 'more').reduce((more, n) => {
    return n.data.children.reduce((_more, _comment) => {
      return _more.concat({
        fail: true,
        comment: _comment,
        parentPost: a_post,
        parentComment: a_comment
      })
    }, more)
  }, [])

  let a_md = he.decode(a_json.body || '')
  const {mdDelta, text} = await get_md_text(a_md, [a_post, a_comment])
  const a_replies_info = await Promise.all(a_replies.map(async reply => {
    return await get_comment_info(reply, a_post)
  }))

  const {
    awardNames,
    awardCount,
    awardCoins
  } = sumarize_awards(a_json.all_awardings)

  return remove_null({
    fail: false,
    ups: a_json.ups,
    author: a_json.author,
    text: text,
    mdDelta: mdDelta,
    edited: !!a_json.edited,
    created: a_json.created_utc,
    replies: a_replies_info.concat(a_more),
    awardNames: awardNames,
    awardCount: awardCount,
    awardCoins: awardCoins,
    comment: a_comment,
    parentPost: a_post,
    parentComment: parent_type == 't1'? parent_id36 : null
  })
}

export async function get_post_info(data, fallback={}) {

  if (data.error) return fallback
  const a_json = data[0]? data[0].data.children[0].data : null
  if (!a_json) return fallback

  const a_post = a_json.id
  const a_children = data[1]? data[1].data.children : []
  const a_replies = a_children.filter(n => n.kind != 'more').map(n => n.data)
  const a_more = a_children.filter(n=> n.kind == 'more').reduce((more, n) => {
    return n.data.children.reduce((_more, _comment) => {
      return _more.concat({
        fail: true,
        comment: _comment,
        parentPost: a_post,
        parentComment: null
      })
    }, more)
  }, [])

  let a_md = he.decode(a_json.selftext || '')
  // Support for links, image links, and youtube links
  if (!a_md) {
    const a_link_url = he.decode(a_json.url_overridden_by_dest || '')
    a_md = a_link_url? `[${a_post}](${a_link_url})` : ''
  }
  const {mdDelta, text} = await get_md_text(a_md, [a_post])
  const a_replies_info = await Promise.all(a_replies.map(async reply => {
    return await get_comment_info(reply, a_post)
  }))

  const {
    awardNames,
    awardCount,
    awardCoins
  } = sumarize_awards(a_json.all_awardings)

  const a_info = {
    fail: false,
    ups: a_json.ups,
    author: a_json.author,
    text: text,
    mdDelta: mdDelta,
    edited: !!a_json.edited,
    created: a_json.created_utc,
    replies: a_replies_info.concat(a_more),
    awardNames: awardNames,
    awardCount: awardCount,
    awardCoins: awardCoins,
    post: a_post,
    title: a_json.title,
    sub: a_json.subreddit,
    nsfw: a_json.over_18,
    commentsCount: a_json.num_comments,
    upsPercent: Math.round(a_json.upvote_ratio * 100)
  }
  return {
    ...fallback,
    ...remove_null(a_info)
  }
}

export const get_post_links = data => {
  const match_reddit_post = post_matcher('.*')

  if (data.error) return []
  const post_html = data[0]? data[0].data.children[0].data.selftext_html : ''
  if (!post_html) return []

  const post_el = parse_html(post_html)
  const node_list = post_el.getElementsByTagName('a')
  if (!node_list.length) return []

  // Return links matching generic post format
  const post_links = Array.from(node_list).map(a=>{
    return {
      href: a.getAttribute('href') || '/',
      title: a.firstChild.data || '[empty]'
    }
  }).filter(a => {
    return !!match_reddit_post.exec(a.href)
  }).map(a => {
    const match = match_reddit_post.exec(a.href)
    return {
      title: a.title,
      sub: match.groups.sub,
      post: match.groups.post
    }
  })

  // Make links unique by post, but keep order
  return [...post_links.reduce((m, a) => {
    if (!m.has(a.post)) {
      m.set(a.post, a)
    }
    return m
  }, new Map()).values()]
}
