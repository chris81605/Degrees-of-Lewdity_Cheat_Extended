(function(){
    const macro = Macro.get('pain');
    if (!macro) {
        console.error("[Cheat Extended] ❌ 找不到 pain 宏");
        return;
    }

    // -----------------------------
    // CE 作弊變數初始化
    // V.CE_painCheat: 開關，控制是否減少疼痛
    // V.CE_painMultiplier: 疼痛倍率（<1 減少疼痛）
    // -----------------------------
    if (typeof V.CE_painCheat !== 'boolean') V.CE_painCheat = false;
    if (typeof V.CE_painMultiplier !== 'number' || V.CE_painMultiplier > 1) V.CE_painMultiplier = 0.5;

    // -----------------------------
    // Hook pain 宏
    // 流程：
    // 1. 取得原始 amount 與 modifier
    // 2. 如果 CE_painCheat 開啟，將 amount 乘以 CE_painMultiplier
    // 3. 呼叫原版 pain() 更新 V.pain
    // 4. 控制台 log 顯示原始 pain 與倍率
    // -----------------------------
    macro.handler = function() {
        const args = Array.from(this.args);
        let amount = args[0];
        let modifier = args[1] || 4;

        if (V.CE_painCheat && amount) {
            console.log(`[Cheat Extended] 😌 原 pain ${amount}，減少倍率 ${V.CE_painMultiplier}`);
            amount *= V.CE_painMultiplier;
        }

        return pain(amount, modifier);
    };

    console.log("[Cheat Extended] ✅ Pain macro handler 已 hook（疼痛可減少）");
})();