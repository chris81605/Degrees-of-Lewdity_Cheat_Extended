// 通用時間事件註冊函數
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

window.registerCE_genericTimeEvent = registerCE_genericTimeEvent;

// 範例使用：
registerCE_genericTimeEvent(
    'onAfter',
    'CE_自動調溫',
    () => {
        if (V.swich_auto_clothes_Warmth !== 1) return;

        const min = 36.5;
        const max = 37.5;

        const now = Weather.BodyTemperature.get();
        let corrected = now;

        if (now < min) {
            corrected = min;
            
        } else if (now > max) {
            corrected = max;
            
        }

        if (corrected !== now) {
            Weather.BodyTemperature.set(corrected);

            console.warn(
                `[Cheat Extended][AutoThermo] 被動恆溫修正: ` +
                `${now.toFixed(2)} → ${corrected.toFixed(2)}`
            );
        }
    }
);

registerCE_genericTimeEvent(
    'onDay',
    'CE_額外狀態恢復',
    () => {
        if (!V.swich_extraStatusRestore) return; // 開關檢查

        const restoreTargets = {
            pain: 0,
            arousal: 0,
            tiredness: 0,
            stress: 0,
            trauma: 0,
            control: 1000,
            drunk: 0,
            drugged: 0,
            hallucinogen: 0
        };

        const restoreRates = {
            pain: 50,
            arousal: 30,
            tiredness: 20,
            stress: 15,
            trauma: 10,
            control: 50,
            drunk: 50,
            drugged: 50,
            hallucinogen: 50
        };

        Object.keys(restoreTargets).forEach(key => {
            if (typeof V[key] === "number") {
                const target = restoreTargets[key];
                const current = V[key];
                const distance = target - current;
                const rate = restoreRates[key];
                const change = distance * 0.01 * rate;

                if (Math.abs(change) < 0.01) {
                    V[key] = target;
                } else {
                    V[key] += change;
                }

                // 輸出控制台
                if (change !== 0) {
                    console.log(`[cheat Extended][extraStatusRestore] ${key}: ${current.toFixed(2)} → ${V[key].toFixed(2)}`);
                }
            }
        });
    }
);