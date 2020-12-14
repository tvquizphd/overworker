import Page from '../components/page'
import { useRouter } from 'next/router'

export default function Index( props ) {
  const router = useRouter()
  const slug = router.query.slug || []

  // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running
  if (router.isFallback) {
    return <div>Loading...</div>
  }
  return <Page/>
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
    fallback: 'blocking',
  }
}

export const getStaticProps = ({ locale, locales, defaultLocale, params }) => {
  return {
    props: {
      params: params || null,
      locale,
      locales,
      defaultLocale,
    },
		// Revalidate at most once per minute
		revalidate: 60
  }
}
