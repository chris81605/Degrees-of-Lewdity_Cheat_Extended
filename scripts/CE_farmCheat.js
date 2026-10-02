/*=========================================
 Cheat Extended - Alex Farm Cheat Helper
 JavaScript rebuild

 Replaces:
 - <<CE_safeNumberSlider>>
 - <<CE_farmCheatPanel>>

 Notes:
 - UI rendering does not store transient feedback in setup / V.
 - Button feedback exists only in the currently rendered panel.
 - Sliders update their target values directly without rebuilding the panel.
=========================================*/

(() => {
    "use strict";

    /* -----------------------------------------
     * Basic DOM helpers
     * ----------------------------------------- */

    function makeEl(tag, className = "", text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
    }

    function makeDesc(html, className = "") {
        const el = makeEl("div", `dol-desc${className ? ` ${className}` : ""}`);
        el.innerHTML = html;
        return el;
    }

    function makeHeader(title) {
        const header = makeEl("div", "dol-header");
        header.appendChild(makeEl("span", "dol-title", title));
        return header;
    }

    function makeButton(label, onClick) {
        const wrap = makeEl("div", "dol-btn");
        const btn = makeEl("button", "", label);
        btn.type = "button";
        btn.addEventListener("click", onClick);
        wrap.appendChild(btn);
        return wrap;
    }

    function appendBr(parent, count = 1) {
        for (let i = 0; i < count; i++) parent.appendChild(document.createElement("br"));
    }

    function showFeedback(parent, message, success = true) {
        parent.replaceChildren();
        parent.appendChild(makeDesc(
            `<span class="${success ? "green" : "dol-red"}">${message}</span>`
        ));
    }

    function makeActionWithFeedback(id, label, onClick) {
        const block = makeEl("div", "CE-farm-action-block");
        const feedback = makeEl("div", "CE-farm-action-feedback");
        feedback.dataset.ceActionFeedback = id;
        feedback.style.marginTop = "4px";

        block.appendChild(makeButton(label, () => {
            const result = onClick();

            // 一般操作：直接在目前按鈕下方顯示。
            if (result?.message && result.rerender !== true) {
                showFeedback(feedback, result.message, result.success !== false);
                return;
            }

            // 需要重繪面板的操作：重繪後再找到同一按鈕下方的新提示區。
            if (result?.rerender === true) {
                renderFarmPanel(block.closest(".CE-farm-cheat-root"), {
                    actionId: id,
                    result
                });
            }
        }));
        block.appendChild(feedback);

        return block;
    }

    /* -----------------------------------------
     * State path helpers
     * ----------------------------------------- */

    function getStatePath(path) {
        if (typeof path !== "string" || !path.startsWith("$")) return undefined;

        if (typeof State?.getVar === "function") {
            try {
                return State.getVar(path);
            } catch (e) {
                console.warn("[CE Farm] State.getVar failed:", path, e);
            }
        }

        const parts = path.slice(1).split(".");
        let cur = State.variables;
        for (const key of parts) {
            if (cur == null) return undefined;
            cur = cur[key];
        }
        return cur;
    }

    function setStatePath(path, value) {
        if (typeof path !== "string" || !path.startsWith("$")) return false;

        if (typeof State?.setVar === "function") {
            try {
                State.setVar(path, value);
                return true;
            } catch (e) {
                console.warn("[CE Farm] State.setVar failed:", path, e);
            }
        }

        const parts = path.slice(1).split(".");
        if (!parts.length) return false;

        let cur = State.variables;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i];
            if (!cur[key] || typeof cur[key] !== "object") cur[key] = {};
            cur = cur[key];
        }
        cur[parts[parts.length - 1]] = value;
        return true;
    }

    /* -----------------------------------------
     * Safe number slider
     * ----------------------------------------- */

    function isValidSliderValue(raw) {
        return (
            typeof raw === "number" &&
            Number.isFinite(raw)
        ) || (
            typeof raw === "string" &&
            raw.trim() !== "" &&
            Number.isFinite(Number(raw))
        );
    }

    function formatRawValue(raw) {
        if (raw === undefined) return "undefined";
        if (raw === null) return "null";
        if (typeof raw === "string" && raw.trim() === "") return "空字符串";
        try {
            return String(raw);
        } catch {
            return "[無法顯示]";
        }
    }

    /**
     * Creates the CE safe number slider as a pure DOM component.
     * It preserves the old widget's behavior:
     * - validates current value and slider config strictly
     * - expands the actual slider range if the current value is out of normal range
     * - hides the slider and shows diagnostic text when invalid
     */
    function createSafeNumberSlider(path, rawValue, minArg, maxArg, stepArg) {
        const root = document.createElement("div");

        let min = Number(minArg);
        let max = Number(maxArg);
        const step = Number(stepArg);

        const normalMin = min;
        const normalMax = max;

        const valueValid = isValidSliderValue(rawValue);
        const numberValue = valueValid ? Number(rawValue) : NaN;

        const configValid =
            Number.isFinite(min) &&
            Number.isFinite(max) &&
            Number.isFinite(step) &&
            min <= max &&
            step > 0;

        if (!configValid || !valueValid) {
            const warning = makeDesc("", "");
            warning.style.margin = "4px 0 8px 0";

            const red = makeEl("span", "dol-red", "當前值或滑塊參數無效，已隱藏滑塊");
            warning.appendChild(red);
            warning.appendChild(document.createElement("br"));
            warning.append("當前值：");

            const value = makeEl("span", "gold", formatRawValue(rawValue));
            warning.appendChild(value);
            warning.appendChild(document.createElement("br"));
            warning.append("正常範圍：");

            const normal = makeEl("span", "");
            normal.style.color = "gray";
            normal.textContent = `${normalMin} - ${normalMax}`;
            warning.appendChild(normal);

            if (!configValid) {
                warning.appendChild(document.createElement("br"));
                const config = makeEl(
                    "span",
                    "",
                    `滑塊配置：min = ${min}，max = ${max}，step = ${step}`
                );
                config.style.color = "gray";
                warning.appendChild(config);
            }

            root.appendChild(warning);
            return root;
        }

        if (numberValue < normalMin) {
            min = normalMin -
                Math.ceil((normalMin - numberValue) / step) * step;
        }

        if (numberValue > normalMax) {
            max = normalMax +
                Math.ceil((numberValue - normalMax) / step) * step;
        }

        const control = makeEl("div", "CE-safe-number-slider");
        control.style.display = "grid";
        control.style.gridTemplateColumns = "1fr auto";
        control.style.alignItems = "center";
        control.style.gap = "8px";
        control.style.width = "100%";

        const range = document.createElement("input");
        range.type = "range";
        range.min = String(min);
        range.max = String(max);
        range.step = String(step);
        range.value = String(numberValue);
        range.style.width = "100%";
        range.style.minWidth = "0";

        const valueLabel = makeEl("span", "gold", String(numberValue));
        valueLabel.style.minWidth = "3em";
        valueLabel.style.textAlign = "right";
        valueLabel.style.whiteSpace = "nowrap";

        const apply = raw => {
            const value = Number(raw);
            if (!Number.isFinite(value)) return;

            setStatePath(path, value);
            range.value = String(value);
            valueLabel.textContent = String(value);
        };

        range.addEventListener("input", () => apply(range.value));

        control.append(range, valueLabel);
        root.appendChild(control);

        if (numberValue < normalMin || numberValue > normalMax) {
            const warning = makeDesc("", "");
            warning.style.margin = "4px 0 8px 0";

            warning.appendChild(makeEl(
                "span",
                "dol-red",
                "數值超出正常範圍，滑塊範圍已自動擴展"
            ));
            warning.appendChild(document.createElement("br"));
            warning.append("當前值：");
            warning.appendChild(makeEl("span", "gold", formatRawValue(rawValue)));
            warning.appendChild(document.createElement("br"));
            warning.append("正常範圍：");

            const normal = makeEl("span", "", `${normalMin} - ${normalMax}`);
            normal.style.color = "gray";
            warning.appendChild(normal);

            warning.appendChild(document.createElement("br"));
            warning.append("當前滑塊範圍：");

            const actual = makeEl("span", "", `${min} - ${max}`);
            actual.style.color = "gray";
            warning.appendChild(actual);

            root.appendChild(warning);
        }

        return root;
    }

    // Public JS helper for other CE panels.
    setup.CE_createSafeNumberSlider = createSafeNumberSlider;

    // Compatibility macro: existing Twee/other panels may continue calling
    // <<CE_safeNumberSlider "$farm.wall" $farm.wall 0 4 1>>
    Macro.add("CE_safeNumberSlider", {
        handler() {
            const [path, rawValue, min, max, step] = this.args;
            this.output.appendChild(
                createSafeNumberSlider(path, rawValue, min, max, step)
            );
        }
    });

    /* -----------------------------------------
     * Farm data helpers
     * ----------------------------------------- */

    function farmReady() {
        const V = State.variables;
        return !!(V.farm && typeof V.farm === "object");
    }

    function ensureFarmSubstructures() {
        const V = State.variables;
        const farm = V.farm;

        if (!farm || typeof farm !== "object") return false;

        if (!farm.beasts || typeof farm.beasts !== "object") {
            farm.beasts = { pigs: 0, horses: 0, cattle: 0, dogs: 0 };
        }
        for (const key of ["pigs", "horses", "cattle", "dogs"]) {
            if (farm.beasts[key] === undefined) farm.beasts[key] = 0;
        }

        if (!farm.milking || typeof farm.milking !== "object") {
            farm.milking = {
                caught: false,
                alexNightEvent: false,
                catchChance: 0,
                dayMilking: false
            };
        }

        if (!Array.isArray(farm.build_finished)) farm.build_finished = [];

        V.farm_work ??= {};
        if (V.farm_work.fence_damage === undefined) V.farm_work.fence_damage = 0;

        if (V.alex_greenhouse === undefined) V.alex_greenhouse = 0;

        return true;
    }

    function pushUnique(array, value) {
        if (!array.includes(value)) array.push(value);
    }

    function completeCurrentBuild() {
        const V = State.variables;
        const farm = V.farm;

        if (!farm || !farm.build) {
            return {
                success: false,
                message: "✘ 當前沒有正在進行的建造項目"
            };
        }

        const build = farm.build;
        let recognized = true;

        switch (build) {
            case "wall 1": farm.wall = 1; break;
            case "wall 2": farm.wall = 2; break;
            case "wall 3": farm.wall = 3; break;
            case "wall 4": farm.wall = 4; break;
            case "tower 1": farm.tower = 1; break;
            case "tower 2": farm.tower = 2; break;
            case "woodland 1": farm.woodland = 1; break;
            case "woodland 2": farm.woodland = 2; break;
            case "woodland 3": farm.woodland = 3; break;
            case "kennel 1": farm.kennel = 1; break;
            case "barn 1": farm.barn = 1; break;
            case "barn 2": farm.barn = 2; break;
            case "stable 1": farm.stable = 1; break;
            case "coop 1": farm.coop = 1; break;
            case "coop 2": farm.coop = 2; break;
            case "parasites 1":
                farm.parasitebarn = 1;
                break;
            case "parasites 2":
                farm.parasitebarn = 2;

                if (V.container?.farm) {
                    V.container.farm.upgrades ??= {};
                    V.container.farm.upgrades.capacity = 1;
                    V.container.farm.maxCount = 7;
                    V.container.farm.upgrades.foodStorage = 1;
                    V.container.farm.maxDaysWithoutFood = 31;
                    V.container.farm.upgrades.luxury = 3;
                }
                break;
            case "irrigation":
                if (farm.irrigation === undefined) farm.irrigation = 1;
                else if (farm.irrigation < 9) farm.irrigation++;
                break;
            case "nursery":
                if (window.C?.npc?.Alex?.pregnancy) {
                    C.npc.Alex.pregnancy.nursery = true;
                }
                delete V.cottage_nursery_prep;
                break;
            default:
                recognized = false;
                break;
        }

        if (!Array.isArray(farm.build_finished)) farm.build_finished = [];
        pushUnique(farm.build_finished, build);

        farm.build = 0;
        farm.build_timer = 0;

        return recognized
            ? { success: true, message: `✓ 已完成當前建造：${build}` }
            : { success: false, message: `✘ 未識別的建造項目：${build}；已清除建造佇列` };
    }

    function perfectFarm() {
        const V = State.variables;

        // 原版牧場場景正式解鎖後 farm_stage 會進入可用階段。
        // 未解鎖時只回報提示，不主動建立或推進農場劇情。
        if (!(Number(V.farm_stage) >= 2)) {
            return {
                success: false,
                message: "✘ 尚未解鎖牧場場景，無法使用一鍵完美升級農場"
            };
        }

        if (!farmReady()) {
            return {
                success: false,
                message: "✘ 牧場場景已解鎖，但農場資料尚未建立，無法套用升級"
            };
        }

        ensureFarmSubstructures();
        const farm = V.farm;

        V.farm_stage = 12;

        Object.assign(farm, {
            wall: 4,
            tower: 2,
            woodland: 3,
            kennel: 1,
            barn: 2,
            stable: 1,
            coop: 2,
            parasitebarn: 2,
            irrigation: 9,
            build: 0,
            build_timer: 0,
            clearing: 0,
            aggro: 0
        });

        Object.assign(farm.beasts, {
            pigs: 30,
            horses: 30,
            cattle: 30,
            dogs: 30
        });

        V.alex_greenhouse = 3;
        V.alex_greenhouse_timer = 0;
        delete V.cottage_nursery_prep;

        if (window.C?.npc?.Alex?.pregnancy) {
            C.npc.Alex.pregnancy.nursery = true;
        }

        V.wardrobes ??= {};
        V.wardrobes.alexFarm ??= {};
        V.wardrobes.alexFarm.unlocked = true;

        V.plots ??= {};
        V.plots.farm = Array.from({ length: 9 }, () => ({
            plant: "none",
            stage: 0,
            days: 0,
            water: 1,
            till: 1,
            bed: "earth",
            quality: 4,
            size: "large"
        }));

        return {
            success: true,
            message: "✓ 農場已完成一鍵完美升級"
        };
    }

    function instantGrowFarm() {
        if (!farmReady()) {
            return {
                success: false,
                message: "✘ Alex 農場尚未由原版遊戲建立"
            };
        }

        try {
            if (typeof tendingInstaGrow === "function") {
                tendingInstaGrow("farm");
            } else if (typeof window.tendingInstaGrow === "function") {
                window.tendingInstaGrow("farm");
            } else {
                return {
                    success: false,
                    message: "✘ 找不到原版 tendingInstaGrow()，無法催熟作物"
                };
            }
        } catch (e) {
            console.warn("[CE Farm] tendingInstaGrow failed", e);
            return {
                success: false,
                message: "✘ 農作物催熟失敗，詳情請查看控制台"
            };
        }

        return {
            success: true,
            message: "✓ 農場所有已播種作物已瞬間成熟"
        };
    }

    function toggleNursery() {
        if (!window.C?.npc?.Alex?.pregnancy) {
            return {
                success: false,
                message: "✘ Alex 育兒室資料尚未建立"
            };
        }

        C.npc.Alex.pregnancy.nursery =
            C.npc.Alex.pregnancy.nursery !== true;

        return {
            success: true,
            message: C.npc.Alex.pregnancy.nursery
                ? "✓ 農場小屋育兒室已解鎖"
                : "✓ 農場小屋育兒室已鎖定"
        };
    }

    /* -----------------------------------------
     * Farm panel
     * ----------------------------------------- */

    const DETAIL_SLIDERS = [
        ["農場主線階段 (0 - 12):", "$farm_stage", 0, 12, 1],
        ["石牆/圍欄等級 (0 - 4):", "$farm.wall", 0, 4, 1],
        ["瞭望塔等級 (0 - 2):", "$farm.tower", 0, 2, 1],
        ["林地吞併等級 (0 - 3):", "$farm.woodland", 0, 3, 1],
        ["獵犬舍防衛訓練 (0 - 1):", "$farm.kennel", 0, 1, 1],
        ["穀倉與自動擠奶等級 (0 - 2):", "$farm.barn", 0, 2, 1],
        ["馬廄擴建等級 (0 - 1):", "$farm.stable", 0, 1, 1],
        ["雞舍擴建等級 (0 - 2):", "$farm.coop", 0, 2, 1],
        ["寄生蟲穀倉等級 (0 - 2):", "$farm.parasitebarn", 0, 2, 1],
        ["已安裝灌溉的土地數 (0 - 9):", "$farm.irrigation", 0, 9, 1],
        ["Remy 敵對騷擾值 (0 - 100):", "$farm.aggro", 0, 100, 5],
        ["圍欄受損程度 (0 - 100):", "$farm_work.fence_damage", 0, 100, 5],
        ["孤兒院 Alex 溫室等級 (0 - 3):", "$alex_greenhouse", 0, 3, 1]
    ];

    const BEAST_SLIDERS = [
        ["豬隻數量 (0 - 30):", "$farm.beasts.pigs", 0, 30, 1],
        ["馬匹數量 (0 - 30):", "$farm.beasts.horses", 0, 30, 1],
        ["牛隻數量 (0 - 30):", "$farm.beasts.cattle", 0, 30, 1],
        ["牧羊犬數量 (0 - 30):", "$farm.beasts.dogs", 0, 30, 1]
    ];

    function appendSliderSection(section, config) {
        section.style.display = "grid";
        section.style.gridTemplateColumns = "repeat(auto-fit, minmax(min(100%, 280px), 1fr))";
        section.style.gap = "12px 16px";
        section.style.alignItems = "start";

        config.forEach(([label, path, min, max, step]) => {
            const item = makeEl("div", "CE-farm-slider-item");
            item.style.minWidth = "0";

            const title = makeDesc(label);
            title.style.marginBottom = "4px";

            item.appendChild(title);
            item.appendChild(
                createSafeNumberSlider(
                    path,
                    getStatePath(path),
                    min,
                    max,
                    step
                )
            );

            section.appendChild(item);
        });
    }

    function renderFarmPanel(root, actionFeedback = null) {
        const V = State.variables;
        root.replaceChildren();

        const shell = makeEl("div", "dol-settings dol-shadow");
        shell.appendChild(makeHeader("農場作弊助手 (Farm Cheat Helper)"));

        const body = makeEl("div", "dol-body");
        body.appendChild(makeDesc(
            "快速完成農場升級，瞬間解鎖全建築，拉滿牲畜或自動收穫。"
        ));
        appendBr(body);

        const ready = farmReady();

        if (!ready) {
            body.appendChild(makeDesc(
                '<span class="dol-red">Alex 農場尚未由原版遊戲建立。</span>' +
                '<span class="note"> Debug 模式可預覽面板，但不會為了顯示 UI 而建立 $farm。</span>'
            ));
            appendBr(body);
        } else {
            // Only normalize substructures once the vanilla farm object already exists.
            ensureFarmSubstructures();
        }

        body.appendChild(makeHeader("一鍵快捷操作 (Quick Actions)"));
        appendBr(body);

        body.appendChild(makeActionWithFeedback("perfectFarm", "一鍵完美升級農場", () => {
            const result = perfectFarm();
            if (result.success) result.rerender = true;
            return result;
        }));

        body.appendChild(makeDesc(
            "※ 將故事線拉到第 12 階段，所有建築升至滿級，解鎖農場育兒室與更衣室，擁有 9 塊已鬆土的特級大型自動灌溉農田，並將所有牲畜補滿到 30 隻上限。",
            "mt8"
        ));
        appendBr(body);

        body.appendChild(makeActionWithFeedback("completeBuild", "立刻完成當前建造項目", () => {
            if (!ready) {
                return {
                    success: false,
                    message: "✘ Alex 農場尚未由原版遊戲建立，沒有可完成的建造項目"
                };
            }
            const result = completeCurrentBuild();
            if (result.success) result.rerender = true;
            return result;
        }));

        const farm = V.farm;
        if (ready && farm?.build !== 0 && farm?.build !== undefined) {
            body.appendChild(makeDesc(
                `當前正在建造: <span class="gold">${farm.build}</span> ` +
                `(剩餘天數: ${farm.build_timer ?? 0} 天)`,
                "mt8"
            ));
        } else {
            body.appendChild(makeDesc("當前沒有正在進行的建造項目。", "mt8"));
        }

        appendBr(body);

        body.appendChild(makeActionWithFeedback("instantGrow", "農作物瞬間成熟", () => {
            return instantGrowFarm();
        }));

        body.appendChild(makeDesc(
            "※ 立刻讓農場所有已播種的農田內的作物成熟。",
            "mt8"
        ));

        appendBr(body, 2);

        body.appendChild(makeHeader("細項升級控制 (Detailed Upgrades)"));
        appendBr(body);

        const detailSection = makeEl("div", "dol-section");
        appendSliderSection(detailSection, DETAIL_SLIDERS);
        body.appendChild(detailSection);

        appendBr(body);

        body.appendChild(makeHeader("牲畜與育兒室設置 (Livestock & Nursery)"));
        appendBr(body);

        const livestock = makeEl("div", "dol-section");
        appendSliderSection(livestock, BEAST_SLIDERS);

        livestock.appendChild(makeDesc("農場小屋育兒室解鎖狀態:"));
        livestock.appendChild(makeActionWithFeedback("nursery", "切換育兒室解鎖狀態", () => {
            const result = toggleNursery();
            if (result.success) result.rerender = true;
            return result;
        }));

        const nurseryUnlocked =
            window.C?.npc?.Alex?.pregnancy?.nursery === true;

        livestock.appendChild(makeDesc(
            `當前狀態: <span class="${nurseryUnlocked ? "dol-green" : "dol-red"}">` +
            `${nurseryUnlocked ? "已解鎖 (Unlocked)" : "未解鎖 (Locked)"}</span>`,
            "mt8"
        ));

        body.appendChild(livestock);
        appendBr(body, 2);

        body.appendChild(makeActionWithFeedback("refresh", "刷新面板", () => {
            return {
                success: true,
                message: "✓ 面板已刷新",
                rerender: true
            };
        }));

        shell.appendChild(body);
        root.appendChild(shell);

        if (actionFeedback?.actionId && actionFeedback.result?.message) {
            const target = root.querySelector(
                `[data-ce-action-feedback="${actionFeedback.actionId}"]`
            );
            if (target) {
                showFeedback(
                    target,
                    actionFeedback.result.message,
                    actionFeedback.result.success !== false
                );
            }
        }
    }

    setup.CE_renderFarmCheatPanel = renderFarmPanel;

    Macro.add("CE_farmCheatPanel", {
        handler() {
            const root = document.createElement("div");
            root.className = "CE-farm-cheat-root";
            this.output.appendChild(root);
            renderFarmPanel(root);
        }
    });
})();
