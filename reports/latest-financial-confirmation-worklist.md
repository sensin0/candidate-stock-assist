# 財務確認ワークシート

生成日時: 2026-06-23T23:15:49.353Z

財務確認キュー上位を、確認済み入力へ進めるための作業表です。
BPS、EPS、現金、有利子負債、発行株数などを決算資料で確認し、`confirmed` と `qualitativeDone` を `true` にしたものだけ通常候補へ昇格できます。

対象: 30件

## 入力待ち

- 1. 4378 CINC Corp.: 昇格候補 / 株価551円 / 下書きBPS 648 / 下書きEPS 34.4
- 2. 5989 H-ONE CO.,LTD.: 昇格候補 / 株価1469円 / 下書きBPS 1728 / 下書きEPS 91.8
- 3. 4410 HARIMA CHEMICALS GROUP,INC.: 昇格候補 / 株価1072円 / 下書きBPS 1261 / 下書きEPS 67
- 4. 9941 TAIYO BUSSAN KAISHA,LTD.: 昇格候補 / 株価1195円 / 下書きBPS 1406 / 下書きEPS 74.7
- 5. 7069 CyberBuzz,Inc.: 昇格候補 / 株価1254円 / 下書きBPS 1475 / 下書きEPS 78.4
- 6. 6522 Asterisk Inc.: 昇格候補 / 株価1076円 / 下書きBPS 1266 / 下書きEPS 67.3
- 7. 7477 MURAKI CORPORATION: 昇格候補 / 株価1950円 / 下書きBPS 2294 / 下書きEPS 121.9
- 8. 6058 VECTOR INC.: 昇格候補 / 株価1565円 / 下書きBPS 1565 / 下書きEPS 86.9
- 9. 4392 Future Innovation Group,Inc.: 昇格候補 / 株価1125円 / 下書きBPS 1324 / 下書きEPS 70.3
- 10. 7256 KASAI KOGYO CO.,LTD.: 昇格候補 / 株価467円 / 下書きBPS 549 / 下書きEPS 29.2
- 11. 7878 Kohsai Co.,Ltd.: 昇格候補 / 株価1238円 / 下書きBPS 1238 / 下書きEPS 68.8
- 12. 6696 TRaaS On Product Inc.: 昇格候補 / 株価246円 / 下書きBPS 246 / 下書きEPS 13.7
- 13. 7694 itsumo.inc.: 昇格候補 / 株価420円 / 下書きBPS 420 / 下書きEPS 23.3
- 14. 194A WOLVES HAND Co.,Ltd.: 昇格候補 / 株価1227円 / 下書きBPS 1227 / 下書きEPS 68.2
- 15. 5010 NIPPON SEIRO CO.,LTD.: 昇格候補 / 株価231円 / 下書きBPS 231 / 下書きEPS 12.8
- 16. 3664 WIZE INC.: 昇格候補 / 株価22円 / 下書きBPS 22 / 下書きEPS 1.2
- 17. 9888 UEX,LTD.: 昇格候補 / 株価986円 / 下書きBPS 986 / 下書きEPS 54.8
- 18. 5232 Sumitomo Osaka Cement Co.,Ltd.: 昇格候補 / 株価5995円 / 下書きBPS 5995 / 下書きEPS 333.1
- 19. 2195 AMITA HOLDINGS CO.,LTD.: 昇格候補 / 株価330円 / 下書きBPS 330 / 下書きEPS 18.3
- 20. 5587 Inbound Platform Corp.: 昇格候補 / 株価732円 / 下書きBPS 732 / 下書きEPS 40.7
- 21. 9322 KAWANISHI WAREHOUSE CO.,LTD.: 昇格候補 / 株価2258円 / 下書きBPS 2258 / 下書きEPS 125.4
- 22. 3934 BENEFIT JAPAN Co.,LTD.: 昇格候補 / 株価2269円 / 下書きBPS 2269 / 下書きEPS 126.1
- 23. 2332 Quest Co.,Ltd.: 昇格候補 / 株価1719円 / 下書きBPS 1719 / 下書きEPS 95.5
- 24. 5016 JX Advanced Metals Corporation: 昇格候補 / 株価4733円 / 下書きBPS 5568 / 下書きEPS 295.8
- 25. 6310 ISEKI & CO.,LTD.: 昇格候補 / 株価1787円 / 下書きBPS 1787 / 下書きEPS 99.3
- 26. 281A Informetis Co.,Ltd.: 昇格候補 / 株価637円 / 下書きBPS 637 / 下書きEPS 35.4
- 27. 4651 SANIX HOLDINGS INCORPORATED: 昇格候補 / 株価221円 / 下書きBPS 221 / 下書きEPS 12.3
- 28. 7734 RIKEN KEIKI CO.,LTD.: 昇格候補 / 株価3595円 / 下書きBPS 3595 / 下書きEPS 199.7
- 29. 4256 CYND Co.,Ltd.: 昇格候補 / 株価939円 / 下書きBPS 939 / 下書きEPS 52.2
- 30. 4351 YAMADA SERVICER SYNTHETIC OFFICE: 昇格候補 / 株価946円 / 下書きBPS 946 / 下書きEPS 52.6

## 使い方

- `data/financial-confirmation-worklist.csv` を開く
- `checked...` の列に確認済みの値を入れる
- `confirmed` と `qualitativeDone` を `true` にする
- 内容を `data/financial-confirmed-input.csv` に移す
- `npm run financial:promote` で昇格プレビューを見る
