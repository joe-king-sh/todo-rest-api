import { handler } from "../../lambda/handlers/listTodosHandler";

import { APIGatewayEvent } from "aws-lambda";
import {
  ErrorMessage,
  NotFoundError,
  DynamodbError,
  buildErrorMessage,
} from "../../lambda/domains/errorUseCase";

import { TodoUseCase } from "../../lambda/domains/todoUseCase";

// 認証関連は全てモック化しておく
jest.mock("../../lambda/infrastructures/cognito");

// Lambdaに渡ってくるイベント変数のベース
const baseApiGatewayEvent: APIGatewayEvent = {
  body: "",
  headers: {},
  multiValueHeaders: {},
  httpMethod: "GET",
  isBase64Encoded: false,
  path: "todos",
  pathParameters: {},
  queryStringParameters: {},
  multiValueQueryStringParameters: {},
  stageVariables: {},
  requestContext: {
    accountId: "",
    apiId: "",
    authorizer: {},
    protocol: "",
    httpMethod: "",
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: "192.168.0.0",
      user: null,
      userAgent: null,
      userArn: null,
    },
    path: "",
    stage: "",
    requestId: "",
    requestTimeEpoch: 0,
    resourceId: "",
    resourcePath: "",
  },
  resource: "",
};

describe("Todo取得処理のハンドラのテスト", (): void => {
  test("Case1: Authorizationヘッダーが指定されていない", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    const expected = {
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["Authorization Header"])
      ),
    };

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case2: 正常にTodo取得完了(取得条件 limitとnextTokenなし)", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // モックをセット
    const listTodosSpy = jest
      .spyOn(TodoUseCase.prototype, "listTodos")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          const todoList = {
            todos: [
              {
                userId: "my-unit-test-user",
                todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
                title: "タイトル",
                content: "Todo内容",
                dueDate: "2019-05-31T18:24:00",
                isImportant: false,
              },
            ],
            nextToken: "xxxxx",
          };
          resolve(todoList);
        })
      );

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    const expected = {
      statusCode: 200,
      body: JSON.stringify({
        todos: [
          {
            userId: "my-unit-test-user",
            todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            title: "タイトル",
            content: "Todo内容",
            dueDate: "2019-05-31T18:24:00",
            isImportant: false,
          },
        ],
        nextToken: "xxxxx",
      }),
    };

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case3: 正常にTodo取得完了(取得条件 limitとnextTokenあり)", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // モックをセット
    const listTodosSpy = jest
      .spyOn(TodoUseCase.prototype, "listTodos")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          const todoList = {
            todos: [
              {
                userId: "my-unit-test-user",
                todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
                title: "タイトル",
                content: "Todo内容",
                dueDate: "2019-05-31T18:24:00",
                isImportant: false,
              },
            ],
            nextToken: "xxxxx",
          };
          resolve(todoList);
        })
      );

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.queryStringParameters = { limit: "10", nextToken: "aaaaaa" };
    const expected = {
      statusCode: 200,
      body: JSON.stringify({
        todos: [
          {
            userId: "my-unit-test-user",
            todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            title: "タイトル",
            content: "Todo内容",
            dueDate: "2019-05-31T18:24:00",
            isImportant: false,
          },
        ],
        nextToken: "xxxxx",
      }),
    };

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case4: 予期せぬエラー発生", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // モックをセット
    const listTodosSpy = jest
      .spyOn(TodoUseCase.prototype, "listTodos")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          throw Error(ErrorMessage.UNEXPECTED_ERROR());
        })
      );

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    const expected = {
      statusCode: 500,
      body: buildErrorMessage(ErrorMessage.UNEXPECTED_ERROR()),
    };

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });
});
