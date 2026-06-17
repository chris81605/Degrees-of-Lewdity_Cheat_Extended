/*==============================
CE Custom Hook 保存 / 重建工具
--------------------------------
1. 只保存設定，不保存 function
2. 保存於 V.CE_customHooks
3. Passage 切換時自動重建
==============================*/

(function(){

    function ensureStore(){
        if (!Array.isArray(V.CE_customHooks)) {
            V.CE_customHooks = [];
        }

        return V.CE_customHooks;
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

    setup.CE_makeCustomHookSnapshot = function(state){
        return {
            id: makeId(),
            enabled: true,

            type: state.type,
            path: String(state.path || "").trim(),
            targetPath: String(state.targetPath || "").trim(),

            mode: state.mode,
            value: state.value,

            posMult: Number(state.posMult),
            negMult: Number(state.negMult),
            maxDepth: Number(state.maxDepth) || 2
        };
    };

    setup.CE_saveCustomHook = function(hook){
        const list = ensureStore();
        const key = hookKey(hook);
        const oldIndex = list.findIndex(item => hookKey(item) === key);

        if (oldIndex >= 0) {
            hook.id = list[oldIndex].id;
            list[oldIndex] = hook;
        }
        else {
            list.push(hook);
        }
    };

    setup.CE_removeCustomHook = function(id){
        const list = ensureStore();
        const index = list.findIndex(item => item.id === id);

        if (index >= 0) {
            list.splice(index, 1);
        }
    };

    setup.CE_registerCustomHookConfig = function(hook){
        if (!hook || hook.enabled === false) return;

        const path = hook.path;

        if (hook.type === "VarHook") {
            if (hook.mode === "multiplier") {
                VarHook.register(path, Number(hook.posMult), Number(hook.negMult));
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
                        "[CE Saved Custom Hook]",
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

    setup.CE_rebuildCustomHooks = function(){
        const list = ensureStore();

        for (const hook of list) {
            setup.CE_registerCustomHookConfig(hook);
        }

        VarHook?.installAll?.();
        RawHook?.installAll?.();
        DeepProxyHook?.installAll?.();
    };

    $(document).on(":passagestart", () => {
        setup.CE_rebuildCustomHooks?.();
    });

})();


/*==============================
簡易 Hook UI
--------------------------------
1. 可臨時註冊 Hook
2. 可選擇保存到存檔
3. 自訂 Hook 設定保存於 V.CE_customHooks
4. 變數路徑不要輸入 V.
5. 卸載為軟卸載，切換 Passage 後等同完全卸載
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
            mode: "lock",
            value: "",
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
                    if (state.type === "VarHook") state.mode = "lock";
                    else if (state.type === "RawHook") state.mode = "lock";
                    else if (state.type === "DeepProxyHook") state.mode = "monitor";
                }

                refresh();
            });

            row.appendChild(select);
            return row;
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

            const input = document.createElement("input");
            input.type = "checkbox";
            input.checked = !!state.saveToStore;

            input.onchange = function(){
                state.saveToStore = this.checked;
                refresh();
            };

            const text = document.createElement("span");
            text.textContent = " 保存此 Hook 到存檔";
            text.style.color = state.saveToStore ? COLORS.warn : "";

            row.appendChild(input);
            row.appendChild(text);

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

            if (type === "danger") {
                btn.style.color = COLORS.danger;
            }
            else if (type === "success") {
                btn.style.color = COLORS.success;
            }
            else if (type === "warn") {
                btn.style.color = COLORS.warn;
            }

            return btn;
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

        const registerHook = () => {
            const path = String(state.path || "").trim();

            if (!validatePathForRegister(path)) return;

            try {
                if (state.type === "VarHook") {
                    V.CE_VarHook_enable = true;

                    if (state.mode === "multiplier") {
                        VarHook.register(path, Number(state.posMult), Number(state.negMult));
                    }

                    if (state.mode === "lock") {
                        VarHook.register(path, 1, 1, {
                            transform(ctx) {
                                return ctx.old;
                            }
                        });
                    }

                    if (state.mode === "blockIncrease") {
                        VarHook.register(path, 1, 1, {
                            transform(ctx) {
                                if (ctx.diff > 0) return ctx.old;
                                return ctx.old + ctx.adjustedDiff;
                            }
                        });
                    }

                    if (state.mode === "blockDecrease") {
                        VarHook.register(path, 1, 1, {
                            transform(ctx) {
                                if (ctx.diff < 0) return ctx.old;
                                return ctx.old + ctx.adjustedDiff;
                            }
                        });
                    }

                    VarHook.installAll();
                }

                if (state.type === "RawHook") {
                    V.CE_RawHook_enable = true;

                    if (state.mode === "lock") {
                        RawHook.register(path, {
                            transform(ctx) {
                                return ctx.old;
                            }
                        });
                    }

                    if (state.mode === "forceValue") {
                        RawHook.register(path, {
                            transform() {
                                return state.value;
                            }
                        });
                    }

                    RawHook.installAll();
                }

                if (state.type === "DeepProxyHook") {
                    V.CE_DeepProxyHook_enable = true;

                    DeepProxyHook.register(path, {
                        maxDepth: Number(state.maxDepth) || 2,
                        ignoreKeys: ["length"],

                        transform(ctx) {
                            const targetPath = String(state.targetPath || "").trim();

                            if (targetPath && ctx.fullPath !== targetPath) {
                                return ctx.newValue;
                            }

                            if (state.mode === "monitor") return ctx.newValue;
                            if (state.mode === "lock") return ctx.oldValue;
                            if (state.mode === "forceValue") return state.value;

                            if (state.mode === "allowIncreaseOnly") {
                                const oldNum = Number(ctx.oldValue);
                                const newNum = Number(ctx.newValue);

                                if (!Number.isNaN(oldNum) && !Number.isNaN(newNum)) {
                                    if (newNum < oldNum) return ctx.oldValue;
                                }

                                return ctx.newValue;
                            }

                            if (state.mode === "allowDecreaseOnly") {
                                const oldNum = Number(ctx.oldValue);
                                const newNum = Number(ctx.newValue);

                                if (!Number.isNaN(oldNum) && !Number.isNaN(newNum)) {
                                    if (newNum > oldNum) return ctx.oldValue;
                                }

                                return ctx.newValue;
                            }

                            return ctx.newValue;
                        },

                        delete(ctx) {
                            const targetPath = String(state.targetPath || "").trim();

                            if (targetPath && ctx.fullPath !== targetPath) {
                                return true;
                            }

                            if (state.mode === "blockDelete") {
                                return false;
                            }

                            return true;
                        },

                        after(oldVal, finalVal, ctx) {
                            const targetPath = String(state.targetPath || "").trim();

                            if (targetPath && ctx.fullPath !== targetPath) {
                                return;
                            }

                            console.log(
                                "[CE Custom DeepProxyHook]",
                                ctx.fullPath,
                                oldVal,
                                "→",
                                finalVal,
                                "mode:",
                                state.mode,
                                "targetPath:",
                                targetPath || "(all)"
                            );
                        }
                    });

                    DeepProxyHook.installAll();
                }

                if (state.saveToStore) {
                    const snapshot = setup.CE_makeCustomHookSnapshot(state);
                    setup.CE_saveCustomHook(snapshot);
                }

                alert(
                    "Hook 已註冊：" + path +
                    (state.saveToStore ? "\n已保存到存檔。" : "")
                );

                refresh();
            }
            catch (e) {
                console.error("[CE_CustomHookPanel]", e);
                alert("Hook 註冊失敗，詳情請看控制台");
            }
        };

        const unregisterHook = () => {
            const path = String(state.path || "").trim();

            if (!path) {
                alert("請輸入要卸載的變數路徑");
                return;
            }

            try {
                if (state.type === "VarHook") VarHook.unregister?.(path);
                if (state.type === "RawHook") RawHook.unregister?.(path);
                if (state.type === "DeepProxyHook") DeepProxyHook.unregister?.(path);

                alert("Hook 已卸載：" + path + "\n切換 Passage 後會完全生效。");
                refresh();
            }
            catch (e) {
                console.error("[CE_CustomHookPanel]", e);
                alert("Hook 卸載失敗，詳情請看控制台");
            }
        };

        const renderSavedHooks = (body) => {
            const savedBlock = makeSection();

            const savedTitle = document.createElement("div");
            savedTitle.style.fontWeight = "bold";
            savedTitle.style.marginBottom = "6px";
            savedTitle.textContent = "已保存的自訂 Hook";
            savedBlock.appendChild(savedTitle);

            if (!Array.isArray(V.CE_customHooks) || V.CE_customHooks.length === 0) {
                addHint(savedBlock, "目前沒有保存任何自訂 Hook。", "muted");
            }
            else {
                V.CE_customHooks.forEach(hook => {
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
                            if (hook.type === "VarHook") VarHook.unregister?.(hook.path);
                            if (hook.type === "RawHook") RawHook.unregister?.(hook.path);
                            if (hook.type === "DeepProxyHook") DeepProxyHook.unregister?.(hook.path);
                        }
                        else {
                            setup.CE_registerCustomHookConfig(hook);
                            VarHook?.installAll?.();
                            RawHook?.installAll?.();
                            DeepProxyHook?.installAll?.();
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

                    const status = document.createElement("span");
                    status.textContent = hook.enabled !== false ? "✓ 啟用" : "⚠ 停用";
                    Object.assign(status.style, {
                        color: hook.enabled !== false ? COLORS.success : COLORS.warn,
                        fontWeight: "bold",
                        fontSize: "0.85em"
                    });
                    topRow.appendChild(status);

                    const delBtn = makeButton("刪除", function(){
                        setup.CE_removeCustomHook(hook.id);

                        if (hook.type === "VarHook") VarHook.unregister?.(hook.path);
                        if (hook.type === "RawHook") RawHook.unregister?.(hook.path);
                        if (hook.type === "DeepProxyHook") DeepProxyHook.unregister?.(hook.path);

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

                    const risk = document.createElement("div");
                    Object.assign(risk.style, {
                        fontSize: "0.85em",
                        color: getHookColor(hook.type),
                        marginTop: "3px"
                    });
                    risk.textContent = `風險：${getHookRiskText(hook.type)}`;
                    row.appendChild(risk);

                    savedBlock.appendChild(row);
                });
            }

            addHint(savedBlock, "停用或刪除後，目前 Passage 可能仍保留舊 Hook；切換 Passage 後會完全清除。", "warn");

            body.appendChild(savedBlock);
        };

        function render() {
            container.innerHTML = "";

            const header = document.createElement("div");
            header.className = "dol-header";
            header.innerHTML = `<span class="dol-title">Cheat Extended - 自訂 Hook</span>`;
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

            addHint(statusBlock, "RawHook / DeepProxyHook 屬於高風險功能，需搭配 VarHook 總開關管理。", "warn");

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
                color: getHookColor(state.type),
                fontWeight: "bold",
                marginBottom: "6px"
            });
            currentRisk.textContent = `${getHookIcon(state.type)} 目前類型：${state.type}（${getHookRiskText(state.type)}）`;
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
                    { value: "multiplier", label: "倍率模式" },
                    { value: "lock", label: "鎖定目前值" },
                    { value: "blockIncrease", label: "阻止增加" },
                    { value: "blockDecrease", label: "阻止減少" }
                ]));

                if (state.mode === "multiplier") {
                    inputBlock.appendChild(makeInput("正向倍率", "posMult", "number"));
                    inputBlock.appendChild(makeInput("負向倍率", "negMult", "number"));
                }
            }

            if (state.type === "RawHook") {
                inputBlock.appendChild(makeSelect("模式", "mode", [
                    { value: "lock", label: "鎖定目前值" },
                    { value: "forceValue", label: "強制指定值" }
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
                    { value: "blockDelete", label: "阻止刪除" }
                ]));

                inputBlock.appendChild(makeInput("目標 fullPath", "targetPath"));
                addHint(inputBlock, "建議填寫。例：CE_proxyTest.deep.b。若留空，模式會套用到所有被攔截路徑。", "warn");

                if (state.mode === "forceValue") {
                    inputBlock.appendChild(makeInput("指定值", "value"));
                }

                inputBlock.appendChild(makeInput("最大深度", "maxDepth", "number"));
                addHint(inputBlock, "DeepProxyHook 高風險；maxDepth 建議 1～2，避免大型資料結構造成效能問題。", "danger");
            }

            inputBlock.appendChild(makeSaveSwitch());
            addHint(inputBlock, "保存後會寫入 V.CE_customHooks，之後 Passage 切換時自動重建。", state.saveToStore ? "warn" : "muted");

            body.appendChild(inputBlock);

            renderSavedHooks(body);

            const opBlock = makeSection();

            const opTitle = document.createElement("div");
            opTitle.style.fontWeight = "bold";
            opTitle.style.marginBottom = "6px";
            opTitle.textContent = "操作";
            opBlock.appendChild(opTitle);

            opBlock.appendChild(makeButton("註冊 Hook", registerHook, "success"));
            opBlock.appendChild(makeButton("卸載 Hook", unregisterHook, "warn"));

            addHint(opBlock, "卸載為軟卸載；目前 Passage 可能仍保留舊 setter / Proxy，切換 Passage 後等同完全卸載。", "warn");

            body.appendChild(opBlock);
        }

        render();
    }
});

CE_TabManager.register({
    id: 'CE_CustomHookPanel',
    title: '自訂 Hook',
    condition: () => V.debug, 
    onClick: () => CE_renderSettings('<<CE_CustomHookPanel>>')
});