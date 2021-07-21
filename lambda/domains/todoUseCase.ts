import { CognitoUserPool } from "../infrastructures/cognito";
import {
  DynamodbTodoTable,
  PutTodoInDynamodbProps,
} from "../infrastructures/dynamodbTodoTable";
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
      dueDate: "",
      isImportant: false,
    };

    if (!putTodoProps.todoId){
      // uuidでtodoIdを発番して新規登録する
      todo.todoId = uuidv4();
    }else{
      todo.todoId = putTodoProps.todoId
    }
    todo.userId = this.userId;

    if (putTodoProps.title) {
      todo.title = putTodoProps.title as string;
    }
    if (putTodoProps.content) {
      todo.content = putTodoProps.content as string;
    }
    if (putTodoProps.dueDate) {
      todo.dueDate = putTodoProps.dueDate as string;
    }
    if (putTodoProps.isImportant) {
      todo.isImportant = putTodoProps.isImportant as boolean;
    }

    // Dynamodbへ追加で登録
    await DynamodbTodoTable.putTodo(todo);

    return todo;
  }

  /**
   * 指定したIdのTodo情報を返却する
   *
   * @param {SpecifyTodoProps} specifyTodoProps
   * @return {todo}  {Promise<Todo>}
   * @memberof TodoUseCase
   */
  public async getSpecificTodo(specifyTodoProps: SpecifyTodoProps): Promise<Todo> {
    console.log(
      `指定したIdのTodo取得処理 開始 props: ${JSON.stringify(specifyTodoProps)}`
    );
    const todoId = specifyTodoProps.todoId;
    const ddbReponse = await DynamodbTodoTable.getTodo({
      userId: this.userId,
      todoId: todoId,
    });

    console.log(`Dynamodbからのレスポンス: ${JSON.stringify(ddbReponse)}`);

    if (!ddbReponse) {
      console.log("Todoの取得結果が0件なのでthrowする");
      throw new NotFoundError(ErrorMessage.NOT_FOUND(`todoId: ${todoId}`));
    }
    let todo = {
      userId: "",
      todoId: "",
      title: "",
      content: "",
      dueDate: "",
      isImportant: false,
    };

    if (ddbReponse.userId) {
      todo.userId = ddbReponse.userId as string;
    }
    if (ddbReponse.todoId) {
      todo.todoId = ddbReponse.todoId as string;
    }
    if (ddbReponse.title) {
      todo.title = ddbReponse.title as string;
    }
    if (ddbReponse.content) {
      todo.content = ddbReponse.content as string;
    }
    if (ddbReponse.dueDate) {
      todo.dueDate = ddbReponse.dueDate as string;
    }
    if (ddbReponse.dueDate) {
      todo.isImportant = ddbReponse.isImportant as boolean;
    }

    console.log(
      `指定したIdのTodo取得処理 終了 Retreved todo : ${JSON.stringify(todo)}`
    );

    return todo;
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
    await DynamodbTodoTable.deleteTodo({
      userId: this.userId,
      todoId: todoId,
    });

    return;

  }
  // public async getAllTodo() {

  // }

  // public async findTodo() {

  // }

}

export interface Todo {
  userId: string;
  todoId: string;
  title: string;
  content: string;
  dueDate: string;
  isImportant: boolean;
}

export interface PutTodoProps {
  todoId? : string;
  title: string;
  content: string;
  dueDate?: string;
  isImportant?: boolean;
}

export interface SpecifyTodoProps {
  todoId: string;
}
