import useSWR from 'swr'
import ClassedList from './classed_list'
import { get_post_url } from '../functions/make_urls'
import TreeMap from '../containers/tree_map'

const fetcher_simple = (url) => fetch(url).then((res) => res.json())

const node_renderer = (comments) => {

  return index => {
    const a = comments[index]
    return (
      <div key={index}> 
        <span>{`test`}</span>
      </div>
    )
  }
}

export default function RootNode(props) {
  const { sub, post, size } = props

  const url = get_post_url(sub, post, ".json")
  const { data, error } = useSWR(url, fetcher_simple)

  if (error) return <div>Failed to load</div>
  if (!data) return <div>Loading...</div>
  const comments = [] 
  const render_comment = node_renderer(comments)
  const node_list = (
    <ClassedList className={""}>
      {comments.map((a,i) => render_comment(i))}
    </ClassedList>
  )

  return (
    <TreeMap/>
  )
}
