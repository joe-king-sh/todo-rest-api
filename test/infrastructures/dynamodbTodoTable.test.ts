const aws = require("aws-sdk");
import {
  DynamodbTodoTable,
  DYNAMO,
} from "../../lambda/infrastructures/dynamodbTodoTable";
import {
  DynamodbError,
  ErrorMessage,
  NotFoundError,
} from "../../lambda/domains/errorUseCase";

process.env.DYNAMODB_TABLE_NAME = "MOCK_DYNAMODB_TABLE";
process.env.REGION = "ap-northeast-1";

jest.mock("aws-sdk", () => {
  const mDocumentClient = { get: jest.fn(),put: jest.fn(),scan: jest.fn(),delete:jest.fn(),update:jest.fn() };
  const mDynamoDB = { DocumentClient: jest.fn(() => mDocumentClient) };
  return { DynamoDB: mDynamoDB, config: { update: () => {} } };
});
const mDynamoDb = new aws.DynamoDB.DocumentClient();

describe("Dynamodb 操作用サービス データ取得系のテスト", (): void => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  test("Case1: DynamodbからのgetItemが正常に終了する場合", async () => {
    jest.resetAllMocks();

    expect.assertions(2);

    // Dynamodbから返却される想定のモックレスポンス
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
    const params = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };

    // THEN
    const actual = await DynamodbTodoTable.getTodo(params);
    // 取得結果確認
    expect(actual).toEqual(expected);
    // 呼び出し回数確認
    expect(DYNAMO.get).toHaveBeenCalledTimes(1);
  }, 5000);

  test("Case2: DynamodbからのgetItemの結果が0件", async () => {
    jest.resetAllMocks();
    expect.assertions(2);

    // Dynamodbから返却される想定のモックレスポンス
    const mockResult = {};
    // DynamoDB.DocumentClient.getのモックが、上記レスポンスを返すようセット
    mDynamoDb.get.mockImplementationOnce((_: any, callback: any) =>
      callback(null, mockResult)
    );

    // WHEN
    const params = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };
    const expected = undefined;

    // THEN
    const actual = await DynamodbTodoTable.getTodo(params);
    // 取得結果確認
    expect(actual).toEqual(expected);
    // 呼び出し回数確認
    expect(DYNAMO.get).toHaveBeenCalledTimes(1);
  }, 5000);

  test("Case3: DynamodbのgetからのgetItemで予期せぬエラーが発生", async () => {
    jest.resetAllMocks();
    expect.assertions(2);

    // DynamoDB.DocumentClient.getのモックがExceptionをthrowするようにセット
    mDynamoDb.get.mockImplementationOnce((_: any, callback: any) => {
      throw new Error();
    });

    // WHEN
    const params = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };
    const expectedErrorMessage = ErrorMessage.DYNAMODB_ERROR();
    // THEN
    // エラーメッセージと Exceptionの種類を確認
    expect(async () => {
      await DynamodbTodoTable.getTodo(params);
    }).rejects.toThrowError(new DynamodbError(expectedErrorMessage));
    expect(async () => {
      await DynamodbTodoTable.getTodo(params);
    }).rejects.toThrowError(DynamodbError);

    // 呼び出し回数確認
    expect(DYNAMO.get).toHaveBeenCalledTimes(2);
  }, 5000);
});

describe("Dynamodb 操作用サービス データ登録系のテスト", (): void => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  test("Case1: DynamodbへのputItemが正常に終了する場合", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodbから返却される想定のモックレスポンス
    // DynamoDB.DocumentClient.putのモックが、上記レスポンスを返すようセット
    mDynamoDb.put.mockImplementationOnce((_: any, callback: any) =>
      callback(null, null)
    );

    // WHEN
    const params = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "内容",
      dueDate: "2019-05-31T18:24:00",
      isImportant: false,
    };

    // THEN
    await DynamodbTodoTable.putTodo(params);
    // 呼び出し回数確認
    expect(DYNAMO.put).toHaveBeenCalledTimes(1);
  }, 5000);

  test("Case2: DynamodbへputItemした際に予期せぬエラーが発生", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // DynamoDB.DocumentClient.getのモックがExceptionをthrowするようにセット
    mDynamoDb.put.mockImplementationOnce((_: any, callback: any) => {
      throw new Error();
    });

    // WHEN
    const params = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "内容",
      dueDate: "2019-05-31T18:24:00",
      isImportant: false,
    };
    const expectedErrorMessage = ErrorMessage.DYNAMODB_ERROR();
    // THEN
    // エラーメッセージと Exceptionの種類を確認
    expect(async () => {
      await DynamodbTodoTable.putTodo(params);
    }).rejects.toThrowError(new DynamodbError(expectedErrorMessage));
    expect(async () => {
      await DynamodbTodoTable.putTodo(params);
    }).rejects.toThrowError(DynamodbError);

    // 呼び出し回数確認
    expect(DYNAMO.put).toHaveBeenCalledTimes(2);
  }, 5000);
});
