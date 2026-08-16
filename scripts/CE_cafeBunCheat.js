(() => {
    "use strict";

    const TAG = "[Cheat Extended][Cafe Bun]";

    // ============================================================
    // Defaults / Limits
    // ============================================================

    const DEFAULTS = {
        enabled: false,
        noPriceDrop: true,
        priceMultiplier: 1,
        cutMultiplier: 1,
        fixedWage: 10
    };

    const LIMITS = {
        priceMultiplier: {
            min: 0,
            max: 10,
            step: 0.1
        },

        cutMultiplier: {
            min: 0,
            max: 10,
            step: 0.1
        },

        fixedWage: {
            min: 0,
            max: 3000,
            step: 0.1
        },

        // $bun_value，單位 penny
        bunValue: {
            min: 100,       // £1
            max: 100000,    // £1000
            step: 100       // £1
        },

        // $bun_cut，1 = 100%
        bunCut: {
            min: 0,
            max: 10,        // 1000%
            step: 0.05      // 5%
        },

        previewCount: {
            min: 0,
            max: 10000,
            step: 1
        }
    };

    // ============================================================
    // Utils
    // ============================================================

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function normalizeNumber(value, fallback, min, max) {
        value = Number(value);

        if (!Number.isFinite(value)) {
            value = fallback;
        }

        return clamp(value, min, max);
    }

    function formatNumber(value, digits = 2) {
        value = Number(value);

        if (!Number.isFinite(value)) {
            return "0";
        }

        return value
            .toFixed(digits)
            .replace(/\.00$/, "")
            .replace(/(\.\d)0$/, "$1");
    }

    function formatMoneyPennies(pennies) {
        return "£" + formatNumber(Number(pennies || 0) / 100, 2);
    }

    function formatMoneyPounds(pounds) {
        return "£" + formatNumber(Number(pounds || 0), 2);
    }

    function formatPercent(ratio) {
        return formatNumber(Number(ratio || 0) * 100, 1) + "%";
    }

    function createEl(tag, className, text) {
        const el = document.createElement(tag);

        if (className) {
            el.className = className;
        }

        if (text !== undefined && text !== null) {
            el.textContent = text;
        }

        return el;
    }

    function createHr() {
        return document.createElement("hr");
    }

    // ============================================================
    // Config init
    // ============================================================

    setup.CE_initCafeBunCheat = function () {
        const V = State.variables;

        if (
            !V.CE_cafeBunCheat ||
            typeof V.CE_cafeBunCheat !== "object" ||
            Array.isArray(V.CE_cafeBunCheat)
        ) {
            V.CE_cafeBunCheat = {};
        }

        const cfg = V.CE_cafeBunCheat;

        if (typeof cfg.enabled !== "boolean") {
            cfg.enabled = DEFAULTS.enabled;
        }

        if (typeof cfg.noPriceDrop !== "boolean") {
            cfg.noPriceDrop = DEFAULTS.noPriceDrop;
        }

        cfg.priceMultiplier = normalizeNumber(
            cfg.priceMultiplier,
            DEFAULTS.priceMultiplier,
            LIMITS.priceMultiplier.min,
            LIMITS.priceMultiplier.max
        );

        cfg.cutMultiplier = normalizeNumber(
            cfg.cutMultiplier,
            DEFAULTS.cutMultiplier,
            LIMITS.cutMultiplier.min,
            LIMITS.cutMultiplier.max
        );

        cfg.fixedWage = normalizeNumber(
            cfg.fixedWage,
            DEFAULTS.fixedWage,
            LIMITS.fixedWage.min,
            LIMITS.fixedWage.max
        );

        return cfg;
    };

    setup.CE_resetCafeBunCheat = function () {
        State.variables.CE_cafeBunCheat = {
            enabled: DEFAULTS.enabled,
            noPriceDrop: DEFAULTS.noPriceDrop,
            priceMultiplier: DEFAULTS.priceMultiplier,
            cutMultiplier: DEFAULTS.cutMultiplier,
            fixedWage: DEFAULTS.fixedWage
        };

        return State.variables.CE_cafeBunCheat;
    };

    // ============================================================
    // 無副作用版 averageBunPrice
    // ============================================================

    function calculateAverageBunPrice(toSell) {
        const V = State.variables;

        toSell = Math.max(
            0,
            Math.floor(Number(toSell) || 0)
        );

        const baseValue = Number(V.bun_value) || 0;

        if (toSell <= 0) {
            return baseValue;
        }

        let totalRevenue = 0;
        let remaining = toSell;

        const soldToday =
            Number(V.daily?.buns_sold) || 0;

        let batch = 1;
        let harmonics = 1;

        /*
         * 跟官方 averageBunPrice() 相同，
         * 但不會寫回 V.daily.buns_sold。
         */
        for (
            let sold = 20;
            sold <= soldToday;
            sold += 20
        ) {
            if (batch === 1) {
                harmonics += 0.5;
            } else {
                harmonics +=
                    1 / Math.max(batch / 20, 1);
            }

            batch++;
        }

        let doneToday = soldToday % 20;
        let pricePerBun = baseValue / harmonics;

        while (remaining > 0) {
            const bunsInBatch = Math.min(
                20 - doneToday,
                remaining
            );

            doneToday = 0;

            totalRevenue +=
                bunsInBatch * pricePerBun;

            remaining -= bunsInBatch;

            if (batch === 1) {
                harmonics += 0.5;
            } else {
                harmonics +=
                    1 / Math.max(batch / 20, 1);
            }

            batch++;

            pricePerBun =
                baseValue / harmonics;
        }

        return totalRevenue / toSell;
    }

    // ============================================================
    // Preview
    // ============================================================

    function calculatePreview(soldCount) {
        const V = State.variables;
        const cfg = setup.CE_initCafeBunCheat();

        soldCount = clamp(
            Math.floor(Number(soldCount) || 0),
            LIMITS.previewCount.min,
            LIMITS.previewCount.max
        );

        const baseValue =
            Number(V.bun_value) || 0;

        const baseCut =
            Number(V.bun_cut) || 0;

        const soldToday =
            Number(V.daily?.buns_sold) || 0;

        /*
         * 原版售價。
         */
        let marketValue;

        if (soldCount > 0) {
            marketValue = Math.max(
                100,
                calculateAverageBunPrice(soldCount)
            );
        } else {
            marketValue = baseValue;
        }

        /*
         * 是否已經受到原版大量販售降價影響。
         *
         * 這裡刻意使用 marketValue 與 baseValue 比較，
         * 不看 CE 最後覆寫的 effectiveValue。
         *
         * 所以即使啟用「取消大量販售降價」，
         * 試算仍然能顯示原版市場機制是否已觸發。
         */
        const isBulkSelling =
            soldCount > 0 &&
            marketValue < baseValue;

        /*
         * 原版預設結算值。
         */
        let effectiveValue = marketValue;
        let effectiveCut = baseCut;
        let wage = 1000;

        /*
         * CE 覆寫。
         */
        if (cfg.enabled) {
            if (cfg.noPriceDrop) {
                effectiveValue = baseValue;
            }

            effectiveValue = Math.max(
                0,
                Math.round(
                    effectiveValue *
                    cfg.priceMultiplier
                )
            );

            effectiveCut = Math.max(
                0,
                baseCut *
                cfg.cutMultiplier
            );

            /*
             * £ → penny
             * 並固定到 £0.10 精度。
             */
            wage =
                Math.round(cfg.fixedWage * 10) * 10;
        }

        /*
         * 跟目前 patch 相同：
         * 向下取到 10 penny。
         */
        const total =
            10 * Math.floor(
                (
                    wage +
                    (
                        effectiveValue *
                        effectiveCut *
                        soldCount
                    )
                ) / 10
            );

        const bunRevenue =
            total - wage;

        return {
            soldCount,
            soldToday,

            baseValue,
            marketValue,
            effectiveValue,

            baseCut,
            effectiveCut,

            wage,
            bunRevenue,
            total,

            isBulkSelling
        };
    }

    // ============================================================
    // DOM helpers
    // ============================================================

    function makeSection(title) {
        const section =
            createEl("div", "dol-section-block");

        if (title) {
            const titleEl =
                createEl("div", null, title);

            titleEl.style.fontWeight = "bold";
            titleEl.style.marginBottom = "0.45em";

            section.appendChild(titleEl);
        }

        return section;
    }

    function makeButton(text, onClick) {
        const wrap =
            createEl("div", "dol-btn");

        const button =
            document.createElement("button");

        button.type = "button";
        button.textContent = text;

        button.addEventListener(
            "click",
            onClick
        );

        wrap.appendChild(button);

        return {
            wrap,
            button
        };
    }

    function makeSlider({
        label,
        value,
        min,
        max,
        step,
        formatter,
        onInput
    }) {
        const section =
            makeSection();

        const labelRow =
            createEl("div");

        const labelEl =
            createEl("label", null, label);

        const valueEl =
            createEl("span", "gold");

        valueEl.style.marginLeft = "0.5em";
        valueEl.textContent = formatter(value);

        labelRow.append(
            labelEl,
            valueEl
        );

        const controlRow =
            createEl("div");

        controlRow.style.display = "flex";
        controlRow.style.alignItems = "center";
        controlRow.style.gap = "0.6em";
        controlRow.style.marginTop = "0.45em";

        const slider =
            document.createElement("input");

        slider.type = "range";
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;

        slider.style.flex = "1";
        slider.style.minWidth = "0";

        const number =
            document.createElement("input");

        number.type = "number";
        number.min = min;
        number.max = max;
        number.step = step;
        number.value = value;

        number.style.width = "6.5em";

        function setValue(raw) {
            let next = Number(raw);

            if (!Number.isFinite(next)) {
                return;
            }

            next = clamp(
                next,
                Number(min),
                Number(max)
            );

            slider.value = next;
            number.value = next;
            valueEl.textContent =
                formatter(next);

            onInput(next);
        }

        slider.addEventListener(
            "input",
            () => {
                setValue(slider.value);
            }
        );

        number.addEventListener(
            "change",
            () => {
                setValue(number.value);
            }
        );

        controlRow.append(
            slider,
            number
        );

        section.append(
            labelRow,
            controlRow
        );

        return section;
    }

    // ============================================================
    // Macro
    // ============================================================

    Macro.add("CE_cafeBunCheat", {
        handler() {
            setup.CE_initCafeBunCheat();

            const V = State.variables;
            const output = this.output;

            /*
             * 預設打開作弊參數。
             * null = 全部收起
             * "original" = 原版參數
             * "cheat" = 作弊參數
             */
            let openedPanel = "cheat";

            let previewCount = 10;

            // ====================================================
            // Root
            // ====================================================

            const root =
                createEl(
                    "div",
                    "dol-settings dol-shadow"
                );

            const header =
                createEl(
                    "div",
                    "dol-header"
                );

            header.appendChild(
                createEl(
                    "span",
                    "dol-title",
                    "咖啡店小麵包收入修改"
                )
            );

            const body =
                createEl(
                    "div",
                    "dol-body"
                );

            root.append(
                header,
                body
            );

            body.appendChild(
                createEl(
                    "div",
                    "dol-desc",
                    "調整小麵包原版參數與 CE 結算參數，並即時計算目前條件下的實際收入。"
                )
            );

            body.appendChild(
                document.createElement("br")
            );

            // ====================================================
            // Accordion
            // ============================================================

            const accordionWrap =
                createEl(
                    "div",
                    "CE-cafe-accordion"
                );

            let originalAccordion;
            let cheatAccordion;

            function makeAccordion(title, key) {
                const root = createEl(
                    "div",
                    "dol-section-block"
                );

                const header = document.createElement("div");

                header.style.display = "flex";
                header.style.alignItems = "center";
                header.style.width = "100%";
                header.style.padding = "0.45em 0";
                header.style.fontWeight = "bold";
                header.style.cursor = "pointer";
                header.style.userSelect = "none";
                header.style.borderBottom = "1px solid rgba(255,255,255,0.18)";

                const arrow = document.createElement("span");
                arrow.style.display = "inline-block";
                arrow.style.width = "1.4em";
                arrow.style.flexShrink = "0";

                const text = document.createElement("span");
                text.textContent = title;

                header.append(
                    arrow,
                    text
                );

                const content = createEl(
                    "div",
                    "CE-cafe-accordion-content"
                );

                content.style.paddingTop = "0.65em";

                function refreshAccordion() {
                    const opened = openedPanel === key;

                    arrow.textContent = opened ? "▼" : "▶";
                    content.style.display = opened ? "" : "none";
                }

                header.addEventListener("click", () => {
                    openedPanel =
                        openedPanel === key
                            ? null
                            : key;

                    originalAccordion.refresh();
                    cheatAccordion.refresh();
                });

                root.append(
                    header,
                    content
                );

                return {
                    root,
                    content,
                    refresh: refreshAccordion
                };
            }

            originalAccordion =
                makeAccordion(
                    "原版參數",
                    "original"
                );

            cheatAccordion =
                makeAccordion(
                    "作弊參數",
                    "cheat"
                );

            accordionWrap.append(
                originalAccordion.root,
                cheatAccordion.root
            );

            body.appendChild(
                accordionWrap
            );

            // ====================================================
            // 原版參數
            // ============================================================

            originalAccordion.content
                .appendChild(
                    createEl(
                        "div",
                        "dol-desc",
                        "直接修改遊戲目前保存的基礎售價與分紅比例，不受作弊主開關控制。"
                    )
                );

            originalAccordion.content
                .appendChild(
                    document.createElement(
                        "br"
                    )
                );

            const basePriceSlider =
                makeSlider({
                    label:
                        "基礎小麵包售價：",

                    value:
                        Number(V.bun_value) ||
                        LIMITS.bunValue.min,

                    min:
                        LIMITS.bunValue.min,

                    max:
                        LIMITS.bunValue.max,

                    step:
                        LIMITS.bunValue.step,

                    formatter(value) {
                        return formatMoneyPennies(
                            value
                        );
                    },

                    onInput(value) {
                        V.bun_value =
                            Math.round(value);

                        renderPreview();
                    }
                });

            originalAccordion.content
                .appendChild(
                    basePriceSlider
                );

            originalAccordion.content
                .appendChild(
                    createHr()
                );

            const baseCutSlider =
                makeSlider({
                    label:
                        "基礎分紅：",

                    value:
                        Number(V.bun_cut) || 0,

                    min:
                        LIMITS.bunCut.min,

                    max:
                        LIMITS.bunCut.max,

                    step:
                        LIMITS.bunCut.step,

                    formatter(value) {
                        return formatPercent(
                            value
                        );
                    },

                    onInput(value) {
                        V.bun_cut = value;

                        renderPreview();
                    }
                });

            originalAccordion.content
                .appendChild(
                    baseCutSlider
                );

            const originalTips =
                createEl(
                    "div",
                    "dol-section-block"
                );

            originalTips.innerHTML = `
                <ul>
                    <li>💡 基礎售價直接修改遊戲的 <code>$bun_value</code>。</li>
                    <li>💡 基礎分紅直接修改遊戲的 <code>$bun_cut</code>。</li>
                    <li>💡 這兩個值屬於遊戲原始參數，因此作弊主功能關閉時仍會生效。</li>
                </ul>
            `;

            originalAccordion.content
                .appendChild(
                    originalTips
                );

            // ====================================================
            // 作弊參數
            // ============================================================

            cheatAccordion.content
                .appendChild(
                    createEl(
                        "div",
                        "dol-desc",
                        "原版完成計算後，再依照下列設定覆寫本次結算。"
                    )
                );

            cheatAccordion.content
                .appendChild(
                    document.createElement(
                        "br"
                    )
                );

            const controlSection =
                makeSection();

            const mainButton =
                makeButton(
                    "",
                    () => {
                        V.CE_cafeBunCheat
                            .enabled =
                            !V.CE_cafeBunCheat
                                .enabled;

                        refresh();
                    }
                );

            controlSection.appendChild(
                mainButton.wrap
            );

            cheatAccordion.content
                .appendChild(
                    controlSection
                );

            const statusSection =
                makeSection();

            const statusText =
                createEl("span");

            statusSection.append(
                document.createTextNode(
                    "當前狀態："
                ),
                statusText
            );

            cheatAccordion.content
                .appendChild(
                    statusSection
                );

            cheatAccordion.content
                .appendChild(
                    createHr()
                );

            const dropSection =
                makeSection();

            const dropButton =
                makeButton(
                    "",
                    () => {
                        V.CE_cafeBunCheat
                            .noPriceDrop =
                            !V.CE_cafeBunCheat
                                .noPriceDrop;

                        refresh();
                    }
                );

            dropSection.appendChild(
                dropButton.wrap
            );

            cheatAccordion.content
                .appendChild(
                    dropSection
                );

            const dropStatus =
                makeSection();

            const dropStatusText =
                createEl("span");

            dropStatus.append(
                document.createTextNode(
                    "大量販售降價："
                ),
                dropStatusText
            );

            cheatAccordion.content
                .appendChild(
                    dropStatus
                );

            cheatAccordion.content
                .appendChild(
                    createHr()
                );

            const priceMultiplierSlider =
                makeSlider({
                    label:
                        "售價倍率：",

                    value:
                        V.CE_cafeBunCheat
                            .priceMultiplier,

                    min:
                        LIMITS
                            .priceMultiplier
                            .min,

                    max:
                        LIMITS
                            .priceMultiplier
                            .max,

                    step:
                        LIMITS
                            .priceMultiplier
                            .step,

                    formatter(value) {
                        return "×" +
                            formatNumber(
                                value,
                                1
                            );
                    },

                    onInput(value) {
                        V.CE_cafeBunCheat
                            .priceMultiplier =
                            value;

                        renderPreview();
                    }
                });

            cheatAccordion.content
                .appendChild(
                    priceMultiplierSlider
                );

            cheatAccordion.content
                .appendChild(
                    createHr()
                );

            const cutMultiplierSlider =
                makeSlider({
                    label:
                        "分紅倍率：",

                    value:
                        V.CE_cafeBunCheat
                            .cutMultiplier,

                    min:
                        LIMITS
                            .cutMultiplier
                            .min,

                    max:
                        LIMITS
                            .cutMultiplier
                            .max,

                    step:
                        LIMITS
                            .cutMultiplier
                            .step,

                    formatter(value) {
                        return "×" +
                            formatNumber(
                                value,
                                1
                            );
                    },

                    onInput(value) {
                        V.CE_cafeBunCheat
                            .cutMultiplier =
                            value;

                        renderPreview();
                    }
                });

            cheatAccordion.content
                .appendChild(
                    cutMultiplierSlider
                );

            cheatAccordion.content
                .appendChild(
                    createHr()
                );

            const wageSlider =
                makeSlider({
                    label:
                        "固定工資：",

                    value:
                        V.CE_cafeBunCheat
                            .fixedWage,

                    min:
                        LIMITS
                            .fixedWage
                            .min,

                    max:
                        LIMITS
                            .fixedWage
                            .max,

                    step:
                        LIMITS
                            .fixedWage
                            .step,

                    formatter(value) {
                        return formatMoneyPounds(
                            value
                        );
                    },

                    onInput(value) {
                        V.CE_cafeBunCheat
                            .fixedWage =
                            value;

                        renderPreview();
                    }
                });

            cheatAccordion.content
                .appendChild(
                    wageSlider
                );

            cheatAccordion.content
                .appendChild(
                    createHr()
                );

            const resetSection =
                makeSection();

            const resetButton =
                makeButton(
                    "恢復作弊參數預設",
                    () => {
                        setup
                            .CE_resetCafeBunCheat();

                        $(output).empty();

                        new Wikifier(
                            output,
                            "<<CE_cafeBunCheat>>"
                        );
                    }
                );

            resetSection.appendChild(
                resetButton.wrap
            );

            cheatAccordion.content
                .appendChild(
                    resetSection
                );

            const cheatTips =
                createEl(
                    "div",
                    "dol-section-block"
                );

            cheatTips.innerHTML = `
                <ul>
                    <li>💡 主功能關閉時，作弊參數不會修改實際結算。</li>
                    <li>💡 取消大量販售降價後，會使用基礎售價取代當日市場降價後的價格。</li>
                    <li>💡 售價倍率作用於本次實際單價。</li>
                    <li>💡 分紅倍率作用於遊戲目前的基礎分紅，可超過 100%。</li>
                    <li>💡 固定工資以 £0.10 為實際結算精度。</li>
                </ul>
            `;

            cheatAccordion.content
                .appendChild(
                    cheatTips
                );

            // ====================================================
            // Preview
            // ============================================================

            body.appendChild(
                createHr()
            );

            const previewSection =
                makeSection(
                    "收入試算"
                );

            const previewCountRow =
                createEl("div");

            const previewCountLabel =
                createEl(
                    "label",
                    null,
                    "本次售出數量："
                );

            const previewCountInput =
                document.createElement(
                    "input"
                );

            previewCountInput.type =
                "number";

            previewCountInput.min =
                LIMITS.previewCount.min;

            previewCountInput.max =
                LIMITS.previewCount.max;

            previewCountInput.step =
                LIMITS.previewCount.step;

            previewCountInput.value =
                previewCount;

            previewCountInput.style.width =
                "7em";

            previewCountInput.style.marginLeft =
                "0.5em";

            previewCountInput.addEventListener(
                "input",
                () => {
                    previewCount = clamp(
                        Math.floor(
                            Number(
                                previewCountInput
                                    .value
                            ) || 0
                        ),
                        LIMITS.previewCount.min,
                        LIMITS.previewCount.max
                    );

                    renderPreview();
                }
            );

            previewCountRow.append(
                previewCountLabel,
                previewCountInput
            );

            previewSection.appendChild(
                previewCountRow
            );

            const previewBox =
                createEl(
                    "div",
                    "dol-section-block"
                );

            previewBox.style.marginTop =
                "0.7em";

            body.append(
                previewSection,
                previewBox
            );

            // ====================================================
            // Refresh state
            // ============================================================

            function refresh() {
                const cfg =
                    setup
                        .CE_initCafeBunCheat();

                renderStatus(cfg);
                renderPreview();
            }

            function renderStatus(cfg) {
                mainButton.button.textContent =
                    cfg.enabled
                        ? "關閉小麵包收入修改"
                        : "啟用小麵包收入修改";

                statusText.className =
                    cfg.enabled
                        ? "dol-green"
                        : "dol-red";

                statusText.textContent =
                    cfg.enabled
                        ? "開"
                        : "關";

                dropButton.button.textContent =
                    cfg.noPriceDrop
                        ? "恢復大量販售降價"
                        : "取消大量販售降價";

                if (!cfg.enabled) {
                    dropStatusText.className =
                        "dol-red";

                    dropStatusText.textContent =
                        "未啟用";
                } else if (
                    cfg.noPriceDrop
                ) {
                    dropStatusText.className =
                        "dol-green";

                    dropStatusText.textContent =
                        "已取消";
                } else {
                    dropStatusText.className =
                        "";

                    dropStatusText.textContent =
                        "原版";
                }
            }

            function renderPreview() {
                const result =
                    calculatePreview(
                        previewCount
                    );

                const marketPercent =
                    result.baseValue > 0
                        ? (
                            result.marketValue /
                            result.baseValue *
                            100
                        )
                        : 0;

                const cfg =
                    V.CE_cafeBunCheat;

                const cheatState =
                    cfg.enabled
                        ? `<span class="dol-green">啟用</span>`
                        : `<span class="dol-red">關閉</span>`;

                const bulkSellingState =
                    result.isBulkSelling
                        ? `<span class="dol-red">是</span>`
                        : `<span class="dol-green">否</span>`;

                previewBox.innerHTML = `
                    <div>
                        CE 結算：
                        ${cheatState}
                    </div>

                    <div>
                        今日已售：
                        <span class="gold">
                            ${result.soldToday}
                        </span>
                    </div>

                    <div>
                        本次試算：
                        <span class="gold">
                            ${result.soldCount}
                        </span>
                    </div>

                    <div>
                        大量販售：
                        ${bulkSellingState}
                    </div>

                    <br>

                    <div>
                        基礎售價：
                        <span class="gold">
                            ${formatMoneyPennies(
                                result.baseValue
                            )}
                        </span>
                    </div>

                    <div>
                        大量販售後平均價：
                        <span class="gold">
                            ${formatMoneyPennies(
                                result.marketValue
                            )}
                        </span>
                        （${formatNumber(
                            marketPercent,
                            1
                        )}%）
                    </div>

                    <div>
                        實際結算單價：
                        <span class="gold">
                            ${formatMoneyPennies(
                                result.effectiveValue
                            )}
                        </span>
                    </div>

                    <br>

                    <div>
                        基礎分紅：
                        <span class="gold">
                            ${formatPercent(
                                result.baseCut
                            )}
                        </span>
                    </div>

                    <div>
                        實際分紅：
                        <span class="gold">
                            ${formatPercent(
                                result.effectiveCut
                            )}
                        </span>
                    </div>

                    <br>

                    <div>
                        小麵包分紅收入：
                        <span class="gold">
                            ${formatMoneyPennies(
                                result.bunRevenue
                            )}
                        </span>
                    </div>

                    <div>
                        固定工資：
                        <span class="gold">
                            ${formatMoneyPennies(
                                result.wage
                            )}
                        </span>
                    </div>

                    <br>

                    <div>
                        試算總收入：
                        <span class="gold">
                            <strong>
                                ${formatMoneyPennies(
                                    result.total
                                )}
                            </strong>
                        </span>
                    </div>
                `;
            }

            // ====================================================
            // Mount
            // ============================================================

            output.appendChild(root);

            originalAccordion.refresh();
            cheatAccordion.refresh();

            refresh();
        }
    });

    // ============================================================
    // Save compatibility
    // ============================================================

    $(document).on(
        ":passageinit",
        function () {
            setup.CE_initCafeBunCheat();
        }
    );

    // console.log(`${TAG} loaded`);
})();