/*
=========================================================
Cheat Extended - VarHook 變數監聽框架
---------------------------------------------------------
功能：
- 監聽指定的 V.xxx 變數
- 攔截變數修改
- 計算變數差值
- 依註冊乘數轉換差值
- 將轉換後結果寫回變數

支援乘數類型：
1. 數字
2. 變數名稱 (自動從 V 讀取)
3. 函數 (動態計算)

格式：
    VarHook.register("stress",1,1)
    VarHook.register("stats.stress",1,1)

流程：
    V.stress += 5
        ↓
    setter 攔截
        ↓
    計算 diff
        ↓
    依註冊乘數轉換差值
        ↓
    將計算後結果加回原變數
=========================================================
*/

(function () {

    /* =====================================================
    狀態
    ===================================================== */

    // 註冊表
    const registry = {};

    // 已安裝 hook 的變數
    const installed = {};
    
    // [新增] 事件監聽表
    const events = {};      

    // 是否啟用 VarHook
    V.CE_VarHook_enable = false;

    // macro操作旗標
    // 當 macro 修改變數時跳過 hook
    setup.CE_macroLock = false;

    // 防止 setter 自己寫回變數造成無限遞迴
    let lock = false;

    // Debug 開關
    const DEBUG = true;


    /* =====================================================
    Debug 輸出工具
    ===================================================== */

    function log(...msg){
        if (DEBUG) console.log("[Cheat Extended][VarHook]", ...msg);
    }

    function warn(...msg){
        console.warn("[Cheat Extended][VarHook]", ...msg);
    }

    function error(...msg){
        console.error("[Cheat Extended][VarHook]", ...msg);
    }


    /* =====================================================
    工具
    -----------------------------------------------------
    解析變數路徑並回傳父物件與 key

    例：
        stats.stress
        -> obj = V.stats
        -> key = stress
    ===================================================== */

    function getParentAndKey(path){

        const parts = path.split(".");

        let obj = State.variables;

        for (let i=0; i<parts.length-1; i++){
            obj = obj?.[parts[i]];
            if (!obj) return null;
        }
        
        return {
            obj,
            key: parts[parts.length-1]
        };
    }

    /* =====================================================
    乘數解析器
    -----------------------------------------------------
    支援三種類型：

    number
    string (V.xxx)
    function
    ===================================================== */

    function resolveMultiplier(mult){
        try{
            if (typeof mult === "number") return mult;

            if (typeof mult === "string"){
                const v = State.variables[mult];
                const num = Number(v);
            
                if (v === undefined) {
                    warn("Multiplier variable not found:", mult, "using default 1");
                    return 1;
                }                
                if (Number.isNaN(num)) {
                    warn("Multiplier variable is NaN:", mult, v, "using default 1");
                    return 1;
                }
                return num;
            }

            if (typeof mult === "function"){
                const num = Number(mult());
                if (Number.isNaN(num)) {
                    warn("Multiplier function returned NaN:", mult, "using default 1");
                    return 1;
                }
                return num;
            }

            if (mult == null) {
                warn("Multiplier is null/undefined, using default 1");
                return 1;
            }

            if (typeof mult === "boolean") {
                warn("Multiplier is boolean:", mult, "using default 1");
                return 1;
            }

            if (typeof mult === "object") {
                warn("Multiplier is object/array:", mult, "using default 0");
                return 1;
            }

            warn("Multiplier unknown type:", mult, "using default 1");
            return 1;

        } catch(e){
            error("multiplier resolve error:", mult, e);
            return 1;
        }
    }

    /* =====================================================
    差值轉換
    -----------------------------------------------------
    依註冊乘數計算最終變動量
    ===================================================== */

    function convertDiff(path, diff){

        const config = registry[path];

        if (!config) return diff;

        let mult;

        if (diff > 0){
            mult = resolveMultiplier(config.pos);
        }
        else if (diff < 0){
            mult = resolveMultiplier(config.neg);
        }
        else{
            return 0;
        }
        return diff * mult;
    }

    /* =====================================================
    註冊函數
    -----------------------------------------------------
    posMult  = 正向變化乘數
    negMult  = 負向變化乘數
    ===================================================== */

    function register(varPath, posMult, negMult){

        registry[varPath] = {

            pos: posMult,
            neg: negMult
        };

        log("register:", varPath, posMult, negMult);
    }
    
    /* =====================================================
    事件監聽註冊
    -----------------------------------------------------
    用途：
        監聽指定變數在 VarHook 修改後的變化

    用法：
        VarHook.on("變數路徑", callback)

    callback 參數：
        oldValue  修改前數值
        newValue  修改後數值
        diff      最終套用的變化量

    範例：
        VarHook.on("angelBanish",(oldVal,newVal,diff)=>{
            console.log(oldVal,"→",newVal);
        });
    ===================================================== */    
    function on(varPath, callback){

        if (!events[varPath]){
            events[varPath] = [];
        }

        events[varPath].push(callback);

        log("event registered:", varPath);
    }


    /* =====================================================
    Hook 安裝
    -----------------------------------------------------
    對指定變數安裝 setter hook
    ===================================================== */

    function installVarHook(path){

        try{

            if (installed[path]){
                log("skip installed:", path);
                return;
            }

            const resolved = getParentAndKey(path);

            if (!resolved){
                warn("path not found:", path);
                return;
            }

            const { obj, key } = resolved;

            if (!(key in obj)){
                warn("variable not found:", path);
                return;
            }

            let _value = obj[key];

            log("install hook:", path);

            Object.defineProperty(obj, key, {

                configurable: true,
                
                get(){
                    return _value;
                },

                set(newValue){
                    try{
                        const old = _value;
                        _value = newValue;
                        const macroLock = setup.CE_macroLock;

                        // VarHook 未啟用
                        
                        if (!V?.CE_VarHook_enable){
                            log("VarHook disable", path);
                            return;
                        }
                        

                        // macro 修改變數時跳過
                        if (macroLock){
                            log("macroLock skip:", path);
                            return;
                        }

                        // setter 寫回保護
                        if (lock){
                            log("locked skip:", path);
                            return;
                        }

                        if (old === newValue){
                            log("no change:", path);
                            return;
                        }

                        if (!(path in registry)){
                            warn("no registry:", path);
                            return;
                        }
                        
                        const oldNum = Number(old);
                        const newNum = Number(newValue);

                        if (Number.isNaN(oldNum) || Number.isNaN(newNum)){
                            warn("non numeric value:", path, old, newValue);
                            return;
                        }

                        const safeOld = Math.max(0, oldNum);
                        const safeNew = Math.max(0, newNum);
                        const diff = safeNew - safeOld;

                        if (diff === 0){
                            log("no effective change:", path);
                            return;
                        }

                        log(
                            "change detected:",
                            path,
                            "old:", safeOld,
                            "new:", safeNew,
                            "diff:", diff
                        );

                        const adjustedDiff = convertDiff(path, diff);

                        if(!Number.isFinite(adjustedDiff)){
                            warn("invalid diff:", adjustedDiff);
                            return;
                        }
                                               
                        log("adjustedDiff:", adjustedDiff);

                        const newValueFinal = old + adjustedDiff;

                        log(
                            "change:", path, 
                            "old:", old,
                            "→", 
                            "new:", newValueFinal, 
                            "diff:", diff, 
                            "adjustedDiff:", adjustedDiff
                        );

                        lock = true;
                        _value = newValueFinal;
                        lock = false;
                        
                        /* =============
                        觸發事件
                        =============== */

                        if (events[path]){

                            for (const cb of events[path]){
                                try{
                                    cb(old, newValue, appliedDiff);
                                }catch(e){
                                    error("VarHook event error:", path, e);
                                }
                            }
                        }
                    }
                    catch(e){
                        error("setter error:", path, e);
                        lock = false;
                    }
                }
            });
            installed[path] = true;
        }
        catch(e){
            error("installVarHook error:", path, e);
        }
    }

    /* =====================================================
    安裝所有註冊 hook
    ===================================================== */

    function installAll(){
        
        log("installAll start");

        try{
            for (const v in registry){
                installVarHook(v);
            }
        }
        catch(e){
            error("installAll error:", e);
        }
    }

    /* =====================================================
    Passage 切換時重新掛載 hook
    -----------------------------------------------------
    SugarCube 特性：

    passage 切換時 State.variables 會 clone
    因此需要重新掛載 hook
    ===================================================== */

    $(document).on(":passagestart", () => {
        log("passage start reinstall");
        
        for (const v in installed){
            installed[v] = false;
        }
        installAll();
    });


    /* =====================================================
    對外 API
    ===================================================== */
    window.VarHook = {
        register,
        installAll,
        on
    };
})();

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

    /// ------------------- Tiredness -------------------
    VarHook.register(
        "tiredness",
        "CE_tiredMultiplier",
        "CE_tiredNegativeMultiplier"
    );
    
    /// ------------------- angelBanish(觸手放逐) -------------------
    
    VarHook.register(
        "angelBanish", 
        1, 
        () => V?.CE_noAngelBanishLoss ? 0 : 1
    );
    
    /// ------------------- oxygen(氧氣) -------------------
    
    VarHook.register(
        "oxygen", 
        1, 
        () => V?.CE_lockOxygenEnabled ? 0 : 1
    );

    VarHook.installAll();

});

