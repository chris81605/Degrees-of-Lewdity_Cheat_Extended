/****************************************
 * 以下为 DoLP 合并版追加（v1.20.1-dolp）
 ****************************************/

/* 安全屋助手: 伊甸户外进度锁定 + 农田自动浇水
 * 开关: V.CE_edenOutdoorLock / V.CE_autoWater（安全屋助手面板）
 * 每次 passage 切换时若开关开启则强制回满/补浇，覆盖游戏内一切重置路径。
 * 用 State.variables 取当前活对象，避免旧克隆引用。 */
$(document).on(':passagestart', function () {
    var SV = State.variables;
    if (SV.CE_edenOutdoorLock) {
        SV.edengarden = 4;
        SV.edenshrooms = 4;
        SV.edenspring = 4;
    }
    if (SV.CE_autoWater && SV.plots) {
        Object.keys(SV.plots).forEach(function (k) {
            var arr = SV.plots[k];
            if (Array.isArray(arr)) {
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] && typeof arr[i] === 'object') arr[i].water = 1;
                }
            }
        });
    }
});

/*
 安全屋助手 (v1.20.1-dolp 繁體版)
 布局改用作者新版 UI 範式（dol-section-block / dol-label / dol-actions / dol-btn）。
 變數體系與 v1.19.6 相同：
   - 鷹塔 (Bird Tower / Great Hawk / 巨鷹之塔): $bird.upgrades 12 項 / $bird.materials 8 素材 / $bird.hunts 5 解鎖
     升級變數最大值: decor 5, firepit/pot/rack/nest/shelter 3, 其餘 1; 火塘燃料上限隨升級變化(upgradeBirdFirepit)
   - 伊甸小屋: 戶外三項 $edengarden/$edenshrooms/$edenspring 0-4; 鎖定 V.CE_edenOutdoorLock + :passagestart 鉤子
     室內 $daily.eden.sweep/sew/salve/soap/supplies/lunch 每日重置
   - 孤兒院閣樓: $loft_known/whitney(6)/gh(3)/river/kylar/independentLab/doren/sam/wren(2); $loft_upgrade 為安裝計數(全開=8)
     river 解鎖同時初始化 $loftIngredients {}
   - 農田自動澆水: V.CE_autoWater + :passagestart 鉤子遍歷 $plots 全部地塊組置 water=1
*/

