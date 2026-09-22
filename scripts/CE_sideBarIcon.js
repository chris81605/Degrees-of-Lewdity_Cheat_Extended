// 右側折疊狀態欄的 CE 入口。
// 點擊後以 CE overlay 顯示作弊拓展主選單。
function CEiconClicked() {
    $.wiki("<<CEoverlayReplace \"CEcheatMenu\">>");
}
window.CEiconClicked = CEiconClicked;

// 偵測 Simple Frameworks。
// 僅記錄相容旗標；實際圖示插入方式由對應框架端處理。
function CEiconSFdetect(){    
    const simpleMod = window.modUtils.getAnyModByNameNoAlias('Simple Frameworks'); // ⚡ Simple Frameworks
    const logger = window.modUtils.getLogger();
    //logger.warn(`[cheat Extended][CEiconSFdetect] 🧾 simpleMod = ${simpleMod}`);
    //console.warn(`[cheat Extended][CEiconSFdetect] 🧾 simpleMod = ${simpleMod}`);
    if (simpleMod) V.CE_SFflag = true;
    //logger.warn(`[cheat Extended][CEiconSFdetect] 🧾 V.CE_SFflag = ${V.CE_SFflag}`);
    //console.warn(`[cheat Extended][CEiconSFdetect] 🧾 V.CE_SFflag = ${V.CE_SFflag}`);
}
CEiconSFdetect();

// 用於CE主畫面顯示的安全渲染函數，避免容器不存在的情況仍然渲染導致錯誤
function CE_renderSettings(wikiText) {
    const target = document.getElementById('CE_settingsDiv') || window.CE_activeSettingsDiv;
    if (!target) {
        console.warn('[Cheat Extended] #CE_settingsDiv not found, skip render:', wikiText);
        return false;
    }

    target.innerHTML = '';
    new Wikifier(target, wikiText);
    return true;
}
window.CE_renderSettings = CE_renderSettings;

/*==============================
CE Statebox UI - JS Rebuild
--------------------------------
合併：CEstatebox、CE_Toggle、CE_UiLists三個widget
對外入口使用：
<<CEstatebox>>
==============================*/

(function () {

    "use strict";

    Macro.add("CEstatebox", {

        handler() {

            const root = document.createElement("div");

            this.output.appendChild(root);

            const ensureState = () => {

                if (V.CE_Toggle === undefined || V.CE_Toggle === "undefined") {
                    V.CE_Toggle = 0;
                }

                if (V.swich === undefined) {
                    V.swich = 0;
                }

                if (V.swich_teleportation === undefined) {
                    V.swich_teleportation = 0;
                }

                if (V.swich_yanling === undefined) {
                    V.swich_yanling = 0;
                }

            };

            const createEl = (tag, className, textContent) => {

                const el = document.createElement(tag);

                if (className) {
                    el.className = className;
                }

                if (textContent !== undefined) {
                    el.textContent = textContent;
                }

                return el;

            };

            const createButton = (label, onClick) => {

                const btn = document.createElement("button");

                btn.type = "button";
                btn.className = "CE-statebox-toggle-btn";
                btn.textContent = label;
                btn.onclick = onClick;

                return btn;
            
            };
            
            const renderWiki = (parent, wikiCode, errorText) => {

                const box = document.createElement("div");

                parent.appendChild(box);

                try {
                    $(box).wiki(wikiCode);
                }
                catch (e) {
                    console.error("[CEstatebox]", errorText, e);
                    box.textContent = "[" + errorText + "]";
                }

                return box;

            };

            const renderEmptyMessage = (parent) => {

                const desc = createEl("div", "small-description");

                desc.append("空空的什麼也沒有？");

                const mouse = document.createElement("mouse");

                mouse.className = "tooltip linkBlue";
                mouse.textContent = "(?)";

                const span = document.createElement("span");

                span.textContent = "試著去選項裡打開作弊拓展入口後啟用幾個功能看看？";

                mouse.appendChild(span);
                desc.appendChild(mouse);

                parent.appendChild(desc);

            };

            const refresh = () => {

                ensureState();

                root.replaceChildren();

                const toggleWrap = createEl("div", "CE-statebox-toggle-wrap");
                const listWrap = document.createElement("div");

                toggleWrap.id = "CE_Toggle";
                listWrap.id = "CEstatebox";

                const toggleBtn = createButton("作弊拓展", () => {

                    V.CE_Toggle = V.CE_Toggle == 0 ? 1 : 0;
                    refresh();

                });
                
                if (V.CE_Toggle) {
                    toggleBtn.classList.add("CE-open");
                }

                toggleWrap.appendChild(toggleBtn);

                root.appendChild(toggleWrap);
                root.appendChild(listWrap);
                root.appendChild(document.createElement("br"));

                if (!V.CE_Toggle) {
                    return;
                }

                const list = createEl("div", "dol-body dol-border");

                list.id = "CE_UiLists";

                if (!V.swich && !V.swich_teleportation && !V.swich_yanling) {
                    renderEmptyMessage(list);
                }

                renderWiki(list, "<<CE_QuickPanel>>", "CE_QuickPanel 渲染失敗");

                if (V.swich_teleportation) {                   
                    renderWiki(list, "<<CE_TeleportationSimplePanel>>", "空間節點 UI 渲染失敗");
                }

                if (V.swich_yanling) {                    
                    renderWiki(list, "<<CE_YanlingSimplePanel>>", "言靈集 UI 渲染失敗");
                }

                listWrap.appendChild(list);
                listWrap.appendChild(document.createElement("hr"));

            };
            
            // 供外部刷新用
            setup.CE_StateboxManager ??= {};
            setup.CE_StateboxManager.refresh = refresh;

            refresh();

        }

    });

})();

/* =========================================
 * <<CE_CheatExtendedVersion>>
 * 在畫面頂端顯示目前 Cheat Extended 版本號。
 * 元素只建立一次，之後呼叫僅更新文字內容。
 * ========================================= */
Macro.add('CE_CheatExtendedVersion', {
    handler: function() {
        var version = window.modUtils.getMod('cheat extended').version;
        var div = document.getElementById('CE-cheatExtended-version');

        if (!div) {
            div = document.createElement('div');
            div.id = 'CE-cheatExtended-version';

            /* 位置設定：畫面置頂置中 */
            div.style.position = 'fixed';
            div.style.left = '50%';
            div.style.top = '5px';
            div.style.transform = 'translateX(-50%)';
            div.style.zIndex = '9999';

            /* 外觀設定 */
            div.style.fontSize = '8.8px';
            div.style.color = 'rgb(119,119,119)';
            div.style.opacity = '0.8';
            div.style.whiteSpace = 'nowrap';
            div.style.pointerEvents = 'none';

            document.body.appendChild(div);
        }

        div.textContent = 'CE v' + version;
    }
});

/* =========================================
 * Cheat Extended 功能目錄 / 兩級標籤管理
 *
 * CE_TabManager 負責：
 * - 功能 tab 註冊與顯示條件
 * - 一級分類與二級功能 tab 的渲染
 * - 最愛、顯示/隱藏、排序與分類歸屬
 * - 自訂一級分類的新增、改名與刪除
 * - 記錄並恢復上次選中的分類與功能 tab
 * ========================================= */
