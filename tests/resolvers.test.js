const resolvers = require("../src/resolvers");

describe("resolvers", () => {
  test("feed", () => {
    const result = resolvers.Query.feed(null, null, {
      models: {
        Post: {
          findMany() {
            return ["hey"];
          },
        },
      },
    });
    expect(result).toEqual(["hey"]);
  });
});
