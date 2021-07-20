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

  public async createTodo(createTodoProps: CreateTodoProps): Promise<Todo> {
    console.log(
      `Todo 登録処理 開始 props:  ${JSON.stringify(createTodoProps)}`
    );

    let todo = {
      userId: "",
      todoId: "",
      title: "",
      content: "",
      dueDate: "",
      isImportant: false,
    };

    todo.userId = this.userId;
    todo.todoId = uuidv4();

    if (createTodoProps.title) {
      todo.title = createTodoProps.title as string;
    }
    if (createTodoProps.content) {
      todo.content = createTodoProps.content as string;
    }
    if (createTodoProps.dueDate) {
      todo.dueDate = createTodoProps.dueDate as string;
    }
    if (createTodoProps.dueDate) {
      todo.isImportant = createTodoProps.isImportant as boolean;
    }

    // Dynamodbへ追加で登録
    await DynamodbTodoTable.putTodo(todo);

    return todo;
  }

  /**
   * 指定したIdのTodo情報を返却する
   *
   * @param {SpecifyTodoProps} specifyProps
   * @return {todo}  {Promise<Todo>}
   * @memberof TodoUseCase
   */
  public async getSpecificTodo(specifyProps: SpecifyTodoProps): Promise<Todo> {
    console.log(
      `指定したIdのTodo取得処理 開始 props: ${JSON.stringify(specifyProps)}`
    );
    const todoId = specifyProps.todoId;
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

  // public async getAllTodo() {

  // }

  // public async findTodo() {

  // }

  // public async updateTodo(updateTodoProps: UpdateTodoProps) {

  // }

  // public async deleteTodo(specifyTodoProps:SpecifyTodoProps) {

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

export interface CreateTodoProps {
  title: string;
  content: string;
  dueDate?: string;
  isImportant?: boolean;
}

// export interface UpdateTodoProps {
//     todoId: string;
//     title?: string;
//     content?: string;
//     dueDate?: Date;
//     isImportant?: boolean;
// }

export interface SpecifyTodoProps {
  todoId: string;
}