(() => {
    // CE_TabManager：集中管理一級分類與二級功能 tab。
    const CE_TabManager = {
        tabs: [],           // 存放所有已註冊的 tab 物件
        _btnMap: {},        // tabId → button DOM 映射，用於 restore 上次選中 tab
        _sortWrap: null,    // 排序 UI 容器 DOM
        _defaultOrder: null,// 預設 tab 註冊順序（用於還原）
        _activeCategory: null,
        _categoryBar: null,
        _tabBar: null,
        _container: null,
        categories: [
            { id: 'favorite', title: '⭐ 我的最愛', virtual: true },
            { id: 'common', title: '常用面板', builtin: true },
            { id: 'combat', title: '戰鬥', builtin: true },
            { id: 'body', title: '身體', builtin: true },
            { id: 'pregnancy', title: '懷孕與生產', builtin: true },
            { id: 'money', title: '金錢與報酬', builtin: true },
            { id: 'system', title: '時間與系統', builtin: true },
            { id: 'items', title: '物品與衣櫃', builtin: true },
            { id: 'scene', title: '場景助手', builtin: true },
            { id: 'other', title: '其他', builtin: true }
        ],
        _defaultCategoryOrder: ['favorite', 'common', 'combat', 'pregnancy', 'money', 'system', 'items', 'scene', 'other'],
        _customCategorySerial: 0,

        /**
         * 註冊二級功能 tab。
         * @param {object} tab - id / title / category / onClick / condition 等設定
         */
        register(tab) {
            this.tabs.push(tab);
            this._defaultOrder = this._defaultOrder || [];
            this._defaultOrder.push(tab.id); // 記錄初始順序
            console.log(`[cheat Extended][TabManager] ${tab.title} 已註冊`);
        },

        /**
         * 套用儲存的 tab 順序
         * 依照 V.CE_TabOrder 儲存順序排列 tab，未排序的 tab 追加到最後
         */
        applyOrder() {
            if (!Array.isArray(V.CE_TabOrder)) return;

            const map = Object.create(null);
            this.tabs.forEach(t => map[t.id] = t);

            this.tabs = V.CE_TabOrder
                .map(id => map[id])          // 依序建立新陣列
                .filter(Boolean)             // 過濾不存在的 tab
                .concat(this.tabs.filter(t => !V.CE_TabOrder.includes(t.id))); // 追加未排序 tab
        },

        /**
         * 儲存目前 tab 順序到 V.CE_TabOrder
         */
        saveOrder() {
            V.CE_TabOrder = this.tabs.map(t => t.id);
        },

        ensureCategoryState() {
            V.CE_CustomCategories = Array.isArray(V.CE_CustomCategories) ? V.CE_CustomCategories : [];
            V.CE_CategoryTitleOverride = V.CE_CategoryTitleOverride || {};
            V.CE_CategoryHidden = V.CE_CategoryHidden || {};
            V.CE_TabCategoryOverride = V.CE_TabCategoryOverride || {};

            const builtinIds = new Set(this.categories.map(category => category.id));
            const seen = new Set();
            V.CE_CustomCategories = V.CE_CustomCategories.filter(category => {
                if (!category || typeof category.id !== 'string' || typeof category.title !== 'string') return false;
                if (!category.id.startsWith('custom_') || builtinIds.has(category.id) || seen.has(category.id)) return false;
                seen.add(category.id);
                return true;
            });

            const validIds = new Set(this.getAllCategoriesRaw().map(category => category.id));
            Object.keys(V.CE_TabCategoryOverride).forEach(tabId => {
                if (!validIds.has(V.CE_TabCategoryOverride[tabId]) || V.CE_TabCategoryOverride[tabId] === 'favorite') {
                    delete V.CE_TabCategoryOverride[tabId];
                }
            });
        },

        getAllCategoriesRaw() {
            const custom = Array.isArray(V.CE_CustomCategories) ? V.CE_CustomCategories : [];
            return this.categories.concat(custom.map(category => ({ ...category, custom: true })));
        },

        getCategoryTitle(category) {
            if (!category) return '';
            if (category.custom) return category.title;
            return V.CE_CategoryTitleOverride?.[category.id] || category.title;
        },

        getTabCategory(tab) {
            if (!tab) return 'other';
            return V.CE_TabCategoryOverride?.[tab.id] || tab.category || 'other';
        },

        getCategoryOrder() {
            this.ensureCategoryState();
            const knownIds = this.getAllCategoriesRaw().map(category => category.id);
            const stored = Array.isArray(V.CE_CategoryOrder) ? V.CE_CategoryOrder : [];
            const order = stored.filter(id => knownIds.includes(id));
            knownIds.forEach(id => {
                if (!order.includes(id)) order.push(id);
            });
            V.CE_CategoryOrder = order;
            return order;
        },

        getOrderedCategories() {
            this.ensureCategoryState();
            const map = Object.create(null);
            this.getAllCategoriesRaw().forEach(category => map[category.id] = category);
            return this.getCategoryOrder().map(id => map[id]).filter(Boolean);
        },

        createCustomCategory(title) {
            this.ensureCategoryState();
            title = String(title ?? '').trim();
            if (!title) return null;

            let id;
            do {
                this._customCategorySerial += 1;
                id = `custom_${Date.now().toString(36)}_${this._customCategorySerial.toString(36)}`;
            } while (this.getAllCategoriesRaw().some(category => category.id === id));

            const category = { id, title };
            V.CE_CustomCategories.push(category);
            const order = this.getCategoryOrder();
            if (!order.includes(id)) order.push(id);
            V.CE_CategoryOrder = order;
            return category;
        },

        renameCategory(categoryId, title) {
            this.ensureCategoryState();
            title = String(title ?? '').trim();
            if (!title) return false;

            const custom = V.CE_CustomCategories.find(category => category.id === categoryId);
            if (custom) {
                custom.title = title;
                return true;
            }

            const category = this.categories.find(category => category.id === categoryId);
            if (!category) return false;
            if (title === category.title) delete V.CE_CategoryTitleOverride[categoryId];
            else V.CE_CategoryTitleOverride[categoryId] = title;
            return true;
        },

        deleteCustomCategory(categoryId) {
            this.ensureCategoryState();
            const index = V.CE_CustomCategories.findIndex(category => category.id === categoryId);
            if (index < 0) return false;

            this.tabs.forEach(tab => {
                if (V.CE_TabCategoryOverride[tab.id] === categoryId) {
                    delete V.CE_TabCategoryOverride[tab.id];
                }
            });

            V.CE_CustomCategories.splice(index, 1);
            delete V.CE_CategoryHidden[categoryId];
            delete V.CE_CategoryTitleOverride[categoryId];
            V.CE_CategoryOrder = this.getCategoryOrder().filter(id => id !== categoryId);
            if (V.CE_LastCategory === categoryId) delete V.CE_LastCategory;
            return true;
        },

        /**
         * 將兩級標籤 UI 渲染到指定容器。
         *
         * 一級：分類列；只顯示未隱藏且至少含一個可用二級 tab 的分類。
         * 二級：目前分類中的功能 tab；「我的最愛」是虛擬分類，不改變 tab 的實際歸屬。
         * condition 不符或被使用者隱藏的 tab 不參與顯示。
         * 「標籤頁管理」固定附加在一級分類列末端，不參與一般 tab 排序。
         */
        render(container) {
            this.applyOrder();
            container.innerHTML = '';
            container.classList.add('CE-two-level-tabs');
            this._btnMap = {};

            V.CE_TabHidden = V.CE_TabHidden || {};
            V.CE_TabFavorite = V.CE_TabFavorite || {};

            this._container = container;
            this.ensureCategoryState();
            const categoryDefs = this.getOrderedCategories();

            const visibleTabs = () => this.tabs.filter(tab => {
                if (tab.id === 'tabSort') return false;
                if ((tab.condition && !tab.condition()) || V.CE_TabHidden[tab.id]) return false;
                return true;
            });

            const tabsForCategory = categoryId => {
                const tabs = visibleTabs();
                if (categoryId === 'favorite') return tabs.filter(tab => V.CE_TabFavorite[tab.id]);
                return tabs.filter(tab => this.getTabCategory(tab) === categoryId);
            };

            const availableCategories = () => categoryDefs.filter(category => !V.CE_CategoryHidden[category.id] && tabsForCategory(category.id).length > 0);
            const selectedClass = container.classList.contains('CEbuttonBar') ? 'CEbuttonBarSelected' : 'CEtabSelected';

            const categoryBar = document.createElement('div');
            categoryBar.className = 'CE-category-bar';
            const tabBar = document.createElement('div');
            tabBar.className = 'CE-subtab-bar';
            container.append(categoryBar, tabBar);
            this._categoryBar = categoryBar;
            this._tabBar = tabBar;

            const scrollSelectedIntoView = (categoryId, tabId) => {
                // 等兩級標籤完成佈局後再捲動，避免剛進入選單時
                // restore() 雖已選中項目，但瀏覽器尚未算出正確的水平位置。
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const categoryBtn = categoryBar.querySelector(
                            `button[data-category-id="${categoryId}"]`
                        );
                        const tabBtn = this._btnMap[tabId];

                        categoryBtn?.scrollIntoView({
                            behavior: 'smooth',
                            inline: 'center',
                            block: 'nearest'
                        });

                        tabBtn?.scrollIntoView({
                            behavior: 'smooth',
                            inline: 'center',
                            block: 'nearest'
                        });
                    });
                });
            };

            const selectTab = (tab, categoryId) => {
                tabBar.querySelectorAll('button').forEach(btn => btn.classList.remove(selectedClass));
                const btn = this._btnMap[tab.id];
                if (btn) btn.classList.add(selectedClass);
                tab.onClick?.();
                V.CE_LastTab = tab.id;
                V.CE_LastCategory = categoryId;
                V.CE_LastTabByCategory = V.CE_LastTabByCategory || {};
                V.CE_LastTabByCategory[categoryId] = tab.id;
                const actualCategory = this.getTabCategory(tab);
                if (actualCategory) V.CE_LastTabByCategory[actualCategory] = tab.id;
                scrollSelectedIntoView(categoryId, tab.id);
            };

            const renderTabs = (categoryId, restoreTab = true) => {
                this._activeCategory = categoryId;
                V.CE_LastCategory = categoryId;
                this._btnMap = {};
                tabBar.innerHTML = '';
                categoryBar.querySelectorAll('button[data-category-id]').forEach(btn => {
                    btn.classList.toggle(selectedClass, btn.dataset.categoryId === categoryId);
                });

                const tabs = tabsForCategory(categoryId);
                tabs.forEach(tab => {
                    const btn = document.createElement('button');
                    btn.textContent = V.CE_TabFavorite[tab.id] ? `⭐ ${tab.title}` : tab.title;
                    btn.dataset.tabId = tab.id;
                    btn.onclick = () => selectTab(tab, categoryId);
                    this._btnMap[tab.id] = btn;
                    tabBar.appendChild(btn);
                });

                if (!restoreTab || tabs.length === 0) return;
                V.CE_LastTabByCategory = V.CE_LastTabByCategory || {};
                const savedId = V.CE_LastTabByCategory[categoryId];
                const target = tabs.find(tab => tab.id === savedId)
                    || tabs.find(tab => tab.id === V.CE_LastTab)
                    || tabs[0];
                if (target) selectTab(target, categoryId);
            };

            availableCategories().forEach(category => {
                const btn = document.createElement('button');
                btn.textContent = this.getCategoryTitle(category);
                btn.dataset.categoryId = category.id;
                btn.onclick = () => renderTabs(category.id, true);
                categoryBar.appendChild(btn);
            });

            const tabSort = this.tabs.find(t => t.id === 'tabSort');
            if (tabSort && (!tabSort.condition || tabSort.condition())) {
                const separator = document.createElement('span');
                separator.className = 'ce-tab-separator';
                separator.textContent = '|';
                categoryBar.appendChild(separator);
                const btn = document.createElement('button');
                btn.textContent = tabSort.title;
                btn.onclick = () => tabSort.onClick?.();
                categoryBar.appendChild(btn);
            }

            this._renderCategoryTabs = renderTabs;
            this._availableCategories = availableCategories;
        },
        /**
         * 恢復上次選中的一級分類與二級 tab。
         * 若原項目已不可用，依最後 tab 所屬分類或第一個可用分類回退。
         */
        restore() {
            const categories = this._availableCategories?.() || [];
            if (!categories.length) return;

            let categoryId = V.CE_LastCategory;
            if (!categories.some(category => category.id === categoryId)) {
                const lastTab = this.tabs.find(tab => tab.id === V.CE_LastTab);
                categoryId = this.getTabCategory(lastTab);
            }
            if (!categories.some(category => category.id === categoryId)) {
                categoryId = categories[0].id;
            }

            this._renderCategoryTabs?.(categoryId, true);
        },
        /**
         * 打開兩級標籤管理對話框。
         *
         * 一級分類：新增、改名、顯示/隱藏、上下排序；自訂分類可刪除。
         * 二級 tab：加入最愛、顯示/隱藏、變更分類歸屬、分類內排序。
         * 另提供還原預設排序，以及還原內建分類名稱 / tab 歸屬。
         */
        openSortUI() {
            if (this._sortWrap) {
                Dialog.close();
                this._sortWrap = null;
            }

            Dialog.setup('⚙️標籤頁管理');
            Dialog.wiki('');

            /* === 修復0.5.7.8消失的 Dialog 關閉按鈕 === */
            setTimeout(() => {
                const btn = document.getElementById('ui-dialog-close');
                if (!btn) return;

                btn.textContent = '✖';
                btn.style.display = 'inline-flex'; //block 
                btn.style.alignItems = 'center';
                btn.style.justifyContent = 'center';
                btn.style.visibility = 'visible';
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                btn.style.fontSize = '1rem';      // 可選
                btn.style.lineHeight = '1';       // 可選
            }, 0);
            /* === 修復結束 === */

            const body = Dialog.body();
            const wrap = document.createElement('div');
            wrap.className = 'CE-tab-sorter';
            wrap.style.maxHeight = '70vh';
            wrap.style.overflowY = 'auto';
            body.appendChild(wrap);
            this._sortWrap = wrap;

            // 初始化狀態表
            V.CE_TabHidden = V.CE_TabHidden || {};
            V.CE_TabFavorite = V.CE_TabFavorite || {};
            this.ensureCategoryState();
            this.getCategoryOrder();

            const rerender = () => {
                wrap.replaceChildren();

                // 說明文字
                const info = document.createElement('div');
                info.style.marginBottom = '8px';
                info.style.fontSize = '0.85rem';
                info.style.color = '#666';
                info.textContent = '一級：新增、改名、顯示、排序｜二級：⭐ 最愛、顯示、分類歸屬、分類內排序';
                wrap.appendChild(info);

                const addWrap = document.createElement('div');
                addWrap.className = 'CE-tab-manage-add-category';

                const addInput = document.createElement('input');
                addInput.type = 'text';
                addInput.placeholder = '新的分類名稱';
                addInput.maxLength = 40;

                const addBtn = document.createElement('button');
                addBtn.textContent = '＋新增分類';
                addBtn.onclick = () => {
                    if (!this.createCustomCategory(addInput.value)) return;
                    rerender();
                };
                addInput.onkeydown = event => {
                    if (event.key === 'Enter') addBtn.click();
                };
                addWrap.append(addInput, addBtn);
                wrap.appendChild(addWrap);

                // 還原預設排序按鈕
                const restoreBtn = document.createElement('button');
                restoreBtn.textContent = '還原預設排序';
                restoreBtn.onclick = () => {
                    this.tabs.sort((a, b) =>
                        this._defaultOrder.indexOf(a.id) - this._defaultOrder.indexOf(b.id)
                    );
                    this.saveOrder();
                    const customIds = V.CE_CustomCategories.map(category => category.id);
                    V.CE_CategoryOrder = this._defaultCategoryOrder.concat(customIds);
                    rerender();
                };
                wrap.appendChild(restoreBtn);

                const resetLayoutBtn = document.createElement('button');
                resetLayoutBtn.textContent = '還原預設分類名稱 / 歸屬';
                resetLayoutBtn.onclick = () => {
                    V.CE_CategoryTitleOverride = {};
                    V.CE_TabCategoryOverride = {};
                    rerender();
                };
                wrap.appendChild(resetLayoutBtn);

                const categoryOrder = this.getCategoryOrder();
                const categoryMap = Object.create(null);
                this.getAllCategoriesRaw().forEach(category => categoryMap[category.id] = category);

                categoryOrder.forEach(categoryId => {
                    const category = categoryMap[categoryId];
                    if (!category) return;

                    const group = document.createElement('div');
                    group.className = 'CE-tab-manage-group';

                    const categoryRow = document.createElement('div');
                    categoryRow.className = 'CE-tab-manage-category-row';

                    const categoryVisible = document.createElement('input');
                    categoryVisible.type = 'checkbox';
                    categoryVisible.title = '顯示此一級標籤';
                    categoryVisible.checked = !V.CE_CategoryHidden[category.id];
                    categoryVisible.onchange = () => {
                        if (categoryVisible.checked) delete V.CE_CategoryHidden[category.id];
                        else V.CE_CategoryHidden[category.id] = true;
                    };
                    categoryRow.appendChild(categoryVisible);

                    const categoryName = document.createElement('input');
                    categoryName.type = 'text';
                    categoryName.className = 'CE-tab-manage-category-name';
                    categoryName.value = this.getCategoryTitle(category);
                    categoryName.maxLength = 40;
                    categoryName.title = '一級標籤名稱';
                    categoryName.onchange = () => {
                        if (!this.renameCategory(category.id, categoryName.value)) {
                            categoryName.value = this.getCategoryTitle(category);
                            return;
                        }
                        rerender();
                    };
                    categoryRow.appendChild(categoryName);

                    const categoryUp = document.createElement('button');
                    categoryUp.textContent = '▲';
                    categoryUp.title = '一級標籤上移';
                    categoryUp.onclick = () => {
                        const order = this.getCategoryOrder();
                        const idx = order.indexOf(category.id);
                        if (idx <= 0) return;
                        [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
                        V.CE_CategoryOrder = order;
                        rerender();
                    };

                    const categoryDown = document.createElement('button');
                    categoryDown.textContent = '▼';
                    categoryDown.title = '一級標籤下移';
                    categoryDown.onclick = () => {
                        const order = this.getCategoryOrder();
                        const idx = order.indexOf(category.id);
                        if (idx < 0 || idx >= order.length - 1) return;
                        [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
                        V.CE_CategoryOrder = order;
                        rerender();
                    };

                    categoryRow.append(categoryUp, categoryDown);

                    if (category.custom) {
                        const categoryDelete = document.createElement('button');
                        categoryDelete.textContent = '🗑';
                        categoryDelete.title = '刪除此自訂分類；其中標籤會回到預設分類';
                        categoryDelete.onclick = () => {
                            const title = this.getCategoryTitle(category);
                            if (!window.confirm(`刪除分類「${title}」？\n其中的二級標籤會回到各自的預設分類。`)) return;
                            this.deleteCustomCategory(category.id);
                            rerender();
                        };
                        categoryRow.appendChild(categoryDelete);
                    }

                    group.appendChild(categoryRow);

                    if (category.id === 'favorite') {
                        const favoriteHint = document.createElement('div');
                        favoriteHint.className = 'CE-tab-manage-hint';
                        favoriteHint.textContent = '此分類內容由下方二級標籤的 ⭐ 設定，不能作為標籤的實際歸屬分類。';
                        group.appendChild(favoriteHint);
                        wrap.appendChild(group);
                        return;
                    }

                    // 建立每個 tab 的設定 row
                    const categoryTabs = this.tabs.filter(tab => tab.id !== 'tabSort' && this.getTabCategory(tab) === category.id);
                    categoryTabs.forEach(tab => {
                        const row = document.createElement('div');
                        row.className = 'CE-tab-manage-tab-row';

                        /**
                         * ⭐ 我的最愛
                         * 將此 tab 同時顯示於虛擬「我的最愛」分類；不改變實際分類歸屬。
                         */
                        const fav = document.createElement('input');
                        fav.type = 'checkbox';
                        fav.title = '加入最愛';
                        fav.checked = !!V.CE_TabFavorite[tab.id];
                        fav.onchange = () => {
                            if (fav.checked) V.CE_TabFavorite[tab.id] = true;
                            else delete V.CE_TabFavorite[tab.id];
                        };
                        row.appendChild(fav);

                        /**
                         * ☑ 顯示 / 隱藏
                         */
                        const visible = document.createElement('input');
                        visible.type = 'checkbox';
                        visible.title = '顯示此標籤';
                        visible.checked = !V.CE_TabHidden[tab.id];
                        visible.onchange = () => {
                            V.CE_TabHidden[tab.id] = !visible.checked;
                        };
                        row.appendChild(visible);

                        // tab 標題
                        const label = document.createElement('span');
                        label.textContent = tab.title;
                        label.className = 'CE-tab-manage-tab-label';
                        row.appendChild(label);

                        const categorySelect = document.createElement('select');
                        categorySelect.className = 'CE-tab-manage-category-select';
                        this.getOrderedCategories().filter(item => item.id !== 'favorite').forEach(item => {
                            const option = document.createElement('option');
                            option.value = item.id;
                            option.textContent = this.getCategoryTitle(item);
                            option.selected = item.id === this.getTabCategory(tab);
                            categorySelect.appendChild(option);
                        });
                        categorySelect.title = '二級標籤所屬分類';
                        categorySelect.onchange = () => {
                            const defaultCategory = tab.category || 'other';
                            if (categorySelect.value === defaultCategory) delete V.CE_TabCategoryOverride[tab.id];
                            else V.CE_TabCategoryOverride[tab.id] = categorySelect.value;
                            rerender();
                        };
                        row.appendChild(categorySelect);

                        const resetCategory = document.createElement('button');
                        resetCategory.textContent = '↩';
                        resetCategory.title = '還原預設分類';
                        resetCategory.disabled = !V.CE_TabCategoryOverride[tab.id];
                        resetCategory.onclick = () => {
                            delete V.CE_TabCategoryOverride[tab.id];
                            rerender();
                        };
                        row.appendChild(resetCategory);

                        /**
                         * ▲ 上移
                         */
                        const up = document.createElement('button');
                        up.textContent = '▲';
                        up.onclick = () => {
                            const sortable = this.tabs.filter(t => t.id !== 'tabSort' && this.getTabCategory(t) === category.id);
                            const idx = sortable.indexOf(tab);
                            if (idx <= 0) return;

                            const a = this.tabs.indexOf(tab);
                            const b = this.tabs.indexOf(sortable[idx - 1]);
                            [this.tabs[a], this.tabs[b]] = [this.tabs[b], this.tabs[a]];
                            this.saveOrder();
                            rerender();
                        };

                        /**
                         * ▼ 下移
                         */
                        const down = document.createElement('button');
                        down.textContent = '▼';
                        down.onclick = () => {
                            const sortable = this.tabs.filter(t => t.id !== 'tabSort' && this.getTabCategory(t) === category.id);
                            const idx = sortable.indexOf(tab);
                            if (idx < 0 || idx >= sortable.length - 1) return;

                            const a = this.tabs.indexOf(tab);
                            const b = this.tabs.indexOf(sortable[idx + 1]);
                            [this.tabs[a], this.tabs[b]] = [this.tabs[b], this.tabs[a]];
                            this.saveOrder();
                            rerender();
                        };

                        row.append(up, down);
                        group.appendChild(row);
                    });

                    if (!categoryTabs.length) {
                        const empty = document.createElement('div');
                        empty.className = 'CE-tab-manage-hint';
                        empty.textContent = '此分類目前沒有二級標籤。';
                        group.appendChild(empty);
                    }

                    wrap.appendChild(group);
                });
            };

            rerender();

            Dialog.open(() => {
                this._sortWrap = null;
                if (this._container?.isConnected) {
                    this.render(this._container);
                    this.restore();
                }
            });
        }
    };

    // 暴露唯讀的全域 CE_TabManager 入口，供其他 CE UI 呼叫。
    Object.defineProperty(window, 'CE_TabManager', {
        value: CE_TabManager,
        writable: false
    });

    // 註冊所有 tab
    const tabs = [
        /* ==============棄用=========
        //
        //{ id: 'quickTab', title: '左側快捷', onClick: () => CE_renderSettings('<<swich>>') },
        //{ id: 'teleport', title: '空間節點', onClick: () => CE_renderSettings('<<swich_teleportation>>') },
        //{ id: 'yanling', title: '言靈集', onClick: () => CE_renderSettings('<<swich_yanling>>') },
        ==========================*/
        
        // =============新版UI=======
        { id: 'CE_YanlingPanel', title: '言靈集', category: 'common', /*condition: () => V.debug,*/ onClick: () => CE_renderSettings('<<CE_YanlingPanel>>') },
        { id: 'CE_TeleportationPanel', title: '空間節點', category: 'common', /*condition: () => V.debug,*/ onClick: () => CE_renderSettings('<<CE_TeleportationPanel>>') },
        { id: 'CE_QuickPanelSettings', title: '快捷面板', category: 'common', /*condition: () => V.debug,*/ onClick: () => CE_renderSettings('<<CE_QuickPanelSettings>>') },
        // =======================
        
        { id: 'statControl', title: '狀態控制', category: 'combat', onClick: () => CE_renderSettings('<<CE_statControlPanel>>') },
        { id: 'purity', title: '純潔永駐', category: 'bofy', onClick: () => CE_renderSettings('<<CE_purityControl>>') },
        { id: 'damage', title: '傷害倍數', category: 'combat', onClick: () => CE_renderSettings('<<CE_damageMultiplier>>') },
        { id: 'violence', title: '疼痛衰減', category: 'combat', onClick: () => CE_renderSettings('<<CE_violenceControl>>') },
        { id: 'hpap', title: 'HP、AP顯示', category: 'combat', onClick: () => CE_renderSettings('<<swich_HP_AP_display>>') },
        { id: 'transformationDailyGain', title: '額外轉化點數', category: 'combat', onClick: () => CE_renderSettings('<<CE_TransformationDailyGainSettings>>') },
        { id: 'milk', title: '大量擠🥛模式', category: 'pregnancy', onClick: () => CE_renderSettings('<<milk_released_setting>>') },
        { id: 'semen', title: '大爆🐍模式', category: 'pregnancy', condition: () => V.player?.penisExist || V.debug, onClick: () => CE_renderSettings('<<semen_released_setting>>') },
        { id: 'cafeBunCheat', title: '小麵包收入', category: 'money', onClick: () => CE_renderSettings('<<CE_cafeBunCheat>>') },
        { id: 'blackStore', title: '黑心商店', category: 'money', onClick: () => CE_renderSettings('<<black_stores_setting>>') },
        { id: 'money', title: '收支倍率調整', category: 'money', onClick: () => CE_renderSettings('<<CE_moneyCheat>>') },
        { id: 'danceReward', title: '跳舞報酬加倍', category: 'money', onClick: () => CE_renderSettings('<<dance_reward_setting>>') },
        { id: 'brothelReward', title: '尋歡洞報酬加倍', category: 'money', onClick: () => CE_renderSettings('<<brothel_basement_setting>>') },
        { id: 'timeMultiplier', title: '時間流速控制', category: 'system', onClick: () => CE_renderSettings('<<CE_timeMultiplier>>') },
        { id: 'timeTravel', title: '時空穿越', category: 'system', onClick: () => CE_renderSettings('<<CE_TimeTravelPlus>>') },
        { id: 'debugMode', title: 'DEBUG MODE', category: 'system', onClick: () => CE_renderSettings('<<swich_DEBUG_MODE>>') },
        { id: 'CE_DebugToolPanel', title: 'Debug 工具', category: 'system', condition: () => V.debug, onClick: () => CE_renderSettings('<<CE_DebugToolPanel>>') },
        { id: 'study', title: '用功學習', category: 'system', onClick: () => CE_renderSettings('<<study_hard_mod>>') },
        { id: 'wardrobe', title: '大容量衣櫃', category: 'items', onClick: () => CE_renderSettings('<<bigest_wardrobe_mod>>') },
        { id: 'pcRepair', title: 'Pc縫衣中', category: 'items', onClick: () => CE_renderSettings('<<CE_autoRepairClothesUI>>') },
        { id: 'allClothes', title: '一鍵添加所有服裝+', category: 'items', onClick: () => CE_renderSettings('<<CE_getAllClothes_new>>') },
        { id: 'voidCreate', title: '虛空創造', category: 'items', onClick: () => CE_renderSettings('<<CE_inventory_helper>>') },
        { id: 'magicCircuit', title: '魔術迴路', category: 'body', onClick: () => CE_renderSettings('<<CE_tattoo>>') },
        { id: 'eyeCustomManager', title: '眼色自定義', category: 'body', onClick: () => CE_renderSettings('<<eyeCustomManager>>') },
        { id: 'skinCustomManager', title: '膚色自定義', category: 'body', onClick: () => CE_renderSettings('<<skinCustomManager>>') },
        { id: 'clothTypeManager', title: '服裝類型管理', category: 'items', onClick: () => CE_renderSettings('<<clothTypeManager>>') },
        { id: 'pcPreg', title: 'PC懷孕', category: 'pregnancy', onClick: () => CE_renderSettings('<<CE_Pregnancy>>') },
        { id: 'parasitePreg', title: '寄生物懷孕控制', category: 'pregnancy', onClick: () => CE_renderSettings('<<CE_parasiteControl>>') },
        { id: 'autoWarm', title: '自動調溫', category: 'body', onClick: () => CE_renderSettings('<<auto_clothes_Warmth>>') },
        { id: 'quickYanling', title: '快速言靈', category: 'common', onClick: () => CE_renderSettings('<<quick_yanling>>') },
        { id: 'farmCheat', title: '農場助手', category: 'scene', condition: () => V.farm_stage >= 2 || V.debug === 1, onClick: () => CE_renderSettings(`<<CE_farmCheatPanel>>`) },
        { id: 'safehouseCheat', title: '安全屋助手', category: 'scene', onClick: () => CE_renderSettings(`<<CE_safehouseCheatPanel>>`) },
        { id: 'averyHelper', title: '艾弗里助手', category: 'scene', onClick: () => CE_renderSettings('<<CE_averyHelperPanel>>') },
        { id: 'featUnlocker', title: '成就解鎖器', category: 'system', onClick: () => CE_renderSettings(`<<CE_FeatUnlockerPanel>>`) },
        { id: 'hopelessCycle', title: '不爱玩小游戏', category: 'other', onClick: () => CE_renderSettings('<<CE_hopelessCyclePanel>>') },
        { id: 'forestShop', title: '格皇我要攻略你呀', category: 'other', onClick: () => CE_renderSettings('<<CE_forestShopPanel>>') },

        // 排序 UI 按鈕，不參與排序，只用於打開排序對話框
        { id: 'tabSort', title: '⚙️標籤頁管理', condition: () => V.CE_menuSortEnable || V.debug, onClick: () => CE_TabManager.openSortUI() }
    ];

    // 集中註冊所有二級功能 tab。
    tabs.forEach(tab => CE_TabManager.register(tab));
})();

