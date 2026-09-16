/* =========================================
 * CE_autoFarm.js — 自動收穫與補種 (v1.20.8-dolp)
 * =========================================
 * 機制（:passagestart 掃描 V.plots 全部地塊組，garden/farm/wolf/eden/asylum 自動發現）：
 *   1. stage === 5（成熟）→ 依遊戲 tending_harvest 公式入帳 $foodstuff[type].amount，
 *      再按 clear_plot 邏輯清地（含水肥衰減）
 *   2. 空地（stage === 0）且已選補種作物 → 先依原版 bed 規則判斷植物/地塊相容，
 *      再調用遊戲原生 window.plantSeedsInPlot 補種並澆水
 *
 * 產量公式（與 Widgets Tending 的 tending_harvest 完全一致）：
 *   small/medium/large 基量 × tending 技能係數 × 植物yield_multiplier × 地塊品質(1.2/1.4/1.6)
 *   × 綠手指1.2 × $settings.tendingYieldModifier(預設5)
 *
 * 種子為知識制：V.plants_known（原版 debug 的 unlockAllSeeds() 即全部寫入此處）
 * ========================================= */
(function () {
    "use strict";

    function tendingSkill() {
        try {
            if (typeof currentSkillValue === "function") return currentSkillValue("tending") || 0;
            if (typeof window.currentSkillValue === "function") return window.currentSkillValue("tending") || 0;
        } catch (e) { /* 降級為 0 */ }
        return 0;
    }

    function rnd(min, max) { /* SugarCube random() 等價：含兩端整數 */
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function clampNum(v, lo, hi) {
        if (typeof Math.clamp === "function") return Math.clamp(v, lo, hi);
        return Math.min(hi, Math.max(lo, v));
    }

    function harvestPlot(plot) {
        var V = State.variables;
        var type = plot.plant;
        if (!type || type === "none") return 0;

        if (!V.foodstuff[type]) V.foodstuff[type] = { amount: 0 };

        var t = Math.floor((tendingSkill() || 0) / 100);
        var amount;
        switch (plot.size) {
            case "small":  amount = rnd(Math.floor(6 + t * 0.6),  Math.floor(12 + t * 1.2)); break;
            case "medium": amount = rnd(Math.floor(6 + t * 1.2),  Math.floor(18 + t * 1.8)); break;
            default:       amount = rnd(Math.floor(12 + t * 2.4), Math.floor(24 + t * 4.8));
        }

        var plantDef = (setup.foodstuff && setup.foodstuff[type]) || null;
        var ym = (plantDef && plantDef.tending && typeof plantDef.tending.yield_multiplier === "number")
            ? plantDef.tending.yield_multiplier : 1;
        amount *= ym;

        var q = clampNum(plot.quality || 1, 1, 4);
        if (q === 4) amount *= 1.6;
        else if (q === 3) amount *= 1.4;
        else if (q === 2) amount *= 1.2;

        if (Array.isArray(V.backgroundTraits) && V.backgroundTraits.includes("greenthumb")) amount *= 1.2;
        amount *= (V.settings && typeof V.settings.tendingYieldModifier === "number") ? V.settings.tendingYieldModifier : 5;

        amount = Math.trunc(amount);
        V.foodstuff[type].amount = (V.foodstuff[type].amount || 0) + amount;
        return amount;
    }

    function clearPlot(plot) { /* clear_plot 邏輯（含水肥衰減） */
        var V = State.variables;
        var noGreen = !(Array.isArray(V.backgroundTraits) && V.backgroundTraits.includes("greenthumb"));
        if (plot.baseQuality !== undefined && noGreen) {
            if (plot.fertiliserDecay > 0) plot.fertiliserDecay--;
            if (plot.fertiliserDecay === 0 && plot.quality > plot.baseQuality) {
                plot.quality--;
                if (plot.quality > plot.baseQuality) {
                    plot.fertiliserDecay = (plot.size !== "large") ? 3 : 2;
                }
            }
        }
        plot.water = 0;
        plot.days = 0;
        plot.plant = "none";
        plot.till = 0;
        plot.stage = 0;
    }

    function plantLabel(type) {
        try {
            var def = setup.foodstuff && setup.foodstuff[type];
            if (def) {
                return def.plural ||
                    def.name ||
                    def.singular ||
                    def.displayName ||
                    def.label ||
                    String(type).replace(/_/g, " ");
            }
        } catch (e) { /* ignore */ }
        return String(type).replace(/_/g, " ");
    }

    /*
     * 原版種植 UI 會先比較植物要求的 bed 與地塊 bed，
     * plantSeedsInPlot() 本身只負責執行種植，不會替呼叫端做合法性判斷。
     *
     * 舊資料結構：setup.plants[type].bed
     * 新 foodstuff 結構：兼容 tending.bed / bed
     */
    function getPlantBed(type) {
        try {
            var legacy = setup.plants && setup.plants[type];
            if (legacy && typeof legacy.bed === "string" && legacy.bed) return legacy.bed;

            var def = setup.foodstuff && setup.foodstuff[type];
            if (def) {
                if (def.tending && typeof def.tending.bed === "string" && def.tending.bed) return def.tending.bed;
                if (typeof def.bed === "string" && def.bed) return def.bed;
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    function canPlantInPlot(plot, type) {
        if (!plot || typeof plot !== "object") return false;
        var plantBed = getPlantBed(type);
        var plotBed = (typeof plot.bed === "string" && plot.bed) ? plot.bed : null;

        /*
         * 無法確認任一方 bed 時不自動補種。
         * Cheat 可以少補種，但不能越過原版限制把陸生作物塞進水床。
         */
        if (!plantBed || !plotBed) return false;
        return plantBed === plotBed;
    }

    function showToast(text) { /* v1.20.10: 遊戲內右下角收穫提示，7 秒淡出 */
        try {
            var wrap = document.getElementById("CE_autoFarm_toast_wrap");
            if (!wrap) {
                wrap = document.createElement("div");
                wrap.id = "CE_autoFarm_toast_wrap";
                wrap.className = "CE-autoFarm-toast-wrap";
                document.body.appendChild(wrap);
            }
            var toast = document.createElement("div");
            toast.className = "CE-autoFarm-toast";
            toast.textContent = text;
            wrap.appendChild(toast);
            requestAnimationFrame(function () { toast.classList.add("show"); });
            setTimeout(function () {
                toast.classList.remove("show");
                setTimeout(function () { toast.remove(); }, 400);
            }, 7000);
        } catch (e) { console.warn("[Cheat Extended] 自動收穫 toast 失敗：", e); }
    }

    function run() {
        var V = State.variables;
        if (V.CE_autoFarm !== true) return;
        if (V.CE_autoFarmToast === undefined) V.CE_autoFarmToast = true;
        if (!V.plots || typeof V.plots !== "object") return;

        var seed = V.CE_autoFarmSeed;
        var seedOk = !!(seed
            && typeof setup.foodstuff === "object"
            && setup.foodstuff[seed]
            && setup.foodstuff[seed].tending
            && setup.foodstuff[seed].tending.has_seeds);

        var harvested = 0, totalCrops = 0, replanted = 0, crops = {};
        Object.keys(V.plots).forEach(function (location) {
            var list = V.plots[location];
            if (!Array.isArray(list)) return;
            list.forEach(function (plot) {
                if (!plot || typeof plot !== "object") return;
                if (plot.stage === 5 && plot.plant && plot.plant !== "none") {
                    var cropType = plot.plant;
                    var got = harvestPlot(plot);
                    clearPlot(plot);
                    harvested++;
                    if (got > 0) {
                        totalCrops += got;
                        crops[cropType] = (crops[cropType] || 0) + got;
                    }
                }
                if (plot.stage === 0 && (!plot.plant || plot.plant === "none") && seedOk
                    && canPlantInPlot(plot, seed)
                    && typeof plantSeedsInPlot === "function") {
                    plantSeedsInPlot(plot, seed);
                    plot.water = 1; /* 補種當日即澆水，與自動澆水語義一致 */
                    replanted++;
                }
            });
        });

        if (harvested || replanted) {
            var parts = Object.keys(crops).map(function (k) { return plantLabel(k) + " +" + crops[k]; });
            var dateStamp = "";
            try {
                if (V.month !== undefined && V.day !== undefined) dateStamp = V.month + "月" + V.day + "日 ";
            } catch (e) { /* ignore */ }
            V.CE_autoFarmLastLog = { stamp: dateStamp, plots: harvested, replanted: replanted, crops: parts };
            console.log("[Cheat Extended] 🌾 自動收穫 " + harvested + " 塊（+" + totalCrops + " 作物入庫），補種 " + replanted + " 塊");
            if (harvested > 0 && V.CE_autoFarmToast !== false) {
                showToast("🌾 自動收穫 " + harvested + " 塊：" + (parts.join("、") || "無產出") + (replanted ? "；補種 " + replanted + " 塊" : ""));
            }
        }
    }

    if (typeof $ === "function") $(document).on(":passagestart", run);
})();
