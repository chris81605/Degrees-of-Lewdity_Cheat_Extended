// 已棄用，改用狀態變數hook實現
/*
registerCE_genericTimeEvent(
    'onAfter',
    'CE_氧氣鎖定',
    () => {
        // 功能開關
        if (!V.CE_lockOxygenEnabled) return;

        // 只在會消耗氧氣的情境
        if (!(V.underwater || V.combat)) return;

        // 防呆
        if (typeof V.oxygen !== 'number' || typeof V.oxygenmax !== 'number') {
            console.warn('[Cheat Extended][Oxygen] ⚠ 非法氧氣數值', {
                oxygen: V.oxygen,
                oxygenmax: V.oxygenmax
            });
            return;
        }

        const before = V.oxygen;

        // 鎖定為最大值
        V.oxygen = V.oxygenmax;

        console.log('[Cheat Extended][Oxygen] 🔒 onBefore 鎖定氧氣', {
            before,
            after: V.oxygen,
            oxygenmax: V.oxygenmax,
            underwater: V.underwater,
            combat: V.combat,
            passage: State?.passage
        });
    }
);
*/