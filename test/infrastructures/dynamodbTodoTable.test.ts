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

const sign = require("jwt-encode");
const secret = "This is not so secret.";

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

describe("Dynamodb 操作用サービス データ登録/更新系のテスト", (): void => {
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

describe("Dynamodb 操作用サービス データ削除系のテスト", (): void => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  test("Case1: Dynamodbへのdeleteが正常に終了する場合", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodbから返却される想定のモックレスポンス
    const mockResult = null;
    // DynamoDB.DocumentClient.putのモックが、上記レスポンスを返すようセット
    mDynamoDb.delete.mockImplementationOnce((_: any, callback: any) =>
      callback(null, mockResult)
    );

    // WHEN
    const params = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };

    // THEN
    await DynamodbTodoTable.deleteTodo(params);
    // 呼び出し回数確認
    expect(DYNAMO.delete).toHaveBeenCalledTimes(1);
  }, 5000);

  test("Case2: Dynamodbへdeleteした際に予期せぬエラーが発生", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // DynamoDB.DocumentClient.getのモックがExceptionをthrowするようにセット
    mDynamoDb.delete.mockImplementationOnce((_: any, callback: any) => {
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
      await DynamodbTodoTable.deleteTodo(params);
    }).rejects.toThrowError(new DynamodbError(expectedErrorMessage));
    expect(async () => {
      await DynamodbTodoTable.deleteTodo(params);
    }).rejects.toThrowError(DynamodbError);

    // 呼び出し回数確認
    expect(DYNAMO.delete).toHaveBeenCalledTimes(2);
  }, 5000);
});

