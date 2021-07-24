import {
  expect as expectCDK,
  haveResource,
  ResourcePart,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as environment from "../../../lib/environment";
import { Authentication } from "../../../lib/construct/authentication";
import { ServerlessApi } from "../../../lib/construct/serverlessApi";
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
    buildTestCaseName(env, "サーバレスAPIのコンストラクトのテスト"),
    (): void => {
      /**
       * Constructレベルでのテスト
       * テストの粒度：
       * 　生成したCfnテンプレートに意図したプロパティが存在するかをテストする
       */
      test(buildTestCaseName(env, "Construct case2: API関連のテスト"), () => {
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
          userPoolClientId: auth.userPoolClientId,
        });

        // THEN
        /***
         * Dynamodb
         */
        expectCDK(stack).to(
          haveResource("AWS::DynamoDB::Table", {
            TableName: buildResourceName(projectName, "Todo", env),
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

        /***
         * ElasticSearch
         */
        expectCDK(stack).to(
          haveResource("AWS::Elasticsearch::Domain", {
            DomainName: buildResourceName(
              projectName,
              "domain",
              env
            ).toLowerCase(),
            ElasticsearchClusterConfig: {
              InstanceType: "t3.small.elasticsearch",
              DedicatedMasterEnabled: false,
              InstanceCount: 1,
              ZoneAwarenessEnabled: false,
            },
          })
        );

        expectCDK(stack).to(
          haveResource(
            "AWS::Elasticsearch::Domain",
            {
              // Indexは再作成効くので、本番であろうとDeleteする
              DeletionPolicy: "Delete",
            },
            ResourcePart.CompleteDefinition
          )
        );
      });
    }
  );
}
