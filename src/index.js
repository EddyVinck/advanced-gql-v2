const {ApolloServer} = require("apollo-server");
const typeDefs = require("./typedefs");
const resolvers = require("./resolvers");
const {createToken, getUserFromToken} = require("./auth");
const db = require("./db");

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
      if (!user) throw new Error("nope"); // only do this if you need someone to be authenticated when using any of your subscriptions
      return {...db, user, createToken};
    },
  },
});

server.listen(4000).then(({url}) => {
  console.log(`🚀 Server ready at ${url}`);
});
