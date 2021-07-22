import {
  TodoUseCase,
  SpecifyTodoProps,
  PutTodoProps,
} from "../../lambda/domains/todoUseCase";

import {
  ErrorMessage,
  NotFoundError,
  DynamodbError,
} from "../../lambda/domains/errorUseCase";
import {
  DeleteTodoInDynamodbProps,
  DynamodbTodoTable,
} from "../../lambda/infrastructures/dynamodbTodoTable";
import { CognitoUserPool } from "../../lambda/infrastructures/cognito";

// Dynamodb関連処理をモック化する
jest.mock("../../lambda/infrastructures/dynamodbTodoTable");
// const MockDynamodbTodoTable = DynamodbTodoTable as unknown as jest.Mock
// 認証関連は全てモック化しておく
jest.mock("../../lambda/infrastructures/cognito");

describe("特定のTodo取得ユースケースのテスト", (): void => {
  test("Case1: Todoが正常に1件取得成功", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する

    const mockGetTodo = jest.fn();
    mockGetTodo.mockReturnValue({
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "Todo内容",
      dueDate: "2019-05-31T18:24:00",
      isImportant: false,
    });

    DynamodbTodoTable.getTodoItem = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: SpecifyTodoProps = {
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };
    const expected = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "Todo内容",
      dueDate: "2019-05-31T18:24:00",
      isImportant: false,
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.getSpecificTodo(params)).resolves.toEqual(
      expected
    );
  });
  test("Case2: Todoが正常に1件取得成功(値が全部空)", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する

    const mockGetTodo = jest.fn();
    mockGetTodo.mockReturnValue({
      userId: "",
      todoId: "",
      title: "",
      content: "",
      dueDate: "",
      isImportant: false,
    });

    DynamodbTodoTable.getTodoItem = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: SpecifyTodoProps = {
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };
    const expected = {
      userId: "",
      todoId: "",
      title: "",
      content: "",
      dueDate: "",
      isImportant: false,
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.getSpecificTodo(params)).resolves.toEqual(
      expected
    );
  });

  test("Case3: Dynamodbからの取得結果が0件", async () => {
    jest.resetAllMocks();
    expect.assertions(2);

    // Dynamodb関連処理をモック化する
    const mockGetTodo = jest.fn();
    mockGetTodo.mockReturnValue(undefined); // DBから返ってくる
    DynamodbTodoTable.getTodoItem = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: SpecifyTodoProps = {
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };
    const expectedErrorMessage = ErrorMessage.NOT_FOUND(
      "todoId: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    );
    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.getSpecificTodo(params)).rejects.toThrowError(
      new NotFoundError(expectedErrorMessage)
    );
    await expect(todoUseCase.getSpecificTodo(params)).rejects.toThrowError(
      NotFoundError
    );
  });
});

describe("Todo 登録/更新系ユースケースのテスト", (): void => {
  test("Case1: Todoが正常に1件登録成功", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する
    const mockPutTodo = jest.fn();
    DynamodbTodoTable.putTodoItem = mockPutTodo.bind(DynamodbTodoTable);
    CognitoUserPool.getUserNameFromIdToken = jest
      .fn()
      .mockReturnValue("my-unittest-user");

    // WHEN
    const params: PutTodoProps = {
      title: "タイトル",
      content: "Todo内容",
      dueDate: "2019-05-31T18:24:00",
      isImportant: false,
    };
    const expected = {
      userId: "my-unittest-user",
      todoId: expect.any(String),
      title: "タイトル",
      content: "Todo内容",
      dueDate: "2019-05-31T18:24:00",
      isImportant: false,
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.putTodo(params)).resolves.toEqual(expected);
  });

  test("Case2: userIdとtodoId以外空で正常に1件登録成功", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する
    const mockPutTodo = jest.fn();
    DynamodbTodoTable.putTodoItem = mockPutTodo.bind(DynamodbTodoTable);
    CognitoUserPool.getUserNameFromIdToken = jest
      .fn()
      .mockReturnValue("my-unittest-user");

    // WHEN
    const params: PutTodoProps = {
      title: "",
      content: "",
      dueDate: "",
      isImportant: undefined,
    };
    const expected = {
      userId: "my-unittest-user",
      todoId: expect.any(String),
      title: "",
      content: "",
      dueDate: "",
      isImportant: false,
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.putTodo(params)).resolves.toEqual(expected);
  });

  test("Case3: TodoIdを引数に指定し、更新されるパターン", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する
    const mockPutTodo = jest.fn();
    DynamodbTodoTable.putTodoItem = mockPutTodo.bind(DynamodbTodoTable);
    CognitoUserPool.getUserNameFromIdToken = jest
      .fn()
      .mockReturnValue("my-unittest-user");

    // WHEN
    const params: PutTodoProps = {
      todoId: "MyTodoId",
      title: "タイトル",
      content: "Todo内容",
      dueDate: "2019-05-31T18:24:00",
      isImportant: false,
    };
    const expected = {
      userId: "my-unittest-user",
      todoId: "MyTodoId",
      title: "タイトル",
      content: "Todo内容",
      dueDate: "2019-05-31T18:24:00",
      isImportant: false,
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.putTodo(params)).resolves.toEqual(expected);
  });
});

describe("Todo 削除ユースケースのテスト", (): void => {
  test("Case1: Todoが正常に1件削除成功", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する
    const mockDeleteTodo = jest.fn();
    mockDeleteTodo.mockReturnValue(undefined);
    DynamodbTodoTable.deleteTodoItem = mockDeleteTodo.bind(DynamodbTodoTable);
    const mockGetTodo = jest.fn();
    mockGetTodo.mockReturnValue({
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "Todo内容",
      dueDate: "2019-05-31T18:24:00",
      isImportant: false,
    });
    DynamodbTodoTable.getTodoItem = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: DeleteTodoInDynamodbProps = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.deleteTodo(params)).resolves.toEqual(undefined);
  });
  test("Case2: 削除対象のTodoが見つからない", async () => {
    jest.resetAllMocks();
    expect.assertions(2);

    // Dynamodb関連処理をモック化する
    const mockGetTodo = jest.fn();
    mockGetTodo.mockReturnValue(undefined);
    DynamodbTodoTable.getTodoItem = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: DeleteTodoInDynamodbProps = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    expect(async () => {
      await todoUseCase.deleteTodo(params);
    }).rejects.toThrowError(
      new NotFoundError(
        ErrorMessage.NOT_FOUND(`todoId: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`)
      )
    );
    expect(
      async () => await todoUseCase.deleteTodo(params)
    ).rejects.toThrowError(NotFoundError);
  });
});

describe("Todo Todo一括取得のユースケースのテスト", (): void => {
  test("Case1: Todoが正常に指定した件数取得できる", async () => {
    jest.resetAllMocks();
    expect.assertions(1);

    // Dynamodb関連処理をモック化する
    const mockListTodo = jest.fn();
    mockListTodo.mockReturnValue(undefined);
    DynamodbTodoTable.listTodoItems = mockListTodo.bind(DynamodbTodoTable);

    // WHEN
    const params = {
      limit: 10,
      nextToken: "next token like jwt",
    };

    // THEN
    const todoUseCase = new TodoUseCase("dummyToken");
    await expect(todoUseCase.listTodos(params)).resolves.toEqual(undefined);
  });
});