/**
 * ========================================================
 * Cheat Extended 宏 Hook 通用函數說明
 * ========================================================
 *
 * 功能：
 *  1. 安全 hook Twine/SugarCube 宏，保留原始 this 上下文。
 *  2. 可修改任意數量參數（args），支援正負倍率、單倍率或自訂邏輯。
 *  3. 支援 log 輸出前後參數變化。
 *  4. 可快速擴充新宏，只需呼叫 hookMacro()。
 *
 * 核心函數：
 *  hookMacro(macroName, options)
 *
 * 參數說明：
 *  - macroName : 字串，宏的名稱 (Macro.get(macroName))
 *  - options : 物件，包含以下欄位：
 *      * cheatVar        : V 物件上的開關名稱 (boolean)，開啟/關閉作弊
 *      * multiplierVar   : V 物件上的正數倍率名稱 (number)
 *      * negativeVar     : V 物件上的負數倍率名稱 (number，可選)
 *      * modifyFunc      : 函數 (args) → 回傳修改後的 args 陣列
 *                          args 是宏原始傳入的參數陣列，可修改任意參數或新增參數
 *      * logFunc         : 函數 (macroName, oldArgs, newArgs)，可自訂 log
 *
 * 使用範例：
 * hookMacro('pain', {
 *     cheatVar: 'CE_painCheat',
 *     multiplierVar: 'CE_painMultiplier',
 *     negativeVar: 'CE_painNegativeMultiplier',
 *     modifyFunc: args => {
 *         args[0] = args[0] > 0 ? args[0] * V.CE_painMultiplier : args[0] * V.CE_painNegativeMultiplier;
 *         args[1] = args[1] ?? 4; // 保留或補預設值
 *         return args;
 *     },
 *     logFunc: (name, oldArgs, newArgs) => console.log(`😌 ${name} ${oldArgs[0]} → ${newArgs[0]}`)
 * });
 *
 * 注意事項：
 *  1. 所有宏的 this 上下文會被保留，不會丟失隱藏屬性。
 *  2. 若宏有多個參數需修改，可全部寫在 modifyFunc 中操作。
 *  3. 不需要修改的參數可以直接保留。
 *  4. 若需要新增參數，也可以在 modifyFunc 裡補入 args 陣列。
 *  5. logFunc 可自訂 log 或直接省略。
 *
 * ========================================================
 * 作者: CahtGpt & 隨風飄逸
 * 日期: 2025-12-05
 * ========================================================
 */

