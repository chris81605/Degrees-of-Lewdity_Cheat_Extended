/*=========================================
 Cheat Extended - 艾弗里莊園助手
 JS 重構版（DoLP 場景助手功能回移）
=========================================*/
(function () {
    "use strict";

    const ROOMS = ["lounge", "kitchen", "dining", "display", "bedroom", "bathroom", "garden", "pool"];
    const SCENES = {
        drink:   { label: "🍸 調酒", passage: "Mansion Return Drink Accept" },
        massage: { label: "💆 按摩", passage: "Mansion Return Massage Accept" },
        walk:    { label: "🚶 散步", passage: "Mansion Return Walk" },
        sit:     { label: "📺 看電視", passage: "Mansion Return Sit" },
        bathe:   { label: "🛁 共浴", passage: "Mansion Return Bathe" },
        ride:    { label: "🏎️ 兜風", passage: "Mansion Return Ride" },
        dungeon: { label: "⛓️ 地牢", passage: "Mansion Dungeon Intro" }
    };

    function mansion() {
        const V = State.variables;
        return V.avery_mansion && typeof V.avery_mansion === "object" ? V.avery_mansion : null;
    }

    function cleanNow() {
        const M = mansion();
        if (!M) return 0;
        let dirty = 0;
        ROOMS.forEach(room => {
            if (typeof M[room] === "number" && M[room] > 0) dirty++;
            M[room] = 0;
        });
        return dirty;
    }

    // DoLP v1.20.70/74：要求全免 + 每天視為已回家。
    // 與魔改版不同，這裡不吞掉整段錯誤；只在資料存在時修改已知欄位。
    function enforceRequirements() {
        const V = State.variables;
        if (V.CE_averyReqPass !== true) return false;
        const M = mansion();
        if (!M) return false;

        if (typeof M.days_absent === "number" && M.days_absent !== 0) M.days_absent = 0;
        cleanNow();

        const rage = M.rage;
        if (rage && typeof rage === "object") {
            if (typeof rage.dinner_missed === "number") rage.dinner_missed = 0;
            if ("dinner_wrong" in rage) rage.dinner_wrong = false;
            if ("ingredients" in rage) delete rage.ingredients;
            if (typeof rage.assess === "number") rage.assess = 0;
        }
        return true;
    }

    function passageExists(name) {
        try {
            if (typeof Story !== "undefined" && typeof Story.has === "function") return Story.has(name);
        } catch (_) {}
        return true; // 舊環境無 Story.has 時交由 Engine.play 處理。
    }

    function playScene(id) {
        const scene = SCENES[id];
        if (!scene) return { ok: false, message: "未知的艾弗里場景。" };
        if (!mansion()) return { ok: false, message: "尚未建立艾弗里莊園資料，請先正常解鎖莊園。" };
        if (!passageExists(scene.passage)) return { ok: false, message: `找不到場景：${scene.passage}` };

        try {
            // 原場景依賴 person1；先建立 Avery NPC context，再延遲切 passage。
            if (typeof Wikifier !== "undefined" && typeof Wikifier.wikifyEval === "function") {
                Wikifier.wikifyEval("<<npc Avery>><<person1>>");
            }
            setTimeout(() => {
                try {
                    const engine = (typeof SugarCube !== "undefined" && SugarCube.Engine) || (typeof Engine !== "undefined" && Engine);
                    if (!engine || typeof engine.play !== "function") throw new Error("Engine.play unavailable");
                    engine.play(scene.passage);
                } catch (e) {
                    console.warn("[Cheat Extended] 艾弗里場景跳轉失敗：", e);
                }
            }, 0);
            return { ok: true, message: `正在進入：${scene.label}` };
        } catch (e) {
            console.warn("[Cheat Extended] 艾弗里場景初始化失敗：", e);
            return { ok: false, message: "場景初始化失敗，詳見控制台。" };
        }
    }

    function unlockDateInvite() {
        const M = mansion();
        if (!M) return false;
        M.date_seen = false;
        if (M.rage && typeof M.rage === "object") M.rage.work = false;
        return true;
    }

    function run() {
        const V = State.variables;
        if (V.CE_manorClean === true) {
            const dirty = cleanNow();
            if (dirty > 0) console.log(`[Cheat Extended] 🏰 艾弗里莊園自動打掃：清理 ${dirty} 個房間`);
        }
        enforceRequirements();
    }

    setup.CE_ManorHelper = {
        rooms: ROOMS.slice(),
        scenes: Object.assign({}, SCENES),
        cleanNow,
        enforceRequirements,
        playScene,
        unlockDateInvite
    };

    function el(tag, cls, text) {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined) node.textContent = text;
        return node;
    }
    function desc(html, cls = "") {
        const node = el("div", `dol-desc${cls ? ` ${cls}` : ""}`);
        node.innerHTML = html;
        return node;
    }
    function button(label, fn) {
        const wrap = el("span", "dol-btn");
        const b = el("button", "", label);
        b.type = "button";
        b.addEventListener("click", fn);
        wrap.appendChild(b);
        return wrap;
    }

    function renderPanel(root, feedback = "") {
        const V = State.variables;
        V.CE_manorClean ??= false;
        V.CE_averyReqPass ??= false;
        root.replaceChildren();

        const shell = el("div", "dol-settings dol-shadow");
        const header = el("div", "dol-header");
        header.appendChild(el("span", "dol-title", "艾弗里助手"));
        shell.appendChild(header);
        const body = el("div", "dol-body");
        body.appendChild(desc("莊園自動管家、要求全免掛機、迷你約會直達。"));

        const M = mansion();
        let dirt = 0;
        if (M) ROOMS.forEach(r => { dirt += Number(M[r] || 0); });

        body.appendChild(el("div", "dol-label mt15", "🏰 艾弗里莊園（自動管家）"));
        body.appendChild(desc(`自動打掃：<span class="${V.CE_manorClean ? "green" : "dol-red"}">${V.CE_manorClean ? "已開啟" : "未開啟"}</span>；${M ? `莊園髒度總和：<span class="dol-blue">${dirt}</span> / 32` : '<span class="note">尚未進入艾弗里莊園（解鎖後自動生效）</span>'}`, "mt8"));
        const cleanActions = el("div", "dol-actions mt10");
        cleanActions.appendChild(button(V.CE_manorClean ? "關閉自動打掃" : "開啟自動打掃", () => { V.CE_manorClean = !V.CE_manorClean; renderPanel(root); }));
        if (M) cleanActions.appendChild(button("立即整理莊園", () => { cleanNow(); renderPanel(root, "✓ 莊園已整理完成"); }));
        body.appendChild(cleanActions);

        body.appendChild(el("div", "dol-label mt15", "🤝 要求全免（掛機模式）"));
        body.appendChild(desc("開啟後會持續清除八房家政、晚餐失誤、憤怒評估與缺席計數，等效每天都回家；不會因這些要求累積懲罰。"));
        body.appendChild(desc('<span class="note">※ 代價：親自完成要求所帶來的事件好感加成不會因此取得。</span>', "mt8"));
        body.appendChild(desc(`目前：<span class="${V.CE_averyReqPass ? "green" : "dol-red"}">${V.CE_averyReqPass ? "開啟" : "關閉"}</span>　憤怒評估 = ${Number(M?.rage?.assess || 0)}　缺席 = ${Number(M?.days_absent || 0)}`, "mt8"));
        const reqActions = el("div", "dol-actions mt10");
        reqActions.appendChild(button(V.CE_averyReqPass ? "關閉要求全免" : "開啟要求全免（掛機不管艾弗里）", () => {
            V.CE_averyReqPass = !V.CE_averyReqPass;
            if (V.CE_averyReqPass) enforceRequirements();
            renderPanel(root);
        }));
        body.appendChild(reqActions);

        body.appendChild(el("div", "dol-label mt15", "💘 迷你約會直達"));
        body.appendChild(desc("七個原生場景一鍵直達；場景本身的時間、疲勞與關係數值結算仍由原版處理。"));
        const sceneActions = el("div", "dol-actions mt10");
        Object.keys(SCENES).forEach(id => sceneActions.appendChild(button(SCENES[id].label, () => {
            const result = playScene(id);
            if (!result.ok) renderPanel(root, `✘ ${result.message}`);
        })));
        body.appendChild(sceneActions);
        body.appendChild(desc('<span class="note">※ 建議在莊園內使用；地牢等場景仍建議先正常解鎖。JS 入口會檢查莊園資料與 passage 是否存在。</span>', "mt8"));

        body.appendChild(el("div", "dol-label mt15", "💘 約會邀約"));
        body.appendChild(desc("解除本週已邀約／工作憤怒旗標；之後依原版可邀約時段重新進入莊園即可觸發。"));
        const dateActions = el("div", "dol-actions mt10");
        dateActions.appendChild(button("🚦 解鎖本週邀約", () => renderPanel(root, unlockDateInvite() ? "✓ 已解鎖本週邀約" : "✘ 尚未建立艾弗里莊園資料")));
        body.appendChild(dateActions);

        if (feedback) body.appendChild(desc(`<span class="${feedback.startsWith("✘") ? "dol-red" : "green"}">${feedback}</span>`, "mt10"));
        shell.appendChild(body);
        root.appendChild(shell);
    }

    if (typeof Macro !== "undefined" && Macro.add) {
        Macro.add("CE_averyHelperPanel", {
            handler() {
                const root = document.createElement("div");
                this.output.appendChild(root);
                renderPanel(root);
            }
        });
    }

    if (typeof $ === "function") $(document).on(":passagestart", run);
})();
