import { DynamoDBStreamEvent } from "aws-lambda";
import { ElasticSearchTodoDomain } from "./../infrastructures/elasticSearchTodoDomain";

export const handler = async (event: DynamoDBStreamEvent) => {
  const node = process.env.ES_DOMAIN as string;
  const index = (process.env.ES_INDEX as string).toLowerCase();

  console.log("トリガーされたEvent内容", event);
  console.log("ES domain to use:", node);
  console.log("ES index to use:", index);

  if (!event["Records"]) {
    console.log("処理するレコードがないので終了");
    return;
  }

  const elasticSearchTodoDomain = new ElasticSearchTodoDomain(node);

  console.log("Index処理 開始..");
  await elasticSearchTodoDomain.indexTodo(event["Records"], index);
  console.log("Index処理 終了..");

  return;
};
