import {
  APIGatewayEvent,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEventPathParameters,
} from "aws-lambda";
import { TodoUseCase } from "../domains/todoUseCase";
import {
  NotFoundError,
  DynamodbError,
  ErrorMessage,
} from "../domains/errorUseCase";
import { DynamodbTodoTable } from "../infrastructures/dynamodbTodoTable";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  // パラメータ受け取り
  const token = event.headers["Authorization"] as string; // AuthorizationがないとAPI Gateway側で弾いてるので、必ずある想定
  const pathParameters = event.pathParameters;

  // 入力チェック
  const todoId = pathParameters?.todoId;
  if (!todoId) {
    return {
      statusCode: 400,
      body: ErrorMessage.PARAMETERS_NOT_FOUND(["todoId"]),
    };
  }

  // コアロジック呼び出し
  const todoUserCase = new TodoUseCase(token);
  try {
    const todo = await todoUserCase.getSpecificTodo({ todoId: todoId });
    return { statusCode: 200, body: JSON.stringify(todo) };
  } catch (e) {
    if (!e.statusCode) {
      return { statusCode: 500, body: ErrorMessage.UNEXPECTED_ERROR() };
    } else {
      // ユーザ定義エラーはstatusCodeとメッセージをthrow時にセットすること
      return { statusCode: e.statusCode, body: e.message };
    }
  }
};
