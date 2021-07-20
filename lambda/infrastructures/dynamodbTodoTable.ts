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
          "Dynamodb呼び出し処理で予期せぬエラー発生"
        );
        console.log(JSON.stringify(e));
        throw new DynamodbError(ErrorMessage.DYNAMODB_ERROR());
      });

  /**
   * DynamodbにTodoを1件Putする処理
   *
   * @static
   * @param {PutTodoInDynamodbProps} putTodoInDynamodbProps
   * @memberof DynamodbTodoTable
   */
  public static putTodo = (putTodoInDynamodbProps: PutTodoInDynamodbProps) => {
    myPromisify((callback: any) =>
      DYNAMO.put(
        {
          TableName: tableName,
          Item: putTodoInDynamodbProps,
        },
        callback
      )
    )
      .then((response: any) => {
        console.log(
          `Response from dynamodb: ${JSON.stringify(response)}`
        );
      })
      .catch((e) => {
        console.log(
          "Dynamodbへの登録処理で予期せぬエラー発生"
        );
        console.log(JSON.stringify(e));
        throw new DynamodbError(ErrorMessage.DYNAMODB_ERROR());
      });
  };
}

/**
 * DynamodbからTodoをgetItemする時に必要なパラメータのインタフェース
 * @export
 * @interface GetTodoFromDdbProps
 */
export interface GetTodoFromDdbProps {
  userId: string;
  todoId: string;
}

/**
 * DynamodbにTodoをputItemする時に必要なItemパラメータのインタフェース
 * 　TodoUseCase.Todoと完全一致しているが、疎結合のため別で定義
 *
 * @export
 * @interface PutTodoInDynamodbProps
 */
export interface PutTodoInDynamodbProps {
  userId: string;
  todoId: string;
  title: string;
  content: string;
  dueDate?: string;
  isImportant?: boolean;
}
