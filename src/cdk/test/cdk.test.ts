import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
  haveResource,
  countResources,
  ResourcePart,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as Cdk from "../lib/app-stack";
import * as environment from "../lib/environment";
import { Authentication } from "../lib/construct/authentication";
import { generateResourceName } from "../lib/utility";

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

  // 環境変数を取得
  const environmentVariables = environment.getVariablesOf(env);
  const projectName = environmentVariables.projectName;

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
      new Authentication(
        stack,
        "MyAuthenticationConstruct",
        {environmentVariables: environmentVariables}
      );
      // THEN
      expectCDK(stack).to(
        haveResource("AWS::Cognito::UserPool", {
          UserPoolName: generateResourceName(projectName, "UserPool", env),
          AdminCreateUserConfig: { AllowAdminCreateUserOnly: false },
        })
      );
      expectCDK(stack).to(
        haveResource(
          "AWS::Cognito::UserPool",
          {
            DeletionPolicy: "Retain", // 事故防止
          },
          ResourcePart.CompleteDefinition
        )
      );
      expectCDK(stack).to(
        haveResource("AWS::Cognito::UserPoolClient", {
          ClientName: generateResourceName(projectName, "Client", env),
        })
      );
    }
  );

}
