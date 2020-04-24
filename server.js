const { ApolloServer } = require("apollo-server");
const gql = require("graphql-tag");

const mockUser = {
  id: 1,
  username: "EddyVinck",
  createdAt: 2316546987,
};

const typeDefs = gql`
  type Query {
    me: User!
    settings(user: ID!): Settings!
  }
  type Mutations {
    createSettings(input: CreateSettingsInput): Settings!
  }

  type User {
    id: ID!
    username: String!
    createdAt: Int!
  }

  enum Theme {
    LIGHT
    DARK
  }

  type Settings {
    user: User!
    theme: Theme!
  }
  input CreateSettingsInput {
    user: ID!
    theme: Theme!
  }
`;

const resolvers = {
  Query: {
    me() {
      return { ...mockUser };
    },
    settings(_, { user }) {
      return {
        user,
        theme: "DARK",
      };
    },
  },
  Mutations: {
    createSettings(_, { input }) {
      return {
        user: mockUser.id,
        theme: "DARK",
      };
    },
  },
  Settings: {
    user(_settings) {
      return { ...mockUser };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => console.log(`server on ${url}`));
