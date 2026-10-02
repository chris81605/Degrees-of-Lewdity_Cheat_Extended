// hook工具請參考CE_hookTool.js
/*
=========================================================
初始化註冊
=========================================================
*/

$(document).one(':passagestart',()=>{

    // ------------------- Pain -------------------
    VarHook.register(
        "pain",
        "CE_painMultiplier",
        "CE_painNegativeMultiplier"
    );

    // ------------------- Trauma -------------------
    VarHook.register(
        "trauma",
        "CE_traumaMultiplier",
        "CE_traumaNegativeMultiplier"
    );

    // ------------------- Control -------------------
    VarHook.register(
        "control",
        "CE_controlMultiplier",
        "CE_controlNegativeMultiplier"
    );

    // ------------------- Stress -------------------
    VarHook.register(
        "stress",
        "CE_stressMultiplier",
        "CE_stressNegativeMultiplier"
    );

    // ------------------- Arousal -------------------
    VarHook.register(
        "arousal",
        "CE_arousalMultiplier",
        "CE_arousalNegativeMultiplier"
    );

    // ------------------- Tiredness -------------------
    VarHook.register(
        "tiredness",
        "CE_tiredMultiplier",
        "CE_tiredNegativeMultiplier"
    );

    // ------------------- angelBanish(觸手放逐) -------------------
    // 預設仍走倍率邏輯：
    // 正向變化倍率 = 1
    // 負向變化倍率 = 若 CE_noAngelBanishLoss 開啟則 0，否則 1
    VarHook.register(
        "angelBanish",
        1,
        () => V?.CE_noAngelBanishLoss ? 0 : 1
    );

    // ------------------- oxygen(氧氣) -------------------
    // 預設仍走倍率邏輯：
    // 正向變化倍率 = 1
    // 負向變化倍率 = 若 CE_lockOxygenEnabled 開啟則 0，否則 1
    VarHook.register(
        "oxygen",
        1,
        () => V?.CE_lockOxygenEnabled ? 0 : 1
    );

    // ------------------- wardrobe.space(衣櫃空間) -------------------
    // 避免第三方模組修改衣櫃容量
    //
    VarHook.register(
        "wardrobe.space",
        1,
        1,
        {
            transform(ctx){

                // 開關沒開，正常允許變化
                if (!V?.bigest_wardrobe_swich){
                    return ctx.old + ctx.adjustedDiff;
                }

                // 開關開啟時，允許改成指定固定值
                if (Number(ctx.newValue) === Number(V?.bigest_wardrobe_fix)){
                    return ctx.newValue;
                }

                // 其他第三方修改全部擋掉
                return ctx.old;
            }
        }
    );

    VarHook.installAll();

});
