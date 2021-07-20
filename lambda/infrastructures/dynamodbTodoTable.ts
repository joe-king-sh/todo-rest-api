import * as AWS from "aws-sdk";
import {
  DynamodbError,
  NotFoundError,
  ErrorMessage,
} from "../domains/errorUseCase";

const tableName = process.env.DYNAMODB_TABLE_NAME || "MOCK_DYNAMODB_TABLE";
const region = process.env.REGION || "";

AWS.config.update({
  region: region,
});
export const DYNAMO = new AWS.DynamoDB.DocumentClient();

const myPromisify = (func: any) =>
  new Promise((resolve, reject) => {
    func((error: any, result: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });

/**
 * Todo情報を管理するDynamodbテーブル
 *
 * @export
 * @class DynamodbTodoTable
 */
export class DynamodbTodoTable {
  /**
   * DynamodbからTodoを1件取得する処理
   *
   * @static
   * @param {GetTodoFromDdbProps} getTodoFromDdbProps
   * @return {*}  {Promise<any>}
   * @memberof DynamodbTodoTable
   */
  public static getTodo = (getTodoFromDdbProps: GetTodoFromDdbProps) =>
    myPromisify((callback: any) =>
      DYNAMO.get(
        {
          TableName: tableName,
          Key: getTodoFromDdbProps,
        },
        callback
      )
    )
      .then((response: any) => {
        console.log(
          `Retrieved todo from dynamodb: ${JSON.stringify(response)}`
        );
        return response.Item;
      })
      .catch((e) => {
        console.log(
          "Dynamodb呼び出し処理で予期せぬエラー発生。そのままThrowする"
        );
        console.log(JSON.stringify(e));
        throw new DynamodbError(ErrorMessage.DYNAMODB_ERROR());
      });
  //   .finally(() => {
  //   });
}

/**
 * DynamodbからTodoをgetItemする時に必要なパラメータ
 * @export
 * @interface GetTodoFromDdbProps
 */
export interface GetTodoFromDdbProps {
  userId: string;
  todoId: string;
}
