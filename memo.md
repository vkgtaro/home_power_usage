
## データの保存
- Infulxdb への保存
- できたら SpreadSheet への upload もやりたい
- これは別途適当なクラス作って、下記の RL7023 のクラスに渡して save() メソッドでも作るか
- callback に仕込む必要あるかも？
  - main loop でやるなら必要ないか

## RL7023 Stick-D/IPS
- SerialPort を包括して、 RL7023 とやり取りする部分の抽象化
  - port.on('data') のイベントの準備とか
  - port.on('write') を包括した send メソッドとか
- context もメンバ変数で持てるか
  - SKコマンド送出時に res(buf) を受け取って resolve, reject の判別する callback とか渡す
- 各種 callback もこれが管理する


## Echonet Lite response
- レスポンスをパースするやつ
- port.on('data') あたりで呼ばれて、レスポンスを parse するやつ
- OPC をもとに PDC, EDT の配列を作る
- EPC をもとに EDT のパースするやつも必要
- 入力は Buffer 前提で大丈夫そう

## Echonet Lite request
- リクエストを構築するやつ
- DEOJ は相手に合わせて変更が必要
    - スマート電力メーターは 0x02, 0x88, 0x01
- TID もできたらその都度ちゃんと生成したいけど
    - 後でレスポンスと突合するのに使える
- ESV は Get/Set で変更する必要があるので EPC によって変える必要ある
- リクエスト時は、自分の usecase だと OPC, は 0x01, PDC は基本 0x00 なんじゃないかな
    - 積算履歴のリセットで PDC 0x01 EDT 0x02(前日) にするくらい？
    - 家電の操作とかでリクエスト時にデータ送るんじゃなければ、基本読み出しだけなので
