

// ================================
// CE_EnemyState Macro（四捨五入版本）
// ================================
/*
 * Macro：CE_EnemyState
 * 用途：
 *  - 顯示敵方當前各項狀態的條狀 UI
 *  - 包含生命、性奋、愤怒、信任
 *
 * 設計重點：
 *  - 所有數值 → 先計算 → 再建立 DOM
 *  - 信任為「軟上限」：100 以上視覺上滿條，但數值仍可繼續成長
 */
Macro.add('CE_EnemyState', {
    handler() {

        /* ===== 狀態資料定義 =====
         * key   ：內部識別用（同時用於 class）
         * label ：UI 顯示名稱
         * value ：當前數值（來自 SugarCube 變數 V.）
         * max   ：顯示用最大值（信任為軟上限）
         */
        const states = [
            { key: 'health', label: '生命值', value: V.enemyhealth, max: V.enemyhealthmax },
            { key: 'arousal', label: '性奋', value: V.enemyarousal, max: V.enemyarousalmax },
            { key: 'anger',  label: '愤怒', value: V.enemyanger,  max: V.enemyangermax },
            { key: 'trust',  label: '信任', value: V.enemytrust,  max: 100 }, // 信任軟上限
        ];

        /* ===== 外層容器 ===== */
        const container = document.createElement('div');
        container.className = 'ce-enemy-state';

        /* ===== 逐一處理每個狀態 ===== */
        states.forEach(state => {

            /* --- 數值安全處理 ---
             *  - 四捨五入
             *  - 防止出現負值
             */
            let value = Math.max(Math.round(state.value), 0);
            let max   = Math.round(state.max);

            /* --- 條狀百分比計算 ---
             *  - 最大不超過 100%
             */
            let percent = Math.min(
                Math.round((value / max) * 100),
                100
            );

            /* --- 視覺相關變數 ---
             * color    ：填充顏色
             * trustLevel ：是否進入「爆表 / 軟上限」狀態
             * （注意：這裡只記錄狀態，不操作 DOM）
             */
            let color = '#888';
            let trustLevel = 0;
            let angerLevel = 0;

            /* ===== 狀態判斷與顏色邏輯 ===== */
            switch (state.key) {

                case 'health':
                    // 滿血綠 → 半血黃 → 低血紅
                    color = percent > 70 ? '#2ecc71'
                          : percent > 40 ? '#f1c40f'
                          : '#e74c3c';
                    break;

                case 'arousal':
                    // 高性奋深紫 → 低性奋淡紫
                    color = percent > 70 ? '#e056fd'
                          : percent > 40 ? '#be2edd'
                          : '#9b59b6';
                    break;
/*
                case 'anger':
                    // 高怒紅 → 中怒橘紅 → 低怒橘
                    color = percent > 70 ? '#e74c3c'
                          : percent > 40 ? '#f0932b'
                          : '#f5b041';
                    break;
*/
                case 'anger': {
                    const softMax = 100;
                    percent = Math.min(
                        Math.round((value / softMax) * 100),
                        100
                    );

                    

                    // 0 = 正常
                    // 1 = 爆怒（閃爍）
                    // 2 = 極怒（閃爍 + 脈衝）
                    if (value >= 200) {
                        angerLevel = 2;
                        color = '#c0392b'; // 深紅
                    } else if (value >= 100) {
                        angerLevel = 1;
                        color = '#e74c3c'; // 紅
                    } else {
                        color = percent > 70 ? '#e74c3c'
                        : percent > 40 ? '#f0932b'
                        : '#f5b041';
                    }
                    break;
                }
                
                case 'trust': {
                    /* 信任特殊處理：
                     *  - 沒有實際上限
                     *  - UI 使用 100 作為軟上限
                     */
                    const softMax = 100;
                    percent = Math.min(
                        Math.round((value / softMax) * 100),
                        100
                    );

                    
                    // 0 = 正常
                    // 1 = 滿信任（流動高光）
                    // 2 = 深度信任（高光 + 脈衝）
                    
                    if (value >= 200) {
                        trustLevel = 2;
                        color = '#1abc9c';
                    } else if (value >= 100) {
                        trustLevel = 1;
                        color = '#27ae60';
                    } else {
                        color = percent > 70 ? '#2ecc71'
                          : percent > 40 ? '#f1c40f'
                          : '#e67e22';
                    }
                    break;
                }
            }

            /* ===== DOM 建立區（此時才開始碰 DOM） ===== */

            // 每一行狀態的容器
            const row = document.createElement('div');
            row.className = `ce-enemy-state-row ce-enemy-state--${state.key}`;

            // 狀態名稱文字
            const labelSpan = document.createElement('span');
            labelSpan.className = 'ce-enemy-state-label';
            labelSpan.textContent = state.label;
            row.appendChild(labelSpan);

            // 條狀背景
            const barDiv = document.createElement('div');
            barDiv.className = 'ce-enemy-state-bar';

            // 條狀填充
            const fillDiv = document.createElement('div');
            fillDiv.className = 'ce-enemy-state-fill';
            fillDiv.style.width = percent + '%';
            fillDiv.style.background = color;

            // 若為信任爆表，追加特效 class
            if (trustLevel >= 1) {
                fillDiv.classList.add('trust-shine');
            }
            if (trustLevel >= 2) {
                fillDiv.classList.add('trust-pulse');
            }
            
            // 若為憤怒爆表，追加特效 class
            if (angerLevel >= 1) {
                fillDiv.classList.add('anger-shine');
            }
            if (angerLevel >= 2) {
                fillDiv.classList.add('anger-pulse');
            }

            barDiv.appendChild(fillDiv);
            row.appendChild(barDiv);

            // 除錯 / 數值顯示（可日後關閉）
            const debugDiv = document.createElement('div');
            debugDiv.className = 'ce-enemy-state-debug';
            debugDiv.textContent = `: ${value} / ${max}`;
            row.appendChild(debugDiv);

            // 將整行加入容器
            container.appendChild(row);
        });

        /* ===== 將整個狀態 UI 輸出到當前 passage ===== */
        this.output.appendChild(container);
    }
});

