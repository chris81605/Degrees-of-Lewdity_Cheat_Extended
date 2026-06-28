// 右側折疊狀態欄icon入口
// 抄作業就完事了！
function CEiconClicked() {
    $.wiki("<<CEoverlayReplace \"CEcheatMenu\">>");
}
window.CEiconClicked = CEiconClicked;

// 檢測simple framework 存在則顯示右側狀態欄icon(sf框架專用)
// sf框架需要另一種方式插入icon
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

                const btn = document.createElement("span");

                btn.className = "dol-btn";
                btn.textContent = label;
                btn.onclick = onClick;

                Object.assign(btn.style, {
                    cursor: "pointer",
                    display: "inline-block"
                });

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

                const toggleWrap = createEl("div", "dol-btn fit");
                const listWrap = document.createElement("div");

                toggleWrap.id = "CE_Toggle";
                listWrap.id = "CEstatebox";

                const toggleBtn = createButton("作弊拓展", () => {

                    V.CE_Toggle = V.CE_Toggle == 0 ? 1 : 0;
                    refresh();

                });

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
                    list.appendChild(document.createElement("hr"));
                    renderWiki(list, "<<CE_TeleportationSimplePanel>>", "空間節點 UI 渲染失敗");
                }

                if (V.swich_yanling) {
                    list.appendChild(document.createElement("hr"));
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
 * 專門顯示 cheat Extended 模組版本
 * 使用 div 並內嵌樣式
 * 不要問為啥放在這
 * ========================================= */
Macro.add('CE_CheatExtendedVersion', {
    handler: function() {
        var version = window.modUtils.getMod('cheat extended').version;
        var div = document.createElement('div');
        div.textContent = 'CE v' + version;
        div.id = 'CE-cheatExtended-version';
        
        /* 位置設定：畫面底部置中 */
        div.style.position = 'fixed';
        div.style.left = '50%';
        div.style.bottom = '5px';
        div.style.transform = 'translateX(-50%)';
        div.style.zIndex = '9999';

        /* 外觀設定 */
        div.style.fontSize = '8.8px';
        div.style.color = 'rgb(119,119,119)';
        div.style.opacity = '0.8';
        div.style.whiteSpace = 'nowrap';
        div.style.pointerEvents = 'none'; // 不擋點擊

        document.body.appendChild(div);
    }
});

/* =========================================
 * 作弊拓展目錄註冊
 * 用於註冊各個功能設定UI
 * ========================================= */
(() => {
    // CE_TabManager 物件：管理所有自訂 tab 的註冊、渲染、排序等功能
    const CE_TabManager = {
        tabs: [],           // 存放所有已註冊的 tab 物件
        _btnMap: {},        // tabId → button DOM 映射，用於 restore 上次選中 tab
        _sortWrap: null,    // 排序 UI 容器 DOM
        _defaultOrder: null,// 預設 tab 註冊順序（用於還原）

        /**
         * 註冊 tab
         * @param {object} tab - 包含 id, title, onClick, condition 等欄位
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

        /**
         * 渲染 tab 按鈕到指定容器
         * 規則：
         *  1. ⭐ 我的最愛 tab 會優先顯示
         *  2. 其餘 tab 依排序順序顯示
         *  3. 隱藏 / condition 不符的 tab 不顯示
         *  4. 排序管理 tab 永遠顯示在最後
         */
        render(container) {
            this.applyOrder();
            container.innerHTML = '';
            this._btnMap = {};

            // 初始化狀態表
            V.CE_TabHidden = V.CE_TabHidden || {};
            V.CE_TabFavorite = V.CE_TabFavorite || {};

            const favorites = []; // ⭐ 我的最愛 tab
            const normals = [];   // 一般 tab

            // 將 tab 分類（最愛 / 一般）
            this.tabs.forEach(tab => {
                if (tab.id === 'tabSort') return;
                if ((tab.condition && !tab.condition()) || V.CE_TabHidden[tab.id]) return;

                if (V.CE_TabFavorite[tab.id]) favorites.push(tab);
                else normals.push(tab);
            });

            /**
             * 建立並渲染單一 tab 按鈕
             */
            const renderTab = (tab) => {
                const btn = document.createElement('button');
                
                // 給加入最愛的按鈕標題增加 ⭐
                // btn.textContent = tab.title; 
                btn.textContent = V.CE_TabFavorite[tab.id]
                    ? `⭐ ${tab.title}`
                    : tab.title;
                /*
                給加入最愛的按鈕背景加入特殊樣式
                if (V.CE_TabFavorite[tab.id]) {
                    btn.classList.add('ce-tab-favorite');
                }
                */    
                    
                btn.dataset.tabId = tab.id;
                btn.onclick = () => {
                    tab.onClick?.();          // 執行 tab 功能
                    V.CE_LastTab = tab.id;    // 記錄最後點擊 tab
                };
                this._btnMap[tab.id] = btn;
                container.appendChild(btn);
            };

            // ⭐ 先渲染最愛
            favorites.forEach(renderTab);
            // 分割線
            if (favorites.length > 0 && normals.length > 0) {
                const separator = document.createElement('span');
                separator.className = 'ce-tab-separator';
                separator.textContent = '|';
                container.appendChild(separator);
            }
            
            // 再渲染一般 tab
            normals.forEach(renderTab);
            //分隔線
            if (V.CE_menuSortEnable || V.debug > 0) {
                const separator = document.createElement('span');
                separator.className = 'ce-tab-separator';
                separator.textContent = '|';
                container.appendChild(separator);
            }
            
            // 最後渲染排序管理 tab（固定不參與排序）
            const tabSort = this.tabs.find(t => t.id === 'tabSort');
            if (tabSort && (!tabSort.condition || tabSort.condition())) {
                renderTab(tabSort);
            }
        },

        /**
         * 恢復上次選中的 tab
         * 若不存在則選第一個可用 tab
         */
        restore() {
            let tabId = V.CE_LastTab;
            if (!tabId || !this._btnMap[tabId]) {
                const firstTab = this.tabs.find(t => (!t.condition || t.condition()) && !V.CE_TabHidden?.[t.id]);
                if (!firstTab) return;
                tabId = firstTab.id;
            }
            this._btnMap[tabId]?.click();
        },

        /**
         * 打開 tab 排序 / 管理 UI 對話框
         * 功能：
         *  1. ▲▼ 調整 tab 順序（不含排序管理按鈕）
         *  2. ☑ 控制 tab 顯示 / 隱藏
         *  3. ⭐ 設定我的最愛（顯示時優先）
         *  4. 還原預設順序
         */
        openSortUI() {
            if (this._sortWrap) {
                Dialog.close();
                this._sortWrap = null;
            }

            Dialog.setup('⚙️調整標籤順序 / 最愛');
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
            wrap.style.maxHeight = '400px';
            wrap.style.overflowY = 'auto';
            body.appendChild(wrap);
            this._sortWrap = wrap;

            // 初始化狀態表
            V.CE_TabHidden = V.CE_TabHidden || {};
            V.CE_TabFavorite = V.CE_TabFavorite || {};

            // 說明文字
            const info = document.createElement('div');
            info.style.marginBottom = '8px';
            info.style.fontSize = '0.85rem';
            info.style.color = '#666';
            info.textContent = '☑ ⭐ 最愛會顯示在最前｜☑ 控制顯示｜▲▼ 調整順序（排序按鈕不參與）';
            wrap.appendChild(info);

            // 還原預設排序按鈕
            const restoreBtn = document.createElement('button');
            restoreBtn.textContent = '還原預設順序';
            restoreBtn.onclick = () => {
                this.tabs.sort((a, b) =>
                    this._defaultOrder.indexOf(a.id) - this._defaultOrder.indexOf(b.id)
                );
                this.saveOrder();
                wrap.innerHTML = '';
                this.openSortUI();
            };
            wrap.appendChild(restoreBtn);

            // 建立每個 tab 的設定 row
            this.tabs.forEach(tab => {
                if (tab.id === 'tabSort') return;

                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.gap = '4px';
                row.style.marginBottom = '4px';

                /**
                 * ⭐ 我的最愛
                 * 只影響顯示優先順序，不影響排序
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
                label.style.flex = '1';
                row.appendChild(label);

                /**
                 * ▲ 上移
                 */
                const up = document.createElement('button');
                up.textContent = '▲';
                up.onclick = () => {
                    const sortable = this.tabs.filter(t => t.id !== 'tabSort');
                    const idx = sortable.indexOf(tab);
                    if (idx === 0) return;

                    const a = this.tabs.indexOf(tab);
                    const b = this.tabs.indexOf(sortable[idx - 1]);
                    [this.tabs[a], this.tabs[b]] = [this.tabs[b], this.tabs[a]];
                    this.saveOrder();

                    const prev = row.previousElementSibling;
                    if (prev) wrap.insertBefore(row, prev);
                };

                /**
                 * ▼ 下移
                 */
                const down = document.createElement('button');
                down.textContent = '▼';
                down.onclick = () => {
                    const sortable = this.tabs.filter(t => t.id !== 'tabSort');
                    const idx = sortable.indexOf(tab);
                    if (idx === sortable.length - 1) return;

                    const a = this.tabs.indexOf(tab);
                    const b = this.tabs.indexOf(sortable[idx + 1]);
                    [this.tabs[a], this.tabs[b]] = [this.tabs[b], this.tabs[a]];
                    this.saveOrder();

                    const next = row.nextElementSibling?.nextElementSibling;
                    wrap.insertBefore(row, next || null);
                };

                row.append(up, down);
                wrap.appendChild(row);
            });

            Dialog.open(() => {
                this._sortWrap = null;
            });
        }
    };

    // 將 CE_TabManager 暴露到全局 window，避免被覆蓋
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
        { id: 'CE_YanlingPanel', title: '言靈集', /*condition: () => V.debug,*/ onClick: () => CE_renderSettings('<<CE_YanlingPanel>>') },
        { id: 'CE_TeleportationPanel', title: '空間節點', /*condition: () => V.debug,*/ onClick: () => CE_renderSettings('<<CE_TeleportationPanel>>') },
        { id: 'CE_QuickPanelSettings', title: '快捷面板', /*condition: () => V.debug,*/ onClick: () => CE_renderSettings('<<CE_QuickPanelSettings>>') },
        // =======================
        
        { id: 'statControl', title: '狀態控制', onClick: () => CE_renderSettings('<<CE_statControlPanel>>') },
        { id: 'purity', title: '純潔永駐', onClick: () => CE_renderSettings('<<CE_purityControl>>') },
        { id: 'damage', title: '傷害倍數', onClick: () => CE_renderSettings('<<CE_damageMultiplier>>') },
        { id: 'violence', title: '疼痛衰減', onClick: () => CE_renderSettings('<<CE_violenceControl>>') },
        { id: 'hpap', title: 'HP、AP顯示', onClick: () => CE_renderSettings('<<swich_HP_AP_display>>') },
        { id: 'milk', title: '大量擠🥛模式', onClick: () => CE_renderSettings('<<milk_released_setting>>') },
        { id: 'semen', title: '大爆🐍模式', condition: () => V.player?.penisExist || V.debug, onClick: () => CE_renderSettings('<<semen_released_setting>>') },
        { id: 'blackStore', title: '黑心商店', onClick: () => CE_renderSettings('<<black_stores_setting>>') },
        { id: 'money', title: '收支倍率調整', onClick: () => CE_renderSettings('<<CE_moneyCheat>>') },
        { id: 'danceReward', title: '跳舞報酬加倍', onClick: () => CE_renderSettings('<<dance_reward_setting>>') },
        { id: 'brothelReward', title: '尋歡洞報酬加倍', onClick: () => CE_renderSettings('<<brothel_basement_setting>>') },
        { id: 'timeMultiplier', title: '時間流速控制', onClick: () => CE_renderSettings('<<CE_timeMultiplier>>') },
        { id: 'timeTravel', title: '時空穿越', onClick: () => CE_renderSettings('<<CE_TimeTravelPlus>>') },
        { id: 'debugMode', title: 'DEBUG MODE', onClick: () => CE_renderSettings('<<swich_DEBUG_MODE>>') },
        { id: 'study', title: '用功學習', onClick: () => CE_renderSettings('<<study_hard_mod>>') },
        { id: 'wardrobe', title: '大容量衣櫃', onClick: () => CE_renderSettings('<<bigest_wardrobe_mod>>') },
        { id: 'pcRepair', title: 'Pc縫衣中', onClick: () => CE_renderSettings('<<CE_autoRepairClothesUI>>') },
        { id: 'allClothes', title: '一鍵添加所有服裝+', onClick: () => CE_renderSettings('<<CE_getAllClothes_new>>') },
        { id: 'voidCreate', title: '虛空創造', onClick: () => CE_renderSettings('<<CE_inventory_helper>>') },
        { id: 'magicCircuit', title: '魔術迴路', onClick: () => CE_renderSettings('<<CE_tattoo>>') },
        { id: 'pcPreg', title: 'PC懷孕', onClick: () => CE_renderSettings('<<CE_Pregnancy>>') },
        { id: 'parasitePreg', title: '寄生物懷孕控制', onClick: () => CE_renderSettings('<<CE_parasiteControl>>') },
        { id: 'autoWarm', title: '自動調溫', onClick: () => CE_renderSettings('<<auto_clothes_Warmth>>') },
        { id: 'quickYanling', title: '快速言靈', onClick: () => CE_renderSettings('<<quick_yanling>>') },
        { id: 'farmCheat', title: '农场助手', onClick: () => CE_renderSettings(`<<CE_farmCheatPanel>>`) },
        { id: 'featUnlocker', title: '成就解锁器', onClick: () => CE_renderSettings(`<<CE_FeatUnlockerPanel>>`) },

        // 排序 UI 按鈕，不參與排序，只用於打開排序對話框
        { id: 'tabSort', title: '⚙️標籤頁管理', condition: () => V.CE_menuSortEnable || V.debug, onClick: () => CE_TabManager.openSortUI() }
    ];

    // 將每個 tab 註冊到 CE_TabManager
    tabs.forEach(tab => CE_TabManager.register(tab));
})();

