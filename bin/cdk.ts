#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AppStack } from '../lib/stack/app-stack';
import {generateResourceName} from '../lib/utility'
import * as environment from '../lib/environment'

const app = new cdk.App();

// Contextからデプロイ対象の環境を取得
const target: environment.Environments = app.node.tryGetContext('target') as environment.Environments;
console.log('CDK 実行環境: ' + target )
// 指定された環境が不正な場合はここで落とす
if(!target || !environment.getVariablesOf(target)) throw new Error('Invalid target environment');

// 環境変数を取得
const environmentVariables = environment.getVariablesOf(target)

// アプリケーションスタック
new AppStack(app, generateResourceName(environmentVariables.projectName,'AppStack', environmentVariables.environment), environmentVariables);