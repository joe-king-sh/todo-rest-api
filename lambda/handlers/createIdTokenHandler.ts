import { APIGatewayEvent, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { AuthUseCase } from "../domains/authUserCase";
import { ErrorMessage, buildErrorMessage } from "../domains/errorUseCase";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("createIdTokenandler 処理開始");
  console.log(`Input parameters: ${JSON.stringify(event)}`);

  // パラメータ受け取り
  const bodyJsonString = event.body;
  // 入力チェック
  if (!bodyJsonString) {
    console.warn("Request Body が未指定");
    return {
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["Request Body"])
      ),
    };
  }

  let body;
  try {
    body = JSON.parse(bodyJsonString);
  } catch (e) {
    console.error("BodyがJson Parseできない形式で指定されてきた");
    return {
      statusCode: 400,
      body: buildErrorMessage(ErrorMessage.INVALID_PARAMETER()),
    };
  }

  // 必須チェック
  if (!body.userId || !body.password) {
    console.error("必須項目[userId,password]どちらかが存在しない");
    return {
      statusCode: 400,
      body: buildErrorMessage(
        ErrorMessage.PARAMETERS_NOT_FOUND(["userId", "password"])
      ),
    };
  }

  // コアロジック呼び出し
  try {
    console.log("APIのアクセストークン発行のユースケース呼び出し");
    const idTokenOutput = await AuthUseCase.createIdToken({
      userId: body.userId,
      password: body.password,
    });
    return { statusCode: 200, body: JSON.stringify(idTokenOutput) };
  } catch (e) {
    console.error(
      `APIのトークン発行のユースケース呼び出しでエラー発生 エラー内容: `,
      e
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
