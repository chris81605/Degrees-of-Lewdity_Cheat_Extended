/*==============================
CE Custom Hook 保存 / 重建工具
--------------------------------
1. 只保存設定，不保存 function
2. 保存 Hook 於 V.CE_customHooks
3. 臨時 Hook 於 setup.CE_runtimeCustomHooks
4. 支援監聽模式 monitor
5. 支援臨時自訂邏輯 custom
6. custom 模式預設不允許保存到存檔
==============================*/

(function(){

    if (typeof V.CE_allowCustomHookSave !== "boolean") {
        V.CE_allowCustomHookSave = false;
    }
    
    function ensureStore(){
        if (!Array.isArray(V.CE_customHooks)) {
            V.CE_customHooks = [];
        }

        return V.CE_customHooks;
    }

    function ensureRuntimeStore(){
        if (!Array.isArray(setup.CE_runtimeCustomHooks)) {
            setup.CE_runtimeCustomHooks = [];
        }

        return setup.CE_runtimeCustomHooks;
    }

    function makeId(){
        return Date.now() + "_" + Math.random().toString(36).slice(2);
    }

    function hookKey(hook){
        return [
            hook.type,
            hook.path,
            hook.targetPath || "",
            hook.mode
        ].join("|");
    }

    function runCustomCode(hook, ctx, fallbackValue){
        try {
            const code = String(hook.customCode || "");

            if (!code.trim()) {
                return fallbackValue;
            }

            const fn = new Function(
                "ctx",
                "V",
                "State",
                "setup",
                code
            );

            return fn(ctx, V, State, setup);
        }
        catch(e) {
            console.error("[cheat Extended][Custom Hook customCode error]", hook.path, e);
            return fallbackValue;
        }
    }

    setup.CE_makeCustomHookSnapshot = function(state){
        return {
            id: makeId(),
            runtimeId: makeId(),
            enabled: true,
            saved: !!state.saveToStore,

            type: state.type,
            path: String(state.path || "").trim(),
            targetPath: String(state.targetPath || "").trim(),

            mode: state.mode,
            value: state.value,
            customCode: String(state.customCode || ""),

            posMult: Number(state.posMult),
            negMult: Number(state.negMult),
            maxDepth: Number(state.maxDepth) || 2
        };
    };

    setup.CE_saveCustomHook = function(hook){
        if (
            hook?.mode === "custom" &&
            !(V.debug === 1 && V.CE_allowCustomHookSave)
        ) {
            alert("自訂邏輯模式不允許保存到存檔。");
            return;
        }

        const list = ensureStore();
        const key = hookKey(hook);
        const oldIndex = list.findIndex(item => hookKey(item) === key);

        const canSaveCustom =
            V.debug === 1 &&
            V.CE_allowCustomHookSave === true;

        const savedHook = {
            ...hook,
            customCode: hook.mode === "custom" && canSaveCustom
                ? String(hook.customCode || "")
                : "",
            saved: true
        };

        if (oldIndex >= 0) {
            savedHook.id = list[oldIndex].id;
            list[oldIndex] = savedHook;
        }
        else {
            list.push(savedHook);
        }
    };

    setup.CE_removeCustomHook = function(id){
        const list = ensureStore();
        const index = list.findIndex(item => item.id === id);

        if (index >= 0) {
            list.splice(index, 1);
        }
    };

    setup.CE_addRuntimeCustomHook = function(hook){
        const list = ensureRuntimeStore();
        const key = hookKey(hook);
        const oldIndex = list.findIndex(item => hookKey(item) === key);

        const runtimeHook = {
            ...hook,
            runtimeId: makeId(),
            saved: false
        };

        if (oldIndex >= 0) {
            runtimeHook.runtimeId = list[oldIndex].runtimeId;
            list[oldIndex] = runtimeHook;
        }
        else {
            list.push(runtimeHook);
        }
    };

    setup.CE_removeRuntimeCustomHook = function(runtimeId){
        const list = ensureRuntimeStore();
        const index = list.findIndex(item => item.runtimeId === runtimeId);

        if (index >= 0) {
            list.splice(index, 1);
        }
    };

    setup.CE_promoteRuntimeCustomHook = function(runtimeId){
        const list = ensureRuntimeStore();
        const hook = list.find(item => item.runtimeId === runtimeId);

        if (!hook) {
            alert("找不到臨時 Hook");
            return;
        }

        if (
            hook.mode === "custom" &&
            !(V.debug === 1 && V.CE_allowCustomHookSave)
        ) {
            alert("自訂邏輯模式不允許保存到存檔。");
            return;
        }

        setup.CE_saveCustomHook({
            ...hook,
            saved: true,            
        });

        setup.CE_removeRuntimeCustomHook(runtimeId);

        alert("已保存 Hook 到存檔：\n" + hook.path);
    };

    setup.CE_unregisterCustomHookConfig = function(hook){
        if (!hook) return;

        if (hook.type === "VarHook") VarHook.unregister?.(hook.path);
        if (hook.type === "RawHook") RawHook.unregister?.(hook.path);
        if (hook.type === "DeepProxyHook") DeepProxyHook.unregister?.(hook.path);
    };

    setup.CE_registerCustomHookConfig = function(hook){
        if (!hook || hook.enabled === false) return;

        const path = hook.path;

        if (hook.type === "VarHook") {

            if (hook.mode === "monitor") {
                VarHook.register(path, 1, 1, {
                    after(oldValue, finalValue, diff, adjustedDiff, ctx){
                        console.log(
                            hook.saved ? "[cheat Extended][Saved VarHook Monitor]" : "[cheat Extended][Runtime VarHook Monitor]",
                            ctx.path,
                            oldValue,
                            "→",
                            finalValue,
                            "diff:",
                            diff,
                            "adjustedDiff:",
                            adjustedDiff
                        );
                    }
                });
            }

            if (hook.mode === "custom") {
                VarHook.register(path, 1, 1, {
                    transform(ctx){
                        return runCustomCode(hook, ctx, ctx.newValue);
                    },
                    after(oldValue, finalValue, diff, adjustedDiff, ctx){
                        console.log(
                            "[cheat Extended][Runtime VarHook Custom]",
                            ctx.path,
                            oldValue,
                            "→",
                            finalValue,
                            "diff:",
                            diff
                        );
                    }
                });
            }

            if (hook.mode === "multiplier") {
                VarHook.register(
                    path,
                    Number(hook.posMult),
                    Number(hook.negMult)
                );
            }

            if (hook.mode === "lock") {
                VarHook.register(path, 1, 1, {
                    transform(ctx){
                        return ctx.old;
                    }
                });
            }

            if (hook.mode === "blockIncrease") {
                VarHook.register(path, 1, 1, {
                    transform(ctx){
                        if (ctx.diff > 0) return ctx.old;
                        return ctx.old + ctx.adjustedDiff;
                    }
                });
            }

            if (hook.mode === "blockDecrease") {
                VarHook.register(path, 1, 1, {
                    transform(ctx){
                        if (ctx.diff < 0) return ctx.old;
                        return ctx.old + ctx.adjustedDiff;
                    }
                });
            }
        }

        if (hook.type === "RawHook") {

            if (hook.mode === "monitor") {
                RawHook.register(path, {
                    after(oldValue, finalValue, ctx){
                        console.log(
                            hook.saved ? "[cheat Extended][Saved RawHook Monitor]" : "[cheat Extended][Runtime RawHook Monitor]",
                            ctx.path,
                            oldValue,
                            "→",
                            finalValue
                        );
                    }
                });
            }

            if (hook.mode === "custom") {
                RawHook.register(path, {
                    transform(ctx){
                        return runCustomCode(hook, ctx, ctx.newValue);
                    },
                    after(oldValue, finalValue, ctx){
                        console.log(
                            "[cheat Extended][Runtime RawHook Custom]",
                            ctx.path,
                            oldValue,
                            "→",
                            finalValue
                        );
                    }
                });
            }

            if (hook.mode === "lock") {
                RawHook.register(path, {
                    transform(ctx){
                        return ctx.old;
                    }
                });
            }

            if (hook.mode === "forceValue") {
                RawHook.register(path, {
                    transform(){
                        return hook.value;
                    }
                });
            }
        }

        if (hook.type === "DeepProxyHook") {

            DeepProxyHook.register(path, {
                maxDepth: Number(hook.maxDepth) || 2,
                ignoreKeys: ["length"],

                transform(ctx){
                    const targetPath = String(hook.targetPath || "").trim();

                    if (targetPath && ctx.fullPath !== targetPath) {
                        return ctx.newValue;
                    }

                    if (hook.mode === "monitor") return ctx.newValue;
                    if (hook.mode === "custom") return runCustomCode(hook, ctx, ctx.newValue);
                    if (hook.mode === "lock") return ctx.oldValue;
                    if (hook.mode === "forceValue") return hook.value;

                    if (hook.mode === "allowIncreaseOnly") {
                        const oldNum = Number(ctx.oldValue);
                        const newNum = Number(ctx.newValue);

                        if (!Number.isNaN(oldNum) && !Number.isNaN(newNum)) {
                            if (newNum < oldNum) return ctx.oldValue;
                        }

                        return ctx.newValue;
                    }

                    if (hook.mode === "allowDecreaseOnly") {
                        const oldNum = Number(ctx.oldValue);
                        const newNum = Number(ctx.newValue);

                        if (!Number.isNaN(oldNum) && !Number.isNaN(newNum)) {
                            if (newNum > oldNum) return ctx.oldValue;
                        }

                        return ctx.newValue;
                    }

                    return ctx.newValue;
                },

                delete(ctx){
                    const targetPath = String(hook.targetPath || "").trim();

                    if (targetPath && ctx.fullPath !== targetPath) {
                        return true;
                    }

                    if (hook.mode === "blockDelete") {
                        return false;
                    }

                    return true;
                },

                after(oldVal, finalVal, ctx){
                    const targetPath = String(hook.targetPath || "").trim();

                    if (targetPath && ctx.fullPath !== targetPath) {
                        return;
                    }

                    console.log(
                        hook.saved ? "[cheat Extended][ aved DeepProxyHook]" : "[cheat Extended][Runtime DeepProxyHook]",
                        ctx.fullPath,
                        oldVal,
                        "→",
                        finalVal,
                        "mode:",
                        hook.mode
                    );
                }
            });
        }
    };

    setup.CE_installAllCustomHooks = function(){
        VarHook?.installAll?.();
        RawHook?.installAll?.();
        DeepProxyHook?.installAll?.();
    };

    setup.CE_rebuildSavedCustomHooks = function(){
        const list = ensureStore();

        for (const hook of list) {
            if (
                hook.mode === "custom" &&
                !(V.debug === 1 && V.CE_allowCustomHookSave)
            ) {
                continue;
            }
            setup.CE_registerCustomHookConfig(hook);
        }

        setup.CE_installAllCustomHooks();
    };

    $(document).on(":passagestart", () => {
        setup.CE_rebuildSavedCustomHooks?.();
    });

})();


