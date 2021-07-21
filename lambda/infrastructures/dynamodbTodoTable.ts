import * as AWS from "aws-sdk";
import {
  DynamodbError,
  ErrorMessage,
} from "../domains/errorUseCase";
import { Todo } from "../domains/todoUseCase";
import * as jose from "node-jose";

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
        console.log("Dynamodbからの get 処理で予期せぬエラー発生");
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
        console.log(`Response from dynamodb: ${JSON.stringify(response)}`);
      })
      .catch((e) => {
        console.log("Dynamodbへの put 処理で予期せぬエラー発生");
        console.log(JSON.stringify(e));
        throw new DynamodbError(ErrorMessage.DYNAMODB_ERROR());
      });
  };

  /**
   * DynamodbのTodoを1件削除する処理
   *
   * @static
   * @param {DeleteTodoInDynamodbProps} deleteTodoInDynamodbProps
   * @memberof DynamodbTodoTable
   */
  public static deleteTodo = (
    deleteTodoInDynamodbProps: DeleteTodoInDynamodbProps
  ) => {
    myPromisify((callback: any) =>
      DYNAMO.delete(
        {
          TableName: tableName,
          Key: deleteTodoInDynamodbProps,
        },
        callback
      )
    )
      .then((response: any) => {
        console.log(`Response from dynamodb: ${JSON.stringify(response)}`);
      })
      .catch((e) => {
        console.log("Dynamodbへの delete 処理で予期せぬエラー発生");
        console.log(JSON.stringify(e));
        throw new DynamodbError(ErrorMessage.DYNAMODB_ERROR());
      });
  };

  /*
   * DynamodbのTodoを指定件数分する処理
   *
   * @static
   * @param {ListTodoProps} listTodoProps
   * @memberof DynamodbTodoTable
   */
  public static listTodo = (listTodoProps: ListTodoInDynamodbProps) => {
    // 問い合わせの条件指定
    const queryProps: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: tableName,
      KeyConditionExpression: "userId = :userId",
    };

    // 前回開始位置の設定
    if (listTodoProps.nextToken) {
      try {
        // トークンが指定されている場合は、読み込み開始位置を指定する
        const token = listTodoProps.nextToken;
        const sections = token.split(".");
        const payload = jose.util.base64url.decode(sections[1]);
        const LastEvaluatedKey = JSON.parse(payload as unknown as string);
        queryProps.ExclusiveStartKey = LastEvaluatedKey;
      } catch (e) {
        console.log("トークンのデコードでエラーが発生");
        console.log(JSON.stringify(e));
        throw new DynamodbError(ErrorMessage.INVALID_TOKEN());
      }
    } else {
      queryProps.ExpressionAttributeValues = { userId: listTodoProps.userId };
    }

    // Limitが指定されている場合は条件に入れる
    if (listTodoProps.limit) {
      queryProps.Limit = listTodoProps.limit;
    }

    return myPromisify((callback: any) => DYNAMO.query(queryProps, callback))
      .then((response: any) => {
        console.log(
          `Query response from dynamodb: ${JSON.stringify(response)}`
        );

        const listTodoOutput: ListTodoInDynamodbOutput = {
          todos: response.Items,
        };

        // 次の読み込み開始位置が指定されているときは、トークン化してレスポンスに追加する
        if (response.LastEvaluatedKey) {
          console.log(`LastEvaluatedKeyが指定されてきたのでトークン化する`);
          listTodoOutput.nextToken = sign(response.LastEvaluatedKey, secret);
        }

        console.log(`listTodoの取得結果 ${JSON.stringify(listTodoOutput)}`);
        return listTodoOutput;
      })
      .catch((e) => {
        console.log("Dynamodbへの queryによる問い合わせ で予期せぬエラー発生");
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
