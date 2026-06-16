// ================================
// CE 轉化每日增加模組
// ================================
const CE_TransformationDailyGain = (() => {

    // =========================
    // 設定表
    // =========================
    const config = [
        { key: "angel",       label: "天使",   group: "divine", buildVar: "angelbuild" },
        { key: "fallenangel", label: "堕天使", group: "divine", buildVar: "fallenbuild" },
        { key: "demon",       label: "恶魔",   group: "divine", buildVar: "demonbuild" },
        { key: "wolf",        label: "狼",     group: "beast",  buildVar: "wolfbuild" },
        { key: "cat",         label: "猫",     group: "beast",  buildVar: "catbuild" },
        { key: "cow",         label: "奶牛",   group: "beast",  buildVar: "cowbuild" },
        { key: "bird",        label: "哈比",     group: "beast",  buildVar: "birdbuild" },
        { key: "fox",         label: "狐狸",   group: "beast",  buildVar: "foxbuild" }
    ];

    // =========================
    // 互斥邏輯
    // =========================
    function handleExclusiveToggle(currentKey, group) {
        config.forEach(cfg => {
            if (cfg.group === group && cfg.key !== currentKey) {
                V[`CE_${cfg.key}BuildDailyGainEnabled`] = false;
            }
        });
    }

    // =========================
    // 註冊每日事件
    // =========================
    config.forEach(cfg => {
        const enabledVar = `CE_${cfg.key}BuildDailyGainEnabled`;
        const amountVar  = `CE_${cfg.key}BuildDailyGainAmount`;
        
        // registerCE_genericTimeEvent已在CE_Time_Event.js定義 
        registerCE_genericTimeEvent(
            "onDay",
            `CE_${cfg.label}轉化點數每日增加`,
            () => {
                if (V[enabledVar] === undefined) V[enabledVar] = false;
                if (!V[enabledVar]) return;

                if (!Number.isFinite(V[amountVar])) V[amountVar] = 1;

                V[cfg.buildVar] = Number.isFinite(V[cfg.buildVar])
                    ? V[cfg.buildVar]
                    : 0;

                V[cfg.buildVar] = Math.min(
                    100,
                    V[cfg.buildVar] + Math.max(0, V[amountVar])
                );
            }
        );
    });

    // =========================
    // UI Macro
    // =========================
    Macro.add("CE_TransformationDailyGainSettings", {
        handler() {
            const frag = document.createDocumentFragment();

            // 外框
            const wrapper = document.createElement("div");
            wrapper.className = "dol-settings dol-shadow";

            // 總標題
            const header = document.createElement("div");
            header.className = "dol-header";
            const title = document.createElement("span");
            title.className = "dol-title";
            title.textContent = "額外轉化點數";
            header.appendChild(title);
            wrapper.appendChild(header);

            // dol-body
            const body = document.createElement("div");
            body.className = "dol-body";

            // 功能敘述
            const desc = document.createElement("div");
            desc.className = "dol-desc";
            desc.textContent = "這裡可以設定所有轉化的每日額外增加量（不影響原版每日結算），神魔系與動物系只能分別啟用一個。";
            body.appendChild(desc);
            body.appendChild(document.createElement("br"));

            // 各轉化設定面板
            config.forEach(cfg => {
                const enabledVar = `CE_${cfg.key}BuildDailyGainEnabled`;
                const amountVar  = `CE_${cfg.key}BuildDailyGainAmount`;

                if (V[enabledVar] === undefined) V[enabledVar] = false;
                if (!Number.isFinite(V[amountVar])) V[amountVar] = 1;

                // 轉化說明
                const panelDesc = document.createElement("div");
                panelDesc.className = "dol-desc";
                panelDesc.textContent =
                    cfg.group === "divine"
                        ? `💠 ${cfg.label}（神魔系轉化僅能啟用一種每日增加）`
                        : `💠 ${cfg.label}（動物系轉化僅能啟用一種每日增加）`;
                body.appendChild(panelDesc);

                // checkbox
                const checkBlock = document.createElement("div");
                checkBlock.className = "dol-section-block";
                const label = document.createElement("label");
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = !!V[enabledVar];
                checkbox.addEventListener("change", () => {
                    V[enabledVar] = checkbox.checked;
                    if (checkbox.checked) {
                        handleExclusiveToggle(cfg.key, cfg.group);
                    }
                    // Engine.play(passage());
                    Wikifier.wikifyEval('<<replace #CE_settingsDiv>><<CE_TransformationDailyGainSettings>><</replace>>');
                });
                label.appendChild(checkbox);
                label.append(` 啟用每日增加`);
                checkBlock.appendChild(label);
                body.appendChild(checkBlock);

                // slider
                const sliderBlock = document.createElement("div");
                sliderBlock.className = "dol-section-block";
                const sliderLabel = document.createElement("label");
                sliderLabel.textContent = "每日額外增加量：";
                sliderBlock.appendChild(sliderLabel);
                sliderBlock.appendChild(document.createElement("br"));
                const sliderSpan = document.createElement("span");
                new Wikifier(sliderSpan, `<<numberslider "$${amountVar}" $${amountVar} 1 100 1>>`);
                sliderBlock.appendChild(sliderSpan);
                body.appendChild(sliderBlock);

                body.appendChild(document.createElement("br"));
            });

            // 分隔線
            const hr = document.createElement("hr");
            hr.style.margin = "16px 0";
            body.appendChild(hr);

            // 當前點數表格
            const tableHeader = document.createElement("div");
            tableHeader.className = "dol-header";
            const thTitle = document.createElement("span");
            thTitle.className = "dol-title";
            thTitle.textContent = "當前轉化點數";
            tableHeader.appendChild(thTitle);
            body.appendChild(tableHeader);

            const tableBody = document.createElement("div");
            tableBody.className = "dol-body";

            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";

            const thead = document.createElement("thead");
            const trHead = document.createElement("tr");
            ["轉化名稱", "當前點數"].forEach(txt => {
                const th = document.createElement("th");
                th.textContent = txt;
                th.style.borderBottom = "1px solid #aaa";
                th.style.padding = "4px 8px";
                trHead.appendChild(th);
            });
            thead.appendChild(trHead);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            config.forEach(cfg => {
                if (!Number.isFinite(V[cfg.buildVar])) V[cfg.buildVar] = 0;
                if (V[cfg.buildVar] <= 0) return;

                const tr = document.createElement("tr");
                const tdName = document.createElement("td");
                tdName.textContent = cfg.label;
                tdName.style.padding = "4px 8px";
                tr.appendChild(tdName);

                const tdValue = document.createElement("td");
                tdValue.textContent = V[cfg.buildVar];
                tdValue.style.padding = "4px 8px";
                tdValue.style.textAlign = "center";
                tr.appendChild(tdValue);

                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            tableBody.appendChild(table);
            body.appendChild(tableBody);

            wrapper.appendChild(body);
            frag.appendChild(wrapper);

            this.output.appendChild(frag);
        }
    });
    
    // =========================
    // tab register
    // =========================
    CE_TabManager.register({
       id: 'transformationDailyGain',
       title: '額外轉化點數',
       onClick: () => CE_renderSettings('<<CE_TransformationDailyGainSettings>>')
    });

    // 將內部物件公開給外部調用
   // return { config, handleExclusiveToggle };
})();

/*
────────────────────────────────────
🎛 額外轉化點數
────────────────────────────────────
這裡可以控制所有轉化的每日增加量，神魔系與動物系互斥，只能同時啟用一個。
────────────────────────────────────

💠 天使（神魔系）
[✔] 啟用每日增加
每日增加量： [ 25 ▓▓▓▓▓░░░░░ ]  (slider)

💠 堕天使（神魔系）
[ ] 啟用每日增加
每日增加量： [ 10 ▓▓░░░░░░░ ]  (slider)

💠 恶魔（神魔系）
[ ] 啟用每日增加
每日增加量： [ 5 ▓░░░░░░░░░ ]  (slider)

💠 狼（動物系）
[ ] 啟用每日增加
每日增加量： [ 8 ▓▓░░░░░░░ ]  (slider)

💠 猫（動物系）
[ ] 啟用每日增加
每日增加量： [ 12 ▓▓▓░░░░░ ]  (slider)

────────────────────────────────────
📊 當前轉化點數
┌───────────┬─────────┐
│ 轉化名稱   │ 當前點數 │
├───────────┼─────────┤
│ 天使       │ 50      │
│ 狼         │ 12      │
│ 奶牛       │ 8       │
└───────────┴─────────┘
────────────────────────────────────
*/