(function(){
    // ------------------- 通用 Hook 函數 -------------------
    function hookMacro(macroName, {
        cheatVar,          // V.CE_xxx 作弊開關
        multiplierVar,     // V.CE_xxxMultiplier 正數倍率
        negativeVar,       // V.CE_xxxNegativeMultiplier 負數倍率（可選）
        modifyFunc,        // 自訂修改函數 (args) → 回傳新的 args
        logFunc            // 自訂 log 函數 (macroName, oldArgs, newArgs)
    }) {
        const macro = Macro.get(macroName);
        if (!macro) {
            console.warn(`[Cheat Extended][macroHook] ⚠️ 找不到宏: ${macroName}`);
            return;
        }
        
        if (macro._CE_hooked) {
            console.warn(`[Cheat Extended][macroHook] ⚠️ ${macroName}已hook。`);
            return; // 已經hook過
        }    
        
        macro._CE_hooked = true;

        const originalHandler = macro.handler;

        // 初始化作弊變數
        if (typeof V[cheatVar] !== 'boolean') V[cheatVar] = false;
        if (typeof V[multiplierVar] !== 'number') V[multiplierVar] = 1;
        if (negativeVar && typeof V[negativeVar] !== 'number') V[negativeVar] = 1;

        macro.handler = function(){
            let args = Array.from(this.args);
            const oldArgs = [...args];

            if (V[cheatVar] && modifyFunc) {
                args = modifyFunc(args);
            }

            // 覆寫回 this.args
            for (let i = 0; i < args.length; i++) this.args[i] = args[i];

            if (logFunc) logFunc(macroName, oldArgs, args);

            
            //return originalHandler.call(this);
            setup.CE_macroLock = true;
            try {
                return originalHandler.call(this);
            }
            finally {
                setup.CE_macroLock = false;
            }
        };

        console.log(`[Cheat Extended][macroHook] ✅ 宏 ${macroName} 已 Hook`);
    }
    
    setup.CE_registerMacroHooks = function(){
        // ------------------- Pain / Masopain -------------------
        ['pain','masopain'].forEach(name => {
            hookMacro(name, {
                cheatVar: 'CE_painCheat',
                multiplierVar: 'CE_painMultiplier',
                negativeVar: 'CE_painNegativeMultiplier',
                modifyFunc: args => {
                    let amount = Number(args[0] ?? 0);
                    args[0] = amount > 0 ? amount * V.CE_painMultiplier : amount * V.CE_painNegativeMultiplier;
                    // Pain 第二參數保留
                    if (name === 'pain') args[1] = args[1] ?? 4;
                    return args;
                },
                logFunc: (name, oldArgs, newArgs) => console.log(`[Cheat Extended][macroHook] 😌 ${name} ${oldArgs[0]} → ${newArgs[0]}`)
            });
        });

        // ------------------- Trauma -------------------
        ['trauma','combattrauma','straighttrauma'].forEach(name => {
            hookMacro(name, {
                cheatVar: 'CE_traumaCheat',
                multiplierVar: 'CE_traumaMultiplier',
                negativeVar: 'CE_traumaNegativeMultiplier',
                modifyFunc: args => {
                    let amount = Number(args[0] ?? 0);
                    args[0] = amount > 0 ? amount * V.CE_traumaMultiplier : amount * V.CE_traumaNegativeMultiplier;
                    return args;
                },
                logFunc: (name, oldArgs, newArgs) => console.log(`[Cheat Extended][macroHook] 💀 ${name} ${oldArgs[0]} → ${newArgs[0]}`)
            });
        });

        // ------------------- Control -------------------
        ['control','combatcontrol'].forEach(name => {
            hookMacro(name, {
                cheatVar: 'CE_controlCheat',
                multiplierVar: 'CE_controlMultiplier',
                negativeVar: 'CE_controlNegativeMultiplier',
                modifyFunc: args => {
                    let amount = Number(args[0] ?? 0);
                    args[0] = amount > 0 ? amount * V.CE_controlMultiplier : amount * V.CE_controlNegativeMultiplier;
                    return args;
                },
                logFunc: (name, oldArgs, newArgs) => console.log(`[Cheat Extended][macroHook] 🎮 ${name} ${oldArgs[0]} → ${newArgs[0]}`)
            });
        });

        // ------------------- Stress -------------------
        hookMacro('stress', {
            cheatVar: 'CE_stressCheat',
            multiplierVar: 'CE_stressMultiplier',
            negativeVar: 'CE_stressNegativeMultiplier',
            modifyFunc: args => {
                let amount = Number(args[0] ?? 0);
                args[0] = amount > 0 ? amount * V.CE_stressMultiplier : amount * V.CE_stressNegativeMultiplier;
                return args;
            },
            logFunc: (name, oldArgs, newArgs) => console.log(`[Cheat Extended][macroHook] 😰 ${name} ${oldArgs[0]} → ${newArgs[0]}`)
        });

        // ------------------- Sensitivity -------------------
        ['breast','mouth','genital','bottom'].forEach(key => {
            hookMacro(key + '_sensitivity', {
                cheatVar: 'CE_sensCheat',
                multiplierVar: 'CE_sensMultiplier',
                negativeVar: 'CE_sensNegativeMultiplier',
                modifyFunc: args => {
                    let amount = Number(args[0] ?? 0);
                    args[0] = amount > 0 ? amount * V.CE_sensMultiplier : amount * V.CE_sensNegativeMultiplier;
                    return args;
                },
                logFunc: (name, oldArgs, newArgs) => console.log(`[Cheat Extended][macroHook] 🥵 ${name} ${oldArgs[0]} → ${newArgs[0]}`)
            });
        });

        // ------------------- Arousal -------------------
        ['arousal','breastarousal','genitalarousal'].forEach(name => {
            hookMacro(name, {
                cheatVar: 'CE_arousalCheat',
                multiplierVar: 'CE_arousalMultiplier',
                negativeVar: 'CE_arousalNegativeMultiplier',
                modifyFunc: args => {
                    let amount = Number(args[0] ?? 0);
                    args[0] = amount > 0 ? amount * V.CE_arousalMultiplier : amount * V.CE_arousalNegativeMultiplier;
                    return args;
                },
                logFunc: (name, oldArgs, newArgs) => console.log(`[Cheat Extended][macroHook] 🔥 ${name} ${oldArgs[0]} → ${newArgs[0]}`)
            });
        });

        // ------------------- Tiredness -------------------
        hookMacro('tiredness', {
            cheatVar: 'CE_tiredCheat',
            multiplierVar: 'CE_tiredMultiplier',
            negativeVar: 'CE_tiredNegativeMultiplier',
            modifyFunc: args => {
                let amount = Number(args[0] ?? 0);
                args[0] = amount > 0 ? amount * V.CE_tiredMultiplier : amount * V.CE_tiredNegativeMultiplier;
                return args;
            },
            logFunc: (name, oldArgs, newArgs) => console.log(`[Cheat Extended][macroHook] 😴 ${name} ${oldArgs[0]} → ${newArgs[0]}`)
        });

        // ------------------- SexSkill -------------------
        [
            "oralskill","vaginalskill","penileskill","handskill","analskill",
            "feetskill","bottomskill","thighskill","chestskill",
            "beauty","seductionskill","skulduggery"
        ].forEach(name => {
            hookMacro(name, {
                cheatVar: 'CE_skillCheat',
                multiplierVar: 'CE_skillMultiplier',
                modifyFunc: args => {
                    let amount = Number(args[0] ?? 0);
                    if (amount > 0) args[0] = amount * V.CE_skillMultiplier;
                    return args;
                },
                logFunc: (name, oldArgs, newArgs) => console.log(`[Cheat Extended][macroHook] 💪 ${name} ${oldArgs[0]} → ${newArgs[0]}`)
            });
        });
    };

    $(document).on(':passagedisplay', function () {
        setup.CE_registerMacroHooks();
    });

})();