/*==============================
CE Custom Hook UI
--------------------------------
1. 可臨時註冊 Hook
2. 可選擇保存到存檔
3. 已保存 Hook 顯示於 V.CE_customHooks
4. 臨時 Hook 顯示於 setup.CE_runtimeCustomHooks
5. 變數路徑不要輸入 V.
==============================*/

Macro.add("CE_CustomHookPanel", {
    handler() {
        const container = document.createElement("div");
        container.className = "dol-settings dol-shadow";
        this.output.appendChild(container);

        const state = setup.CE_customHookPanel ??= {
            path: "",
            targetPath: "",
            type: "VarHook",
            mode: "monitor",
            value: "",
            customCode: "return ctx.newValue;",
            posMult: 1,
            negMult: 1,
            maxDepth: 2,
            saveToStore: false
        };

        const COLORS = {
            info: "#66aaff",
            success: "#6cc04a",
            warn: "#e0b84f",
            danger: "#ff6666",
            muted: "gray",
            varhook: "#6cc04a",
            rawhook: "#e0b84f",
            deep: "#ff6666"
        };

        const refresh = () => render();

        const getPathValue = (path) => {
            const parts = String(path || "").split(".");
            let obj = State.variables;

            for (const part of parts) {
                if (obj == null || !(part in obj)) return undefined;
                obj = obj[part];
            }

            return obj;
        };

        const pathExists = (path) => {
            const parts = String(path || "").split(".");
            let obj = State.variables;

            for (const part of parts) {
                if (obj == null || !(part in obj)) return false;
                obj = obj[part];
            }

            return true;
        };

        const getHookColor = (type) => {
            if (type === "VarHook") return COLORS.varhook;
            if (type === "RawHook") return COLORS.rawhook;
            if (type === "DeepProxyHook") return COLORS.deep;
            return COLORS.muted;
        };

        const getHookIcon = (type) => {
            if (type === "VarHook") return "🟢";
            if (type === "RawHook") return "🟡";
            if (type === "DeepProxyHook") return "🔴";
            return "⚪";
        };

        const getHookRiskText = (type) => {
            if (type === "VarHook") return "較安全";
            if (type === "RawHook") return "中風險";
            if (type === "DeepProxyHook") return "高風險";
            return "";
        };

        const makeSection = () => {
            const block = document.createElement("div");
            block.className = "dol-section-block";

            Object.assign(block.style, {
                border: "1px solid #ccc",
                padding: "6px",
                marginBottom: "8px",
                overflowWrap: "break-word"
            });

            return block;
        };

        const makeInput = (label, key, type = "text") => {
            const row = document.createElement("div");
            row.style.marginBottom = "6px";

            const span = document.createElement("span");
            Object.assign(span.style, {
                display: "inline-block",
                width: "150px"
            });
            span.textContent = label + "：";
            row.appendChild(span);

            const input = document.createElement("input");
            input.type = type;
            input.value = state[key] ?? "";
            input.style.width = type === "number" ? "80px" : "220px";

            input.addEventListener("input", () => {
                state[key] = input.type === "number"
                    ? Number(input.value)
                    : input.value;
            });

            row.appendChild(input);
            return row;
        };

        const makeTextarea = (label, key) => {
            const row = document.createElement("div");
            row.style.marginBottom = "6px";

            const title = document.createElement("div");
            title.textContent = label + "：";
            title.style.marginBottom = "4px";
            row.appendChild(title);

            const textarea = document.createElement("textarea");
            textarea.value = state[key] ?? "";
            textarea.rows = 7;

            Object.assign(textarea.style, {
                width: "100%",
                boxSizing: "border-box",
                fontFamily: "monospace",
                fontSize: "0.85em"
            });

            textarea.addEventListener("input", () => {
                state[key] = textarea.value;
            });

            row.appendChild(textarea);
            return row;
        };

        const makeSelect = (label, key, options) => {
            const row = document.createElement("div");
            row.style.marginBottom = "6px";

            const span = document.createElement("span");
            Object.assign(span.style, {
                display: "inline-block",
                width: "150px"
            });
            span.textContent = label + "：";
            row.appendChild(span);

            const select = document.createElement("select");

            for (const opt of options) {
                const o = document.createElement("option");
                o.value = opt.value;
                o.textContent = opt.label;
                o.selected = state[key] === opt.value;
                select.appendChild(o);
            }

            select.addEventListener("change", () => {
                state[key] = select.value;

                if (key === "type") {
                    state.mode = "monitor";
                }

                if (key === "mode" && state.mode === "custom" && !state.customCode) {
                    state.customCode = "return ctx.newValue;";
                }

                refresh();
            });

            row.appendChild(select);
            return row;
        };

        const addHint = (parent, text, type = "muted") => {
            const hint = document.createElement("div");

            Object.assign(hint.style, {
                fontSize: "0.85em",
                color: COLORS[type] || COLORS.muted,
                marginTop: "6px",
                marginBottom: "4px"
            });

            const prefix = {
                info: "ℹ ",
                success: "✓ ",
                warn: "⚠ ",
                danger: "⚠ "
            }[type] || "";

            hint.textContent = prefix + text;
            parent.appendChild(hint);
        };

        const makeButton = (text, onclick, type = "normal") => {
            const btn = document.createElement("span");
            btn.className = "dol-btn";
            btn.textContent = text;
            btn.onclick = onclick;

            Object.assign(btn.style, {
                marginRight: "6px",
                cursor: "pointer",
                padding: "1px 5px",
                fontSize: "0.85em",
                minWidth: "0",
                width: "auto",
                lineHeight: "1.3",
                display: "inline-block"
            });

            if (type === "danger") btn.style.color = COLORS.danger;
            else if (type === "success") btn.style.color = COLORS.success;
            else if (type === "warn") btn.style.color = COLORS.warn;
            else if (type === "info") btn.style.color = COLORS.info;

            return btn;
        };

        const makeSwitch = (label, key, color) => {
            const row = document.createElement("label");
            Object.assign(row.style, {
                display: "block",
                marginBottom: "4px"
            });

            const input = document.createElement("input");
            input.type = "checkbox";
            input.checked = !!V[key];

            input.onchange = function(){
                V[key] = this.checked;
                refresh();
            };

            const text = document.createElement("span");
            text.textContent = " " + label + " ";
            text.style.color = color || COLORS.muted;

            const status = document.createElement("span");
            status.textContent = V[key] ? "✓ 啟用" : "⚠ 停用";

            Object.assign(status.style, {
                color: V[key] ? COLORS.success : COLORS.warn,
                fontWeight: "bold",
                fontSize: "0.85em"
            });

            row.appendChild(input);
            row.appendChild(text);
            row.appendChild(status);

            return row;
        };

        const makeSaveSwitch = () => {
            const row = document.createElement("label");

            Object.assign(row.style, {
                display: "block",
                marginTop: "6px"
            });

            const canSaveCustom =
                V.debug === 1 &&
                V.CE_allowCustomHookSave === true;

            const input = document.createElement("input");
            input.type = "checkbox";
            input.checked = !!state.saveToStore;

            input.disabled =
                state.mode === "custom" &&
                !canSaveCustom;

            input.onchange = function(){
                state.saveToStore = this.checked;
                refresh();
            };

            const text = document.createElement("span");

            if (state.mode === "custom" && !canSaveCustom) {
                text.textContent = " 自訂邏輯不可保存到存檔";
            }
            else if (state.mode === "custom") {
                text.textContent = " ⚠ Debug模式：允許保存自訂邏輯";
            }
            else {
                text.textContent = " 保存此 Hook 到存檔";
            }

            text.style.color = state.mode === "custom"
                ? COLORS.danger
                : (state.saveToStore ? COLORS.warn : "");

            row.appendChild(input);
            row.appendChild(text);

            return row;
        };

        const makeScrollableListWrap = () => {
            const wrap = document.createElement("div");

            Object.assign(wrap.style, {
                maxHeight: "260px",
                overflowY: "auto",
                paddingRight: "4px",
                borderTop: "1px solid #ccc",
                marginTop: "6px",
                paddingTop: "6px"
            });

            return wrap;
        };

        if (typeof setup.CE_runtimeHookListExpanded !== "boolean") {
            setup.CE_runtimeHookListExpanded = true;
        }

        if (typeof setup.CE_savedHookListExpanded !== "boolean") {
            setup.CE_savedHookListExpanded = true;
        }

        const makeCollapsibleTitle = (text, expandedKey, count) => {
            const title = document.createElement("div");

            Object.assign(title.style, {
                fontWeight: "bold",
                marginBottom: "6px",
                cursor: "pointer",
                userSelect: "none"
            });

            title.textContent = `${setup[expandedKey] ? "▾" : "▸"} ${text}（${count}）`;

            title.onclick = () => {
                setup[expandedKey] = !setup[expandedKey];
                refresh();
            };

            return title;
        };

        const validatePathForRegister = (path) => {
            if (!path) {
                alert("請輸入變數路徑");
                return false;
            }

            if (path.startsWith("V.") || path.startsWith("State.variables.")) {
                alert("變數路徑不要輸入 V. 或 State.variables.\n\n例如請輸入：stress\n不要輸入：V.stress");
                return false;
            }

            if (!pathExists(path)) {
                alert("Hook 註冊失敗：找不到變數路徑\n\n" + path);
                return false;
            }

            if (state.type === "DeepProxyHook") {
                const target = getPathValue(path);

                if (target == null || typeof target !== "object") {
                    alert(
                        "DeepProxyHook 註冊失敗：目標不是 object / array\n\n" +
                        path +
                        "\n\n目前值：" + String(target)
                    );
                    return false;
                }
            }

            return true;
        };

        const registerCurrentHook = () => {
            const path = String(state.path || "").trim();

            if (!validatePathForRegister(path)) return;

            const canSaveCustom =
                V.debug === 1 &&
                V.CE_allowCustomHookSave === true;

            if (state.mode === "custom" && !canSaveCustom) {
                state.saveToStore = false;
            }

            const snapshot = setup.CE_makeCustomHookSnapshot(state);

            try {
                if (snapshot.type === "VarHook") {
                    V.CE_VarHook_enable = true;
                }

                if (snapshot.type === "RawHook") {
                    V.CE_RawHook_enable = true;
                }

                if (snapshot.type === "DeepProxyHook") {
                    V.CE_DeepProxyHook_enable = true;
                }

                setup.CE_registerCustomHookConfig(snapshot);
                setup.CE_installAllCustomHooks();

                if (state.saveToStore) {
                    setup.CE_saveCustomHook(snapshot);
                }
                else {
                    setup.CE_addRuntimeCustomHook(snapshot);
                }

                alert(
                    "Hook 已註冊：" + path +
                    (state.saveToStore ? "\n已保存到存檔。" : "\n此 Hook 為臨時 Hook。")
                );

                refresh();
            }
            catch (e) {
                console.error("[cheat Extended][CustomHookPanel]", e);
                alert("Hook 註冊失敗，詳情請看控制台");
            }
        };

        const unregisterCurrentHook = () => {
            const path = String(state.path || "").trim();

            if (!path) {
                alert("請輸入要卸載的變數路徑");
                return;
            }

            try {
                setup.CE_unregisterCustomHookConfig({
                    type: state.type,
                    path
                });

                alert("Hook 已卸載：" + path + "\n切換 Passage 後會完全生效。");
                refresh();
            }
            catch (e) {
                console.error("[cheat Extended][CustomHookPanel]", e);
                alert("Hook 卸載失敗，詳情請看控制台");
            }
        };

        const renderHookRow = (parent, hook, source) => {
            const row = document.createElement("div");
            row.className = "dol-section-block";

            Object.assign(row.style, {
                border: "1px solid #ccc",
                padding: "5px",
                marginBottom: "6px",
                overflowWrap: "break-word"
            });

            const topRow = document.createElement("div");

            Object.assign(topRow.style, {
                display: "flex",
                alignItems: "center",
                gap: "4px",
                flexWrap: "wrap"
            });

            const enabled = document.createElement("input");
            enabled.type = "checkbox";
            enabled.checked = hook.enabled !== false;

            enabled.onchange = function(){
                hook.enabled = this.checked;

                if (!hook.enabled) {
                    setup.CE_unregisterCustomHookConfig(hook);
                }
                else {
                    setup.CE_registerCustomHookConfig(hook);
                    setup.CE_installAllCustomHooks();
                }

                refresh();
            };

            topRow.appendChild(enabled);

            const tag = document.createElement("span");
            tag.textContent = `${getHookIcon(hook.type)} ${hook.type}`;

            Object.assign(tag.style, {
                color: getHookColor(hook.type),
                fontWeight: "bold",
                fontSize: "0.9em"
            });

            topRow.appendChild(tag);

            const sourceTag = document.createElement("span");
            sourceTag.textContent = source === "saved" ? "已保存" : "臨時";

            Object.assign(sourceTag.style, {
                color: source === "saved" ? COLORS.success : COLORS.info,
                fontWeight: "bold",
                fontSize: "0.85em"
            });

            topRow.appendChild(sourceTag);

            const status = document.createElement("span");
            status.textContent = hook.enabled !== false ? "✓ 啟用" : "⚠ 停用";

            Object.assign(status.style, {
                color: hook.enabled !== false ? COLORS.success : COLORS.warn,
                fontWeight: "bold",
                fontSize: "0.85em"
            });

            topRow.appendChild(status);

            const canSaveCustom =
                V.debug === 1 &&
                V.CE_allowCustomHookSave === true;

            if (
                source === "runtime" &&
                (hook.mode !== "custom" || canSaveCustom)
            ) {
                topRow.appendChild(makeButton("保存", function(){
                    setup.CE_promoteRuntimeCustomHook(hook.runtimeId);
                    refresh();
                }, "success"));
            }

            const delBtn = makeButton("刪除", function(){
                setup.CE_unregisterCustomHookConfig(hook);

                if (source === "saved") {
                    setup.CE_removeCustomHook(hook.id);
                }
                else {
                    setup.CE_removeRuntimeCustomHook(hook.runtimeId);
                }

                refresh();
            }, "danger");

            topRow.appendChild(delBtn);
            row.appendChild(topRow);

            const info = document.createElement("div");

            Object.assign(info.style, {
                fontSize: "0.9em",
                marginTop: "4px"
            });

            info.textContent =
                `${hook.path}` +
                (hook.targetPath ? ` → ${hook.targetPath}` : "") +
                ` / ${hook.mode}`;

            row.appendChild(info);
            
            if (hook.mode === "custom") {
                const codeToggle = document.createElement("div");

                Object.assign(codeToggle.style, {
                    fontSize: "0.85em",
                    color: COLORS.info,
                    marginTop: "5px",
                    cursor: "pointer",
                    userSelect: "none"
                });

                const codeBox = document.createElement("pre");

                Object.assign(codeBox.style, {
                    display: "none",
                    fontSize: "0.8em",
                    marginTop: "5px",
                    padding: "5px",
                    border: "1px solid #555",
                    maxHeight: "140px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word"
                });

                codeBox.textContent = hook.customCode || "(空自訂邏輯)";

                let expanded = false;

                codeToggle.textContent = "▸ 查看自訂邏輯";

                codeToggle.onclick = function(){
                    expanded = !expanded;

                    codeToggle.textContent = expanded
                        ? "▾ 收合自訂邏輯"
                        : "▸ 查看自訂邏輯";

                    codeBox.style.display = expanded
                        ? "block"
                        : "none";
                };

                row.appendChild(codeToggle);
                row.appendChild(codeBox);
            }

            const risk = document.createElement("div");

            Object.assign(risk.style, {
                fontSize: "0.85em",
                color: hook.mode === "custom" ? COLORS.danger : getHookColor(hook.type),
                marginTop: "3px"
            });

            risk.textContent = hook.mode === "custom"
                ? "風險：自訂邏輯，高風險。"
                : `風險：${getHookRiskText(hook.type)}`;

            row.appendChild(risk);

            parent.appendChild(row);
        };

        const renderRuntimeHooks = (body) => {
            const block = makeSection();

            const list = Array.isArray(setup.CE_runtimeCustomHooks)
                ? setup.CE_runtimeCustomHooks
                : [];

            block.appendChild(
                makeCollapsibleTitle(
                    "本次臨時 Hook",
                    "CE_runtimeHookListExpanded",
                    list.length
                )
            );

            if (setup.CE_runtimeHookListExpanded) {
                if (!list.length) {
                    addHint(block, "目前沒有臨時 Hook。", "muted");
                }
                else {
                    const listWrap = makeScrollableListWrap();

                    list.forEach(hook => {
                        renderHookRow(listWrap, hook, "runtime");
                    });

                    block.appendChild(listWrap);
                }

                addHint(block, "臨時 Hook 不會自動保存；確認可用後可按「保存」加入存檔。自訂邏輯 Hook 不可保存。", "info");
            }

            body.appendChild(block);
        };

        const renderSavedHooks = (body) => {
            const block = makeSection();

            const list = Array.isArray(V.CE_customHooks)
                ? V.CE_customHooks
                : [];

            block.appendChild(
                makeCollapsibleTitle(
                    "已保存的自訂 Hook",
                    "CE_savedHookListExpanded",
                    list.length
                )
            );

            if (setup.CE_savedHookListExpanded) {
                if (!list.length) {
                    addHint(block, "目前沒有保存任何自訂 Hook。", "muted");
                }
                else {
                    const listWrap = makeScrollableListWrap();

                    list.forEach(hook => {
                        renderHookRow(listWrap, hook, "saved");
                    });

                    block.appendChild(listWrap);
                }

                addHint(block, "已保存 Hook 會寫入存檔，Passage 切換後自動重新掛載。", "warn");
            }

            body.appendChild(block);
        };

        function render() {
            container.innerHTML = "";

            const header = document.createElement("div");
            header.className = "dol-header";
            header.innerHTML = `<span class="dol-title">自訂 Hook</span>`;
            container.appendChild(header);

            const body = document.createElement("div");
            body.className = "dol-body";
            container.appendChild(body);

            const desc = document.createElement("div");
            desc.className = "dol-desc";
            desc.textContent = "測試用 Hook 管理面板。可臨時註冊或保存 VarHook、RawHook、DeepProxyHook。";
            body.appendChild(desc);
            body.appendChild(document.createElement("br"));

            const statusBlock = makeSection();

            const statusTitle = document.createElement("div");
            statusTitle.style.fontWeight = "bold";
            statusTitle.style.marginBottom = "6px";
            statusTitle.textContent = "目前開關狀態";
            statusBlock.appendChild(statusTitle);

            statusBlock.appendChild(makeSwitch("VarHook 總開關", "CE_VarHook_enable", COLORS.varhook));
            statusBlock.appendChild(makeSwitch("RawHook 分開關", "CE_RawHook_enable", COLORS.rawhook));
            statusBlock.appendChild(makeSwitch("DeepProxyHook 分開關", "CE_DeepProxyHook_enable", COLORS.deep));                        

            addHint(statusBlock, "RawHook / DeepProxyHook 屬於高風險功能，需透過 VarHook 總開關管理。", "warn");

            if (V.debug === 1) {

                statusBlock.appendChild(
                    makeSwitch(
                        "允許保存自訂邏輯",
                        "CE_allowCustomHookSave",
                        COLORS.danger
                    )
                );

                addHint(
                    statusBlock,
                    "高風險：允許將 Custom Hook(JavaScript) 保存至存檔",
                    "danger"
                );

            }

            body.appendChild(statusBlock);

            const inputBlock = makeSection();

            const inputTitle = document.createElement("div");
            inputTitle.style.fontWeight = "bold";
            inputTitle.style.marginBottom = "6px";
            inputTitle.textContent = "Hook 設定";
            inputBlock.appendChild(inputTitle);

            const currentRisk = document.createElement("div");

            Object.assign(currentRisk.style, {
                fontSize: "0.9em",
                color: state.mode === "custom" ? COLORS.danger : getHookColor(state.type),
                fontWeight: "bold",
                marginBottom: "6px"
            });

            currentRisk.textContent = state.mode === "custom"
                ? `${getHookIcon(state.type)} 目前類型：${state.type}（自訂邏輯，高風險）`
                : `${getHookIcon(state.type)} 目前類型：${state.type}（${getHookRiskText(state.type)}）`;

            inputBlock.appendChild(currentRisk);

            inputBlock.appendChild(makeInput("變數路徑", "path"));
            addHint(inputBlock, "不要輸入 V.。範例：stress、wardrobe.space、NPCList.0.health、feats.currentSave", "info");

            inputBlock.appendChild(makeSelect("Hook 類型", "type", [
                { value: "VarHook", label: "🟢 VarHook：數值變數（較安全）" },
                { value: "RawHook", label: "🟡 RawHook：整體賦值（中風險）" },
                { value: "DeepProxyHook", label: "🔴 DeepProxyHook：物件內部變化（高風險）" }
            ]));

            if (state.type === "VarHook") {
                inputBlock.appendChild(makeSelect("模式", "mode", [
                    { value: "monitor", label: "監聽變化" },                    
                    { value: "multiplier", label: "倍率模式" },
                    { value: "lock", label: "鎖定目前值" },
                    { value: "blockIncrease", label: "阻止增加" },
                    { value: "blockDecrease", label: "阻止減少" },
                    { value: "custom", label: "自訂邏輯（高風險）" }
                ]));

                if (state.mode === "multiplier") {
                    inputBlock.appendChild(makeInput("正向倍率", "posMult", "number"));
                    inputBlock.appendChild(makeInput("負向倍率", "negMult", "number"));
                }
            }

            if (state.type === "RawHook") {
                inputBlock.appendChild(makeSelect("模式", "mode", [
                    { value: "monitor", label: "監聽變化" },                    
                    { value: "lock", label: "鎖定目前值" },
                    { value: "forceValue", label: "強制指定值" },
                    { value: "custom", label: "自訂邏輯（高風險）" }
                ]));

                if (state.mode === "forceValue") {
                    inputBlock.appendChild(makeInput("指定值", "value"));
                }

                addHint(inputBlock, "RawHook 會攔截整個變數重新賦值，錯誤設定可能導致物件結構異常。", "warn");
            }

            if (state.type === "DeepProxyHook") {
                inputBlock.appendChild(makeSelect("模式", "mode", [
                    { value: "monitor", label: "監聽變化" },                    
                    { value: "lock", label: "鎖定值" },
                    { value: "forceValue", label: "強制指定值" },
                    { value: "allowIncreaseOnly", label: "僅允許增加" },
                    { value: "allowDecreaseOnly", label: "僅允許減少" },
                    { value: "blockDelete", label: "阻止刪除" },
                    { value: "custom", label: "自訂邏輯（高風險）" }
                ]));

                inputBlock.appendChild(makeInput("目標 fullPath", "targetPath"));
                addHint(inputBlock, "建議填寫。例：CE_proxyTest.deep.b。若留空，模式會套用到所有被攔截路徑。", "warn");

                if (state.mode === "forceValue") {
                    inputBlock.appendChild(makeInput("指定值", "value"));
                }

                inputBlock.appendChild(makeInput("最大深度", "maxDepth", "number"));
                addHint(inputBlock, "DeepProxyHook 高風險；maxDepth 建議 1～2，避免大型資料結構造成效能問題。", "danger");
            }

            if (state.mode === "custom") {
                inputBlock.appendChild(makeTextarea("自訂 JS 邏輯", "customCode"));

                addHint(inputBlock, "自訂邏輯可使用 ctx、V、State、setup，必須 return 最終值。", "danger");

                if (state.type === "VarHook") {
                    addHint(inputBlock, "VarHook ctx：path=變數路徑、old=舊值、newValue=外部寫入值、oldNum/newNum=數字化後的值、safeOld/safeNew=不小於0的數值、diff=原始差值、adjustedDiff=倍率後差值。", "info");
                    addHint(inputBlock, "常用：return ctx.newValue; 通過原寫入 / return ctx.old; 鎖定 / return ctx.old + ctx.adjustedDiff; 套用倍率後差值。", "muted");
                }

                if (state.type === "RawHook") {
                    addHint(inputBlock, "RawHook ctx：path=變數路徑、old=舊值、newValue=外部寫入值。", "info");
                    addHint(inputBlock, "常用：return ctx.newValue; 通過原寫入 / return ctx.old; 鎖定 / return '指定值'; 強制指定。", "muted");
                }

                if (state.type === "DeepProxyHook") {
                    addHint(inputBlock, "DeepProxyHook ctx：rootPath=註冊根路徑、path=目前Proxy所在路徑、fullPath=實際變更完整路徑、prop/propName=被修改屬性、depth=目前深度、target=被修改物件、oldValue=舊值、newValue=外部寫入值。", "info");
                    addHint(inputBlock, "常用：return ctx.newValue; 通過原寫入 / return ctx.oldValue; 鎖定 / if (ctx.fullPath !== 'NPCList.0.health') return ctx.newValue; 只處理指定路徑。", "muted");
                }
            }
            
            if (
                V.debug === 1 &&
                V.CE_allowCustomHookSave
            ) {
                addHint(
                    inputBlock,
                    "保存自訂邏輯會將 JavaScript 程式碼寫入存檔。",
                    "danger"
                );

                addHint(
                    inputBlock,
                    "讀檔時會自動重新建立並執行該 Hook。",
                    "danger"
                );

                addHint(
                    inputBlock,
                    "僅建議模組開發與除錯用途。",
                    "danger"
                );
            }

            inputBlock.appendChild(makeSaveSwitch());
            addHint(inputBlock, "保存後會寫入 V.CE_customHooks；未保存則只會出現在本次臨時 Hook 清單。", state.saveToStore ? "warn" : "muted");

            body.appendChild(inputBlock);

            const opBlock = makeSection();

            const opTitle = document.createElement("div");
            opTitle.style.fontWeight = "bold";
            opTitle.style.marginBottom = "6px";
            opTitle.textContent = "操作";
            opBlock.appendChild(opTitle);

            opBlock.appendChild(makeButton("註冊 Hook", registerCurrentHook, "success"));
            opBlock.appendChild(makeButton("卸載目前輸入路徑", unregisterCurrentHook, "warn"));

            addHint(opBlock, "卸載為軟卸載；目前 Passage 可能仍保留舊 setter / Proxy，切換 Passage 後等同完全卸載。", "warn");

            body.appendChild(opBlock);

            renderRuntimeHooks(body);
            renderSavedHooks(body);
        }

        render();
    }
});