/****************************************
 * title_cheatExtendedMenu macro
 ****************************************/

/* CE overlay 版入口：在原版 overlay 內容中建立 CE 的兩級功能目錄。 */

Macro.add("title_cheatExtendedMenu", {
    handler() {
        // 先執行原版 setupTabs，保持 overlay 所需的基礎初始化。
        Wikifier.wikifyEval("<<setupTabs>>", this.output);

        // 建立 CE 兩級標籤容器。
        const container = document.createElement("div");
        container.id = "cheat_extended_options";
        container.className = "CEtab"; // 保留原樣式，不影響其他地方
        this.output.append(container);

        // 確認 overlay 內容容器已存在。
        const content = document.getElementById("customOverlayContent");
        if (!content) throw new Error("#customOverlayContent not found");

        // 由 CE_TabManager 生成分類列與功能 tab。
        if (window.CE_TabManager) {
            // 延後到下一幀，確保剛建立的容器已掛入 DOM。
            requestAnimationFrame(() => {
                CE_TabManager.render(container); // 生成一級分類列與二級功能 tab

                // render() 內部已建立按鈕、事件與選中狀態；再下一幀恢復上次位置。
                requestAnimationFrame(() => {
                    CE_TabManager.restore(); // 恢復最後選中的分類與功能 tab
                });


            });
        }

        // Overlay 使用 CE 自製關閉按鈕，避免依賴原版關閉按鈕行為。
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "✖";
        closeBtn.className = "CE-close-btn";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "0";
        closeBtn.style.right = "0";
        closeBtn.style.zIndex = "1000";
        closeBtn.style.border = "none";
        closeBtn.style.background = "transparent";
        closeBtn.style.color = "#fff";
        closeBtn.style.fontSize = "1.5em";
        closeBtn.style.cursor = "pointer";
        closeBtn.onclick = () => closeOverlay();
        this.output.append(closeBtn);
    }
});


