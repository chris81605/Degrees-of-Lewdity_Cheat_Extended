(function () {
    "use strict";

    const activeCEVars = [
        "CE_Toggle",
        "CE_YL_leftui_enable",
        "CE_milk_max",
        "CE_milk_volume",
        "CE_semen_max",
        "CE_semen_volume",
        "CE_tattoo",
        "CE_tattoo_index",

        "bigest_wardrobe_fix",
        "bigest_wardrobe_swich",
        "black_store_FIX_MAX",
        "black_store_FIX_MIN",
        "black_storeswich",

        "brothel_basement_price",
        "brothel_basement_price_FIX",
        "brothel_basement_swich",

        "cccheat",
        "cccheat_display",
        "cccheat_name",
        "cccheat_name_display",

        "dance_reward_swich",
        "dancetip_FIX",

        "fromIndex",
        "toIndex",
        "index_max",
        "index_min",

        "history_exam",

        "milk_releasedFIX",
        "milk_releasedFIX_MAX",
        "milk_releasedFIX_MIN",
        "milk_releasedswich",

        "semen_releasedFIX",
        "semen_releasedswich",

        "painfix",

        "stall_cost_FIX",

        "swich",
        "swich_auto_clothes_Warmth",
        "swich_teleportation",
        "swich_yanling",

        "teleportation",
        "teleportation_name",
        "yanling_ui_hide",

        "CE_SFflag",
        "CE_forceAttendSchool",

        "CE_painCheat",
        "CE_painMultiplier",
        "CE_painNegativeMultiplier",

        "CE_traumaCheat",
        "CE_traumaMultiplier",
        "CE_traumaNegativeMultiplier",

        "CE_controlCheat",
        "CE_controlMultiplier",
        "CE_controlNegativeMultiplier",

        "CE_stressCheat",
        "CE_stressMultiplier",
        "CE_stressNegativeMultiplier",

        "CE_sensCheat",
        "CE_sensMultiplier",
        "CE_sensNegativeMultiplier",

        "CE_arousalCheat",
        "CE_arousalMultiplier",
        "CE_arousalNegativeMultiplier",

        "CE_tiredCheat",
        "CE_tiredMultiplier",
        "CE_tiredNegativeMultiplier",

        "CE_skillCheat",
        "CE_skillMultiplier",

        "CE_timePassMultiplier",
        "CE_timeMultiplier",

        "CE_violenceEnabled",
        "CE_violenceMultiplier",

        "CE_damageEnabled",
        "CE_damageMultiplier",

        "CE_forceEnableCheat",
        "CE_sideBarIconEnable",
        "CE_featBypass",

        "CE_purityControl",
        "CE_purityMax",
        "CE_purityAddMultiplier",
        "CE_puritySubMultiplier",

        "CE_parasiteControl",
        "CE_parasiteMaxAnus",
        "CE_parasiteMaxVagina",
        "CE_parasiteUnlimited",
        "CE_parasiteMultiplierEnable",
        "CE_parasiteMultiplier",

        "CE_EnemyStateEnable",
        "CE_hideUiBarToggleEnable",

        "CE_autoRepairClothesEnabled",
        "CE_autoRepairClothesRatio",
        "CE_autoRepairClothesLockSlots",

        "CE_nectarKeeperEnabled",
        "CE_LastTab",
        "CE_TabHidden",
        "CE_TabFavorite",
        "CE_lockOxygenEnabled"
        
        "CE_angelBuildDailyGainEnabled",
        "CE_angelBuildDailyGainAmount",
        "CE_fallenangelBuildDailyGainEnabled",
        "CE_fallenangelBuildDailyGainAmount",
        "CE_demonBuildDailyGainEnabled",
        "CE_demonBuildDailyGainAmount",
        "CE_wolfBuildDailyGainEnabled",
        "CE_wolfBuildDailyGainAmount",
        "CE_catBuildDailyGainEnabled",
        "CE_catBuildDailyGainAmount",
        "CE_cowBuildDailyGainEnabled",
        "CE_cowBuildDailyGainAmount",
        "CE_birdBuildDailyGainEnabled",
        "CE_birdBuildDailyGainAmount",
        "CE_foxBuildDailyGainEnabled",
        "CE_foxBuildDailyGainAmount"
        
        "CE_TabOrder",
        "CE_VarHook_enable",

        "CE_hideCEToggleDisable",

        "CE_autoRepairClothesInverseLock",
        "CE_autoRepairLockEnabled",

        "CE_moneyCheat",
        "CE_moneyInMultiplier",
        "CE_moneyOutMultiplier",
        "CE_moneyWatchEnabled",
        "CE_moneyChangeQueue",

        "CE_purityMin",

        "CE_parasiteMultiplierLog",
        
    ];

    const missingButActiveVars = [      
        //未以CE_開頭的變數
        "brothel_basement_multiplier",
        "brothel_basement_price_base",
        "brothel_basement_switch",        

        "clothTypeAutoApply",
        "clothTypeLastPreset",
        "clothTypePresets",

        "customEye",
        "customSkin",

        "swich_extraStatusRestore",
                
        "myModCombatSkillOnceUsed"
    ];

    const legacyOnlyVars = [
        //舊版殘留變數
        "Bedroom_Study_phase",
        "HP_AP_display_swich",

        "ccpassagecount",
        "ccplot",
        "swich_bccmeditor", 

        "damage",
        "damage_oringinal",        

        "painfixset",

        "study_hard",               
    ];

    const varsToClear = Array.from(new Set([
        ...activeCEVars,
        ...missingButActiveVars,
        ...legacyOnlyVars
    ]));

    function clearCEVars() {
        const V = State.variables;
        let cleared = 0;

        varsToClear.forEach(name => {
            if (Object.prototype.hasOwnProperty.call(V, name)) {
                delete V[name];
                cleared++;
            }
        });

        console.log(`[Cheat Extended] 🔧已清除 CE 相關變數：${cleared}/${varsToClear.length}`);
    }

    window.clearCEVars = clearCEVars;
    window.clearCEVarsList = varsToClear;
})();