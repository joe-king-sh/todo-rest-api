import * as cdk from "@aws-cdk/core";
import { buildResourceName } from "../utility";
import * as environment from "../environment";
import { Authentication } from "../construct/authentication";
import { ServerlessApi } from "../construct/serverlessApi";

/**
 * デプロイするStackは全てこのStackにまとめる。
 * このStackが肥大化した場合、元からコンストラクトは分けているので、コンストラクト単位で分割を実施する。
 * @export
 * @class AppStack
 * @extends {cdk.Stack}
 */
export class AppStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    environmentVariables: environment.EnvironmentVariables,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    const projectName = environmentVariables.projectName;
    const env = environmentVariables.environment;

    // Cognito関連リソースを作成
    const auth = new Authentication(
      this,
      buildResourceName(projectName, "Authentication", env),
      { environmentVariables: environmentVariables }
    );

    // API GatewayとLambdaのリソースを作成
    const serverlessApi = new ServerlessApi(
      this,
      buildResourceName(projectName, "ServerlessApi", env),
      {
        environmentVariables: environmentVariables,
        userPoolDomainName: auth.domainName,
        userPoolArn: auth.userPool.userPoolArn,
        userPoolId: auth.userPool.userPoolId,
        userPoolClientId: auth.userPoolClientId,
      }
    );
  }
}
