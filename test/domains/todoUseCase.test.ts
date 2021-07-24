import {
  TodoUseCase,
  SpecifyTodoProps,
  PutTodoProps,
} from "../../lambda/domains/todoUseCase";

import {
  ErrorMessage,
  NotFoundError,
  DynamodbError,
} from "../../lambda/domains/errorUseCase";
import {
  DeleteTodoInDynamodbProps,
  DynamodbTodoTable,
} from "../../lambda/infrastructures/dynamodbTodoTable";
import { CognitoUserPool } from "../../lambda/infrastructures/cognito";
import * as ES from "../../lambda/infrastructures/elasticSearchTodoDomain";

// Dynamodb関連処理をモック化する
jest.mock("../../lambda/infrastructures/dynamodbTodoTable");
// 認証関連は全てモック化しておく
jest.mock("../../lambda/infrastructures/cognito");

describe("特定のTodo取得ユースケースのテスト", (): void => {
  test("Case1: Todoが正常に1件取得成功", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する

    const mockGetTodo = jest.fn();
    mockGetTodo.mockReturnValue({
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "Todo内容",
    });

    DynamodbTodoTable.getTodoItem = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: SpecifyTodoProps = {
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };
    const expected = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "Todo内容",
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.getSpecificTodo(params)).resolves.toEqual(
      expected
    );
  });
  test("Case2-1: Todoが正常に1件取得成功(値が全部空)", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する

    const mockGetTodo = jest.fn();
    mockGetTodo.mockReturnValue({
      userId: "",
      todoId: "",
      title: "",
      content: "",
    });

    DynamodbTodoTable.getTodoItem = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: SpecifyTodoProps = {
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };
    const expected = {
      userId: "",
      todoId: "",
      title: "",
      content: "",
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.getSpecificTodo(params)).resolves.toEqual(
      expected
    );
  });

  test("Case2-2: Todoが正常に1件取得成功(値が全部undefined)", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する

    const mockGetTodo = jest.fn();
    mockGetTodo.mockReturnValue({
      userId: undefined,
      todoId: undefined,
      title: undefined,
      content: undefined,
    });

    DynamodbTodoTable.getTodoItem = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: SpecifyTodoProps = {
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };
    const expected = {
      userId: undefined,
      todoId: undefined,
      title: undefined,
      content: undefined,
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.getSpecificTodo(params)).resolves.toEqual(
      expected
    );
  });

  test("Case3: Dynamodbからの取得結果が0件", async () => {
    jest.resetAllMocks();
    expect.assertions(2);

    // Dynamodb関連処理をモック化する
    const mockGetTodo = jest.fn();
    mockGetTodo.mockReturnValue(undefined); // DBから返ってくる
    DynamodbTodoTable.getTodoItem = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: SpecifyTodoProps = {
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };
    const expectedErrorMessage = ErrorMessage.NOT_FOUND(
      "todoId: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    );
    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.getSpecificTodo(params)).rejects.toThrowError(
      new NotFoundError(expectedErrorMessage)
    );
    await expect(todoUseCase.getSpecificTodo(params)).rejects.toThrowError(
      NotFoundError
    );
  });
});

describe("Todo 登録/更新系ユースケースのテスト", (): void => {
  test("Case1: Todoが正常に1件登録成功", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する
    const mockPutTodo = jest.fn();
    DynamodbTodoTable.putTodoItem = mockPutTodo.bind(DynamodbTodoTable);
    CognitoUserPool.getUserNameFromIdToken = jest
      .fn()
      .mockReturnValue("my-unittest-user");

    // WHEN
    const params: PutTodoProps = {
      title: "タイトル",
      content: "Todo内容",
    };
    const expected = {
      userId: "my-unittest-user",
      todoId: expect.any(String),
      title: "タイトル",
      content: "Todo内容",
      updatedDate: expect.any(String),
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.putTodo(params)).resolves.toEqual(expected);
  });

  test("Case2: userIdとtodoId以外空で正常に1件登録成功", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する
    const mockPutTodo = jest.fn();
    DynamodbTodoTable.putTodoItem = mockPutTodo.bind(DynamodbTodoTable);
    CognitoUserPool.getUserNameFromIdToken = jest
      .fn()
      .mockReturnValue("my-unittest-user");

    // WHEN
    const params: PutTodoProps = {
      title: "",
      content: "",
    };
    const expected = {
      userId: "my-unittest-user",
      todoId: expect.any(String),
      title: "",
      content: "",
      updatedDate: expect.any(String),
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.putTodo(params)).resolves.toEqual(expected);
  });

  test("Case3: TodoIdを引数に指定し、更新されるパターン", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する
    const mockPutTodo = jest.fn();
    DynamodbTodoTable.putTodoItem = mockPutTodo.bind(DynamodbTodoTable);
    CognitoUserPool.getUserNameFromIdToken = jest
      .fn()
      .mockReturnValue("my-unittest-user");

    // WHEN
    const params: PutTodoProps = {
      todoId: "MyTodoId",
      title: "タイトル",
      content: "Todo内容",
    };
    const expected = {
      userId: "my-unittest-user",
      todoId: "MyTodoId",
      title: "タイトル",
      content: "Todo内容",
      updatedDate: expect.any(String),
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.putTodo(params)).resolves.toEqual(expected);
  });
});

