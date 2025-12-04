// clearCEVars.js
// 用途：清除 CE 相關變數清單
// 調用方式：clearCEVars();

(function() {
    // 清單中所有變數名稱
    const varsToClear = [
        //"Bedroom_Study_phase",
        "CE_Toggle",
        "CE_YL_leftui_enable",
        "CE_milk_max",
        "CE_milk_volume",
        "CE_semen_max",
        "CE_semen_volume",
        "CE_tattoo",
        "CE_tattoo_index",
        "HP_AP_display_swich",
        //"_maxWarmth",
        //"_minWarmth",
        //"_type",
        "bccm",
        "bccmplot",
        "bccmpreviouspassage",
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
        "ccpassagecount",
        "ccplot",
        "damage",
        "damage_oringinal",
        "dance_reward_swich",
        "dancetip_FIX",
        //"debug",
        //"degree",
        //"english_exam",
        "fromIndex",
        "history_exam",
        "incompletePregnancyDisable",
        "index_max",
        "index_min",
        //"maths_exam",
        //"milk_amount",
        //"milk_max",
        "milk_releasedFIX",
        "milk_releasedFIX_MAX",
        "milk_releasedFIX_MIN",
        "milk_releasedswich",
        //"milk_volume",
        "painfix",
        "painfixset",
        //"science_exam",
        //"semen_max",
        "semen_releasedFIX",
        "semen_releasedswich",
        //"semen_volume",
        //"stalkTestNPC",
        "stall_cost_FIX",
        "study_hard",
        "swich",
        "swich_auto_clothes_Warmth",
        "swich_bccmeditor",
        "swich_teleportation",
        "swich_yanling",
        "teleportation",
        "teleportation_name",
        "toIndex",
        //"wardrobe_location",
        "yanling_ui_hide",
        "CE_SFflag",
        "CE_forceAttendSchool",
        "V.CE_moneyCheat",
        "V.CE_moneyInMultiplier",
        "V.CE_moneyOutMultiplier",
        "V.CE_moneyWatchEnabled",
        "V.CE_moneyChangeQueue"
    ];

    // 封裝成全局函數
    function clearCEVars () {
        varsToClear.forEach(v => {
            State.variables[v] = undefined; // 清空變數
        });
        console.log("[Cheat Extended] 🔧已清除 CE 相關變數清單");
    };
    window.clearCEVars = clearCEVars;
})();
