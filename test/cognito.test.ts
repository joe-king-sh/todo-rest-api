import { CognitoUserPool } from "../lambda/infrastructures/cognito";
import {UnauthorizedError,ErrorMessage, NotFoundError} from "../lambda/domains/errorUseCase"

const sign = require('jwt-encode');
const secret = 'secret';


describe("Cognito 関連サービスのテスト", (): void => {
  test("Case1: トークンからユーザ名を取得可能", () => {
    // WHEN
    const data = {
      "cognito:username": 'unittest-cognito-user',
      exp: 1516239999,
      iat: 1516239022
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
      "cognito:username": 'unittest-cognito-user',
      exp: 1516230000,
      iat: 1516240000
    };
    const token = sign(data, secret);
    const expectedErrorMessage =　ErrorMessage.TOKEN_EXPIRED();
    // THEN
    expect(() => {CognitoUserPool.getUserNameFromIdToken(token)}).toThrowError(UnauthorizedError);
    expect(() => {CognitoUserPool.getUserNameFromIdToken(token)}).toThrowError(expectedErrorMessage);
  });

  test("Case3: トークンが不正", () => {
    // WHEN
    const token =
      "This.Is.Invalid";
    const expectedErrorMessage =　ErrorMessage.INVALID_TOKEN();
    // THEN
    expect(() => {CognitoUserPool.getUserNameFromIdToken(token)}).toThrowError(UnauthorizedError);
    expect(() => {CognitoUserPool.getUserNameFromIdToken(token)}).toThrowError(expectedErrorMessage);
  });
});