describe("Todo 削除ユースケースのテスト", (): void => {
  test("Case1: Todoが正常に1件削除成功", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する
    const mockDeleteTodo = jest.fn();
    mockDeleteTodo.mockReturnValue(undefined);
    DynamodbTodoTable.deleteTodoItem = mockDeleteTodo.bind(DynamodbTodoTable);
    const mockGetTodo = jest.fn();
    mockGetTodo.mockReturnValue({
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "Todo内容",
      updatedDate: expect.any(String),
    });
    DynamodbTodoTable.getTodoItem = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: DeleteTodoInDynamodbProps = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.deleteTodo(params)).resolves.toEqual(undefined);
  });
  test("Case2: 削除対象のTodoが見つからない", async () => {
    jest.resetAllMocks();
    expect.assertions(2);

    // Dynamodb関連処理をモック化する
    const mockGetTodo = jest.fn();
    mockGetTodo.mockReturnValue(undefined);
    DynamodbTodoTable.getTodoItem = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: DeleteTodoInDynamodbProps = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    expect(async () => {
      await todoUseCase.deleteTodo(params);
    }).rejects.toThrowError(
      new NotFoundError(
        ErrorMessage.NOT_FOUND(`todoId: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`)
      )
    );
    expect(
      async () => await todoUseCase.deleteTodo(params)
    ).rejects.toThrowError(NotFoundError);
  });
});

describe("Todo Todo一括取得のユースケースのテスト", (): void => {
  test("Case1: Todoが正常に指定した件数取得できる", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する
    const mockListTodo = jest.fn();
    mockListTodo.mockReturnValue(undefined);
    DynamodbTodoTable.listTodoItems = mockListTodo.bind(DynamodbTodoTable);

    // WHEN
    const params = {
      limit: 10,
      nextToken: "next token like jwt",
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.listTodos(params)).resolves.toEqual(undefined);
  });
});

