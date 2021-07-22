import * as cdk from "@aws-cdk/core";
import { generateResourceName } from "../utility";
import * as environment from "../environment";
import * as lambda from "@aws-cdk/aws-lambda";
import * as nodeLambda from "@aws-cdk/aws-lambda-nodejs";
import { ServicePrincipal } from "@aws-cdk/aws-iam";
import * as logs from "@aws-cdk/aws-logs";

import * as apigw from "@aws-cdk/aws-apigateway";
import * as dynamodb from "@aws-cdk/aws-dynamodb";

interface ServerlessApiProps {
  environmentVariables: environment.EnvironmentVariables;
  userPoolDomainName: string;
  userPoolArn: string;
  userPoolId: string;
}

export class ServerlessApi extends cdk.Construct {
  // serverlessApi:

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
    const removalPolicy =
      env == environment.Environments.PROD
        ? cdk.RemovalPolicy.RETAIN // 本番はテーブルの削除ポリシーをRETAINに
        : cdk.RemovalPolicy.DESTROY;
    const todoTable = new dynamodb.Table(
      this,
      generateResourceName(projectName, "Todo", env),
      {
        partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "todoId", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        tableName: generateResourceName(projectName, "Todo", env),
        removalPolicy: removalPolicy,
      }
    );

    /**
     * Lambda Function の作成
     */
    const listTodosLambda = new nodeLambda.NodejsFunction(
      this,
      generateResourceName(projectName, "listTodos", env),
      {
        entry: "lambda/handlers/listTodosHandler.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          DYNAMODB_TABLE_NAME: todoTable.tableName,
          REGION: region,
        },
        functionName: generateResourceName(projectName, "listTodos", env),
        description: "Dynamodbに格納されたTodo情報を一括で取得する",
      }
    );
    const putTodosLambda = new nodeLambda.NodejsFunction(
      this,
      generateResourceName(projectName, "putTodos", env),
      {
        entry: "lambda/handlers/putTodosHandler.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          DYNAMODB_TABLE_NAME: todoTable.tableName,
          REGION: region,
        },
        functionName: generateResourceName(projectName, "putTodos", env),
        description: "Todo情報をDynamodbに登録更新する",
      }
    );
    const findTodosLambda = new nodeLambda.NodejsFunction(
      this,
      generateResourceName(projectName, "findTodos", env),
      {
        entry: "lambda/handlers/findTodosHandler.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          DYNAMODB_TABLE_NAME: todoTable.tableName,
          REGION: region,
        },
        functionName: generateResourceName(projectName, "findTodos", env),
        description: "Dynamodbに格納されたTodo情報を検索する",
      }
    );
    const getTodosLambda = new nodeLambda.NodejsFunction(
      this,
      generateResourceName(projectName, "getTodos", env),
      {
        entry: "lambda/handlers/getTodosHandler.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          DYNAMODB_TABLE_NAME: todoTable.tableName,
          REGION: region,
        },
        functionName: generateResourceName(projectName, "getTodos", env),
        description: "Dynamodbに格納されたTodo情報を1件取得する",
      }
    );

    const deleteTodosLambda = new nodeLambda.NodejsFunction(
      this,
      generateResourceName(projectName, "deleteTodos", env),
      {
        entry: "lambda/handlers/deleteTodosHandler.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          DYNAMODB_TABLE_NAME: todoTable.tableName,
          REGION: region,
        },
        functionName: generateResourceName(projectName, "deleteTodos", env),
        description: "Dynamodbに格納されたTodo情報を1件削除する",
      }
    );

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
      // TODO このAPI＿IDだけ、デプロイ完了後Swagger.ymlだけ入れ替えてから、仕様書をS３へアップする。もしくはデプロイされた後の仕様書を抜いてきて、入れ替える
      servers: [
        {
          url: `https://$API_ID.execute-api.${props.environmentVariables.region}.amazonaws.com/${env}/`,
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
              todoId: {
                type: "string",
              },
              title: {
                type: "string",
              },
              content: {
                type: "string",
              },
              dueDate: {
                type: "string",
                format: "date",
              },
              isImportant: {
                type: "boolean",
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
            value: "111aac0e-eb29-41c3-b377-05e14102942d",
          },
        },
      },
      // 各APIのリソースを以下で定義していく
      paths: {
        "/todos": {
          get: {
            operationId: "listTodos",
            tags: ["Todo"],
            summary: "Todo情報 一括取得API",
            description: "ユーザーのTodoを指定した件数分返却する",
            security: [
              {
                CognitoAuth: [],
              },
            ],
            parameters: [
              {
                name: "limit",
                in: "query",
                description: "取得するTodoの件数を指定する(最大 100件)",
                required: false,
                schema: {
                  type: "integer",
                  format: "int32",
                },
                examples: {
                  limit: {
                    summary: "limit 指定例",
                    value: 5,
                  },
                },
              },
              {
                name: "nextToken",
                in: "query",
                description: "次のページを取得する場合に指定する",
                required: false,
                schema: {
                  type: "string",
                },
                examples: {
                  nextToken: {
                    summary: "nextToken 指定例",
                    value: "eyJ2ZXJzaW9uIjoxLCJ0b2...",
                  },
                },
              },
            ],
            responses: {
              200: {
                description: "Todo情報のjsonリストを返却する",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      items: {
                        $ref: "#/components/schemas/Todo",
                      },
                    },
                    examples: {
                      listTodo: {
                        summary: "Todo情報 一括取得結果例",
                        value: {
                          todos: [
                            {
                              todoId: "3894bd64-3061-4fa5-914a-b798b5f56bb9",
                              title: "今日のうちに終わらせること",
                              content: "swaggerの定義を実装する",
                              dueDate: "2021-07-18",
                              isImportant: true,
                            },
                            {
                              todoId: "933b923b-3238-4ec1-b3fb-1164e897d690",
                              title: "明日朝起きたらやること",
                              content: "DynamodbをCDKで立てる",
                              dueDate: "2021-07-18",
                              isImportant: false,
                            },
                          ],
                          nextToken: "eyJ2ZXJzaW9uIjoxLCJ0b...",
                        },
                      },
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
                listTodosLambda.functionName +
                "/invocations",
              responses: {
                default: {
                  statusCode: "200",
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
                      dueDate: {
                        type: "string",
                        format: "date",
                      },
                      isImportant: {
                        type: "boolean",
                      },
                    },
                  },
                  examples: {
                    Todo: {
                      summary: "Todo情報 登録例",
                      value: {
                        title: "今日やること",
                        content: "ゴミを捨てる",
                        dueDate: "2021-07-18",
                        isImportant: false,
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
                          todoId: "a5d93e28-180f-404e-b6fe-29972ca4b73c",
                          title: "今日やること",
                          content: "ゴミを捨てる",
                          dueDate: "2021-07-18",
                          isImportant: false,
                        },
                      },
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
                },
              },
              passthroughBehavior: "when_no_match",
              httpMethod: "POST",
              contentHandling: "CONVERT_TO_TEXT",
              type: "aws_proxy",
            },
          },
        },

        "/todos/findByText": {
          get: {
            operationId: "findTodos",
            tags: ["Todo"],
            summary: "Todo情報 検索API",
            description: "ユーザーのTodoを指定したワードで検索し返却する",
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
                required: true,
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
            ],
            responses: {
              200: {
                description: "Todo情報のjsonリストを返却する",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Todo",
                      },
                    },
                    examples: {
                      findTodo: {
                        summary: "Todo情報 検索結果例",
                        value: [
                          {
                            todoId: "3e19c048-ecc8-45e3-86df-779b5e2e2304",
                            title: "今日中に実装するもの",
                            content: "swagger.yaml",
                            dueDate: "2021-07-18",
                            isImportant: true,
                          },
                          {
                            todoId: "111aac0e-eb29-41c3-b377-05e14102942d",
                            title: "明日の自分にお願いすること",
                            content: "DynamodbをCDKで実装してもらう",
                            dueDate: "2021-07-18",
                            isImportant: false,
                          },
                        ],
                      },
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
                },
              },
              passthroughBehavior: "when_no_match",
              httpMethod: "POST",
              contentHandling: "CONVERT_TO_TEXT",
              type: "aws_proxy",
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
                          todoId: "111aac0e-eb29-41c3-b377-05e14102942d",
                          title: "冷蔵庫の整理",
                          content: "卵と納豆を食べる",
                          dueDate: "",
                          isImportant: false,
                        },
                      },
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
              description: "更新する項目だけをリクエストボディに指定する",
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
                      dueDate: {
                        type: "string",
                        format: "date",
                      },
                      isImportant: {
                        type: "boolean",
                      },
                    },
                  },
                  examples: {
                    Todo: {
                      summary: "Todo情報 更新例",
                      value: {
                        title: "new title",
                        content: "new content",
                        dueDate: "2021-07-21",
                        isImportant: true,
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
                          todoId: "111aac0e-eb29-41c3-b377-05e14102942d",
                          title: "冷蔵庫の整理",
                          content: "卵と納豆を食べる",
                          dueDate: "2021-07-21",
                          isImportant: true,
                        },
                      },
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
                },
              },
              passthroughBehavior: "when_no_match",
              httpMethod: "POST",
              contentHandling: "CONVERT_TO_TEXT",
              type: "aws_proxy",
            },
          },
        },
      },
    };
    // API Gateway本体の作成
    const api = new apigw.SpecRestApi(
      this,
      generateResourceName(projectName, "SpecRestApi", env),
      {
        restApiName: generateResourceName(projectName, "Api", env),
        apiDefinition: apigw.ApiDefinition.fromInline(this.swagger),
        deployOptions: {
          stageName: env,
          accessLogDestination: new apigw.LogGroupLogDestination(
            new logs.LogGroup(
              this,
              generateResourceName(projectName, "ApiLog", env),
              {
                logGroupName: generateResourceName(projectName, "ApiLog", env),
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
    listTodosLambda.addPermission(`LambdaPermission`, {
      principal: new ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: api.arnForExecuteApi(),
    });
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

    // DynamodbにLambdaがアクセス可能にする
    todoTable.grantReadData(listTodosLambda);
    todoTable.grantReadData(getTodosLambda);
    todoTable.grantWriteData(putTodosLambda);
    todoTable.grantReadData(putTodosLambda);
    todoTable.grantWriteData(deleteTodosLambda);

    // TODO  API ドキュメント公開用 S3Bucketの作成
    const fs = require("fs");
    const yaml = require("js-yaml");

    const yamlText = yaml.dump(this.swagger);
    fs.writeFile("./cdk.out/swagger.yaml", yamlText, "utf8", (err: any) => {
      if (err) {
        console.error(err.message);
        process.exit(1);
      }
      console.log("SwaggerファイルをYamlで出力しました");
    });
    // TODO ドキュメントを各環境毎のS3へアップロードするやつ。Synthで動いてしまうから、S３Put自体は、テスト通った後の方がいいかも　ここではcdk.outに吐くまで

    // APIキーとかも作られるまでは、わからないので、それを事前にSwaggerに入れることはできない。
    // Deploy完了後のoutputから取得してスクリプトで埋め込むことにする。
    // // swaggerにサーバー情報を追加
    // this.swagger.servers = [
    //   {
    //     url: api.arnForExecuteApi,
    //     description: `${env} 環境`,
    //   },
    // ];
  }
}
