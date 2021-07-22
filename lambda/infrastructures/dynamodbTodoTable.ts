import * as AWS from "aws-sdk";
import { DynamodbError, ErrorMessage } from "../domains/errorUseCase";
import { Todo } from "../domains/todoUseCase";
import * as jose from "node-jose";
import { v4 as uuidv4 } from "uuid";

const sign = require("jwt-encode");
const secret = "This is not so secret.";

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
  public static getTodoItem = async (
    getTodoFromDdbProps: GetTodoFromDdbProps
  ) => {
    try {
      const getResponse: any = await DYNAMO.get({
        TableName: tableName,
        Key: getTodoFromDdbProps.Key,
        ConsistentRead: getTodoFromDdbProps.ConsistentRead,
      });
      console.log(
        `Retrieved todo from dynamodb: ${JSON.stringify(getResponse)}`
      );
      return getResponse.Item;
    } catch (e) {
      console.log("Dynamodbからの get 処理で予期せぬエラー発生");
      console.log(e);
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
      });
      console.log(`Dynamodbへの put 処理完了`);
    } catch (e) {
      console.log("Dynamodbへの put 処理で予期せぬエラー発生");
      console.log(e);
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
      });
      console.log(
        `Todo削除に成功 Key: ${JSON.stringify(deleteTodoInDynamodbProps)}`
      );
    } catch (e) {
      console.log("Dynamodbへの delete 処理で予期せぬエラー発生");
      console.log(e);
      throw new DynamodbError(ErrorMessage.DYNAMODB_ERROR());
    }
  };

  /*
   * DynamodbのTodoを指定件数分する処理
   *
   * @static
   * @param {ListTodoProps} listTodoProps
   * @memberof DynamodbTodoTable
   */
  public static listTodoItems = async (
    listTodoProps: ListTodoInDynamodbProps
  ) => {
    // 問い合わせの条件指定
    const queryProps: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: tableName,
      KeyConditionExpression: "userId = :userId and todoId > :todoId",
      ExpressionAttributeValues: {
        ":userId": listTodoProps.userId,
        // 投げたい問い合わせは、パーティションキーが一致の検索だけだが、ExclusiveStartKeyが使いたいので、ソートキーを指定する必要がある
        // 日付+uuidで持つソートキーなので、一番初めから検索をかけるソートキーで固定にする
        ":todoId": "19700101000000" + uuidv4(),
      },
    };

    // トークンが指定されている場合は、読み込み開始位置を指定する
    if (listTodoProps.nextToken) {
      try {
        const token = listTodoProps.nextToken;
        const sections = token.split(".");
        const payload = jose.util.base64url.decode(sections[1]);
        const LastEvaluatedKey = JSON.parse(payload as unknown as string);
        const userId = LastEvaluatedKey.userId;

        if (listTodoProps.userId !== userId) {
          console.log(
            `API実行ユーザ:${listTodoProps.userId} トークン内のユーザ:${userId}`
          );
          throw new Error(
            "ユーザIDと指定されたnextTokenの中のUserIdが違うのでthrowする"
          );
        }

        // 読み込み開始位置を設定
        queryProps.ExclusiveStartKey = LastEvaluatedKey;
      } catch (e) {
        console.log("トークンのデコードでエラーが発生");
        console.log(e);
        throw new DynamodbError(ErrorMessage.INVALID_TOKEN());
      }
    }

    // Limitが指定されている場合は条件に入れる
    if (listTodoProps.limit) {
      queryProps.Limit = listTodoProps.limit;
    }

    console.log(`query に渡す props: ${JSON.stringify(queryProps)}`);
    try {
      const response: any = await DYNAMO.query(queryProps);
      console.log(`Query response from dynamodb: ${JSON.stringify(response)}`);

      const listTodoOutput: ListTodoInDynamodbOutput = {
        todos: response.Items,
      };

      // 次の読み込み開始位置が返却されているときは、トークン化してレスポンスに追加する
      if (response.LastEvaluatedKey) {
        console.log(`LastEvaluatedKeyが返却されてきたのでトークン化する`);
        listTodoOutput.nextToken = sign(response.LastEvaluatedKey, secret);
      }
      return listTodoOutput;
    } catch (e) {
      console.log("Dynamodbへの queryによる問い合わせ で予期せぬエラー発生");
      console.log(e);
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

/**
 * Dynamodbから指定した件数Todoを取得する際に使用するProps
 *
 * @export
 * @interface ListTodoInDynamodbProps
 */
export interface ListTodoInDynamodbProps {
  userId: string;
  limit?: number;
  nextToken?: string;
}

/**
 * Dynamodbから指定した件数Todoを取得する際に使用するProps
 *
 * @export
 * @interface ListTodoInDynamodbOutput
 */
export interface ListTodoInDynamodbOutput {
  todos: Todo[];
  nextToken?: string;
}
