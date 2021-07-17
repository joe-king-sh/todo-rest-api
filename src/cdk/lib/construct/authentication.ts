import * as cdk from "@aws-cdk/core";
import { generateResourceName } from "../utility";
import cognito = require("@aws-cdk/aws-cognito");
import * as environment from "../environment";

interface AuthenticationProps {
  environmentVariables: environment.EnvironmentVariables
}

export class Authentication extends cdk.Construct {

  userPool: cognito.IUserPool

  constructor(
    scope: cdk.Construct,
    id: string,
    props: AuthenticationProps
  ) {
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
      userPoolName: generateResourceName(projectName, "UserPool", env),
    });
    // アプリクライアントをユーザプールに追加
    this.userPool.addClient("UserPoolClient", {
      authFlows: { adminUserPassword: true, userSrp: true},
      generateSecret:false,
      userPoolClientName: generateResourceName(projectName, "Client", env),
      preventUserExistenceErrors: true
    });
  }
}
