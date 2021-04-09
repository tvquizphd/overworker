import { ApolloServer, gql } from 'apollo-server-micro'
import { setupSentimentModel, getSentimentScore } from './sentiment'

const typeDefs = gql`
  type Query {
    feeling(text: String!): Feeling!
  }
  type Feeling {
    score: Float!
  }
`

const model_loaded = setupSentimentModel()

const resolvers = {
  Query: {
    feeling(parent, args, context) {
      return model_loaded.then(() => {
				return {
					score: getSentimentScore(args.text)
				}
			})
    },
  },
}

const apolloServer = new ApolloServer({ typeDefs, resolvers })

export const config = {
  api: {
    bodyParser: false,
  },
}

export default apolloServer.createHandler({ path: '/api/graphql' })
