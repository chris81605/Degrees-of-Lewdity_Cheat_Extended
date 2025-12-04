// ---------------------- Pain 宏 Hook ----------------------
(function(){
    const macro = Macro.get('pain');
    if (!macro) {
        console.error("[Cheat Extended] ❌ 找不到 pain 宏");
        return;
    }

    const originalHandler = macro.handler;

    // 初始化變數
    if (typeof V.CE_painCheat !== 'boolean') V.CE_painCheat = false;
    if (typeof V.CE_painMultiplier !== 'number') V.CE_painMultiplier = 0.5;          // 正數倍率 0~1
    if (typeof V.CE_painNegativeMultiplier !== 'number') V.CE_painNegativeMultiplier = 2; // 負數倍率 1~5

    macro.handler = function() {
        const args = Array.from(this.args);
        let amount = Number(args[0] ?? 0);
        let modifier = args[1] ?? 4;

        if (V.CE_painCheat && amount !== 0) {
            if (amount > 0) {
                amount *= V.CE_painMultiplier;
            } else {
                amount *= V.CE_painNegativeMultiplier;
            }
            console.log(`[Cheat Extended] 😌 Pain ${args[0]} → ${amount}`);
        }

        return originalHandler.call({ args: [amount, modifier] });
    };

    console.log("[Cheat Extended] ✅ Pain macro hook（正負倍率）");
})();

// ---------------------- masopain 宏 Hook ----------------------
//似乎與受虐掛勾
(function(){
    const macro = Macro.get('masopain');
    if (!macro) {
        console.warn("[Cheat Extended] ⚠️ 找不到宏: masopain");
        return;
    }

    const originalHandler = macro.handler;

    // 初始化作弊變數（與 pain 共用）
    if (typeof V.CE_painCheat !== 'boolean') V.CE_painCheat = false;
    if (typeof V.CE_painMultiplier !== 'number') V.CE_painMultiplier = 0.5;          // 增加時倍率
    if (typeof V.CE_painNegativeMultiplier !== 'number') V.CE_painNegativeMultiplier = 2; // 減少時倍率

    // Hook 宏
    macro.handler = function() {
        const args = Array.from(this.args);
        let amount = Number(args[0] ?? 0);

        if (V.CE_painCheat && amount !== 0) {
            if (amount > 0) {
                amount *= V.CE_painMultiplier;  // 增加 → 縮小
            } else {
                amount *= V.CE_painNegativeMultiplier;  // 減少 → 放大
            }
            console.log(`[Cheat Extended] 😌 Masopain ${args[0]} → ${amount}`);
        }

        // 呼叫原始 masopain 宏，保留 arousal 計算
        return originalHandler.call({ args: [amount] });
    };

    console.log("[Cheat Extended] ✅ Masopain 宏已 Hook（與 pain 共用倍率）");
})();

// ---------------------- Trauma 宏 Hook ----------------------
(function () {
    if (typeof V.CE_traumaCheat !== 'boolean') V.CE_traumaCheat = false;
    if (typeof V.CE_traumaMultiplier !== 'number') V.CE_traumaMultiplier = 0.5;          // 正數倍率 0~1
    if (typeof V.CE_traumaNegativeMultiplier !== 'number') V.CE_traumaNegativeMultiplier = 2; // 負數倍率 1~5

    const traumaMacros = ['trauma', 'combattrauma', 'straighttrauma'];

    traumaMacros.forEach(name => {
        const macro = Macro.get(name);
        if (!macro) {
            console.warn(`[Cheat Extended] ⚠️ 找不到宏: ${name}`);
            return;
        }

        const originalHandler = macro.handler;

        macro.handler = function () {
            const args = Array.from(this.args);
            let amount = Number(args[0] ?? 0);

            if (V.CE_traumaCheat && amount !== 0) {
                if (amount > 0) {
                    amount *= V.CE_traumaMultiplier;
                } else {
                    amount *= V.CE_traumaNegativeMultiplier;
                }
                console.log(`[Cheat Extended] 💀 ${name} ${args[0]} → ${amount}`);
            }

            return originalHandler.call({ args: [amount] });
        };

        console.log(`[Cheat Extended] ✅ 宏 ${name} hook（正負倍率）`);
    });
})();

