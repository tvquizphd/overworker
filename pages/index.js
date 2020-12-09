import useSWR from 'swr'
import Dash from '../containers/dash'

const fetcher_graphql = (query) =>
  fetch('/api/graphql', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  .then((res) => res.json())
  .then((json) => json.data)

export default function Index() {
  const { data, error } = useSWR('{ users { name } }', fetcher_graphql)

  if (error) return <div>Failed to load</div>
  if (!data) return <div>Loading...</div>

  const { users } = data

  return (
		<Dash
			users={users}
			post="b0101a"
			sub="hubposts"
			subList={['AskReddit']}
		/>
  )
}
