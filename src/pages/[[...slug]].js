import Page from '../components/page'
import TreeMap from '../containers/tree_map'
import process from 'process'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import Head from 'next/head'
import Error from 'next/error'
import { useRouter } from 'next/router'
import { fetchRoot } from '../functions/fetch_posts'

export default function Index( props ) {
  const router = useRouter()
  const slug = router.query.slug || []

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

  // Render the tree
  if (slug[0] == 'tree') {
    return <TreeMap/>
  }

  return <Page {...props}/>
}

export const getStaticPaths = () => {
  return {
    paths: [
      {
        params: { slug: undefined },
        locale: 'en-US',
      },
      {
        params: { slug: ['tree'] },
        locale: 'en-US',
      }
    ],
    fallback: false
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

  const { locale, params } = context
  const props = {
    locale,
    params,
    root: {
      error: 500
    }
  }

  const version = "0.0.1"
  const post = "b0101a"
  const sub = "hubposts"
  const title = "Hubposts Megathread"

  const save_dir = path.join(process.cwd(), 'data', locale, `v${version}`)
  const save_file = path.join(save_dir, `${post}.json`)

  if (fs.existsSync(save_file)) {
    const { root } = JSON.parse(fs.readFileSync(save_file));
    console.log(`Loaded ${save_file}`)
    props.root = root
  }
  else {
    const { root } = await fetchRoot(version, save_dir, {
      sub, post, title
    })
    if (!fs.existsSync(save_dir)) {
      fs.mkdirSync(save_dir, { recursive: true })
    }
    fs.writeFileSync(save_file, JSON.stringify({ root }))
    console.log(`Written ${save_file}`)
    props.root = root
  }
  return {
    props: props,
    revalidate: 60
  }
}
