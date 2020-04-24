const {
  ApolloServer,
  AuthenticationError,
  UserInputError,
  ApolloError,
} = require("apollo-server");
const typeDefs = require("./typedefs");
const resolvers = require("./resolvers");
const {createToken, getUserFromToken} = require("./auth");
const db = require("./db");
const {FormatDateDirective} = require("./directives");

class MyCustomError extends ApolloError {
  constructor(message) {
    super(message, "OHNOYOUHAVEANERROR");
  }
}

/**
 * @param {{ authorization: string }} reqHeaders
 */
const getUserFromReqHeaders = (reqHeaders) => {
  const token = reqHeaders.authorization;
  const user = getUserFromToken(token);
  return user;
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError(e) {
    // <any error tracking here>
    // can also change the `extensions` of the error object here if you like
    return e;
  },
  schemaDirectives: {
    formatDate: FormatDateDirective,
  },
  context({req, connection}) {
    const context = {...db};
    if (connection) {
      return {...context, ...connection.context};
    }
    const user = getUserFromReqHeaders(req.headers);
    return {...context, user, createToken};
  },
  subscriptions: {
    onConnect(params /* includes everything from req.headers */) {
      console.log(params);
      const user = getUserFromReqHeaders(params);
      if (!user) throw new AuthenticationError("nope"); // only do this if you need someone to be authenticated when using any of your subscriptions
      return {...db, user, createToken};
    },
  },
});

server.listen(4000).then(({url}) => {
  console.log(`🚀 Server ready at ${url}`);
});
