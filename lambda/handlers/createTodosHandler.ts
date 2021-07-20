import { APIGatewayEvent, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { TodoUseCase, CreateTodoProps } from "../domains/todoUseCase";
import { ErrorMessage } from "../domains/errorUseCase";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("createTodoHandler 処理開始");
  console.log(`Input parameters: ${JSON.stringify(event)}`);

  let body: CreateTodoProps;

  // パラメータ受け取り
  const token = event.headers?.Authorization;
  const bodyJsonString = event.body;

  // 入力チェック
  if (!token) {
    console.log("Authorization トークンが未指定");
    return {
      statusCode: 400,
      body: ErrorMessage.PARAMETERS_NOT_FOUND(["Authorization Header"]),
    };
  }
  if (!bodyJsonString) {
    console.log("Request Body が未指定");
    return {
      statusCode: 400,
      body: ErrorMessage.PARAMETERS_NOT_FOUND(["Request Body"]),
    };
  }
  try {
    body = JSON.parse(bodyJsonString) as CreateTodoProps;
  } catch (e) {
    console.log("BodyがJson Parseできない形式で指定されてきた");
    return {
      statusCode: 400,
      body: ErrorMessage.INVALID_PARAMETER(),
    };
  }
  // 必須チェック
  if (!body.title || !body.content) {
    console.log("必須項目[title,content]どちらかが存在しない");
    return {
      statusCode: 400,
      body: ErrorMessage.PARAMETERS_NOT_FOUND(["title", "content"]),
    };
  }

  // コアロジック呼び出し
  try {
    const todoUserCase = new TodoUseCase(token);
    console.log("Todo登録のユースケース呼び出し");
    const todo = await todoUserCase.createTodo(body);
    return { statusCode: 200, body: JSON.stringify(todo) };
  } catch (e) {
    console.log(
      `特定のTodo登録ユースケース呼び出しでエラー発生 エラー内容: ${JSON.stringify(
        e
      )}`
    );

    if (!e.statusCode) {
      return { statusCode: 500, body: ErrorMessage.UNEXPECTED_ERROR() };
    } else {
      // ユーザ定義エラーはstatusCodeとメッセージをthrow時にセットすること
      return { statusCode: e.statusCode, body: e.message };
    }
  }
};
