# メモ

## データの保存
- Infulxdb への保存
- できたら SpreadSheet への upload もやりたい

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

## 0x0EF001 プロファイルオブジェクトのハンドリング

- `108100000EF0010EF0017301D50401028801` みたいなデータが流れてきて、そのあと送受信がチグハグになってる
  - SEOJ, DEOJ ともに `0x0EF001` でプロファイルオブジェクト
  - `ESV: 0x73` `INF` プロパティ値通知
  - `port.on('data')` で ERXUDP だった場合に reject か resolve してるが、このプロファイルオブジェクトだった時を考えてない
  - `port.write()` と `port.on('data')` をセットで扱うのがまずそう……。
  - もしくは `erxudpCallback()` 内で EchonetLiteResponse 作るようにして、そこで プロファイルオブジェクトかどうか判断した上で無視するか。
    - 今の実装だとこれが現実的かも


```
  rl7023 SKSENDTO 1 FE80:0000:0000:0000:021C:6400:03DD:6393 0E1A 2 000e ���b� +6ms
  rl7023 EVENT 21 FE80:0000:0000:0000:021C:6400:03DD:6393 00 +298ms
  rl7023 OK +1ms
  rl7023 ERXUDP FE80:0000:0000:0000:021C:6400:03DD:6393 FF02:0000:0000:0000:0000:0000:0000:0001 0E1A 0E1A 001C640003DD6393 1 0012 108100000EF0010EF0017301D50401028801 +318ms
  rl7023 SKSENDTO 1 FE80:0000:0000:0000:021C:6400:03DD:6393 0E1A 2 000e ���b� +4ms
  rl7023 EVENT 21 FE80:0000:0000:0000:021C:6400:03DD:6393 00 +332ms
  rl7023 OK +1ms
  rl7023 ERXUDP FE80:0000:0000:0000:021C:6400:03DD:6393 FE80:0000:0000:0000:1207:23FF:FEA0:77E3 0E1A 0E1A 001C640003DD6393 1 0012 1081000102880105FF017201E7040000001B +717ms
0.027kw
  rl7023 SKSENDTO 1 FE80:0000:0000:0000:021C:6400:03DD:6393 0E1A 2 000e ���b� +11ms
  rl7023 EVENT 21 FE80:0000:0000:0000:021C:6400:03DD:6393 00 +277ms
  rl7023 OK +0ms
  rl7023 ERXUDP FE80:0000:0000:0000:021C:6400:03DD:6393 FE80:0000:0000:0000:1207:23FF:FEA0:77E3 0E1A 0E1A 001C640003DD6393 1 0012 1081000202880105FF017201E7040000001A +660ms
26
  rl7023 SKSENDTO 1 FE80:0000:0000:0000:021C:6400:03DD:6393 0E1A 2 000e ���b� +6ms
  rl7023 EVENT 21 FE80:0000:0000:0000:021C:6400:03DD:6393 00 +122ms
  rl7023 OK +0ms
  rl7023 ERXUDP FE80:0000:0000:0000:021C:6400:03DD:6393 FE80:0000:0000:0000:1207:23FF:FEA0:77E3 0E1A 0E1A 001C640003DD6393 1 0012 1081000302880105FF017201D30400000001 +299ms
1
  rl7023 SKSENDTO 1 FE80:0000:0000:0000:021C:6400:03DD:6393 0E1A 2 000e ���b� +5ms
  rl7023 EVENT 21 FE80:0000:0000:0000:021C:6400:03DD:6393 00 +299ms
  rl7023 OK +0ms
  rl7023 ERXUDP FE80:0000:0000:0000:021C:6400:03DD:6393 FE80:0000:0000:0000:1207:23FF:FEA0:77E3 0E1A 0E1A 001C640003DD6393 1 000F 1081000402880105FF017201E10101 +94ms
0.1
  rl7023 SKSENDTO 1 FE80:0000:0000:0000:021C:6400:03DD:6393 0E1A 2 000e ���b� +4ms
  rl7023 EVENT 21 FE80:0000:0000:0000:021C:6400:03DD:6393 00 +156ms
  rl7023 OK +0ms
  rl7023 ERXUDP FE80:0000:0000:0000:021C:6400:03DD:6393 FE80:0000:0000:0000:1207:23FF:FEA0:77E3 0E1A 0E1A 001C640003DD6393 1 0012 1081000502880105FF017201E00400012631 +569ms
75313
```
