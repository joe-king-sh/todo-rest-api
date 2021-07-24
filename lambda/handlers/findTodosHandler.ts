import { APIGatewayEvent, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import {
  TodoUseCase,
  listTodosProps,
  FindTodosProps,
} from "../domains/todoUseCase";
import { ErrorMessage, buildErrorMessage } from "../domains/errorUseCase";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("listTodoHandler 処理開始");
  console.log(`Input parameters: ${JSON.stringify(event)}`);

  const node = process.env.ES_DOMAIN as string;
  console.log("ES domain to use:", node);

  // パラメータ受け取り
  const token = event.headers?.Authorization;
  const queryStringParameters = event.queryStringParameters;
  const q = queryStringParameters?.q;
  const size = queryStringParameters?.size;
  const from = queryStringParameters?.nextStart;

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

  // コアロジック呼び出し
  try {
    const todoUserCase = new TodoUseCase(token);
    console.log("Todo検索ユースケース呼び出し");

    // 検索条件の指定
    const findTodosPrpos: FindTodosProps = {
      node: node,
    };
    if (size) {
      findTodosPrpos.size = parseInt(size);
    }
    if (q) {
      findTodosPrpos.q = q;
    }
    if (from) {
      findTodosPrpos.nextStartKey = parseInt(from);
    }

    // 検索実行
    console.log("Todo検索条件:", JSON.stringify(findTodosPrpos));
    const findTodosOutput = await todoUserCase.findTodos(findTodosPrpos);
    return { statusCode: 200, body: JSON.stringify(findTodosOutput) };
  } catch (e) {
    console.error(`Todo検索ユースケース呼び出しでエラー発生 エラー内容:`, e);

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
