
/*
 * CE 服裝特質編輯器
 *
 * 功能：
 * - 依服裝部位與名稱管理特質設定。
 * - 將自訂特質記錄於遊戲存檔。
 * - 讀檔時還原服裝定義並套用目前存檔的設定。
 * - 手動修改時同步更新目前穿著的同件服裝。
 *
 * 不直接介入遊戲換裝或服裝堆疊(Dol原版優化功能)流程。
 * 依賴 SugarCube、setup.clothes、Macro 與 jQuery。
 */
(function () {
    "use strict";

    const TAG = "[Cheat Extended][ClothTraitEditor]";
    const DATA_KEY = "CE_clothTraitOverrides";
    const MACRO = "clothTraitEditor";
    let snapshot = null;
    let initialized = false;
    let appliedRecord = null;
    let appliedSignature = null;

    // ============================================================
    // 核心：特質正規化、服裝識別與原始資料快照
    // ============================================================

    const normalize = value => [...new Set(
        (Array.isArray(value) ? value : value == null ? [] : [value])
            .filter(v => typeof v === "string" && v.length > 0)
    )];

    const same = (a, b) => {
        const x = normalize(a), y = normalize(b);
        return x.length === y.length && x.every(t => y.includes(t));
    };

    function requireReady() {
        if (!initialized || !snapshot) throw new Error("服裝特質編輯器尚未初始化");
        if (!setup.clothes || typeof setup.clothes !== "object") throw new Error("setup.clothes 不可用");
    }

    // 記錄各部位服裝的原始特質，供讀檔及還原使用。
    function takeSnapshot() {
        const result = Object.create(null);
        for (const [part, clothes] of Object.entries(setup.clothes || {})) {
            if (!Array.isArray(clothes)) continue;
            const originals = Object.create(null);
            for (const item of clothes) {
                if (!item || typeof item.name !== "string" || !item.name) continue;
                originals[item.name] = normalize(item.type);
            }
            result[part] = originals;
        }
        return result;
    }

    function findByName(part, name) {
        const list = setup.clothes?.[part];
        if (!Array.isArray(list) || typeof name !== "string" || !name) return null;
        const index = list.findIndex(item => item?.name === name);
        return index < 0 ? null : { item: list[index], index };
    }

    function getEntry(part, name) {
        const found = findByName(part, name);
        const originals = snapshot?.[part];
        if (!found || !originals || !Object.hasOwn(originals, name)) return null;
        return { ...found, original: originals[name] };
    }

    function readDb() {
        const db = typeof V !== "undefined" ? V?.[DATA_KEY] : null;
        return db && typeof db === "object" && !Array.isArray(db) ? db : {};
    }

    function ensureDb() {
        if (typeof V === "undefined" || !V || typeof V !== "object") {
            throw new Error("遊戲存檔變數尚未就緒");
        }
        if (!V[DATA_KEY] || typeof V[DATA_KEY] !== "object" || Array.isArray(V[DATA_KEY])) {
            V[DATA_KEY] = {};
        }
        return V[DATA_KEY];
    }

    // 存檔結構：db[part][name] = { name, types }。
    function validRecord(rec) {
        return rec && typeof rec === "object" && !Array.isArray(rec)
            && typeof rec.name === "string" && Array.isArray(rec.types)
            && rec.types.every(t => typeof t === "string");
    }

    // 建立設定摘要，用於判斷是否需要重新套用。
    function signature(db) {
        const pieces = [];
        for (const part of Object.keys(db).sort()) {
            const group = db[part];
            if (!group || typeof group !== "object" || Array.isArray(group)) continue;
            for (const key of Object.keys(group).sort()) {
                const rec = group[key];
                if (validRecord(rec) && key === rec.name) {
                    pieces.push([part, key, normalize(rec.types).slice().sort()]);
                }
            }
        }
        return JSON.stringify(pieces);
    }

    // ============================================================
    // 核心：服裝定義還原、自訂設定套用與穿著同步
    // ============================================================

    function resetDefinitions() {
        for (const [part, originals] of Object.entries(snapshot || {})) {
            const clothes = setup.clothes?.[part];
            if (!Array.isArray(clothes)) continue;
            for (const item of clothes) {
                if (item && Object.hasOwn(originals, item.name)) {
                    item.type = originals[item.name].slice();
                }
            }
        }
    }

    function applyDatabase(db) {
        for (const [part, group] of Object.entries(db || {})) {
            if (!group || typeof group !== "object" || Array.isArray(group)) continue;
            for (const [name, rec] of Object.entries(group)) {
                if (!validRecord(rec) || rec.name !== name) continue;
                const entry = getEntry(part, name);
                if (!entry) {
                    console.warn(TAG, "找不到服裝，略過覆寫", part, name);
                    continue;
                }
                entry.item.type = normalize(rec.types);
            }
        }
    }

    // 僅在玩家主動修改或還原時同步目前穿著的服裝。
    // 讀檔與設定校正不直接修改 V.worn。
    function syncEditedWorn(part, name, types) {
        if (typeof V === "undefined") return;
        const worn = V?.worn?.[part];
        if (worn && worn.name === name) worn.type = normalize(types);
    }

    // 存檔設定改變時，先恢復原始定義，再套用自訂設定。
    function reconcile(force = false) {
        if (!initialized || typeof V === "undefined" || !V) return;
        const db = readDb();
        const next = signature(db);
        if (!force && appliedRecord === db && appliedSignature === next) return;
        resetDefinitions();
        applyDatabase(db);
        appliedRecord = db;
        appliedSignature = next;
    }

    function edit(part, name, types) {
        requireReady();
        reconcile();
        const entry = getEntry(part, name);
        if (!entry) throw new Error(`找不到服裝：${part}/${name}`);
        const next = normalize(types);
        const db = ensureDb();
        if (same(next, entry.original)) {
            if (db[part]) {
                delete db[part][name];
                if (!Object.keys(db[part]).length) delete db[part];
            }
            entry.item.type = entry.original.slice();
        } else {
            db[part] ??= {};
            db[part][name] = { name, types: next.slice() };
            entry.item.type = next.slice();
        }
        appliedRecord = db;
        appliedSignature = signature(db);
        syncEditedWorn(part, name, entry.item.type);
        return entry.item.type.slice();
    }

    function restore(part, name) {
        requireReady();
        const entry = getEntry(part, name);
        if (!entry) throw new Error(`找不到服裝：${part}/${name}`);
        return edit(part, name, entry.original);
    }

    function restoreAll() {
        requireReady();
        reconcile();
        const db = ensureDb();
        const affectedWorn = [];
        for (const [part, group] of Object.entries(db)) {
            if (!group || typeof group !== "object") continue;
            const wornName = V?.worn?.[part]?.name;
            if (wornName && Object.hasOwn(group, wornName)) affectedWorn.push([part, wornName]);
        }
        for (const key of Object.keys(db)) delete db[key];
        reconcile(true);
        for (const [part, name] of affectedWorn) {
            const entry = getEntry(part, name);
            if (entry) syncEditedWorn(part, name, entry.item.type);
        }
    }

    // 整理目前穿著及已修改的服裝，供介面顯示。
    function listParts() {
        requireReady();
        reconcile();
        const db = readDb();
        const parts = new Set([
            ...Object.keys(setup.clothes || {}),
            ...Object.keys(V?.worn || {}),
            ...Object.keys(db)
        ]);
        return [...parts].filter(part => part !== "all").map(part => {
            const current = V?.worn?.[part];
            const isNaked = !current?.name || current.name === "naked";
            const currentName = isNaked
                ? (V?.debug && findByName(part, "naked") ? "naked" : null)
                : current.name;
            const names = new Set();
            if (currentName) names.add(currentName);
            const group = db[part];
            if (group && typeof group === "object" && !Array.isArray(group)) {
                for (const [name, rec] of Object.entries(group)) {
                    if (validRecord(rec) && rec.name === name) names.add(name);
                }
            }
            const garments = [...names].map(name => {
                const entry = getEntry(part, name);
                return {
                    part, name, worn: name === currentName,
                    modified: !!(group && validRecord(group[name]) && group[name].name === name),
                    missing: !entry,
                    label: entry?.item?.cn_name_cap || entry?.item?.cn_name || name,
                    types: entry ? normalize(entry.item.type) : [],
                    original: entry ? entry.original.slice() : []
                };
            });
            return { part, garments, naked: isNaked };
        }).filter(row => V?.debug || !row.naked || row.garments.some(g => g.modified));
    }

    function initialize() {
        if (initialized) return;
        if (!setup.clothes || typeof setup.clothes !== "object") {
            console.error(TAG, "setup.clothes 尚未就緒，無法建立初始化快照");
            return;
        }
        snapshot = takeSnapshot();
        initialized = true;
        reconcile(true);
        console.info(TAG, "初始化快照完成");
    }

    // ============================================================
    // 介面：DOM 元件、特質選項與操作結果
    // ============================================================

    function element(tag, className, value) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (value != null) node.textContent = String(value);
        return node;
    }

    function button(value, onClick) {
        const node = element("button", "dol-btn", value);
        node.type = "button";
        node.style.marginRight = "6px";
        node.addEventListener("click", onClick);
        return node;
    }

    function traitOptions(garment) {
        const options = new Map();
        for (const [key, detail] of Object.entries(setup.shopDetails || {})) {
            options.set(key, detail?.name || key);
        }
        for (const type of [...garment.types, ...garment.original]) {
            if (!options.has(type)) options.set(type, type);
        }
        return options;
    }

    // 比較本次操作前後的特質，不累計先前的修改。
    function traitDiff(before, after) {
        const previous = new Set(normalize(before));
        const current = new Set(normalize(after));
        return {
            added: [...current].filter(type => !previous.has(type)),
            removed: [...previous].filter(type => !current.has(type))
        };
    }

    function traitDisplayName(type) {
        const name = setup.shopDetails?.[type]?.name;
        return typeof name === "string" && name.trim() ? name : type;
    }

    function appendStatus(container, status) {
        if (!status) return;
        const heading = element("div", null, status.title);
        heading.style.cssText = "font-weight:bold;margin-bottom:4px";
        container.append(heading);
        const lines = status.lines || [];
        if (!lines.length) {
            container.append(element("div", null, "未產生任何變更"));
            return;
        }
        for (const line of lines) {
            const row = element("div");
            row.style.cssText = "margin:3px 0;overflow-wrap:anywhere";
            if (line.label) {
                const label = element("strong", null, `${line.label}：`);
                label.style.color = "#e9bc69";
                row.append(label);
            }
            const fragments = [
                [line.added, "＋", "#74d99a"],
                [line.removed, "－", "#f18b8b"]
            ];
            for (const [types, prefix, color] of fragments) {
                if (!types?.length) continue;
                const part = element("span", null, `${prefix}${types.map(traitDisplayName).join("、")}`);
                part.style.color = color;
                part.style.marginRight = "10px";
                row.append(part);
            }
            container.append(row);
        }
    }

    // ============================================================
    // 介面：服裝清單、特質編輯與操作控制
    // ============================================================

    function renderUI(host, state = { part: null, garment: null }) {
        // 重新繪製介面時保留清單的捲動位置。
        const previousViewport = host.querySelector(".ce-cloth-trait-slot-viewport");
        const previousScrollTop = previousViewport?.scrollTop ?? 0;
        host.replaceChildren();
        const root = element("div", "dol-settings dol-shadow");
        root.style.cssText = "max-width:100%;min-width:0;box-sizing:border-box";
        const header = element("div", "dol-header");
        header.append(element("span", "dol-title", "服裝類型管理 Plus"));
        const body = element("div", "dol-body");
        body.style.cssText = "min-width:0;max-width:100%;box-sizing:border-box";
        body.append(element("div", "dol-desc", "自由調整每件服裝的特質，換下或重新穿上後，修改仍會保留。"));

        // 提供舊版穿著特質管理入口。
        const legacyEntry = element("div", "dol-desc");
        legacyEntry.style.cssText = "margin:4px 0 10px;font-size:0.9em;opacity:0.8;overflow-wrap:anywhere";
        legacyEntry.append(document.createTextNode("只想暫時調整目前身上穿著的特質？ "));
        const legacyLink = element("a", null, "穿著特質管理（舊版）");
        legacyLink.href = "#";
        legacyLink.style.cssText = "cursor:pointer;text-decoration:underline;text-underline-offset:2px";
        legacyLink.title = "暫時調整目前穿著的特質，也可以儲存和套用預設。";
        legacyLink.addEventListener("click", event => {
            event.preventDefault();
            if (typeof window.CE_renderSettings === "function") {
                window.CE_renderSettings("<<clothTypeManager>>");
            } else {
                console.warn(TAG, "CE_renderSettings 不可用，無法開啟舊版管理介面");
            }
        });
        legacyEntry.append(legacyLink);
        body.append(legacyEntry);
        root.append(header, body);
        host.append(root);

        if (!initialized) {
            body.append(element("div", "red", "服裝資料尚未初始化，請進入遊戲後重新開啟介面。"));
            return;
        }

        let parts;
        try { parts = listParts(); }
        catch (error) {
            body.append(element("div", "red", error.message));
            return;
        }

        const notice = element("div");
        notice.style.margin = "8px 0";
        body.append(notice);
        const message = (value, error = false) => {
            state.status = null;
            notice.textContent = value;
            notice.style.color = error ? "#f88" : "#8f8";
        };
        const statusPanel = element("div", "dol-section-block");
        statusPanel.style.cssText = "margin:8px 0;padding:8px;min-width:0;max-width:100%;box-sizing:border-box";
        if (state.status) {
            appendStatus(statusPanel, state.status);
            body.append(statusPanel);
        }

        // 所有服裝部位及展開內容共用同一個捲動區域。
        const slotViewport = element("div", "ce-cloth-trait-slot-viewport");
        slotViewport.style.cssText = "max-height:min(60vh,480px);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;min-width:0;max-width:100%;box-sizing:border-box;padding-right:4px";
        body.append(slotViewport);

        // 每次僅展開一個服裝部位及其中一件服裝。
        // 展開狀態只保留於目前介面，不寫入存檔。
        for (const row of parts) {
            const section = element("div", "dol-section-block");
            section.style.cssText = "min-width:0;max-width:100%;box-sizing:border-box;overflow-wrap:anywhere";
            const slotOpen = state.part === row.part;
            const slotButton = button(`${slotOpen ? "▾" : "▸"} ${row.part} (${row.garments.length})`, () => {
                if (state.part === row.part) {
                    state.part = null;
                    state.garment = null;
                } else {
                    state.part = row.part;
                    state.garment = null;
                }
                renderUI(host, state);
            });
            slotButton.style.cssText = "display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box;text-align:left;font-weight:bold;margin:0;white-space:normal;overflow-wrap:anywhere";
            slotButton.setAttribute("aria-expanded", String(slotOpen));
            section.append(slotButton);

            if (slotOpen) {
                if (!row.garments.length) {
                    section.append(element("div", "dol-desc", "目前沒有可編輯的服裝"));
                }
                for (const garment of row.garments) {
                    const item = element("div");
                    item.style.cssText = "min-width:0;max-width:100%;box-sizing:border-box;padding:6px 0 6px 12px;border-top:1px solid rgba(255,255,255,.15);overflow-wrap:anywhere";
                    const garmentOpen = state.garment === garment.name;
                    const garmentButton = button("", () => {
                        state.garment = garmentOpen ? null : garment.name;
                        renderUI(host, state);
                    });

                    // 服裝名稱與狀態分開顯示，以便套用不同顏色。
                    garmentButton.append(document.createTextNode(`${garmentOpen ? "▾" : "▸"} ${garment.label} `));
                    const wornStatus = element("span", null, garment.worn ? "[穿著中]" : "[未穿著]");
                    wornStatus.style.color = garment.worn ? "#74d99a" : "#aab4c0";
                    garmentButton.append(wornStatus);
                    if (garment.modified) {
                        const editedStatus = element("span", null, " [已編輯]");
                        editedStatus.style.color = "#e9bc69";
                        garmentButton.append(editedStatus);
                    }
                    garmentButton.style.cssText = "display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box;text-align:left;margin:0;white-space:normal;overflow-wrap:anywhere";
                    garmentButton.setAttribute("aria-expanded", String(garmentOpen));
                    item.append(garmentButton);

                    if (!garmentOpen) {
                        section.append(item);
                        continue;
                    }
                    if (garment.missing) {
                        item.append(element("div", "red", "目前服裝資料庫找不到此服裝，無法編輯或還原。"));
                        section.append(item);
                        continue;
                    }

                    const editor = element("div");
                    editor.style.cssText = "min-width:0;max-width:100%;box-sizing:border-box;padding:8px 0 4px 8px;overflow-wrap:anywhere";
                    const selected = new Set(garment.types);
                    const choices = element("div");
                    choices.style.margin = "6px 0";
                    for (const [trait, labelText] of traitOptions(garment)) {
                        const label = element("label");
                        label.style.cssText = "display:inline-block;margin:0 9px 6px 0;font-size:.85rem";
                        const checkbox = element("input");
                        checkbox.type = "checkbox";
                        checkbox.checked = selected.has(trait);
                        checkbox.addEventListener("change", () => {
                            if (checkbox.checked) selected.add(trait);
                            else selected.delete(trait);
                        });
                        label.append(checkbox, document.createTextNode(" " + labelText));
                        choices.append(label);
                    }
                    editor.append(choices);

                    editor.append(button("套用", () => {
                        try {
                            const before = garment.types.slice();
                            const after = edit(garment.part, garment.name, [...selected]);
                            const changes = traitDiff(before, after);
                            state.status = {
                                title: `套用結果：${garment.label}`,
                                lines: changes.added.length || changes.removed.length
                                    ? [{ added: changes.added, removed: changes.removed }] : []
                            };
                            renderUI(host, state);
                        } catch (error) { message(error.message, true); }
                    }));
                    editor.append(button("還原", () => {
                        try {
                            const before = garment.types.slice();
                            const after = restore(garment.part, garment.name);
                            const changes = traitDiff(before, after);
                            state.status = {
                                title: `還原結果：${garment.label}`,
                                lines: changes.added.length || changes.removed.length
                                    ? [{ added: changes.added, removed: changes.removed }] : []
                            };
                            renderUI(host, state);
                        }
                        catch (error) { message(error.message, true); }
                    }));
                    item.append(editor);
                    section.append(item);
                }
            }
            slotViewport.append(section);
        }

        const footer = element("div", "dol-section-block");
        footer.append(button("還原全部已修改服裝", () => {
            if (!window.confirm("確定還原目前存檔中全部服裝特質修改？")) return;
            try {
                const before = [];
                for (const [part, group] of Object.entries(readDb())) {
                    if (!group || typeof group !== "object") continue;
                    for (const [name, rec] of Object.entries(group)) {
                        if (!validRecord(rec) || rec.name !== name) continue;
                        const entry = getEntry(part, name);
                        if (!entry) continue;
                        before.push({
                            part, name,
                            label: `${part} / ${entry.item.cn_name_cap || entry.item.cn_name || name}`,
                            types: normalize(entry.item.type)
                        });
                    }
                }
                restoreAll();
                const lines = [];
                for (const item of before) {
                    const entry = getEntry(item.part, item.name);
                    if (!entry) continue;
                    const changes = traitDiff(item.types, entry.item.type);
                    if (changes.added.length || changes.removed.length) {
                        lines.push({ label: item.label, ...changes });
                    }
                }
                state.status = { title: "全部還原結果", lines };
                renderUI(host, state);
            }
            catch (error) { message(error.message, true); }
        }));
        body.append(footer);

        // 重新繪製後恢復捲動位置；內容縮短時由瀏覽器自動限制範圍。
        slotViewport.scrollTop = previousScrollTop;
    }

    // ============================================================
    // Macro 註冊與遊戲生命週期
    // ============================================================

    Macro.add(MACRO, {
        handler() {
            const host = element("div", "ce-cloth-trait-editor");
            this.output.append(host);
            renderUI(host);
        }
    });

    setup.CEClothTraitEditor = Object.freeze({
        edit, restore, restoreAll,
        refresh: () => reconcile(true)
    });

    $(document).one(":passageinit", initialize);
    $(document).on(":passageinit", () => {
        if (initialized) reconcile();
    });
})();
