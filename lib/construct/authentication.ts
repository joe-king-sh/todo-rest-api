import * as cdk from "@aws-cdk/core";
import { buildResourceName } from "../utility";
import cognito = require("@aws-cdk/aws-cognito");
import * as environment from "../environment";
import * as ssm from "@aws-cdk/aws-ssm";

interface AuthenticationProps {
  environmentVariables: environment.EnvironmentVariables;
}

export class Authentication extends cdk.Construct {
  userPool: cognito.IUserPool;
  userPoolDomain: cognito.IUserPoolDomain;
  domainName: string;
  userPoolClientId: string;

  constructor(scope: cdk.Construct, id: string, props: AuthenticationProps) {
    super(scope, id);

    const projectName = props.environmentVariables.projectName;
    const env = props.environmentVariables.environment;

    //Cognitoのユーザプールを作成
    this.userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      signInCaseSensitive: false,
      signInAliases: {
        username: true,
        email: true,
      },
      userPoolName: buildResourceName(projectName, "UserPool", env),
      removalPolicy:
        props.environmentVariables.cognitoUserPoolSetting.removalPolicy,
    });
    // アプリクライアントをユーザプールに作成
    const userPoolClient = new cognito.UserPoolClient(
      this,
      buildResourceName(projectName.toLowerCase(), "userPoolClient", env),
      {
        userPool: this.userPool,
        authFlows: { adminUserPassword: true, userSrp: true, custom: true },
        generateSecret: false,
        userPoolClientName: buildResourceName(projectName, "Client", env),
        preventUserExistenceErrors: true,
      }
    );
    this.userPoolClientId = userPoolClient.userPoolClientId;

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

    new ssm.StringParameter(this, "UserPoolId", {
      parameterName: `/${projectName}/${env}/UserPoolId`,
      stringValue: this.userPool.userPoolId,
    });
    new ssm.StringParameter(this, "user-pool-id", {
      parameterName: `/${projectName}/${env}/UserPoolClientId`,
      stringValue: this.userPoolClientId,
    });
  }
}
