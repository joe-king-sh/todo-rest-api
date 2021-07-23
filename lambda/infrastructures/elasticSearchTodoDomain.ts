const { Client } = require("@elastic/elasticsearch");
const createAwsElasticsearchConnector = require("aws-elasticsearch-connector");
import { Config } from "aws-sdk";
import { DynamoDBRecord } from "aws-lambda";
import { convertDynamodbObjectToJSON } from "../infrastructures/dynamodbTodoTable";

/**
 * AWS ElasticSearchへのアクセス共通クラス
 *
 * @export
 * @class ElasticSearchTodoDomain
 */
export class ElasticSearchTodoDomain {
  client: any;

  constructor(node: string) {
    this.client = new Client({
      node: `https://${node}`,
      ...createAwsElasticsearchConnector(new Config({})),
    });
  }

  /**
   * 検索エンジンにTodoを反映させるユースケース
   *
   * @param {DynamoDBRecord[]} Records
   * @return {*}  {Promise<void>}
   * @memberof TodoUseCase
   */
  public async indexTodo(
    Records: DynamoDBRecord[],
    index: string
  ): Promise<void> {
    for (const record of Records.filter((record: any) => record.dynamodb)) {
      try {
        let result;

        const keys = record.dynamodb!.Keys;
        console.log(`処理対象レコード: ${JSON.stringify(record)}`);

        // Dynamodbのプライマリーキーを取得
        const userId = keys?.userId.S;
        const todoId = keys?.todoId.S;

        if (!userId || !todoId) {
          console.warn(
            `Dynamodbのレコードを特定するプライマリーキーの取得に失敗`
          );
          continue;
        }

        // パーティションキー、ソートキーを合体させたものをESのidとする
        const id = userId + todoId;

        if (record.eventName === "REMOVE") {
          console.log("削除処理を実行 document: " + id);

          result = await this.client.delete({
            index,
            id,
          });
        } else {
          if (!record.dynamodb!.NewImage) {
            console.warn(
              "新しいドキュメントをインデックスしようとしたが、Streamデータに新しいレコードがないためスキップする.."
            );
            continue;
          }

          console.log("インデックス処理を実行 document: " + id);
          const convertedDocument = convertDynamodbObjectToJSON({
            M: record.dynamodb!.NewImage,
          });
          console.log("Indexする内容: ", convertedDocument);
          result = await this.client.index({
            index,
            id,
            body: convertedDocument,
          });
        }

        console.log(`Index更新完了 result: ${result}`);
      } catch (e) {
        console.error("Streamデータ処理中に例外が発生 処理中レコード:");
        console.error(record);
        console.error(e);
      }
    }
  }
}
