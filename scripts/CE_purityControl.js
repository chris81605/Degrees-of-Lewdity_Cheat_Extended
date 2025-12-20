(() => {
    // ===== 控制變數初始化 =====
    V.purity =
        (typeof V.purity === "number" && !isNaN(V.purity)) ? V.purity : 1000;

    V.CE_purityControl =
        (typeof V.CE_purityControl === "boolean") ? V.CE_purityControl : false;

    V.CE_purityMax =
        (typeof V.CE_purityMax === "number" && !isNaN(V.CE_purityMax))
            ? V.CE_purityMax
            : 1000;

    V.CE_purityMin =
        (typeof V.CE_purityMin === "number" && !isNaN(V.CE_purityMin))
            ? V.CE_purityMin
            : 0;

    V.CE_purityAddMultiplier =
        (typeof V.CE_purityAddMultiplier === "number"
            && !isNaN(V.CE_purityAddMultiplier)
            && V.CE_purityAddMultiplier > 0)
            ? V.CE_purityAddMultiplier
            : 1;

    V.CE_puritySubMultiplier =
        (typeof V.CE_puritySubMultiplier === "number"
            && !isNaN(V.CE_puritySubMultiplier)
            && V.CE_puritySubMultiplier > 0)
            ? V.CE_puritySubMultiplier
            : 1;
})();

/* =========================================
   Cheat Extended - 通用宏攔截器
   功能: 通用攔截任意宏，修改邏輯，支持阻止原 macro
   ========================================= */

/**
 * 通用宏攔截器
 * @param {string} macroName - 目標宏名稱
 * @param {object} options - 配置選項
 *   - cheatVar: V.開關變數名稱 (boolean)
 *   - modifyFunc: 自訂函數 (handler原始this) => 返回 false 阻止原 macro, 返回其他值或 undefined 繼續執行原 macro
 *   - logFunc: 自訂 log 函數 (macroName, oldArgs, newArgs)
 */
function hookMacro(macroName, { cheatVar, modifyFunc, logFunc }) {
    const macro = Macro.get(macroName);
    if (!macro) {
        console.warn(`[Cheat Extended] ⚠️ 找不到宏: ${macroName}`);
        return;
    }

    const originalHandler = macro.handler;

    if (cheatVar && typeof V[cheatVar] !== "boolean") {
        V[cheatVar] = false;
    }

    macro.handler = function () {
        // ⭐ 一定要先 snapshot
        const args = Array.from(this.args);

        console.log(`[Cheat Extended][Hook][${macroName}] args snapshot:`, args);

        // === 開啟作弊：完全接管 ===
        if (cheatVar && V[cheatVar] && modifyFunc) {
            const handled = modifyFunc.call(this, args);

            if (handled === true) {
                // true = 我已處理，阻止原 macro
                if (logFunc) logFunc(macroName, args);
                return;
            }
        }

        // === 關閉作弊：正常流程 ===
        if (logFunc) logFunc(macroName, args);
        return originalHandler.call(this);
    };

    console.log(`[Cheat Extended] ✅ 宏 ${macroName} 已 Hook`);
}

/* =========================================
   範例: purity 宏 - 強制最大值 1000
   ========================================= */

// ===== 統一處理函數 =====
function CE_purityHandler(amount) {
    if (isNaN(amount)) return;
   
    console.log(`[Cheat Extended][CE_purityHandler] 傳入 amount = ${amount}`);
    
    // ===== 控制變數檢測 =====
    V.purity = (typeof V.purity === "number" && !isNaN(V.purity)) ? V.purity : 1000;
    V.CE_purityControl = (typeof V.CE_purityControl === "boolean") ? V.CE_purityControl : false;
    V.CE_purityMax = (typeof V.CE_purityMax === "number" && !isNaN(V.CE_purityMax)) ? V.CE_purityMax : 1000;
    V.CE_purityMin = (typeof V.CE_purityMin === "number" && !isNaN(V.CE_purityMin)) ? V.CE_purityMin : 0;
    V.CE_purityAddMultiplier = (typeof V.CE_purityAddMultiplier === "number" && !isNaN(V.CE_purityAddMultiplier) && V.CE_purityAddMultiplier > 0) ? V.CE_purityAddMultiplier : 1;
    V.CE_puritySubMultiplier = (typeof V.CE_puritySubMultiplier === "number" && !isNaN(V.CE_puritySubMultiplier) && V.CE_puritySubMultiplier > 0) ? V.CE_puritySubMultiplier : 1;
        
    // 根據增減使用不同倍率
    if (amount > 0) {
        amount *= V.CE_purityAddMultiplier ?? 1;
    } else if (amount < 0) {
        amount *= V.CE_puritySubMultiplier ?? 1;
    } else return;
    
    amount = Math.round(amount);
    
    console.log(`[Cheat Extended][CE_purityHandler] 輸出 amount = ${amount}`);
    
    const mod = Object.values(V.worn).reduce((prev, item) => {
        if (item.type.includes("holy")) return prev + 1;
        return prev;
    }, 1);

    V.purity = Math.clamp(V.purity + amount * mod, V.CE_purityMin, V.CE_purityMax);

    console.log(`[Cheat Extended] ✨ Purity hook, ${amount > 0 ? '增加' : '減少'}: ${Math.abs(amount * mod)}, 當前純潔: ${V.purity}`);
}

// ===== Hook purity 宏（減少） =====
hookMacro("purity", {
    cheatVar: "CE_purityControl",
    modifyFunc(args) {
        const amount = Number(args[0]);
        if (Number.isNaN(amount)) return true;

        CE_purityHandler(amount);

        return true; // ⭐ 明確告訴 hook：我已處理，別跑原 macro
    },
    logFunc(name, args) {
        console.log(`[Cheat Extended] ✨ 宏 ${name} 被攔截，傳入參數:`, args);
    }
});



// ===== 包裝 statChange.purity（增加） =====
const originalPurity = statChange.purity;
statChange.purity = function(amount) {
    if (!V.CE_purityControl || isNaN(amount)) {
        console.log(`[Cheat Extended] ⚠️ statChange.purity 呼叫，但控制未開啟或參數無效，amount:`, amount);
        return originalPurity.call(this, amount);
    }

    console.log(`[Cheat Extended] ✨ statChange.purity Hook 執行, 傳入參數: ${amount}`);
    CE_purityHandler(amount);
};