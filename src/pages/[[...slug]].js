import Page from '../components/page'
import process from 'process'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import Head from 'next/head'
import Error from 'next/error'
import { useRouter } from 'next/router'
import { get_reddit_api } from '../functions/reddit_api'
import { fetchMegathread } from '../functions/fetch_posts'

export default function Index( props ) {
  const router = useRouter()
  const slug = router.query.slug || []

  // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running
  if (router.isFallback) {
    return <div>Loading...</div>
  }

  // Render default error page if page not found
  if (props.root.error) {
    const { code } = props.root.error
    return <div>
      <Head>
        <meta name="robots" content="noindex"/>
      </Head>
      <Error statusCode={code || 404} />
    </div>
  }

  return <Page {...props}/>
}

export const getStaticPaths = () => {
  return {
    paths: [
      {
        params: { slug: null },
        locale: 'en-US',
      }
    ],
    fallback: "blocking",
  }
}

export async function getStaticProps(context) {

  // Load environment
  try {
    const {error} = dotenv.config()
    if (error) {
      throw error;
    }
    else {
      console.log(`Loading .env`);
    }
  }
  catch(error) {
    console.log(`Cannot open .env at ${error.path}`);
  }

  const { locale, locales, defaultLocale, params } = context
  const request_path = params.slug? params.slug.join('/') : '/'
  const valid_paths = ['/']
  let root = {
    error: {
      code: 404
    }
  }
  const default_props = {
    root: root,
    locale,
    locales,
    params: params,
    defaultLocale
  }
  if (!valid_paths.includes(request_path)) {
    return {
      props: default_props,
      revalidate: 60
    }
  }
  const version = "0.0.1"
  const post = "b0101a"
  const sub = "hubposts"
  const title = "Hubposts Megathread"

  const save_dir = path.join(process.cwd(), 'data', locale, request_path, `v${version}`)
  const save_file = path.join(save_dir, `${post}.json`)
  if (!fs.existsSync(save_dir)) {
    console.log(`Missing ${save_file}`)
    fs.mkdirSync(save_dir, {recursive:true})
  }
  if (fs.existsSync(save_file)) {
    console.log(`Loading ${save_file}`)
    const saved_props = JSON.parse(fs.readFileSync(save_file));
    root = saved_props.root
  }
  else {
    const reddit_api = await get_reddit_api(version, save_dir)
    const root = await fetchMegathread(reddit_api, {
      sub, post, title
    })
    reddit_api.log(false, 'Done')
    fs.writeFileSync(save_file, JSON.stringify({ root }))
    console.log(`Written ${save_file}`)
  }
  return {
    props: {
      ...default_props,
      root: root
    },
    revalidate: 60
  }
}
