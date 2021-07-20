import * as jose from "node-jose";
import {
  UnauthorizedError,
  ErrorMessage,
} from "../domains/errorUseCase";

export class CognitoUserPool {
  /**
   * CognitoのIdトークンからユーザ名を取得して返却する
   * @param {token} string
   * @return {userName}  {string}
   */
  public static getUserNameFromIdToken = (token: string): string => {
    try {
      // JWTトークンをデコードする
      const sections = token.split(".");
      const payload = jose.util.base64url.decode(sections[1]);
      const payloadJson = JSON.parse(payload as unknown as string);
      const userName = payloadJson["cognito:username"];

      // 有効期限を取り出し
      const expireAt = payloadJson["exp"];
      const issuedAt = payloadJson["iat"];

      if (expireAt < issuedAt) {
        console.log('トークンの有効期限が切れている')
        throw new UnauthorizedError(ErrorMessage.TOKEN_EXPIRED())
      }

      return userName;
    } catch (e) {
      console.log('トークンのデコードでエラーが発生');
      console.dir(e);
      throw new UnauthorizedError(ErrorMessage.INVALID_TOKEN());
    }
  };
}