// ---------------------- Control 宏 Hook ----------------------
(function () {
    if (typeof V.CE_controlCheat !== 'boolean') V.CE_controlCheat = false;
    if (typeof V.CE_controlMultiplier !== 'number') V.CE_controlMultiplier = 2;          // 正數倍率 1~5
    if (typeof V.CE_controlNegativeMultiplier !== 'number') V.CE_controlNegativeMultiplier = 0.5; // 負數倍率 0~1

    const controlMacros = ['control', 'combatcontrol'];

    controlMacros.forEach(name => {
        const macro = Macro.get(name);
        if (!macro) {
            console.warn(`[Cheat Extended] ⚠️ 找不到宏: ${name}`);
            return;
        }

        const originalHandler = macro.handler;

        macro.handler = function () {
            const args = Array.from(this.args);
            let amount = Number(args[0] ?? 0);

            if (V.CE_controlCheat && amount !== 0) {
                if (amount > 0) {
                    amount *= V.CE_controlMultiplier;
                } else {
                    amount *= V.CE_controlNegativeMultiplier;
                }
                console.log(`[Cheat Extended] 🎮 ${name} ${args[0]} → ${amount}`);
            }

            return originalHandler.call({ args: [amount] });
        };

        console.log(`[Cheat Extended] ✅ 宏 ${name} hook（正負倍率）`);
    });
})();

// ---------------------- stress 宏 Hook ----------------------
(function(){
    const macro = Macro.get('stress');
    if (!macro) {
        console.error("[Cheat Extended] ❌ 找不到 stress 宏");
        return;
    }

    // 保存原 handler
    const originalHandler = macro.handler;

    // 初始化作弊變數
    if (typeof V.CE_stressCheat !== 'boolean') V.CE_stressCheat = false;
    if (typeof V.CE_stressMultiplier !== 'number') V.CE_stressMultiplier = 0.5;          // 正數倍率：增加量衰減 0~1
    if (typeof V.CE_stressNegativeMultiplier !== 'number') V.CE_stressNegativeMultiplier = 2; // 負數倍率：減少量放大 >1

    // Hook
    macro.handler = function(){
        const args = Array.from(this.args);
        let amount = Number(args[0] ?? 0);
        let multiplierOverride = args[1] ? Number(args[1]) : undefined;

        if (V.CE_stressCheat && amount) {
            if (amount > 0) {
                amount *= V.CE_stressMultiplier;              // 衰減增加量
            } else {
                amount *= V.CE_stressNegativeMultiplier;      // 放大減少量
            }
        }

        return originalHandler.call({ args: [amount, multiplierOverride] });
    };

    console.log("[Cheat Extended] ✅ Stress 宏已 Hook（壓力可調整正負倍率）");
})();

// ---------------------- sensitivity 宏 Hook ----------------------
(function(){
    // 初始化作弊變數
    if (typeof V.CE_sensCheat !== 'boolean') V.CE_sensCheat = false;
    if (typeof V.CE_sensMultiplier !== 'number') V.CE_sensMultiplier = 0.5;           // 增加倍率 0~1
    if (typeof V.CE_sensNegativeMultiplier !== 'number') V.CE_sensNegativeMultiplier = 2; // 減少倍率 >1

    const keys = ["breast", "mouth", "genital", "bottom"];

    keys.forEach(key => {
        const macroName = key + "_sensitivity";
        const macro = Macro.get(macroName);
        if (!macro) {
            console.warn(`[Cheat Extended] ⚠️ 找不到宏: ${macroName}`);
            return;
        }

        const originalHandler = macro.handler;

        macro.handler = function(){
            const args = Array.from(this.args);
            let amount = Number(args[0] ?? 0);

            if (V.CE_sensCheat && amount) {
                if (amount > 0) amount *= V.CE_sensMultiplier;       // 增加不利 → 衰減
                else amount *= V.CE_sensNegativeMultiplier;          // 減少有利 → 放大
            }

            return originalHandler.call({ args: [amount] });
        };

        console.log(`[Cheat Extended] ✅ 宏 ${macroName} 已 Hook（敏感度可調整正負倍率）`);
    });
})();

