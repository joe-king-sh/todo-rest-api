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
});
