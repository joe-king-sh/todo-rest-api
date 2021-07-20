const aws = require("aws-sdk");
import {
  DynamodbTodoTable,
  DYNAMO,
} from "../lambda/infrastructures/dynamodbTodoTable";
// import { mocked } from "ts-jest/utils";

process.env.DYNAMODB_TABLE_NAME = "MOCK_DYNAMODB_TABLE";
process.env.REGION = "ap-northeast-1";

jest.mock("aws-sdk", () => {
  const mDocumentClient = { get: jest.fn() };
  const mDynamoDB = { DocumentClient: jest.fn(() => mDocumentClient) };
  return { DynamoDB: mDynamoDB, config: { update: () => {} } };
});
const mDynamoDb = new aws.DynamoDB.DocumentClient();

describe("Dynamodb 操作用サービス のテスト", (): void => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  test("Case1: DynamodbからのgetItemが正常に終了する場合", async () => {

    // Dynamodbのから返却される想定のモックレスポンス
    const mockResult = {
      Item: {
        userId: "my-unit-test-user",
        todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        title: "タイトル",
        content: "内容",
        dueDate: "2019-05-31T18:24:00",
        isImportant: false,
      },
    };
    // DynamoDB.DocumentClient.getのモックが、上記レスポンスを返すようセット
    mDynamoDb.get.mockImplementationOnce((_: any, callback: any) =>
      callback(null, mockResult)
    );

    // WHEN
    const expected = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "内容",
      dueDate: "2019-05-31T18:24:00",
      isImportant: false,
    };

    // THEN
    const actual = await DynamodbTodoTable.getTodo({
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    });
    // 取得結果確認
    expect(actual).toEqual(expected);
    // 呼び出し回数確認
    expect(DYNAMO.get).toHaveBeenCalledTimes(1);
    // 渡されているパラメータ確認
    // expect(DYNAMO.get).toHaveBeenCalledWith({
    //   TableName: "MOCK_DYNAMODB_TABLE",
    //   Key: {
    //     userId: "my-unit-test-user",
    //     todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    //   },
    // });
  }, 5000);
});