(() => {
    "use strict";

    setup.CE_LoftKitchen = setup.CE_LoftKitchen || {};
    setup.CE_LoftKitchen.allKeys = function () {
        const ingredients = new Set();
        const foodstuff = setup.foodstuff || {};
        Object.keys(foodstuff).forEach(key => {
            const recipe = foodstuff[key] && foodstuff[key].recipe;
            if (recipe && Array.isArray(recipe.ingredients)) {
                recipe.ingredients.forEach(ingredient => ingredients.add(ingredient));
            }
        });
        return Array.from(ingredients);
    };

    const TABS = [
        {
            id: "bird",
            label: "🦅 鷹塔",
            condition: () => {
                const V = State.variables;
                return V.debug === 1 ||
                    (V.bird && V.bird.syndrome !== undefined);
            }
        },
        {
            id: "eden",
            label: "🌲 伊甸",
            condition: () => {
                const V = State.variables;
                return V.debug === 1 ||
                    V.edenfreedom >= 1 ||
                    V.syndromeeden >= 1;
            }
        },
        { id: "loft", label: "🪜 閣樓" },
        { id: "farm", label: "💧 農田" },
        {
            id: "manor",
            label: "🏰 莊園",
            condition: () => {
                const V = State.variables;
                return V.debug === 1 ||
                    (V.avery_mansion && typeof V.avery_mansion === "object");
            }
        },
        { id: "other", label: "🏚️ 其他" },
    ];

    const BIRD_UPGRADES = [
        ["mirror", "鏡子", 0, 1, 1],
        ["tools", "工具箱", 0, 1, 1],
        ["tarp", "防雨布", 0, 1, 1],
        ["telescope", "望遠鏡", 0, 1, 1],
        ["shelter", "遮雨棚", 0, 3, 1],
        ["nest", "巢穴", 0, 3, 1],
        ["firepit", "火塘", 0, 3, 1],
        ["pot", "湯鍋", 0, 3, 1],
        ["rack", "晾架", 0, 3, 1],
        ["snare", "陷阱", 0, 1, 1],
        ["decor", "裝飾", 0, 5, 1],
        ["wardrobe", "衣櫃", 0, 1, 1],
    ];

    const BIRD_MATERIALS = [
        ["wood", "木材", 0, 500, 10],
        ["fabric", "布料", 0, 500, 10],
        ["sticks", "樹枝", 0, 500, 10],
        ["leaves", "樹葉", 0, 500, 10],
        ["junk", "廢品", 0, 500, 10],
        ["lurkers", "潛伏獸材料", 0, 500, 10],
        ["leather", "皮革", 0, 500, 10],
        ["feathers", "羽毛", 0, 500, 10],
    ];

    function makeEl(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
    }

    function makeButton(label, onClick, className = "") {
        const btn = makeEl("button", className, label);
        btn.type = "button";
        btn.addEventListener("click", onClick);
        return btn;
    }

    function makeDesc(html, className = "") {
        const el = makeEl("div", `dol-desc${className ? ` ${className}` : ""}`);
        el.innerHTML = html;
        return el;
    }

    function makeSection(title) {
        const section = makeEl("div", "dol-section-block CE-safehouse-section");
        if (title) section.appendChild(makeEl("div", "CE-safehouse-section-title", title));
        return section;
    }

    function makeActions() {
        return makeEl("div", "dol-actions CE-safehouse-actions");
    }

    function appendAction(actions, label, onClick, className = "") {
        const wrap = makeEl("span", `dol-btn${className ? ` ${className}` : ""}`);
        wrap.appendChild(makeButton(label, onClick));
        actions.appendChild(wrap);
        return wrap;
    }

    function clampNumber(value, min, max) {
        value = Number(value);
        if (!Number.isFinite(value)) value = min;
        return Math.min(max, Math.max(min, value));
    }

    function isValidRangeValue(raw) {
        return (
            typeof raw === "number" && Number.isFinite(raw)
        ) || (
            typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw))
        );
    }

    function formatRangeValue(raw) {
        if (raw === undefined) return "undefined";
        if (raw === null) return "null";
        if (typeof raw === "string" && raw.trim() === "") return "空字符串";
        try { return String(raw); } catch (_) { return "[無法顯示]"; }
    }

    /*
     * 安全數值滑塊：沿用農場助手的防護原則。
     * - 不把 undefined / NaN / 非數字偷偷改成 min。
     * - 當前值異常時只隱藏該滑塊並顯示診斷，不影響後續控制項渲染。
     * - 當前值只是超出正常範圍時，暫時擴張滑塊範圍，避免渲染時改寫遊戲資料。
     * - 寫入前再次驗證目標物件與數值，單一控制項失敗不向外拋錯。
     */
    function makeRangeControl(label, object, key, minArg, maxArg, stepArg, onChange, disabled = false) {
        const row = makeEl("div", "CE-safehouse-range-row");
        const head = makeEl("div", "CE-safehouse-range-head");
        const name = makeEl("label", "CE-safehouse-range-label", label);
        head.appendChild(name);
        row.appendChild(head);

        const min = Number(minArg);
        const max = Number(maxArg);
        const step = Number(stepArg);
        const rawValue = object && typeof object === "object" ? object[key] : undefined;
        const valueValid = isValidRangeValue(rawValue);
        const configValid = Number.isFinite(min) && Number.isFinite(max) && Number.isFinite(step) && min <= max && step > 0;

        if (!configValid || !valueValid) {
            const warning = makeDesc("");
            warning.style.margin = "4px 0 8px 0";
            warning.appendChild(makeEl("span", "dol-red", "當前值或滑塊參數無效，已隱藏滑塊"));
            warning.appendChild(document.createElement("br"));
            warning.append(`當前值：${formatRangeValue(rawValue)}`);
            warning.appendChild(document.createElement("br"));
            warning.append(`正常範圍：${minArg} - ${maxArg}`);
            row.appendChild(warning);
            return row;
        }

        const value = Number(rawValue);
        let actualMin = min;
        let actualMax = max;
        if (value < min) actualMin = min - Math.ceil((min - value) / step) * step;
        if (value > max) actualMax = max + Math.ceil((value - max) / step) * step;

        const number = document.createElement("input");
        number.type = "number";
        number.className = "CE-safehouse-range-number";
        number.min = actualMin;
        number.max = actualMax;
        number.step = step;
        number.value = value;

        const range = document.createElement("input");
        range.type = "range";
        range.className = "CE-safehouse-range";
        range.min = actualMin;
        range.max = actualMax;
        range.step = step;
        range.value = value;

        number.disabled = disabled;
        range.disabled = disabled;
        head.appendChild(number);
        row.appendChild(range);

        if (!disabled) {
            const apply = raw => {
                try {
                    if (!object || typeof object !== "object") return;
                    if (!isValidRangeValue(raw)) return;
                    const next = Number(raw);
                    if (!Number.isFinite(next)) return;
                    object[key] = next;
                    number.value = String(next);
                    range.value = String(next);
                    onChange?.(next);
                } catch (e) {
                    console.warn("CE safehouse: range update", key, e);
                }
            };

            range.addEventListener("input", () => apply(range.value));
            number.addEventListener("change", () => apply(number.value));
        }

        return row;
    }

    function makeDetails(title, content, open = false) {
        const details = makeEl("details", "CE-safehouse-details");
        details.open = open;
        details.appendChild(makeEl("summary", "", title));
        details.appendChild(content);
        return details;
    }

    function getBirdViewData() {
        const bird = State.variables.bird;
        const ready = !!(
            bird &&
            typeof bird === "object" &&
            bird.syndrome !== undefined &&
            bird.upgrades && typeof bird.upgrades === "object" &&
            bird.materials && typeof bird.materials === "object" &&
            bird.hunts && typeof bird.hunts === "object"
        );

        if (ready) return { ready: true, bird };

        return {
            ready: false,
            bird: {
                upgrades: {},
                materials: {},
                hunts: {
                    unlocked: false,
                    lurkers: false,
                    materials: false,
                    valuables: false,
                    estate: false
                }
            }
        };
    }

    function setActionDisabled(wrap, disabled) {
        const button = wrap?.querySelector("button");
        if (button) button.disabled = disabled;
    }

    function fillFirepit() {
        try {
            const bird = State.variables.bird;
            const firepit = bird && bird.firepit;
            if (!firepit || typeof Cooker === "undefined" || !Cooker.getBurnTime || !Cooker.addBurnTime) return;
            const cur = Cooker.getBurnTime(firepit) || 0;
            const max = firepit.maxBurnTime || 0;
            if (max > cur) Cooker.addBurnTime(firepit, max - cur);
        } catch (e) {
            console.warn("CE safehouse: firepit fill", e);
        }
    }

    function updateFirepit() {
        try {
            if (typeof upgradeBirdFirepit === "function") upgradeBirdFirepit();
        } catch (e) {
            console.warn("CE safehouse: upgradeBirdFirepit", e);
        }
    }

    function renderBird(host, refresh) {
        const { ready, bird } = getBirdViewData();
        host.appendChild(makeEl("div", "CE-safehouse-panel-title", "🦅 鷹塔（巨鷹之塔）"));
        if (!ready) {
            host.appendChild(makeDesc('<span class="note">Debug 預覽：鷹塔尚未由原版劇情初始化，目前控制項僅供查看，不會建立或修改鷹塔資料。</span>'));
        }

        const quick = makeSection();
        quick.appendChild(makeDesc('升級 12 項 / 素材 8 種 / 獨立狩獵解鎖 5 項。'));
        quick.appendChild(makeDesc('<span class="note">※ 依據原版鷹塔升級變數：裝飾最大值 5；火塘 / 湯鍋 / 晾架 / 巢穴 / 遮雨棚最大值 3；其餘最大值 1。</span>'));

        const actions = makeActions();
        const maxTowerAction = appendAction(actions, "一鍵滿級塔樓", () => {
            if (!ready) {
                refresh({ id: "bird", success: false, message: "✘ 當前尚未解鎖鷹塔，無法修改鷹塔資料" });
                return;
            }
            Object.assign(bird.upgrades, { mirror: 1, tools: 1, tarp: 1, telescope: 1, shelter: 3, nest: 3, firepit: 3, pot: 3, rack: 3, snare: 1, decor: 5, wardrobe: 1 });
            bird.mirror_unknown = 1;
            Object.assign(bird.hunts, { unlocked: true, lurkers: true, materials: true, valuables: true, estate: true });
            updateFirepit();
            fillFirepit();
            refresh({ id: "bird", message: "✓ 鷹塔升級、狩獵解鎖與火塘燃料已處理完成" });
        });
        const materialAction = appendAction(actions, "素材補給 +50", () => {
            if (!ready) {
                refresh({ id: "bird", success: false, message: "✘ 當前尚未解鎖鷹塔，無法修改鷹塔資料" });
                return;
            }
            BIRD_MATERIALS.forEach(([key]) => {
                const current = Number(bird.materials[key]);
                bird.materials[key] = (Number.isFinite(current) ? current : 0) + 50;
            });
            refresh({ id: "bird", message: "✓ 鷹塔素材已全部補給 +50" });
        });
        const firepitAction = appendAction(actions, "火塘燃料加滿", () => {
            if (!ready) {
                refresh({ id: "bird", success: false, message: "✘ 當前尚未解鎖鷹塔，無法修改鷹塔資料" });
                return;
            }
            if (bird.upgrades.firepit >= 1) updateFirepit();
            fillFirepit();
            refresh({ id: "bird", message: "✓ 火塘燃料已加滿" });
        });
        quick.appendChild(actions);

        const hunt = bird.hunts;
        quick.appendChild(makeDesc(`獨立狩獵：<span class="${hunt.unlocked ? "green" : "dol-red"}">${hunt.unlocked ? "已解鎖" : "未解鎖"}</span>（潛伏獸 ${hunt.lurkers ? "✔" : "✘"} / 素材 ${hunt.materials ? "✔" : "✘"} / 財寶 ${hunt.valuables ? "✔" : "✘"} / 莊園 ${hunt.estate ? "✔" : "✘"}）`, "mt10"));

        const birdFeedback = makeDesc("", "mt8");
        birdFeedback.dataset.ceFeedback = "bird";
        quick.appendChild(birdFeedback);

        host.appendChild(quick);

        const upgradeGrid = makeEl("div", "CE-safehouse-control-grid");
        BIRD_UPGRADES.forEach(([key, label, min, max, step]) => {
            upgradeGrid.appendChild(makeRangeControl(`${label} (${min}-${max})`, bird.upgrades, key, min, max, step, key === "firepit" ? updateFirepit : null, !ready));
        });
        host.appendChild(makeDetails("升級細項", upgradeGrid));

        const materialGrid = makeEl("div", "CE-safehouse-control-grid");
        BIRD_MATERIALS.forEach(([key, label, min, max, step]) => {
            materialGrid.appendChild(makeRangeControl(`${label} (${min}-${max})`, bird.materials, key, min, max, step, null, !ready));
        });
        host.appendChild(makeDetails("素材細項", materialGrid));
    }

    function renderEden(host, refresh) {
        const V = State.variables;
        V.CE_edenOutdoorLock ??= false;
        V.daily ??= {};
        V.daily.eden ??= {};

        host.appendChild(makeEl("div", "CE-safehouse-panel-title", "🌲 伊甸小屋"));
        const section = makeSection();
        section.appendChild(makeDesc(`戶外雜務：菜園 <span class="dol-blue">${V.edengarden || 0}</span> / 4，蘑菇 <span class="dol-blue">${V.edenshrooms || 0}</span> / 4，泉水 <span class="dol-blue">${V.edenspring || 0}</span> / 4${V.CE_edenOutdoorLock ? '　<span class="green">進度已鎖定：無論遊戲內如何重置，三項都會自動保持完成。</span>' : ''}`));

        const outdoor = makeActions();
        if (V.CE_edenOutdoorLock) {
            appendAction(outdoor, "解鎖戶外進度", () => { V.CE_edenOutdoorLock = false; refresh(); });
        } else {
            appendAction(outdoor, "一鍵完成戶外雜務", () => { V.edengarden = 4; V.edenshrooms = 4; V.edenspring = 4; refresh(); });
            appendAction(outdoor, "鎖定戶外進度（保持完成）", () => { V.CE_edenOutdoorLock = true; V.edengarden = 4; V.edenshrooms = 4; V.edenspring = 4; refresh(); });
        }
        section.appendChild(outdoor);

        const d = V.daily.eden;
        section.appendChild(makeDesc(`室內家務（每日重置）：掃地 ${d.sweep || 0}、縫紉 ${d.sew || 0}、藥膏 ${d.salve || 0}、肥皂 ${d.soap || 0}、補給 ${d.supplies || 0}、午餐 ${d.lunch || 0}`, "mt10"));
        const indoor = makeActions();
        appendAction(indoor, "一鍵完成室內家務", () => {
            Object.assign(d, { sweep: 1, sew: 1, salve: 1, soap: 1, supplies: 1, lunch: 1 });
            refresh();
        });
        section.appendChild(indoor);
        host.appendChild(section);
    }

    function loftStatusCard(label, value, max) {
        const card = makeEl("div", "CE-safehouse-status-card");
        card.appendChild(makeEl("span", "CE-safehouse-status-label", label));
        const complete = max ? Number(value || 0) >= max : !!value;
        card.appendChild(makeEl("span", complete ? "green" : "dol-red", max ? `${value || 0}/${max}` : (complete ? "✔" : "✘")));
        return card;
    }

    function renderLoftKitchen(host, refresh) {
        const V = State.variables;
        if (V.debug !== 1 && V.loft_river === undefined && V.loftIngredients === undefined) return;
        V.CE_loftKitchenInfinite ??= false;

        const section = makeSection("🍳 秘密廚房");
        section.appendChild(makeDesc(`無限食材：<span class="${V.CE_loftKitchenInfinite ? "green" : "dol-red"}">${V.CE_loftKitchenInfinite ? "已開啟" : "未開啟"}</span>`));

        const actions = makeActions();
        appendAction(actions, V.CE_loftKitchenInfinite ? "關閉無限食材" : "開啟無限食材", () => {
            V.CE_loftKitchenInfinite = !V.CE_loftKitchenInfinite;
            refresh();
        });
        section.appendChild(actions);
        section.appendChild(makeDesc('<span class="note">※ 開啟後秘密廚房直接視為供應所有配方食材，不再受共享食材櫃庫存與每日衰減限制。</span>', "mt10"));
        host.appendChild(section);
    }

    function renderLoft(host, refresh) {
        const V = State.variables;
        V.loft_upgrade ??= 0;
        host.appendChild(makeEl("div", "CE-safehouse-panel-title", "🪜 孤兒院閣樓（科技解鎖）"));

        const section = makeSection();
        const status = makeEl("div", "CE-safehouse-status-grid");
        status.append(
            loftStatusCard("發現閣樓", V.loft_known),
            loftStatusCard("惠特尼房間", V.loft_whitney, 6),
            loftStatusCard("巨鷹飄窗", V.loft_gh, 3),
            loftStatusCard("瑞雯廚房", V.loft_river),
            loftStatusCard("凱拉房間", V.loft_kylar),
            loftStatusCard("獨立實驗室", V.loft_independentLab),
            loftStatusCard("多倫讀書角", V.loft_doren),
            loftStatusCard("薩姆咖啡角", V.loft_sam),
            loftStatusCard("雷恩房間", V.loft_wren, 2)
        );
        section.appendChild(status);

        const all = makeActions();
        appendAction(all, "一鍵解鎖全部閣樓功能", () => {
            V.loft_known = 1;
            V.loft_whitney = 6;
            V.loft_gh = 3;
            V.loft_river = 1;
            V.loft_kylar = 1;
            V.loft_independentLab = 1;
            V.loft_doren = 1;
            V.loft_sam = 1;
            V.loft_wren = 2;
            V.loft_upgrade = 8;
            V.loftIngredients ??= {};
            refresh();
        }, "dol-gold-btn");
        section.appendChild(all);

        const unlockGrid = makeEl("div", "CE-safehouse-unlock-grid");
        const unlocks = [
            ["發現閣樓", "loft_known", 1, false],
            ["惠特尼房間（6 級）", "loft_whitney", 6, true],
            ["巨鷹飄窗（3 級）", "loft_gh", 3, true],
            ["瑞雯廚房", "loft_river", 1, true, true],
            ["凱拉房間", "loft_kylar", 1, true],
            ["獨立實驗室", "loft_independentLab", 1, true],
            ["多倫讀書角", "loft_doren", 1, true],
            ["薩姆咖啡角", "loft_sam", 1, true],
            ["雷恩房間（2 級）", "loft_wren", 2, true],
        ];

        unlocks.forEach(([label, key, value, countUpgrade, initIngredients]) => {
            const btn = makeButton(label, () => {
                if (countUpgrade && !V[key]) V.loft_upgrade += 1;
                V[key] = value;
                if (initIngredients) V.loftIngredients ??= {};
                refresh();
            }, "CE-safehouse-unlock-btn");
            if (V[key]) btn.classList.add("CE-done");
            unlockGrid.appendChild(btn);
        });

        section.appendChild(makeDetails("單個解鎖", unlockGrid, true));
        section.appendChild(makeDesc('<span class="note">※ 再也不用煩惱要攻略角色才能開閣樓科技了。</span>', "mt10"));
        host.appendChild(section);
        renderLoftKitchen(host, refresh);
    }

    function renderFarm(host, refresh) {
        const V = State.variables;
        V.CE_autoWater ??= false;
        V.CE_autoFarm ??= false;
        V.CE_autoFarmSeed ??= "";
        V.CE_autoFarmToast ??= true;

        host.appendChild(makeEl("div", "CE-safehouse-panel-title", "💧 農田管理"));

        const waterSection = makeSection("💧 自動澆水");
        waterSection.appendChild(makeDesc(`自動澆水：<span class="${V.CE_autoWater ? "green" : "dol-red"}">${V.CE_autoWater ? "已開啟（所有土地自動保持澆灌）" : "未開啟"}</span>`));
        const waterActions = makeActions();
        appendAction(waterActions, V.CE_autoWater ? "關閉自動澆水" : "開啟自動澆水（全部土地）", () => { V.CE_autoWater = !V.CE_autoWater; refresh(); });
        waterSection.appendChild(waterActions);
        waterSection.appendChild(makeDesc('<span class="note">※ 自動澆灌所有據點的土地：孤兒院菜園、艾利克斯農場與溫室等全部地塊組自動發現（含未來新增）。</span>', "mt10"));
        host.appendChild(waterSection);

        const autoSection = makeSection("🌾 自動收穫與補種");
        autoSection.appendChild(makeDesc(`自動收穫：<span class="${V.CE_autoFarm ? "green" : "dol-red"}">${V.CE_autoFarm ? "已開啟" : "未開啟"}</span>；遊戲內提示：<span class="${V.CE_autoFarmToast !== false ? "green" : "dol-red"}">${V.CE_autoFarmToast !== false ? "開" : "關"}</span>`));

        const autoActions = makeActions();
        appendAction(autoActions, V.CE_autoFarm ? "關閉自動收穫" : "開啟自動收穫", () => { V.CE_autoFarm = !V.CE_autoFarm; refresh(); });
        appendAction(autoActions, V.CE_autoFarmToast !== false ? "關閉收穫提示" : "開啟收穫提示", () => { V.CE_autoFarmToast = V.CE_autoFarmToast === false; refresh(); });
        autoSection.appendChild(autoActions);

        const seedList = [];
        if (Array.isArray(V.plants_known)) {
            V.plants_known.forEach(key => {
                const item = setup.foodstuff && setup.foodstuff[key];
                if (item && item.tending && item.tending.has_seeds) seedList.push(key);
            });
        } else if (V.plants_known && typeof V.plants_known === "object") {
            Object.keys(V.plants_known).forEach(key => {
                if (!V.plants_known[key]) return;
                const item = setup.foodstuff && setup.foodstuff[key];
                if (item && item.tending && item.tending.has_seeds) seedList.push(key);
            });
        }

        const seedRow = makeEl("div", "dol-actions CE-safehouse-actions mt10");
        const seedLabel = makeEl("label", "dol-label", "自動補種作物：");
        const seedSelect = document.createElement("select");
        const none = document.createElement("option");
        none.value = "";
        none.textContent = "（不補種，只收穫）";
        seedSelect.appendChild(none);
        seedList.forEach(key => {
            const option = document.createElement("option");
            option.value = key;
            const item = setup.foodstuff[key] || {};
            option.textContent = item.plural || item.name || item.singular || item.displayName || item.label || key;
            seedSelect.appendChild(option);
        });
        seedSelect.value = seedList.includes(V.CE_autoFarmSeed) ? V.CE_autoFarmSeed : "";
        if (seedSelect.value !== V.CE_autoFarmSeed) V.CE_autoFarmSeed = seedSelect.value;
        seedSelect.addEventListener("change", () => { V.CE_autoFarmSeed = seedSelect.value; });
        seedRow.append(seedLabel, seedSelect);
        autoSection.appendChild(seedRow);

        const tools = makeActions("mt10");
        appendAction(tools, "解鎖全部種子", () => {
            if (typeof unlockAllSeeds === "function") unlockAllSeeds();
            else if (typeof window.unlockAllSeeds === "function") window.unlockAllSeeds();
            refresh({ id: "farm", message: "✓ 已解鎖全部種子" });
        });
        appendAction(tools, "全部作物瞬間成熟", () => {
            if (V.plots && typeof V.plots === "object") {
                Object.keys(V.plots).forEach(location => {
                    if (typeof tendingInstaGrow === "function") tendingInstaGrow(location);
                    else if (typeof window.tendingInstaGrow === "function") window.tendingInstaGrow(location);
                });
            }
            refresh({ id: "farm", message: "✓ 已將目前所有作物催熟" });
        });
        autoSection.appendChild(tools);

        const farmFeedback = makeDesc("", "mt8");
        farmFeedback.dataset.ceFeedback = "farm";
        autoSection.appendChild(farmFeedback);

        if (V.CE_autoFarmLastLog && (V.CE_autoFarmLastLog.plots >= 1 || V.CE_autoFarmLastLog.replanted >= 1)) {
            const log = V.CE_autoFarmLastLog;
            const crops = Array.isArray(log.crops) && log.crops.length ? `（${log.crops.join("、")}）` : "";
            const replanted = log.replanted >= 1 ? `，補種 ${log.replanted} 塊` : "";
            autoSection.appendChild(makeDesc(`📋 上次自動收穫：${log.stamp || ""}收穫 <span class="dol-blue">${log.plots || 0}</span> 塊${crops}${replanted}`, "mt8"));
        }
        autoSection.appendChild(makeDesc('<span class="note">※ 成熟地塊自動收穫；選擇補種作物後，空地會自動補種並在當日澆水。覆蓋所有 $plots 地塊組。</span>', "mt10"));
        host.appendChild(autoSection);
    }

    function renderManor(host, refresh) {
        const V = State.variables;
        V.CE_manorClean ??= false;
        host.appendChild(makeEl("div", "CE-safehouse-panel-title", "🏰 艾弗里莊園"));

        const section = makeSection("🧹 自動管家");
        const rooms = setup.CE_ManorHelper?.rooms || ["lounge", "kitchen", "dining", "display", "bedroom", "bathroom", "garden", "pool"];
        let dirt = 0;
        if (V.avery_mansion && typeof V.avery_mansion === "object") {
            rooms.forEach(room => { dirt += Number(V.avery_mansion[room] || 0); });
            section.appendChild(makeDesc(`自動打掃：<span class="${V.CE_manorClean ? "green" : "dol-red"}">${V.CE_manorClean ? "已開啟" : "未開啟"}</span>；莊園髒度總和：<span class="dol-blue">${dirt}</span> / 32`));
        } else {
            section.appendChild(makeDesc(`自動打掃：<span class="${V.CE_manorClean ? "green" : "dol-red"}">${V.CE_manorClean ? "已開啟" : "未開啟"}</span>；<span class="note">尚未進入艾弗里莊園，解鎖後自動生效。</span>`));
        }

        const actions = makeActions();
        appendAction(actions, V.CE_manorClean ? "關閉自動打掃" : "開啟自動打掃", () => { V.CE_manorClean = !V.CE_manorClean; refresh(); });
        if (V.avery_mansion && typeof V.avery_mansion === "object") {
            appendAction(actions, "立即整理莊園", () => { setup.CE_ManorHelper?.cleanNow?.(); refresh(); });
        }
        section.appendChild(actions);
        section.appendChild(makeDesc('<span class="note">※ 開啟後八個房間會在每次場景切換時自動恢復乾淨。</span>', "mt10"));
        host.appendChild(section);
    }

    function renderOther(host) {
        host.appendChild(makeEl("div", "CE-safehouse-panel-title", "🏚️ 其餘安全屋"));
        const section = makeSection();
        section.appendChild(makeDesc('以下安全屋沒有素材型升級體系，無需作弊項：<br>孤兒院臥室（裝飾在商店購買）、艾利克斯小屋（農場升級見「農場助手」）、神殿、狼洞、妓院與脫衣舞俱樂部（不可睡覺，僅淋浴與衣櫃）、精神病院、地下農場、地下妓院、監獄（監禁類，設施受限是設計的一部分）。'));
        section.appendChild(makeDesc('<span class="note">※ 監獄的鏡子需遊玩解鎖；狼洞的信任體系與狼群互動綁定，無獨立升級變數。</span>', "mt10"));
        host.appendChild(section);
    }

    function renderSafehouse(root) {
        const visibleTabs = TABS.filter(tab => {
            try {
                return !tab.condition || tab.condition();
            } catch (e) {
                console.warn("CE safehouse: tab condition", tab.id, e);
                return false;
            }
        });

        setup.CE_safehouseTab ??= visibleTabs[0]?.id || "other";
        if (!visibleTabs.some(tab => tab.id === setup.CE_safehouseTab)) {
            setup.CE_safehouseTab = visibleTabs[0]?.id || "other";
        }
        root.replaceChildren();

        const shell = makeEl("div", "dol-settings dol-shadow CE-safehouse-shell");
        const header = makeEl("div", "dol-header");
        header.appendChild(makeEl("span", "dol-title", "安全屋助手"));
        shell.appendChild(header);

        const body = makeEl("div", "dol-body");
        const tabs = makeEl("div", "CE-safehouse-tabs");
        visibleTabs.forEach(tab => {
            const wrap = makeEl("span", `CE-safehouse-tab${setup.CE_safehouseTab === tab.id ? " CE-active" : ""}`);
            wrap.appendChild(makeButton(tab.label, () => {
                setup.CE_safehouseTab = tab.id;
                renderSafehouse(root);
            }));
            tabs.appendChild(wrap);
        });
        body.appendChild(tabs);

        const content = makeEl("div", "CE-safehouse-content");
        const refresh = (feedback) => {
            renderSafehouse(root);
            if (!feedback) return;
            requestAnimationFrame(() => {
                const target = root.querySelector(`[data-ce-feedback="${feedback.id}"]`);
                if (!target) return;
                target.innerHTML = `<span class="${feedback.success === false ? "dol-red" : "green"}">${feedback.message}</span>`;
            });
        };
        if (setup.CE_safehouseTab === "bird") renderBird(content, refresh);
        else if (setup.CE_safehouseTab === "eden") renderEden(content, refresh);
        else if (setup.CE_safehouseTab === "loft") renderLoft(content, refresh);
        else if (setup.CE_safehouseTab === "farm") renderFarm(content, refresh);
        else if (setup.CE_safehouseTab === "manor") renderManor(content, refresh);
        else renderOther(content, refresh);

        body.appendChild(content);
        shell.appendChild(body);
        root.appendChild(shell);
    }

    setup.CE_renderSafehousePanel = renderSafehouse;

    Macro.add("CE_safehouseCheatPanel", {
        handler() {
            const root = document.createElement("div");
            root.className = "CE-safehouse-root";
            this.output.appendChild(root);
            renderSafehouse(root);
        }
    });
})();
