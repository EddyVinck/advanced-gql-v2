const gql = require("graphql-tag");
const createTestServer = require("./helper");
const db = require("../src/db");
const {getUserFromToken} = require("../src/auth");
const FEED = gql`
  {
    feed {
      id
      message
      createdAt
      likes
      views
    }
  }
`;

describe("schema testing queries", () => {
  const ADMIN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFhbVVzRGtPTFY3YWRtV3ozc3h5cyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTU4NzcxNzk3MX0.Doo6GgPqTJszD_3ddBLCGt6UdaLlM0Ysn1nBUJ97IXA";
  test("feed", async () => {
    const {query} = createTestServer({
      user: {id: 1},
      models: {
        Post: {
          findMany: jest.fn(() => [
            {
              id: 1,
              message: "hello",
              createdAt: 12345839,
              likes: 20,
              views: 300,
            },
          ]),
        },
      },
    });

    const res = await query({query: FEED});
    expect(res).toMatchSnapshot();
  });

  test("me", async () => {
    const ME = gql`
      {
        me {
          id
        }
      }
    `;
    const fakeUser = {id: "1"};
    const {query} = createTestServer({
      user: fakeUser,
    });
    const res = await query({query: ME});

    expect(fakeUser).toEqual(res.data.me);
  });

  // test("post", async () => {
  //   const POST = gql`
  //     {
  //       id
  //       message
  //       author {
  //         id
  //       }
  //     }
  //   `
  //   const {query} = createTestServer({
  //     ...db
  //   })
  // })

  test("user -> posts with the correct user", async () => {
    const MY_POSTS = gql`
      {
        me {
          id
          posts {
            message
            author {
              id
            }
          }
        }
      }
    `;
    const postAuthor = {id: "1"};
    const fakePost = {
      id: 1,
      message: "hello",
      createdAt: 12345839,
      likes: 20,
      views: 300,
      author: postAuthor,
    };
    const {query} = createTestServer({
      user: postAuthor,
      models: {
        User: {
          findOne: () => ({
            id: "1",
          }),
        },
        Post: {
          findMany: () => [fakePost],
        },
      },
    });
    const res = await query({query: MY_POSTS});

    expect(res.data.me.id).toBe(postAuthor.id);
    expect(res.data.me.posts[0].author.id).toBe(postAuthor.id);
  });
});
