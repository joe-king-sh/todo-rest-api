import { CognitoUserPool } from "../../lambda/infrastructures/cognito";
import {
  UnauthorizedError,
  ErrorMessage,
} from "../../lambda/domains/errorUseCase";
const AWS = require("aws-sdk");

// cognit.ts側で使用しているAWSパッケージ内の関数は全部jest.fn()にしておいて、モックの中身はケース毎に実装する
jest.mock("aws-sdk", () => {
  return {
    config: { update: jest.fn() },
    CognitoIdentityServiceProvider: jest
      .fn()
      .mockReturnValue({ adminInitiateAuth: jest.fn() }),
  };
});

// 上記でモックしたaws-sdkをインスタンス化
const mCognito = new AWS.CognitoIdentityServiceProvider({
  apiVersion: "2016-04-18",
});

process.env.USER_POOL_ID = "mock-user-pool-id";
process.env.CLIENT_ID = "mock-client-id";

const sign = require("jwt-encode");
const secret = "secret";

describe("Cognito関連サービスのテスト JWTのデコード", (): void => {
  test("Case1: トークンからユーザ名を取得可能", () => {
    // WHEN
    const data = {
      "cognito:username": "unittest-cognito-user",
      exp: 1516239999,
      iat: 1516239022,
    };
    const token = sign(data, secret);
    const expected = "unittest-cognito-user";

    // THEN
    const actual = CognitoUserPool.getUserNameFromIdToken(token);
    expect(actual).toBe(expected);
  });

  test("Case2: トークンの有効期限が切れている", () => {
    // WHEN
    const data = {
      "cognito:username": "unittest-cognito-user",
      exp: 1516230000,
      iat: 1516240000,
    };
    const token = sign(data, secret);
    const expectedErrorMessage = ErrorMessage.TOKEN_EXPIRED();
    // THEN
    expect(() => {
      CognitoUserPool.getUserNameFromIdToken(token);
    }).toThrowError(UnauthorizedError);
    expect(() => {
      CognitoUserPool.getUserNameFromIdToken(token);
    }).toThrowError(expectedErrorMessage);
  });

  test("Case3: トークンが不正", () => {
    // WHEN
    const token = "This.Is.Invalid";
    const expectedErrorMessage = ErrorMessage.INVALID_TOKEN();
    // THEN
    expect(() => {
      CognitoUserPool.getUserNameFromIdToken(token);
    }).toThrowError(UnauthorizedError);
    expect(() => {
      CognitoUserPool.getUserNameFromIdToken(token);
    }).toThrowError(expectedErrorMessage);
  });
});

describe("Cognito関連サービスのテスト IDトークンの発行", (): void => {
  test("Case1: トークンが正常に発行できる", async () => {
    expect.assertions(1);

    const mockAdminInitiateAuthOutput = {
      ChallengeParameters: {},
      AuthenticationResult: {
        AccessToken: "eyJraWQiOiI3eWZRR1wvZnVTQ1F4UHNGK090R1RPUnQxWUY5Tk...",
        ExpiresIn: 3600,
        TokenType: "Bearer",
        RefreshToken: "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiU...",
        IdToken: "eyJraWQiOiJ2bURHOWVpb1dHOHFZcGs1bEFFbTZmZjRNOGYya0R3Tk...",
      },
    };
    mCognito.adminInitiateAuth.mockReturnValue({
      promise: jest.fn(
        () =>
          new Promise((resolve, reject) => {
            resolve(mockAdminInitiateAuthOutput);
          })
      ),
    });

    // WHEN
    const createIdTokenFromCognitoProps = {
      userId: "my-unit-test-user",
      password: "password",
    };
    const expected = {
      idToken: "eyJraWQiOiJ2bURHOWVpb1dHOHFZcGs1bEFFbTZmZjRNOGYya0R3Tk...",
    };

    // THEN
    const actual = await CognitoUserPool.createIdTokenFromCognito(
      createIdTokenFromCognitoProps
    );
    expect(actual).toEqual(expected);
  });

  test("Case2: トークンが正常に発行できない(ユーザが見つからない)", async () => {
    expect.assertions(1);

    mCognito.adminInitiateAuth.mockReturnValue({
      promise: jest.fn(
        () =>
          new Promise((resolve, reject) => {
            throw new MockCognitoError("message", "UserNotFoundException");
          })
      ),
    });

    // WHEN
    const createIdTokenFromCognitoProps = {
      userId: "my-unit-test-user",
      password: "password",
    };

    // THEN
    expect(async () => {
      await CognitoUserPool.createIdTokenFromCognito(
        createIdTokenFromCognitoProps
      );
    }).rejects.toThrowError(
      new UnauthorizedError(ErrorMessage.NOT_FOUND("指定されたユーザ"))
    );
  });

  test("Case3: トークンが正常に発行できない(IDまたはパスワードが違う)", async () => {
    expect.assertions(1);

    mCognito.adminInitiateAuth.mockReturnValue({
      promise: jest.fn(
        () =>
          new Promise((resolve, reject) => {
            throw new MockCognitoError("message", "NotAuthorizedException");
          })
      ),
    });

    // WHEN
    const createIdTokenFromCognitoProps = {
      userId: "my-unit-test-user",
      password: "password",
    };
    const expected = {
      idToken: "eyJraWQiOiJ2bURHOWVpb1dHOHFZcGs1bEFFbTZmZjRNOGYya0R3Tk...",
    };

    // THEN
    expect(async () => {
      await CognitoUserPool.createIdTokenFromCognito(
        createIdTokenFromCognitoProps
      );
    }).rejects.toThrowError(
      new UnauthorizedError(ErrorMessage.INVALID_USERID_OR_PASSWORD())
    );
  });

  test("Case4: トークンが正常に発行できない(その他予期せぬエラー))", async () => {
    expect.assertions(1);

    mCognito.adminInitiateAuth.mockReturnValue({
      promise: jest.fn(
        () =>
          new Promise((resolve, reject) => {
            throw new Error(ErrorMessage.UNEXPECTED_ERROR());
          })
      ),
    });

    // WHEN
    const createIdTokenFromCognitoProps = {
      userId: "my-unit-test-user",
      password: "password",
    };
    const expected = {
      idToken: "eyJraWQiOiJ2bURHOWVpb1dHOHFZcGs1bEFFbTZmZjRNOGYya0R3Tk...",
    };

    // THEN
    expect(async () => {
      await CognitoUserPool.createIdTokenFromCognito(
        createIdTokenFromCognitoProps
      );
    }).rejects.toThrowError(new Error(ErrorMessage.UNEXPECTED_ERROR()));
  });
});

class MockCognitoError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "MockCognitoError";
    this.code = code;
  }
}
