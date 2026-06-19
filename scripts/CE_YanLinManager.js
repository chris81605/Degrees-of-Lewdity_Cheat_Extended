/*==============================
CE Yanling Pro
==============================*/

(function () {

    "use strict";

    const VERSION = 1;

    const COLORS = {
        info: "#66aaff",
        success: "#6cc04a",
        warn: "#e0b84f",
        danger: "#ff6666",
        muted: "gray"
    };

    function uid() {

        return "yl_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);

    }

    function text(value) {

        return value == null ? "" : String(value);

    }

    function legacySignature() {

        return JSON.stringify({
            code: Array.isArray(V.cccheat) ? V.cccheat : [],
            name: Array.isArray(V.cccheat_name) ? V.cccheat_name : []
        });

    }

    function ensureLegacyArrays() {

        if (!Array.isArray(V.cccheat)) {
            V.cccheat = [];
        }

        if (!Array.isArray(V.cccheat_name)) {
            V.cccheat_name = [];
        }

        if (V.swich_yanling === undefined) {
            V.swich_yanling = 0;
        }

        if (V.CE_YL_simple_open === undefined) {
            V.CE_YL_simple_open = false;
        }

    }

    function makeUniqueName(name, ignoreId) {

        const db = Array.isArray(V.cccheat_db) ? V.cccheat_db : [];

        const base = text(name).trim() || "言靈";
        let result = base;
        let n = 1;

        while (db.some(item => item && item.id !== ignoreId && item.name === result)) {
            result = base + "-" + n;
            n++;
        }

        return result;

    }

    function getLegacyName(index) {

        const name = text(V.cccheat_name?.[index]).trim();

        return name || ("外部言靈NO." + (index + 1));

    }

    function validateWiki(code) {

        const result = {
            ok: true,
            error: ""
        };

        try {
            const frag = document.createDocumentFragment();
            new Wikifier(frag, text(code));
        }
        catch (e) {
            result.ok = false;
            result.error = e?.message || String(e);
        }

        return result;

    }

    function normalizeDbItem(item, index) {

        const code = text(item.code);
        const check = validateWiki(code);

        return {
            id: item.id || uid(),
            name: makeUniqueName(item.name || ("言靈NO." + (index + 1)), item.id),
            code,
            tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
            source: item.source || "db",
            enabled: item.enabled !== false,
            valid: check.ok,
            lastError: check.error,
            createdAt: item.createdAt || Date.now(),
            updatedAt: item.updatedAt || Date.now()
        };

    }

    // =====================
    // Legacy Sync
    // =====================

    function syncToLegacy() {

        if (!Array.isArray(V.cccheat_db)) {
            V.cccheat_db = [];
        }

        V.cccheat_db = V.cccheat_db
            .filter(item => item && text(item.code).trim())
            .map(normalizeDbItem);

        V.cccheat = [];
        V.cccheat_name = [];

        for (const item of V.cccheat_db) {
            V.cccheat.push(text(item.code));
            V.cccheat_name.push(text(item.name));
        }

        V.cccheat_db_version = VERSION;
        V.cccheat_legacy_signature = legacySignature();

    }

    function rebuildFromLegacy() {

        ensureLegacyArrays();

        V.cccheat_db = [];

        for (let i = 0; i < V.cccheat.length; i++) {
            const code = text(V.cccheat[i]);

            if (!code.trim()) {
                continue;
            }

            const check = validateWiki(code);

            V.cccheat_db.push({
                id: uid(),
                name: makeUniqueName(getLegacyName(i)),
                code,
                tags: [],
                source: "legacy",
                enabled: true,
                valid: check.ok,
                lastError: check.error,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }

        syncToLegacy();

    }

    function mergeFromLegacy() {

        ensureLegacyArrays();

        if (!Array.isArray(V.cccheat_db)) {
            V.cccheat_db = [];
        }

        for (let i = 0; i < V.cccheat.length; i++) {
            const code = text(V.cccheat[i]);

            if (!code.trim()) {
                continue;
            }

            const exists = V.cccheat_db.some(item => item && text(item.code) === code);

            if (!exists) {
                const check = validateWiki(code);

                V.cccheat_db.push({
                    id: uid(),
                    name: makeUniqueName(getLegacyName(i)),
                    code,
                    tags: ["legacy"],
                    source: "legacy",
                    enabled: true,
                    valid: check.ok,
                    lastError: check.error,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            }
        }

        syncToLegacy();

    }

    function init() {

        ensureLegacyArrays();

        if (!Array.isArray(V.cccheat_db)) {
            rebuildFromLegacy();
            return;
        }

        if (V.cccheat_legacy_signature !== legacySignature()) {
            mergeFromLegacy();
            return;
        }

        syncToLegacy();

    }

    // =====================
    // Manager
    // =====================

    setup.CE_YanlingManager = {

        init,
        syncToLegacy,
        rebuildFromLegacy,
        validateWiki,

        getAll() {

            init();
            return V.cccheat_db;

        },

        getById(id) {

            const db = Array.isArray(V.cccheat_db) ? V.cccheat_db : [];
            return db.find(item => item.id === id) || null;

        },

        add(code, name) {

            init();

            code = text(code);

            if (!code.trim()) {
                alert("新增失敗：言靈內容不能為空。");
                return null;
            }

            const check = validateWiki(code);
            const db = V.cccheat_db;

            const item = {
                id: uid(),
                name: makeUniqueName(text(name).trim() || ("言靈NO." + (db.length + 1))),
                code,
                tags: [],
                source: "ce",
                enabled: true,
                valid: check.ok,
                lastError: check.error,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            db.push(item);
            syncToLegacy();

            if (!check.ok) {
                alert("言靈已保存，但語法可能有錯：\n\n" + check.error);
            }

            return item;

        },

        update(id, data) {

            const db = Array.isArray(V.cccheat_db) ? V.cccheat_db : [];
            const item = db.find(x => x.id === id);

            if (!item) {
                alert("保存失敗：找不到正在編輯的言靈。");
                return false;
            }

            if (data.code !== undefined) {
                const code = text(data.code);

                if (!code.trim()) {
                    alert("保存失敗：言靈內容不能為空。");
                    return false;
                }

                const check = validateWiki(code);

                item.code = code;
                item.valid = check.ok;
                item.lastError = check.error;

                if (!check.ok) {
                    alert("言靈已保存，但語法可能有錯：\n\n" + check.error);
                }
            }

            if (data.name !== undefined) {
                item.name = makeUniqueName(text(data.name).trim() || item.name, id);
            }

            item.updatedAt = Date.now();

            syncToLegacy();

            return true;

        },

        remove(id) {

            init();

            const db = V.cccheat_db;
            const index = db.findIndex(item => item.id === id);

            if (index < 0) {
                return false;
            }

            db.splice(index, 1);
            syncToLegacy();

            return true;

        },

        move(from, to) {

            init();

            const db = V.cccheat_db;

            from = Number(from);
            to = Number(to);

            if (!Number.isInteger(from) || !Number.isInteger(to)) {
                return false;
            }

            if (from < 0 || to < 0 || from >= db.length || to >= db.length) {
                return false;
            }

            if (from === to) {
                return true;
            }

            const item = db.splice(from, 1)[0];

            db.splice(to, 0, item);
            syncToLegacy();

            return true;

        },

        search(keyword) {

            init();

            keyword = text(keyword).toLowerCase().trim();

            if (!keyword) {
                return V.cccheat_db;
            }

            return V.cccheat_db.filter(item => {
                return (
                    text(item.name).toLowerCase().includes(keyword) ||
                    text(item.code).toLowerCase().includes(keyword)
                );
            });

        }

    };

    // =====================
    // UI Helper
    // =====================

    setup.CE_YanlingUIHelper = {

        injectStyle() {

            if (document.getElementById("CE_YL_STYLE")) {
                return;
            }

            const style = document.createElement("style");

            style.id = "CE_YL_STYLE";
            style.textContent = `
.CE-YL-list {
    max-height: 420px;
    overflow-y: auto;
    padding-right: 0.25em;
    -webkit-overflow-scrolling: touch;
}

.CE-YL-simple-list {
    max-height: 260px;
    overflow-y: auto;
    padding-right: 0.25em;
    -webkit-overflow-scrolling: touch;
}

.CE-YL-card,
.CE-YL-simple-item {
    margin: 0.6em 0;
    padding: 0.6em;
    border: 1px solid #666;
    border-radius: 0.4em;
    background: rgba(255, 255, 255, 0.03);
    word-break: break-word;
}

.CE-YL-card-active {
    border-color: gold;
    background: rgba(255, 215, 0, 0.12);
}

.CE-YL-wiki,
.CE-YL-simple-wiki {
    max-height: 180px;
    overflow-y: auto;
    padding: 0.5em;
    border-left: 3px solid #777;
    background: rgba(0, 0, 0, 0.12);
    word-break: break-word;
    white-space: normal;
    -webkit-overflow-scrolling: touch;
}

.CE-YL-error {
    color: #ff6666;
    border-left-color: #ff6666;
}

.CE-YL-toolbar {
    display: flex;
    gap: 0.5em;
    flex-wrap: wrap;
    align-items: center;
}

.CE-YL-search,
.CE-YL-simple-search {
    width: 100%;
    box-sizing: border-box;
}

.CE-YL-actions,
.CE-YL-editor-buttons {
    margin-top: 0.55em;
    display: flex;
    gap: 0.35em;
    flex-wrap: wrap;
}

.CE-YL-card-title {
    display: flex;
    justify-content: space-between;
    gap: 0.5em;
    align-items: center;
    margin-bottom: 0.45em;
}

.CE-YL-card-name {
    font-weight: bold;
    word-break: break-word;
}

.CE-YL-index,
.CE-YL-count,
.CE-YL-muted {
    opacity: 0.75;
    font-size: 0.9em;
}

.CE-YL-editor-grid {
    display: grid;
    gap: 0.55em;
}

.CE-YL-raw-code {
    white-space: pre-wrap;
    word-break: break-word;
    font-family: monospace;
    font-size: 0.9em;
}
`;

            document.head.appendChild(style);

        },

        createEl(tag, className, textContent) {

            const el = document.createElement(tag);

            if (className) {
                el.className = className;
            }

            if (textContent !== undefined) {
                el.textContent = textContent;
            }

            return el;

        },

        createButton(label, onClick, type = "normal") {

            const btn = document.createElement("span");

            btn.className = "dol-btn";
            btn.textContent = label;
            btn.onclick = onClick;

            Object.assign(btn.style, {
                marginRight: "6px",
                marginBottom: "4px",
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
            else if (type === "info") {
                btn.style.color = COLORS.info;
            }

            return btn;

        },

        createDetails(title, open) {

            const details = document.createElement("details");
            const summary = document.createElement("summary");
            const titleSpan = document.createElement("span");

            details.className = "settingsToggleItem";
            details.open = !!open;

            titleSpan.className = "gold";
            titleSpan.textContent = title;

            summary.appendChild(titleSpan);
            details.appendChild(summary);

            return details;

        },

        renderWiki(box, item) {

            const code = text(item?.code ?? item);

            if (item && item.valid === false) {
                box.classList.add("CE-YL-error");

                const msg = this.createEl("div", "red", "[語法錯誤，未執行]");
                const raw = this.createEl("div", "CE-YL-raw-code", code);

                box.replaceChildren(msg, raw);
                return;
            }

            try {
                $(box).empty().wiki(code);

                if (box.querySelector(".error")) {
                    box.classList.add("CE-YL-error");
                }
            }
            catch (e) {
                console.error("[CE Yanling] 言靈渲染失敗：", e);
                box.classList.add("CE-YL-error");
                box.textContent = "[言靈渲染失敗] " + (e?.message || String(e));
            }

        },

        refreshLeftUI() {

            // 調用CEstatebox對外刷新函數
            setup.CE_StateboxManager?.refresh?.();

        }

    };

    // =====================
    // Manager UI
    // =====================

    setup.CE_YanlingUI = {

        selectedId: null,
        keyword: "",

        render(root) {

            const H = setup.CE_YanlingUIHelper;
            const M = setup.CE_YanlingManager;

            H.injectStyle();
            M.init();

            const all = M.getAll();
            const list = this.keyword.trim() ? M.search(this.keyword) : all;
            const selected = this.selectedId ? M.getById(this.selectedId) : null;

            root.replaceChildren();

            const header = H.createEl("div", "dol-header");
            header.appendChild(H.createEl("span", "dol-title gold", "言靈集 Pro"));
            root.appendChild(header);

            const body = H.createEl("div", "dol-body");

            const desc = H.createEl("div", "dol-desc");
            desc.append("管理、搜尋、排序與顯示言靈。");
            desc.appendChild(document.createElement("br"));
            desc.appendChild(H.createEl("span", "red", "注意：語法錯誤的言靈會被保存，但列表中不會執行。"));

            body.appendChild(desc);
            body.appendChild(document.createElement("br"));

            const toolbar = H.createEl("div", "dol-section CE-YL-toolbar");
            const search = document.createElement("input");

            search.className = "CE-YL-search";
            search.type = "text";
            search.placeholder = "搜尋言靈名稱或內容";
            search.value = this.keyword;

            search.addEventListener("input", e => {
                this.keyword = e.target.value;
                this.render(root);
            });

            toolbar.appendChild(search);

            toolbar.appendChild(H.createButton(
                V.swich_yanling === 1 ? "關閉側邊言靈" : "開啟側邊言靈",
                () => {
                    V.swich_yanling = V.swich_yanling === 1 ? 0 : 1;
                    this.render(root);
                    H.refreshLeftUI();
                },
                V.swich_yanling === 1 ? "success" : "warn"
            ));

            body.appendChild(toolbar);
            body.appendChild(document.createElement("br"));

            const listDetails = H.createDetails("言靈列表", true);

            listDetails.querySelector("summary").appendChild(
                H.createEl("span", "CE-YL-count", ` (${list.length}/${all.length})`)
            );

            const listBox = H.createEl("div", "CE-YL-list");

            for (const item of list) {
                const realIndex = all.findIndex(x => x.id === item.id);
                const card = H.createEl(
                    "div",
                    "CE-YL-card" + (item.id === this.selectedId ? " CE-YL-card-active" : "")
                );

                const title = H.createEl("div", "CE-YL-card-title");
                const name = H.createEl("div", "CE-YL-card-name");

                name.appendChild(H.createEl("span", "CE-YL-index", (realIndex + 1) + ". "));
                name.appendChild(H.createEl("span", item.valid === false ? "red" : "gold", item.name));

                title.appendChild(name);

                title.appendChild(H.createButton("編輯", () => {
                    this.selectedId = item.id;
                    this.render(root);
                }, "info"));

                card.appendChild(title);

                const wikiBox = H.createEl("div", "CE-YL-wiki");

                H.renderWiki(wikiBox, item);
                card.appendChild(wikiBox);

                if (item.valid === false && item.lastError) {
                    card.appendChild(H.createEl("div", "red", "語法錯誤：" + item.lastError));
                }

                const actions = H.createEl("div", "CE-YL-actions");

                actions.appendChild(H.createButton("置頂", () => {
                    if (realIndex > 0) {
                        M.move(realIndex, 0);
                        this.render(root);
                        H.refreshLeftUI();
                    }
                }));

                actions.appendChild(H.createButton("上移", () => {
                    if (realIndex > 0) {
                        M.move(realIndex, realIndex - 1);
                        this.render(root);
                        H.refreshLeftUI();
                    }
                }));

                actions.appendChild(H.createButton("下移", () => {
                    if (realIndex < M.getAll().length - 1) {
                        M.move(realIndex, realIndex + 1);
                        this.render(root);
                        H.refreshLeftUI();
                    }
                }));

                actions.appendChild(H.createButton("置底", () => {
                    const last = M.getAll().length - 1;

                    if (realIndex < last) {
                        M.move(realIndex, last);
                        this.render(root);
                        H.refreshLeftUI();
                    }
                }));

                actions.appendChild(H.createButton("刪除", () => {
                    if (!confirm("確定刪除此言靈？")) {
                        return;
                    }

                    M.remove(item.id);

                    if (this.selectedId === item.id) {
                        this.selectedId = null;
                    }

                    this.render(root);
                    H.refreshLeftUI();
                }, "danger"));

                card.appendChild(actions);
                listBox.appendChild(card);
            }

            listDetails.appendChild(listBox);
            body.appendChild(listDetails);
            body.appendChild(document.createElement("br"));

            const editorDetails = H.createDetails(selected ? "編輯言靈" : "新增言靈", !!selected);
            const editor = H.createEl("div", "dol-section CE-YL-editor-grid");

            const nameInput = document.createElement("input");

            nameInput.type = "text";
            nameInput.value = selected?.name ?? "";
            nameInput.style.width = "100%";
            nameInput.style.boxSizing = "border-box";

            const codeInput = document.createElement("textarea");

            codeInput.rows = 12;
            codeInput.value = selected?.code ?? "";
            codeInput.style.width = "100%";
            codeInput.style.boxSizing = "border-box";

            editor.appendChild(H.createEl("span", "gold", "言靈名稱"));
            editor.appendChild(nameInput);
            editor.appendChild(H.createEl("span", "gold", "言靈內容"));
            editor.appendChild(codeInput);

            const buttons = H.createEl("div", "CE-YL-editor-buttons");

            buttons.appendChild(H.createButton("新增", () => {
                const item = M.add(codeInput.value, nameInput.value);

                if (item) {
                    this.selectedId = item.id;
                    this.render(root);
                    H.refreshLeftUI();
                }
            }, "success"));

            buttons.appendChild(H.createButton("保存修改", () => {
                if (!this.selectedId) {
                    return;
                }

                const ok = M.update(this.selectedId, {
                    name: nameInput.value,
                    code: codeInput.value
                });

                if (ok) {
                    this.render(root);
                    H.refreshLeftUI();
                }
            }, "success"));

            buttons.appendChild(H.createButton("清空 / 取消編輯", () => {
                this.selectedId = null;
                this.render(root);
            }, "warn"));

            editor.appendChild(buttons);
            editorDetails.appendChild(editor);
            body.appendChild(editorDetails);
            body.appendChild(document.createElement("br"));

            const devDetails = H.createDetails("開發者工具", false);
            const devBox = H.createEl("div", "dol-section");

            devBox.appendChild(
                H.createEl("div", "dol-desc", "通常不需要使用。重建會用 V.cccheat / V.cccheat_name 重新建立 cccheat_db。")
            );
            devBox.appendChild(document.createElement("br"));

            devBox.appendChild(H.createButton("重建資料庫", () => {
                if (!confirm("確定重建資料庫？")) {
                    return;
                }

                M.rebuildFromLegacy();
                this.selectedId = null;
                this.render(root);
                H.refreshLeftUI();
            }, "warn"));

            devDetails.appendChild(devBox);
            body.appendChild(devDetails);

            root.appendChild(body);

        }

    };

    // =====================
    // Simple Use UI
    // =====================

    setup.CE_YanlingSimpleUI = {

        keyword: "",

        render(root) {

            if (V.swich_yanling !== 1) {
                root.replaceChildren();
                return;
            }

            const H = setup.CE_YanlingUIHelper;
            const M = setup.CE_YanlingManager;

            H.injectStyle();
            M.init();

            const list = this.keyword.trim() ? M.search(this.keyword) : M.getAll();

            root.replaceChildren();

            const wrap = H.createEl("div", "dol-settings dol-shadow");

            const details = document.createElement("details");
            const summary = document.createElement("summary");
            const title = H.createEl("span", "gold", "言靈集");

            details.className = "settingsToggleItem";
            details.open = !!V.CE_YL_simple_open;

            details.addEventListener("toggle", () => {
                V.CE_YL_simple_open = details.open;
            });

            summary.appendChild(title);
            details.appendChild(summary);

            const body = H.createEl("div", "dol-body");

            const search = document.createElement("input");

            search.className = "CE-YL-simple-search";
            search.type = "text";
            search.placeholder = "搜尋言靈";
            search.value = this.keyword;

            search.addEventListener("input", e => {
                this.keyword = e.target.value;
                this.render(root);
            });

            body.appendChild(search);
            body.appendChild(document.createElement("br"));
            body.appendChild(document.createElement("br"));

            const listBox = H.createEl("div", "CE-YL-simple-list");

            for (const item of list) {
                const box = H.createEl("div", "CE-YL-simple-item");
                const wiki = H.createEl("div", "CE-YL-simple-wiki");

                H.renderWiki(wiki, item);

                box.appendChild(wiki);

                if (item.valid === false && item.lastError) {
                    box.appendChild(H.createEl("div", "red", "語法錯誤：" + item.lastError));
                }

                listBox.appendChild(box);
            }

            if (list.length === 0) {
                listBox.appendChild(H.createEl("div", "CE-YL-muted", "沒有可顯示的言靈。"));
            }

            body.appendChild(listBox);
            details.appendChild(body);
            wrap.appendChild(details);
            root.appendChild(wrap);

        }

    };

    // =====================
    // Macro
    // =====================

    Macro.add("CE_YanlingPanel", {

        handler() {

            const root = document.createElement("div");

            root.className = "dol-settings dol-shadow CE-yanling-app";
            this.output.appendChild(root);

            setup.CE_YanlingUI.render(root);

        }

    });

    Macro.add("CE_YanlingSimplePanel", {

        handler() {

            if (V.swich_yanling !== 1) {
                return;
            }

            const root = document.createElement("div");

            this.output.appendChild(root);

            setup.CE_YanlingSimpleUI.render(root);

        }

    });

    $(document).on(":passagestart", function () {

        setup.CE_YanlingManager?.init?.();

    });

})();