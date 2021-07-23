const aws = require("aws-sdk");
import { ElasticSearchTodoDomain } from "../../lambda/infrastructures/elasticSearchTodoDomain";
import {
  DynamodbError,
  ErrorMessage,
  NotFoundError,
} from "../../lambda/domains/errorUseCase";
import { DynamoDBRecord } from "aws-lambda";

process.env.DYNAMODB_TABLE_NAME = "MOCK_DYNAMODB_TABLE";
process.env.REGION = "ap-northeast-1";

jest.mock("aws-sdk");
jest.mock("@elastic/elasticsearch");
jest.mock("aws-elasticsearch-connector");

describe("ElasticSearch 共通アクセスクラス インデックス登録のテスト", (): void => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  test("Case1: INSERT 1件正常にインデックス更新完了", async () => {
    jest.resetAllMocks();

    expect.assertions(1);

    const testNode = "search-my-test-app-xxx.ap-northeast-1.es.amazonaws.com";
    const elasticSearchTodoDomain = new ElasticSearchTodoDomain(testNode);

    // WHEN
    const records = [
      {
        eventID: "0c432b19c041bb90de4e57f7e2cb5f0d",
        eventName: "INSERT" as "INSERT" | "MODIFY" | "REMOVE" | undefined,
        eventVersion: "1.1",
        eventSource: "aws:dynamodb",
        awsRegion: "ap-northeast-1",
        dynamodb: {
          ApproximateCreationDateTime: 1627035057,
          Keys: {
            todoId: {
              S: "20210723101057-9da11ffd-2582-4a4e-90ac-bffac431f849",
            },
            userId: {
              S: "my-unit-test-user",
            },
          },
          NewImage: {
            updatedDate: {
              S: "Fri, 23 Jul 2021 10:10:57 GMT",
            },
            title: {
              S: "Todoを登録するよ",
            },
            todoId: {
              S: "20210723101057-9da11ffd-2582-4a4e-90ac-bffac431f849",
            },
            userId: {
              S: "my-unit-test-user",
            },
            content: {
              S: "中身だよ。ESまで連携されてね",
            },
          },
          SequenceNumber: "20210600000000032081832300",
          SizeBytes: 283,
          StreamViewType: "NEW_AND_OLD_IMAGES" as
            | "NEW_AND_OLD_IMAGES"
            | "KEYS_ONLY"
            | "NEW_IMAGE"
            | "OLD_IMAGE"
            | undefined,
        },
        eventSourceARN:
          "arn:aws:dynamodb:ap-northeast-1:757523705531:table/TodoApp-Todo-dev/stream/2021-07-23T06:13:26.130",
      },
    ];

    // THEN
    await elasticSearchTodoDomain.indexTodo(records as DynamoDBRecord[]);
    // 呼び出し回数確認
    expect(elasticSearchTodoDomain.client.index).toHaveBeenCalledTimes(1);
  }, 5000);

  test("Case2: REMOVE 1件  正常にインデックス更新完了", async () => {
    jest.resetAllMocks();

    expect.assertions(1);

    const testNode = "search-my-test-app-xxx.ap-northeast-1.es.amazonaws.com";
    const elasticSearchTodoDomain = new ElasticSearchTodoDomain(testNode);

    // WHEN
    const records = [
      {
        eventID: "0664d0fe3abc44c968df381a7bf2e2ed",
        eventName: "REMOVE" as "INSERT" | "MODIFY" | "REMOVE" | undefined,
        eventVersion: "1.1",
        eventSource: "aws:dynamodb",
        awsRegion: "ap-northeast-1",
        dynamodb: {
          ApproximateCreationDateTime: 1627035526,
          Keys: {
            todoId: {
              S: "20210723101057-9da11ffd-2582-4a4e-90ac-bffac431f849",
            },
            userId: {
              S: "my-unit-test-user",
            },
          },
          OldImage: {
            updatedDate: {
              S: "Fri, 23 Jul 2021 10:12:43 GMT",
            },
            title: {
              S: "new title",
            },
            todoId: {
              S: "20210723101057-9da11ffd-2582-4a4e-90ac-bffac431f849",
            },
            userId: {
              S: "my-unit-test-user",
            },
            content: {
              S: "new content",
            },
          },
          SequenceNumber: "20211100000000032082036330",
          SizeBytes: 240,
          StreamViewType: "NEW_AND_OLD_IMAGES" as
            | "NEW_AND_OLD_IMAGES"
            | "KEYS_ONLY"
            | "NEW_IMAGE"
            | "OLD_IMAGE"
            | undefined,
        },
        eventSourceARN:
          "arn:aws:dynamodb:ap-northeast-1:757523705531:table/TodoApp-Todo-dev/stream/2021-07-23T06:13:26.130",
      },
    ];

    // THEN

    // 取得結果確認
    await elasticSearchTodoDomain.indexTodo(records as DynamoDBRecord[]);
    // 呼び出し回数確認
    expect(elasticSearchTodoDomain.client.delete).toHaveBeenCalledTimes(1);
  }, 5000);

  test("Case3: UserIdが空、NewRecordが空で処理をしないが2件", async () => {
    jest.resetAllMocks();

    expect.assertions(2);

    const testNode = "search-my-test-app-xxx.ap-northeast-1.es.amazonaws.com";
    const elasticSearchTodoDomain = new ElasticSearchTodoDomain(testNode);

    // WHEN
    const records = [
      {
        eventID: "0664d0fe3abc44c968df381a7bf2e2ed",
        eventName: "REMOVE" as "INSERT" | "MODIFY" | "REMOVE" | undefined,
        eventVersion: "1.1",
        eventSource: "aws:dynamodb",
        awsRegion: "ap-northeast-1",
        dynamodb: {
          ApproximateCreationDateTime: 1627035526,
          Keys: {
            todoId: {
              S: "20210723101057-9da11ffd-2582-4a4e-90ac-bffac431f849",
            },
            userId: {
              S: "", // useridなし
            },
          },
          OldImage: {
            updatedDate: {
              S: "Fri, 23 Jul 2021 10:12:43 GMT",
            },
            title: {
              S: "new title",
            },
            todoId: {
              S: "20210723101057-9da11ffd-2582-4a4e-90ac-bffac431f849",
            },
            userId: {
              S: "my-unit-test-user",
            },
            content: {
              S: "new content",
            },
          },
          SequenceNumber: "20211100000000032082036330",
          SizeBytes: 240,
          StreamViewType: "NEW_AND_OLD_IMAGES" as
            | "NEW_AND_OLD_IMAGES"
            | "KEYS_ONLY"
            | "NEW_IMAGE"
            | "OLD_IMAGE"
            | undefined,
        },
        eventSourceARN:
          "arn:aws:dynamodb:ap-northeast-1:757523705531:table/TodoApp-Todo-dev/stream/2021-07-23T06:13:26.130",
      },

      {
        eventID: "0c432b19c041bb90de4e57f7e2cb5f0d",
        eventName: "INSERT" as "INSERT" | "MODIFY" | "REMOVE" | undefined,
        eventVersion: "1.1",
        eventSource: "aws:dynamodb",
        awsRegion: "ap-northeast-1",
        dynamodb: {
          ApproximateCreationDateTime: 1627035057,
          Keys: {
            todoId: {
              S: "20210723101057-9da11ffd-2582-4a4e-90ac-bffac431f849",
            },
            userId: {
              S: "my-unit-test-user",
            },
          },
          // NewImageなし
          SequenceNumber: "20210600000000032081832300",
          SizeBytes: 283,
          StreamViewType: "NEW_AND_OLD_IMAGES" as
            | "NEW_AND_OLD_IMAGES"
            | "KEYS_ONLY"
            | "NEW_IMAGE"
            | "OLD_IMAGE"
            | undefined,
        },
        eventSourceARN:
          "arn:aws:dynamodb:ap-northeast-1:757523705531:table/TodoApp-Todo-dev/stream/2021-07-23T06:13:26.130",
      },
    ];

    // THEN

    // 取得結果確認
    await elasticSearchTodoDomain.indexTodo(records as DynamoDBRecord[]);
    // 呼び出し回数確認
    expect(elasticSearchTodoDomain.client.delete).toHaveBeenCalledTimes(0);
    expect(elasticSearchTodoDomain.client.index).toHaveBeenCalledTimes(0);
  }, 5000);
  test("Case4: 異常系予期せぬエラー、KeyからUserIdのキー自体がない", async () => {
    jest.resetAllMocks();

    expect.assertions(2);

    const testNode = "search-my-test-app-xxx.ap-northeast-1.es.amazonaws.com";
    const elasticSearchTodoDomain = new ElasticSearchTodoDomain(testNode);

    // WHEN
    const records = [
      {
        eventID: "0664d0fe3abc44c968df381a7bf2e2ed",
        eventName: "REMOVE" as "INSERT" | "MODIFY" | "REMOVE" | undefined,
        eventVersion: "1.1",
        eventSource: "aws:dynamodb",
        awsRegion: "ap-northeast-1",
        dynamodb: {
          ApproximateCreationDateTime: 1627035526,
          Keys: {
            todoId: {
              S: "20210723101057-9da11ffd-2582-4a4e-90ac-bffac431f849",
            },
            // userId: {
            //   S: "", // useridなし
            // },
          },
          OldImage: {
            updatedDate: {
              S: "Fri, 23 Jul 2021 10:12:43 GMT",
            },
            title: {
              S: "new title",
            },
            todoId: {
              S: "20210723101057-9da11ffd-2582-4a4e-90ac-bffac431f849",
            },
            userId: {
              S: "my-unit-test-user",
            },
            content: {
              S: "new content",
            },
          },
          SequenceNumber: "20211100000000032082036330",
          SizeBytes: 240,
          StreamViewType: "NEW_AND_OLD_IMAGES" as
            | "NEW_AND_OLD_IMAGES"
            | "KEYS_ONLY"
            | "NEW_IMAGE"
            | "OLD_IMAGE"
            | undefined,
        },
        eventSourceARN:
          "arn:aws:dynamodb:ap-northeast-1:757523705531:table/TodoApp-Todo-dev/stream/2021-07-23T06:13:26.130",
      },
    ];

    // THEN
    await elasticSearchTodoDomain.indexTodo(records as DynamoDBRecord[]);
    // 呼び出し回数確認
    expect(elasticSearchTodoDomain.client.delete).toHaveBeenCalledTimes(0);
    expect(elasticSearchTodoDomain.client.index).toHaveBeenCalledTimes(0);
  }, 5000);
});
