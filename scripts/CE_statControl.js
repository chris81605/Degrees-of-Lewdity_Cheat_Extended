/*
=========================================================
Cheat Extended - DeepProxyHook 深層物件監聽框架
---------------------------------------------------------
功能：

- 監聽物件(Object)與陣列(Array)內部變化
- 攔截巢狀屬性修改
- 支援限制監聽深度
- 支援忽略指定 Key 或 Path
- 支援自訂變數處理邏輯
- 支援刪除事件攔截
- 支援 Debug 追蹤來源

---------------------------------------------------------
適用情境：

VarHook：
    適合數值變數

RawHook：
    適合整個變數被重新賦值

DeepProxyHook：
    適合監聽物件內部變化

例如：

    V.feats.currentSave.cat = true
    V.NPCList[0].health = 50
    V.worn.upper.name = "shirt"

---------------------------------------------------------
支援 Hook 階段：

before(ctx)
    寫入前執行

transform(ctx)
    自訂最終值

after(oldValue, finalValue, ctx)
    寫入後執行

delete(ctx)
    攔截刪除行為

---------------------------------------------------------
支援 Debug：

setup.CE_debugDeepProxyHook = true;

setup.CE_debugDeepProxyHookTargets = [
    "NPCList"
];

---------------------------------------------------------
註冊範例：

DeepProxyHook.register(
    "NPCList",
    {
        maxDepth : 2
    }
);

---------------------------------------------------------
可攔截：

V.NPCList[0].health = 50

V.NPCList[0].arousal = 100

delete V.NPCList[0].health

---------------------------------------------------------
深度範例：

maxDepth = 2
Proxy目標：V.tes

--------------------------------
Proxy存在於：

test       depth 0
test.a     depth 1
test.a.b   depth 2
--------------------------------
可以攔截：

test.a.b.c = 1

因為 set 發生在
Proxy(test.a.b)
--------------------------------
無法攔截：

test.a.b.c.d = 1

因為 c 已不是 Proxy
---------------------------------------------------------
運作流程：

寫入
    ↓
Proxy.set
    ↓
before(ctx)
    ↓
transform(ctx)
    ↓
寫回最終值
    ↓
after(...)

---------------------------------------------------------
注意事項：

1.
DeepProxyHook 使用 ES6 Proxy。

2.
僅代理註冊變數往下指定深度範圍。

3.
maxDepth 越高，
效能消耗越大。

4.
不建議對大型資料結構使用：

    NPCList
    wardrobe
    feats

超過必要深度。

5.
建議：

    maxDepth = 1~2

作為日常使用。

6.
主要用途：

    Debug
    相容性修復
    特殊攔截需求

不建議大量長期掛載。

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

    // 是否啟用 DeepProxyHook
    if (typeof V.CE_DeepProxyHook_enable !== "boolean") {
        V.CE_DeepProxyHook_enable = false;
    }

    // Debug 開關，跟隨 DoL 原版 debug
    const DEBUG = () => !!V.debug;

    // Debug 追蹤開關，不進存檔
    // null = 跟隨 DEBUG()
    // true = 強制開啟
    // false = 強制關閉
    if (setup.CE_debugDeepProxyHook === undefined) {
        setup.CE_debugDeepProxyHook = null;
    }

    // Debug 追蹤目標
    // null = 追蹤全部已註冊 DeepProxyHook 變數
    // Array = 只追蹤指定 root path
    if (setup.CE_debugDeepProxyHookTargets === undefined) {
        setup.CE_debugDeepProxyHookTargets = null;
    }


    /* =====================================================
    Debug 判斷
    ===================================================== */

    function isDebug(){
        return setup.CE_debugDeepProxyHook === null
            ? DEBUG()
            : !!setup.CE_debugDeepProxyHook;
    }

    function isDebugTarget(path){
        return (
            setup.CE_debugDeepProxyHookTargets == null ||
            (
                Array.isArray(setup.CE_debugDeepProxyHookTargets) &&
                setup.CE_debugDeepProxyHookTargets.includes(path)
            )
        );
    }


    /* =====================================================
    Debug 輸出工具
    ===================================================== */

    function log(...msg){
        if (DEBUG()) console.log("[Cheat Extended][DeepProxyHook]", ...msg);
    }

    function warn(...msg){
        if (DEBUG()) console.warn("[Cheat Extended][DeepProxyHook]", ...msg);
    }

    function error(...msg){
        console.error("[Cheat Extended][DeepProxyHook]", ...msg);
    }


    /* =====================================================
    工具
    -----------------------------------------------------
    解析變數路徑並回傳父物件與 key

    例：
        NPCList.0.health

    解析到最後一層前停止：

        obj = V.NPCList[0]
        key = health

    例：
        wardrobe

        obj = State.variables
        key = wardrobe
    ===================================================== */

    function getParentAndKey(path){

        const parts = path.split(".");
        let obj = State.variables;

        for (let i = 0; i < parts.length - 1; i++){
            obj = obj?.[parts[i]];
            if (!obj) return null;
        }

        return {
            obj,
            key: parts[parts.length - 1]
        };
    }


    /* =====================================================
    註冊函數
    -----------------------------------------------------
    varPath:
        要監聽的根路徑

        例如：
            "NPCList"
            "wardrobe"
            "feats.currentSave"

    options 可用欄位：

        deep
            是否啟用深層代理。
            預設 true。

        maxDepth
            最大代理深度。
            預設 2。

            注意：
                maxDepth 是從註冊路徑開始算。

            例：
                DeepProxyHook.register("test", {
                    maxDepth: 2
                });

                test        depth 0
                test.a      depth 1
                test.a.b    depth 2

                被代理到的物件，其直接屬性 set 會被攔截。

        ignoreKeys
            忽略指定 key。

            例：
                ignoreKeys: ["length"]

            可避免 array push 時 length 洗版。

        ignorePath(fullPath, propName)
            自訂忽略規則。

            回傳 true 表示忽略。

        before(ctx)
            寫入前執行。

        transform(ctx)
            自訂最終寫入值。

            若未提供，預設寫入 newValue。

        after(oldValue, finalValue, ctx)
            寫入後執行。

        delete(ctx)
            攔截 delete 行為。

            若回傳 false，則取消刪除。

    ctx 內容：

        rootPath    註冊根路徑
        path        目前所在路徑
        fullPath    完整變更路徑
        prop        原始 property key
        propName    String(prop)
        depth       目前 Proxy 深度
        target      被修改的目標物件
        oldValue    修改前值
        newValue    外部寫入的新值
        config      registry[rootPath]

    ===================================================== */

    function register(varPath, options = {}){

        registry[varPath] = {
            deep: options.deep ?? true,
            maxDepth: options.maxDepth ?? 2,

            ignoreKeys: options.ignoreKeys ?? [],
            ignorePath: options.ignorePath,

            before: options.before,
            transform: options.transform,
            after: options.after,
            delete: options.delete
        };

        log("register:", varPath, registry[varPath]);
    }


    /* =====================================================
    Hook 安裝
    -----------------------------------------------------
    對指定 object / array 安裝 DeepProxy

    與 VarHook / RawHook 不同：

    VarHook / RawHook：
        使用 Object.defineProperty()

    DeepProxyHook：
        使用 Proxy()

    因此 DeepProxyHook 會將原物件替換為 Proxy：

        obj[key]
            ↓
        Proxy(obj[key])
    ===================================================== */

    function installDeepProxyHook(path){

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

            const target = obj[key];

            if (target == null || typeof target !== "object"){
                warn("target is not object/array:", path, target);
                return;
            }

            const config = registry[path];

            /* =====================================================
            Proxy 快取
            -----------------------------------------------------
            避免同一物件被重複 Proxy。

            沒有快取時可能出現：

                Proxy(
                    Proxy(
                        Proxy(obj)
                    )
                )

            會導致：
                - 效能下降
                - 判斷混亂
                - 同一物件讀取結果不穩定
            ===================================================== */

            const proxyCache = new WeakMap();


            /* =====================================================
            忽略規則判斷
            -----------------------------------------------------
            符合以下條件時跳過 DeepProxyHook：

            1. propName 存在於 ignoreKeys
            2. ignorePath(fullPath, propName) 回傳 true
            ===================================================== */

            function shouldIgnore(fullPath, propName){

                if (config.ignoreKeys.includes(propName)){
                    return true;
                }

                if (
                    typeof config.ignorePath === "function" &&
                    config.ignorePath(fullPath, propName)
                ){
                    return true;
                }

                return false;
            }


            /* =====================================================
            Proxy 建立器
            -----------------------------------------------------
            將 object / array 包成 Proxy。

            depth 說明：

                註冊根物件      depth 0
                第一層子物件    depth 1
                第二層子物件    depth 2

            範例：

                DeepProxyHook.register("test", {
                    maxDepth: 2
                });

                V.test                depth 0
                V.test.a              depth 1
                V.test.a.b            depth 2
                V.test.a.b.c          depth 3，不再繼續代理

            注意：

                被代理到的物件，其直接屬性 set 仍會被攔截。

                所以 depth 2 的物件若已經被 Proxy，
                則：

                    V.test.a.b.c = 1

                會在 depth 2 的 Proxy 上觸發 set。
            ===================================================== */

            function proxify(targetObj, currentPath, depth){

                if (targetObj == null || typeof targetObj !== "object"){
                    return targetObj;
                }

                if (proxyCache.has(targetObj)){
                    return proxyCache.get(targetObj);
                }

                const proxy = new Proxy(targetObj, {

                    /* =========================
                    GET 攔截
                    ---------------------------------
                    用途：

                    1. 讀取屬性時，按需建立下一層 Proxy。
                    2. 避免一次代理整棵資料樹。
                    3. 控制最大代理深度。

                    例如：

                        V.NPCList[0]

                    只有真的讀取到 [0] 時，
                    才會建立該物件的 Proxy。
                    ========================== */

                    get(obj, prop, receiver){

                        const value = Reflect.get(obj, prop, receiver);

                        if (!config.deep){
                            return value;
                        }

                        if (typeof prop === "symbol"){
                            return value;
                        }

                        const propName = String(prop);
                        const fullPath = `${currentPath}.${propName}`;

                        if (shouldIgnore(fullPath, propName)){
                            return value;
                        }

                        if (depth >= config.maxDepth){
                            return value;
                        }

                        if (value != null && typeof value === "object"){
                            return proxify(value, fullPath, depth + 1);
                        }

                        return value;
                    },


                    /* =========================
                    SET 攔截
                    ---------------------------------
                    流程：

                    寫入
                        ↓
                    Debug 追蹤
                        ↓
                    檢查 DeepProxyHook 是否啟用
                        ↓
                    before(ctx)
                        ↓
                    transform(ctx)
                        ↓
                    Reflect.set()
                        ↓
                    after(...)
                    ========================== */

                    set(obj, prop, value, receiver){

                        const propName = String(prop);
                        const fullPath = `${currentPath}.${propName}`;
                        const oldValue = obj[prop];

                        if (shouldIgnore(fullPath, propName)){
                            return Reflect.set(obj, prop, value, receiver);
                        }

                        /* =========================
                        DEBUG用，追蹤誰在改指定變數
                        ---------------------------------
                        使用範例：

                        setup.CE_debugDeepProxyHook = true;

                        setup.CE_debugDeepProxyHookTargets = [
                            "NPCList"
                        ];

                        若 CE_debugDeepProxyHookTargets 為 null，
                        則追蹤所有 DeepProxyHook 變數。
                        ========================== */

                        if (
                            isDebug() &&
                            isDebugTarget(path)
                        ){
                            console.group("[Cheat Extended][DeepProxyHook SET]");
                            console.log("root:", path);
                            console.log("fullPath:", fullPath);
                            console.log("depth:", depth);
                            console.log("old:", oldValue);
                            console.log("new:", value);
                            console.trace();
                            console.groupEnd();
                        }

                        if (!V?.CE_VarHook_enable || !V?.CE_RawHook_enable){
                            return Reflect.set(obj, prop, value, receiver);
                        }

                        if (setup.CE_macroLock){
                            return Reflect.set(obj, prop, value, receiver);
                        }

                        if (oldValue === value){
                            return Reflect.set(obj, prop, value, receiver);
                        }

                        const ctx = {
                            rootPath: path,
                            path: currentPath,
                            fullPath,
                            prop,
                            propName,
                            depth,
                            target: obj,
                            oldValue,
                            newValue: value,
                            config
                        };

                        if (typeof config.before === "function"){
                            try{
                                config.before(ctx);
                            }catch(e){
                                error("before error:", fullPath, e);
                            }
                        }

                        let finalValue = value;

                        if (typeof config.transform === "function"){
                            try{
                                finalValue = config.transform(ctx);
                            }catch(e){
                                error("transform error:", fullPath, e);
                                return false;
                            }
                        }

                        const result = Reflect.set(obj, prop, finalValue, receiver);

                        if (typeof config.after === "function"){
                            try{
                                config.after(oldValue, finalValue, ctx);
                            }catch(e){
                                error("after error:", fullPath, e);
                            }
                        }

                        return result;
                    },


                    /* =========================
                    DELETE 攔截
                    ---------------------------------
                    可攔截：

                        delete obj.xxx

                    若 delete(ctx) 回傳 false，
                    則取消刪除。

                    回傳 true 或未提供 delete(ctx)，
                    則允許刪除。
                    ========================== */

                    deleteProperty(obj, prop){

                        const propName = String(prop);
                        const fullPath = `${currentPath}.${propName}`;
                        const oldValue = obj[prop];

                        if (shouldIgnore(fullPath, propName)){
                            return Reflect.deleteProperty(obj, prop);
                        }

                        if (
                            isDebug() &&
                            isDebugTarget(path)
                        ){
                            console.group("[Cheat Extended][DeepProxyHook DELETE]");
                            console.log("root:", path);
                            console.log("fullPath:", fullPath);
                            console.log("old:", oldValue);
                            console.trace();
                            console.groupEnd();
                        }

                        if (!V?.CE_VarHook_enable || !V?.CE_RawHook_enable){
                            return Reflect.deleteProperty(obj, prop);
                        }

                        if (setup.CE_macroLock){
                            return Reflect.deleteProperty(obj, prop);
                        }

                        const ctx = {
                            rootPath: path,
                            path: currentPath,
                            fullPath,
                            prop,
                            propName,
                            depth,
                            target: obj,
                            oldValue,
                            config
                        };

                        if (typeof config.delete === "function"){
                            try{
                                const allowDelete = config.delete(ctx);

                                if (allowDelete === false){
                                    return true;
                                }
                            }catch(e){
                                error("delete error:", fullPath, e);
                                return false;
                            }
                        }

                        return Reflect.deleteProperty(obj, prop);
                    }
                });

                proxyCache.set(targetObj, proxy);

                return proxy;
            }


            /* =====================================================
            實際掛載 Proxy
            -----------------------------------------------------
            將目標變數替換為 Proxy。

            例：

                V.test = { a: 1 }

            變成：

                V.test = Proxy({ a: 1 })

            後續：

                V.test.a = 2

            會進入 Proxy.set。
            ===================================================== */

            obj[key] = proxify(target, path, 0);
            installed[path] = true;

            log("install deep proxy hook:", path);
        }
        catch(e){
            error("installDeepProxyHook error:", path, e);
        }
    }


    /* =====================================================
    安裝所有註冊 hook
    ===================================================== */

    function installAll(){

        log("installAll start");

        try{
            for (const v in registry){
                installDeepProxyHook(v);
            }
        }
        catch(e){
            error("installAll error:", e);
        }
    }


    /* =====================================================
    Passage 切換時重新掛載 Proxy
    -----------------------------------------------------
    SugarCube 特性：

    State.variables 會在 Passage 切換時 clone。
    Proxy 可能會因此失效。

    因此需要在 passage start 時重新掛載。
    ===================================================== */

    $(document).on(":passagestart", () => {
        for (const v in installed){
            installed[v] = false;
        }

        installAll();
    });


    /* =====================================================
    對外 API
    ===================================================== */

    window.DeepProxyHook = {
        register,
        installAll
    };

})();

