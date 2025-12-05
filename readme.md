# Degrees-of-Lewdity Cheat Extended

<img decoding="async" src="https://gitgud.io/uploads/-/system/user/avatar/9096/avatar.png" width="24" alt=""> **遊戲作者**: Vrelnir

## 官方連結
- [Vrelnir Blog][blog]  
- [英文遊戲維基][wiki-en]  
- [中文英文遊戲維基][wiki-cn]  
- [官方 Discord][discord]  
- [遊戲源碼倉庫][gitgud]  

## 前置需求
- [MODLOADER][JML]  
- [Degrees of Lewdity 中文本地化][DOLCN]  
- [Simple Framework][SF] 或 [maplebirchframework][MF]  

---

## 功能概覽

### 💨 左側快捷
- 一鍵狀態恢復 + PC 立刻高潮  

### 🏠 空間節點
- 三個常駐節點：
  - 孤兒院臥室  
  - 伊甸家（未觸發劇情建議別直接傳送）  
  - 隨身衣櫃  
- 原作者: [用户_aeVUUeW@貼吧-DOL吧][YL+p_wardrobe]  

### ✨ 言靈系統
- 支援二 / 三代言靈，左側即時顯示  
- 可同時新增多個言靈  
- 調用遊戲內 `widget` / `JS`  
- 優化 By 北极星勾陈一  

### 🏗 場景創建
- 遊戲內自定義場景，言靈作入口  
- 核心代碼 By Tony70124 [bccme]  

### ⚔ 戰鬥 / 屬性控制
- 傷害加倍 / 疼痛衰減  
- 戰鬥中 HP / AP 顯示  
- **角色屬性控制面板**：
  - 可調整：疼痛 / 創傷 / 控制值 / 壓力 / 敏感度 / 性興奮 / 疲勞 / 技能  
  - 每個屬性支援正負倍率與開關  

### 🍼 擠奶 / 大爆🐍
- **大量擠🥛模式**：
  - 一次榨乾容量 6000 🥛
  - 可修改當前可儲存🥛量
  - 可修改當前🥛量最大值
  - 可修改當前有多少🥛
- **大爆🐍模式**：
  - 與大量擠🥛功能雷同，但數值更大
  - 可修改當前可儲存🍼量、最大值與總量
  - 僅男Pc / Futa Pc 或啟用 DEBUG 模式才會顯示此功能按鈕

### 💰 商業 / 收支功能
- 黑心商店模式：
  - 一鍵清空庫存  
  - 銷售金額加倍  
- 跳舞報酬加倍  
- 尋歡洞報酬加倍  
- 收支倍率調整：
  - 收入倍率 1~100  
  - 支出倍率 0.1~1  

### 🎓 學習模式
- 不去學校不計旷課  
- 當週考試成功率固定 120%  
- 可手動拉滿當週考試成功率  

### 🛠 DEBUG 模式
- 慎用  

### 👗 服裝功能
- 一鍵全添加 / 指定添加  
- 特殊服裝（項圈、口球等）未排除  

### 🪄 魔術迴路
- 自訂義紋身文字 / 屬性  
- 可輸入言靈  

### 🌡 自動恆溫（測試中）
- 服裝保暖視氣溫自動調節  

### 🧬 Pc 懷孕功能
- 自訂非生物懷孕（觸手等）  
- 自訂人類懷孕（可強制懷上 NPC 孩子）  

---

## 更新日誌

## 1.17 (DevV251204build2)
- 新增角色屬性控制面板

## 1.17 (DevV251204build1)
- 新增收支倍率調整
- 修復大量擠🥛 / 大爆🐍滑塊爆紅問題

## 1.16.1
- 修復大量擠🍼關閉後無法操作問題
- 修復自動溫控 widget 丟失問題

## 1.16
- 修復大量擠🍼功能與🍼量修改
- 移除海報言靈
- 修復黑心商店上下限修改失效
- 新增自動恆溫（服裝保暖視氣溫調節）
- 優化言靈管理與排列
- 優化魔術迴路，採動態添加至遊戲中
- 適配遊戲版本 0.5.2.8

## 1.15
- 適配遊戲版本 0.5.0.5
- 修復黑心市場錯誤
- 移除部分新增傳送地點
- boot.json 新增遊戲本體版本校驗

<details>
<summary>1.14.1 及之前版本（點我展開）</summary>

