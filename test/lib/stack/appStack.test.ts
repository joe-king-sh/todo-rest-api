import { expect as expectCDK, countResources } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as AppStack from "../../../lib/stack/appStack";
import * as environment from "../../../lib/environment";
import { buildTestCaseName } from "../../testUtil";

/**
 * 各環境毎に生成されるテンプレートが異なるので、各環境分テストを回す
 */
for (const env of Object.values(environment.Environments)) {
  // 環境変数を取得
  const environmentVariables = environment.getVariablesOf(env);

  describe(
    buildTestCaseName(env, "AppStackのスタックレベルでのテスト"),
    (): void => {
      /**
       * Stackレベルでのテスト
       * テストの粒度：
       * 　生成したCfnテンプレートに意図した個数Resourceが存在することをテストする
       */
      test(
        buildTestCaseName(
          env,
          "Stack case1: AppStackに含まれるリソースの数のテスト"
        ),
        () => {
          const app = new cdk.App();

          // WHEN
          const stack = new AppStack.AppStack(
            app,
            "MyTestAppStack",
            environmentVariables
          );

          // THEN
          expectCDK(stack).to(countResources("AWS::Cognito::UserPool", 1));
          expectCDK(stack).to(
            countResources("AWS::Cognito::UserPoolClient", 1)
          );
          // expectCDK(stack).to(
          //   countResources("AWS::Cognito::UserPoolDomain", 1)
          // );

          expectCDK(stack).to(countResources("AWS::DynamoDB::Table", 1));
          expectCDK(stack).to(countResources("AWS::Lambda::Function", 7));
          expectCDK(stack).to(countResources("AWS::ApiGateway::RestApi", 1));
          expectCDK(stack).to(countResources("AWS::ApiGateway::Deployment", 1));
          expectCDK(stack).to(countResources("AWS::ApiGateway::Stage", 1));
          expectCDK(stack).to(countResources("AWS::Elasticsearch::Domain", 1));
        }
      );
    }
  );
}