// 內嵌作弊選單入口：建立標題、兩級標籤列與共用內容區。
Macro.add('cheat_extended', {
    handler() {
        const container = document.createElement('div');

        // 分隔線。
        const hr = document.createElement('hr');
        container.appendChild(hr);

        // 標題。
        const header = document.createElement('div');
        header.className = 'settingsHeader options';
        const titleSpan = document.createElement('span');
        titleSpan.className = 'gold';
        titleSpan.textContent = '作弊拓展';
        header.appendChild(titleSpan);
        container.appendChild(header);

        // 標題與主體之間留白。
        container.appendChild(document.createElement('br'));

        // 主體容器。
        const main = document.createElement('div');
        main.className = 'CEDISPLAY';

        // 一級 / 二級標籤容器。
        const buttonBar = document.createElement('div');
        buttonBar.id = 'cheat_extended_options';
        buttonBar.className = 'CEbuttonBar';
        main.appendChild(buttonBar);

        // 功能內容共用渲染區。
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'CEDISPLAY_setting';
        const contentDiv = document.createElement('div');
        contentDiv.id = 'CE_settingsDiv';
        contentDiv.className = 'no-numberify';
        contentWrapper.appendChild(contentDiv);
        main.appendChild(contentWrapper);

        container.appendChild(main);

        // 將完整 CE 選單插入目前 macro 輸出。
        this.output.appendChild(container);

        // 下一幀建立兩級標籤 UI，再恢復上次選中的分類與功能。
        requestAnimationFrame(() => {
            CE_TabManager.render(buttonBar);

            // render() 內部負責事件、選中樣式與水平捲動。
            CE_TabManager.restore();


        });
    }
});

