import { handler } from "../../lambda/handlers/putTodosHandler";

import { APIGatewayEvent } from "aws-lambda";
import {
  ErrorMessage,
  NotFoundError,
  DynamodbError,
  buildErrorMessage,
} from "../../lambda/domains/errorUseCase";
import { buildResponseWithCorsHeader } from "../../lambda/infrastructures/apiGateway";

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

describe("Todo登録処理のハンドラのテスト", (): void => {
  test("Case1: Authorizationヘッダーが指定されていない", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    const expected = buildResponseWithCorsHeader({
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["Authorization Header"])
      ),
    });

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case2: Requestボディがリクエストパラメータに指定されていない", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    const expected = buildResponseWithCorsHeader({
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["Request Body"])
      ),
    });

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case3: Requestボディが指定されているがJsonが不正", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.body = "invalid_json";
    const expected = buildResponseWithCorsHeader({
      statusCode: 400,
      body: buildErrorMessage(ErrorMessage.INVALID_PARAMETER()),
    });

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case4: Requestボディが指定されているがtitleが空", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.body = JSON.stringify({
      content: "awesome content",
    });
    const expected = buildResponseWithCorsHeader({
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["title", "content"])
      ),
    });

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case5: Requestボディが指定されているがcontentが空", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.body = JSON.stringify({ title: "todo title" });
    const expected = buildResponseWithCorsHeader({
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["title", "content"])
      ),
    });

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case6: Requestボディに必須項目のみ指定", async () => {
    expect.assertions(1);

    // モックをセット
    const mockUpdatedDate = new Date().toUTCString();
    const putTodoSpy = jest
      .spyOn(TodoUseCase.prototype, "putTodo")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          const todo = {
            userId: "my-unit-test-user",
            todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            title: "todo title",
            content: "content",
            updatedDate: mockUpdatedDate,
          };
          resolve(todo);
        })
      );
    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.body = JSON.stringify({ title: "todo title", content: "content" });
    const expected = buildResponseWithCorsHeader({
      statusCode: 200,
      body: JSON.stringify({
        userId: "my-unit-test-user",
        todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        title: "todo title",
        content: "content",
        updatedDate: mockUpdatedDate,
      }),
    });

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case7-1: Requestボディに全項目指定", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // モックをセット
    const mockUpdatedDate = new Date().toUTCString();
    const putTodoSpy = jest
      .spyOn(TodoUseCase.prototype, "putTodo")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          const todo = {
            userId: "my-unit-test-user",
            todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            title: "todo title",
            content: "content",
            updatedDate: mockUpdatedDate,
          };
          resolve(todo);
        })
      );

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.body = JSON.stringify({
      title: "todo title",
      content: "content",
    });
    const expected = buildResponseWithCorsHeader({
      statusCode: 200,
      body: JSON.stringify({
        userId: "my-unit-test-user",
        todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        title: "todo title",
        content: "content",
        updatedDate: mockUpdatedDate,
      }),
    });

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case7-2: Requestボディに全項目指定、TodoId指定の更新系", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // モックをセット
    const mockUpdatedDate = new Date().toUTCString();
    const putTodoSpy = jest
      .spyOn(TodoUseCase.prototype, "putTodo")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          const todo = {
            userId: "my-unit-test-user",
            todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            title: "todo title",
            content: "content",
            updatedDate: mockUpdatedDate,
          };
          resolve(todo);
        })
      );

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.pathParameters = { todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" }; // パスパラメータを指定する更新系
    event.body = JSON.stringify({
      title: "todo title",
      content: "content",
    });
    const expected = buildResponseWithCorsHeader({
      statusCode: 200,
      body: JSON.stringify({
        userId: "my-unit-test-user",
        todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        title: "todo title",
        content: "content",
        updatedDate: mockUpdatedDate,
      }),
    });

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case8: 予期せぬエラー発生", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // モックをセット
    const putTodoSpy = jest
      .spyOn(TodoUseCase.prototype, "putTodo")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          throw Error(ErrorMessage.UNEXPECTED_ERROR());
        })
      );

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.body = JSON.stringify({ title: "todo title", content: "content" });
    const expected = buildResponseWithCorsHeader({
      statusCode: 500,
      body: buildErrorMessage(ErrorMessage.UNEXPECTED_ERROR()),
    });

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case5: Dynamodb接続時にエラー発生", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // モックをセット
    const putTodoSpy = jest
      .spyOn(TodoUseCase.prototype, "putTodo")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          throw new DynamodbError(ErrorMessage.DYNAMODB_ERROR());
        })
      );

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.body = JSON.stringify({ title: "todo title", content: "content" });
    const expected = buildResponseWithCorsHeader({
      statusCode: 500,
      body: buildErrorMessage(ErrorMessage.DYNAMODB_ERROR()),
    });

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case6: NotFoundエラー発生", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // モックをセット
    const putTodoSpy = jest
      .spyOn(TodoUseCase.prototype, "putTodo")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          throw new NotFoundError(
            ErrorMessage.NOT_FOUND(
              `todoId: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`
            )
          );
        })
      );

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.body = JSON.stringify({ title: "todo title", content: "content" });

    const expected = buildResponseWithCorsHeader({
      statusCode: 404,
      body: buildErrorMessage(
        ErrorMessage.NOT_FOUND(`todoId: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`)
      ),
    });

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });
});
