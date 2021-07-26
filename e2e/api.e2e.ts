import * as aws from "aws-sdk";
import axios from "axios";
import * as environment from "../lib/environment";

// AWS SDKを初期化
aws.config.update({
  region: "ap-northeast-1",
});
const cognito = new aws.CognitoIdentityServiceProvider({
  apiVersion: "2016-04-18",
});
const ssm = new aws.SSM({
  region: "ap-northeast-1",
});

// 環境変数から必要情報を取得
const TEST_ENV = process.env.TEST_ENV;
const environmentVariables = environment.getVariablesOf(
  TEST_ENV as environment.Environments
);
const projectName = environmentVariables.projectName;

// ユーザのセットアップで使用する情報を初期化
let userPoolId: string | undefined = undefined;
let apiUrl: string | undefined = undefined;
const now = new Date();
const userName =
  "my-e2e-test-user-on-" +
  now.getFullYear().toString().padStart(4, "0") +
  (now.getMonth() + 1).toString().padStart(2, "0") + // 0 ~ 11 を返すので1足す
  now.getDate().toString().padStart(2, "0") +
  now.getHours().toString().padStart(2, "0") +
  now.getMinutes().toString().padStart(2, "0") +
  now.getSeconds().toString().padStart(2, "0");
const password = "Passw0rd!";
let idToken: string | undefined = undefined;
let testTodos = new Map();

// テスト実行時の設定
// 非同期処理や待ちが多いのでタイムアウトを増やす
jest.setTimeout(60000);

/**
 * todo「オブジェクト」の配列をソートする際に使用する比較関数
 * @param {*} a
 * @param {*} b
 * @return {*}
 */
const todoSort = (a: any, b: any) => {
  // Use toUpperCase() to ignore character casing
  const todoIdA = a.todoId.toUpperCase();
  const todoIdB = b.todoId.toUpperCase();

  let comparison = 0;
  if (todoIdA > todoIdB) {
    comparison = 1;
  } else if (todoIdA < todoIdB) {
    comparison = -1;
  }
  return comparison;
};

