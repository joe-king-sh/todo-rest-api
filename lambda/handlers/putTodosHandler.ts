import { APIGatewayEvent, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { TodoUseCase, PutTodoProps } from "../domains/todoUseCase";
import { ErrorMessage, buildErrorMessage } from "../domains/errorUseCase";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("putTodoHandler 処理開始");
  console.log(`Input parameters: ${JSON.stringify(event)}`);

  let body: PutTodoProps;

  // パラメータ受け取り
  const token = event.headers?.Authorization;
  const bodyJsonString = event.body;
  const todoId = event.pathParameters?.todoId; // 更新でPUT呼び出し想定
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
  if (!bodyJsonString) {
    console.warn("Request Body が未指定");
    return {
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["Request Body"])
      ),
    };
  }
  try {
    body = JSON.parse(bodyJsonString) as PutTodoProps;
  } catch (e) {
    console.error("BodyがJson Parseできない形式で指定されてきた");
    return {
      statusCode: 400,
      body: buildErrorMessage(ErrorMessage.INVALID_PARAMETER()),
    };
  }
  // 必須チェック
  if (!body.title || !body.content) {
    console.error("必須項目[title,content]どちらかが存在しない");
    return {
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["title", "content"])
      ),
    };
  }

  // PathParameterにTodoIdがセットされていたら、更新モードでtodoUserCase.putTodoは動作する
  const putTodoProps = {
    ...body,
    todoId: todoId,
  };

  // コアロジック呼び出し
  try {
    const todoUserCase = new TodoUseCase(token);
    console.log("Todo登録/更新のユースケース呼び出し");
    const todo = await todoUserCase.putTodo(putTodoProps);
    return { statusCode: 200, body: JSON.stringify(todo) };
  } catch (e) {
    console.error(
      `特定のTodo登録/更新ユースケース呼び出しでエラー発生 エラー内容: ${JSON.stringify(
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
