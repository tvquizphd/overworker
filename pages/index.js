import useSWR from 'swr'
import Post from '../containers/post'
import styles from './index.module.css'

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
    <div className={`${styles.box}`}>
      <div className={`${styles.header} ${styles.row}`}>
        {users.map((user, i) => (
          <div key={i}>{user.name}</div>
        ))}
      </div>
      <Post
        depth={0}
        sub="hubposts"
        post="b0101a"
        subList={['Hubposts','AskReddit']}
      />
    </div>
  )
}
