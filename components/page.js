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


export default function Page(props) {

  const {inputText, inputTextChange} = props

	const text = inputText.replace(/[\s\n"]+/g,' ')
	const query = `{ feeling(text: "${text}") { score } }`
  const { data, error } = useSWR(query, fetcher_graphql, {
		revalidateOnFocus: false
	})

  const waiting = {score: -1}
  const feeling = (error || !data)? waiting: data.feeling

  return (
		<Dash
			score={feeling.score}
			post="b0101a"
			sub="hubposts"
			subList={['AskReddit']}
      inputText={inputText}
      inputTextChange={inputTextChange}
		/>
  )
}
