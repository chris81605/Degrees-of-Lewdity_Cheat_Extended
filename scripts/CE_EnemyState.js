

// ================================
// CE_EnemyState Macro（四捨五入版本）
// ================================
Macro.add('CE_EnemyState', {
    handler() {
        // 各狀態定義
        const states = [
            { key: 'health', label: '生命值', value: V.enemyhealth, max: V.enemyhealthmax },
            { key: 'arousal', label: '性奋', value: V.enemyarousal, max: V.enemyarousalmax },
            { key: 'anger', label: '愤怒', value: V.enemyanger, max: V.enemyangermax },
            { key: 'trust', label: '信任', value: V.enemytrust, max: 250 }, // 信任最大值 250
        ];

        const container = document.createElement('div');
        container.className = 'ce-enemy-state';

        states.forEach(state => {
            // 四捨五入並避免負值
            let value = Math.max(Math.round(state.value), 0);
            let max   = Math.round(state.max);
            let percent = Math.min(Math.round((value / max) * 100), 100);

            // 顏色邏輯
            let color;
            switch(state.key) {
                case 'health':
                // 滿血綠色，半血黃色，低血紅色
                color = percent > 70 ? '#2ecc71' : percent > 40 ? '#f1c40f' : '#e74c3c';
                break;
                
                case 'arousal':
                // 高性奋紅紫色，低性奋淡紫色
                color = percent > 70 ? '#e056fd' : percent > 40 ? '#be2edd' : '#9b59b6';
                break;
                
                case 'anger':
                 // 高怒橘紅，低怒橘色
                color = percent > 70 ? '#e74c3c' : percent > 40 ? '#f0932b' : '#f5b041';
                break;
                
                case 'trust':
                // 高信任綠色，低信任黃橙
                color = percent > 70 ? '#2ecc71' : percent > 40 ? '#f1c40f' : '#e67e22';
                break;
                
                default:
                color = '#888';
}

            // DOM 建立
            const row = document.createElement('div');
            row.className = `ce-enemy-state-row ce-enemy-state--${state.key}`;

            const labelSpan = document.createElement('span');
            labelSpan.className = 'ce-enemy-state-label';
            labelSpan.textContent = state.label;
            row.appendChild(labelSpan);

            const barDiv = document.createElement('div');
            barDiv.className = 'ce-enemy-state-bar';

            const fillDiv = document.createElement('div');
            fillDiv.className = 'ce-enemy-state-fill';
            fillDiv.style.width = percent + '%';
            fillDiv.style.background = color;

            barDiv.appendChild(fillDiv);
            row.appendChild(barDiv);

            const debugDiv = document.createElement('div');
            debugDiv.textContent = `: ${value} / ${max}`;
            row.appendChild(debugDiv);

            container.appendChild(row);
        });

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