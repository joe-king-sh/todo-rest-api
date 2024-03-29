import { handler } from "../../lambda/handlers/deleteTodosHandler";

import { APIGatewayEvent } from "aws-lambda";
import {
  ErrorMessage,
  NotFoundError,
  DynamodbError,
  buildErrorMessage,
} from "../../lambda/domains/errorUseCase";

import { TodoUseCase } from "../../lambda/domains/todoUseCase";
import { buildResponseWithCorsHeader } from "../../lambda/infrastructures/apiGateway";

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

describe("Todo削除処理のハンドラのテスト", (): void => {
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

  test("Case2: todoIdがパスパラメータに指定されていない", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    const expected = buildResponseWithCorsHeader({
      statusCode: 400,
      body: buildErrorMessage(ErrorMessage.PARAMETERS_NOT_FOUND(["todoId"])),
    });

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case3: 正常にTodo 削除 完了", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // モックをセット
    const deleteTodoSpy = jest
      .spyOn(TodoUseCase.prototype, "deleteTodo")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          resolve(undefined);
        })
      );

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.pathParameters = { todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" };
    const expected = buildResponseWithCorsHeader({
      statusCode: 200,
      body: undefined,
    });

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case4: 予期せぬエラー発生", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // モックをセット
    const deleteTodoSpy = jest
      .spyOn(TodoUseCase.prototype, "deleteTodo")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          throw Error(ErrorMessage.UNEXPECTED_ERROR());
        })
      );

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.pathParameters = { todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" };
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
    const deleteTodoSpy = jest
      .spyOn(TodoUseCase.prototype, "deleteTodo")
      .mockReturnValue(
        new Promise((resolve, reject) => {
          throw new DynamodbError(ErrorMessage.DYNAMODB_ERROR());
        })
      );

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.headers = { Authorization: "XXX" };
    event.pathParameters = { todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" };
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
    const deleteTodoSpy = jest
      .spyOn(TodoUseCase.prototype, "deleteTodo")
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
    event.pathParameters = { todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" };
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
