const {ApolloServer, PubSub} = require("apollo-server");
const gql = require("graphql-tag");

const mockUser = {
  id: 1,
  username: "EddyVinck",
  createdAt: 2316546987,
};

const pubSub = new PubSub();
const NEW_ITEM_EVENT = "NEW_ITEM_EVENT";

const typeDefs = gql`
  type Query {
    me: User!
    settings(user: ID!): Settings!
  }
  type Mutation {
    createSettings(input: CreateSettingsInput): Settings!
    createItem(task: String!): Item!
  }
  type Subscription {
    newItem: Item
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

  type Item {
    task: String
  }
`;

const resolvers = {
  Query: {
    me() {
      return {...mockUser};
    },
    settings(_, {user}) {
      return {
        user,
        theme: "DARK",
      };
    },
  },
  Mutation: {
    createSettings(_, {input}) {
      return {
        user: mockUser.id,
        theme: "DARK",
      };
    },
    createItem(_, {task}) {
      const item = {task};
      const payload = {newItem: item};
      pubSub.publish(NEW_ITEM_EVENT, payload);
      return item;
    },
  },
  Subscription: {
    newItem: {
      subscribe: () => pubSub.asyncIterator(NEW_ITEM_EVENT),
    },
  },
  Settings: {
    user(_settings) {
      return {...mockUser};
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // gets created on every request
  context({connection}) {
    if (connection) {
      return {...connection.context};
    }
    return {};
  },
  subscriptions: {
    onConnect(params) {},
  },
});

server.listen().then(({url}) => console.log(`server on ${url}`));