describe("Todo Todo検索のユースケースのテスト", (): void => {
  test("Case1: 検索条件なしで検索 全2件", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    const searchByUserIdAndByQuerySpy = jest
      .spyOn(ES.ElasticSearchTodoDomain.prototype, "searchByUserIdAndByQuery")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          const response = {
            body: {
              took: 4,
              timed_out: false,
              _shards: {
                total: 5,
                successful: 5,
                skipped: 0,
                failed: 0,
              },
              hits: {
                total: {
                  value: 2,
                  relation: "eq",
                },
                max_score: 1.0,
                hits: [
                  {
                    _index: "my-unit-test-user",
                    _type: "_doc",
                    _id: "my-unit-test-user20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                    _score: 1.0,
                    _source: {
                      updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
                      title: "title1",
                      todoId:
                        "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                      userId: "my-unit-test-user",
                      content: "test contents",
                    },
                  },
                  {
                    _index: "my-unit-test-user",
                    _type: "_doc",
                    _id: "my-unit-test-user20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
                    _score: 1.0,
                    _source: {
                      updatedDate: "Fri, 23 Jul 2021 15:12:56 GMT",
                      title: "title2",
                      todoId:
                        "20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
                      userId: "my-unit-test-user",
                      content: "testcontents",
                    },
                  },
                ],
              },
            },

            statusCode: 200,
            headers: {
              date: "Sat, 24 Jul 2021 00:45:26 GMT",
              "content-type": "application/json; charset=UTF-8",
              "content-length": "4182",
              connection: "keep-alive",
              "access-control-allow-origin": "*",
            },
            meta: {
              context: null,
              request: {
                params: {
                  method: "POST",
                  path: "/my-unit-test-user/_search",
                  body: '{"query":{"match_all":{}}}',
                  querystring: "",
                  headers: {
                    "user-agent":
                      "elasticsearch-js/7.13.0 (linux 4.14.231-180.360.amzn2.x86_64-x64; Node.js v14.17.1)",
                    "x-elastic-client-meta":
                      "es=7.13.0,js=14.17.1,t=7.13.0,hc=14.17.1",
                    "content-type": "application/json",
                    "content-length": "26",
                  },
                  timeout: 30000,
                },
                options: {},
                id: 1,
              },
              name: "elasticsearch-js",
              connection: {
                url: "https://test-domain.ap-northeast-1.es.amazonaws.com/",
                id: "https://test-domain.ap-northeast-1.es.amazonaws.com/",
                headers: {},
                deadCount: 0,
                resurrectTimeout: 0,
                _openRequests: 0,
                status: "alive",
                roles: {
                  master: true,
                  data: true,
                  ingest: true,
                  ml: false,
                },
              },
              attempts: 0,
              aborted: false,
            },
          };
          resolve(response as any);
        })
      );

    // WHEN
    const params = {
      node: "my-test-node",
      userId: "my-unit-test-user",
    };
    const expected = {
      totalCount: 2,
      todos: [
        {
          updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
          title: "title1",
          todoId: "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
          userId: "my-unit-test-user",
          content: "test contents",
        },
        {
          updatedDate: "Fri, 23 Jul 2021 15:12:56 GMT",
          title: "title2",
          todoId: "20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
          userId: "my-unit-test-user",
          content: "testcontents",
        },
      ],
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.findTodos(params)).resolves.toEqual(expected);
  });

  test("Case2: 全部5件で、size2を指定", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    const searchByUserIdAndByQuerySpy = jest
      .spyOn(ES.ElasticSearchTodoDomain.prototype, "searchByUserIdAndByQuery")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          const response = {
            body: {
              took: 4,
              timed_out: false,
              _shards: {
                total: 5,
                successful: 5,
                skipped: 0,
                failed: 0,
              },
              hits: {
                total: {
                  value: 5,
                  relation: "eq",
                },
                max_score: 1.0,
                hits: [
                  {
                    _index: "my-unit-test-user",
                    _type: "_doc",
                    _id: "my-unit-test-user20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                    _score: 1.0,
                    _source: {
                      updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
                      title: "title1",
                      todoId:
                        "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                      userId: "my-unit-test-user",
                      content: "test contents",
                    },
                  },
                  {
                    _index: "my-unit-test-user",
                    _type: "_doc",
                    _id: "my-unit-test-user20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
                    _score: 1.0,
                    _source: {
                      updatedDate: "Fri, 23 Jul 2021 15:12:56 GMT",
                      title: "title2",
                      todoId:
                        "20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
                      userId: "my-unit-test-user",
                      content: "testcontents",
                    },
                  },
                ],
              },
            },

            statusCode: 200,
            headers: {
              date: "Sat, 24 Jul 2021 00:45:26 GMT",
              "content-type": "application/json; charset=UTF-8",
              "content-length": "4182",
              connection: "keep-alive",
              "access-control-allow-origin": "*",
            },
            meta: {
              context: null,
              request: {
                params: {
                  method: "POST",
                  path: "/my-unit-test-user/_search",
                  body: '{"query":{"match_all":{}}}',
                  querystring: "",
                  headers: {
                    "user-agent":
                      "elasticsearch-js/7.13.0 (linux 4.14.231-180.360.amzn2.x86_64-x64; Node.js v14.17.1)",
                    "x-elastic-client-meta":
                      "es=7.13.0,js=14.17.1,t=7.13.0,hc=14.17.1",
                    "content-type": "application/json",
                    "content-length": "26",
                  },
                  timeout: 30000,
                },
                options: {},
                id: 1,
              },
              name: "elasticsearch-js",
              connection: {
                url: "https://test-domain.ap-northeast-1.es.amazonaws.com/",
                id: "https://test-domain.ap-northeast-1.es.amazonaws.com/",
                headers: {},
                deadCount: 0,
                resurrectTimeout: 0,
                _openRequests: 0,
                status: "alive",
                roles: {
                  master: true,
                  data: true,
                  ingest: true,
                  ml: false,
                },
              },
              attempts: 0,
              aborted: false,
            },
          };
          resolve(response as any);
        })
      );

    // WHEN
    const params = {
      node: "my-test-node",
      userId: "my-unit-test-user",
      size: 2,
    };
    const expected = {
      totalCount: 5,
      todos: [
        {
          updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
          title: "title1",
          todoId: "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
          userId: "my-unit-test-user",
          content: "test contents",
        },
        {
          updatedDate: "Fri, 23 Jul 2021 15:12:56 GMT",
          title: "title2",
          todoId: "20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
          userId: "my-unit-test-user",
          content: "testcontents",
        },
      ],
      nextStartKey: 2,
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.findTodos(params)).resolves.toEqual(expected);
  });

  test("Case3: 全部5件で、from:2, size:2を指定", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    const searchByUserIdAndByQuerySpy = jest
      .spyOn(ES.ElasticSearchTodoDomain.prototype, "searchByUserIdAndByQuery")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          const response = {
            body: {
              took: 4,
              timed_out: false,
              _shards: {
                total: 5,
                successful: 5,
                skipped: 0,
                failed: 0,
              },
              hits: {
                total: {
                  value: 5,
                  relation: "eq",
                },
                max_score: 1.0,
                hits: [
                  {
                    _index: "my-unit-test-user",
                    _type: "_doc",
                    _id: "my-unit-test-user20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                    _score: 1.0,
                    _source: {
                      updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
                      title: "title1",
                      todoId:
                        "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                      userId: "my-unit-test-user",
                      content: "test contents",
                    },
                  },
                  {
                    _index: "my-unit-test-user",
                    _type: "_doc",
                    _id: "my-unit-test-user20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
                    _score: 1.0,
                    _source: {
                      updatedDate: "Fri, 23 Jul 2021 15:12:56 GMT",
                      title: "title2",
                      todoId:
                        "20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
                      userId: "my-unit-test-user",
                      content: "testcontents",
                    },
                  },
                ],
              },
            },

            statusCode: 200,
            headers: {
              date: "Sat, 24 Jul 2021 00:45:26 GMT",
              "content-type": "application/json; charset=UTF-8",
              "content-length": "4182",
              connection: "keep-alive",
              "access-control-allow-origin": "*",
            },
            meta: {
              context: null,
              request: {
                params: {
                  method: "POST",
                  path: "/my-unit-test-user/_search",
                  body: '{"query":{"match_all":{}}}',
                  querystring: "",
                  headers: {
                    "user-agent":
                      "elasticsearch-js/7.13.0 (linux 4.14.231-180.360.amzn2.x86_64-x64; Node.js v14.17.1)",
                    "x-elastic-client-meta":
                      "es=7.13.0,js=14.17.1,t=7.13.0,hc=14.17.1",
                    "content-type": "application/json",
                    "content-length": "26",
                  },
                  timeout: 30000,
                },
                options: {},
                id: 1,
              },
              name: "elasticsearch-js",
              connection: {
                url: "https://test-domain.ap-northeast-1.es.amazonaws.com/",
                id: "https://test-domain.ap-northeast-1.es.amazonaws.com/",
                headers: {},
                deadCount: 0,
                resurrectTimeout: 0,
                _openRequests: 0,
                status: "alive",
                roles: {
                  master: true,
                  data: true,
                  ingest: true,
                  ml: false,
                },
              },
              attempts: 0,
              aborted: false,
            },
          };
          resolve(response as any);
        })
      );

    // WHEN
    const params = {
      node: "my-test-node",
      userId: "my-unit-test-user",
      size: 2,
      nextStartKey: 2,
    };
    const expected = {
      totalCount: 5,
      todos: [
        {
          updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
          title: "title1",
          todoId: "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
          userId: "my-unit-test-user",
          content: "test contents",
        },
        {
          updatedDate: "Fri, 23 Jul 2021 15:12:56 GMT",
          title: "title2",
          todoId: "20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
          userId: "my-unit-test-user",
          content: "testcontents",
        },
      ],
      nextStartKey: 4,
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.findTodos(params)).resolves.toEqual(expected);
  });
  test("Case4: 全部5件で、from:3, size:2を指定(境界値)", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    const searchByUserIdAndByQuerySpy = jest
      .spyOn(ES.ElasticSearchTodoDomain.prototype, "searchByUserIdAndByQuery")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          const response = {
            body: {
              took: 4,
              timed_out: false,
              _shards: {
                total: 5,
                successful: 5,
                skipped: 0,
                failed: 0,
              },
              hits: {
                total: {
                  value: 5,
                  relation: "eq",
                },
                max_score: 1.0,
                hits: [
                  {
                    _index: "my-unit-test-user",
                    _type: "_doc",
                    _id: "my-unit-test-user20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                    _score: 1.0,
                    _source: {
                      updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
                      title: "title1",
                      todoId:
                        "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                      userId: "my-unit-test-user",
                      content: "test contents",
                    },
                  },
                ],
              },
            },

            statusCode: 200,
            headers: {
              date: "Sat, 24 Jul 2021 00:45:26 GMT",
              "content-type": "application/json; charset=UTF-8",
              "content-length": "4182",
              connection: "keep-alive",
              "access-control-allow-origin": "*",
            },
            meta: {
              context: null,
              request: {
                params: {
                  method: "POST",
                  path: "/my-unit-test-user/_search",
                  body: '{"query":{"match_all":{}}}',
                  querystring: "",
                  headers: {
                    "user-agent":
                      "elasticsearch-js/7.13.0 (linux 4.14.231-180.360.amzn2.x86_64-x64; Node.js v14.17.1)",
                    "x-elastic-client-meta":
                      "es=7.13.0,js=14.17.1,t=7.13.0,hc=14.17.1",
                    "content-type": "application/json",
                    "content-length": "26",
                  },
                  timeout: 30000,
                },
                options: {},
                id: 1,
              },
              name: "elasticsearch-js",
              connection: {
                url: "https://test-domain.ap-northeast-1.es.amazonaws.com/",
                id: "https://test-domain.ap-northeast-1.es.amazonaws.com/",
                headers: {},
                deadCount: 0,
                resurrectTimeout: 0,
                _openRequests: 0,
                status: "alive",
                roles: {
                  master: true,
                  data: true,
                  ingest: true,
                  ml: false,
                },
              },
              attempts: 0,
              aborted: false,
            },
          };
          resolve(response as any);
        })
      );

    // WHEN
    const params = {
      node: "my-test-node",
      userId: "my-unit-test-user",
      size: 2,
      nextStartKey: 3,
    };
    const expected = {
      totalCount: 5,
      todos: [
        {
          updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
          title: "title1",
          todoId: "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
          userId: "my-unit-test-user",
          content: "test contents",
        },
      ],
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.findTodos(params)).resolves.toEqual(expected);
  });
  test("Case5: 全部5件で、from:4, size:2を指定(境界値+1)", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    const searchByUserIdAndByQuerySpy = jest
      .spyOn(ES.ElasticSearchTodoDomain.prototype, "searchByUserIdAndByQuery")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          const response = {
            body: {
              took: 4,
              timed_out: false,
              _shards: {
                total: 5,
                successful: 5,
                skipped: 0,
                failed: 0,
              },
              hits: {
                total: {
                  value: 5,
                  relation: "eq",
                },
                max_score: 1.0,
                hits: [
                  {
                    _index: "my-unit-test-user",
                    _type: "_doc",
                    _id: "my-unit-test-user20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                    _score: 1.0,
                    _source: {
                      updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
                      title: "title1",
                      todoId:
                        "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                      userId: "my-unit-test-user",
                      content: "test contents",
                    },
                  },
                ],
              },
            },

            statusCode: 200,
            headers: {
              date: "Sat, 24 Jul 2021 00:45:26 GMT",
              "content-type": "application/json; charset=UTF-8",
              "content-length": "4182",
              connection: "keep-alive",
              "access-control-allow-origin": "*",
            },
            meta: {
              context: null,
              request: {
                params: {
                  method: "POST",
                  path: "/my-unit-test-user/_search",
                  body: '{"query":{"match_all":{}}}',
                  querystring: "",
                  headers: {
                    "user-agent":
                      "elasticsearch-js/7.13.0 (linux 4.14.231-180.360.amzn2.x86_64-x64; Node.js v14.17.1)",
                    "x-elastic-client-meta":
                      "es=7.13.0,js=14.17.1,t=7.13.0,hc=14.17.1",
                    "content-type": "application/json",
                    "content-length": "26",
                  },
                  timeout: 30000,
                },
                options: {},
                id: 1,
              },
              name: "elasticsearch-js",
              connection: {
                url: "https://test-domain.ap-northeast-1.es.amazonaws.com/",
                id: "https://test-domain.ap-northeast-1.es.amazonaws.com/",
                headers: {},
                deadCount: 0,
                resurrectTimeout: 0,
                _openRequests: 0,
                status: "alive",
                roles: {
                  master: true,
                  data: true,
                  ingest: true,
                  ml: false,
                },
              },
              attempts: 0,
              aborted: false,
            },
          };
          resolve(response as any);
        })
      );

    // WHEN
    const params = {
      node: "my-test-node",
      userId: "my-unit-test-user",
      size: 2,
      nextStartKey: 4,
    };
    const expected = {
      totalCount: 5,
      todos: [
        {
          updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
          title: "title1",
          todoId: "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
          userId: "my-unit-test-user",
          content: "test contents",
        },
      ],
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.findTodos(params)).resolves.toEqual(expected);
  });
});