/****************************************
 * 兩種 CE 選單入口的渲染時序
 *
 * cheat_extended：
 * 1. 直接建立內嵌選單 DOM（標題、標籤容器、#CE_settingsDiv）。
 * 2. 掛入頁面後於下一幀呼叫 CE_TabManager.render()。
 * 3. render() 建立一級分類列與目前分類的二級 tab，並綁定點擊事件。
 * 4. CE_TabManager.restore() 恢復上次分類 / tab，並執行該 tab 的 onClick。
 *
 * title_cheatExtendedMenu：
 * 1. 先執行 <<setupTabs>> 完成 overlay 基礎初始化。
 * 2. 建立 CE 標籤容器並掛入 overlay。
 * 3. 下一幀呼叫 render()；再下一幀呼叫 restore()，避免 overlay 尚未完成佈局。
 *
 * 選中樣式、tab click、V.CE_LastCategory / V.CE_LastTab 記錄，以及
 * scrollIntoView 均由 CE_TabManager 內部處理，外層 macro 不再重複綁定。
 ****************************************/
 
/*=========================================
 Cheat Extended - Options System

 功能：
 1. 提供通用設定頁 UI（Macro.add）
 2. 提供設定項目註冊 API
 3. 支援其他模組自行註冊設定
 4. 自動初始化存檔預設值
 5. 使用 Renderer Factory 生成不同類型控制項

 支援類型：
 - checkbox
 - select
 - number
 - text
 - button
 - custom

 使用方式：
 setup.CE_registerOption({...});
 setup.CE_registerOptions([...]);

 Twine：
 <<CE_options>>
=========================================*/