// E2Eテストの定義をいかに書いていく
describe("Todo管理APIのE2Eテスト", (): void => {
  // テスト開始前に、テストで使用するユーザの新規登録を行う
  beforeAll(async () => {
    try {
      // パラメータストアからテスト対象の環境情報を取得
      const userPoolIdParam = await ssm
        .getParameter({
          Name: `/${projectName}/${TEST_ENV}/UserPoolId`,
        })
        .promise();
      const apiUrlParam = await ssm
        .getParameter({
          Name: `/${projectName}/${TEST_ENV}/ApiUrl`,
        })
        .promise();
      userPoolId = userPoolIdParam.Parameter?.Value;
      apiUrl = apiUrlParam.Parameter?.Value;

      if (!userPoolId || !apiUrl) {
        throw Error(
          "パラメータストアから必要情報が取得できず、E2Eテストは失敗"
        );
      }

      // ユーザ作成
      console.log("ユーザ登録 開始");
      const user = await cognito
        .adminCreateUser({
          UserPoolId: userPoolId,
          Username: userName,
        })
        .promise();
      console.log("ユーザ登録 完了", JSON.stringify(user, null, 4));

      // パスワード変更、ユーザ有効化
      console.log("パスワード変更 開始");
      await cognito
        .adminSetUserPassword({
          UserPoolId: userPoolId,
          Username: userName,
          Password: password,
          Permanent: true,
        })
        .promise();
      console.log("パスワード変更 完了");
    } catch (e) {
      console.log("E2Eテスト前処理で例外発生:", e);
    }
  });

  // テスト終了後、使用するユーザの削除を行う
  afterAll(async () => {
    try {
      if (!userPoolId) {
        throw Error(
          "パラメータストアからUserPoolIdの取得できず、E2Eテストは失敗"
        );
      }

      //   console.log("ユーザ削除 開始");
      await cognito
        .adminDeleteUser({
          UserPoolId: userPoolId,
          Username: userName,
        })
        .promise();
      //   console.log("ユーザ削除 完了");
    } catch (e) {
      console.log("E2Eテスト後処理で例外発生:", e);
    }
  });

  test("[認証]Case1: 認証用APIを実行し正常に IdTokenが取得できる", async () => {
    expect.assertions(1);

    // WHEN
    const endpoint = apiUrl + "auth/token";
    const response = await axios.post(endpoint, {
      userId: userName,
      password: password,
    });

    console.log("取得した IdToken:", response);
    // この後のケースでこのトークンを使い回す
    idToken = response.data.idToken;

    // THEN
    expect(response.data).toEqual({
      idToken: expect.any(String),
    });
  });
  test("[認証]Case2: トークンが無い状態で各APIを呼んで認証エラーになること", async () => {
    // 未実装
  });

  test("[登録→取得→検索]Case1: Todo登録APIでTodoを 3件 登録", async () => {
    expect.assertions(3);

    // WHEN
    const dataSet = [
      {
        key: "Todo1",
        todo: {
          title: "動物園に行って見るもの",
          content: "キリン・象・サイ・哺乳類全般",
        },
      },
      {
        key: "Todo2",
        todo: {
          title: "夏休みに行く場所",
          content: "動物園、アンパンマンミュージアム",
        },
      },
      {
        key: "Todo3",
        todo: {
          title: "スーパーで買うもの",
          content: "ネギ、玉ねぎ、長ネギ、ニラ",
        },
      },
    ];

    for (const data of dataSet) {
      const endpoint = apiUrl + "todos";
      const expected = {
        userId: userName,
        todoId: expect.any(String),
        updatedDate: expect.any(String),
        title: data.todo.title,
        content: data.todo.content,
      };

      const response = await axios.post(endpoint, data.todo, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      console.log("登録したTodoのResponse", response.data);

      // あとで使うのでTodoデータを格納しておく
      testTodos.set(data.key, response.data);
      // THEN
      expect(response.data).toEqual(expected);
    }
  });

  // 以下から各テストケースの実装開始
  test("[登録→取得→検索]Case2: Todo取得APIで指定した 1件 を取得(Todo1)", async () => {
    expect.assertions(1);

    //WHEN
    const todo1 = testTodos.get("Todo1");
    const endpoint = apiUrl + `todos/${todo1.todoId}`;

    const expected = {
      userId: userName,
      todoId: todo1.todoId,
      updatedDate: expect.any(String),
      title: todo1.title,
      content: todo1.content,
    };

    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    console.log("1件指定で取得したTodoのResponse", response.data);
    expect(response.data).toEqual(expected);
  });

  test("[登録→取得→検索]Case3: Todo検索APIで全件 3件 を取得", async () => {
    expect.assertions(1);

    // Index作成を8秒くらいまつ
    await new Promise((resolve) => setTimeout(resolve, 10000));

    //WHEN
    const endpoint = apiUrl + `todos`;
    const expected = {
      totalCount: 3,
      todos: [
        {
          userId: userName,
          todoId: testTodos.get("Todo1").todoId,
          updatedDate: testTodos.get("Todo1").updatedDate,
          title: testTodos.get("Todo1").title,
          content: testTodos.get("Todo1").content,
        },
        {
          userId: userName,
          todoId: testTodos.get("Todo2").todoId,
          updatedDate: testTodos.get("Todo2").updatedDate,
          title: testTodos.get("Todo2").title,
          content: testTodos.get("Todo2").content,
        },
        {
          userId: userName,
          todoId: testTodos.get("Todo3").todoId,
          updatedDate: testTodos.get("Todo3").updatedDate,
          title: testTodos.get("Todo3").title,
          content: testTodos.get("Todo3").content,
        },
      ],
    };

    console.log("api url:", endpoint);

    let response;
    try {
      response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      console.log("検索APIで取得したTodoのResponse", response.data);
    } catch (e) {
      console.log(e);
    }

    // 帰ってくるtodoの順番が違うので、ソートして比較
    const sortedResponse = {
      totalCount: response?.data.totalCount,
      todos: response?.data.todos.sort(todoSort),
    };
    const sortedExpected = {
      totalCount: expected.totalCount,
      todos: expected.todos.sort(todoSort),
    };

    expect(sortedResponse).toEqual(sortedExpected);
  }, 20000);

  test("[登録→取得→検索]Case4: Todo検索APIで指定した条件 「動物」 で 2件 を取得(Todo1,Todo2)", async () => {
    expect.assertions(1);

    // Index作成を8秒くらいまつ
    await new Promise((resolve) => setTimeout(resolve, 10000));

    //WHEN
    const endpoint = apiUrl + `todos`;
    const expected = {
      totalCount: 2,
      todos: [
        {
          userId: userName,
          todoId: testTodos.get("Todo1").todoId,
          updatedDate: testTodos.get("Todo1").updatedDate,
          title: testTodos.get("Todo1").title,
          content: testTodos.get("Todo1").content,
        },
        {
          userId: userName,
          todoId: testTodos.get("Todo2").todoId,
          updatedDate: testTodos.get("Todo2").updatedDate,
          title: testTodos.get("Todo2").title,
          content: testTodos.get("Todo2").content,
        },
      ],
    };

    console.log("api url:", endpoint);
    let response;
    try {
      response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        params: {
          q: "動物",
        },
      });
      console.log("検索APIで取得したTodoのResponse", response.data);
    } catch (e) {
      console.log(e);
    }
    // 帰ってくる順番が違うので、ソートして比較
    const sortedResponse = {
      totalCount: response?.data.totalCount,
      todos: response?.data.todos.sort(todoSort),
    };
    const sortedExpected = {
      totalCount: expected.totalCount,
      todos: expected.todos.sort(todoSort),
    };

    expect(sortedResponse).toEqual(sortedExpected);
  }, 20000);

  test("[更新→取得→検索]Case1: Todo更新APIで1件 を更新(Todo2: 動物園->水族館)", async () => {
    expect.assertions(1);

    //WHEN
    const todo2 = testTodos.get("Todo2");
    const endpoint = apiUrl + `todos/${todo2.todoId}`;
    const params = {
      title: todo2.title,
      content: "水族館へいく",
    };

    const expected = {
      userId: userName,
      todoId: todo2.todoId,
      updatedDate: expect.any(String),
      title: todo2.title,
      content: "水族館へいく",
    };

    const response = await axios.put(endpoint, params, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    testTodos.set("Todo2", response.data);

    console.log("1件指定で更新したTodoのResponse", response.data);
    expect(response.data).toEqual(expected);
  });

  test("[更新→取得→検索]Case2: Todo取得APIで上で更新した 1件 を取得(Todo2)", async () => {
    expect.assertions(1);

    //WHEN
    const todo2 = testTodos.get("Todo2");
    const endpoint = apiUrl + `todos/${todo2.todoId}`;

    const expected = {
      userId: userName,
      todoId: todo2.todoId,
      updatedDate: expect.any(String),
      title: todo2.title,
      content: todo2.content,
    };

    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    console.log("1件指定で取得したTodoのResponse", response.data);
    expect(response.data).toEqual(expected);
  });

  test("[更新→取得→検索]Case3: Todo検索APIで指定した条件 「動物」 で 1件 を取得(Todo1)", async () => {
    expect.assertions(1);

    // Index作成を8秒くらいまつ
    await new Promise((resolve) => setTimeout(resolve, 10000));

    //WHEN
    const endpoint = apiUrl + `todos`;
    const expected = {
      totalCount: 1,
      todos: [
        {
          userId: userName,
          todoId: testTodos.get("Todo1").todoId,
          updatedDate: expect.any(String),
          title: testTodos.get("Todo1").title,
          content: testTodos.get("Todo1").content,
        },
      ],
    };

    console.log("api url:", endpoint);
    let response;
    try {
      response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        params: {
          q: "動物",
        },
      });
      console.log("検索APIで取得したTodoのResponse", response.data);
    } catch (e) {
      console.log(e);
    }
    // 帰ってくる順番が違うので、ソートして比較
    const sortedResponse = {
      totalCount: response?.data.totalCount,
      todos: response?.data.todos.sort(todoSort),
    };
    const sortedExpected = {
      totalCount: expected.totalCount,
      todos: expected.todos.sort(todoSort),
    };

    expect(sortedResponse).toEqual(sortedExpected);
  }, 20000);

  test("[削除→取得→検索]Case1: Todo削除APIで指定した 3件 を削除(Todo1,Todo2,Todo3)", async () => {
    expect.assertions(3);

    for (const [k, todo] of testTodos) {
      console.log("削除対象Todo:", JSON.stringify(todo));

      //WHEN
      let response;
      const endpoint = apiUrl + `todos/${todo.todoId}`;
      const expected = 200;

      try {
        response = await axios.delete(endpoint, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
      } catch (e) {
        console.log("todo削除で例外");
        console.error(e);
      }

      console.log("1件指定で削除したTodoのResponseのstatus:", response?.status);
      expect(response?.status).toEqual(expected);
    }
  });

  test("[削除→取得→検索]Case2: Todo取得APIで指定した 1件 を取得(Todo3)", async () => {
    expect.assertions(2);

    //WHEN
    const todo3 = testTodos.get("Todo3");
    const endpoint = apiUrl + `todos/${todo3.todoId}`;

    const expectedData = {
      message: `todoId: ${todo3.todoId} は見つかりませんでした`,
    };
    const expectedStatus = 404;
    let actualData = undefined;
    let actualStatus = undefined;
    try {
      await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
    } catch (e) {
      //404をaxiosが返す想定
      actualData = e.response.data;
      actualStatus = e.response.status;
    }
    expect(actualData).toEqual(expectedData);
    expect(actualStatus).toEqual(expectedStatus);
  });

  test("[削除→取得→検索]Case3: Todo検索APIで全件指定 1件も取れないこと", async () => {
    expect.assertions(1);

    // Index作成を8秒くらいまつ
    await new Promise((resolve) => setTimeout(resolve, 10000));

    //WHEN
    const endpoint = apiUrl + `todos`;
    const expected = {
      totalCount: 0,
      todos: [],
    };

    console.log("api url:", endpoint);
    let response;
    try {
      response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      console.log("検索APIで取得したTodoのResponse", response.data);
    } catch (e) {
      console.log(e);
    }

    expect(response?.data).toEqual(expected);
  }, 20000);
});
