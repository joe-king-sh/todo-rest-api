import { CognitoUserPool } from "../infrastructures/cognito";
import {
  DynamodbTodoTable,
  ListTodoInDynamodbOutput,
} from "../infrastructures/dynamodbTodoTable";

import { ElasticSearchTodoDomain } from "../infrastructures/elasticSearchTodoDomain";

import { NotFoundError, ErrorMessage } from "../domains/errorUseCase";
import { v4 as uuidv4 } from "uuid";

/**
 * 特定のユーザのTodoについてユースケースを管理するクラス
 *
 * @export
 * @class TodoUseCase
 */
export class TodoUseCase {
  userId: string;

  /**
   * TodoUseCaseのインスタンスを作成する
   * @param {string} token
   * @memberof TodoUseCase
   */
  constructor(token: string) {
    this.userId = CognitoUserPool.getUserNameFromIdToken(token);
  }

  public async putTodo(putTodoProps: PutTodoProps): Promise<Todo> {
    console.log(
      `Todo 登録更新処理 開始 props:  ${JSON.stringify(putTodoProps)}`
    );

    let todo = {
      userId: "",
      todoId: "",
      title: "",
      content: "",
      updatedDate: new Date().toUTCString(),
    };

    if (!putTodoProps.todoId) {
      // 現在時刻とuuidでtodoIdを発番して新規登録する
      todo.todoId = issueTodoId();
      console.log(`新規発番 todoId: ${todo.todoId}`);
    } else {
      todo.todoId = putTodoProps.todoId;
      console.log(`更新 todoId: ${todo.todoId}`);
    }

    todo.userId = this.userId;
    todo.title = putTodoProps?.title;
    todo.content = putTodoProps?.content;

    // Dynamodbへ登録 or 更新
    await DynamodbTodoTable.putTodoItem(todo);

    return todo;
  }

  /**
   * 指定したIdのTodo情報を返却する
   *
   * @param {SpecifyTodoProps} specifyTodoProps
   * @return {todo}  {Promise<Todo>}
   * @memberof TodoUseCase
   */
  public async getSpecificTodo(
    specifyTodoProps: SpecifyTodoProps
  ): Promise<Todo> {
    console.log(
      `指定したIdのTodo取得処理 開始 props: ${JSON.stringify(specifyTodoProps)}`
    );
    const todoId = specifyTodoProps.todoId;
    const ddbReponse = await DynamodbTodoTable.getTodoItem({
      Key: { userId: this.userId, todoId: todoId },
      ConsistentRead: false,
    });

    console.log(`Dynamodbからのレスポンス: ${JSON.stringify(ddbReponse)}`);

    if (!ddbReponse) {
      console.log("Todoの取得結果が0件なのでthrowする");
      throw new NotFoundError(ErrorMessage.NOT_FOUND(`todoId: ${todoId}`));
    }
    let resultTodo = {
      userId: "",
      todoId: "",
      title: "",
      content: "",
      updatedDate: "",
    };
    resultTodo.userId = ddbReponse?.userId;
    resultTodo.todoId = ddbReponse?.todoId;
    resultTodo.title = ddbReponse?.title;
    resultTodo.content = ddbReponse?.content;
    resultTodo.updatedDate = ddbReponse?.updatedDate;

    console.log(
      `指定したIdのTodo取得処理 終了 Retreved todo : ${JSON.stringify(
        resultTodo
      )}`
    );

    return resultTodo;
  }

  /**
   * 指定したtodoIdのTodoを削除する
   *
   * @param {SpecifyTodoProps} specifyTodoProps
   * @return {*}  {Promise<void>}
   * @memberof TodoUseCase
   */
  public async deleteTodo(specifyTodoProps: SpecifyTodoProps): Promise<void> {
    console.log(
      `Todo 削除処理 開始 props:  ${JSON.stringify(specifyTodoProps)}`
    );

    const todoId = specifyTodoProps.todoId;

    // 削除対象存在チェック
    const getTodoResponse = await DynamodbTodoTable.getTodoItem({
      Key: { userId: this.userId, todoId: todoId },
      ConsistentRead: false,
    });
    console.log(`Dynamodbからのレスポンス: ${JSON.stringify(getTodoResponse)}`);
    if (!getTodoResponse) {
      console.log("削除対象のTodoが見つからないのでthrowする");
      throw new NotFoundError(ErrorMessage.NOT_FOUND(`todoId: ${todoId}`));
    }

    // Dynamodbから削除
    await DynamodbTodoTable.deleteTodoItem({
      userId: this.userId,
      todoId: todoId,
    });

    return;
  }

