/**
 * [Cheat Extended] Money Macro Hook
 *
 * 目的：
 *  - 攔截 SugarCube 的 <<money ...>> 宏
 *  - 改寫參數（收入倍率、支出倍率）
 *  - 使用原 money() 函數進行更新
 *  - 對所有宏修改進行排隊（供 CE_moneyWatch 檢查）
 *
 * 注意：
 *  - 此 HOOK 不會覆蓋 money() 本體，而是攔截宏
 *  - CE_moneyWatch 會比對 realDelta - macroDelta → 找非法修改
 */

(function(){
    const macro = Macro.get('money');
    if (!macro) {
        console.error("[Cheat Extended] ❌ 找不到 money 宏");
        return;
    }

    // 小工具：局部駝峰化
    const toCamelCaseLocal = str => str
        .replace(/[_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
        .replace(/^(.)/, (_, c) => c.toLowerCase());


    /*---------------------------------------------------------
     * 初始化 CE 變數（確保 V 存在後才啟動）
     *---------------------------------------------------------*/
    const interval = setInterval(() => {
        if (typeof V === "object" && V !== null) {
            let initialized = false;

            if (typeof V.CE_moneyCheat !== 'boolean') {
                V.CE_moneyCheat = false;
                initialized = true;
            }
            if (typeof V.CE_moneyInMultiplier !== 'number' || V.CE_moneyInMultiplier < 1) {
                V.CE_moneyInMultiplier = 2;
                initialized = true;
            }
            if (typeof V.CE_moneyOutMultiplier !== 'number' || V.CE_moneyOutMultiplier < 0) {
                V.CE_moneyOutMultiplier = 0.5;
                initialized = true;
            }
            if (typeof V.CE_moneyWatchEnabled !== 'boolean') {
                V.CE_moneyWatchEnabled = false;
                initialized = true;
            }

            if (initialized) {
                console.log("[Cheat Extended] ✅ CE_moneyHook 變數初始化完成");
            }

            clearInterval(interval);
        }
    }, 50);


    /*---------------------------------------------------------
     * 重新 hook money 宏 handler
     *---------------------------------------------------------*/
    macro.handler = function() {
        try {
            const args = Array.from(this.args);
            let amount = Number(args[0]);
            let source = args[1];
            const optional = args[2] || {};

            optional._CE_macroTriggered = true;

            let modified = false;

            // 收支倍率處理
            if (V.CE_moneyCheat) {

                if (amount > 0 && V.CE_moneyInMultiplier > 1) {
                    console.log(`[Cheat Extended] 💰 收入 ${amount} → ${amount * V.CE_moneyInMultiplier}`);
                    amount *= V.CE_moneyInMultiplier;
                    modified = true;
                }

                else if (amount < 0 && V.CE_moneyOutMultiplier < 1) {
                    console.log(`[Cheat Extended] 💸 支出 ${amount} → ${amount * V.CE_moneyOutMultiplier}`);
                    amount *= V.CE_moneyOutMultiplier;
                    modified = true;
                }
            }

            if (modified && source) {
                source = toCamelCaseLocal(source + "_modifiedByCE");
            }


            /*---------------------------------------------------------
             * 呼叫 money() + 將變動記錄進隊列
             *---------------------------------------------------------*/
            try {
                money(amount, source, optional);

                // 記錄宏修改
                if (V.CE_moneyWatchEnabled) {
                    V.CE_moneyChangeQueue = V.CE_moneyChangeQueue || [];
                    V.CE_moneyChangeQueue.push({
                        delta: amount,
                        source: source || "unknown"
                    });
                    console.log(`[Cheat Extended] 📝 宏修改已記錄：delta=${amount}, source=${source || "unknown"}`);
                }

                return;

            } catch (e) {
                console.error("[Cheat Extended] ❌ money() 執行失敗：", e);
                return null;
            }

        } catch (err) {
            console.error("[Cheat Extended] ❌ money 宏 hook handler 發生例外：", err);
        }
    };

    console.log("[Cheat Extended] ✅ Money macro handler 已 hook");
})();



/**
 * [Cheat Extended] Money Change Detector
 *
 * 回傳：數字
 *  - 0 → 完全正常，來自宏
 *  - 正數 → V.money 增加了不該增加的錢
 *  - 負數 → V.money 被非法扣錢
 */

(function () {

    window.CE_moneyWatch = function (lastMoney) {

        if (typeof V !== "object" || typeof V.money !== "number") {
            console.error("[Cheat Extended][Money Watch] ❌ V.money 無效");
            return 0;
        }
        if (typeof lastMoney !== "number") {
            console.warn("[Cheat Extended][Money Watch] ⚠ lastMoney 無效 → 視為無異常");
            return 0;
        }

        const queue = Array.isArray(V.CE_moneyChangeQueue) ? V.CE_moneyChangeQueue : [];
        let deltaMacro = 0;

        for (const ch of queue) {
            if (ch && typeof ch.delta === "number") {
                deltaMacro += ch.delta;
            }
        }

        const deltaReal = V.money - lastMoney;
        const deltaUnexpected = deltaReal - deltaMacro;

        return deltaUnexpected; // ← ⭐ 台柱
    };

})();



/**
 * [Cheat Extended] 金錢變化監控事件註冊
 */

function registerMoneyWatchEvent() {

    const logger = window.modUtils.getLogger();
    const maplebirchMod = window.modUtils.getMod('maplebirch');
    const simpleMod = window.modUtils.getMod('Simple Frameworks');

    let lastMoney =null;
        
    function moneyWatchAction() {
        if (!V.CE_moneyWatchEnabled) return;
        
        if (lastMoney === null) {
            lastMoney=V.money;
            V.CE_moneyChangeQueue = [];
            console.log(`[Cheat Extended] ✅ moneyWatchAction已初始化， 原始金錢為： ${lastMoney}`);            
        }
            
        if (typeof window.CE_moneyWatch !== "function") return;

        const deltaUnexpected = window.CE_moneyWatch(lastMoney);

        if (deltaUnexpected !== 0) {
            console.warn(`[Cheat Extended] ⚠️ 偵測到非經由宏金錢變動：差額 ${deltaUnexpected}`);
            console.warn(`[Cheat Extended] ⚠️ 開始嘗試路由：`);
            
            // ⭐ 偵測到非經由宏金錢變動Todo：
                        
            if (typeof V !== "object" || typeof V.money !== "number") {
                console.warn(`[Cheat Extended] ❌ V.money 異常=>${V.money}，無法路由非宏變動`);
                console.warn(`[Cheat Extended] ⚠️ 嘗試恢復：`);
                V.money = lastMoney;     
                console.warn(`[Cheat Extended] ⚠️ V.money => ${V.money}`);
                         
            } else {
            
                try {
                    // 嘗試先扣掉 V.money，然後透過 <<money>> 宏路由                                    
                    V.money -= deltaUnexpected;
                    Wikifier.wikifyEval(`<<money ${deltaUnexpected} unknown>>`);
                    console.log(`[Cheat Extended] ✅ 非經由宏金錢變動已路由：${deltaUnexpected}，V.money 已同步`);

                } catch (e) {
                    // 回滾 V.money
                    V.money += deltaUnexpected;
                    console.error(`[Cheat Extended] ❌ 嘗試路由未知來源 V.money 變動失敗: ${deltaUnexpected}`);
                    console.error(`[Cheat Extended] 🔹 例外訊息:`, e);
                    console.warn(`[Cheat Extended] ⚠️ 金錢變動未能路由，V.money 已回滾`);
                }                        
            }                        
        }

        // 更新快照與清空隊列
        lastMoney = V.money;
        V.CE_moneyChangeQueue = [];
    }


    if (maplebirchMod) {
        maplebirch.dynamic.regTimeEvent('onSec', 'CE_money_Watch', {
            action: moneyWatchAction,
            priority: 0,
            once: false
        });
      //  logger.log('[Cheat Extended] ✅ Maplebirch 已註冊金錢變化監控事件');
        console.log('[Cheat Extended] ✅ Maplebirch 已註冊金錢變化監控事件');

    } else if (simpleMod) {
        new TimeEvent('onSec', 'CE_money_Watch').Action(moneyWatchAction);
      //  logger.log('[Cheat Extended] ✅ Simple Frameworks 已註冊金錢變化監控事件');
        console.log('[Cheat Extended] ✅ Simple Frameworks 已註冊金錢變化監控事件');

    } else {
        logger.error('[Cheat Extended] ❌ 未檢測到框架，無法註冊金錢監控事件');
        console.error('[Cheat Extended] ❌ 未檢測到框架，無法註冊金錢監控事件');
    }
}

registerMoneyWatchEvent();

/*================================================================
【Cheat Extended：完整金錢監控流程圖】

┌─────────────────────────────────────────┐
│ ① 遊戲執行 <<money amount source>> 宏  │
│    - Passage / 劇情 / 玩家觸發           │
└─────────────────────────────────────────┘
                     ↓ hook

┌─────────────────────────────────────────┐
│ ② Money Macro Hook handler             │
│    - 取得參數：amount, source, optional│
│    - 套用收支倍率（V.CE_moneyCheat 啟用）│
│       → 收入乘 V.CE_moneyInMultiplier   │
│       → 支出乘 V.CE_moneyOutMultiplier  │
│    - 呼叫 money(amount, source, optional) │
│    - 若 V.CE_moneyWatchEnabled 啟用：    │
│         → 將 {delta: amount, source} 推入 V.CE_moneyChangeQueue │
│         → console.log 記錄宏修改        │
└─────────────────────────────────────────┘
                     ↓（隊列累積）

┌─────────────────────────────────────────┐
│ ③ 每秒（遊戲時間）觸發 moneyWatchAction()          │
│    - 若 lastMoney === null：初始化快照 │
│        → lastMoney = V.money           │
│        → 清空 V.CE_moneyChangeQueue    │
│        → console.log 初始化訊息        │
│    - 檢查 V.CE_moneyWatchEnabled 開關  │
│    - 呼叫 CE_moneyWatch(lastMoney)      │
└─────────────────────────────────────────┘
                     ↓

┌─────────────────────────────────────────┐
│ ④ CE_moneyWatch(lastMoney)             │
│    - 取得 V.CE_moneyChangeQueue        │
│    - 計算 deltaMacro = Σ(queue.delta)  │
│    - 計算 deltaReal = V.money - lastMoney │
│    - deltaUnexpected = deltaReal - deltaMacro │
│    - return deltaUnexpected             │
└─────────────────────────────────────────┘
                     ↓

┌─────────────────────────────────────────┐
│ ⑤ 若 deltaUnexpected !== 0：            │
│    - console.warn 偵測到非經由宏金錢變動        │
│    - 嘗試路由非宏變動：                 │
│       a) 檢查 V.money 是否有效          │
│       b) 嘗試 V.money -= deltaUnexpected│
│       c) 透過 <<money deltaUnexpected>> 宏同步 │
│    - 若路由失敗：                        │
│       → 回滾 V.money += deltaUnexpected  │
│       → console.error / console.warn     │
└─────────────────────────────────────────┘
                     ↓

┌─────────────────────────────────────────┐
│ ⑥ 更新狀態                               │
│    - lastMoney = V.money                 │
│    - 清空 V.CE_moneyChangeQueue          │
└─────────────────────────────────────────┘

【說明】
- Money 宏：記錄合法宏操作
- V.CE_moneyWatchEnabled：控制是否啟用監控
- CE_moneyWatch：比對宏隊列 vs 真實金錢變化
- moneyWatchAction：定期檢測非宏變動，並嘗試路由
- lastMoney null 初始判斷避免讀檔前錯誤
- console.log / warn / error 用於 Debug 及異常提示

================================================================*/