import { AuthUseCase } from "../../lambda/domains/authUserCase";
import { CognitoUserPool } from "../../lambda/infrastructures/cognito";

// 認証関連は全てモック化しておく
jest.mock("../../lambda/infrastructures/cognito");

describe("IDトークン発行のユースケースのテスト", (): void => {
  test("Case1: 正常にトークン発行成功", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // Mockをセット
    const mockCreteToken = jest.fn();
    mockCreteToken.mockReturnValue({
      idToken: "my-id-token",
    });
    CognitoUserPool.createIdTokenFromCognito =
      mockCreteToken.bind(CognitoUserPool);

    // WHEN
    const createIdTokenProps = {
      userId: "my-unit-user-id",
      password: "password",
    };
    const expected = { idToken: "my-id-token" };

    // THEN
    await expect(
      AuthUseCase.createIdToken(createIdTokenProps)
    ).resolves.toEqual(expected);
  });

  // test("Case2: Requestボディが指定されているがJsonが不正", async () => {
  //   expect.assertions(1);
  //   jest.resetAllMocks();

  //   // WHEN
  //   const event: APIGatewayEvent = { ...baseApiGatewayEvent };
  //   event.body = "invalid_json";
  //   const expected = {
  //     statusCode: 400,
  //     body: buildErrorMessage(ErrorMessage.INVALID_PARAMETER()),
  //   };

  //   // THEN
  //   await expect(handler(event)).resolves.toEqual(expected);
  // });

  // test("Case3: Requestボディが指定されているがuserIdが空", async () => {
  //   expect.assertions(1);
  //   jest.resetAllMocks();

  //   // WHEN
  //   const event: APIGatewayEvent = { ...baseApiGatewayEvent };
  //   event.body = JSON.stringify({
  //     password: "my-password",
  //   });
  //   const expected = {
  //     statusCode: 400,
  //     body: buildErrorMessage(
  //       ErrorMessage.PARAMETERS_NOT_FOUND(["userId", "password"])
  //     ),
  //   };

  //   // THEN
  //   await expect(handler(event)).resolves.toEqual(expected);
  // });

  // test("Case4: Requestボディが指定されているがpasswordが空", async () => {
  //   expect.assertions(1);
  //   jest.resetAllMocks();

  //   // WHEN
  //   const event: APIGatewayEvent = { ...baseApiGatewayEvent };
  //   event.body = JSON.stringify({ userId: "my-unit-test-user" });
  //   const expected = {
  //     statusCode: 400,
  //     body: buildErrorMessage(
  //       ErrorMessage.PARAMETERS_NOT_FOUND(["userId", "password"])
  //     ),
  //   };

  //   // THEN
  //   await expect(handler(event)).resolves.toEqual(expected);
  // });

  // test("Case5: 正常にトークン発行完了", async () => {
  //   expect.assertions(1);

  //   // Mockをセット
  //   const mockCreteToken = jest.fn();
  //   mockCreteToken.mockReturnValue({
  //     idToken: "my-access-token",
  //   });
  //   AuthUseCase.createIdToken = mockCreteToken.bind(AuthUseCase);

  //   // WHEN
  //   const event: APIGatewayEvent = { ...baseApiGatewayEvent };
  //   event.body = JSON.stringify({
  //     userId: "my-unit-test-user",
  //     password: "password",
  //   });
  //   const expected = {
  //     statusCode: 200,
  //     body: JSON.stringify({
  //       idToken: "my-access-token",
  //     }),
  //   };

  //   // THEN
  //   await expect(handler(event)).resolves.toEqual(expected);
  // });
});
