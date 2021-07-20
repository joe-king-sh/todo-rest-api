import * as jose from "node-jose";
import { UnauthorizedError, ErrorMessage } from "../domains/errorUseCase";

export class CognitoUserPool {
  /**
   * CognitoのIdトークンからユーザ名を取得して返却する
   * @param {token} string
   * @return {userName}  {string}
   */
  public static getUserNameFromIdToken = (token: string): string => {
    let userName: string;
    let expireAt: number;
    let issuedAt: number;

    try {
      // JWTトークンをデコードする
      const sections = token.split(".");
      const payload = jose.util.base64url.decode(sections[1]);
      const payloadJson = JSON.parse(payload as unknown as string);
      expireAt = payloadJson["exp"];
      issuedAt = payloadJson["iat"];
      userName = payloadJson["cognito:username"];
    } catch (e) {
      console.log("トークンのデコードでエラーが発生");
      console.log(JSON.stringify(e.message));
      throw new UnauthorizedError(ErrorMessage.INVALID_TOKEN());
    }

    // 有効期限の検証
    if (expireAt < issuedAt) {
      console.log("トークンの有効期限が切れている");
      throw new UnauthorizedError(ErrorMessage.TOKEN_EXPIRED());
    }

    return userName;
  };
}
