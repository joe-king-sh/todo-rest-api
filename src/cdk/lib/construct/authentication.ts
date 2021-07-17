import * as cdk from "@aws-cdk/core";
import cognito = require("@aws-cdk/aws-cognito");

export interface AuthenticationProps {
  userPoolProps: cognito.UserPoolProps;
}

export class Authentication extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: AuthenticationProps) {
    super(scope, id);

    //Cognitoのユーザプールを作成
    new cognito.UserPool(this, 'UserPool', props.userPoolProps);
  }
}
