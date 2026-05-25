Macro.add("brothelBasementManager", {
    handler() {

        const V = State.variables;

        /* ===== 初始化 ===== */
        V.brothel_basement_switch ??= false;          // 開關
        V.brothel_basement_multiplier ??= 1;         // 原本 price_FIX
        V.brothel_basement_price ??= 500;            // 最終報酬
        V.brothel_basement_price_base ??= V.brothel_basement_price; // 基礎值

        /* ===== 核心函式 ===== */
        const applyMultiplier = () => {
            if (!V.brothel_basement_switch) {
                V.brothel_basement_multiplier = 1;
                slider.value = 1;
                sliderValue.textContent = "1";
            }
            V.brothel_basement_price =
                V.brothel_basement_price_base *
                V.brothel_basement_multiplier;
        };

        const resetPrice = () => {
            const rng = V.rng || 0;
            if (rng >= 95) V.brothel_basement_price = 3000;
            else if (rng >= 85) V.brothel_basement_price = 2000;
            else if (rng >= 45) V.brothel_basement_price = 1000;
            else V.brothel_basement_price = 500;

            V.brothel_basement_price_base = V.brothel_basement_price;
            V.brothel_basement_multiplier = 1;
        };

        /* ===== 外框 ===== */
        const root = document.createElement("div");
        root.className = "dol-settings dol-shadow";

        const header = document.createElement("div");
        header.className = "dol-header";
        header.innerHTML = `<span class="dol-title gold">尋歡洞報酬加倍</span>`;
        root.appendChild(header);

        const body = document.createElement("div");
        body.className = "dol-body";

        body.innerHTML += `
            <div class="dol-desc">
                尋歡洞報酬加倍，功能開啟後：<br>
                <b>(1) 可更改倍數</b><br>
                <b>(2) 每日報酬基礎值默認為 <span class="gold">€500~€3000</span> 浮動，取代原版相當於白嫖的金額。</b><br>
            </div><br>
        `;

        /* ===== 開關區 ===== */
        const toggleBlock = document.createElement("div");
        toggleBlock.className = "dol-section-block";

        const toggleBtn = document.createElement("span");
        toggleBtn.className = "dol-btn";
        toggleBtn.textContent = "尋歡洞報酬加倍";

        const statusText = document.createElement("div");
        statusText.className = "dol-desc";
        statusText.style.marginTop = "6px";

        const updateStatus = () => {
            statusText.innerHTML = `
                尋歡洞報酬加倍：
                <span class="${V.brothel_basement_switch ? "green" : "red"}">
                    ${V.brothel_basement_switch ? "開" : "關"}
                </span>
            `;
        };

        toggleBtn.onclick = () => {
            V.brothel_basement_switch = !V.brothel_basement_switch;
            applyMultiplier();
            updateStatus();
            updateDisplay();
        };

        toggleBlock.append(toggleBtn, statusText);
        body.appendChild(toggleBlock);
        body.appendChild(document.createElement("br"));

        updateStatus();

        /* ===== 滑桿倍率 ===== */
        const sliderBlock = document.createElement("div");
        sliderBlock.className = "dol-section-block";
        sliderBlock.innerHTML = `
            <div class="dol-desc">在此設定尋歡洞報酬倍率：</div>
        `;

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = 1;
        slider.max = 200;
        slider.step = 1;
        slider.value = V.brothel_basement_multiplier;

        const sliderValue = document.createElement("span");
        sliderValue.className = "blue";
        sliderValue.style.marginLeft = "6px";
        sliderValue.textContent = V.brothel_basement_multiplier;

        slider.oninput = () => {
            V.brothel_basement_multiplier = Number(slider.value);
            sliderValue.textContent = slider.value;
        };

        sliderBlock.append(slider, sliderValue);
        body.appendChild(sliderBlock);
        body.appendChild(document.createElement("br"));

        /* ===== 套用按鈕 ===== */
        const applyBtn = document.createElement("span");
        applyBtn.className = "dol-btn";
        applyBtn.textContent = "確定";
        applyBtn.onclick = () => {
            applyMultiplier();
            updateDisplay();
        };

        body.appendChild(applyBtn);
        body.appendChild(document.createElement("br"));
        body.appendChild(document.createElement("br"));

        /* ===== 顯示區 ===== */
        const displayDiv = document.createElement("div");
        displayDiv.id = "brothelBasementDisplay";
        displayDiv.className = "dol-desc";
                
        const updateDisplay = () => {
            Wikifier.wikifyEval(`
                <<replace #brothelBasementDisplay>>
                    當前尋歡洞基礎值：
                    <span class="gold"><<printmoney $brothel_basement_price_base>></span><br>
                    當前倍率：
                    <span class="blue">${V.brothel_basement_multiplier}</span> 倍<br>
                    當前報酬：
                    <span class="gold"><<printmoney $brothel_basement_price>></span>
                <</replace>>
            `);
        };
        
        body.appendChild(displayDiv);       
        body.appendChild(document.createElement("br"));

        /* ===== 重置 ===== */
        const resetBtn = document.createElement("span");
        resetBtn.className = "dol-btn";
        resetBtn.textContent = "恢復預設";

        resetBtn.onclick = () => {
            resetPrice();
            slider.value = 1;
            sliderValue.textContent = "1";
            updateDisplay();
        };

        body.appendChild(resetBtn);

        /* ===== 完成 ===== */
        root.appendChild(body);
        this.output.append(root);
        //updateDisplay(); 
        setTimeout(updateDisplay, 10);
    }
});

registerCE_genericTimeEvent(
    'onDay',
    'CE_尋歡洞報酬基礎值更新',
    () => {
        if (!V?.brothel_basement_switch) return;
        
        const rng = random(1, 100); // 1~100
        const minPrice = 5000;
        const maxPrice = 30000;

        // 線性映射
        V.brothel_basement_price = Math.round(
            minPrice + ((maxPrice - minPrice) * (rng - 1)) / 99
        );

        V.brothel_basement_price_base = V.brothel_basement_price;
        V.brothel_basement_price = V.brothel_basement_price_base * V.brothel_basement_multiplier;
    }
);