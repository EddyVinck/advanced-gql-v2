const {ApolloServer, PubSub, SchemaDirectiveVisitor} = require("apollo-server");
const gql = require("graphql-tag");
const {defaultFieldResolver, GraphQLString} = require("graphql");

const mockUser = {
  id: 1,
  username: "EddyVinck",
  createdAt: 2316546987,
};

const pubSub = new PubSub();
const NEW_ITEM_EVENT = "NEW_ITEM_EVENT";

class LogDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const oldResolver = field.resolve || defaultFieldResolver;

    // allow the query (client) to add arguments
    field.args.push({
      type: GraphQLString,
      name: "message",
    });

    field.resolve = (root, {message, ...rest}, ctx, info) => {
      // schemaMessage can fall back to schema default
      // `message` can come from the client as well!
      const {message: schemaMessage} = this.args;

      console.log("hello!", message || schemaMessage);

      return oldResolver.call(
        this, // pass the same instance of the currently visited field / type /thing
        root, // the root of the query
        rest, // the other arguments
        ctx,
        info
      );
    };
  }
  visitScalar(scalar) {
    console.log(scalar);
    return scalar;
  }
}

const typeDefs = gql`
  directive @log(
    message: String = "my default message"
  ) on FIELD_DEFINITION | FIELD | SCALAR

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
    id: ID! @log(message: "id here")
    username: String!
    createdAt: Int!
    example: String @deprecated(reason: "use this other field we made instead")
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
  schemaDirectives: {
    log: LogDirective,
  },
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

const directiveExample = gql`
  query getMe($yes: Boolean!) {
    me {
      createdAt @include(if: $yes) #skip is the inverse of include
    }
  }
`;

server.listen().then(({url}) => console.log(`server on ${url}`));
