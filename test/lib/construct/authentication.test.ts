import {
  expect as expectCDK,
  haveResource,
  ResourcePart,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as environment from "../../../lib/environment";
import { Authentication } from "../../../lib/construct/authentication";
import { buildResourceName } from "../../../lib/utility";
import { buildTestCaseName } from "../../testUtil";

/**
 * 各環境毎に生成されるテンプレートが異なるので、各環境分テストを回す
 */
for (const env of Object.values(environment.Environments)) {
  // 環境変数を取得
  const environmentVariables = environment.getVariablesOf(env);
  const projectName = environmentVariables.projectName;

  describe(
    buildTestCaseName(env, "認証関連リソースのコンストラクトのテスト"),
    (): void => {
      /**
       * Constructレベルでのテスト
       * テストの粒度：
       * 　生成したCfnテンプレートに意図したプロパティが存在するかをテストする
       */
      test(
        buildTestCaseName(env, "Construct case1: 認証関連リソースのテスト"),
        () => {
          const stack = new cdk.Stack();

          // WHEN
          new Authentication(stack, "MyAuthenticationConstruct", {
            environmentVariables: environmentVariables,
          });
          // THEN
          expectCDK(stack).to(
            haveResource("AWS::Cognito::UserPool", {
              UserPoolName: buildResourceName(projectName, "UserPool", env),
              AdminCreateUserConfig: { AllowAdminCreateUserOnly: false },
            })
          );
          if (env == environment.Environments.PROD) {
            expectCDK(stack).to(
              haveResource(
                "AWS::Cognito::UserPool",
                {
                  DeletionPolicy: "Retain", // 本番は事故防止のためRetain
                },
                ResourcePart.CompleteDefinition
              )
            );
          } else {
            expectCDK(stack).to(
              haveResource(
                "AWS::Cognito::UserPool",
                {
                  DeletionPolicy: "Delete",
                },
                ResourcePart.CompleteDefinition
              )
            );
          }
          expectCDK(stack).to(
            haveResource("AWS::Cognito::UserPoolClient", {
              ClientName: buildResourceName(projectName, "Client", env),
            })
          );
          // expectCDK(stack).to(
          //   haveResource("AWS::Cognito::UserPoolDomain", {
          //     Domain: buildResourceName(
          //       projectName.toLowerCase(),
          //       "domain",
          //       env
          //     ),
          //   })
          // );
        }
      );
    }
  );
}
