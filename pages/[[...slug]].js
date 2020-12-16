import axios from 'axios'
import Page from '../components/page'
import { useRouter } from 'next/router'
import { get_post_url } from '../functions/make_urls'
import { get_post_links } from '../functions/posts'

export default function Index( props ) {
  const router = useRouter()
  const slug = router.query.slug || []

  // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running
  if (router.isFallback) {
    return <div>Loading...</div>
  }
  return <Page {...props}/>
}

export const getStaticPaths = () => {
  return {
    paths: [
      {
        params: { slug: [] },
        locale: 'en-US',
      },
      {
        params: { slug: undefined },
        locale: 'en-US',
      },
    ],
    fallback: "blocking",
  }
}

function simple_axios(url) {
  return new Promise(async function(resolve) {
    try {
      const {data} = await axios.get(url)
      resolve(data)
    } catch (error) {
      console.error(error.response)
      resolve(undefined)
    }
  })
}

function fetchSubpost(a) {
  //const a_sub = a.sub
  //const a_post = a.post
  // const a_res = await fetch(get_post_url(a_sub, a_post, ".json"))
  //const a_data = await a_res.json(a_res)

  a.comments = []
  return [a.post, a]
}

async function fetchAllSubposts(a_data) {
  return get_post_links(a_data).map(fetchSubpost)
}

async function fetchHubPost(a) {

  const a_url = get_post_url(a.sub, a.post, ".json")
  const a_data = await simple_axios(a_url)

  if (!a_data) {
    // Return parent node on Error
    return [a.post, {
      sub: a.sub,
      post: a.post,
      allSubposts: [],
      title: 'Error Loading Posts'
    }]
  }

  a.allSubposts = await fetchAllSubposts(a_data)
  return [a.post, a]
}

export async function fetchAllPosts(data) {
  return Promise.all(get_post_links(data).map(fetchHubPost))
}

export async function getStaticProps(context){
  const post = "b0101a"
  const sub = "hubposts"
  const title = "Hubposts Megathread"
  const { locale, locales, defaultLocale, params } = context

  const url = get_post_url(sub, post, ".json")
  const data = await simple_axios(url) || []
  const allPosts = await fetchAllPosts(data)

  return {
    props: {
      root: {
        sub: sub,
        post: post,
        title: title,
        allPosts: allPosts 
      },
      params: params || null,
      locale,
      locales,
      defaultLocale
    },
		// Revalidate at most once per minute
		revalidate: 60
  }
}