/*==============================
CE Variable Explorer
--------------------------------
1. 路徑搜尋
2. 數值 / 字串 / 布林反搜尋
3. 快照差異追蹤
4. 追蹤範圍縮小
5. 可套用到 Hook 面板

注意：
- 路徑搜尋 / 值反搜尋 受「結果上限」限制
- 快照差異 不受「結果上限」限制
- 快照差異 只受「最大深度」限制
- 若存在追蹤範圍，快照只比較追蹤範圍內的 path
==============================*/

Macro.add("CE_VariableExplorer", {
    handler() {
        const container = document.createElement("div");
        container.className = "dol-settings dol-shadow";
        this.output.appendChild(container);

        const state = setup.CE_variableExplorer ??= {
            tab: "path",
            keyword: "",
            valueQuery: "",
            maxDepth: 5,
            maxResults: 100,
            results: [],
            diffResults: []
        };

        const COLORS = {
            info: "#66aaff",
            success: "#6cc04a",
            warn: "#e0b84f",
            danger: "#ff6666",
            muted: "gray"
        };

        const refresh = () => render();

        const addHint = (parent, text, type = "muted") => {
            const hint = document.createElement("div");

            Object.assign(hint.style, {
                fontSize: "0.85em",
                color: COLORS[type] || COLORS.muted,
                marginTop: "6px",
                marginBottom: "4px"
            });

            const prefix = {
                info: "ℹ ",
                success: "✓ ",
                warn: "⚠ ",
                danger: "⚠ "
            }[type] || "";

            hint.textContent = prefix + text;
            parent.appendChild(hint);
        };

        const makeSection = () => {
            const block = document.createElement("div");
            block.className = "dol-section-block";

            Object.assign(block.style, {
                border: "1px solid #ccc",
                padding: "6px",
                marginBottom: "8px",
                overflowWrap: "break-word"
            });

            return block;
        };

        const makeButton = (text, onclick, type = "normal") => {
            const btn = document.createElement("span");
            btn.className = "dol-btn";
            btn.textContent = text;
            btn.onclick = onclick;

            Object.assign(btn.style, {
                marginRight: "6px",
                cursor: "pointer",
                padding: "1px 5px",
                fontSize: "0.85em",
                minWidth: "0",
                width: "auto",
                lineHeight: "1.3",
                display: "inline-block"
            });

            if (type === "danger") btn.style.color = COLORS.danger;
            if (type === "success") btn.style.color = COLORS.success;
            if (type === "warn") btn.style.color = COLORS.warn;
            if (type === "info") btn.style.color = COLORS.info;

            return btn;
        };

        const makeTabButton = (key, label) => {
            return makeButton(label, () => {
                state.tab = key;
                refresh();
            }, state.tab === key ? "success" : "normal");
        };

        const getTypeName = (value) => {
            if (value === null) return "null";
            if (Array.isArray(value)) return "array";
            return typeof value;
        };

        const getPreview = (value) => {
            try {
                if (value === null) return "null";

                if (typeof value === "string") {
                    return `"${value.length > 40 ? value.slice(0, 40) + "..." : value}"`;
                }

                if (
                    typeof value === "number" ||
                    typeof value === "boolean" ||
                    typeof value === "undefined"
                ) {
                    return String(value);
                }

                if (Array.isArray(value)) {
                    return `Array(${value.length})`;
                }

                if (typeof value === "object") {
                    return `Object(${Object.keys(value).length})`;
                }

                if (typeof value === "function") {
                    return "function";
                }

                return String(value);
            }
            catch (e) {
                return "[preview error]";
            }
        };

        const isSimpleValue = (value) => {
            return (
                value == null ||
                typeof value === "number" ||
                typeof value === "string" ||
                typeof value === "boolean" ||
                typeof value === "undefined"
            );
        };

        const getValueByPath = (path) => {
            const parts = String(path || "").split(".");
            let obj = State.variables;

            for (const part of parts) {
                if (obj == null || !(part in obj)) return undefined;
                obj = obj[part];
            }

            return obj;
        };

        const normalizePathList = (paths) => {
            return Array.from(new Set(
                paths
                    .map(path => String(path || "").trim())
                    .filter(Boolean)
            ));
        };

        /* =====================================================
        一般搜尋用掃描
        -----------------------------------------------------
        受 maxResults 限制，避免 UI 卡死
        ===================================================== */

        const scanAll = (callback) => {
            const maxDepth = Number(state.maxDepth) || 5;
            const maxResults = Number(state.maxResults) || 100;

            const results = [];
            const seen = new WeakSet();

            function scan(obj, path, depth) {
                if (results.length >= maxResults) return;
                if (obj == null) return;

                const type = typeof obj;

                if (type !== "object" && type !== "function") return;

                if (seen.has(obj)) return;
                seen.add(obj);

                if (depth > maxDepth) return;

                let keys;

                try {
                    keys = Object.keys(obj);
                }
                catch (e) {
                    return;
                }

                for (const key of keys) {
                    if (results.length >= maxResults) break;

                    let value;

                    try {
                        value = obj[key];
                    }
                    catch (e) {
                        continue;
                    }

                    const fullPath = path ? `${path}.${key}` : key;

                    const item = {
                        path: fullPath,
                        key,
                        value,
                        type: getTypeName(value),
                        preview: getPreview(value),
                        depth
                    };

                    if (callback(item)) {
                        results.push(item);
                    }

                    if (
                        value != null &&
                        typeof value === "object" &&
                        depth < maxDepth
                    ) {
                        scan(value, fullPath, depth + 1);
                    }
                }
            }

            scan(State.variables, "", 0);

            return results;
        };

        /* =====================================================
        全域快照用掃描
        -----------------------------------------------------
        不受 maxResults 限制。
        只收集簡單值：
            number / string / boolean / null / undefined
        ===================================================== */

        const collectSimpleValues = () => {
            const maxDepth = Number(state.maxDepth) || 5;
            const snap = {};
            const seen = new WeakSet();

            function scan(obj, path, depth) {
                if (obj == null) return;
                if (depth > maxDepth) return;

                const type = typeof obj;

                if (type !== "object" && type !== "function") return;

                if (seen.has(obj)) return;
                seen.add(obj);

                let keys;

                try {
                    keys = Object.keys(obj);
                }
                catch (e) {
                    return;
                }

                for (const key of keys) {
                    let value;

                    try {
                        value = obj[key];
                    }
                    catch (e) {
                        continue;
                    }

                    const fullPath = path ? `${path}.${key}` : key;

                    if (isSimpleValue(value)) {
                        snap[fullPath] = value;
                    }

                    if (
                        value != null &&
                        typeof value === "object" &&
                        depth < maxDepth
                    ) {
                        scan(value, fullPath, depth + 1);
                    }
                }
            }

            scan(State.variables, "", 0);

            return snap;
        };

        /* =====================================================
        指定 path 快照
        -----------------------------------------------------
        用於追蹤範圍。
        只記錄指定 paths 內仍存在且為簡單值的資料。
        ===================================================== */

        const makeSnapshotByPaths = (paths) => {
            const snap = {};
            const list = normalizePathList(paths);

            for (const path of list) {
                const value = getValueByPath(path);

                if (isSimpleValue(value)) {
                    snap[path] = value;
                }
            }

            return snap;
        };

        const getActiveSnapshotPaths = () => {
            if (
                Array.isArray(setup.CE_variableSnapshotPaths) &&
                setup.CE_variableSnapshotPaths.length
            ) {
                return normalizePathList(setup.CE_variableSnapshotPaths);
            }

            return null;
        };

        const makeScopedOrGlobalSnapshot = () => {
            const paths = getActiveSnapshotPaths();

            if (paths) {
                return makeSnapshotByPaths(paths);
            }

            return collectSimpleValues();
        };

        const scanByPath = () => {
            const keyword = String(state.keyword || "").trim().toLowerCase();

            state.results = scanAll(item => {
                if (!keyword) return true;

                return (
                    item.path.toLowerCase().includes(keyword) ||
                    String(item.key).toLowerCase().includes(keyword)
                );
            });

            refresh();
        };

        const parseValueQuery = (raw) => {
            const q = String(raw || "").trim();

            if (!q) return { type: "empty" };

            if (q === "true") return { type: "boolean", value: true };
            if (q === "false") return { type: "boolean", value: false };
            if (q === "null") return { type: "null", value: null };
            if (q === "undefined") return { type: "undefined", value: undefined };

            const rangeMatch = q.match(/^(-?\d+(?:\.\d+)?)\s*~\s*(-?\d+(?:\.\d+)?)$/);
            if (rangeMatch) {
                return {
                    type: "range",
                    min: Number(rangeMatch[1]),
                    max: Number(rangeMatch[2])
                };
            }

            const compareMatch = q.match(/^(>=|<=|>|<|=)\s*(-?\d+(?:\.\d+)?)$/);
            if (compareMatch) {
                return {
                    type: "compare",
                    op: compareMatch[1],
                    value: Number(compareMatch[2])
                };
            }

            if (!Number.isNaN(Number(q))) {
                return {
                    type: "number",
                    value: Number(q)
                };
            }

            return {
                type: "string",
                value: q.toLowerCase()
            };
        };

        const valueMatches = (value, query) => {
            if (query.type === "empty") return false;

            if (query.type === "boolean") {
                return value === query.value;
            }

            if (query.type === "null") {
                return value === null;
            }

            if (query.type === "undefined") {
                return value === undefined;
            }

            if (query.type === "number") {
                return typeof value === "number" && value === query.value;
            }

            if (query.type === "range") {
                return (
                    typeof value === "number" &&
                    value >= query.min &&
                    value <= query.max
                );
            }

            if (query.type === "compare") {
                if (typeof value !== "number") return false;

                if (query.op === ">") return value > query.value;
                if (query.op === "<") return value < query.value;
                if (query.op === ">=") return value >= query.value;
                if (query.op === "<=") return value <= query.value;
                if (query.op === "=") return value === query.value;
            }

            if (query.type === "string") {
                return (
                    typeof value === "string" &&
                    value.toLowerCase().includes(query.value)
                );
            }

            return false;
        };

        const scanByValue = () => {
            const query = parseValueQuery(state.valueQuery);

            state.results = scanAll(item => valueMatches(item.value, query));
            refresh();
        };

        const makeSnapshot = () => {
            setup.CE_variableSnapshot = makeScopedOrGlobalSnapshot();

            const scope = getActiveSnapshotPaths();

            alert(
                "快照已建立。\n" +
                "模式：" + (scope ? "追蹤範圍" : "全域") + "\n" +
                "記錄數：" + Object.keys(setup.CE_variableSnapshot).length
            );
        };

        const compareSnapshot = () => {
            const oldSnap = setup.CE_variableSnapshot;

            if (!oldSnap) {
                alert("尚未建立快照");
                return;
            }

            const now = makeScopedOrGlobalSnapshot();
            const diff = [];

            const keys = new Set([
                ...Object.keys(oldSnap),
                ...Object.keys(now)
            ]);

            for (const key of keys) {
                if (oldSnap[key] !== now[key]) {
                    diff.push({
                        path: key,
                        oldValue: oldSnap[key],
                        newValue: now[key],
                        oldPreview: getPreview(oldSnap[key]),
                        newPreview: getPreview(now[key])
                    });
                }
            }

            state.diffResults = diff;
            refresh();
        };

        const setSnapshotScopeFromSearchResults = () => {
            if (!Array.isArray(state.results) || !state.results.length) {
                alert("目前沒有搜尋結果可建立追蹤範圍");
                return;
            }

            const paths = normalizePathList(
                state.results
                    .filter(item => isSimpleValue(getValueByPath(item.path)))
                    .map(item => item.path)
            );

            if (!paths.length) {
                alert("目前搜尋結果沒有可追蹤的簡單值");
                return;
            }

            setup.CE_variableSnapshotPaths = paths;
            setup.CE_variableSnapshot = makeSnapshotByPaths(paths);

            alert(
                "已用目前搜尋結果建立追蹤快照。\n" +
                "追蹤路徑數：" + paths.length
            );

            state.tab = "diff";
            refresh();
        };

        const setSnapshotScopeFromDiffResults = () => {
            if (!Array.isArray(state.diffResults) || !state.diffResults.length) {
                alert("目前沒有差異結果可建立追蹤範圍");
                return;
            }

            const paths = normalizePathList(
                state.diffResults
                    .filter(item => isSimpleValue(getValueByPath(item.path)))
                    .map(item => item.path)
            );

            if (!paths.length) {
                alert("目前差異結果沒有可追蹤的簡單值");
                return;
            }

            setup.CE_variableSnapshotPaths = paths;
            setup.CE_variableSnapshot = makeSnapshotByPaths(paths);

            alert(
                "已用目前差異結果縮小追蹤快照。\n" +
                "追蹤路徑數：" + paths.length
            );

            refresh();
        };

        const clearSnapshotScope = () => {
            delete setup.CE_variableSnapshotPaths;

            alert("已清除追蹤範圍。之後建立 / 比較快照會回到全域模式。");
            refresh();
        };

        const copyText = (text) => {
            try {
                if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(text);
                    alert("已複製：\n" + text);
                    return;
                }
            }
            catch (e) {}

            console.log("[cheat Extended][Variable Explorer copy]", text);
            alert("此環境可能不支援剪貼簿，已輸出到控制台：\n" + text);
        };

        const applyToHookPath = (path) => {
            setup.CE_customHookPanel ??= {
                path: "",
                targetPath: "",
                type: "VarHook",
                mode: "lock",
                value: "",
                posMult: 1,
                negMult: 1,
                maxDepth: 2,
                saveToStore: false
            };

            setup.CE_customHookPanel.path = path;

            alert("已帶入 Hook 變數路徑：\n" + path);
        };

        const applyToDeepTarget = (path) => {
            setup.CE_customHookPanel ??= {
                path: "",
                targetPath: "",
                type: "DeepProxyHook",
                mode: "monitor",
                value: "",
                posMult: 1,
                negMult: 1,
                maxDepth: 2,
                saveToStore: false
            };

            const parts = path.split(".");

            if (parts.length > 1) {
                setup.CE_customHookPanel.path = parts[0];
                setup.CE_customHookPanel.targetPath = path;
                setup.CE_customHookPanel.type = "DeepProxyHook";
                setup.CE_customHookPanel.mode = "monitor";
            }
            else {
                setup.CE_customHookPanel.path = path;
                setup.CE_customHookPanel.targetPath = "";
                setup.CE_customHookPanel.type = "DeepProxyHook";
                setup.CE_customHookPanel.mode = "monitor";
            }

            alert(
                "已帶入 DeepProxyHook：\n\n" +
                "變數路徑：" + setup.CE_customHookPanel.path + "\n" +
                "目標 fullPath：" + setup.CE_customHookPanel.targetPath
            );
        };

        const renderResultRows = (parent, list) => {
            if (!list.length) {
                addHint(parent, "尚無結果。", "muted");
                return;
            }

            list.forEach(item => {
                const row = document.createElement("div");
                row.className = "dol-section-block";

                Object.assign(row.style, {
                    border: "1px solid #ccc",
                    padding: "5px",
                    marginBottom: "6px",
                    overflowWrap: "break-word"
                });

                const pathLine = document.createElement("div");
                pathLine.style.fontWeight = "bold";
                pathLine.textContent = item.path;
                row.appendChild(pathLine);

                const metaLine = document.createElement("div");
                Object.assign(metaLine.style, {
                    fontSize: "0.85em",
                    color: COLORS.muted,
                    marginTop: "3px"
                });
                metaLine.textContent = `type: ${item.type} / value: ${item.preview}`;
                row.appendChild(metaLine);

                const opLine = document.createElement("div");
                opLine.style.marginTop = "5px";

                opLine.appendChild(makeButton("複製路徑", () => {
                    copyText(item.path);
                }, "info"));

                opLine.appendChild(makeButton("套用 Hook 路徑", () => {
                    applyToHookPath(item.path);
                }, "success"));

                opLine.appendChild(makeButton("套用 Deep 目標", () => {
                    applyToDeepTarget(item.path);
                }, "warn"));

                row.appendChild(opLine);
                parent.appendChild(row);
            });
        };
        // 重置搜尋UI
        const resetExplorer = () => {
            state.keyword = "";
            state.valueQuery = "";
            state.maxDepth = 5;
            state.maxResults = 100;
            state.results = [];
            state.diffResults = [];

            delete setup.CE_variableSnapshot;
            delete setup.CE_variableSnapshotPaths;

            refresh();
        };

        function render() {
            container.innerHTML = "";

            const header = document.createElement("div");
            header.className = "dol-header";
            header.innerHTML = `<span class="dol-title">變數搜尋器</span>`;
            container.appendChild(header);

            const body = document.createElement("div");
            body.className = "dol-body";
            container.appendChild(body);

            const desc = document.createElement("div");
            desc.className = "dol-desc";
            desc.textContent = "搜尋 State.variables / V 內的變數路徑、反查數值，或比較變數變化。";
            body.appendChild(desc);
            body.appendChild(document.createElement("br"));

            const tabBlock = makeSection();
            tabBlock.appendChild(makeTabButton("path", "路徑搜尋"));
            tabBlock.appendChild(makeTabButton("value", "值反搜尋"));
            tabBlock.appendChild(makeTabButton("diff", "快照差異"));
            tabBlock.appendChild(makeButton("重置", resetExplorer, "danger"));
            body.appendChild(tabBlock);

            const configBlock = makeSection();

            const title = document.createElement("div");
            title.style.fontWeight = "bold";
            title.style.marginBottom = "6px";
            title.textContent = "搜尋設定";
            configBlock.appendChild(title);

            if (state.tab === "path") {
                const row = document.createElement("div");
                row.style.marginBottom = "6px";

                const label = document.createElement("span");
                label.style.display = "inline-block";
                label.style.width = "120px";
                label.textContent = "關鍵字：";
                row.appendChild(label);

                const input = document.createElement("input");
                input.type = "text";
                input.value = state.keyword;
                input.style.width = "220px";
                input.placeholder = "例如 health、wardrobe、pain";
                input.oninput = function(){
                    state.keyword = this.value;
                };

                row.appendChild(input);
                configBlock.appendChild(row);

                configBlock.appendChild(makeButton("搜尋", scanByPath, "success"));
                configBlock.appendChild(makeButton("以搜尋結果建立追蹤快照", setSnapshotScopeFromSearchResults, "warn"));

                addHint(configBlock, "可先搜尋關鍵字，再用搜尋結果建立追蹤快照。", "info");
            }

            if (state.tab === "value") {
                const row = document.createElement("div");
                row.style.marginBottom = "6px";

                const label = document.createElement("span");
                label.style.display = "inline-block";
                label.style.width = "120px";
                label.textContent = "搜尋值：";
                row.appendChild(label);

                const input = document.createElement("input");
                input.type = "text";
                input.value = state.valueQuery;
                input.style.width = "220px";
                input.placeholder = "例如 100、>=50、10~20、true、shirt";
                input.oninput = function(){
                    state.valueQuery = this.value;
                };

                row.appendChild(input);
                configBlock.appendChild(row);

                configBlock.appendChild(makeButton("反搜尋", scanByValue, "success"));
                configBlock.appendChild(makeButton("以搜尋結果建立追蹤快照", setSnapshotScopeFromSearchResults, "warn"));

                addHint(configBlock, "支援：精確數字、>=、<=、>、<、範圍 10~20、true/false、字串包含。", "info");
            }

            if (state.tab === "diff") {
                const scope = getActiveSnapshotPaths();

                const scopeText = document.createElement("div");
                Object.assign(scopeText.style, {
                    fontSize: "0.9em",
                    marginBottom: "6px",
                    color: scope ? COLORS.warn : COLORS.info,
                    fontWeight: "bold"
                });

                scopeText.textContent = scope
                    ? `目前模式：追蹤範圍 (${scope.length} paths)`
                    : "目前模式：全域快照";

                configBlock.appendChild(scopeText);

                configBlock.appendChild(makeButton("建立快照", makeSnapshot, "info"));
                configBlock.appendChild(makeButton("比較差異", compareSnapshot, "success"));

                if (state.diffResults.length) {
                    configBlock.appendChild(makeButton("以差異結果縮小追蹤", setSnapshotScopeFromDiffResults, "warn"));
                }

                if (scope) {
                    configBlock.appendChild(makeButton("清除追蹤範圍", clearSnapshotScope, "danger"));
                }

                addHint(configBlock, "快照差異不限制結果數量，但仍受最大深度影響。若差異過多，UI 可能卡頓。", "warn");
                addHint(configBlock, "可用搜尋結果或差異結果建立追蹤範圍，逐步縮小可疑變數。", "info");
            }

            const depthRow = document.createElement("div");
            depthRow.style.marginTop = "8px";

            const depthLabel = document.createElement("span");
            depthLabel.style.display = "inline-block";
            depthLabel.style.width = "120px";
            depthLabel.textContent = "最大深度：";
            depthRow.appendChild(depthLabel);

            const depthInput = document.createElement("input");
            depthInput.type = "number";
            depthInput.value = state.maxDepth;
            depthInput.style.width = "80px";
            depthInput.oninput = function(){
                state.maxDepth = Number(this.value) || 5;
            };

            depthRow.appendChild(depthInput);
            configBlock.appendChild(depthRow);

            if (state.tab !== "diff") {
                const limitRow = document.createElement("div");
                limitRow.style.marginTop = "6px";

                const limitLabel = document.createElement("span");
                limitLabel.style.display = "inline-block";
                limitLabel.style.width = "120px";
                limitLabel.textContent = "結果上限：";
                limitRow.appendChild(limitLabel);

                const limitInput = document.createElement("input");
                limitInput.type = "number";
                limitInput.value = state.maxResults;
                limitInput.style.width = "80px";
                limitInput.oninput = function(){
                    state.maxResults = Number(this.value) || 100;
                };

                limitRow.appendChild(limitInput);
                configBlock.appendChild(limitRow);

                addHint(configBlock, "深度越高越容易卡頓。建議一般搜尋使用 2～5。", "warn");
            }

            body.appendChild(configBlock);

            const resultBlock = makeSection();

            const resultTitle = document.createElement("div");
            resultTitle.style.fontWeight = "bold";
            resultTitle.style.marginBottom = "6px";

            if (state.tab === "diff") {
                resultTitle.textContent = `差異結果 (${state.diffResults.length})`;
                resultBlock.appendChild(resultTitle);

                if (!state.diffResults.length) {
                    addHint(resultBlock, "尚無差異結果。", "muted");
                }
                else {
                    state.diffResults.forEach(item => {
                        const row = document.createElement("div");
                        row.className = "dol-section-block";

                        Object.assign(row.style, {
                            border: "1px solid #ccc",
                            padding: "5px",
                            marginBottom: "6px",
                            overflowWrap: "break-word"
                        });

                        const pathLine = document.createElement("div");
                        pathLine.style.fontWeight = "bold";
                        pathLine.textContent = item.path;
                        row.appendChild(pathLine);

                        const diffLine = document.createElement("div");
                        Object.assign(diffLine.style, {
                            fontSize: "0.9em",
                            marginTop: "4px"
                        });
                        diffLine.textContent = `${item.oldPreview} → ${item.newPreview}`;
                        row.appendChild(diffLine);

                        const opLine = document.createElement("div");
                        opLine.style.marginTop = "5px";

                        opLine.appendChild(makeButton("複製路徑", () => {
                            copyText(item.path);
                        }, "info"));

                        opLine.appendChild(makeButton("套用 Hook 路徑", () => {
                            applyToHookPath(item.path);
                        }, "success"));

                        opLine.appendChild(makeButton("套用 Deep 目標", () => {
                            applyToDeepTarget(item.path);
                        }, "warn"));

                        row.appendChild(opLine);
                        resultBlock.appendChild(row);
                    });
                }
            }
            else {
                resultTitle.textContent = `搜尋結果 (${state.results.length})`;
                resultBlock.appendChild(resultTitle);
                renderResultRows(resultBlock, state.results);
            }

            addHint(resultBlock, "套用按鈕只會幫你填入 Hook 面板欄位，不會自動註冊 Hook。", "info");

            body.appendChild(resultBlock);
        }

        render();
    }
});


