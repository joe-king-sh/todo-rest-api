import { APIGatewayEvent, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { TodoUseCase } from "../domains/todoUseCase";
import { ErrorMessage, buildErrorMessage } from "../domains/errorUseCase";
import { buildResponseWithCorsHeader } from "../infrastructures/apiGateway";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("getTodoHandler 処理開始");
  console.log(`Input parameters: ${JSON.stringify(event)}`);

  // パラメータ受け取り
  const token = event.headers?.Authorization;
  const pathParameters = event.pathParameters;
  const todoId = pathParameters?.todoId;

  // 入力チェック
  if (!token) {
    console.warn("Authorization トークンが未指定");
    return buildResponseWithCorsHeader({
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["Authorization Header"])
      ),
    });
  }
  if (!todoId) {
    console.warn("Authorization todoIdが未指定");
    return buildResponseWithCorsHeader({
      statusCode: 400,
      body: buildErrorMessage(ErrorMessage.PARAMETERS_NOT_FOUND(["todoId"])),
    });
  }

  // コアロジック呼び出し
  try {
    const todoUserCase = new TodoUseCase(token);
    console.log("Todo一括取得のユースケース呼び出し");
    const todo = await todoUserCase.getSpecificTodo({ todoId: todoId });
    return buildResponseWithCorsHeader({
      statusCode: 200,
      body: JSON.stringify(todo),
    });
  } catch (e) {
    console.error(
      `特定のTodo取得ユースケース呼び出しでエラー発生 エラー内容: ${JSON.stringify(
        e
      )}`
    );

    if (!e.statusCode) {
      return buildResponseWithCorsHeader({
        statusCode: 500,
        body: buildErrorMessage(ErrorMessage.UNEXPECTED_ERROR()),
      });
    } else {
      // ユーザ定義エラーはstatusCodeとメッセージをthrow時にセットすること
      return buildResponseWithCorsHeader({
        statusCode: e.statusCode,
        body: buildErrorMessage(e.message),
      });
    }
  }
};
