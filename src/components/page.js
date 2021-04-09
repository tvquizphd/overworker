import useSWR from 'swr'
import { useState } from 'react'
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

  const {sub, post} = props.root
  const allPosts = new Map(
    props.root.allPosts.map(a => {
      return [a.post, {
        ...a,
        allSubposts: new Map(
          a.allSubposts.map(_a => {
            return [_a.post, _a]
          })
        )
      }]
    })
  )
  const [inputText, inputTextChange] = useState('Welcome')

  // Not corrected: Ill Id Were Well Wed Hell Shell Shed Its Whore Lets Ones
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
    [/\b([hH]e|[sS]he|[hH]ere|[wW]here|[wW]hat)s\b/g, "$1's"],
    [/\b([iI]t|[tT]hey|[tT]his|[wW]hat)ll\b/g, "$1'll"],
    [/\b([yY]ou|[hH]e|[iI]t|[tT]hey)d\b/g, "$1'd"],
    [/\b([wW]here|[wW]hat)'?d\b/g, "$1 did"],
    [/\b([wW]e|[mM]ight)ve\b/g, "$1've"],
    [/\b([tT]here)'?ve\b/g, "$1 have"],
    [/\b([wW]here)'?ll\b/g, "$1 will"],
    [/\b([tT]hat|[tT]here|[wW]ho)(s|d|ll)\b/g, "$1'$2"],
    [/\b([yY]ou|[tT]hey)(re|ve|ll)\b/g, "$1'$2"],
    [/\b([wW]ho)(ve|ll)\b/g, "$1'$2"],
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
      sub={sub}
      post={post}
      allPosts={allPosts}
      subList={['AskReddit']}
      inputText={inputText}
      inputTextChange={inputTextChange}
    />
  )
}
