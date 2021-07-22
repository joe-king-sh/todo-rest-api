# Dynamodb の設計

## 要件

- Todo 情報をユーザ毎に管理することが可能
- Todo 情報には以下の項目が必須
  - タイトル
  - 内容

## 実装方針

- 検索については ElasticSearch サービスを利用する
- Dynamodb に対しては、プライマリーキーとソートキーで CRUD を行うのみ。

## 想定するユースケース一覧

| #   | テーブル | ユースケース               | 説明                                      |
| --- | -------- | -------------------------- | ----------------------------------------- |
| 1   | TodoList | getTodoByUserId            | 指定したユーザの Todo を全件取得          |
| 2   | TodoList | getTodoByUserIdByTodoId    | 指定したユーザの指定した Todo を 1 件取得 |
| 3   | TodoList | postTodoByUserIdByTodoId   | 指定したユーザに Todo を１件登録          |
| 4   | TodoList | updateTodoByUserIdByTodoId | 指定したユーザの指定した Todo を１件更新  |
| 5   | TodoList | deleteTodoByUserIdByTodoId | 指定したユーザの指定した Todo を１件削除  |

## テーブル定義

| #   | 項目        | キー | 型     | 説明                           |
| --- | ----------- | ---- | ------ | ------------------------------ |
| 1   | userId      | PK   | 文字列 | Cognito ユーザプールのユーザ名 |
| 2   | todoId      | SK   | 文字列 | yyyyMMddHHmmss-uuid            |
| 3   | title       | -    | 文字列 | Todo の件名                    |
| 4   | content     | -    | 文字列 | Todo の内容                    |
| 5   | updatedDate | -    | 文字列 | 更新日付                       |

## 格納データイメージ

| PrimaryKey     |                                      | Attributes |                          |                               |     |
| -------------- | ------------------------------------ | ---------- | ------------------------ | ----------------------------- | --- |
| **PK**         | **SK**                               | -          | -                        | -                             |
| **userId**     | **todoId**                           | **title**  | **contents**             | **updatedDate**               |
| Angus Young    | b2f02b09-5d4b-4cb9-a72b-9f91713e3fe1 | ゴミ捨て   | 缶とペットボトルを捨てる | Thu, 22 Jul 2021 14:22:37 GMT |
| Angus Young    | 2b80bd60-9f8c-4ba6-89d2-bfc76729a405 | 送迎       | 娘を保育園へ送る         | Thu, 22 Jul 2021 14:22:56 GMT |
| Marty Friedman | cfb8dd5a-97e4-462c-b2f5-2233f1e6ce1b | 買い物     | 納豆、ゴミ袋、カップ麺   | Thu, 22 Jul 2021 14:23:22 GMT |
