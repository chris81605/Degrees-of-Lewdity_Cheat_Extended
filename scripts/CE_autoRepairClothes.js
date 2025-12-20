function registerCE_genericTimeEvent(eventType, eventName, callback) {
    const logger = window.modUtils.getLogger();
    const maplebirchMod = window.modUtils.getMod('maplebirch');
    const simpleMod = window.modUtils.getMod('Simple Frameworks');

    if (maplebirchMod) {
        maplebirchFrameworks.addTimeEvent(eventType, eventName, {
            action: callback,
            priority: 0,
            once: false
        });
        console.log(`[Cheat Extended] ✅ Maplebirch 已註冊事件: ${eventName} (${eventType})`);

    } else if (simpleMod) {
        new TimeEvent(eventType, eventName).Action(callback);
        console.log(`[Cheat Extended] ✅ Simple Frameworks 已註冊事件: ${eventName} (${eventType})`);

    } else {
        logger.error('[Cheat Extended] ❌ 未檢測到 Maplebirch 或 Simple Frameworks，無法註冊事件');
        console.error('[Cheat Extended] ❌ 未檢測到 Maplebirch 或 Simple Frameworks，無法註冊事件');
    }
}

// 範例使用：
/*
registerCE_genericTimeEvent('onDay', 'CE_customDailyEvent', () => {
    CE_customDailyEvent();
});
*/

Macro.add('CE_autoRepairClothes', {
    handler() {
        // 取得恢復比例參數，如果沒有提供則預設 0.5（即恢復 50%）
        const ratio = this.args[0] || 0.5;

        // 確認玩家的穿戴資料和原始服裝資料存在
        if (!V.worn || !setup.clothes) {
            return this.error('V.worn 或 setup.clothes 未定義！');
        }

        // 遍歷所有部位（slot），例如 face、upper、lower 等
        Object.keys(V.worn).forEach(slot => {
            const wornItem = V.worn[slot];          // 玩家當前穿的服裝
            const slotClothesList = setup.clothes[slot]; // 該部位所有原始服裝列表

            // 如果該部位沒有穿戴物或列表不存在，跳過
            if (!wornItem || !slotClothesList) return;

            // 在原始服裝列表中找到玩家當前穿的服裝
            // 比較依據是 variable 屬性，保證找到正確服裝原型
            const proto = slotClothesList.find(c => c.variable === wornItem.variable);
            
            // 如果找不到對應原始服裝，或者該原始服裝沒有定義耐久，跳過
            if (!proto || proto.integrity == null) return;

            // 讀取當前耐久與最大耐久
            const currentIntegrity = wornItem.integrity;
            const maxIntegrity = proto.integrity;

            // 計算本次增加的耐久值（向上取整）
            const increase = Math.ceil(maxIntegrity * ratio);

            // 計算恢復後的耐久，但不超過最大值
            const newIntegrity = Math.min(currentIntegrity + increase, maxIntegrity);

            // 取得顯示名稱，優先使用中文名稱，沒有則用英文，最後用 slot 名稱代替
            const name = wornItem.cn_name_cap || wornItem.name || slot;

            // 在控制台輸出恢復過程，方便檢查
            console.log(`[cheat Extended] ${name} (${slot}): ${currentIntegrity} -> ${newIntegrity}`);

            // 更新玩家穿戴物的耐久值
            wornItem.integrity = newIntegrity;
        });
    }
});

registerCE_genericTimeEvent('onDay', 'CE_每日恢復服裝耐久事件', () => {
    // 初始化控制變量，避免 undefined
    if (V.CE_autoRepairClothesEnabled === undefined) V.CE_autoRepairClothesEnabled = false;
    if (V.CE_autoRepairClothesRatio === undefined) V.CE_autoRepairClothesRatio = 0.5;

    // 只有當開關開啟時才執行恢復
    if (V.CE_autoRepairClothesEnabled) {
        Wikifier.wikifyEval(
            `<<CE_autoRepairClothes ${V.CE_autoRepairClothesRatio}>>`
        );
    } else {
        console.log('[cheat Extended] 自動恢復服裝耐久功能關閉，跳過恢復');
    }
});