(function () {
    "use strict";

    /* =====================
     * 設定註冊區
     * ===================== */

    setup.CE_options = setup.CE_options || [];

    // 註冊單一設定；同 key 會覆蓋，避免重複
    setup.CE_registerOption = function (option) {
        if (!option || !option.type) return;

        if (option.key) {
            const index = setup.CE_options.findIndex(o => o.key === option.key);

            if (index >= 0) {
                setup.CE_options[index] = option;
                return;
            }
        }

        setup.CE_options.push(option);
    };

    // 批次註冊設定
    setup.CE_registerOptions = function (options) {
        if (!Array.isArray(options)) return;
        options.forEach(setup.CE_registerOption);
    };

    /* =====================
     * 工具函式
     * ===================== */

    // 深拷貝預設值，避免 object / array 共用引用
    function cloneDefault(value) {
        if (Array.isArray(value)) return value.slice();

        if (value && typeof value === "object") {
            return JSON.parse(JSON.stringify(value));
        }

        return value;
    }

    // 初始化存檔變數
    function initDefault(option, V) {
        if (!option.key) return;

        if (V[option.key] === undefined) {
            V[option.key] = cloneDefault(option.default);
        }
    }

    // 建立 tooltip
    function makeTooltip(option) {
        if (!option.tooltip) return null;

        const mouse = document.createElement("mouse");
        mouse.className = "tooltip linkBlue";
        mouse.textContent = "(?)";

        const span = document.createElement("span");

        if (option.tooltipClass) {
            span.className = option.tooltipClass;
        }

        span.innerHTML = option.tooltip;
        mouse.appendChild(span);

        return mouse;
    }

    // 建立描述區
    function makeDesc(option) {
        const desc = document.createElement("div");
        desc.className = "small-description";
        desc.innerHTML = option.desc ?? "";
        return desc;
    }

    /* =====================
     * 控制項 Renderer
     * ===================== */

    setup.CE_optionRenderers = setup.CE_optionRenderers || {};

    setup.CE_optionRenderers.checkbox = function (option, ctx) {
        const { V } = ctx;

        const label = document.createElement("label");

        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = !!V[option.key];

        input.addEventListener("change", () => {
            V[option.key] = input.checked;
            option.onChange?.(input.checked, option, ctx);
        });

        const span = document.createElement("span");
        span.innerHTML = option.label ?? option.key;

        label.appendChild(input);
        label.appendChild(span);

        return label;
    };

    setup.CE_optionRenderers.select = function (option, ctx) {
        const { V } = ctx;

        const label = document.createElement("label");
        label.appendChild(document.createTextNode(option.label ?? ""));

        const select = document.createElement("select");

        (option.options ?? []).forEach(opt => {
            const el = document.createElement("option");
            el.value = opt.value;
            el.textContent = opt.text;
            el.selected = V[option.key] === opt.value;
            select.appendChild(el);
        });

        select.addEventListener("change", () => {
            V[option.key] = select.value;
            option.onChange?.(select.value, option, ctx);
        });

        label.appendChild(select);

        return label;
    };

    setup.CE_optionRenderers.number = function (option, ctx) {
        const { V } = ctx;

        const label = document.createElement("label");
        label.appendChild(document.createTextNode(option.label ?? ""));

        const input = document.createElement("input");
        input.type = "number";
        input.value = Number(V[option.key] ?? option.default ?? 0);

        if (option.min !== undefined) input.min = option.min;
        if (option.max !== undefined) input.max = option.max;
        if (option.step !== undefined) input.step = option.step;

        input.addEventListener("change", () => {
            let value = Number(input.value);

            if (Number.isNaN(value)) {
                value = Number(option.default ?? 0);
            }

            if (option.min !== undefined) value = Math.max(Number(option.min), value);
            if (option.max !== undefined) value = Math.min(Number(option.max), value);

            V[option.key] = value;
            input.value = value;

            option.onChange?.(value, option, ctx);
        });

        label.appendChild(input);

        return label;
    };

    setup.CE_optionRenderers.text = function (option, ctx) {
        const { V } = ctx;

        const label = document.createElement("label");
        label.appendChild(document.createTextNode(option.label ?? ""));

        const input = document.createElement("input");
        input.type = "text";
        input.value = V[option.key] ?? "";

        if (option.placeholder) {
            input.placeholder = option.placeholder;
        }

        input.addEventListener("change", () => {
            V[option.key] = input.value;
            option.onChange?.(input.value, option, ctx);
        });

        label.appendChild(input);

        return label;
    };

    setup.CE_optionRenderers.button = function (option, ctx) {
        const label = document.createElement("label");

        const button = document.createElement("button");
        button.textContent = option.label ?? "執行";

        button.addEventListener("click", () => {
            option.onClick?.(option, ctx);
        });

        label.appendChild(button);

        return label;
    };

    setup.CE_optionRenderers.custom = function (option, ctx) {
        option.render?.(ctx);
        return null;
    };

    /* =====================
     * CE_options Macro
     * ===================== */

    Macro.add("CE_options", {
        handler() {
            const V = State.variables;

            const root = document.createElement("div");
            root.className = "CE-options";

            const header = document.createElement("div");
            header.className = "settingsHeader options";

            const title = document.createElement("span");
            title.className = "gold";
            title.textContent = "--作弊拓展選項--";

            header.appendChild(title);
            root.appendChild(header);

            const grid = document.createElement("div");
            grid.className = "settingsGrid";
            root.appendChild(grid);

            const ctx = {
                V,
                root,
                grid,
                macro: this,
            };

            // 建立單一設定項
            function makeItem(option) {
                initDefault(option, V);

                const item = document.createElement("div");
                item.className = option.className ?? "settingsToggleItem";                     

                item.appendChild(makeDesc(option));

                const itemCtx = {
                    ...ctx,
                    item,
                    option,
                };

                const renderer = setup.CE_optionRenderers[option.type];

                if (renderer) {
                    const element = renderer(option, itemCtx);

                    if (element) {
                        item.appendChild(element);
                    }
                } else {
                    const warn = document.createElement("div");
                    warn.className = "red";
                    warn.textContent = `未知設定類型：${option.type}`;
                    item.appendChild(warn);
                }

                const tooltip = makeTooltip(option);

                if (tooltip) {
                    item.appendChild(tooltip);
                }

                item.appendChild(document.createElement("hr"));
                grid.appendChild(item);
            }

            // 建立所有已註冊設定
            (setup.CE_options ?? []).forEach(makeItem);

            /* =====================
             * 保存按鈕
             * ===================== */

            const saveWrap = document.createElement("div");

            const saveBtn = document.createElement("button");
            saveBtn.textContent = "保存設置";

            saveBtn.addEventListener("click", () => {
                Renderer?.Canvas?.queueRender?.();
                State.display(State.passage);
            });

            saveWrap.appendChild(saveBtn);
            grid.appendChild(saveWrap);

            this.output.appendChild(root);
        },
    });

})();

