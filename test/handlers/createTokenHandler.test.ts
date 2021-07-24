import { handler } from "../../lambda/handlers/createIdTokenHandler";
import { AuthUseCase } from "../../lambda/domains/authUserCase";

import { APIGatewayEvent } from "aws-lambda";
import {
  ErrorMessage,
  NotFoundError,
  buildErrorMessage,
  UnauthorizedError,
} from "../../lambda/domains/errorUseCase";

// 認証関連は全てモック化しておく
jest.mock("../../lambda/domains/authUserCase");

// Lambdaに渡ってくるイベント変数のベース
const baseApiGatewayEvent: APIGatewayEvent = {
  body: "",
  headers: {},
  multiValueHeaders: {},
  httpMethod: "POST",
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

describe("IDトークン発行のハンドラのテスト", (): void => {
  test("Case1: Requestボディがリクエストパラメータに指定されていない", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    const expected = {
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["Request Body"])
      ),
    };

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case2: Requestボディが指定されているがJsonが不正", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.body = "invalid_json";
    const expected = {
      statusCode: 400,
      body: buildErrorMessage(ErrorMessage.INVALID_PARAMETER()),
    };

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case3: Requestボディが指定されているがuserIdが空", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.body = JSON.stringify({
      password: "my-password",
    });
    const expected = {
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["userId", "password"])
      ),
    };

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case4: Requestボディが指定されているがpasswordが空", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.body = JSON.stringify({ userId: "my-unit-test-user" });
    const expected = {
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["userId", "password"])
      ),
    };

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case5: 正常にトークン発行完了", async () => {
    expect.assertions(1);

    // Mockをセット
    const mockCreteToken = jest.fn();
    mockCreteToken.mockReturnValue({
      idToken: "my-access-token",
    });
    AuthUseCase.createIdToken = mockCreteToken.bind(AuthUseCase);

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.body = JSON.stringify({
      userId: "my-unit-test-user",
      password: "password",
    });
    const expected = {
      statusCode: 200,
      body: JSON.stringify({
        idToken: "my-access-token",
      }),
    };

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case6: 予期せぬエラー発生", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // Mockをセット
    const mockCreteToken = jest.fn();
    mockCreteToken.mockRejectedValue(() => {
      throw Error(ErrorMessage.UNEXPECTED_ERROR());
    });
    AuthUseCase.createIdToken = mockCreteToken.bind(AuthUseCase);

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.body = JSON.stringify({
      userId: "my-unit-test-user",
      password: "password",
    });
    const expected = {
      statusCode: 500,
      body: buildErrorMessage(ErrorMessage.UNEXPECTED_ERROR()),
    };

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });

  test("Case7: NotFoundエラー発生", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // Mockをセット
    const mockCreteToken = jest.fn();
    mockCreteToken.mockRejectedValue(
      new UnauthorizedError(ErrorMessage.NOT_FOUND("指定されたユーザ"))
    );
    AuthUseCase.createIdToken = mockCreteToken.bind(AuthUseCase);

    // WHEN
    const event: APIGatewayEvent = { ...baseApiGatewayEvent };
    event.body = JSON.stringify({
      userId: "my-unit-test-user",
      password: "password",
    });
    const expected = {
      statusCode: 401,
      body: buildErrorMessage(ErrorMessage.NOT_FOUND("指定されたユーザ")),
    };

    // THEN
    await expect(handler(event)).resolves.toEqual(expected);
  });
});