## 1.14
- 新增 Pc 懷孕功能
  - 自定義非生物懷孕
  - 自定義人類懷孕
- 修正尋歡洞無限疊加倍數問題
- 微調大量擠🥛代碼
- 更新場景創建功能至最新版
- 增加原版場景魔改代碼（尚未實裝）
- 遊戲標題畫面設定選項可直接開 DebugMode

## 1.14.1
- 修復 DEBUG MODE 開關在選項內切換報錯
- 調整作弊選單內言靈輸入框為 textarea

## 1.12.0 ~ 1.12.2
- 優化言靈系統
- 修復魔術迴路文字描述錯誤
- 修復大量擠🍼功能錯誤
- 修復用功學習模式開關報錯
- 修復大容量衣櫃數據初始化錯誤
- 支援清除錯誤言靈

## 1.11.0 ~ 1.10.0
- 新增場景創建功能
- 更新一鍵添加服裝功能（新增手持物品）

## 1.9.0 ~ 1.8.1
- 嘗試使用 Simple Framework 添加選項
- 新增魔術迴路功能
- 修復添加服裝功能指定添加狀態顯示異常

## 1.7.0 ~ 1.7.4
- 新增 / 優化一鍵添加服裝功能
- 支援指定添加貞操帶 / 顏色
- 新增一鍵脫光光
- 修復功能異常問題

## 1.6.0 ~ 1.6.1
- 優化作弊拓展 UI
- 修復時空穿越功能
- 修復左側言靈新增言靈彈出錯誤

## 1.5.0 ~ 1.5.1
- 優化言靈集功能
- 異次元空間衣櫃新增還原預設值選項
- 修復滑塊聯動問題

## 1.4.0 ~ 1.4.1
- 優化代碼，Widgets cheat_extended 獨立
- 修復大量擠🍼模式數據錯誤

## 1.3.0 ~ 1.3.5
- 新增自訂快速傳送（最多 3 個節點）
- 調整部分 UI
- 優化空間節點，避免破壞存檔
- 修復 HP / AP 不顯示
- 調整滑塊最大值與描述

## 1.2.2
- 言靈集功能優化
- 支援清除錯誤言靈

## 1.0
- 初版

</details>

---

## 感謝
- **ModLoader 開發者 Lyoko-Jeremie**  
- **Simple Framework 開發者 emicoto**  
- **Degrees of Lewdity 漢化組成員**  
- **QQ群 污度孤儿中国模组交流群**  
- **貼吧 用户_aeVUUeW / Tony70124 / 北极星勾陈一 / 丧心病**  

---

## 代碼授權證明
- 第二代言靈系統 & 隨身衣櫃 By 用户_aeVUUeW@貼吧-DOL吧  
![image](https://github.com/chris81605/Degrees-of-Lewdity_Cheat_Extended/blob/main/%E6%8E%88%E6%AC%8A/%E6%8E%88%E6%AC%8A-2%E4%BB%A3%E8%A8%80%E9%9D%88%2B%E9%9A%A8%E8%BA%AB%E8%A1%A3%E6%AB%83.jpg)

- 第三代言靈系統 By Tony70124@貼吧-DOL吧  
![image](https://github.com/chris81605/Degrees-of-Lewdity_Cheat_Extended/blob/main/%E6%8E%88%E6%AC%8A/%E6%8E%88%E6%AC%8A-3%E4%BB%A3%E8%A8%80%E9%9D%88.jpg)

---

[blog]: https://vrelnir.blogspot.com/
[wiki-en]: https://degreesoflewdity.miraheze.org/wiki
[wiki-cn]: https://degreesoflewditycn.miraheze.org/wiki
[gitgud]: https://gitgud.io/Vrelnir/degrees-of-lewdity/-/tree/master/
[discord]: https://discord.gg/VznUtEh
[JML]:https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader  
[DOLCN]:https://github.com/Eltirosto/Degrees-of-Lewdity-Chinese-Localization  
[YL+p_wardrobe]:https://tieba.baidu.com/p/8613337062
[YL_3G]:https://tieba.baidu.com/p/8724301141
[DOL_EEE]:https://github.com/MissedHeart/Degrees-of-Lewdity-Exposed-Event-Extended
[SF]:https://github.com/emicoto/DOLMods
[MF]:https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchframework
[bccme]:https://github.com/Tony70124/BetterCheatCommandManagement-for-DOL