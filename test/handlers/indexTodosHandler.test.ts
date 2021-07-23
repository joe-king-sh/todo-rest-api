import { handler } from "../../lambda/handlers/indexTodosHandler";
import { DynamoDBStreamEvent } from "aws-lambda";
import { ElasticSearchTodoDomain } from "../../lambda/infrastructures/elasticSearchTodoDomain";

process.env.ES_DOMAIN = "unit-test-es-domain";
process.env.ES_INDEX = "unit-test-ec-index";

// ElasticSearchアクセスクラスはモック化しておく
jest.mock("../../lambda/infrastructures/elasticSearchTodoDomain");

// Lambdaに渡ってくるイベント変数のベース
const baseDynamodbStreamEvent: DynamoDBStreamEvent = {
  Records: [
    {
      eventID: "c4ca4238a0b923820dcc509a6f75849b",
      eventName: "INSERT",
      eventVersion: "1.1",
      eventSource: "aws:dynamodb",
      awsRegion: "ap-northeast-1",
      dynamodb: {
        Keys: {
          Id: {
            N: "101",
          },
        },
        NewImage: {
          Message: {
            S: "New item!",
          },
          Id: {
            N: "101",
          },
        },
        ApproximateCreationDateTime: 1428537600,
        SequenceNumber: "4421584500000000017450439091",
        SizeBytes: 26,
        StreamViewType: "NEW_AND_OLD_IMAGES",
      },
      eventSourceARN:
        "arn:aws:dynamodb:ap-northeast-1:123456789012:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
    },
    {
      eventID: "c81e728d9d4c2f636f067f89cc14862c",
      eventName: "MODIFY",
      eventVersion: "1.1",
      eventSource: "aws:dynamodb",
      awsRegion: "ap-northeast-1",
      dynamodb: {
        Keys: {
          Id: {
            N: "101",
          },
        },
        NewImage: {
          Message: {
            S: "This item has changed",
          },
          Id: {
            N: "101",
          },
        },
        OldImage: {
          Message: {
            S: "New item!",
          },
          Id: {
            N: "101",
          },
        },
        ApproximateCreationDateTime: 1428537600,
        SequenceNumber: "4421584500000000017450439092",
        SizeBytes: 59,
        StreamViewType: "NEW_AND_OLD_IMAGES",
      },
      eventSourceARN:
        "arn:aws:dynamodb:ap-northeast-1:123456789012:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
    },
    {
      eventID: "eccbc87e4b5ce2fe28308fd9f2a7baf3",
      eventName: "REMOVE",
      eventVersion: "1.1",
      eventSource: "aws:dynamodb",
      awsRegion: "ap-northeast-1",
      dynamodb: {
        Keys: {
          Id: {
            N: "101",
          },
        },
        OldImage: {
          Message: {
            S: "This item has changed",
          },
          Id: {
            N: "101",
          },
        },
        ApproximateCreationDateTime: 1428537600,
        SequenceNumber: "4421584500000000017450439093",
        SizeBytes: 38,
        StreamViewType: "NEW_AND_OLD_IMAGES",
      },
      eventSourceARN:
        "arn:aws:dynamodb:ap-northeast-1:123456789012:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
    },
  ],
};

describe("Todo Index処理のハンドラーのテスト", (): void => {
  test("Case1: 正常にRecordsがセットされたイベントが渡ってくる", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const event: DynamoDBStreamEvent = { ...baseDynamodbStreamEvent };

    // THEN
    await expect(handler(event)).resolves.toEqual(undefined);
  });

  test("Case2: 渡されてきたイベントのRecordsがundefined", async () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const event: any = { ...baseDynamodbStreamEvent };
    event["Records"] = null;

    // THEN
    await expect(handler(event)).resolves.toEqual(undefined);
  });
});
