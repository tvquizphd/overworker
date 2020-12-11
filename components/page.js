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

  const replacements = [
    [/[\s\n"\\]+/g, ' '],
    [/´/g, "'"],
    [/\b[‘’](?=(s|m|t|d|ll|ve|re)\b)/g, "'"],
    [/\b([wW]o)nt(?! to)\b/g, "$1n't"],
    [/\b([cC]a|[mM]ust|[mM]ight|[nN]eed)nt\b/g, "$1n't"],
    [/\b([iI]s|[aA]re|[wW]as|[wW]ere)nt\b/g, "$1n't"],
    [/\b([hH]as|[hH]ave|[hH]ad)nt\b/g, "$1n't"],
    [/\b([dD]oes|[dD]o|[dD]id)nt\b/g, "$1n't"],
    [/\b([sS]h|[cC]|[wW])ouldnt\b/g, "$1ouldn't"],
    [/\b([sS]h|[cC]|[wW])ouldve\b/g, "$1ould've"],
    [/\b([yY]ou|[iI]t|[wW]e|[tT]hey)d\b/g, "$1'd"],
    [/\b([iI]t|[tT]hey|[tT]his|[wW]hat)ll\b/g, "$1'll"],
    [/\b([hH]ere|[wW]here|[wW]hat)s\b/g, "$1's"],
    [/\b([wW]here|[wW]hat)'?d\b/g, "$1 did"],
    [/\b([tT]here)'?ve\b/g, "$1 have"],
    [/\b([wW]here)'?ll\b/g, "$1 will"],
    [/\b([mM]ight)ve\b/g, "$1've"],
    [/\b([hH]e|[sS]he|[tT]hat|[tT]here|[wW]ho)(s|d|ll)\b/g, "$1'$2"],
    [/\b([yY]ou|[tT]hey)(re|ve|ll)\b/g, "$1'$2"],
    [/\b([wW]e|[wW]ho)(ve|ll)\b/g, "$1'$2"],
    [/\b(I)(m|ve)\b/g, "$1'$2"],
  ]
  const text = replacements.reduce((t,re) => t.replace(...re), inputText)
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
