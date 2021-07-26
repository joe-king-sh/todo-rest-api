# CDKのモジュール内部で、elasticsearchだけCDKのnode_moduleが入れ子になっており、バージョンの競合によりビルドが通らない現象が発生。
# 競合するパッケージを削除する処理を用意し、package.json内部で各コマンドの前にこれを実行するワークアラウンドを取る
rm -rf ./node_modules/@aws-cdk/aws-elasticsearch/node_modules
