import { APIGatewayEvent, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { TodoUseCase } from "../domains/todoUseCase";
import { ErrorMessage, buildErrorMessage } from "../domains/errorUseCase";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("deleteTodoHandler 処理開始");
  console.log(`Input parameters: ${JSON.stringify(event)}`);

  // パラメータ受け取り
  const token = event.headers?.Authorization;
  const pathParameters = event.pathParameters;
  const todoId = pathParameters?.todoId;

  // 入力チェック
  if (!token) {
    console.warn("Authorization トークンが未指定");
    return {
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["Authorization Header"])
      ),
    };
  }
  if (!todoId) {
    console.warn("Authorization todoIdが未指定");
    return {
      statusCode: 400,
      body: buildErrorMessage(ErrorMessage.PARAMETERS_NOT_FOUND(["todoId"])),
    };
  }

  // コアロジック呼び出し
  try {
    const todoUserCase = new TodoUseCase(token);
    console.log("特定のTodo 削除 ユースケース呼び出し");
    await todoUserCase.deleteTodo({ todoId: todoId });
    return { statusCode: 200, body: undefined };
  } catch (e) {
    console.error(
      `特定のTodo 削除 ユースケース呼び出しでエラー発生 エラー内容: ${JSON.stringify(
        e
      )}`
    );

    if (!e.statusCode) {
      return {
        statusCode: 500,
        body: buildErrorMessage(ErrorMessage.UNEXPECTED_ERROR()),
      };
    } else {
      // ユーザ定義エラーはstatusCodeとメッセージをthrow時にセットすること
      return { statusCode: e.statusCode, body: buildErrorMessage(e.message) };
    }
  }
};
