// 抄作業就完事了！
function CEiconClicked() {
    $.wiki("<<CEoverlayReplace \"CEcheatMenu\">>");
}
window.CEiconClicked = CEiconClicked;

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
                const firstTab = this.tabs.find(t => !t.condition || t.condition());
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
        { id: 'quickTab', title: '左側快捷', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<swich>><</replace>>`) },
        { id: 'teleport', title: '空間節點', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<swich_teleportation>><</replace>>`) },
        { id: 'yanling', title: '言靈集', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<swich_yanling>><</replace>>`) },
        { id: 'statControl', title: '狀態控制', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<CE_statControlPanel>><</replace>>`) },
        { id: 'purity', title: '純潔永駐', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<CE_purityControl>><</replace>>`) },
        { id: 'damage', title: '傷害倍數', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<CE_damageMultiplier>><</replace>>`) },
        { id: 'violence', title: '疼痛衰減', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<CE_violenceControl>><</replace>>`) },
        { id: 'hpap', title: 'HP、AP顯示', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<swich_HP_AP_display>><</replace>>`) },
        { id: 'milk', title: '大量擠🥛模式', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<milk_released_setting>><</replace>>`) },
        { id: 'semen', title: '大爆🐍模式', condition: () => V.player?.penisExist || V.debug, onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<semen_released_setting>><</replace>>`) },
        { id: 'blackStore', title: '黑心商店', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<black_stores_setting>><</replace>>`) },
        { id: 'money', title: '收支倍率調整', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<CE_moneyCheat>><</replace>>`) },
        { id: 'danceReward', title: '跳舞報酬加倍', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<dance_reward_setting>><</replace>>`) },
        { id: 'brothelReward', title: '尋歡洞報酬加倍', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<brothel_basement_setting>><</replace>>`) },
        { id: 'timeMultiplier', title: '時間流速控制', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<CE_timeMultiplier>><</replace>>`) },
        { id: 'timeTravel', title: '時空穿越', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<CE_TimeTravelPlus>><</replace>>`) },
        { id: 'debugMode', title: 'DEBUG MODE', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<swich_DEBUG_MODE>><</replace>>`) },
        { id: 'study', title: '用功學習', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<study_hard_mod>><</replace>>`) },
        { id: 'wardrobe', title: '大容量衣櫃', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<bigest_wardrobe_mod>><</replace>>`) },
        { id: 'pcRepair', title: 'Pc縫衣中', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<CE_autoRepairClothesUI>><</replace>>`) },
        { id: 'allClothes', title: '一鍵添加所有服裝+', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<CE_getAllClothes_new>><</replace>>`) },
        { id: 'voidCreate', title: '虛空創造', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<CE_inventory_helper>><</replace>>`) },
        { id: 'magicCircuit', title: '魔術迴路', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<CE_tattoo>><</replace>>`) },
        { id: 'pcPreg', title: 'PC懷孕', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<CE_Pregnancy>><</replace>>`) },
        { id: 'parasitePreg', title: '寄生物懷孕控制', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<CE_parasiteControl>><</replace>>`) },
        { id: 'autoWarm', title: '自動調溫', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<auto_clothes_Warmth>><</replace>>`) },
        { id: 'quickYanling', title: '快速言靈', onClick: () => Wikifier.wikifyEval(`<<replace #CE_settingsDiv>><<quick_yanling>><</replace>>`) },

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