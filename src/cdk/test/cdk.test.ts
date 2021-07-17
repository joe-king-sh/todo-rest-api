import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
  haveResource,
  countResources,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as Cdk from "../lib/app-stack";
import * as environment from "../lib/environment";
import { Authentication } from "../lib/construct/authentication";

/**
 * テスト用のヘルパー関数
 */
const generateCaseName = (env: string, caseName: string) => {
  return `[実行環境:${env}] ${caseName}`;
};

/**
 * 各環境毎に生成されるテンプレートが異なるので、各環境分テストを回す
 */
for (const env of Object.values(environment.Environments)) {
  console.log(`${env} 環境のテスト 開始`);

  // 環境変数を取得
  const environmentVariables = environment.getVariablesOf(env);

  /**
   * Stackレベルでのテスト
   * テストの粒度：
   * 　生成したCfnテンプレートに意図した個数Resourceが存在することをテストする
   */
  test(generateCaseName(env, "Stack case1: エントリポイントのテスト"), () => {
    const app = new cdk.App();

    // WHEN
    const stack = new Cdk.AppStack(app, "MyTestAppStack", environmentVariables);

    // THEN
    expectCDK(stack).to(haveResource("AWS::Cognito::UserPool", {}));
    expectCDK(stack).to(countResources("AWS::Cognito::UserPool", 1));
  });

  /**
   * Constructレベルでのテスト
   * テストの粒度：
   * 　生成したCfnテンプレートに意図したプロパティが存在するかをテストする
   */
  test(
    generateCaseName(env, "Construct case1: 認証関連リソースのテスト"),
    () => {
      const stack = new cdk.Stack();

      // WHEN
      new Authentication(stack, "MyAuthenticationConstruct", {
        userPoolProps: {
          userPoolName: "MyUserPool",
        },
      });
      // THEN
      expectCDK(stack).to(
        haveResource("AWS::Cognito::UserPool", {
          UserPoolName: "MyUserPool",
        })
      );
    }
  );

  console.log(`${env} 環境のテスト 終了`);
}

// TODO まだ実装していない観点のテスト　Outputが適切にあるかどうか？