describe("Dynamodb 操作用サービス データ一括取得系(listTodo)のテスト", (): void => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  test("Case1: Dynamodbへのqueryが正常に終了する場合(指定条件：Limitなし、nextTokenなし)", async () => {
    jest.resetAllMocks();
    expect.assertions(2);

    // Dynamodbから返却される想定のモックレスポンス
    const mockResult = {
      Items: [
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
          dueDate: "2019-05-31T18:24:00",
          isImportant: false,
        },
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
          dueDate: "2019-05-31T18:24:00",
          isImportant: false,
        },
      ],
    };
    // DynamoDB.DocumentClient.putのモックが、上記レスポンスを返すようセット
    mDynamoDb.query.mockImplementationOnce((_: any, callback: any) =>
      callback(null, mockResult)
    );

    // WHEN
    const params = {
      userId: "my-unit-test-user",
    };
    const expected = {
      todos: [
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
          dueDate: "2019-05-31T18:24:00",
          isImportant: false,
        },
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
          dueDate: "2019-05-31T18:24:00",
          isImportant: false,
        },
      ],
    };

    // THEN
    const actual = await DynamodbTodoTable.listTodo(params);

    // 取得結果確認
    expect(actual).toEqual(expected);
    // 呼び出し回数確認
    expect(DYNAMO.query).toHaveBeenCalledTimes(1);
  }, 5000);

  test("Case2: Dynamodbへのqueryが正常に終了する場合(指定条件：Limitあり/ 結果:LastEvaluatedKeyあり)", async () => {
    jest.resetAllMocks();
    expect.assertions(2);

    // LastEvaluateKey用にトークンを生成する
    const mockLastEvaluatedKey = {
      userId: "unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b883722213444",
    };
    const mockToken = sign(mockLastEvaluatedKey, secret);

    // Dynamodbから返却される想定のモックレスポンス
    const mockResult = {
      Items: [
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
          dueDate: "2019-05-31T18:24:00",
          isImportant: false,
        },
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
          dueDate: "2019-05-31T18:24:00",
          isImportant: false,
        },
      ],
      LastEvaluatedKey: mockLastEvaluatedKey,
    };
    // DynamoDB.DocumentClient.putのモックが、上記レスポンスを返すようセット
    mDynamoDb.query.mockImplementationOnce((_: any, callback: any) =>
      callback(null, mockResult)
    );

    // WHEN
    const params = {
      userId: "my-unit-test-user",
      limit: 2
    };
    const expected = {
      todos: [
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
          dueDate: "2019-05-31T18:24:00",
          isImportant: false,
        },
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
          dueDate: "2019-05-31T18:24:00",
          isImportant: false,
        },
      ],
      nextToken: mockToken,
    };

    // THEN
    const actual = await DynamodbTodoTable.listTodo(params);

    // 取得結果確認
    expect(actual).toEqual(expected);
    // 呼び出し回数確認
    expect(DYNAMO.query).toHaveBeenCalledTimes(1);
  }, 5000);

  test("Case3: Dynamodbへのqueryが正常に終了する場合(指定条件：nextTokenあり)", async () => {
    jest.resetAllMocks();
    expect.assertions(2);

    // LastEvaluateKey用にトークンを生成する
    const mockLastEvaluatedKey = {
      userId: "unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b883722213444",
    };
    const mockToken = sign(mockLastEvaluatedKey, secret);

    // Dynamodbから返却される想定のモックレスポンス
    const mockResult = {
      Items: [
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
          dueDate: "2019-05-31T18:24:00",
          isImportant: false,
        },
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
          dueDate: "2019-05-31T18:24:00",
          isImportant: false,
        },
      ],
    };
    // DynamoDB.DocumentClient.putのモックが、上記レスポンスを返すようセット
    mDynamoDb.query.mockImplementationOnce((_: any, callback: any) =>
      callback(null, mockResult)
    );

    // WHEN
    const params = {
      userId: "my-unit-test-user",
      nextToken: mockToken
    };
    const expected = {
      todos: [
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
          dueDate: "2019-05-31T18:24:00",
          isImportant: false,
        },
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
          dueDate: "2019-05-31T18:24:00",
          isImportant: false,
        },
      ],
    };

    // THEN
    const actual = await DynamodbTodoTable.listTodo(params);

    // 取得結果確認
    expect(actual).toEqual(expected);
    // 呼び出し回数確認
    expect(DYNAMO.query).toHaveBeenCalledTimes(1);
  }, 5000);

  test("Case4: Dynamodbへのqueryが異常終了する場合(指定条件：nextTokenあり->トークンが不正)", async () => {
    jest.resetAllMocks();
    expect.assertions(3);

    // LastEvaluateKey用にトークンを生成する
    const mockInvalidToken = 'This is invalid token'

    // DynamoDB.DocumentClient.putのモックが、上記レスポンスを返すようセット
    mDynamoDb.query.mockImplementationOnce((_: any, callback: any) =>
      callback(null, null)
    );

    // WHEN
    const params = {
      userId: "my-unit-test-user",
      nextToken: mockInvalidToken
    };
    const expectedErrorMessage = ErrorMessage.INVALID_TOKEN();

    // THEN
    // エラーメッセージと Exceptionの種類を確認
    expect(async () => {
      await DynamodbTodoTable.listTodo(params);
    }).rejects.toThrowError(new DynamodbError(expectedErrorMessage));
    expect(async () => {
      await DynamodbTodoTable.listTodo(params);
    }).rejects.toThrowError(DynamodbError);

    // 呼び出し回数確認
    expect(DYNAMO.query).toHaveBeenCalledTimes(0);
  }, 5000);

  test("Case5: Dynamodbのquery実行で予期せぬエラーが発生", async () => {
    jest.resetAllMocks();
    expect.assertions(2);

    // DynamoDB.DocumentClient.getのモックがExceptionをthrowするようにセット
    mDynamoDb.query.mockImplementationOnce((_: any, callback: any) => {
      throw new Error();
    });

    // WHEN
    const params = {
      userId: "my-unit-test-user",
    };
    const expectedErrorMessage = ErrorMessage.DYNAMODB_ERROR();
    // THEN
    // エラーメッセージと Exceptionの種類を確認
    expect(async () => {
      await DynamodbTodoTable.listTodo(params);
    }).rejects.toThrowError(new DynamodbError(expectedErrorMessage));
    expect(async () => {
      await DynamodbTodoTable.listTodo(params);
    }).rejects.toThrowError(DynamodbError);

    // 呼び出し回数確認
    expect(DYNAMO.query).toHaveBeenCalledTimes(2);
    
  }, 5000);

});
