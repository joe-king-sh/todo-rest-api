import { APIGatewayEvent, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { TodoUseCase, listTodosProps } from "../domains/todoUseCase";
import { ErrorMessage, buildErrorMessage } from "../domains/errorUseCase";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("listTodoHandler 処理開始");
  console.log(`Input parameters: ${JSON.stringify(event)}`);

  // パラメータ受け取り
  const token = event.headers?.Authorization;
  const queryStringParameters = event.queryStringParameters;
  const q = queryStringParameters?.q;

  // 入力チェック
  if (!token) {
    console.log("Authorization トークンが未指定");
    return {
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["Authorization Header"])
      ),
    };
  }

  const listTodoProps: listTodosProps = {};
  if (!q) {
    console.log("検索条件が未指定");
    return {
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["検索条件 q"])
      ),
    };
  }

  // コアロジック呼び出し
  try {
    const todoUserCase = new TodoUseCase(token);
    console.log("特定のTodo取得ユースケース呼び出し");

    // const todos = await todoUserCase.findTodos(findTodoProps);

    const todos = [{}, {}];
    return { statusCode: 200, body: JSON.stringify(todos) };
  } catch (e) {
    console.log(
      `特定のTodo取得ユースケース呼び出しでエラー発生 エラー内容: ${JSON.stringify(
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
