import * as cdk from "@aws-cdk/core";
import { buildResourceName } from "../utility";
import * as environment from "../environment";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as nodeLambda from "@aws-cdk/aws-lambda-nodejs";
import { Effect, ServicePrincipal } from "@aws-cdk/aws-iam";
import * as logs from "@aws-cdk/aws-logs";

import * as apigw from "@aws-cdk/aws-apigateway";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as es from "@aws-cdk/aws-elasticsearch";
import { DynamoEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { StartingPosition } from "@aws-cdk/aws-lambda";

import { exportApiSpec } from "../../script/exportApiSpec";
import * as ssm from "@aws-cdk/aws-ssm";

interface ServerlessApiProps {
  environmentVariables: environment.EnvironmentVariables;
  // userPoolDomainName: string;
  userPoolArn: string;
  userPoolId: string;
  userPoolClientId: string;
}

/**
 * APIを構成する以下のインフラリソースを作るコンストラクト
 *  - API Gateway
 *  - Labmda
 *  - Dynamodb
 *  - Elasticsearch
 *
 * @export
 * @class ServerlessApi
 * @extends {cdk.Construct}
 */
export class ServerlessApi extends cdk.Construct {
  swagger: {
    openapi: string;
    info: {};
    components: {};
    paths: {};
    servers: {};
  };

  constructor(scope: cdk.Construct, id: string, props: ServerlessApiProps) {
    super(scope, id);

    const projectName = props.environmentVariables.projectName;
    const env = props.environmentVariables.environment;
    const region = props.environmentVariables.region;

    /**
     * Dynamodb Table の作成
     */
    const todoTable = new dynamodb.Table(
      this,
      buildResourceName(projectName, "Todo", env),
      {
        partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "todoId", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        tableName: buildResourceName(projectName, "Todo", env),
        removalPolicy: props.environmentVariables.dynamodbSetting.removalPolicy,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      }
    );

    /**
     * Lambda Function の作成
     */
    const putTodosLambda = new nodeLambda.NodejsFunction(
      this,
      buildResourceName(projectName, "putTodos", env),
      {
        entry: "lambda/handlers/putTodosHandler.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          DYNAMODB_TABLE_NAME: todoTable.tableName,
          REGION: region,
        },
        functionName: buildResourceName(projectName, "putTodos", env),
        description: "Todo情報をDynamodbに登録更新する",
      }
    );
    const findTodosLambda = new nodeLambda.NodejsFunction(
      this,
      buildResourceName(projectName, "findTodos", env),
      {
        entry: "lambda/handlers/findTodosHandler.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          DYNAMODB_TABLE_NAME: todoTable.tableName,
          REGION: region,
        },
        functionName: buildResourceName(projectName, "findTodos", env),
        description: "Dynamodbに格納されたTodo情報を検索する",
      }
    );
    const getTodosLambda = new nodeLambda.NodejsFunction(
      this,
      buildResourceName(projectName, "getTodos", env),
      {
        entry: "lambda/handlers/getTodosHandler.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          DYNAMODB_TABLE_NAME: todoTable.tableName,
          REGION: region,
        },
        functionName: buildResourceName(projectName, "getTodos", env),
        description: "Dynamodbに格納されたTodo情報を1件取得する",
      }
    );

    const deleteTodosLambda = new nodeLambda.NodejsFunction(
      this,
      buildResourceName(projectName, "deleteTodos", env),
      {
        entry: "lambda/handlers/deleteTodosHandler.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          DYNAMODB_TABLE_NAME: todoTable.tableName,
          REGION: region,
        },
        functionName: buildResourceName(projectName, "deleteTodos", env),
        description: "Dynamodbに格納されたTodo情報を1件削除する",
      }
    );

    const indexTodosLambda = new nodeLambda.NodejsFunction(
      this,
      buildResourceName(projectName, "indexTodos", env),
      {
        entry: "lambda/handlers/indexTodosHandler.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          DYNAMODB_TABLE_NAME: todoTable.tableName,
          REGION: region,
        },
        functionName: buildResourceName(projectName, "indexTodos", env),
        description:
          "Dynamodbに格納された情報をElasticSearchにインデックスする",
      }
    );

    const createIdTokenLambda = new nodeLambda.NodejsFunction(
      this,
      buildResourceName(projectName, "createIdToken", env),
      {
        entry: "lambda/handlers/createIdTokenHandler.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          REGION: region,
          USER_POOL_ID: props.userPoolId,
          CLIENT_ID: props.userPoolClientId,
        },
        functionName: buildResourceName(projectName, "createIdToken", env),
        description: "CognitoUserPoolからAPIアクセス用のIDTokenを発行する",
      }
    );

    // DynamodbにLambdaがアクセス可能にする
    todoTable.grantReadData(getTodosLambda);
    todoTable.grantReadWriteData(putTodosLambda);
    todoTable.grantReadWriteData(deleteTodosLambda);
    todoTable.grantStreamRead(indexTodosLambda);
    todoTable.grantReadData(findTodosLambda);

    // DynamodbStreamにLambdaをアタッチする
    indexTodosLambda.addEventSource(
      new DynamoEventSource(todoTable, {
        startingPosition: StartingPosition.TRIM_HORIZON,
      })
    );

    /**
     * Elastic Searchの作成
     */
    const todoESDomain = new es.Domain(
      this,
      buildResourceName(projectName, "es-domain", env),
      {
        version: es.ElasticsearchVersion.V7_10,
        domainName: buildResourceName(projectName, "domain", env).toLowerCase(),
        capacity: {
          dataNodeInstanceType: "t3.small.elasticsearch",
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        accessPolicies: [
          new iam.PolicyStatement({
            actions: ["es:*"],
            effect: Effect.ALLOW,
            principals: [
              new iam.ArnPrincipal(indexTodosLambda.role?.roleArn as string),
              new iam.ArnPrincipal(findTodosLambda.role?.roleArn as string),
            ],
          }),
        ],
      }
    );
    // LambdaのRoleにESへのアクセスポリシーを権限を追加(GrandだけではLambda側のロールにしかつかないので、DomainのaccessPoliciesでも指定が必要)
    todoESDomain.grantReadWrite(indexTodosLambda);
    todoESDomain.grantRead(findTodosLambda);

    // Index用Lambdaの環境変数にESのエンドポイントを渡す
    indexTodosLambda.addEnvironment("ES_DOMAIN", todoESDomain.domainEndpoint);
    // 検索用Lambdaの環境変数にESのエンドポイントを渡す
    findTodosLambda.addEnvironment("ES_DOMAIN", todoESDomain.domainEndpoint);

    /**
     * API Gateway の作成
     */
    // Open API 3.0でAPI仕様を定義する
    this.swagger = {
      openapi: "3.0.0",
      info: {
        description: "Todoリストを管理するREST API",
        title: `${props.environmentVariables.projectName} REST API`,
        version: "1.0.0",
        contact: {
          name: "API Support",
          url: "https://twitter.com/joe_king_sh",
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/mit-license.php",
        },
      },
      // このAPI_ENDPOINTだけデプロイ前だと指定ができない。デプロイ完了後SSMからurlを取得してスクリプトで置換する
      servers: [
        {
          url: `API_ENDPOINT`,
          description: "",
        },
      ],
      // リソースに関わらず共通の設定をここで定義する
      components: {
        // Cognitoユーザプールを使用した認証を設定する
        securitySchemes: {
          CognitoAuth: {
            type: "apiKey",
            name: "Authorization",
            in: "header",
            "x-amazon-apigateway-authtype": "cognito_user_pools",
            "x-amazon-apigateway-authorizer": {
              providerARNs: [
                "arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/" +
                  props.userPoolId,
              ],
              type: "cognito_user_pools",
            },
          },
        },
        // 共通で使用するレスポンスを定義する
        schemas: {
          Todo: {
            type: "object",
            properties: {
              userId: {
                type: "string",
              },
              todoId: {
                type: "string",
              },
              title: {
                type: "string",
              },
              content: {
                type: "string",
              },
              updatedDate: {
                type: "string",
              },
            },
          },
          Error: {
            type: "object",
            required: ["message"],
            properties: {
              message: {
                type: "string",
              },
            },
          },
        },
        examples: {
          ErrorExample: {
            summary: "Todo情報 エラー例(Unexpected)",
            value: {
              message: "予期せぬエラーが発生しました",
            },
          },
          ErrorNotFoundExample: {
            summary: "Todo情報 エラー例(Not Found)",
            value: {
              message: "指定したTodoは見つかりませんでした",
            },
          },
          TodoId: {
            summary: "TodoId 指定例",
            value: "20210726212300-111aac0e-eb29-41c3-b377-05e14102942d",
          },
        },
      },
      // 各APIのリソースを以下で定義していく
      paths: {
        "/auth/token": {
          post: {
            operationId: "createToken",
            tags: ["Auth"],
            summary: "認証トークン発行API",
            description: "APIにアクセスするためのIDトークンを発行する",
            security: [],
            requestBody: {
              description: "認証情報",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["userId", "password"],
                    properties: {
                      userId: {
                        type: "string",
                      },
                      password: {
                        type: "string",
                      },
                    },
                  },
                  examples: {
                    user1: {
                      summary: "認証情報 例(テスト用ユーザ1)",
                      value: {
                        userId: "api-test-user-1",
                        password: "Passw0rd!",
                      },
                    },
                    user2: {
                      summary: "認証情報 例(テスト用ユーザ2)",
                      value: {
                        userId: "api-test-user-2",
                        password: "Passw0rd!",
                      },
                    },
                    user3: {
                      summary: "認証情報 例(テスト用ユーザ3)",
                      value: {
                        userId: "api-test-user-3",
                        password: "Passw0rd!",
                      },
                    },
                  },
                },
              },
            },
            responses: {
              200: {
                description: "認証成功 トークンを発行する",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      required: ["idToken"],
                      properties: {
                        idToken: {
                          type: "string",
                        },
                      },
                    },
                    examples: {
                      Todo: {
                        summary: "認証結果 トークン発行の例",
                        value: {
                          idToken:
                            "eyJraWQiOiJpV3RidzNaXC9WbFVyUWhCaGp..(省略)",
                        },
                      },
                    },
                  },
                },
                headers: {
                  "Access-Control-Allow-Origin": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Methods": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Headers": {
                    schema: {
                      type: "string",
                    },
                  },
                },
              },
              default: {
                description: "予期せぬエラーが発生",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Error",
                    },
                    examples: {
                      unexpected: {
                        $ref: "#/components/examples/ErrorExample",
                      },
                    },
                  },
                },
              },
            },
            "x-amazon-apigateway-integration": {
              uri:
                "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:" +
                createIdTokenLambda.functionName +
                "/invocations",
              responses: {
                default: {
                  statusCode: "200",

                  responses: {
                    default: {
                      statusCode: "200",
                      responseParameters: {
                        "method.response.header.Access-Control-Allow-Headers":
                          "'*'",
                        "method.response.header.Access-Control-Allow-Methods":
                          "'*'",
                        "method.response.header.Access-Control-Allow-Origin":
                          "'*'",
                      },
                      responseTemplates: {
                        "application/json": "{}",
                      },
                    },
                  },
                },
              },
              passthroughBehavior: "when_no_match",
              httpMethod: "POST",
              contentHandling: "CONVERT_TO_TEXT",
              type: "aws_proxy",
            },
          },
          options: {
            summary: "CORS support",
            description: "Enable CORS by returning correct headers\n",
            tags: ["CORS"],
            responses: {
              "200": {
                description: "Default response for CORS method",
                headers: {
                  "Access-Control-Allow-Origin": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Methods": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Headers": {
                    schema: {
                      type: "string",
                    },
                  },
                },
                content: {},
              },
            },
            "x-amazon-apigateway-integration": {
              type: "mock",
              requestTemplates: {
                "application/json": '{"statusCode" : 200}',
              },
              responses: {
                default: {
                  statusCode: "200",
                  responseParameters: {
                    "method.response.header.Access-Control-Allow-Headers":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Methods":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Origin": "'*'",
                  },
                  responseTemplates: {
                    "application/json": "{}",
                  },
                },
              },
            },
          },
        },

        "/todos": {
          get: {
            operationId: "findTodos",
            tags: ["Todo"],
            summary: "Todo情報 検索API",
            description: "指定したワードでTodoを検索し返却する",
            security: [
              {
                CognitoAuth: [],
              },
            ],
            parameters: [
              {
                name: "q",
                in: "query",
                description:
                  "指定したワードで、Todoのタイトル、内容を全文検索する",
                required: false,
                schema: {
                  type: "string",
                },
                examples: {
                  q: {
                    summary: "検索指定ワード例",
                    value: "実装",
                  },
                },
              },
              {
                name: "size",
                in: "query",
                description: "検索するワードのサイズ",
                required: false,
                schema: {
                  type: "number",
                },
                examples: {
                  size: {
                    summary: "サイズ指定例",
                    value: 2,
                  },
                },
              },
              {
                name: "from",
                in: "query",
                description: "読み込み開始位置指定",
                required: false,
                schema: {
                  type: "number",
                },
                examples: {
                  size: {
                    summary: "読み込み開始位置指定例",
                    value: 2,
                  },
                },
              },
            ],
            responses: {
              200: {
                description:
                  "全体の件数、取得したTodo情報、次回読み込み開始位置を返却する",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        totalCount: {
                          type: "number",
                        },
                        todos: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Todo" },
                        },
                        nextStartKey: {
                          type: "number",
                        },
                      },
                    },
                    examples: {
                      listTodo: {
                        summary: "Todo情報 検索結果例",
                        value: {
                          totalCount: 9,
                          todos: [
                            {
                              todoId: "3894bd64-3061-4fa5-914a-b798b5f56bb9",
                              title: "今日のうちに終わらせること",
                              content: "swaggerの定義を実装する",
                            },
                            {
                              todoId: "933b923b-3238-4ec1-b3fb-1164e897d690",
                              title: "明日朝起きたらやること",
                              content: "DynamodbをCDKで立てる",
                            },
                          ],
                          nextStartKey: 2,
                        },
                      },
                    },
                  },
                },
                headers: {
                  "Access-Control-Allow-Origin": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Methods": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Headers": {
                    schema: {
                      type: "string",
                    },
                  },
                },
              },
              default: {
                description: "予期せぬエラーが発生",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Error",
                    },
                    examples: {
                      unexpected: {
                        $ref: "#/components/examples/ErrorExample",
                      },
                    },
                  },
                },
              },
            },
            "x-amazon-apigateway-integration": {
              uri:
                "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:" +
                findTodosLambda.functionName +
                "/invocations",
              responses: {
                default: {
                  statusCode: "200",
                  responseParameters: {
                    "method.response.header.Access-Control-Allow-Headers":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Methods":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Origin": "'*'",
                  },
                  responseTemplates: {
                    "application/json": "{}",
                  },
                },
              },
              passthroughBehavior: "when_no_match",
              httpMethod: "POST",
              contentHandling: "CONVERT_TO_TEXT",
              type: "aws_proxy",
            },
          },
          post: {
            operationId: "putTodos",
            tags: ["Todo"],
            summary: "Todo情報 登録API",
            description: "ユーザーのTodo情報を1件登録する",
            security: [
              {
                CognitoAuth: [],
              },
            ],
            requestBody: {
              description: "登録するTodo情報",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["title", "content"],
                    properties: {
                      title: {
                        type: "string",
                      },
                      content: {
                        type: "string",
                      },
                    },
                  },
                  examples: {
                    Todo: {
                      summary: "Todo情報 登録例",
                      value: {
                        title: "今日やること",
                        content: "ゴミを捨てる",
                      },
                    },
                  },
                },
              },
            },
            responses: {
              200: {
                description: "Todo情報の登録が正常に完了",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Todo",
                    },
                    examples: {
                      Todo: {
                        summary: "Todo情報 登録例",
                        value: {
                          todoId:
                            "20210726212521-a5d93e28-180f-404e-b6fe-29972ca4b73c",
                          title: "今日やること",
                          content: "ゴミを捨てる",
                        },
                      },
                    },
                  },
                },
                headers: {
                  "Access-Control-Allow-Origin": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Methods": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Headers": {
                    schema: {
                      type: "string",
                    },
                  },
                },
              },
              default: {
                description: "予期せぬエラーが発生",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Error",
                    },
                    examples: {
                      unexpected: {
                        $ref: "#/components/examples/ErrorExample",
                      },
                    },
                  },
                },
              },
            },
            "x-amazon-apigateway-integration": {
              uri:
                "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:" +
                putTodosLambda.functionName +
                "/invocations",
              responses: {
                default: {
                  statusCode: "200",
                  responseParameters: {
                    "method.response.header.Access-Control-Allow-Headers":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Methods":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Origin": "'*'",
                  },
                  responseTemplates: {
                    "application/json": "{}",
                  },
                },
              },
              passthroughBehavior: "when_no_match",
              httpMethod: "POST",
              contentHandling: "CONVERT_TO_TEXT",
              type: "aws_proxy",
            },
          },
          options: {
            summary: "CORS support",
            description: "Enable CORS by returning correct headers\n",
            tags: ["CORS"],
            responses: {
              "200": {
                description: "Default response for CORS method",
                headers: {
                  "Access-Control-Allow-Origin": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Methods": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Headers": {
                    schema: {
                      type: "string",
                    },
                  },
                },
                content: {},
              },
            },
            "x-amazon-apigateway-integration": {
              type: "mock",
              requestTemplates: {
                "application/json": '{"statusCode" : 200}',
              },
              responses: {
                default: {
                  statusCode: "200",
                  responseParameters: {
                    "method.response.header.Access-Control-Allow-Headers":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Methods":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Origin": "'*'",
                  },
                  responseTemplates: {
                    "application/json": "{}",
                  },
                },
              },
            },
          },
        },
        "/todos/{todoId}": {
          get: {
            operationId: "showTodoById",
            tags: ["Todo"],
            summary: "Todo情報 取得API",
            description: "ユーザーの指定したTodoを1件取得する",
            security: [
              {
                CognitoAuth: [],
              },
            ],
            parameters: [
              {
                name: "todoId",
                in: "path",
                description: "取得するTodoのIdを指定する",
                required: true,
                schema: {
                  type: "string",
                },
                examples: {
                  todoId: { $ref: "#/components/examples/TodoId" },
                },
              },
            ],
            responses: {
              200: {
                description: "Todoを正常に取得完了",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Todo",
                    },
                    examples: {
                      getTodo: {
                        summary: "Todo情報 1件取得結果例",
                        value: {
                          todoId:
                            "20210726212521-111aac0e-eb29-41c3-b377-05e14102942d",
                          title: "冷蔵庫の整理",
                          content: "卵と納豆を食べる",
                        },
                      },
                    },
                  },
                },
                headers: {
                  "Access-Control-Allow-Origin": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Methods": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Headers": {
                    schema: {
                      type: "string",
                    },
                  },
                },
              },
              404: {
                description: "指定したTodoIdが存在しない",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Error",
                    },
                    examples: {
                      TodoNotFound: {
                        $ref: "#/components/examples/ErrorNotFoundExample",
                      },
                    },
                  },
                },
                headers: {
                  "Access-Control-Allow-Origin": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Methods": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Headers": {
                    schema: {
                      type: "string",
                    },
                  },
                },
              },
              default: {
                description: "予期せぬエラーが発生",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Error",
                    },
                    examples: {
                      unexpected: {
                        $ref: "#/components/examples/ErrorExample",
                      },
                    },
                  },
                },
              },
            },
            "x-amazon-apigateway-integration": {
              uri:
                "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:" +
                getTodosLambda.functionName +
                "/invocations",
              responses: {
                default: {
                  statusCode: "200",
                  responseParameters: {
                    "method.response.header.Access-Control-Allow-Headers":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Methods":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Origin": "'*'",
                  },
                  responseTemplates: {
                    "application/json": "{}",
                  },
                },
              },
              passthroughBehavior: "when_no_match",
              httpMethod: "POST",
              contentHandling: "CONVERT_TO_TEXT",
              type: "aws_proxy",
            },
          },
          put: {
            operationId: "updateTodo",
            tags: ["Todo"],
            summary: "Todo情報 更新API",
            description: "ユーザーのTodo情報を1件更新する",
            security: [
              {
                CognitoAuth: [],
              },
            ],
            parameters: [
              {
                name: "todoId",
                in: "path",
                description: "更新するTodoのIdを指定する",
                required: true,
                schema: {
                  type: "string",
                },
                examples: {
                  todoId: { $ref: "#/components/examples/TodoId" },
                },
              },
            ],
            requestBody: {
              description: "指定した値で登録されているTodoを更新する",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["title", "content"],
                    properties: {
                      title: {
                        type: "string",
                      },
                      content: {
                        type: "string",
                      },
                    },
                  },
                  examples: {
                    Todo: {
                      summary: "Todo情報 更新例",
                      value: {
                        title: "new title",
                        content: "new content",
                      },
                    },
                  },
                },
              },
            },
            responses: {
              200: {
                description: "Todo情報の更新が正常に完了",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Todo",
                    },
                    examples: {
                      updateTodo: {
                        summary: "Todo情報 更新結果例",
                        value: {
                          todoId:
                            "20210726212521-111aac0e-eb29-41c3-b377-05e14102942d",
                          title: "冷蔵庫の整理",
                          content: "卵と納豆を食べる",
                        },
                      },
                    },
                  },
                },
                headers: {
                  "Access-Control-Allow-Origin": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Methods": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Headers": {
                    schema: {
                      type: "string",
                    },
                  },
                },
              },
              404: {
                description: "指定したTodoIdが存在しない",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Error",
                    },
                    examples: {
                      TodoNotFound: {
                        $ref: "#/components/examples/ErrorNotFoundExample",
                      },
                    },
                  },
                },
                headers: {
                  "Access-Control-Allow-Origin": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Methods": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Headers": {
                    schema: {
                      type: "string",
                    },
                  },
                },
              },
              default: {
                description: "予期せぬエラーが発生",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Error",
                    },
                    examples: {
                      unexpected: {
                        $ref: "#/components/examples/ErrorExample",
                      },
                    },
                  },
                },
              },
            },
            "x-amazon-apigateway-integration": {
              uri:
                "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:" +
                putTodosLambda.functionName +
                "/invocations",
              responses: {
                default: {
                  statusCode: "200",
                  responseParameters: {
                    "method.response.header.Access-Control-Allow-Headers":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Methods":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Origin": "'*'",
                  },
                  responseTemplates: {
                    "application/json": "{}",
                  },
                },
              },
              passthroughBehavior: "when_no_match",
              httpMethod: "POST",
              contentHandling: "CONVERT_TO_TEXT",
              type: "aws_proxy",
            },
          },
          delete: {
            operationId: "deleteTodoById",
            tags: ["Todo"],
            summary: "Todo情報 削除API",
            description: "ユーザーの指定したTodoを1件削除する",
            security: [
              {
                CognitoAuth: [],
              },
            ],
            parameters: [
              {
                name: "todoId",
                in: "path",
                description: "削除するTodoのIdを指定する",
                required: true,
                schema: {
                  type: "string",
                },
                examples: {
                  todoId: { $ref: "#/components/examples/TodoId" },
                },
              },
            ],
            responses: {
              200: {
                description: "Todoを正常に削除完了",
                headers: {
                  "Access-Control-Allow-Origin": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Methods": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Headers": {
                    schema: {
                      type: "string",
                    },
                  },
                },
              },
              404: {
                description: "指定したTodoIdが存在しない",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Error",
                    },
                    examples: {
                      TodoNotFound: {
                        $ref: "#/components/examples/ErrorNotFoundExample",
                      },
                    },
                  },
                },
                headers: {
                  "Access-Control-Allow-Origin": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Methods": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Headers": {
                    schema: {
                      type: "string",
                    },
                  },
                },
              },
              default: {
                description: "予期せぬエラーが発生",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Error",
                    },
                    examples: {
                      unexpected: {
                        $ref: "#/components/examples/ErrorExample",
                      },
                    },
                  },
                },
              },
            },
            "x-amazon-apigateway-integration": {
              uri:
                "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:" +
                deleteTodosLambda.functionName +
                "/invocations",
              responses: {
                default: {
                  statusCode: "200",
                  responseParameters: {
                    "method.response.header.Access-Control-Allow-Headers":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Methods":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Origin": "'*'",
                  },
                  responseTemplates: {
                    "application/json": "{}",
                  },
                },
              },
              passthroughBehavior: "when_no_match",
              httpMethod: "POST",
              contentHandling: "CONVERT_TO_TEXT",
              type: "aws_proxy",
            },
          },
          options: {
            summary: "CORS support",
            description: "Enable CORS by returning correct headers\n",
            tags: ["CORS"],
            responses: {
              "200": {
                description: "Default response for CORS method",
                headers: {
                  "Access-Control-Allow-Origin": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Methods": {
                    schema: {
                      type: "string",
                    },
                  },
                  "Access-Control-Allow-Headers": {
                    schema: {
                      type: "string",
                    },
                  },
                },
                content: {},
              },
            },
            "x-amazon-apigateway-integration": {
              type: "mock",
              requestTemplates: {
                "application/json": '{"statusCode" : 200}',
              },
              responses: {
                default: {
                  statusCode: "200",
                  responseParameters: {
                    "method.response.header.Access-Control-Allow-Headers":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Methods":
                      "'*'",
                    "method.response.header.Access-Control-Allow-Origin": "'*'",
                  },
                  responseTemplates: {
                    "application/json": "{}",
                  },
                },
              },
            },
          },
        },
      },
    };
    // API Gateway本体の作成
    const api = new apigw.SpecRestApi(
      this,
      buildResourceName(projectName, "SpecRestApi", env),
      {
        restApiName: buildResourceName(projectName, "Api", env),
        apiDefinition: apigw.ApiDefinition.fromInline(this.swagger),
        deployOptions: {
          stageName: env,
          accessLogDestination: new apigw.LogGroupLogDestination(
            new logs.LogGroup(
              this,
              buildResourceName(projectName, "ApiLog", env),
              {
                logGroupName: buildResourceName(projectName, "ApiLog", env),
                removalPolicy: cdk.RemovalPolicy.DESTROY,
              }
            )
          ),
          loggingLevel: apigw.MethodLoggingLevel.INFO,
        },
        cloudWatchRole: true,
      }
    );

    // API GatewayからLambdaをInovokeできるようにリソースベースポリシーを追加
    putTodosLambda.addPermission(`LambdaPermission`, {
      principal: new ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: api.arnForExecuteApi(),
    });
    getTodosLambda.addPermission(`LambdaPermission`, {
      principal: new ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: api.arnForExecuteApi(),
    });
    deleteTodosLambda.addPermission(`LambdaPermission`, {
      principal: new ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: api.arnForExecuteApi(),
    });
    findTodosLambda.addPermission(`LambdaPermission`, {
      principal: new ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: api.arnForExecuteApi(),
    });
    createIdTokenLambda.addPermission(`LambdaPermission`, {
      principal: new ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: api.arnForExecuteApi(),
    });
    createIdTokenLambda.addToRolePolicy(
      new iam.PolicyStatement({
        resources: [props.userPoolArn],
        actions: ["cognito-idp:*"],
        effect: Effect.ALLOW,
      })
    );

    new ssm.StringParameter(this, "ApiId", {
      parameterName: `/${projectName}/${env}/ApiId`,
      stringValue: api.restApiId,
    });
    new ssm.StringParameter(this, "ApiUrl", {
      parameterName: `/${projectName}/${env}/ApiUrl`,
      stringValue: api.urlForPath(),
    });

    // swagger.ymlをdocsフォルダに吐いておく
    exportApiSpec(this.swagger);
  }
}
