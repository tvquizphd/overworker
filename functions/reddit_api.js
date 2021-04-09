import axios from 'axios'
import qs from 'querystring'
import process from 'process'

export async function get_reddit_api(...args) {
  return await new RedditAPI(...args).build()
}

class RedditAPI {

  static MINUTE = 60
  static HOUR = 60 * 60
  static MAX_CONCURRENT = 40
  static MAX_RETRIES = 3
  static TIMEOUT = 30

  constructor (version, save_dir) {
    this.SAVE_ROOT = save_dir || `v${version}`
    this.VERSION = version || "0.0.0"
    this.REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || '';
    this.REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET ||'';
    this.INSTANCE = null
    this.FIRST_REQUEST = null
    this.PENDING_REQUESTS = 0
    this.NODES = new Map()
  }
  async build () {
    return await this.reauthenticate()
  }
  get_node(parents) {
    return parents.reduce((o, p) => {
      if (!o.nodes.has(p)) {
        o.nodes.set(p, {id36: p, fail: null, nodes: new Map()})
      }
      return o.nodes.get(p)
    }, {nodes: this.NODES})
  }
  untrack(parents, children) {
    const { nodes } = this.get_node(parents)
    for (let id36 of nodes.keys()) {
      if (children.includes(id36)) nodes.delete(id36);
    }
  }
  track(parents, children, fail) {
    const node = this.get_node(parents)
    node.fail = fail
    node.nodes = new Map([
      ...node.nodes,
      ...children.map(c => {
        return [c, {id36: c, fail: null, nodes: new Map()}]
      })
    ])
  }
  axios(rel_url, retry=0) {
    if (!this.INSTANCE) {
      return new Promise(resolve => {
        resolve(null)
      })
    }
    return new Promise(async resolve => {
      try {
        const {data} = await this.INSTANCE.get(rel_url)
        if (data.error) throw {code: data.error}
        resolve(data)
      }
      catch (error) {
        console.error({error: error.code || error, try: retry})
        if (retry < RedditAPI.MAX_RETRIES) {
          const data_next = await this.axios(rel_url, retry + 1)
          return resolve(data_next)
        }
        console.error(`Cannot fetch url ${rel_url}`)
        return resolve(null)
      }
    })
  }
  intercept_request(config) {
    return new Promise((resolve, reject) => {
      if (this.FIRST_REQUEST == null) {
        this.FIRST_REQUEST = new Date()
      }
      let interval = setInterval(() => {
        if (this.PENDING_REQUESTS < RedditAPI.MAX_CONCURRENT) {
          this.PENDING_REQUESTS++
          clearInterval(interval)
          resolve(config)
        }
      }, 100)
    })
  }
  default_node_status() {
     return { total: 0, done: 0, fail: 0, wait: 0, some_fail: 0, some_wait: 0 }
  }
  update_node_status(status, node) {
    const some_fail = [...node.nodes.values()].some(n=>n.fail === true)
    const some_wait = [...node.nodes.values()].some(n=>n.fail === null)
    const all_done = !some_fail && !some_wait && node.fail == false
    // All mutally exclusive possibilities should add to total
    return {
      total: 1 + status.total,
      done: (all_done ? 1 : 0) + status.done,
      fail: (node.fail === true ? 1 : 0) + status.fail,
      wait: (node.fail === null ? 1 : 0) + status.wait,
      some_fail: (some_fail && node.fail === false ? 1 : 0) + status.some_fail,
      some_wait: (some_wait && node.fail === false ? 1 : 0) + status.some_wait,
    }
  }
  log(modulo, msg) {
    const count = [...this.NODES].reduce((s1, [id1, o1])=> {
      const s2_s3_count = [...o1.nodes].reduce(([s2, s3], [id2, o2])=> {
        s3 = [...o2.nodes].reduce((_s3, [id3, o3])=>{
          return this.update_node_status(_s3, o3)
        }, s3)
        s2 = this.update_node_status(s2, o2)
        return [s2, s3]
      }, [
        this.default_node_status(),
        this.default_node_status()
      ])
      s1.push([id1, s2_s3_count])
      return s1
    }, [])
    const elapsed = (new Date() - this.FIRST_REQUEST) / 1000
    const log = new Map(count.map(([id1, [s2, s3]])=> {

      if (!s3.done || (modulo && s3.done % modulo != 0)) {
        return null
      }
      const after_wait_s2 = s2.total - s2.wait
      const avg_s3_per_s2 = Math.min(s3.total, s3.total / after_wait_s2)

      const unknown_s3 = s2.wait * avg_s3_per_s2
      const guess_s3 = Math.round(s3.total + unknown_s3)
      const str_guess_s3 = (unknown_s3 ? '~' : '') + guess_s3

      const unknown_s3_fail = s2.fail * avg_s3_per_s2
      const guess_s3_fail = Math.round(s3.fail + unknown_s3_fail)
      const str_guess_s3_fail = (unknown_s3_fail ? '~' : '') + guess_s3_fail

      const rpm = Math.min(s3.total, (s3.done + s3.fail) / (elapsed / RedditAPI.MINUTE))
      const guess_s3_left = guess_s3 - s3.done - s3.fail
      const minutes_left = Math.round(guess_s3_left/rpm)

      return [
        id1, {
          progress: `found ${s3.done} of ${str_guess_s3} posts: lost ${str_guess_s3_fail}`,
          remaining: `~${minutes_left} minutes left`,
          pending: `${this.PENDING_REQUESTS} pending`
        }
      ]
    }).filter(pair => pair != null))
    if (log.size) console.log(log)
    if (msg) console.log(msg)
  }
  intercept_response(response) {
    this.log(RedditAPI.MAX_CONCURRENT * 10)
    this.PENDING_REQUESTS = Math.max(0, this.PENDING_REQUESTS - 1)
    return Promise.resolve(response)
  }
  intercept_error(error) {
    this.PENDING_REQUESTS = Math.max(0, this.PENDING_REQUESTS - 1)
    return Promise.reject(error)
  }
  async reauthenticate() {
    const auth = await reauthenticate_reddit({
      version: this.VERSION,
      client_id: this.REDDIT_CLIENT_ID,
      client_secret: this.REDDIT_CLIENT_SECRET
    })
    const instance = auth? auth.instance : null
    const expires_in = auth? auth.expires_in : RedditAPI.HOUR
    if (instance) {
      console.log('Reauthenticated')
      instance.interceptors.request.use(this.intercept_request.bind(this))
      instance.interceptors.response.use(
        this.intercept_response.bind(this),
        this.intercept_error.bind(this)
      )
      // Loop when auth expires
      new Promise(resolve => {
        const reauth_delay = Math.max(4, expires_in - RedditAPI.MINUTE)
        return setTimeout(resolve, reauth_delay * 1000)
      }).then(this.reauthenticate.bind(this))
    }
    else {
      console.error('Reddit authentication failed')
    }
    this.INSTANCE = instance
    return this
  }
}

async function reauthenticate_reddit(kwargs) {
  const {version, client_id, client_secret} = kwargs
  try {
    const reddit_base_url = 'https://api.reddit.com'
    const oauth_app_url = '/api/v1/access_token'
    const user_agent = ((app, user) => {
      return `node:${app}:v${version} (by /u/${user})`
    })('com.herokuapp.overworker', 'tvquizphd')

    const { data } = await axios.request({
      method: "post",
      url: oauth_app_url,
      baseURL: reddit_base_url,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': user_agent,
      },
      auth: {
        username: client_id,
        password: client_secret
      },
      data: qs.stringify({
        grant_type: "client_credentials",
        scope: "read"
      })
    });

    const { access_token, expires_in } = data;

    const instance = axios.create({
      baseURL: reddit_base_url,
      timeout: 1000 * RedditAPI.TIMEOUT,
      headers: {
        Authorization: 'basic '+ access_token,
        'User-Agent': user_agent
      }
    });

    return {
      instance,
      expires_in
    }
  }
  catch (error) {
    console.error(`Failed reauthentication ${error}`)
    return await new Promise(resolve => {
      return setTimeout(resolve, 1 * 1000)
    }).then(()=>reauthenticate_reddit(kwargs))
  }
}
