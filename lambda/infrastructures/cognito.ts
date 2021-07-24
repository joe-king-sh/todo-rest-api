import * as jose from "node-jose";
import {
  UnauthorizedError,
  ErrorMessage,
  NotFoundError,
} from "../domains/errorUseCase";

const AWS = require("aws-sdk");

AWS.config.update({
  region: "ap-northeast-1",
});
const cognito = new AWS.CognitoIdentityServiceProvider({
  apiVersion: "2016-04-18",
});
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
      console.error("トークンのデコードでエラーが発生");
      console.error(e);
      throw new UnauthorizedError(ErrorMessage.INVALID_TOKEN());
    }

    // 有効期限の検証
    if (expireAt < issuedAt) {
      console.info("トークンの有効期限が切れている");
      throw new UnauthorizedError(ErrorMessage.TOKEN_EXPIRED());
    }

    return userName;
  };

  public static createIdTokenFromCognito = async (
    createIdTokenFromCognito: createIdTokenFromCognito
  ): Promise<createIdTokenFromCognitoOutput> => {
    const userPoolId = process.env.USER_POOL_ID;
    const clientId = process.env.CLIENT_ID;
    console.log("ユーザプールID:", userPoolId);
    console.log("クライアントID:", clientId);

    try {
      console.log("Cognito サインイン開始");
      // サインイン
      const user = await cognito
        .adminInitiateAuth({
          UserPoolId: userPoolId,
          ClientId: clientId,
          AuthFlow: "ADMIN_NO_SRP_AUTH",
          AuthParameters: {
            USERNAME: createIdTokenFromCognito.userId,
            PASSWORD: createIdTokenFromCognito.password,
          },
        })
        .promise();
      console.log("Cognito サインイン完了", JSON.stringify(user, null, 4));

      const createIdTokenFromCognitoOutput = {
        idToken: user.AuthenticationResult.IdToken,
      };

      return createIdTokenFromCognitoOutput;
    } catch (e) {
      console.error(e);
      if (e.code == "UserNotFoundException") {
        // ユーザーが存在しない場合
        throw new UnauthorizedError(ErrorMessage.NOT_FOUND("指定されたユーザ"));
      } else if (e.code == "NotAuthorizedException") {
        // パスワードが間違ってる場合
        throw new UnauthorizedError(ErrorMessage.INVALID_USERID_OR_PASSWORD());
      } else {
        // その他のエラー
        throw new Error(ErrorMessage.UNEXPECTED_ERROR());
      }
    }
  };
}

interface createIdTokenFromCognito {
  userId: string;
  password: string;
}

interface createIdTokenFromCognitoOutput {
  idToken: string;
}
