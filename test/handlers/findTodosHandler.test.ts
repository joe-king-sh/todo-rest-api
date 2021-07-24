import { handler } from "../../lambda/handlers/findTodosHandler";

import { APIGatewayEvent } from "aws-lambda";
import {
  ErrorMessage,
  DynamodbError,
  buildErrorMessage,
} from "../../lambda/domains/errorUseCase";

import { TodoUseCase } from "../../lambda/domains/todoUseCase";

// 認証関連は全てモック化しておく
jest.mock("../../lambda/infrastructures/cognito");

process.env.ES_DOMAIN = "test-domain";

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

  test("Case2: 正常にTodo検索完了(検索条件なし、取得結果1件))", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // モックをセット
    const mockUpdatedDate = new Date().toUTCString();
    const findTodosSpy = jest
      .spyOn(TodoUseCase.prototype, "findTodos")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          const findResult = {
            todos: [
              {
                userId: "my-unit-test-user",
                todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
                title: "タイトル",
                content: "Todo内容",
                updatedDate: mockUpdatedDate,
              },
            ],
            totalCount: 1,
          };
          resolve(findResult);
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
            updatedDate: mockUpdatedDate,
          },
        ],
        totalCount: 1,
      }),
    };

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case3: 正常にTodo検索完了(qとsizeとfromあり、取得結果1件))", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // モックをセット
    const mockUpdatedDate = new Date().toUTCString();
    const findTodosSpy = jest
      .spyOn(TodoUseCase.prototype, "findTodos")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          const findResult = {
            todos: [
              {
                userId: "my-unit-test-user",
                todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
                title: "タイトル",
                content: "Todo内容",
                updatedDate: mockUpdatedDate,
              },
            ],
            totalCount: 1,
          };
          resolve(findResult);
        })
      );

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.queryStringParameters = { q: "text", size: "2", from: "0" };
    const expected = {
      statusCode: 200,
      body: JSON.stringify({
        todos: [
          {
            userId: "my-unit-test-user",
            todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            title: "タイトル",
            content: "Todo内容",
            updatedDate: mockUpdatedDate,
          },
        ],
        totalCount: 1,
      }),
    };

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });
});