// ---------------------- arousal 宏 Hook ----------------------
(function(){
    const macroNames = ["arousal", "breastarousal", "genitalarousal"];
    
    // 初始化作弊變數
    if (typeof V.CE_arousalCheat !== 'boolean') V.CE_arousalCheat = false;
    if (typeof V.CE_arousalMultiplier !== 'number') V.CE_arousalMultiplier = 0.5;           // 增加倍率 0~1
    if (typeof V.CE_arousalNegativeMultiplier !== 'number') V.CE_arousalNegativeMultiplier = 2; // 減少倍率 >1

    macroNames.forEach(name => {
        const macro = Macro.get(name);
        if (!macro) {
            console.warn(`[Cheat Extended] ⚠️ 找不到宏: ${name}`);
            return;
        }

        const originalHandler = macro.handler;

        macro.handler = function(){
            const args = Array.from(this.args);
            let amount = Number(args[0] ?? 0);
            let source = args[1]; // source 可以是 undefined 或字串

            if (V.CE_arousalCheat && amount) {
                if (amount > 0) amount *= V.CE_arousalMultiplier;      // 增加量衰減
                else amount *= V.CE_arousalNegativeMultiplier;         // 減少量放大
            }

            return originalHandler.call({ args: [amount, source] });
        };

        console.log(`[Cheat Extended] ✅ 宏 ${name} 已 Hook（性興奮可調整正負倍率）`);
    });
})();

// ---------------------- tiredness 宏 Hook ----------------------
(function(){
    const macro = Macro.get('tiredness');
    if (!macro) return console.warn("[Cheat Extended] ⚠️ 找不到宏: tiredness");

    const originalHandler = macro.handler;

    // 初始化作弊變數
    if (typeof V.CE_tiredCheat !== 'boolean') V.CE_tiredCheat = false;
    if (typeof V.CE_tiredMultiplier !== 'number') V.CE_tiredMultiplier = 0.5;           // 增加倍率
    if (typeof V.CE_tiredNegativeMultiplier !== 'number') V.CE_tiredNegativeMultiplier = 2; // 減少倍率

    macro.handler = function(){
        const args = Array.from(this.args);
        let amount = Number(args[0] ?? 0);

        if (V.CE_tiredCheat && amount) {
            if (amount > 0) amount *= V.CE_tiredMultiplier;
            else amount *= V.CE_tiredNegativeMultiplier;
        }

        return originalHandler.call({ args: [amount] });
    };

    console.log("[Cheat Extended] ✅ 宏 tiredness 已 Hook（疲勞可調整正負倍率）");
})();

// ---------------------- SexSkill相關 宏 Hook ----------------------
(function(){
    const skillMacros = [
        "oralskill","vaginalskill","penileskill","handskill","analskill",
        "feetskill","bottomskill","thighskill","chestskill",
        "beauty","seductionskill","skulduggery"
    ];

    // 初始化作弊變數
    if (typeof V.CE_skillCheat !== 'boolean') V.CE_skillCheat = false;
    if (typeof V.CE_skillMultiplier !== 'number') V.CE_skillMultiplier = 2; // 預設雙倍

    skillMacros.forEach(name => {
        const macro = Macro.get(name);
        if (!macro) {
            console.warn(`[Cheat Extended] ⚠️ 找不到宏: ${name}`);
            return;
        }

        const originalHandler = macro.handler;

        macro.handler = function() {
            let args = Array.from(this.args);
            let amount = Number(args[0] ?? 0);

            if (V.CE_skillCheat && amount > 0) {
                amount *= V.CE_skillMultiplier;
                console.log(`[Cheat Extended] 💪 ${name} 原始 ${args[0]} → ${amount}`);
            }

            return originalHandler.call({ args: [amount] });
        };

        console.log(`[Cheat Extended] ✅ 宏 ${name} 已 Hook（技能可放大）`);
    });
})();
