import {
  APIGatewayEvent,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import {TodoUseCase} from "../domains/todoUseCase";
import {
  ErrorMessage,
} from "../domains/errorUseCase";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log('getTodoHandler 処理開始')
  console.log(`Input parameters: ${JSON.stringify(event)}`)

  // パラメータ受け取り
  const token = event.headers["Authorization"];
  const pathParameters = event.pathParameters;
  const todoId = pathParameters?.todoId;

  // 入力チェック
  if (!token) {
    console.log('Authorization トークンが未指定')
    return {
      statusCode: 400,
      body: ErrorMessage.PARAMETERS_NOT_FOUND(["Authorization Header"]),
    };
  }
  if (!todoId) {
    console.log('Authorization todoIdが未指定')
    return {
      statusCode: 400,
      body: ErrorMessage.PARAMETERS_NOT_FOUND(["todoId"]),
    };
  }

  // コアロジック呼び出し
  const todoUserCase = new TodoUseCase(token);
  try {
    console.log('特定のTodo取得ユースケース呼び出し')
    const todo = await todoUserCase.getSpecificTodo({ todoId: todoId });
    return { statusCode: 200, body: JSON.stringify(todo) };
  } catch (e) {
    console.log(`特定のTodo取得ユースケース呼び出しでエラー発生 エラー内容: ${JSON.stringify(e)}`)

    if (!e.statusCode) {
      return { statusCode: 500, body: ErrorMessage.UNEXPECTED_ERROR() };
    } else {
      // ユーザ定義エラーはstatusCodeとメッセージをthrow時にセットすること
      return { statusCode: e.statusCode, body: e.message };
    }
  }
};
