import path from 'path'
import fs from 'fs'
import { get_reddit_api } from '../functions/reddit_api'
import { post_matcher, get_post_url } from './make_urls'
import { get_post_links, get_post_info, get_post_sub } from './posts'

const trimHubpostTitle = title => {
  const t_prefix = '(?:.*?collection of )?'
  const t_suffix = '(?<suffix>.+?)?(?:\\.| and.*|$)'
  const t_subject = '(?<subject>.+?)(?:(?: askreddit)? threads\\.?(?: of | |$)|\\.?$)'
  const filter_suffix = str => str.split(' ').filter(s => !!s.replace(/nsfw/i,'')).join(' ')
  const t_matcher = new RegExp(`${t_prefix}${t_subject}${t_suffix}`, 'i')
  const t = t_matcher.exec(title)?.groups || {}
  const subject = t.subject || '[empty]'
  const suffix = t.suffix? filter_suffix(t.suffix) : ''
  return suffix? `${subject}: ${suffix}` : subject
}

async function fetchSubpost(reddit_api, parents, a) {
  const reddit_first_timestamp = '2005-06-23T18:43:53-00:00'
  const reddit_first = new Date(reddit_first_timestamp).getTime() / 1000

  const should_fetch = true
  const is_same_post = new RegExp(`^${a.post}$`,'i')
  const url = get_post_url(a.sub, a.post, ".json", true)
  const data = (should_fetch)? await reddit_api.axios(url) || [] : []
  const sub = a.sub || get_post_sub(data) || 'askreddit'
  const children = get_post_links(data).filter(_a => {
    return !is_same_post.test(_a.post)
  })
  // Promote subpost to hubpost
  if (children.length > 8) {
    const grandparents = parents.slice(0,parents.length-1)
    reddit_api.untrack(parents, [a.post])
    reddit_api.track(grandparents, [a.post], false)
    console.log(`Promoted ${a.post} to Hubpost with ${children.length} Subposts`)
    return await fetchHubpost(reddit_api, grandparents, a)
  }
  const a_info = await get_post_info(data, {
    fail: should_fetch,
    ups: 0,
    downs: 0,
    nsfw: false,
    sub: sub,
    post: a.post,
    title: a.title,
    upsPercent: 0,
    text: '',
    author: '',
    edited: false,
    created: reddit_first,
    commentsCount: 0,
    mdDelta: [],
    awardsCount: 0,
    awardsCoins: 0,
    awardsNames: [],
    replies: []
  })
  // Error if for some reason the info id differs from url id
  if (a_info.post != a.post) {
    console.error(`Error: Subpost ${a.post} switched to ${a_info.post}`)
  }
  // Write post to json file
  const save_dir = path.join(reddit_api.SAVE_ROOT, ...parents)
  const save_file = path.join(save_dir, `${a.post}.json`)
  if (!fs.existsSync(save_dir)) {
    fs.mkdirSync(save_dir, {recursive:true})
  }
  let fd
  try {
    fd = fs.openSync(save_file, 'w+')
    fs.writeSync(fd, JSON.stringify({ replies: a_info.replies }))
  }
  catch (err) {
    console.error(`Error: Cannot write ${save_file}`)
  }
  finally {
    if (fd !== undefined)
      fs.closeSync(fd);
  }
  delete a_info.replies
  // Mark completion of fetched subpost
  reddit_api.track(parents.concat(a.post), [], a_info.fail)
  if (a_info.fail) {
    console.error(`Failed to parse subpost ${url}`)
  }
  return a_info
}

async function fetchAllSubposts(reddit_api, parents, children) {
  reddit_api.track(parents, children.map(a=>a.post), !children.length)
  if (!children.length) {
    console.error(`Failed to parse post ${parents[parents.length-1]}`)
  }
  return Promise.all(children.map(async a => {
    return await fetchSubpost(reddit_api, parents, a)
  }))
}

async function fetchHubpost(reddit_api, parents, a) {
  const title = trimHubpostTitle(a.title)
  const url = get_post_url(a.sub, a.post, ".json", true)
  const data = await reddit_api.axios(url) || []
  const sub = a.sub || get_post_sub(data) || 'hubposts'
  const is_from_hubposts = new RegExp(`^hubposts$`,'i')
  const is_same_post = new RegExp(`^${a.post}$`,'i')
  // Links from r/hubposts are not treated as children
  const [children, siblings] = get_post_links(data).filter(_a => {
    return !is_same_post.test(_a.post)
  }).reduce(([kids, bros], _a) => {
    const from_hubposts = is_from_hubposts.test(_a.sub)
    return [
      from_hubposts? kids : kids.concat(_a),
      from_hubposts? bros.concat(_a) : bros
    ]
  }, [[],[]])
  // Find subposts to raise to hubpost status
  const [
    allSubposts, raiseHubposts
  ] = (
      await fetchAllSubposts(reddit_api, parents.concat(a.post), children)
    ).reduce(([subs, hubs], _a) => {
      const is_hubpost = _a.hasOwnProperty('raiseHubposts')
      return [
        is_hubpost? subs : subs.concat(_a),
        is_hubpost? hubs.concat(_a, _a.raiseHubposts) : hubs,
      ]
    }, [[],[]])

  return {
    ...a,
    sub: sub,
    title: title,
    fail: !allSubposts.length,
    allSubposts: allSubposts,
    raiseHubposts: raiseHubposts,
    relatedPosts: siblings.map(bro=>bro.post)
  }
}

async function fetchAllHubposts(reddit_api, parents, children) {
  reddit_api.track(parents, children.map(a=>a.post), !children.length)
  if (!children.length) {
    console.error(`Failed to parse post ${parents[parents.length-1]}`)
  }
  let total_fetched = 0
  return Promise.all(children.map(async (a) => {
    const hubpost = await fetchHubpost(reddit_api, parents, a)
    total_fetched += 1
    return hubpost
  }))
}

async function fetchMegathread(reddit_api, a) {
  const is_same_post = new RegExp(`^${a.post}$`,'i')
  const url = get_post_url(a.sub, a.post, ".json", true)
  const data = await reddit_api.axios(url) || []
  const children = get_post_links(data).filter(_a => {
    return !is_same_post.test(_a.post)
  })
  const allPosts = await fetchAllHubposts(reddit_api, [a.post], children)
  return {
    sub: a.sub,
    post: a.post,
    title: a.title,
    allPosts: allPosts.reduce((_posts, _, i) => {
      _posts = _posts.concat(_posts[i].raiseHubposts)
      delete _posts[i].raiseHubposts
      return _posts
    }, [...allPosts]),
    fail: !allPosts.length
  }
}

export async function fetchRoot(version, save_dir, megathread) {
  const reddit_api = await get_reddit_api(version, save_dir)
  const root = await fetchMegathread(reddit_api, megathread)
  reddit_api.log(false, 'Done')
  return { root }
}
