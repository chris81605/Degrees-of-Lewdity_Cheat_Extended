Macro.add('CE_autoRepairClothes', {
    handler() {
        // 取得恢復比例參數，如果沒有提供則預設 0.5（即恢復 50%）
        const ratio = this.args[0] || 0.5;
        
        //傳入比例參數為零直接返回
        if (ratio === 0) return;
        
        // 取得可選部位參數，如果提供就只操作該部位
        const targetSlot = this.args[1] || null;

        // 確認玩家的穿戴資料和原始服裝資料存在
        if (!V.worn || !setup.clothes) {
            return this.error('V.worn 或 setup.clothes 未定義！');
        }

        // 遍歷所有部位（slot），例如 face、upper、lower 等
        Object.keys(V.worn).forEach(slot => {
            // 如果傳入 targetSlot，只處理該部位
            if (targetSlot && slot !== targetSlot) return;

            const wornItem = V.worn[slot];          // 玩家當前穿的服裝
            const slotClothesList = setup.clothes[slot]; // 該部位所有原始服裝列表

            // 如果該部位沒有穿戴物或列表不存在，跳過
            if (!wornItem || !slotClothesList) return;

            // 在原始服裝列表中找到玩家當前穿的服裝
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
            if (currentIntegrity !== newIntegrity){
                console.log(`[cheat Extended] ${name} (${slot})的耐久度： ${currentIntegrity} -> ${newIntegrity}`);
            }

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
    if (!V.CE_autoRepairClothesEnabled) {
        console.log('[cheat Extended] 自動恢復服裝耐久功能關閉，跳過恢復');
        return;
    }
    
    // 遍歷所有穿戴部位
    Object.keys(V.worn).forEach(slot => {
        
        // 檢查該部位是否在鎖定列表中
        // 只有不在鎖定列表才需要每日恢復
        const isLocked = V.CE_autoRepairClothesLockSlots?.[slot];        
        if (!isLocked && V.worn[slot]) {
            Wikifier.wikifyEval(
                `<<CE_autoRepairClothes ${V.CE_autoRepairClothesRatio} ${slot}>>`
            );  
        } 
    });    
                         
});

/*
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
*/


$(document).on(':passagedisplay', () => {
    
    //初始化開關
    if (V.CE_autoRepairLockEnabled === undefined) V.CE_autoRepairLockEnabled = false;
    // 確保鎖定物件存在
    if (!V.CE_autoRepairClothesLockSlots) {
        V.CE_autoRepairClothesLockSlots = {};
        Object.keys(V.worn).forEach(slot => {
            V.CE_autoRepairClothesLockSlots[slot] = false;
        });
    }
    
    // 先確認開關存在並啟用
    const mainToggleEnable = V.CE_autoRepairClothesEnabled;
    if (!mainToggleEnable) return;
    const toggleEnabled = V.CE_autoRepairLockEnabled;
    if (!toggleEnabled) return;

    // 遍歷所有穿戴部位
    Object.keys(V.worn).forEach(slot => {
        // 檢查該部位是否在鎖定列表中
        const isLocked = V.CE_autoRepairClothesLockSlots?.[slot];
        const isInverseLock = V.CE_autoRepairClothesInverseLock;
        const ratio = 1;
        
        if (isLocked && !isInverseLock && V.worn[slot]) {
            console.log(`[cheat Extended] ${slot}服裝鎖定耐久度`);
            Wikifier.wikifyEval(
                `<<CE_autoRepairClothes ${ratio} ${slot}>>`
            );  
        }
    });
});

