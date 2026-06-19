window.AUTO_STOCK_DATA = {
  "generatedAt": "2026-06-19T23:32:21.492Z",
  "source": "data/stock-master.csv",
  "priceSource": "data/price-updates.csv",
  "disclosureSource": "data/disclosures.csv",
  "edinetSource": "data/edinet-facts.csv",
  "watchlistSource": "data/watchlist.csv",
  "fetchedAt": "2026-06-19T23:32:21.485Z",
  "priceFetchedAt": "2026-06-19T23:32:21.488Z",
  "disclosureFetchedAt": "2026-06-19T23:32:21.488Z",
  "edinetFetchedAt": "2026-06-19T23:32:21.489Z",
  "nextSources": [
    "price-api",
    "edinet-api",
    "tdnet"
  ],
  "priceUpdates": 8,
  "disclosureUpdates": 5,
  "edinetUpdates": 7,
  "watchlistUpdates": 3,
  "providerStatuses": [
    {
      "label": "銘柄マスタ",
      "ok": true,
      "message": "取得成功",
      "source": "data/stock-master.csv"
    },
    {
      "label": "株価",
      "ok": true,
      "message": "取得成功",
      "source": "data/price-updates.csv"
    },
    {
      "label": "適時開示",
      "ok": true,
      "message": "取得成功",
      "source": "data/disclosures.csv"
    },
    {
      "label": "EDINET相当",
      "ok": true,
      "message": "取得成功",
      "source": "data/edinet-facts.csv"
    },
    {
      "label": "監視リスト",
      "ok": true,
      "message": "取得成功",
      "source": "data/watchlist.csv"
    }
  ],
  "stocks": [
    {
      "code": "8841",
      "name": "テーオーシー",
      "sector": "不動産",
      "price": 842,
      "shares": 88217703,
      "treasuryShares": 0,
      "cash": 8500,
      "securities": 4300,
      "investmentSecurities": 18200,
      "interestDebt": 7000,
      "netAssets": 101000,
      "rentalBook": 58000,
      "rentalMarket": 186000,
      "bps": 1145,
      "eps": 44,
      "pbrLow": 0.5,
      "pbrAvg": 0.7,
      "pbrHigh": 0.95,
      "perLow": 12,
      "perAvg": 16,
      "perHigh": 22,
      "dataConfidence": "確認済み",
      "qualitativeDone": true,
      "held": false,
      "risk": "",
      "catalyst": "自社株買い",
      "history": [
        610,
        650,
        620,
        690,
        720,
        760,
        800,
        836,
        842
      ],
      "edinet": {
        "documentType": "annual",
        "periodEnd": "2026-03-31",
        "submittedAt": "2026-06-19",
        "sourceUrl": "https://example.com/edinet/8841"
      },
      "priceAsOf": "2026-06-19",
      "disclosures": [
        {
          "code": "8841",
          "publishedAt": "2026-06-18",
          "title": "自己株式取得に係る事項の決定に関するお知らせ",
          "url": "https://example.com/8841-buyback",
          "catalysts": [
            {
              "type": "自社株買い",
              "score": 8
            }
          ]
        }
      ],
      "watchlist": {
        "status": "監視",
        "note": "不動産含み益と資本政策の進捗を見る"
      }
    },
    {
      "code": "6505",
      "name": "東洋電機製造",
      "sector": "電機",
      "price": 1210,
      "shares": 9735500,
      "treasuryShares": 420000,
      "cash": 8300,
      "securities": 620,
      "investmentSecurities": 9900,
      "interestDebt": 3100,
      "netAssets": 32300,
      "rentalBook": 2100,
      "rentalMarket": 4800,
      "bps": 3430,
      "eps": 101,
      "pbrLow": 0.32,
      "pbrAvg": 0.52,
      "pbrHigh": 0.78,
      "perLow": 10,
      "perAvg": 18,
      "perHigh": 24,
      "dataConfidence": "一部手入力",
      "qualitativeDone": true,
      "held": true,
      "risk": "",
      "catalyst": "中期経営計画 / PBR改善",
      "history": [
        880,
        930,
        900,
        1010,
        1080,
        1120,
        1160,
        1180,
        1210
      ],
      "edinet": {
        "documentType": "annual",
        "periodEnd": "2026-03-31",
        "submittedAt": "2026-06-19",
        "sourceUrl": "https://example.com/edinet/6505"
      },
      "priceAsOf": "2026-06-19",
      "disclosures": [
        {
          "code": "6505",
          "publishedAt": "2026-06-18",
          "title": "中期経営計画の進捗および資本コストを意識した経営の実現に向けた対応について",
          "url": "https://example.com/6505-midterm",
          "catalysts": [
            {
              "type": "中期経営計画",
              "score": 5
            },
            {
              "type": "PBR改善",
              "score": 6
            }
          ]
        }
      ],
      "watchlist": null
    },
    {
      "code": "3123",
      "name": "サイボー",
      "sector": "繊維・不動産",
      "price": 618,
      "shares": 12891200,
      "treasuryShares": 0,
      "cash": 2550,
      "securities": 300,
      "investmentSecurities": 4300,
      "interestDebt": 2200,
      "netAssets": 13400,
      "rentalBook": 24700,
      "rentalMarket": 41400,
      "bps": 1040,
      "eps": 30,
      "pbrLow": 0.55,
      "pbrAvg": 0.75,
      "pbrHigh": 1,
      "perLow": 11,
      "perAvg": 16,
      "perHigh": 22,
      "dataConfidence": "確認済み",
      "qualitativeDone": false,
      "held": false,
      "risk": "",
      "catalyst": "含み資産",
      "history": [
        590,
        610,
        600,
        615,
        640,
        630,
        620,
        625,
        618
      ],
      "edinet": {
        "documentType": "annual",
        "periodEnd": "2026-03-31",
        "submittedAt": "2026-06-19",
        "sourceUrl": "https://example.com/edinet/3123"
      },
      "priceAsOf": "2026-06-19",
      "watchlist": null
    },
    {
      "code": "3765",
      "name": "ガンホー",
      "sector": "情報通信",
      "price": 2600,
      "shares": 54337100,
      "treasuryShares": 0,
      "cash": 130500,
      "securities": 0,
      "investmentSecurities": 12100,
      "interestDebt": 0,
      "netAssets": 158500,
      "rentalBook": 0,
      "rentalMarket": 0,
      "bps": 2910,
      "eps": 128,
      "pbrLow": 0.75,
      "pbrAvg": 0.95,
      "pbrHigh": 1.25,
      "perLow": 15,
      "perAvg": 19,
      "perHigh": 25,
      "dataConfidence": "確認済み",
      "qualitativeDone": true,
      "held": false,
      "risk": "利益減少傾向",
      "catalyst": "キャッシュリッチ",
      "history": [
        3050,
        2940,
        2810,
        2740,
        2690,
        2660,
        2640,
        2625,
        2600
      ],
      "edinet": {
        "documentType": "annual",
        "periodEnd": "2026-03-31",
        "submittedAt": "2026-06-19",
        "sourceUrl": "https://example.com/edinet/3765"
      },
      "priceAsOf": "2026-06-19",
      "disclosures": [
        {
          "code": "3765",
          "publishedAt": "2026-06-18",
          "title": "業績予想の下方修正に関するお知らせ",
          "url": "https://example.com/3765-risk",
          "catalysts": [
            {
              "type": "リスク",
              "score": -10
            }
          ]
        }
      ],
      "watchlist": null
    },
    {
      "code": "8802",
      "name": "三菱地所",
      "sector": "不動産",
      "price": 4010,
      "shares": 1220000000,
      "treasuryShares": 0,
      "cash": 435000,
      "securities": 0,
      "investmentSecurities": 565000,
      "interestDebt": 3180000,
      "netAssets": 3920000,
      "rentalBook": 4800000,
      "rentalMarket": 9900000,
      "bps": 3210,
      "eps": 230,
      "pbrLow": 0.95,
      "pbrAvg": 1.2,
      "pbrHigh": 1.45,
      "perLow": 15,
      "perAvg": 19,
      "perHigh": 23,
      "dataConfidence": "確認済み",
      "qualitativeDone": true,
      "held": true,
      "risk": "",
      "catalyst": "増配",
      "history": [
        2750,
        2920,
        3100,
        3350,
        3620,
        3810,
        3880,
        3940,
        4010
      ],
      "edinet": {
        "documentType": "annual",
        "periodEnd": "2026-03-31",
        "submittedAt": "2026-06-19",
        "sourceUrl": "https://example.com/edinet/8802"
      },
      "priceAsOf": "2026-06-19",
      "disclosures": [
        {
          "code": "8802",
          "publishedAt": "2026-06-18",
          "title": "配当予想の修正（増配）および累進配当方針に関するお知らせ",
          "url": "https://example.com/8802-dividend",
          "catalysts": [
            {
              "type": "増配",
              "score": 8
            }
          ]
        }
      ],
      "watchlist": null
    },
    {
      "code": "2484",
      "name": "出前館",
      "sector": "サービス",
      "price": 132,
      "shares": 111550000,
      "treasuryShares": 0,
      "cash": 28538,
      "securities": 0,
      "investmentSecurities": 0,
      "interestDebt": 0,
      "netAssets": 42000,
      "rentalBook": 0,
      "rentalMarket": 0,
      "bps": 376,
      "eps": -35,
      "pbrLow": 0.35,
      "pbrAvg": 0.6,
      "pbrHigh": 0.9,
      "perLow": 0,
      "perAvg": 0,
      "perHigh": 0,
      "dataConfidence": "確認済み",
      "qualitativeDone": false,
      "held": false,
      "risk": "赤字継続",
      "catalyst": "ネットキャッシュ",
      "history": [
        210,
        190,
        178,
        160,
        148,
        142,
        138,
        135,
        132
      ],
      "priceAsOf": "2026-06-19",
      "watchlist": null
    },
    {
      "code": "1897",
      "name": "金下建設",
      "sector": "建設",
      "price": 2820,
      "shares": 3800000,
      "treasuryShares": 220000,
      "cash": 16800,
      "securities": 900,
      "investmentSecurities": 6200,
      "interestDebt": 500,
      "netAssets": 31200,
      "rentalBook": 1200,
      "rentalMarket": 3900,
      "bps": 6500,
      "eps": 350,
      "pbrLow": 0.48,
      "pbrAvg": 0.68,
      "pbrHigh": 0.95,
      "perLow": 11,
      "perAvg": 16,
      "perHigh": 22,
      "dataConfidence": "確認済み",
      "qualitativeDone": true,
      "held": false,
      "risk": "",
      "catalyst": "ネットキャッシュ",
      "history": [
        3600,
        3420,
        3250,
        3100,
        3020,
        2940,
        2890,
        2850,
        2820
      ],
      "edinet": {
        "documentType": "annual",
        "periodEnd": "2026-03-31",
        "submittedAt": "2026-06-19",
        "sourceUrl": "https://example.com/edinet/1897"
      },
      "priceAsOf": "2026-06-19",
      "watchlist": {
        "status": "重点監視",
        "note": "買いラインを下回ったら有報の資産欄を再確認"
      }
    },
    {
      "code": "9672",
      "name": "東京都競馬",
      "sector": "不動産・レジャー",
      "price": 5920,
      "shares": 28764000,
      "treasuryShares": 900000,
      "cash": 23000,
      "securities": 2100,
      "investmentSecurities": 8600,
      "interestDebt": 17800,
      "netAssets": 113500,
      "rentalBook": 4280,
      "rentalMarket": 212000,
      "bps": 4070,
      "eps": 288,
      "pbrLow": 0.85,
      "pbrAvg": 1.05,
      "pbrHigh": 1.28,
      "perLow": 14,
      "perAvg": 18,
      "perHigh": 20,
      "dataConfidence": "一部手入力",
      "qualitativeDone": true,
      "held": true,
      "risk": "",
      "catalyst": "資産活用",
      "history": [
        3900,
        4200,
        4550,
        4920,
        5250,
        5600,
        5780,
        5850,
        5920
      ],
      "edinet": {
        "documentType": "annual",
        "periodEnd": "2026-03-31",
        "submittedAt": "2026-06-19",
        "sourceUrl": "https://example.com/edinet/9672"
      },
      "priceAsOf": "2026-06-19",
      "disclosures": [
        {
          "code": "9672",
          "publishedAt": "2026-06-18",
          "title": "固定資産の有効活用および長期ビジョンに関するお知らせ",
          "url": "https://example.com/9672-assets",
          "catalysts": [
            {
              "type": "資産活用",
              "score": 6
            }
          ]
        }
      ],
      "watchlist": {
        "status": "保有監視",
        "note": "目標株価到達後の一部利益確定を検討"
      }
    }
  ],
  "dataQuality": {
    "ok": false,
    "providerWarnings": [],
    "validationWarnings": [],
    "externalReferenceWarnings": [],
    "missingPrice": [],
    "missingEdinet": [
      "2484 出前館"
    ],
    "stale": [
      "2484 出前館"
    ],
    "coverage": {
      "price": "8/8",
      "edinet": "7/8"
    }
  }
};