/*=========================================================
 Cheat Extended - Debug Tool Panel

 整合：
   - CE_VariableExplorer
   - CE_CustomHookPanel

 用於變數搜尋、快照追蹤與 Hook 管理。

=========================================================*/
Macro.add("CE_DebugToolPanel", {
    handler() {
        const container = document.createElement("div");
        container.className = "dol-settings dol-shadow";
        this.output.appendChild(container);

        const state = setup.CE_debugToolPanel ??= {
            tab: "explorer"
        };

        const refresh = () => render();

        const makeButton = (key, label) => {
            const btn = document.createElement("span");
            btn.className = "dol-btn";
            btn.textContent = label;
            btn.style.marginRight = "6px";
            btn.style.cursor = "pointer";

            if (state.tab === key) {
                btn.style.fontWeight = "bold";
                btn.style.color = "#6cc04a";
            }

            btn.onclick = function(){
                state.tab = key;
                refresh();
            };

            return btn;
        };

        function render() {
            container.innerHTML = "";

            const header = document.createElement("div");
            header.className = "dol-header";
            header.innerHTML = `<span class="dol-title">Debug 工具</span>`;
            container.appendChild(header);

            const body = document.createElement("div");
            body.className = "dol-body";
            container.appendChild(body);

            const tabRow = document.createElement("div");
            tabRow.style.marginBottom = "8px";

            tabRow.appendChild(makeButton("explorer", "變數搜尋"));
            tabRow.appendChild(makeButton("hook", "Hook 管理"));

            body.appendChild(tabRow);

            const content = document.createElement("div");
            body.appendChild(content);

            if (state.tab === "explorer") {
                new Wikifier(content, "<<CE_VariableExplorer>>");
            }

            if (state.tab === "hook") {
                new Wikifier(content, "<<CE_CustomHookPanel>>");
            }
        }

        render();
    }
});

CE_TabManager.register({
    id: 'CE_DebugToolPanel',
    title: 'Debug 工具',
    condition: () => V.debug, 
    onClick: () => CE_renderSettings('<<CE_DebugToolPanel>>')
});