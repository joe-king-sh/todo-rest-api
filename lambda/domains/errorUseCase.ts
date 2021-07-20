/**
 *  Exceptionの基底クラス
 * @class BaseError
 * @extends {Error}
 */
class BaseError extends Error {
  constructor(e?: string) {
    super(e);
    this.name = new.target.name;
  }
}

/**
 * Dynamodbでエラー発生時にthrowするException
 *
 * @export
 * @class DynamodbError
 * @extends {BaseError}
 */
export class DynamodbError extends BaseError {
    public statusCode = 404;
}

/**
 * 何か見つからないエラー発生時にthrowするException
 *
 * @export
 * @class NotFoundError
 * @extends {BaseError}
 */
export class NotFoundError extends BaseError {
  public statusCode = 404;
}

/**
 * 認証エラー発生時にthrowするException
 *
 * @export
 * @class NotFoundError
 * @extends {BaseError}
 */
export class UnauthorizedError extends BaseError {
  public statusCode = 401;
}
/**
 * 認可エラー発生時にthrowするException
 *
 * @export
 * @class AuthorizationError
 * @extends {BaseError}
 */
// export class AuthorizationError extends BaseError {
//   public statusCode = 403;
// }

/**
 * 認可エラー発生時にthrowするException
 *
 * @export
 * @class ErrorMessage
 */
export class ErrorMessage {
  static NOT_FOUND_ERROR = (target: string) => {
    return `${target} は見つかりませんでした`;
  };

  static DYNAMODB_ERROR = () => {
    return `Dynamodbアクセス中にエラーが発生しました`;
  };

  static UNEXPECTED_ERROR = () => {
    return `予期せぬエラーが発生しました`;
  };

  static PARAMETERS_NOT_FOUND = (params: [string]) => {
    return `パラメータ ${{params}} を指定する必要があります`;
  };

  static INVALID_TOKEN = () => {
    return `指定された認証トークンが不正です`;
  };
  static TOKEN_EXPIRED = () => {
    return `指定された認証トークンの有効期限が切れています`;
  };
}
