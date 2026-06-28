/* ==============================
 * CE Inventory Helper
 * Full DOM API Version
 *
 * 兼容：
 * - 新版：setup.foodstuff + $foodstuff，分類欄位 category
 * - 舊版：setup.plants + $plants，分類欄位 type
 * ============================== */

(function () {
    "use strict";

    setup.CE_foodCompat = {
        getDbInfo() {
            
            /*
            * 注意：
            * maplebirch 框架在舊版遊戲也可能預先建立空的 setup.foodstuff。
            * 因此不能只判斷是否存在，必須確認資料庫內至少有一筆
            * 合法物品（category/type）後才能判定遊戲版本。
            */
            function hasValidDb(db, typeKey) {
                if (!db || typeof db !== "object") return false;

                for (const id in db) {
                    const item = db[id];
                    if (!item || typeof item !== "object") continue;

                    if (item[typeKey] !== undefined) {
                        return true;
                    }
                }

                return false;
            }

            /*
            * 新版：
            * setup.foodstuff 必須真的有資料，且至少一筆有 category。
            * 避免框架在舊版也建立空 foodstuff，造成誤判。
            */
            if (hasValidDb(setup.foodstuff, "category")) {
                return {
                    name: "foodstuff",
                    db: setup.foodstuff,
                    storeName: "foodstuff",
                    isNewVersion: true,
                    typeKey: "category"
                };
            }

            /*
            * 舊版：
            * setup.plants 必須真的有資料，且至少一筆有 type。
            */
        if (hasValidDb(setup.plants, "type")) {
                return {
                    name: "plants",
                    db: setup.plants,
                    storeName: "plants",
                    isNewVersion: false,
                    typeKey: "type"
                };
            }

            return null;
        },

        db() {
            return this.getDbInfo()?.db || {};
        },

        storeName() {
            return this.getDbInfo()?.storeName || "plants";
        },

        store() {
            const name = this.storeName();

            if (!State.variables[name]) {
                State.variables[name] = {};
            }

            return State.variables[name];
        },

        isNewVersion() {
            return this.getDbInfo()?.isNewVersion || false;
        },

        getItemType(item) {
            const info = this.getDbInfo();
            if (!info || !item) return "未分類";

            return item[info.typeKey] ?? "未分類";
        },

        getTypes() {
            const db = this.db();
            const allTypes = [];

            for (const id in db) {
                const item = db[id];
                if (!item) continue;

                const type = this.getItemType(item);

                if (!allTypes.includes(type)) {
                    allTypes.push(type);
                }
            }

            return allTypes;
        },

        eachItemByType(type, callback) {
            const db = this.db();

            for (const id in db) {
                const item = db[id];
                if (!item) continue;

                if (this.getItemType(item) === type) {
                    callback(id, item);
                }
            }
        },

        amount(id) {
            return this.store()[id]?.amount || 0;
        },

        give(id, amount) {
            const info = this.getDbInfo();
            if (!info) return;

            const db = info.db;
            const store = this.store();

            if (!id || !db[id]) return;

            amount = amount ? Number(amount) : 1;

            if (store[id] === undefined) {
                store[id] = info.isNewVersion
                    ? { amount: 0 }
                    : {
                        name: db[id].name,
                        plural: db[id].plural,
                        amount: 0
                    };
            } else if (!info.isNewVersion && store[id].name === undefined) {
                store[id] = {
                    name: db[id].name,
                    plural: db[id].plural,
                    amount: store[id].amount
                };
            }

            store[id].amount = Number(store[id].amount) || 0;
            store[id].amount += amount;
        }
    };

    function div(className, style) {
        const el = document.createElement("div");
        if (className) el.className = className;
        if (style) el.style.cssText = style;
        return el;
    }

    function span(className, text) {
        const el = document.createElement("span");
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
    }

    function makeSelect(values) {
        const select = document.createElement("select");

        values.forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });

        return select;
    }

    function makeInput(placeholder) {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = placeholder;
        input.style.width = "100%";
        input.style.boxSizing = "border-box";
        return input;
    }

    function makeLink(text, onClick) {
        const wrapper = span("dol-link");

        const link = document.createElement("a");
        link.href = "javascript:void(0)";
        link.textContent = text;

        link.addEventListener("click", ev => {
            ev.preventDefault();
            onClick();
        });

        wrapper.appendChild(link);
        return wrapper;
    }

    function makeLabelControl(labelText, control) {
        const box = div(null, "display: flex; flex-direction: column;");

        const label = document.createElement("label");
        label.textContent = labelText;
        label.style.fontWeight = "bold";

        box.appendChild(label);
        box.appendChild(control);

        return box;
    }

    Macro.add("CE_inventory_helper", {
        handler() {
            const food = setup.CE_foodCompat;
            const info = food.getDbInfo();

            if (!info) {
                const warn = div("error-view");
                warn.textContent = "CE_inventory_helper：找不到有效的 setup.foodstuff 或 setup.plants。";
                this.output.appendChild(warn);
                return;
            }

            const allTypes = food.getTypes();
            const selectAmounts = [1, 10, 100, 500, 1000];

            let productType = allTypes[0];
            let amount = selectAmounts[0];
            let keyword = "";

            const root = div("dol-settings dol-shadow");

            const header = div("dol-header");
            header.appendChild(span("dol-title", "虛空創造"));
            root.appendChild(header);

            const body = div("dol-body");
            const outer = div(null, "display: flex; flex-direction: column; align-items: center; gap: 12px;");

            const panel = div(
                "dol-section",
                "display: flex; flex-direction: column; gap: 6px; padding: 8px; border-radius: 6px; width: 100%;"
            );

            const title = div(null, "font-weight: bold; color: gold; margin-bottom: 4px;");
            title.textContent = "虛空創造 - PC想要的物品+起來！";

            const typeSelect = makeSelect(allTypes);
            const amountSelect = makeSelect(selectAmounts);
            const searchInput = makeInput("搜尋物品名稱 / ID");

            const itemList = div(null, "overflow-x: auto; width: 100%;");
            itemList.id = "item_list";

            const itemGrid = div(
                null,
                "display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); grid-auto-rows: auto; gap: 6px;"
            );
            itemGrid.id = "item_grid";

            function matchKeyword(id, item) {
                if (!keyword) return true;

                const text = [
                    id,
                    item.name,
                    item.plural,
                    item.singular,
                    item.displayName,
                    item.label
                ].filter(Boolean).join(" ").toLowerCase();

                return text.includes(keyword);
            }

            function getItemName(id, item) {
                return item.plural ||
                    item.name ||
                    item.singular ||
                    item.displayName ||
                    item.label ||
                    id;
            }

            /*
            * 官方目前所有 icon 皆位於 tending。
            * 若未來依 prop_folder 分類，只需將 usePropFolder 改為 true。
            */
            const usePropFolder = false;

            function getIconSrc(item) {
                if (!item || !item.icon) return "";

                if (String(item.icon).includes("/")) {
                    return item.icon;
    }

                if (usePropFolder) {
                    return `img/misc/icon/${item.prop_folder || "tending"}/${item.icon}`;
                }

                return `img/misc/icon/tending/${item.icon}`;
            }

            function renderGrid() {
                itemGrid.textContent = "";

                food.eachItemByType(productType, (id, item) => {
                    if (!matchKeyword(id, item)) return;

                    const card = div(
                        "dol-section plant_item",
                        "display: flex; flex-direction: column; align-items: center; border: 1px solid #ccc; padding: 4px; border-radius: 4px; box-sizing: border-box; min-height: 80px;"
                    );

                    const top = div(
                        null,
                        "display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%;"
                    );

                    const iconSrc = getIconSrc(item);

                    if (iconSrc) {
                        const img = document.createElement("img");
                        img.className = "tending_icon";
                        img.width = 32;
                        img.src = iconSrc;
                        top.appendChild(img);
                    }

                    const itemName = getItemName(id, item);

                    const link = makeLink(`${itemName}（+${amount}）`, () => {
                        food.give(id, amount);
                        renderGrid();
                    });

                    top.appendChild(link);

                    const amountText = span(null);
                    amountText.style.marginTop = "4px";
                    amountText.style.color = "gold";
                    amountText.style.fontWeight = "bold";
                    amountText.textContent = "數量: " + food.amount(id);

                    card.appendChild(top);
                    card.appendChild(amountText);

                    itemGrid.appendChild(card);
                });
            }

            typeSelect.addEventListener("change", () => {
                productType = typeSelect.value;
                renderGrid();
            });

            amountSelect.addEventListener("change", () => {
                amount = Number(amountSelect.value) || 1;
                renderGrid();
            });

            searchInput.addEventListener("input", () => {
                keyword = searchInput.value.trim().toLowerCase();
                renderGrid();
            });

            panel.appendChild(title);
            panel.appendChild(makeLabelControl("物品類型：", typeSelect));
            panel.appendChild(makeLabelControl("數量：", amountSelect));
            panel.appendChild(makeLabelControl("搜尋：", searchInput));

            itemList.appendChild(itemGrid);

            outer.appendChild(panel);
            outer.appendChild(itemList);

            body.appendChild(outer);
            root.appendChild(body);

            this.output.appendChild(root);

            renderGrid();
        }
    });
})();