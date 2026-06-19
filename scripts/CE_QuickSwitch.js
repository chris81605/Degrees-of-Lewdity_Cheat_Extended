/*==============================
CE Quick Switch
--------------------------------
1. 側邊快捷顯示：<<CE_QuickPanel>>
2. 管理面板：<<CE_QuickPanelSettings>>
3. 開關變數：V.swich
4. 自訂快捷：V.quick_swich_db = ["yanlingId", ...]
5. 言靈來源：V.cccheat_db
==============================*/

;(function () {

    "use strict";

    const COLORS = {
        info: "#66aaff",
        success: "#6cc04a",
        warn: "#e0b84f",
        danger: "#ff6666",
        muted: "gray"
    };

    const DEFAULT_QUICK_ITEMS = [
        {
            code: '[[状态全恢复|$passage][$pain = 0,$arousal = 0,$tiredness = 0,$stress = 0,$trauma = 0,$control = 1000,$drunk = 0,$drugged = 0,$hallucinogen = 0]]'
        },
        {
            code: '[[PC立马高潮|$passage][$semen_amount = $semen_volume,$semen_volume += 1000,$arousal = 10000]]'
        }
    ];

    function text(value) {
        return value == null ? "" : String(value);
    }

    function ensureStore() {

        if (V.swich === undefined) {
            V.swich = 0;
        }

        if (!Array.isArray(V.quick_swich_db)) {
            V.quick_swich_db = [];
        }

        if (!Array.isArray(V.cccheat_db)) {
            V.cccheat_db = [];
        }

        setup.CE_YanlingManager?.init?.();

        V.quick_swich_db = V.quick_swich_db
            .filter(id => typeof id === "string")
            .filter((id, index, arr) => arr.indexOf(id) === index);

    }

    function getYanlingById(id) {
        ensureStore();
        return V.cccheat_db.find(item => item && item.id === id) || null;
    }

    function getQuickItems() {
        ensureStore();

        return V.quick_swich_db
            .map(id => getYanlingById(id))
            .filter(Boolean);
    }

    function hasQuick(id) {
        ensureStore();
        return V.quick_swich_db.includes(id);
    }

    function addQuick(id) {
        ensureStore();

        if (!id || hasQuick(id)) {
            return false;
        }

        V.quick_swich_db.push(id);
        return true;
    }

    function removeQuick(id) {
        ensureStore();

        const index = V.quick_swich_db.indexOf(id);

        if (index < 0) {
            return false;
        }

        V.quick_swich_db.splice(index, 1);
        return true;
    }

    function moveQuick(from, to) {
        ensureStore();

        from = Number(from);
        to = Number(to);

        if (!Number.isInteger(from) || !Number.isInteger(to)) {
            return false;
        }

        if (from < 0 || to < 0 || from >= V.quick_swich_db.length || to >= V.quick_swich_db.length) {
            return false;
        }

        if (from === to) {
            return true;
        }

        const item = V.quick_swich_db.splice(from, 1)[0];

        V.quick_swich_db.splice(to, 0, item);

        return true;
    }

    function refreshLeftUI() {

        // 調用CEstatebox對外刷新函數
        setup.CE_StateboxManager?.refresh?.();

    }

    function createEl(tag, className, textContent) {

        const el = document.createElement(tag);

        if (className) {
            el.className = className;
        }

        if (textContent !== undefined) {
            el.textContent = textContent;
        }

        return el;

    }

    function createButton(label, onClick, type = "normal") {

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

    }

    function createDetails(title, open) {

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

    }

    function injectStyle() {

        if (document.getElementById("CE_QS_STYLE")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "CE_QS_STYLE";
        style.textContent = `
.CE-QS-list {
    max-height: 360px;
    overflow-y: auto;
    padding-right: 0.25em;
    -webkit-overflow-scrolling: touch;
}

.CE-QS-card {
    margin: 0.6em 0;
    padding: 0.6em;
    border: 1px solid #666;
    border-radius: 0.4em;
    background: rgba(255, 255, 255, 0.03);
    word-break: break-word;
}

.CE-QS-actions {
    margin-top: 0.55em;
    display: flex;
    gap: 0.35em;
    flex-wrap: wrap;
}

.CE-QS-toolbar {
    display: flex;
    gap: 0.5em;
    flex-wrap: wrap;
    align-items: center;
}

.CE-QS-search {
    width: 100%;
    box-sizing: border-box;
}

.CE-QS-title {
    font-weight: bold;
    word-break: break-word;
}

.CE-QS-preview {
    max-height: 120px;
    overflow-y: auto;
    padding: 0.45em;
    margin-top: 0.35em;
    border-left: 3px solid #777;
    background: rgba(0, 0, 0, 0.12);
    word-break: break-word;
    white-space: normal;
    -webkit-overflow-scrolling: touch;
}

.CE-QS-muted {
    opacity: 0.75;
    font-size: 0.9em;
}

.CE-QS-quick-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    row-gap: 0.25em;
    column-gap: 0;
}

.CE-QS-quick-cell {
    min-width: 0;
    word-break: break-word;
}

.CE-QS-quick-cell:nth-child(odd) {
    border-right: 1px solid #666;
    padding-right: 0.6em;
    text-align: right;
}

.CE-QS-quick-cell:nth-child(even) {
    padding-left: 0.6em;
    text-align: left;
}

.CE-QS-quick-item {
    display: inline-block;
    margin-bottom: 0.25em;
}

.CE-QS-error {
    color: #ff6666;
}
`;

        document.head.appendChild(style);

    }

    function renderDefaultWiki(parent, code) {

        try {
            $(parent).wiki(code);
        }
        catch (e) {
            console.error("[CE QuickSwitch] 預設快捷渲染失敗：", e);
            parent.classList.add("CE-QS-error");
            parent.textContent = "[預設快捷渲染失敗]";
        }

    }

    function renderWiki(parent, item) {

        const box = createEl("span", "CE-QS-quick-item");

        parent.appendChild(box);

        if (!item) {
            box.classList.add("CE-QS-error");
            box.textContent = "[快捷言靈不存在]";
            return box;
        }

        if (item.valid === false) {
            box.classList.add("CE-QS-error");
            box.textContent = "[語法錯誤，未執行：" + text(item.name || item.id || "未知言靈") + "]";
            return box;
        }

        if (typeof item.code !== "string") {
            box.classList.add("CE-QS-error");
            box.textContent = "[快捷言靈代碼不存在：" + text(item.name || item.id || "未知言靈") + "]";
            return box;
        }

        try {
            $(box).wiki(item.code);
        }
        catch (e) {
            console.error("[CE QuickSwitch] 言靈渲染失敗：", item, e);
            box.classList.add("CE-QS-error");
            box.textContent = "[快捷言靈渲染失敗：" + text(item.name || item.id || "未知言靈") + "]";
        }

        return box;

    }

    function renderCodePreview(parent, item) {

        const box = createEl("div", "CE-QS-preview");

        parent.appendChild(box);

        if (!item) {
            box.textContent = "[言靈不存在]";
            return box;
        }

        if (item.valid === false) {
            box.classList.add("CE-QS-error");
            box.textContent = "[語法錯誤，未執行]\n" + text(item.code);
            return box;
        }

        if (typeof item.code !== "string") {
            box.classList.add("CE-QS-error");
            box.textContent = "[言靈代碼不存在]";
            return box;
        }

        try {
            $(box).wiki(item.code);

            if (box.querySelector(".error")) {
                box.classList.add("CE-QS-error");
            }
        }
        catch (e) {
            console.error("[CE QuickSwitch] 預覽渲染失敗：", item, e);
            box.classList.add("CE-QS-error");
            box.textContent = "[預覽渲染失敗：" + text(item.name || item.id || "未知言靈") + "]";
        }

        return box;

    }

    setup.CE_QuickSwitchManager = {
        ensureStore,
        getQuickItems,
        addQuick,
        removeQuick,
        moveQuick,
        hasQuick
    };

    Macro.add("CE_QuickPanel", {

        handler() {

            injectStyle();
            ensureStore();

            if (V.swich !== 1) {
                return;
            }

            const root = document.createElement("div");

            this.output.appendChild(root);

            root.appendChild(createEl("span", "gold", "快捷"));
            root.appendChild(document.createElement("br"));

            const defaultGrid = createEl("div", "CE-QS-quick-grid");

            DEFAULT_QUICK_ITEMS.forEach(entry => {

                const cell = createEl("div", "CE-QS-quick-cell");

                renderDefaultWiki(cell, entry.code);

                defaultGrid.appendChild(cell);

            });

            root.appendChild(defaultGrid);

            const quickItems = getQuickItems();

            if (quickItems.length > 0) {

                root.appendChild(document.createElement("hr"));

                const customGrid = createEl("div", "CE-QS-quick-grid");

                quickItems.forEach(item => {

                    const cell = createEl("div", "CE-QS-quick-cell");

                    renderWiki(cell, item);

                    customGrid.appendChild(cell);

                });

                root.appendChild(customGrid);

            }

        }

    });

    Macro.add("CE_QuickPanelSettings", {

        handler() {

            injectStyle();
            ensureStore();

            const root = document.createElement("div");

            root.className = "dol-settings dol-shadow";

            this.output.appendChild(root);

            const state = setup.CE_QuickSwitchPanelState ??= {
                keyword: "",
                previewOpen: true,
                quickOpen: true,
                addOpen: false
            };

            if (state.previewOpen === undefined) {
                state.previewOpen = true;
            }

            if (state.quickOpen === undefined) {
                state.quickOpen = true;
            }

            if (state.addOpen === undefined) {
                state.addOpen = false;
            }

            const render = () => {

                ensureStore();

                root.replaceChildren();

                const header = createEl("div", "dol-header");
                header.appendChild(createEl("span", "dol-title gold", "左側快捷"));
                root.appendChild(header);

                const body = createEl("div", "dol-body");

                const desc = createEl("div", "dol-desc", "在左側顯示：一鍵恢復全狀態及 PC 立刻高潮。");
                body.appendChild(desc);
                body.appendChild(document.createElement("br"));

                const switchBox = createEl("div", "dol-section");

                switchBox.appendChild(createButton("左側快捷開關", () => {

                    V.swich = V.swich == 0 ? 1 : 0;

                    render();
                    refreshLeftUI();

                }, V.swich === 1 ? "success" : "warn"));

                switchBox.appendChild(document.createElement("br"));
                switchBox.appendChild(document.createElement("br"));

                const status = createEl("div", "dol-desc");

                status.append("快捷開關：");

                if (V.swich === 0) {
                    status.appendChild(createEl("span", "red", "關"));
                }
                else {
                    status.appendChild(createEl("span", "green", "開"));
                }

                switchBox.appendChild(status);
                body.appendChild(switchBox);
                body.appendChild(document.createElement("br"));

                const previewDetails = createDetails("目前快捷顯示", state.previewOpen);
                previewDetails.addEventListener("toggle", () => {
                    state.previewOpen = previewDetails.open;
                });

                const previewBox = createEl("div", "dol-section");

                try {
                    $(previewBox).wiki("<<CE_QuickPanel>>");
                }
                catch (e) {
                    console.error("[CE QuickSwitch] 快捷預覽失敗：", e);
                    previewBox.textContent = "[快捷預覽失敗]";
                }

                previewDetails.appendChild(previewBox);
                body.appendChild(previewDetails);
                body.appendChild(document.createElement("br"));

                const quickDetails = createDetails("自訂快捷管理", state.quickOpen);
                quickDetails.addEventListener("toggle", () => {
                    state.quickOpen = quickDetails.open;
                });

                const quickBox = createEl("div", "dol-section");

                const quickItems = getQuickItems();

                if (quickItems.length === 0) {
                    quickBox.appendChild(createEl("div", "CE-QS-muted", "尚未加入自訂快捷言靈。"));
                }

                quickItems.forEach((item, index) => {

                    const card = createEl("div", "CE-QS-card");

                    card.appendChild(createEl("div", "CE-QS-title gold", (index + 1) + ". " + text(item.name || item.id || "未知言靈")));
                    renderCodePreview(card, item);

                    const actions = createEl("div", "CE-QS-actions");

                    actions.appendChild(createButton("置頂", () => {
                        if (index > 0) {
                            moveQuick(index, 0);
                            render();
                            refreshLeftUI();
                        }
                    }));

                    actions.appendChild(createButton("上移", () => {
                        if (index > 0) {
                            moveQuick(index, index - 1);
                            render();
                            refreshLeftUI();
                        }
                    }));

                    actions.appendChild(createButton("下移", () => {
                        if (index < V.quick_swich_db.length - 1) {
                            moveQuick(index, index + 1);
                            render();
                            refreshLeftUI();
                        }
                    }));

                    actions.appendChild(createButton("置底", () => {
                        const last = V.quick_swich_db.length - 1;

                        if (index < last) {
                            moveQuick(index, last);
                            render();
                            refreshLeftUI();
                        }
                    }));

                    actions.appendChild(createButton("移除", () => {
                        removeQuick(item.id);
                        render();
                        refreshLeftUI();
                    }, "danger"));

                    card.appendChild(actions);
                    quickBox.appendChild(card);

                });

                quickDetails.appendChild(quickBox);
                body.appendChild(quickDetails);
                body.appendChild(document.createElement("br"));

                const addDetails = createDetails("加入言靈到快捷", state.addOpen);
                addDetails.addEventListener("toggle", () => {
                    state.addOpen = addDetails.open;
                });

                const addBox = createEl("div", "dol-section");

                const search = document.createElement("input");

                search.className = "CE-QS-search";
                search.type = "text";
                search.placeholder = "搜尋言靈名稱或內容";
                search.value = state.keyword;

                search.addEventListener("input", e => {
                    state.keyword = e.target.value;
                    state.addOpen = true;
                    render();
                });

                addBox.appendChild(search);
                addBox.appendChild(document.createElement("br"));
                addBox.appendChild(document.createElement("br"));

                const keyword = text(state.keyword).toLowerCase().trim();

                const yanlings = V.cccheat_db.filter(item => {

                    if (!item) {
                        return false;
                    }

                    if (!keyword) {
                        return true;
                    }

                    return (
                        text(item.name).toLowerCase().includes(keyword) ||
                        text(item.code).toLowerCase().includes(keyword)
                    );

                });

                const listBox = createEl("div", "CE-QS-list");

                if (yanlings.length === 0) {
                    listBox.appendChild(createEl("div", "CE-QS-muted", "沒有找到可加入的言靈。"));
                }

                yanlings.forEach(item => {

                    const card = createEl("div", "CE-QS-card");

                    card.appendChild(createEl("div", item.valid === false ? "CE-QS-title red" : "CE-QS-title gold", text(item.name || item.id || "未知言靈")));

                    if (item.valid === false) {
                        card.appendChild(createEl("div", "red", "語法錯誤，不能作為快捷執行。"));
                    }
                    else {
                        renderCodePreview(card, item);
                    }

                    const actions = createEl("div", "CE-QS-actions");

                    if (hasQuick(item.id)) {
                        actions.appendChild(createEl("span", "CE-QS-muted", "已加入快捷"));
                    }
                    else if (item.valid === false) {
                        actions.appendChild(createEl("span", "CE-QS-muted", "無法加入"));
                    }
                    else {
                        actions.appendChild(createButton("加入快捷", () => {
                            state.addOpen = true;
                            addQuick(item.id);
                            render();
                            refreshLeftUI();
                        }, "success"));
                    }

                    card.appendChild(actions);
                    listBox.appendChild(card);

                });

                addBox.appendChild(listBox);
                addDetails.appendChild(addBox);
                body.appendChild(addDetails);

                root.appendChild(body);

            };

            render();

        }

    });

})();