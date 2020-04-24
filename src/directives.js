const {SchemaDirectiveVisitor} = require("apollo-server");
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

module.exports = {
  FormatDateDirective,
};
