import { TodoUseCase, SpecifyTodoProps, CreateTodoProps } from "../../lambda/domains/todoUseCase";

import {
  ErrorMessage,
  NotFoundError,
  DynamodbError,
} from "../../lambda/domains/errorUseCase";
import {DynamodbTodoTable} from "../../lambda/infrastructures/dynamodbTodoTable";



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

    DynamodbTodoTable.getTodo = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: SpecifyTodoProps = {
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    }
    const expected = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "Todo内容",
      dueDate: "2019-05-31T18:24:00",
      isImportant: false,
    }

    // THEN
    const todoUseCase = new TodoUseCase('dummyToken')
    await expect(todoUseCase.getSpecificTodo(params)).resolves.toEqual(expected);
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

    DynamodbTodoTable.getTodo = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: SpecifyTodoProps = {
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    }
    const expected = {
      userId: "",
      todoId: "",
      title: "",
      content: "",
      dueDate: "",
      isImportant: false,
    }

    // THEN
    const todoUseCase = new TodoUseCase('dummyToken')
    await expect(todoUseCase.getSpecificTodo(params)).resolves.toEqual(expected);
  });

  test("Case3: Dynamodbからの取得結果が0件", async () => {
    jest.resetAllMocks();
    expect.assertions(2);

    // Dynamodb関連処理をモック化する
    const mockGetTodo = jest.fn();
    mockGetTodo.mockReturnValue(undefined);　// DBから返ってくる
    DynamodbTodoTable.getTodo = mockGetTodo.bind(DynamodbTodoTable);

    // WHEN
    const params: SpecifyTodoProps = {
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    }
    const expected = {
      userId: "my-unit-test-user",
      todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "タイトル",
      content: "Todo内容",
      dueDate: "2019-05-31T18:24:00",
      isImportant: false,
    }
    const expectedErrorMessage = ErrorMessage.NOT_FOUND('todoId: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');

    // THEN
    const todoUseCase = new TodoUseCase('dummyToken')
    await expect(todoUseCase.getSpecificTodo(params)).rejects.toThrowError(new NotFoundError(expectedErrorMessage));
    await expect(todoUseCase.getSpecificTodo(params)).rejects.toThrowError(NotFoundError);

  });


  describe("Todo 登録系ユースケースのテスト", (): void => {
    test("Case1: Todoが正常に1件登録成功", async () => {
      jest.resetAllMocks();
      expect.assertions(1);
  
      // Dynamodb関連処理をモック化する
  
      const mockPutTodo = jest.fn();  
      DynamodbTodoTable.putTodo = mockPutTodo.bind(DynamodbTodoTable);
  
      // WHEN
      const params: CreateTodoProps = {
        title: "タイトル",
        content: "Todo内容",
        dueDate: "2019-05-31T18:24:00",
        isImportant: false,
      }
      const expected = {
        userId: undefined,
        todoId: expect.any(String),
        title: "タイトル",
        content: "Todo内容",
        dueDate: "2019-05-31T18:24:00",
        isImportant: false,
      }
  
      // THEN
      const todoUseCase = new TodoUseCase('dummyToken')
      await expect(todoUseCase.createTodo(params)).resolves.toEqual(expected);
    });

    test("Case2: userIdとtodoId以外空で正常に1件登録成功", async () => {
      jest.resetAllMocks();
      expect.assertions(1);
  
      // Dynamodb関連処理をモック化する
  
      const mockPutTodo = jest.fn();  
      DynamodbTodoTable.putTodo = mockPutTodo.bind(DynamodbTodoTable);
  
      // WHEN
      const params: CreateTodoProps = {
        title: "",
        content: "",
        dueDate: "",
        isImportant: undefined,
      }
      const expected = {
        userId: undefined,
        todoId: expect.any(String),
        title: "",
        content: "",
        dueDate: "",
        isImportant: false,
      }
  
      // THEN
      const todoUseCase = new TodoUseCase('dummyToken')
      await expect(todoUseCase.createTodo(params)).resolves.toEqual(expected);
    });

    // test("Case2: Todoが正常に1件取得成功(値が全部空)", async () => {
    //   jest.resetAllMocks();
    //   expect.assertions(1);
  
    //   // Dynamodb関連処理をモック化する
  
    //   const mockGetTodo = jest.fn();
    //   mockGetTodo.mockReturnValue({
    //     userId: "",
    //     todoId: "",
    //     title: "",
    //     content: "",
    //     dueDate: "",
    //     isImportant: false,
    //   });
  
    //   DynamodbTodoTable.getTodo = mockGetTodo.bind(DynamodbTodoTable);
  
    //   // WHEN
    //   const params: SpecifyTodoProps = {
    //     todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    //   }
    //   const expected = {
    //     userId: "",
    //     todoId: "",
    //     title: "",
    //     content: "",
    //     dueDate: "",
    //     isImportant: false,
    //   }
  
    //   // THEN
    //   const todoUseCase = new TodoUseCase('dummyToken')
    //   await expect(todoUseCase.getSpecificTodo(params)).resolves.toEqual(expected);
    // });
  
    // test("Case3: Dynamodbからの取得結果が0件", async () => {
    //   jest.resetAllMocks();
    //   expect.assertions(2);
  
    //   // Dynamodb関連処理をモック化する
    //   const mockGetTodo = jest.fn();
    //   mockGetTodo.mockReturnValue(undefined);　// DBから返ってくる
    //   DynamodbTodoTable.getTodo = mockGetTodo.bind(DynamodbTodoTable);
  
    //   // WHEN
    //   const params: SpecifyTodoProps = {
    //     todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    //   }
    //   const expected = {
    //     userId: "my-unit-test-user",
    //     todoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    //     title: "タイトル",
    //     content: "Todo内容",
    //     dueDate: "2019-05-31T18:24:00",
    //     isImportant: false,
    //   }
    //   const expectedErrorMessage = ErrorMessage.NOT_FOUND('todoId: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
  
    //   // THEN
    //   const todoUseCase = new TodoUseCase('dummyToken')
    //   await expect(todoUseCase.getSpecificTodo(params)).rejects.toThrowError(new NotFoundError(expectedErrorMessage));
    //   await expect(todoUseCase.getSpecificTodo(params)).rejects.toThrowError(NotFoundError);
  
    });
  

});
