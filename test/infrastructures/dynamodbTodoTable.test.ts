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
      },
    };
    // DynamoDB.DocumentClient.getのモックが、上記レスポンスを返すようセット
    mDynamoDb.get.mockReturnValue(
      new Promise((resolve, reject) => {
        resolve(mockResult);
      })
    );

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
    mDynamoDb.get.mockReturnValue(
      new Promise((resolve, reject) => {
        resolve(mockResult);
      })
    );

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
    mDynamoDb.get.mockReturnValue(
      new Promise((resolve, reject) => {
        throw new Error();
      })
    );

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
    // DynamoDB.DocumentClient.putのモックが、上記レスポンスを返すようセット
    mDynamoDb.put.mockReturnValue(
      new Promise((resolve, reject) => {
        resolve(null);
      })
    );

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

    // DynamoDB.DocumentClient.getのモックがExceptionをthrowするようにセット
    mDynamoDb.put.mockReturnValue(
      new Promise((resolve, reject) => {
        throw new Error();
      })
    );

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
    // DynamoDB.DocumentClient.putのモックが、上記レスポンスを返すようセット
    mDynamoDb.delete.mockReturnValue(
      new Promise((resolve, reject) => {
        resolve(null);
      })
    );

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

    // DynamoDB.DocumentClient.getのモックがExceptionをthrowするようにセット
    mDynamoDb.delete.mockReturnValue(
      new Promise((resolve, reject) => {
        throw Error();
      })
    );

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
        },
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
        },
      ],
    };
    // DynamoDB.DocumentClient.putのモックが、上記レスポンスを返すようセット
    mDynamoDb.query.mockReturnValue(
      new Promise((resolve, reject) => {
        resolve(mockResult);
      })
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
        },
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
        },
      ],
    };

    // THEN
    const actual = await DynamodbTodoTable.listTodoItems(params);

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
        },
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
        },
      ],
      LastEvaluatedKey: mockLastEvaluatedKey,
    };
    // DynamoDB.DocumentClient.putのモックが、上記レスポンスを返すようセット
    mDynamoDb.query.mockReturnValue(
      new Promise((resolve, reject) => {
        resolve(mockResult);
      })
    );

    // WHEN
    const params = {
      userId: "my-unit-test-user",
      limit: 2,
    };
    const expected = {
      todos: [
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
        },
        {
          userId: "my-unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
        },
      ],
      nextToken: mockToken,
    };

    // THEN
    const actual = await DynamodbTodoTable.listTodoItems(params);

    // 取得結果確認
    expect(actual).toEqual(expected);
    // 呼び出し回数確認
    expect(DYNAMO.query).toHaveBeenCalledTimes(1);
  }, 5000);

  test("Case3-1: Dynamodbへのqueryが正常に終了する場合(指定条件：nextTokenあり)", async () => {
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
          userId: "unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
        },
        {
          userId: "unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
        },
      ],
    };
    // DynamoDB.DocumentClient.putのモックが、上記レスポンスを返すようセット
    mDynamoDb.query.mockReturnValue(
      new Promise((resolve, reject) => {
        resolve(mockResult);
      })
    );

    // WHEN
    const params = {
      userId: "unit-test-user",
      nextToken: mockToken,
    };
    const expected = {
      todos: [
        {
          userId: "unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
        },
        {
          userId: "unit-test-user",
          todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "タイトル",
          content: "内容",
        },
      ],
    };

    // THEN
    const actual = await DynamodbTodoTable.listTodoItems(params);

    // 取得結果確認
    expect(actual).toEqual(expected);
    // 呼び出し回数確認
    expect(DYNAMO.query).toHaveBeenCalledTimes(1);
  }, 5000);
  test("Case3-2: Dynamodbへのqueryが正常に終了する場合(指定条件：nextTokenのユーザId不正)", async () => {
    jest.resetAllMocks();
    expect.assertions(3);

    // LastEvaluateKey用にトークンを生成する
    const mockLastEvaluatedKey = {
      userId: "someones-token",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b883722213444",
    };
    const mockToken = sign(mockLastEvaluatedKey, secret);

    // Dynamodbから返却される想定のモックレスポンス
    mDynamoDb.query.mockReturnValue(
      new Promise((resolve, reject) => {
        resolve(undefined);
      })
    );

    // WHEN
    const params = {
      userId: "unit-test-user",
      nextToken: mockToken,
    };

    // THEN
    const expectedErrorMessage = ErrorMessage.INVALID_TOKEN();

    // THEN
    // エラーメッセージと Exceptionの種類を確認
    expect(async () => {
      await DynamodbTodoTable.listTodoItems(params);
    }).rejects.toThrowError(new DynamodbError(expectedErrorMessage));
    expect(async () => {
      await DynamodbTodoTable.listTodoItems(params);
    }).rejects.toThrowError(DynamodbError);

    // 呼び出し回数確認
    expect(DYNAMO.query).toHaveBeenCalledTimes(0);
  }, 5000);
  test("Case4: Dynamodbへのqueryが異常終了する場合(指定条件：nextTokenあり->トークンが不正)", async () => {
    jest.resetAllMocks();
    expect.assertions(3);

    // LastEvaluateKey用にトークンを生成する
    const mockInvalidToken = "This is invalid token";

    // DynamoDB.DocumentClient.putのモックが、上記レスポンスを返すようセット
    mDynamoDb.query.mockReturnValue(
      new Promise((resolve, reject) => {
        resolve(null);
      })
    );

    // WHEN
    const params = {
      userId: "my-unit-test-user",
      nextToken: mockInvalidToken,
    };
    const expectedErrorMessage = ErrorMessage.INVALID_TOKEN();

    // THEN
    // エラーメッセージと Exceptionの種類を確認
    expect(async () => {
      await DynamodbTodoTable.listTodoItems(params);
    }).rejects.toThrowError(new DynamodbError(expectedErrorMessage));
    expect(async () => {
      await DynamodbTodoTable.listTodoItems(params);
    }).rejects.toThrowError(DynamodbError);

    // 呼び出し回数確認
    expect(DYNAMO.query).toHaveBeenCalledTimes(0);
  }, 5000);

  test("Case5: Dynamodbのquery実行で予期せぬエラーが発生", async () => {
    jest.resetAllMocks();
    expect.assertions(3);

    // DynamoDB.DocumentClient.getのモックがExceptionをthrowするようにセット
    mDynamoDb.query.mockReturnValue(
      new Promise((resolve, reject) => {
        throw new Error();
      })
    );

    // WHEN
    const params = {
      userId: "my-unit-test-user",
    };
    const expectedErrorMessage = ErrorMessage.DYNAMODB_ERROR();
    // THEN
    // エラーメッセージと Exceptionの種類を確認
    expect(async () => {
      await DynamodbTodoTable.listTodoItems(params);
    }).rejects.toThrowError(new DynamodbError(expectedErrorMessage));
    expect(async () => {
      await DynamodbTodoTable.listTodoItems(params);
    }).rejects.toThrowError(DynamodbError);

    // 呼び出し回数確認
    expect(DYNAMO.query).toHaveBeenCalledTimes(2);
  }, 5000);
});
