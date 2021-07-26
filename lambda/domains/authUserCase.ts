import { CognitoUserPool } from "../infrastructures/cognito";

/**
 * 認証関連の処理をまとめたクラス
 * @export
 * @class AuthUseCase
 */
export class AuthUseCase {
  /**
   * IDとパスワードをもとに、APIにアクセスするためのトークンを作成し返却する処理
   *
   * @static
   * @param {createIdTokenProps} createIdTokenProps
   * @return {*}  {Promise<createIdTokenOutput>}
   * @memberof AuthUseCase
   */
  public static async createIdToken(
    createIdTokenProps: createIdTokenProps
  ): Promise<createIdTokenOutput> {
    const idToken =
      CognitoUserPool.createIdTokenFromCognito(createIdTokenProps);

    return idToken;
  }
}

interface createIdTokenProps {
  userId: string;
  password: string;
}

interface createIdTokenOutput {
  idToken: string;
}