/*=========================================
 Cheat Extended - Default Options
=========================================*/

(function () {
    "use strict";

    setup.CE_registerOptions([
        {
            type: "select",
            key: "CE_langMode",
            id: "CE_optionsLang",
            default: "t",
            desc: "設定作弊拓展介面使用的中文顯示方式。",
            label: "介面語言：",
            options: [
                { value: "t", text: "繁體中文" },
                { value: "s", text: "简体中文" },
            ],
            tooltip: `
                繁體中文為作弊拓展的原始介面語言。<br>
                切換為簡體中文時，僅轉換作弊拓展介面的顯示文字，不會修改存檔中的文字內容。
            `,
            onChange() {
                window.CE_refreshLang?.();
            },
        },
        {
            type: "checkbox",
            key: "CE_forceEnableCheat",
            default: false,
            desc: "強制啟用作弊模式",
            label: "強制啟用作弊",
            tooltip: "啟用原版的作弊模式就不需要開，否則會出現兩個作弊按鈕。",
        },
        {
            type: "checkbox",
            key: "CE_sideBarIconEnable",
            default: false,
            desc: "啟用作弊拓展側邊Icon按鈕",
            label: "啟用側邊Icon按鈕",
            tooltip: "啟用後左側狀態欄收合時會出現作弊拓展的Icon按鈕",
        },
        {
            type: "checkbox",
            key: "CE_hideCEToggleDisable",
            default: false,
            desc: `<span class="red">禁用</span>作弊拓展狀態欄操作介面`,
            label: `<span class="red">禁用</span>狀態欄操作介面`,
            tooltip: "左側言靈集面板、左側快捷及空間節點功能勾選後將失去操作介面",
            tooltipClass: "red",
        },
        {
            type: "checkbox",
            key: "CE_menuSortEnable",
            default: false,
            desc: "設定作弊拓展目錄中的標籤順序與顯示狀態",
            label: "顯示作弊拓展標籤設定頁",
            tooltip: "在作弊拓展目錄最後新增「設定」標籤，可調整各標籤的顯示／隱藏與順序",
        },
        {
            type: "checkbox",
            key: "CE_featBypass",
            default: false,
            desc: `
                無視遊戲限制，強制啟用成就系統<br>
                目前無視下列條件：<br>
                作弊模式<br>
                調試模式
            `,
            label: "強制啟用成就系統",
            tooltip: "啟用後即使開啟作弊模式、曾經使用作弊成就被鎖、開啟調試模式等情況也能獲取成就",
        },
        {
            type: "checkbox",
            key: "CE_hideUiBarToggleEnable",
            default: false,
            desc: `
                隱藏畫布上的小箭頭、溫度計、防狼噴霧及避孕套 icon，讓畫面更乾淨<br>
                （不要問這和作弊有什麼關系，問就是因為開發者懶，不想從頭再打包一個模組）
            `,
            label: "隱藏左側狀態開啟/關閉按鈕",
            tooltip: "注意，開啟後手機端只能用滑動的方式開啟左側狀態欄（因為按鈕不見了）",
            tooltipClass: "red",
        },
        {
            type: "select",
            key: "CE_HeadMaskMode",
            default: "compat",
            desc: `
                頭部遮罩相容模式<br>
                用於修正新版頭部遮罩導致舊版頭部服裝模組顯示異常的問題。
            `,
            label: "頭部遮罩模式：",
            options: [
                { value: "compat", text: "相容模式：只保留手持物遮罩" },
                { value: "vanilla", text: "原版模式：使用新版完整頭部遮罩" },
                { value: "off", text: "關閉模式：完全不使用頭部遮罩" },
            ],
            tooltip: `
                相容模式建議給舊版服裝模組使用。<br>
                原版模式會套用新版 headMask。<br>
                關閉模式會完全不套用頭部遮罩。
            `,
            onChange() {
                Renderer?.Canvas?.queueRender?.();
            },
        },
        {
            type: "number",
            key: "CE_wardrobePageSize",
            default: 20,
            min: 1,
            max: 200,
            step: 1,
            desc: `
                設定衣櫃清單每頁顯示的服裝數量。<br>
                數量越大，單頁顯示的服裝項目越多，可能增加頁面載入時間。
            `,
            label: "衣櫃每頁顯示數量：",
            tooltip: `
                預設為 20。<br>
                建議手機端設定在 20～50 之間。                
            `,
    
        },
        {
	        type: "checkbox",
	        key: "CE_ForestMapGUI",
	        default: false,
	        desc: "在森林探索頁面顯示森林深度與已發現地點的簡易導覽圖。",
	        label: "顯示森林探索導覽圖",
	        tooltip: `
		        啟用後會在森林頁面頂部顯示森林探索深度與已發現地點。<br>
		        地點位置為概略標示，並非精確地圖座標。
	        `
        },
        {
	        type: "checkbox",
	        key: "CE_SewersMapGUI",
	        default: false,
	        desc: `
		        在下水道及相關地下探索區域顯示地圖 GUI。<br>
		        目前包含下水道與海岸洞穴。
	        `,
	        label: "啟用地下探索地圖",
	        tooltip: "在下水道與海岸洞穴等地下探索場景顯示目前位置、附近通道及已發現地點。",
        },
        {
	        type: "checkbox",
	        key: "CE_FarmRoadMapGUI",
	        default: false,
	        desc: "在鄉間道路及荒原探索場景上方顯示地圖",
	        label: "啟用鄉間道路與荒原地圖",
	        tooltip: "顯示目前所在的道路或荒原區域，並記錄已探索過的地點。"
        },        
    ]);

})();