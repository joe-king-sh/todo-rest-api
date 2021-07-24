const aws = require("aws-sdk");
import {
  DynamodbTodoTable,
  DYNAMO,
} from "../../lambda/infrastructures/dynamodbTodoTable";
import { DynamodbError, ErrorMessage } from "../../lambda/domains/errorUseCase";

process.env.DYNAMODB_TABLE_NAME = "MOCK_DYNAMODB_TABLE";
process.env.REGION = "ap-northeast-1";

jest.mock("aws-sdk", () => {
  const mDocumentClient = {
    get: jest.fn(),
    put: jest.fn(),
    scan: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    query: jest.fn(),
  };
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
      },
    };
    // DynamoDB.DocumentClient.getのモックが、上記レスポンスを返すようセット
    mDynamoDb.get.mockReturnValue({
      promise: jest.fn(
        () =>
          new Promise((resolve, reject) => {
            resolve(mockResult);
          })
      ),
    });

    // WHEN
    const expected = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "内容",
    };
    const params = {
      Key: {
        userId: "my-unit-test-user",
        todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      },
      ConsistentRead: false,
    };

    // THEN
    const actual = await DynamodbTodoTable.getTodoItem(params);
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
    mDynamoDb.get.mockReturnValue({
      promise: jest.fn(
        () =>
          new Promise((resolve, reject) => {
            resolve(mockResult);
          })
      ),
    });

    // WHEN
    const params = {
      Key: {
        userId: "my-unit-test-user",
        todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      },
      ConsistentRead: false,
    };
    const expected = undefined;

    // THEN
    const actual = await DynamodbTodoTable.getTodoItem(params);
    // 取得結果確認
    expect(actual).toEqual(expected);
    // 呼び出し回数確認
    expect(DYNAMO.get).toHaveBeenCalledTimes(1);
  }, 5000);

  test("Case3: DynamodbのgetからのgetItemで予期せぬエラーが発生", async () => {
    jest.resetAllMocks();
    expect.assertions(3);

    // DynamoDB.DocumentClient.getのモックがExceptionをthrowするようにセット
    mDynamoDb.get.mockReturnValue({
      promise: jest.fn(
        () =>
          new Promise((resolve, reject) => {
            throw new Error();
          })
      ),
    });

    // WHEN
    const params = {
      Key: {
        userId: "my-unit-test-user",
        todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      },
      ConsistentRead: false,
    };
    const expectedErrorMessage = ErrorMessage.DYNAMODB_ERROR();

    // THEN
    // エラーメッセージと Exceptionの種類を確認
    expect(async () => {
      await DynamodbTodoTable.getTodoItem(params);
    }).rejects.toThrowError(new DynamodbError(expectedErrorMessage));
    expect(async () => {
      await DynamodbTodoTable.getTodoItem(params);
    }).rejects.toThrowError(DynamodbError);
    // 呼び出し回数確認
    expect(DYNAMO.get).toHaveBeenCalledTimes(2);
  }, 5000);
});

describe("Dynamodb 操作用サービス データ登録/更新系のテスト", (): void => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  test("Case1: DynamodbへのputItemが正常に終了する場合", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodbから返却される想定のモックレスポンス
    // DynamoDB.DocumentClient.putのモックが、nullを返すようセット
    mDynamoDb.put.mockReturnValue({
      promise: jest.fn(
        () =>
          new Promise((resolve, reject) => {
            resolve(null);
          })
      ),
    });

    // WHEN
    const params = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "内容",
    };

    // THEN
    await DynamodbTodoTable.putTodoItem(params);
    // 呼び出し回数確認
    expect(DYNAMO.put).toHaveBeenCalledTimes(1);
  }, 5000);

  test("Case2: DynamodbへputItemした際に予期せぬエラーが発生", async () => {
    jest.resetAllMocks();
    expect.assertions(3);

    // DynamoDB.DocumentClient.putのモックがExceptionをthrowするようにセット
    mDynamoDb.put.mockReturnValue({
      promise: jest.fn(
        () =>
          new Promise((resolve, reject) => {
            throw new Error();
          })
      ),
    });

    // WHEN
    const params = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "内容",
    };
    const expectedErrorMessage = ErrorMessage.DYNAMODB_ERROR();
    // THEN
    // エラーメッセージと Exceptionの種類を確認
    expect(async () => {
      await DynamodbTodoTable.putTodoItem(params);
    }).rejects.toThrowError(new DynamodbError(expectedErrorMessage));
    expect(async () => {
      await DynamodbTodoTable.putTodoItem(params);
    }).rejects.toThrowError(DynamodbError);

    // 呼び出し回数確認
    expect(DYNAMO.put).toHaveBeenCalledTimes(2);
  }, 5000);
});

describe("Dynamodb 操作用サービス データ削除系のテスト", (): void => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  test("Case1: Dynamodbへのdeleteが正常に終了する場合", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodbから返却される想定のモックレスポンス
    // DynamoDB.DocumentClient.deleteのモックが、nullを返すようセット
    mDynamoDb.delete.mockReturnValue({
      promise: jest.fn(
        () =>
          new Promise((resolve, reject) => {
            resolve(null);
          })
      ),
    });

    // WHEN
    const params = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };

    // THEN
    await DynamodbTodoTable.deleteTodoItem(params);
    // 呼び出し回数確認
    expect(DYNAMO.delete).toHaveBeenCalledTimes(1);
  }, 5000);

  test("Case2: Dynamodbへdeleteした際に予期せぬエラーが発生", async () => {
    jest.resetAllMocks();
    expect.assertions(3);

    // DynamoDB.DocumentClient.deleteのモックがExceptionをthrowするようにセット
    mDynamoDb.delete.mockReturnValue({
      promise: jest.fn(
        () =>
          new Promise((resolve, reject) => {
            throw new Error();
          })
      ),
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
      await DynamodbTodoTable.deleteTodoItem(params);
    }).rejects.toThrowError(new DynamodbError(expectedErrorMessage));
    expect(async () => {
      await DynamodbTodoTable.deleteTodoItem(params);
    }).rejects.toThrowError(DynamodbError);

    // 呼び出し回数確認
    expect(DYNAMO.delete).toHaveBeenCalledTimes(2);
  }, 5000);
});