Macro.add('CE_NPCHealthBars', {
    handler: function() {
        if (!Array.isArray(V.NPCList)) return;

        // 過濾出有效 NPC（有 health 屬性）
        const validNPCs = V.NPCList.filter(npc => npc.health !== undefined && npc.health !== null);

        // 如果有效 NPC 不足 2 個，就不顯示
        if (validNPCs.length <= 1) return;

        const container = document.createElement('div');
        container.className = 'ce-npc-healthbars-container';

        // 折疊按鈕
        const toggleButton = document.createElement('button');
        toggleButton.textContent = '∇複數敵人生命值';
        toggleButton.style.padding = '2px 6px';
        toggleButton.style.fontSize = '0.8em';
        toggleButton.style.marginBottom = '2px';
        toggleButton.onclick = () => {
            const content = container.querySelector('.ce-npc-healthbars-content');
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        };
        container.appendChild(toggleButton);

        // 內容區域
        const contentDiv = document.createElement('div');
        contentDiv.className = 'ce-npc-healthbars-content';
        contentDiv.style.display = 'none';
        container.appendChild(contentDiv);

        // 每個有效 NPC 血條
        validNPCs.forEach((npc, i) => {
            const value = Math.max(0, Math.round(npc.health)); 
            const max   = Math.max(1, Math.round(npc.healthmax || 100)); 
            const percent = Math.min(100, Math.round((value / max) * 100));
            const name = npc.fullDescription || `NPC ${i+1}`;

            const row = document.createElement('div');
            row.className = 'ce-enemy-state-row ce-enemy-state--health';

            const label = document.createElement('span');
            label.className = 'ce-enemy-state-label';
            label.textContent = `${name} 的生命值`;
            row.appendChild(label);                       

            const bar = document.createElement('div');
            bar.className = 'ce-enemy-state-bar';

            const fill = document.createElement('div');
            fill.className = 'ce-enemy-state-fill';
            fill.style.width = percent + '%';
            // 統一顏色邏輯：綠 >70%，黃 >40%，紅 <=40%
            fill.style.background = percent > 70 ? '#2ecc71' : percent > 40 ? '#f1c40f' : '#e74c3c';

            bar.appendChild(fill);
            row.appendChild(bar);

            // 可選：顯示 DEBUG 值
            const debugDiv = document.createElement('div');
            debugDiv.className = 'ce-enemy-state-debug';
            debugDiv.textContent = `: ${value} / ${max}`;
            row.appendChild(debugDiv);

            contentDiv.appendChild(row);
        });

        this.output.append(container);
    }
});

(function () {

    // ================================
    // 在第 3 個 div 開頭插入 CE 容器（支援多個 slot）
    // ================================
    function insertCEContainerAtThirdDiv(slotId) {
        const passageContent = document.getElementById('passage-content');
        if (!passageContent) return null;

        // 只抓直屬 div
        const divs = passageContent.querySelectorAll(':scope > div');
        if (!divs[2]) return null;

        const targetDiv = divs[2];

        // 防止重複插入同 id
        if (targetDiv.querySelector(`#${slotId}`)) return null;

        const container = document.createElement('div');
        container.className = 'ce-enemy-state-container';

        const slot = document.createElement('div'); // 改成 div
        slot.id = slotId;
        container.appendChild(slot);

        targetDiv.insertBefore(container, targetDiv.firstChild);

        console.log(`[cheat Extended][EnemyStateBar] 容器已插入 id=${slotId}`);
        return slot;
    }

    // ================================
    // passage 顯示後執行
    // ================================
    $(document).on(':passagedisplay', () => {

        if (V.combat !== 1) return;
        if (V.stalk === true) return;
        if (!V.CE_EnemyStateEnable) return;
       
        // 開始堆疊widget，最後插入的會顯示在最上面
        
        // 第二個 widget（NPC血條，僅在 NPCList.length > 1）
        const validNPCs = V.NPCList.filter(npc => npc.health !== undefined && npc.health !== null);
        
        if (validNPCs.length > 1) {
            const slotNPC = insertCEContainerAtThirdDiv('CE_EnemyState_Slot_NPC');
            if (slotNPC) {               
                new Wikifier(slotNPC, `<<CE_NPCHealthBars>>`);
            }
        }
        
         // 第一個 widget（全局狀態）
        const slotGlobal = insertCEContainerAtThirdDiv('CE_EnemyState_Slot_Global');
        if (slotGlobal) {
            new Wikifier(slotGlobal, '<<CE_EnemyState>>');
        }

    });

})();