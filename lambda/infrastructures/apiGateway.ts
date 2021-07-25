import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

const allowCorsHeaders = {
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
};

export const buildResponseWithCorsHeader = (response: {
  statusCode: number;
  body: string | undefined;
  headers?: {};
}): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode: response.statusCode,
    body: response.body,
    headers: { ...response.headers, ...allowCorsHeaders },
  };
};