/*===================================
使用範例
---------------------------------------------
$(document).one(":passagestart", () => {

    V.CE_proxyTest = {
        a: 1,
        list: [],
        deep: {
            b: 2,
            c: {
                d: 3
            }
        }
    };

    DeepProxyHook.register("CE_proxyTest", {
        deep: true,
        maxDepth: 2,

        ignoreKeys: ["length"],

        transform(ctx){

            // 阻止 deep.b 被改成 999
            if (ctx.fullPath === "CE_proxyTest.deep.b" && ctx.newValue === 999){
                return ctx.oldValue;
            }

            return ctx.newValue;
        },

        delete(ctx){

            // 阻止刪除 a
            if (ctx.fullPath === "CE_proxyTest.a"){
                return false;
            }

            return true;
        },

        after(oldVal, finalVal, ctx){
            console.log("[DeepProxyHook after]", ctx.fullPath, oldVal, "→", finalVal);
        }
    });

    DeepProxyHook.installAll();
});
-----------------------------------------------------------------------
V.CE_DeepProxyHook_enable = true;
setup.CE_debugDeepProxyHook = true;
setup.CE_debugDeepProxyHookTargets = ["CE_proxyTest"];

V.CE_proxyTest.a = 10;          // 攔得到
V.CE_proxyTest.list.push(1);    // 攔得到 list.0，length 被 ignore
V.CE_proxyTest.deep.b = 999;    // 會被擋
V.CE_proxyTest.deep.c.d = 4;    // maxDepth:1 時攔不到
V.CE_proxyTest.deep.c = {}; // maxDepth:1 時攔得到
delete V.CE_proxyTest.a;        // 會被擋
=========================================================*/

