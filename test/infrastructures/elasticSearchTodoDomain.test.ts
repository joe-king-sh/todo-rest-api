const aws = require("aws-sdk");
import {
  ElasticSearchTodoDomain,
  SearchByUserIdAndByQueryProps,
} from "../../lambda/infrastructures/elasticSearchTodoDomain";
import { Client, ApiResponse } from "@elastic/elasticsearch";
import { DynamoDBRecord } from "aws-lambda";

process.env.DYNAMODB_TABLE_NAME = "MOCK_DYNAMODB_TABLE";
process.env.REGION = "ap-northeast-1";

jest.mock("aws-sdk");
jest.mock("@elastic/elasticsearch", () => {
  const mClient = {
    search: jest.fn(),
    delete: jest.fn(),
    index: jest.fn(),
  };
  return { Client: jest.fn(() => mClient) };
});
const mElaticsearchClient = new Client({ node: "my-test-node" });
const elasticSearchTodoDomain = new ElasticSearchTodoDomain(`test-node`);
elasticSearchTodoDomain.client = mElaticsearchClient;

jest.mock("aws-elasticsearch-connector");

describe("ElasticSearch 共通アクセスクラス インデックス登録のテスト", (): void => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  test("Case1: INSERT 1件正常にインデックス更新完了", async () => {
    jest.resetAllMocks();

    expect.assertions(1);

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

  describe("ElasticSearch 共通アクセスクラス 検索のテスト", (): void => {
    afterAll(() => {
      jest.resetAllMocks();
    });

    test("Case1: 検索条件指定なし 全件を返す", async () => {
      jest.resetAllMocks();

      expect.assertions(1);

      // モックのセット
      mElaticsearchClient.search = jest.fn().mockReturnValue(
        new Promise((resolve, reject) => {
          const response = {
            took: 4,
            timed_out: false,
            _shards: {
              total: 5,
              successful: 5,
              skipped: 0,
              failed: 0,
            },
            hits: {
              total: {
                value: 2,
                relation: "eq",
              },
              max_score: 1.0,
              hits: [
                {
                  _index: "my-unit-test-user",
                  _type: "_doc",
                  _id: "my-unit-test-user20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                  _score: 1.0,
                  _source: {
                    updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
                    title: "title1",
                    todoId:
                      "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                    userId: "my-unit-test-user",
                    content: "test contents",
                  },
                },
                {
                  _index: "my-unit-test-user",
                  _type: "_doc",
                  _id: "my-unit-test-user20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
                  _score: 1.0,
                  _source: {
                    updatedDate: "Fri, 23 Jul 2021 15:12:56 GMT",
                    title: "title2",
                    todoId:
                      "20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
                    userId: "my-unit-test-user",
                    content: "testcontents",
                  },
                },
              ],
            },
          };
          resolve(response);
        })
      );

      // WHEN
      const searchByUserIdAndByQueryProps = {
        userId: "my-unit-test-user",
      };
      const expected = {
        took: 4,
        timed_out: false,
        _shards: {
          total: 5,
          successful: 5,
          skipped: 0,
          failed: 0,
        },
        hits: {
          total: {
            value: 2,
            relation: "eq",
          },
          max_score: 1.0,
          hits: [
            {
              _index: "my-unit-test-user",
              _type: "_doc",
              _id: "my-unit-test-user20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
              _score: 1.0,
              _source: {
                updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
                title: "title1",
                todoId: "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                userId: "my-unit-test-user",
                content: "test contents",
              },
            },
            {
              _index: "my-unit-test-user",
              _type: "_doc",
              _id: "my-unit-test-user20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
              _score: 1.0,
              _source: {
                updatedDate: "Fri, 23 Jul 2021 15:12:56 GMT",
                title: "title2",
                todoId: "20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
                userId: "my-unit-test-user",
                content: "testcontents",
              },
            },
          ],
        },
      };

      // THEN
      // 戻り値確認
      await expect(
        elasticSearchTodoDomain.searchByUserIdAndByQuery(
          searchByUserIdAndByQueryProps
        )
      ).resolves.toEqual(expected);
    }, 5000);

    test("Case2: 検索条件(s、from、size)あり", async () => {
      jest.resetAllMocks();

      expect.assertions(1);

      // モックのセット
      mElaticsearchClient.search = jest.fn().mockReturnValue(
        new Promise((resolve, reject) => {
          const response = {
            took: 4,
            timed_out: false,
            _shards: {
              total: 5,
              successful: 5,
              skipped: 0,
              failed: 0,
            },
            hits: {
              total: {
                value: 2,
                relation: "eq",
              },
              max_score: 1.0,
              hits: [
                {
                  _index: "my-unit-test-user",
                  _type: "_doc",
                  _id: "my-unit-test-user20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                  _score: 1.0,
                  _source: {
                    updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
                    title: "title1",
                    todoId:
                      "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                    userId: "my-unit-test-user",
                    content: "test contents",
                  },
                },
                {
                  _index: "my-unit-test-user",
                  _type: "_doc",
                  _id: "my-unit-test-user20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
                  _score: 1.0,
                  _source: {
                    updatedDate: "Fri, 23 Jul 2021 15:12:56 GMT",
                    title: "title2",
                    todoId:
                      "20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
                    userId: "my-unit-test-user",
                    content: "testcontents",
                  },
                },
              ],
            },
          };
          resolve(response);
        })
      );

      // WHEN
      const searchByUserIdAndByQueryProps = {
        userId: "my-unit-test-user",
        size: 5,
        from: 5,
        q: "Find this text",
      };
      const expected = {
        took: 4,
        timed_out: false,
        _shards: {
          total: 5,
          successful: 5,
          skipped: 0,
          failed: 0,
        },
        hits: {
          total: {
            value: 2,
            relation: "eq",
          },
          max_score: 1.0,
          hits: [
            {
              _index: "my-unit-test-user",
              _type: "_doc",
              _id: "my-unit-test-user20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
              _score: 1.0,
              _source: {
                updatedDate: "Fri, 23 Jul 2021 15:29:23 GMT",
                title: "title1",
                todoId: "20210723152923-a13d54f8-6308-45c3-a27b-046d0d547fd4",
                userId: "my-unit-test-user",
                content: "test contents",
              },
            },
            {
              _index: "my-unit-test-user",
              _type: "_doc",
              _id: "my-unit-test-user20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
              _score: 1.0,
              _source: {
                updatedDate: "Fri, 23 Jul 2021 15:12:56 GMT",
                title: "title2",
                todoId: "20210723151256-4d211798-ff8f-4a97-9c35-7bc9edce2b9d",
                userId: "my-unit-test-user",
                content: "testcontents",
              },
            },
          ],
        },
      };

      // THEN
      // 戻り値確認
      await expect(
        elasticSearchTodoDomain.searchByUserIdAndByQuery(
          searchByUserIdAndByQueryProps
        )
      ).resolves.toEqual(expected);
    }, 5000);
  });
});
