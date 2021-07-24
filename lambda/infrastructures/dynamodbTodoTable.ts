import * as AWS from "aws-sdk";
import { DynamodbError, ErrorMessage } from "../domains/errorUseCase";
const { decycle } = require("json-cyclic");

const tableName = process.env.DYNAMODB_TABLE_NAME || "MOCK_DYNAMODB_TABLE";
const region = process.env.REGION || "";

AWS.config.update({
  region: region,
});
export const DYNAMO = new AWS.DynamoDB.DocumentClient();

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
  public static getTodoItem = async (
    getTodoFromDdbProps: GetTodoFromDdbProps
  ) => {
    try {
      const getResponse: any = await DYNAMO.get({
        TableName: tableName,
        Key: getTodoFromDdbProps.Key,
        ConsistentRead: getTodoFromDdbProps.ConsistentRead,
      }).promise();
      console.log(
        `Retrieved todo from dynamodb: ${JSON.stringify(decycle(getResponse))}`
      );
      return getResponse.Item;
    } catch (e) {
      console.error("Dynamodbからの get 処理で予期せぬエラー発生");
      console.error(e);
      throw new DynamodbError(ErrorMessage.DYNAMODB_ERROR());
    }
  };

  /**
   * DynamodbにTodoを1件Putする処理
   *
   * @static
   * @param {PutTodoInDynamodbProps} putTodoInDynamodbProps
   * @memberof DynamodbTodoTable
   */
  public static putTodoItem = async (
    putTodoInDynamodbProps: PutTodoInDynamodbProps
  ) => {
    try {
      await DYNAMO.put({
        TableName: tableName,
        Item: putTodoInDynamodbProps,
      }).promise();
      console.log(`Dynamodbへの put 処理完了`);
    } catch (e) {
      console.error("Dynamodbへの put 処理で予期せぬエラー発生");
      console.error(e);
      throw new DynamodbError(ErrorMessage.DYNAMODB_ERROR());
    }
  };

  /**
   * DynamodbのTodoを1件削除する処理
   *
   * @static
   * @param {DeleteTodoInDynamodbProps} deleteTodoInDynamodbProps
   * @memberof DynamodbTodoTable
   */
  public static deleteTodoItem = async (
    deleteTodoInDynamodbProps: DeleteTodoInDynamodbProps
  ) => {
    try {
      await DYNAMO.delete({
        TableName: tableName,
        Key: deleteTodoInDynamodbProps,
      }).promise();
      console.log(
        `Todo削除に成功 Key: ${JSON.stringify(deleteTodoInDynamodbProps)}`
      );
    } catch (e) {
      console.error("Dynamodbへの delete 処理で予期せぬエラー発生");
      console.error(e);
      throw new DynamodbError(ErrorMessage.DYNAMODB_ERROR());
    }
  };
}

/**
 * DynamodbからTodoをgetItemする時に必要なパラメータのインタフェース
 * @export
 * @interface GetTodoFromDdbProps
 */
export interface GetTodoFromDdbProps {
  Key: {
    userId: string;
    todoId: string;
  };
  ConsistentRead: boolean;
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
}

/**
 * Dynamodbから1件Todoを削除する際に使用するProps
 *
 * @export
 * @interface DeleteTodoInDynamodbProps
 */
export interface DeleteTodoInDynamodbProps {
  userId: string;
  todoId: string;
}

export const convertDynamodbObjectToJSON = (
  dynamodbRecord: AWS.DynamoDB.AttributeValue
) => {
  return AWS.DynamoDB.Converter.output(dynamodbRecord);
};