/****************************************
 * title_cheatExtendedMenu macro
 ****************************************/

/*用於CEoverlayReplace將CE功能按鈕顯示在原版彈窗的按鈕列*/

Macro.add("title_cheatExtendedMenu", {
    handler() {
        // 1. 呼叫原本 widget，用於初始化 tabs 內容（原版叫出彈窗都有這個步驟，具體功能不明）
        Wikifier.wikifyEval("<<setupTabs>>", this.output);

        // 2. 建立 tabs 按鈕容器
        const container = document.createElement("div");
        container.id = "cheat_extended_options";
        container.className = "CEtab"; // 保留原樣式，不影響其他地方
        this.output.append(container);

        // 3. 找到 overlay 的內容容器，保證後續操作有依附的 DOM
        const content = document.getElementById("customOverlayContent");
        if (!content) throw new Error("#customOverlayContent not found");

        // 4. 確保 CE_TabManager 已存在
        if (window.CE_TabManager) {
            // 5. 使用 requestAnimationFrame 延遲執行，確保 DOM 元素已渲染到頁面
            requestAnimationFrame(() => {
                CE_TabManager.render(container); // 生成 tab 按鈕

                const buttons = container.querySelectorAll("button"); // 找到所有按鈕

                // 6. 先移除所有舊的選中樣式
                buttons.forEach(btn => btn.classList.remove("CEtabSelected"));

                // 7. 監聽每個按鈕的點擊事件
                buttons.forEach(btn => {
                    btn.addEventListener("click", () => {
                        buttons.forEach(b => b.classList.remove("CEtabSelected")); // 移除其他按鈕的選中
                        btn.classList.add("CEtabSelected"); // 當前按鈕套用選中樣式
                        btn.scrollIntoView({ behavior: `smooth`, inline: `center`, block: 'nearest' }); // 滾動到視窗中
                    });
                });

                // 8. 再次使用 requestAnimationFrame，確保按鈕已完全渲染
                requestAnimationFrame(() => {
                    CE_TabManager.restore(); // 調用 restore 點擊最後選中的 tab
                });

                // 9. 套用上次選中 tab 的按鈕樣式
                const lastTabId = V.CE_LastTab;
                const selectedBtn = Array.from(buttons).find(btn => btn.dataset.tabId === lastTabId);
                if (selectedBtn) {
                    selectedBtn.classList.add("CEtabSelected");
                    selectedBtn.scrollIntoView({ behavior: `smooth`, inline: `center`, block: 'nearest' });
                }
            });
        }

        // 10. 自製關閉按鈕（原版的關閉按鈕調用失敗直接自己做一個）
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


// 用於顯示在作弊選單裡，包含整個目錄的完整結構
Macro.add('cheat_extended', {
    handler() {
        const container = document.createElement('div');

        // 1. 上方 HR
        const hr = document.createElement('hr');
        container.appendChild(hr);

        // 2. 標題
        const header = document.createElement('div');
        header.className = 'settingsHeader options';
        const titleSpan = document.createElement('span');
        titleSpan.className = 'gold';
        titleSpan.textContent = '作弊拓展';
        header.appendChild(titleSpan);
        container.appendChild(header);

        // 3. 空行
        container.appendChild(document.createElement('br'));

        // 4. 主體容器
        const main = document.createElement('div');
        main.className = 'CEDISPLAY';

        // 5. 按鈕列容器
        const buttonBar = document.createElement('div');
        buttonBar.id = 'cheat_extended_options';
        buttonBar.className = 'CEbuttonBar';
        main.appendChild(buttonBar);

        // 6. 下方內容區
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'CEDISPLAY_setting';
        const contentDiv = document.createElement('div');
        contentDiv.id = 'CE_settingsDiv';
        contentDiv.className = 'no-numberify';
        contentWrapper.appendChild(contentDiv);
        main.appendChild(contentWrapper);

        container.appendChild(main);

        // 7. 插入到頁面
        this.output.appendChild(container);

        // 8. 渲染 TabManager 並處理按鈕樣式
        requestAnimationFrame(() => {
            CE_TabManager.render(buttonBar);

            const btns = buttonBar.querySelectorAll('button');

            // 點擊事件監聽：套用選中樣式 & 滾動
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    btns.forEach(b => b.classList.remove('CEbuttonBarSelected'));
                    btn.classList.add('CEbuttonBarSelected');
                    btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                });
            });

            // 9. restore 上次選擇的 tab
            CE_TabManager.restore();

            // 10. 套用上次選中按鈕樣式
            const lastTabId = V.CE_LastTab;
            const selectedBtn = Array.from(btns).find(btn => btn.dataset.tabId === lastTabId);
            if (selectedBtn) selectedBtn.classList.add('CEbuttonBarSelected');
            if (selectedBtn) selectedBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
    }
});

/****************************************
 * 時序註解（放在檔尾）
 *
 * cheat_extended 宏：
 * 1️⃣ 宏開始執行，生成完整 DOM 結構：
 *      - 上方 HR
 *      - 標題
 *      - 按鈕列 container
 *      - 下方內容區 (#CE_settingsDiv)
 * 2️⃣ 將 container 插入到頁面 (this.output.append)
 * 3️⃣ requestAnimationFrame：
 *      - CE_TabManager.render(buttonBar)：生成按鈕
 *      - 遍歷按鈕綁定 click 事件：
 *          • 移除其他按鈕的選中樣式
 *          • 套用當前按鈕選中樣式
 *          • 滾動到中間位置 (scrollIntoView)
 *      - CE_TabManager.restore()：呼叫最後選中的 tab onClick
 *      - 根據 V.CE_LastTab 套用選中按鈕樣式
 *      - scrollIntoView 保證按鈕置中
 *
 * title_cheatExtendedMenu 宏：
 * 1️⃣ 宏開始執行，先呼叫 <<setupTabs>>，生成 overlay 基本內容
 * 2️⃣ 在 overlay 裡插入 tabs 按鈕 container
 * 3️⃣ requestAnimationFrame：
 *      - CE_TabManager.render(container)：生成按鈕
 *      - 遍歷按鈕綁定 click 事件（套用選中樣式 + 滾動）
 *      - requestAnimationFrame（二層）：
 *          • 保證按鈕完全生成後，呼叫 CE_TabManager.restore()
 *          • 套用最後選中按鈕樣式
 *          • scrollIntoView 保證置中
 *
 * 🔑 注意事項：
 * - restore 必須在按鈕完全生成後呼叫，否則會報錯或找不到按鈕
 * - click 事件監聽必須先綁定，再 restore，才能正確套用樣式
 * - scrollIntoView 使用 inline:'center', block:'nearest' 避免垂直滾動影響 macro 本身位置
 * - cheat_extended 宏只需單層 requestAnimationFrame
 * - title_cheatExtendedMenu 宏需兩層 requestAnimationFrame 確保 overlay DOM 已渲染完成
 ****************************************/
 
/*=========================================
 Cheat Expansion - Options System

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
 Cheat Expansion - Default Options
=========================================*/

(function () {
    "use strict";

    setup.CE_registerOptions([
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
    ]);

})();