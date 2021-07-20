import {
  expect as expectCDK,
  haveResource,
  countResources,
  ResourcePart,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as Cdk from "../../lib/stack/app-stack";
import * as environment from "../../lib/environment";
import { Authentication } from "../../lib/construct/authentication";
import { ServerlessApi } from "../../lib/construct/serverlessApi";
import { generateResourceName } from "../../lib/utility";

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
    expectCDK(stack).to(countResources("AWS::Cognito::UserPool", 1));
    expectCDK(stack).to(countResources("AWS::Cognito::UserPoolClient", 1));
    expectCDK(stack).to(countResources("AWS::Cognito::UserPoolDomain", 1));

    expectCDK(stack).to(countResources("AWS::DynamoDB::Table", 1));
    expectCDK(stack).to(countResources("AWS::Lambda::Function", 6));
    expectCDK(stack).to(countResources("AWS::ApiGateway::RestApi", 1));
    expectCDK(stack).to(countResources("AWS::ApiGateway::Deployment", 1));
    expectCDK(stack).to(countResources("AWS::ApiGateway::Stage", 1));


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
        environmentVariables: environmentVariables,
      });
      // THEN
      expectCDK(stack).to(
        haveResource("AWS::Cognito::UserPool", {
          UserPoolName: generateResourceName(projectName, "UserPool", env),
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
          ClientName: generateResourceName(projectName, "Client", env),
        })
      );
      expectCDK(stack).to(
        haveResource("AWS::Cognito::UserPoolDomain", {
          Domain: generateResourceName(
            projectName.toLowerCase(),
            "domain",
            env
          ),
        })
      );
    }
  );

  test(generateCaseName(env, "Construct case2: API関連のテスト"), () => {
    const stack = new cdk.Stack();

    // 前もって必要なリソースを作っておく
    const auth = new Authentication(stack, "MyAuthenticationConstruct", {
      environmentVariables: environmentVariables,
    });

    // WHEN
    new ServerlessApi(stack, "MyServerlessConstruct", {
      environmentVariables: environmentVariables,
      userPoolDomainName: auth.domainName,
      userPoolArn: auth.userPool.userPoolArn,
      userPoolId: auth.userPool.userPoolId,
    });

    // THEN
    expectCDK(stack).to(
      haveResource("AWS::DynamoDB::Table", {
        TableName: generateResourceName(projectName, "Todo", env),
      })
    );
    if (env == environment.Environments.PROD) {
      expectCDK(stack).to(
        haveResource(
          "AWS::DynamoDB::Table",
          {
            DeletionPolicy: "Retain",
          },
          ResourcePart.CompleteDefinition
        )
      );
    } else {
      expectCDK(stack).to(
        haveResource(
          "AWS::DynamoDB::Table",
          {
            DeletionPolicy: "Delete",
          },
          ResourcePart.CompleteDefinition
        )
      );
    }
  });
}
