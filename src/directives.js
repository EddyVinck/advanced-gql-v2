const {SchemaDirectiveVisitor, AuthenticationError} = require("apollo-server");
const {defaultFieldResolver, GraphQLString} = require("graphql");
const {formatDate} = require("./utils");

class FormatDateDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const {resolve = defaultFieldResolver} = field;
    const {defaultFormat} = this.args;

    // This adds the autocomplete in the playground, too.
    field.args.push({
      name: "format",
      // The formatted Date becomes a String, so the field type must change
      type: GraphQLString,
    });

    field.resolve = async (source, {format, ...otherArgs}, ctx, info) => {
      // just what a resolver needs except `this`
      const date = await resolve.call(this, source, otherArgs, ctx, info);
      if (["string", "number"].includes(typeof date)) {
        return formatDate(date, format || defaultFormat);
      }
      return date;
    };

    field.type = GraphQLString;
  }
}

class AuthenticationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const {resolve = defaultFieldResolver} = field;
    field.resolve = async (root, args, ctx, info) => {
      if (!ctx.user) {
        throw new AuthenticationError("You need to be logged in to do this.");
      }
      return resolve(root, args, ctx, info);
    };
  }
}

class AuthorizationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const {resolve = defaultFieldResolver} = field;
    const {role} = this.args;
    field.resolve = async (root, args, ctx, info) => {
      if (!ctx.user || !ctx.user.role || ctx.user.role !== role) {
        throw new AuthenticationError("You need to be authorized to do this.");
      }
      return resolve(root, args, ctx, info);
    };
  }
}

module.exports = {
  FormatDateDirective,
  AuthorizationDirective,
  AuthenticationDirective,
};
