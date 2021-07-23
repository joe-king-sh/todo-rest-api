import * as cdk from "@aws-cdk/core";
import { buildResourceName } from "../utility";
import cognito = require("@aws-cdk/aws-cognito");
import * as environment from "../environment";
import { Z_ASCII } from "zlib";

interface AuthenticationProps {
  environmentVariables: environment.EnvironmentVariables;
}

export class Authentication extends cdk.Construct {
  userPool: cognito.IUserPool;
  userPoolDomain: cognito.IUserPoolDomain;
  domainName: string;

  constructor(scope: cdk.Construct, id: string, props: AuthenticationProps) {
    super(scope, id);

    const projectName = props.environmentVariables.projectName;
    const env = props.environmentVariables.environment;

    //Cognitoのユーザプールを作成
    const removalPolicy =
      env == environment.Environments.PROD
        ? cdk.RemovalPolicy.RETAIN // 本番はユーザプールの削除ポリシーをRETAINに
        : cdk.RemovalPolicy.DESTROY;
    this.userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      signInCaseSensitive: false,
      signInAliases: {
        username: true,
        email: true,
      },
      userPoolName: buildResourceName(projectName, "UserPool", env),
      removalPolicy: removalPolicy,
    });
    // アプリクライアントをユーザプールに追加
    this.userPool.addClient("UserPoolClient", {
      authFlows: { adminUserPassword: true, userSrp: true, custom: true },
      generateSecret: false,
      userPoolClientName: buildResourceName(projectName, "Client", env),
      preventUserExistenceErrors: true,
    });
    // 認証用UIのためドメイン名を追加する
    this.domainName = buildResourceName(
      projectName.toLowerCase(),
      "domain",
      env
    );

    this.userPoolDomain = new cognito.UserPoolDomain(this, "Domain", {
      userPool: this.userPool,
      cognitoDomain: { domainPrefix: this.domainName },
    });
  }
}
