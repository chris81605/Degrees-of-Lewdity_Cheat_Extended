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
CE_MacroHook.hookMacroOverride("purity", {
    cheatVar: "CE_purityControl",
    modifyFunc(args) {
        const amount = Number(args[0]);
        if (Number.isNaN(amount)) return true;

        CE_purityHandler(amount);

        return true; // ⭐ 返回 true 不執行原macro邏輯
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