/*
=========================================================
Cheat Extended - RawHook 原始變數攔截框架
---------------------------------------------------------
功能：
- 監聽指定的 V.xxx 變數
- 不要求數字
- 不計算 diff
- 不套倍率
- 攔截整個變數被重新賦值
- 由 transform(ctx) 決定最終值

適合：
- string
- object
- array
- boolean
- 需要整體鎖定的變數

限制：
- RawHook 只能攔截「已註冊路徑本身」的重新賦值。

可以攔截：
    RawHook.register("test", ...)
    V.test = 新值

    RawHook.register("test.a", ...)
    V.test.a = 123

    RawHook.register("test.0", ...)
    V.test[0] = "abc"

不能攔截：
    RawHook.register("test", ...)
    V.test.a = 123

    RawHook.register("test", ...)
    V.test.push(...)

原因：
    Hook 裝在哪個屬性上，就只能攔截那個屬性的 set。
    若只 Hook test，就只能攔 V.test = ...
    不會自動深入攔截 test.a 或 test[0]。
  
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

    // 事件監聽表
    const events = {};

    // 是否啟用 RawHook
    if (typeof V.CE_RawHook_enable !== "boolean") {
        V.CE_RawHook_enable = false;
    }

    // 防止 setter 自己寫回變數造成無限遞迴
    let lock = false;

    // Debug 開關
    const DEBUG = () => !!V.debug;
    
    // Debug 追蹤開關，不進存檔
    if (setup.CE_debugRawHook === undefined) {
        setup.CE_debugRawHook = null;
    }

    if (setup.CE_debugRawHookTargets === undefined) {
        setup.CE_debugRawHookTargets = null;
    }

    function isRawHookDebug(){
        return setup.CE_debugRawHook === null
            ? DEBUG()
            : !!setup.CE_debugRawHook;
    }

    /* =====================================================
    Debug 輸出工具
    ===================================================== */

    function log(...msg){
        if (DEBUG()) console.log("[Cheat Extended][RawHook]", ...msg);
    }

    function warn(...msg){
        if (DEBUG()) console.warn("[Cheat Extended][RawHook]", ...msg);
    }

    function error(...msg){
        console.error("[Cheat Extended][RawHook]", ...msg);
    }


    /* =====================================================
    工具
    -----------------------------------------------------
    解析變數路徑並回傳父物件與 key

    例：
        player.name
        -> obj = V.player
        -> key = name
    ===================================================== */

    function getParentAndKey(path){

        const parts = path.split(".");

        let obj = State.variables;

        for (let i = 0; i < parts.length - 1; i++){
            obj = obj?.[parts[i]];
            if (!obj) return null;
        }

        return {
            obj,
            key: parts[parts.length - 1]
        };
    }


    /* =====================================================
    註冊函數
    -----------------------------------------------------
    options 可用欄位：

        before(ctx)
            寫回前執行。

        transform(ctx)
            自訂最終值。
            若未提供，預設允許 newValue。

        after(oldValue, finalValue, ctx)
            寫回後執行。

    ctx 內容：

        path      變數路徑
        old       舊值
        newValue  外部寫入的新值
        config    registry[path]

    範例：

        RawHook.register("playerName", {
            transform(ctx){
                return ctx.old;
            }
        });

    ===================================================== */

    function register(varPath, options = {}){

        registry[varPath] = {
            before: options.before,
            transform: options.transform,
            after: options.after
        };

        log("register:", varPath, options);
    }


    /* =====================================================
    事件監聽註冊
    -----------------------------------------------------
    用途：
        監聽指定變數在 RawHook 修改後的變化

    用法：
        RawHook.on("變數路徑", callback)

    callback 參數：
        oldValue    修改前值
        finalValue  RawHook 套用後的最終值
        newValue    外部原本寫入的新值
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

    function installRawHook(path){

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
                        
                        /* =========================
                        DEBUG用，追蹤誰在改指定變數
                        ---------------------------------
                        使用範例
                        setup.CE_debugRawHook = true;

                        setup.CE_debugRawHookTargets = [
                            "wardrobe.space"
                        ];

                        若 CE_debugRawHookTargets 不存在
                        則追蹤所有 RawHook 變數
                        ==========================*/                        
                        
                        if (
                            isRawHookDebug() &&
                            (
                                setup.CE_debugRawHookTargets == null ||
                                (
                                    Array.isArray(setup.CE_debugRawHookTargets) &&
                                    setup.CE_debugRawHookTargets.includes(path)
                                )
                            )
                        ){
                            console.group("[Cheat Extended][RawHook WRITE]");
                            console.log("path:", path);
                            console.log("old:", old);
                            console.log("new:", newValue);
                            console.trace();
                            console.groupEnd();
                        }        

                        // 先保留外部寫入值。
                        // 若 RawHook 未啟用或跳過，變數仍會正常變成 newValue。
                        _value = newValue;

                        // RawHook 未啟用
                        if (!V?.CE_VarHook_enable || !V?.CE_RawHook_enable){
                            log("RawHook disable:", path);
                            return;
                        }

                        // macro 修改變數時跳過
                        if (setup.CE_macroLock){
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

                        const config = registry[path];

                        const ctx = {
                            path,
                            old,
                            newValue,
                            config
                        };

                        /* =============
                        套用前自訂邏輯
                        =============== */

                        if (typeof config.before === "function"){
                            try{
                                config.before(ctx);
                            }catch(e){
                                error("RawHook before error:", path, e);
                            }
                        }

                        /* =============
                        計算最終值

                        預設：
                            newValue

                        若註冊了 transform(ctx)，則使用 transform 的回傳值。
                        =============== */

                        let finalValue = newValue;

                        if (typeof config.transform === "function"){
                            try{
                                finalValue = config.transform(ctx);
                            }catch(e){
                                error("RawHook transform error:", path, e);
                                return;
                            }
                        }

                        log(
                            "change:",
                            path,
                            "old:", old,
                            "→",
                            "newValue:", newValue,
                            "→",
                            "final:", finalValue
                        );

                        lock = true;
                        _value = finalValue;
                        lock = false;

                        /* =============
                        套用後自訂邏輯
                        =============== */

                        if (typeof config.after === "function"){
                            try{
                                config.after(old, finalValue, ctx);
                            }catch(e){
                                error("RawHook after error:", path, e);
                            }
                        }

                        /* =============
                        觸發事件
                        =============== */

                        if (events[path]){

                            for (const cb of events[path]){
                                try{
                                    cb(old, finalValue, newValue);
                                }catch(e){
                                    error("RawHook event error:", path, e);
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
            error("installRawHook error:", path, e);
        }
    }


    /* =====================================================
    安裝所有註冊 hook
    ===================================================== */

    function installAll(){

        log("installAll start");

        try{
            for (const v in registry){
                installRawHook(v);
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

    window.RawHook = {
        register,
        installAll,
        on
    };

})();
/*
// 使用範例
$(document).one(":passagestart", () => {

    RawHook.register("CE_testName", {
        transform(ctx){
            return ctx.old;
        },

        after(oldVal, finalVal, ctx){
            console.log("CE_testName 被攔截:", oldVal, ctx.newValue, finalVal);
        }
    });

    RawHook.installAll();

});
*/

/*
=========================================================
Cheat Extended - VarHook 變數監聽框架
---------------------------------------------------------
功能：

- 監聽指定的 V.xxx 變數
- 攔截變數修改
- 計算變數差值
- 依註冊倍率轉換差值
- 支援自訂變數處理邏輯
- 支援變數變化事件監聽
- 將最終結果寫回變數

---------------------------------------------------------
支援倍率類型：

1. number
2. string (變數名稱，自動從 V 讀取)
3. function (動態計算)

---------------------------------------------------------
支援 Hook 階段：

before(ctx)
    差值計算完成後執行
    可用於紀錄、預處理

transform(ctx)
    自訂最終值計算
    若未提供則使用預設倍率邏輯

after(oldValue, finalValue, diff, adjustedDiff, ctx)
    寫回變數後執行
    可用於同步資料、刷新UI等

---------------------------------------------------------
支援事件監聽：

VarHook.on(path, callback)

當變數完成修改後觸發：

    callback(
        oldValue,
        finalValue,
        adjustedDiff
    )

---------------------------------------------------------
註冊範例：

// 基本倍率模式
VarHook.register(
    "stress",
    1,
    1
);

// 使用變數倍率
VarHook.register(
    "pain",
    "CE_painMultiplier",
    "CE_painNegativeMultiplier"
);

// 自訂處理邏輯
VarHook.register(
    "oxygen",
    1,
    1,
    {
        transform(ctx){

            if (V.CE_lockOxygenEnabled && ctx.diff < 0){
                return ctx.old;
            }

            return ctx.old + ctx.adjustedDiff;
        }
    }
);

// 監聽事件
VarHook.on("oxygen",(oldVal,newVal,diff)=>{
    console.log(oldVal,"→",newVal);
});

---------------------------------------------------------
運作流程：

V.stress += 5
    ↓
setter 攔截
    ↓
計算 diff
    ↓
倍率轉換
    ↓
before(ctx)
    ↓
transform(ctx)
    ↓
寫回最終值
    ↓
after(...)
    ↓
VarHook.on(...)
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

    // 事件監聽表
    const events = {};

    // 是否啟用 VarHook
    if (typeof V.CE_VarHook_enable !== "boolean") {
        V.CE_VarHook_enable = false;
    }

    // macro操作旗標
    // 當 macro 修改變數時跳過 hook
    setup.CE_macroLock = false;

    // 防止 setter 自己寫回變數造成無限遞迴
    let lock = false;

    // Debug 開關
    const DEBUG = () => !!V.debug;
    
    // Debug 追蹤開關，不進存檔
    if (setup.CE_debugVarHook === undefined) {
        setup.CE_debugVarHook = null;
    }

    if (setup.CE_debugVarHookTargets === undefined) {
        setup.CE_debugVarHookTargets = null;
    }

    function isVarHookDebug(){
        return setup.CE_debugVarHook === null
            ? DEBUG()
            : !!setup.CE_debugVarHook;
    }

    /* =====================================================
    Debug 輸出工具
    ===================================================== */

    function log(...msg){
        if (DEBUG()) console.log("[Cheat Extended][VarHook]", ...msg);
    }

    function warn(...msg){
        if (DEBUG()) console.warn("[Cheat Extended][VarHook]", ...msg);
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
    string   變數名稱，例如 "CE_painMultiplier"
    function 回傳倍率

    注意：
        string 不需要寫 V.
        例如：
            "CE_painMultiplier"
        會解析為：
            State.variables.CE_painMultiplier
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
                warn("Multiplier is object/array:", mult, "using default 1");
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

    第四參數 options 可選：

        before(ctx)
            套用 hook 前執行。
            通常用於記錄、預處理。

        transform(ctx)
            自訂最終值。
            若沒有設定，預設為：
                old + adjustedDiff

            若有設定，會使用 transform 回傳值作為最終值。

        after(oldValue, finalValue, diff, adjustedDiff, ctx)
            hook 套用後執行。
            通常用於額外同步其他變數、刷新 UI、輸出訊息。

    ctx 內容：

        path          變數路徑
        old           原始舊值
        newValue      外部寫入的新值
        oldNum        Number(old)
        newNum        Number(newValue)
        safeOld       Math.max(0, oldNum)
        safeNew       Math.max(0, newNum)
        diff          safeNew - safeOld
        adjustedDiff  經倍率轉換後的差值
        config        registry[path]

    舊用法仍可使用：
        VarHook.register("pain", "CE_painMultiplier", "CE_painNegativeMultiplier");

    新用法：
        VarHook.register("oxygen", 1, 1, {
            transform(ctx){
                if (V.CE_lockOxygenEnabled && ctx.diff < 0) {
                    return ctx.old;
                }

                return ctx.old + ctx.adjustedDiff;
            }
        });
    ===================================================== */

    function register(varPath, posMult, negMult, options = {}){

        registry[varPath] = {
            pos: posMult,
            neg: negMult,

            before: options.before,
            transform: options.transform,
            after: options.after
        };

        log("register:", varPath, posMult, negMult, options);
    }


    /* =====================================================
    事件監聽註冊
    -----------------------------------------------------
    用途：
        監聽指定變數在 VarHook 修改後的變化

    用法：
        VarHook.on("變數路徑", callback)

    callback 參數：
        oldValue       修改前數值
        finalValue     VarHook 套用後的最終值
        adjustedDiff   最終套用的變化量

    範例：
        VarHook.on("angelBanish",(oldVal,finalVal,adjustedDiff)=>{
            console.log(oldVal,"→",finalVal, adjustedDiff);
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
                        
                        /* =========================
                        DEBUG用，追蹤誰在改指定變數
                        ---------------------------------
                        使用範例
                        setup.CE_debugVarHook = true;

                        setup.CE_debugVarHookTargets = [
                            "wardrobe.space"
                        ];

                        若 CE_debugVarHookTargets 不存在
                        則追蹤所有 VarHook 變數
                        ==========================*/
                                                                        
                        if (
                            isVarHookDebug() &&
                            (
                                setup.CE_debugVarHookTargets == null ||
                                (
                                    Array.isArray(setup.CE_debugVarHookTargets) &&
                                    setup.CE_debugVarHookTargets.includes(path)
                                )
                            )
                        ){
                            console.group("[Cheat Extended][VarHook WRITE]");
                            console.log("path:", path);
                            console.log("old:", old);
                            console.log("new:", newValue);
                            console.trace();
                            console.groupEnd();
                        } 
                        
                        // 先保留外部寫入值。
                        // 若 VarHook 未啟用或跳過，變數仍會正常變成 newValue。
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

                        const config = registry[path];

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

                        const ctx = {
                            path,
                            old,
                            newValue,
                            oldNum,
                            newNum,
                            safeOld,
                            safeNew,
                            diff,
                            adjustedDiff,
                            config
                        };

                        /* =============
                        套用前自訂邏輯
                        =============== */

                        if (typeof config.before === "function"){
                            try{
                                config.before(ctx);
                            }catch(e){
                                error("VarHook before error:", path, e);
                            }
                        }

                        /* =============
                        計算最終值

                        預設：
                            old + adjustedDiff

                        若註冊了 transform(ctx)，則使用 transform 的回傳值。
                        =============== */

                        let newValueFinal;

                        if (typeof config.transform === "function"){
                            try{
                                newValueFinal = config.transform(ctx);
                            }catch(e){
                                error("VarHook transform error:", path, e);
                                return;
                            }
                        }
                        else{
                            newValueFinal = old + adjustedDiff;
                        }

                        if (!Number.isFinite(Number(newValueFinal))){
                            warn("invalid final value:", path, newValueFinal);
                            return;
                        }

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
                        套用後自訂邏輯
                        =============== */

                        if (typeof config.after === "function"){
                            try{
                                config.after(old, newValueFinal, diff, adjustedDiff, ctx);
                            }catch(e){
                                error("VarHook after error:", path, e);
                            }
                        }

                        /* =============
                        觸發事件
                        =============== */

                        if (events[path]){

                            for (const cb of events[path]){
                                try{
                                    cb(old, newValueFinal, adjustedDiff);
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