  /**
   * 指定した件数のTodoを一括で取得する
   *
   * @param {listTodosProps} listTodosProps
   * @return {*}  {Promise<ListTodoOutput>}
   * @memberof TodoUseCase
   */
  public async listTodos(
    listTodosProps: listTodosProps
  ): Promise<ListTodoInDynamodbOutput> {
    console.log(
      `指定した件数のTodo一括取得処理 開始 props: ${JSON.stringify(
        listTodosProps
      )}`
    );

    const todos = await DynamodbTodoTable.listTodoItems({
      userId: this.userId,
      ...listTodosProps,
    });

    console.log(`Dynamodbからのレスポンス: ${JSON.stringify(todos)}`);

    console.log(
      `指定した件数のTodo一括取得処理 終了 Retreved todos : ${JSON.stringify(
        todos
      )}`
    );

    return todos;
  }

  /**
   * 指定したワード、件数上限で、Todoの検索処理を実行する
   *
   * @param {FindTodosProps} findTodosProps
   * @return {*}
   * @memberof TodoUseCase
   */
  public async findTodos(findTodosProps: FindTodosProps) {
    const elasticSearchTodoDomain = new ElasticSearchTodoDomain(
      findTodosProps.node
    );

    // Elasticsearchに対して検索実行
    const response = await elasticSearchTodoDomain.searchByUserIdAndByQuery({
      userId: this.userId,
      q: findTodosProps.q,
      size: findTodosProps.size,
      from: findTodosProps.nextStartKey,
    });
    const hits = response.body.hits.hits;
    const totalCount = response.body.hits.total.value;

    // 返却値を設定
    const findTodoOutput: FindTodosOutput = {
      todos: [],
      totalCount: totalCount,
    };
    // 返却値に取得したTodoをセット
    for (const hit of hits) {
      findTodoOutput.todos.push(hit._source);
    }

    // sizeが指定されているときだけ、次ページの開始位置を返す処理が必要
    if (findTodosProps.size) {
      const readStartPoint =
        findTodosProps?.nextStartKey == undefined
          ? 0
          : findTodosProps.nextStartKey;
      //今回読み込み完了位置
      const readEndPoint = +findTodosProps.size + readStartPoint;
      //今回読み込み完了した位置が、Todoのトータル件数を上回っていなければ、次回読み込み開始位置を設定する
      if (readEndPoint < totalCount) {
        findTodoOutput["nextStartKey"] = readEndPoint;
      }
    }

    return findTodoOutput;
  }
}

export interface Todo {
  userId: string;
  todoId: string;
  title: string;
  content: string;
  updatedDate: string;
}

export interface PutTodoProps {
  todoId?: string;
  title: string;
  content: string;
}

export interface SpecifyTodoProps {
  todoId: string;
}

export interface listTodosProps {
  limit?: number;
  nextToken?: string;
}

const issueTodoId = (): string => {
  const now = new Date();
  const newTodoId =
    now.getFullYear().toString().padStart(4, "0") +
    (now.getMonth() + 1).toString().padStart(2, "0") + // 0 ~ 11 を返すので1足す
    now.getDate().toString().padStart(2, "0") +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0") +
    "-" +
    uuidv4();

  return newTodoId;
};

export interface FindTodosProps {
  q?: string;
  node: string;
  size?: number;
  nextStartKey?: number;
}
export interface FindTodosOutput {
  todos: Todo[];
  nextStartKey?: number;
  totalCount: number;
}
