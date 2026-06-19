/*==============================
CE Teleportation Pro
--------------------------------
1. 新版資料：V.teleportation_db
2. 舊版相容：V.teleportation / V.teleportation_name
3. 側邊顯示開關：V.swich_teleportation
4. 管理 UI：<<CE_TeleportationPanel>>
5. 極簡使用 UI：<<CE_TeleportationSimplePanel>>
==============================*/

(function () {

    "use strict";

    const MAX_CUSTOM_NODES = 3;

    const COLORS = {
        info: "#66aaff",
        success: "#6cc04a",
        warn: "#e0b84f",
        danger: "#ff6666",
        muted: "gray"
    };

    const FORBIDDEN_PASSAGES = [
        "Clothing Shop",
        "Forest Shop",
        "School Library Shop",
        "Adult Shop Store"
    ];

    const MAJOR_AREAS = [
        "Orphanage", "Bedroom", "Barb Street", "Cliff Street", "Connudatus Street", "Danube Street", "Domus Street", "Elk Street",
        "Harvest Street", "High Street", "Mer Street", "Nightingale Street", "Oxford Street", "Starfish Street", "Wolf Street",
        "Residential alleyways", "Commercial alleyways", "Industrial alleyways", "Park", "Hallways", "Brothel", "Strip Club",
        "Beach", "Ocean Breeze", "Docks Work", "Residential Drain", "Commercial Drain", "Industrial Drain", "Forest", "Farmland",
        "Livestock Field", "Moor", "Forest Wolf Cave", "Wolf Cave", "Wolf Cave Clearing", "Asylum", "Asylum Cell", "Underground Cell", "Prison Cell",
        "Lake Shore", "Farm Work", "Meadow"
    ];

    function uid() {

        return "tp_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);

    }

    function text(value) {

        return value == null ? "" : String(value);

    }

    function sanitizeLinkText(value) {

        return text(value)
            .replaceAll("[", "［")
            .replaceAll("]", "］")
            .replaceAll("|", "｜")
            .trim();

    }

    function makeLink(name, passage) {

        return "◁[[" + sanitizeLinkText(name) + "|" + text(passage).trim() + "]]▷";

    }

    function ensureStore() {

        if (V.swich_teleportation === undefined) {
            V.swich_teleportation = 0;
        }

        if (V.CE_TP_simple_open === undefined) {
            V.CE_TP_simple_open = false;
        }

        if (!Array.isArray(V.teleportation)) {
            V.teleportation = [];
        }

        if (!Array.isArray(V.teleportation_name)) {
            V.teleportation_name = [];
        }

        if (!Array.isArray(V.teleportation_db)) {
            V.teleportation_db = [];
        }

    }

    function makeUniqueName(name, ignoreId) {

        const db = Array.isArray(V.teleportation_db) ? V.teleportation_db : [];
        const base = sanitizeLinkText(name) || "節點";
        let result = base;
        let n = 1;

        while (db.some(item => item && item.id !== ignoreId && item.name === result)) {
            result = base + "-" + n;
            n++;
        }

        return result;

    }

    function isSafeToTeleport() {

        if (FORBIDDEN_PASSAGES.includes(V.passage)) {
            return false;
        }

        if (!MAJOR_AREAS.includes(V.passage)) {
            return false;
        }

        if (V.event !== undefined) {
            return false;
        }

        return true;

    }

    function getUnsafeReason() {

        if (FORBIDDEN_PASSAGES.includes(V.passage)) {
            return "在服飾店或商店傳送可能會破壞衣櫃或商店流程，請先離開目前場景。";
        }

        if (V.event !== undefined) {
            return "你目前正在進行事件或活動，請先返回正常地圖區域。";
        }

        if (!MAJOR_AREAS.includes(V.passage)) {
            return "目前位置不在允許的世界範圍內，遠端傳送可能導致 Bug。";
        }

        return "目前無法安全傳送。";

    }

    function normalizeNode(item, index) {

        const name = makeUniqueName(item.name || ("節點NO." + (index + 1)), item.id);
        const passage = text(item.passage || item.target || "").trim();

        return {
            id: item.id || uid(),
            name,
            passage,
            code: makeLink(name, passage),
            createdAt: item.createdAt || Date.now(),
            updatedAt: item.updatedAt || Date.now()
        };

    }

    function syncToLegacy() {

        ensureStore();

        V.teleportation_db = V.teleportation_db
            .filter(item => item && text(item.passage).trim())
            .map(normalizeNode);

        while (V.teleportation_db.length > MAX_CUSTOM_NODES) {
            V.teleportation_db.shift();
        }

        V.teleportation = [];
        V.teleportation_name = [];

        for (const item of V.teleportation_db) {
            V.teleportation.push(item.code);
            V.teleportation_name.push(item.name);
        }

    }

    function rebuildFromLegacy() {

        ensureStore();

        V.teleportation_db = [];

        for (let i = 0; i < V.teleportation.length; i++) {
            const rawCode = text(V.teleportation[i]);
            const rawName = text(V.teleportation_name?.[i]).trim() || ("節點NO." + (i + 1));

            /*
                舊資料只有拼接後的 wiki link，無法 100% 安全反解析。
                如果遇到舊資料，會保留 code 顯示，但 passage 可能無法編輯。
            */
            const match = rawCode.match(/\[\[(.*?)\|(.*?)\]\]/);
            const name = match ? match[1] : rawName;
            const passage = match ? match[2] : "";

            if (!passage) {
                continue;
            }

            V.teleportation_db.push({
                id: uid(),
                name: makeUniqueName(name),
                passage,
                code: makeLink(name, passage),
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }

        syncToLegacy();

    }

    function init() {

        ensureStore();

        if (!Array.isArray(V.teleportation_db) || V.teleportation_db.length === 0 && V.teleportation.length > 0) {
            rebuildFromLegacy();
            return;
        }

        syncToLegacy();

    }

    // =====================
    // Manager
    // =====================

    setup.CE_TeleportationManager = {

        init,
        syncToLegacy,
        rebuildFromLegacy,

        getAll() {

            init();
            return V.teleportation_db;

        },

        getById(id) {

            const db = Array.isArray(V.teleportation_db) ? V.teleportation_db : [];
            return db.find(item => item.id === id) || null;

        },

        canTeleport() {

            return isSafeToTeleport();

        },

        getUnsafeReason,

        addCurrent(name) {

            init();

            if (!isSafeToTeleport()) {
                alert("目前無法設為傳送節點：\n\n" + getUnsafeReason());
                return null;
            }

            const db = V.teleportation_db;
            const finalName = makeUniqueName(text(name).trim() || ("節點NO." + (db.length + 1)));
            const passage = text(V.passage).trim();

            const item = {
                id: uid(),
                name: finalName,
                passage,
                code: makeLink(finalName, passage),
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            db.push(item);

            while (db.length > MAX_CUSTOM_NODES) {
                db.shift();
            }

            syncToLegacy();

            return item;

        },

        update(id, data) {

            init();

            const item = this.getById(id);

            if (!item) {
                alert("保存失敗：找不到正在編輯的傳送節點。");
                return false;
            }

            const name = data.name !== undefined
                ? makeUniqueName(data.name, id)
                : item.name;

            const passage = data.passage !== undefined
                ? text(data.passage).trim()
                : item.passage;

            if (!passage) {
                alert("保存失敗：目標 Passage 不能為空。");
                return false;
            }

            item.name = name;
            item.passage = passage;
            item.code = makeLink(name, passage);
            item.updatedAt = Date.now();

            syncToLegacy();

            return true;

        },

        remove(id) {

            init();

            const db = V.teleportation_db;
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

            const db = V.teleportation_db;

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
                return V.teleportation_db;
            }

            return V.teleportation_db.filter(item => {
                return (
                    text(item.name).toLowerCase().includes(keyword) ||
                    text(item.passage).toLowerCase().includes(keyword)
                );
            });

        }

    };

    // =====================
    // UI Helper
    // =====================

    setup.CE_TeleportationUIHelper = {

        injectStyle() {

            if (document.getElementById("CE_TP_STYLE")) {
                return;
            }

            const style = document.createElement("style");

            style.id = "CE_TP_STYLE";
            style.textContent = `
.CE-TP-list {
    max-height: 420px;
    overflow-y: auto;
    padding-right: 0.25em;
    -webkit-overflow-scrolling: touch;
}

.CE-TP-simple-list {
    max-height: 220px;
    overflow-y: auto;
    padding-right: 0.25em;
    -webkit-overflow-scrolling: touch;
}

.CE-TP-card,
.CE-TP-simple-item {
    margin: 0.6em 0;
    padding: 0.6em;
    border: 1px solid #666;
    border-radius: 0.4em;
    background: rgba(255, 255, 255, 0.03);
    word-break: break-word;
}

.CE-TP-card-active {
    border-color: gold;
    background: rgba(255, 215, 0, 0.12);
}

.CE-TP-linkbox {
    max-height: 120px;
    overflow-y: auto;
    padding: 0.45em;
    border-left: 3px solid #777;
    background: rgba(0, 0, 0, 0.12);
    -webkit-overflow-scrolling: touch;
}

.CE-TP-toolbar {
    display: flex;
    gap: 0.5em;
    flex-wrap: wrap;
    align-items: center;
}

.CE-TP-search,
.CE-TP-simple-search {
    width: 100%;
    box-sizing: border-box;
}

.CE-TP-actions,
.CE-TP-editor-buttons {
    margin-top: 0.55em;
    display: flex;
    gap: 0.35em;
    flex-wrap: wrap;
}

.CE-TP-card-title {
    display: flex;
    justify-content: space-between;
    gap: 0.5em;
    align-items: center;
    margin-bottom: 0.45em;
}

.CE-TP-card-name {
    font-weight: bold;
    word-break: break-word;
}

.CE-TP-index,
.CE-TP-count,
.CE-TP-muted {
    opacity: 0.75;
    font-size: 0.9em;
}

.CE-TP-editor-grid {
    display: grid;
    gap: 0.55em;
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

        renderWikiLink(box, code) {

            try {
                $(box).empty().wiki(code);
            }
            catch (e) {
                console.error("[CE Teleportation] 節點渲染失敗：", e);
                box.textContent = "[節點渲染失敗] " + text(code);
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

    setup.CE_TeleportationUI = {

        selectedId: null,
        keyword: "",

        render(root) {

            const H = setup.CE_TeleportationUIHelper;
            const M = setup.CE_TeleportationManager;

            H.injectStyle();
            M.init();

            const all = M.getAll();
            const list = this.keyword.trim() ? M.search(this.keyword) : all;
            const selected = this.selectedId ? M.getById(this.selectedId) : null;

            root.replaceChildren();

            const header = H.createEl("div", "dol-header");
            header.appendChild(H.createEl("span", "dol-title gold", "空間節點 Pro"));
            root.appendChild(header);

            const body = H.createEl("div", "dol-body");

            const desc = H.createEl("div", "dol-desc");
            desc.append("管理、搜尋、排序與使用傳送節點。");
            desc.appendChild(document.createElement("br"));
            desc.appendChild(H.createEl("span", "red", "建議只加入正常地點。將特殊場景加入傳送點可能造成不可逆問題。"));

            body.appendChild(desc);
            body.appendChild(document.createElement("br"));

            const status = H.createEl("div", "dol-desc");
            status.append("目前狀態：");

            if (M.canTeleport()) {
                status.appendChild(H.createEl("span", "green", "當前可隨意傳送"));
            }
            else {
                status.appendChild(H.createEl("span", "red", "當前無法傳送"));
                status.appendChild(document.createElement("br"));
                status.appendChild(H.createEl("span", "red", M.getUnsafeReason()));
            }

            body.appendChild(status);
            body.appendChild(document.createElement("br"));

            const toolbar = H.createEl("div", "dol-section CE-TP-toolbar");
            const search = document.createElement("input");

            search.className = "CE-TP-search";
            search.type = "text";
            search.placeholder = "搜尋節點名稱或 Passage";
            search.value = this.keyword;

            search.addEventListener("input", e => {
                this.keyword = e.target.value;
                this.render(root);
            });

            toolbar.appendChild(search);

            toolbar.appendChild(H.createButton(
                V.swich_teleportation === 1 ? "關閉側邊空間節點" : "開啟側邊空間節點",
                () => {
                    V.swich_teleportation = V.swich_teleportation === 1 ? 0 : 1;
                    this.render(root);
                    H.refreshLeftUI();
                },
                V.swich_teleportation === 1 ? "success" : "warn"
            ));

            body.appendChild(toolbar);
            body.appendChild(document.createElement("br"));

            const addDetails = H.createDetails("加入目前位置", true);
            const addBox = H.createEl("div", "dol-section CE-TP-editor-grid");

            const addNameInput = document.createElement("input");

            addNameInput.type = "text";
            addNameInput.placeholder = "節點名稱，可留空";
            addNameInput.style.width = "100%";
            addNameInput.style.boxSizing = "border-box";

            addBox.appendChild(H.createEl("span", "gold", "目前 Passage"));
            addBox.appendChild(H.createEl("span", M.canTeleport() ? "green" : "red", text(V.passage)));

            addBox.appendChild(H.createEl("span", "gold", "節點名稱"));
            addBox.appendChild(addNameInput);

            addBox.appendChild(H.createButton("將此設為傳送節點（最多3個）", () => {
                const item = M.addCurrent(addNameInput.value);

                if (item) {
                    this.selectedId = item.id;
                    this.render(root);
                    H.refreshLeftUI();
                }
            }, M.canTeleport() ? "success" : "warn"));

            addDetails.appendChild(addBox);
            body.appendChild(addDetails);
            body.appendChild(document.createElement("br"));

            const listDetails = H.createDetails("自訂傳送節點", true);

            listDetails.querySelector("summary").appendChild(
                H.createEl("span", "CE-TP-count", ` (${list.length}/${MAX_CUSTOM_NODES})`)
            );

            const listBox = H.createEl("div", "CE-TP-list");

            for (const item of list) {
                const realIndex = all.findIndex(x => x.id === item.id);
                const card = H.createEl(
                    "div",
                    "CE-TP-card" + (item.id === this.selectedId ? " CE-TP-card-active" : "")
                );

                const title = H.createEl("div", "CE-TP-card-title");
                const name = H.createEl("div", "CE-TP-card-name");

                name.appendChild(H.createEl("span", "CE-TP-index", (realIndex + 1) + ". "));
                name.appendChild(H.createEl("span", "gold", item.name));

                title.appendChild(name);

                title.appendChild(H.createButton("編輯", () => {
                    this.selectedId = item.id;
                    this.render(root);
                }, "info"));

                card.appendChild(title);

                const linkBox = H.createEl("div", "CE-TP-linkbox");

                H.renderWikiLink(linkBox, item.code);
                card.appendChild(linkBox);

                card.appendChild(H.createEl("div", "CE-TP-muted", "Passage：" + item.passage));

                const actions = H.createEl("div", "CE-TP-actions");

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
                    if (!confirm("確定刪除此傳送節點？")) {
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

            if (list.length === 0) {
                listBox.appendChild(H.createEl("div", "CE-TP-muted", "尚未建立自訂傳送節點。"));
            }

            listDetails.appendChild(listBox);
            body.appendChild(listDetails);
            body.appendChild(document.createElement("br"));

            const editorDetails = H.createDetails(selected ? "編輯傳送節點" : "編輯傳送節點", !!selected);
            const editor = H.createEl("div", "dol-section CE-TP-editor-grid");

            const nameInput = document.createElement("input");
            const passageInput = document.createElement("input");

            nameInput.type = "text";
            nameInput.value = selected?.name ?? "";
            nameInput.style.width = "100%";
            nameInput.style.boxSizing = "border-box";

            passageInput.type = "text";
            passageInput.value = selected?.passage ?? "";
            passageInput.style.width = "100%";
            passageInput.style.boxSizing = "border-box";

            editor.appendChild(H.createEl("span", "gold", "節點名稱"));
            editor.appendChild(nameInput);
            editor.appendChild(H.createEl("span", "gold", "目標 Passage"));
            editor.appendChild(passageInput);
            editor.appendChild(H.createEl("div", "CE-TP-muted", "注意：手動修改 Passage 可能導致傳送到不安全場景。"));

            const editorButtons = H.createEl("div", "CE-TP-editor-buttons");

            editorButtons.appendChild(H.createButton("保存修改", () => {
                if (!this.selectedId) {
                    return;
                }

                const ok = M.update(this.selectedId, {
                    name: nameInput.value,
                    passage: passageInput.value
                });

                if (ok) {
                    this.render(root);
                    H.refreshLeftUI();
                }
            }, "success"));

            editorButtons.appendChild(H.createButton("取消編輯", () => {
                this.selectedId = null;
                this.render(root);
            }, "warn"));

            editor.appendChild(editorButtons);
            editorDetails.appendChild(editor);
            body.appendChild(editorDetails);
            body.appendChild(document.createElement("br"));

            const devDetails = H.createDetails("開發者工具", false);
            const devBox = H.createEl("div", "dol-section");

            devBox.appendChild(H.createEl("div", "dol-desc", "通常不需要使用。重建會嘗試從 V.teleportation / V.teleportation_name 重新建立 teleportation_db。"));
            devBox.appendChild(document.createElement("br"));

            devBox.appendChild(H.createButton("重建資料庫", () => {
                if (!confirm("確定重建傳送節點資料庫？")) {
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

    setup.CE_TeleportationSimpleUI = {

        keyword: "",

        render(root) {

            if (V.swich_teleportation !== 1) {
                root.replaceChildren();
                return;
            }

            const H = setup.CE_TeleportationUIHelper;
            const M = setup.CE_TeleportationManager;

            H.injectStyle();
            M.init();

            root.replaceChildren();

            const wrap = H.createEl("div", "dol-settings dol-shadow");

            const details = document.createElement("details");
            const summary = document.createElement("summary");
            const title = H.createEl("span", "gold", "空間節點");

            details.className = "settingsToggleItem";
            details.open = !!V.CE_TP_simple_open;

            details.addEventListener("toggle", () => {
                V.CE_TP_simple_open = details.open;
            });

            summary.appendChild(title);
            details.appendChild(summary);

            const body = H.createEl("div", "dol-body");

            if (!M.canTeleport()) {
                body.appendChild(H.createEl("span", "red", "當前無法傳送"));
                body.appendChild(document.createElement("br"));
                body.appendChild(H.createEl("span", "red", M.getUnsafeReason()));

                details.appendChild(body);
                wrap.appendChild(details);
                root.appendChild(wrap);
                return;
            }

            const fixedBox = H.createEl("div", "CE-TP-simple-item");
            const bedroom = H.createEl("div", "CE-TP-linkbox");
            const wardrobe = H.createEl("div", "CE-TP-linkbox");

            H.renderWikiLink(bedroom, "◁[[回孤兒院臥室|Bedroom]]▷");
            H.renderWikiLink(wardrobe, "◁[[隨身衣櫃|CE_Wardrobe]]▷");

            fixedBox.appendChild(bedroom);
            fixedBox.appendChild(wardrobe);
            body.appendChild(fixedBox);

            const search = document.createElement("input");

            search.className = "CE-TP-simple-search";
            search.type = "text";
            search.placeholder = "搜尋節點";
            search.value = this.keyword;

            search.addEventListener("input", e => {
                this.keyword = e.target.value;
                this.render(root);
            });

            body.appendChild(search);
            body.appendChild(document.createElement("br"));
            body.appendChild(document.createElement("br"));

            const list = this.keyword.trim() ? M.search(this.keyword) : M.getAll();
            const listBox = H.createEl("div", "CE-TP-simple-list");

            for (const item of list) {
                const box = H.createEl("div", "CE-TP-simple-item");
                const linkBox = H.createEl("div", "CE-TP-linkbox");

                H.renderWikiLink(linkBox, item.code);
                box.appendChild(linkBox);
                listBox.appendChild(box);
            }

            if (list.length === 0) {
                listBox.appendChild(H.createEl("div", "CE-TP-muted", "尚未建立自訂傳送節點。"));
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

    Macro.add("CE_TeleportationPanel", {

        handler() {

            const root = document.createElement("div");

            root.className = "dol-settings dol-shadow CE-teleportation-app";
            this.output.appendChild(root);

            setup.CE_TeleportationUI.render(root);

        }

    });

    Macro.add("CE_TeleportationSimplePanel", {

        handler() {

            if (V.swich_teleportation !== 1) {
                return;
            }

            const root = document.createElement("div");

            this.output.appendChild(root);

            setup.CE_TeleportationSimpleUI.render(root);

        }

    });

    $(document).on(":passagestart", function () {

        setup.CE_TeleportationManager?.init?.();

    });

})();
