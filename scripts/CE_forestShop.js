/*=========================================
 Cheat Extended - Forest Shop Panel
 JS 重構版

 功能：
 - 顯示森林商店特殊服裝解鎖狀態
 - 目錄同步：缺失服裝補錄到 V.specialClothes
 - 單件解鎖 / 一鍵全部解鎖
 - 故事條件直通 / 事件經歷補全
 - 操作提示僅存在於目前 DOM，不寫入 setup / V
=========================================*/

(() => {
    "use strict";

    const EVENT_IDS = [
        "cocoon",
        "farm_defended",
        "flowerCrownGH",
        "flowers",
        "skulduggery_gift",
        "smuggling",
        "temple_solicitation"
    ];

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

    function makeButton(label, onClick) {
        const wrap = makeEl("div", "dol-btn");
        const button = makeEl("button", "", label);
        button.type = "button";
        button.addEventListener("click", onClick);
        wrap.appendChild(button);
        return wrap;
    }

    function appendFeedback(host, feedback) {
        if (!feedback) return;
        host.appendChild(makeDesc(
            `<span class="${feedback.success === false ? "dol-red" : "green"}">${feedback.message}</span>`,
            "mt8"
        ));
    }

    function getClothesLabel(name) {
        if (!name) return "";
        for (const slot of Object.keys(setup.clothes || {})) {
            const items = setup.clothes[slot] || [];
            for (let i = 0; i < items.length; i++) {
                if (items[i] && items[i].name === name) {
                    return items[i].cn_name_cap || name;
                }
            }
        }
        return name;
    }

    function cloneSets(sets) {
        if (typeof clone === "function") return clone(sets);
        if (typeof structuredClone === "function") return structuredClone(sets);
        try {
            return JSON.parse(JSON.stringify(sets));
        } catch (_) {
            return sets;
        }
    }

    // 目錄同步 upsert：V.specialClothes 缺失條目補錄（sets 克隆目錄）+ 設等級。
    function upsertSpecialClothes(name, level) {
        const V = State.variables;
        const catalogue = Array.isArray(setup.specialClothes) ? setup.specialClothes : [];
        const cat = catalogue.find(item => item && item.name === name);
        if (!cat) return false;

        if (!Array.isArray(V.specialClothes)) V.specialClothes = [];

        let entry = V.specialClothes.find(item => item && item.name === name);
        if (!entry) {
            entry = {
                name: cat.name,
                sets: cloneSets(cat.sets),
                unlocked: 0
            };
            V.specialClothes.push(entry);
        }

        entry.unlocked = level;
        return true;
    }

    // 每個 requirements 函數只包一次；關閉 V.CE_fsReqBypass 時會回到原判定。
    function installRequirementBypass() {
        const sets = setup.specialClothesSets || {};

        Object.keys(sets).forEach(key => {
            const set = sets[key];
            if (!set || typeof set.requirements !== "function") return;
            if (set.requirements.__CE_FS_reqBypassWrapped) return;

            const original = set.requirements;
            const wrapped = function () {
                if (State.variables.CE_fsReqBypass === true) return true;
                return original.apply(this, arguments);
            };

            Object.defineProperty(wrapped, "__CE_FS_reqBypassWrapped", {
                value: true,
                configurable: false,
                enumerable: false,
                writable: false
            });
            Object.defineProperty(wrapped, "__CE_FS_originalRequirement", {
                value: original,
                configurable: false,
                enumerable: false,
                writable: false
            });

            set.requirements = wrapped;
        });
    }

    function render(root, feedback = null) {
        const V = State.variables;
        root.replaceChildren();

        installRequirementBypass();

        const shell = makeEl("div", "dol-settings dol-shadow");
        const header = makeEl("div", "dol-header");
        header.appendChild(makeEl("span", "dol-title", "🦊 格皇我要攻略你呀"));
        shell.appendChild(header);

        const body = makeEl("div", "dol-body");
        body.appendChild(makeDesc("解鎖森林商店的專屬特殊服裝，媽媽再也不用擔心我要快一年才能開始談戀愛了。"));
        body.appendChild(document.createElement("br"));

        const discovered = Array.isArray(V.specialClothes) ? V.specialClothes : null;
        const catalogue = Array.isArray(setup.specialClothes) ? setup.specialClothes : null;

        if (discovered && discovered.length && catalogue) {
            const unlockedCount = catalogue.filter(cat =>
                cat && discovered.some(item => item && item.name === cat.name && Number(item.unlocked || 0) >= 3)
            ).length;

            body.appendChild(makeDesc(`已解鎖特殊服裝：<span class="dol-blue">${unlockedCount} / ${catalogue.length}</span>`));
            body.appendChild(document.createElement("br"));

            const lockedNames = catalogue
                .filter(cat => cat && cat.name && !discovered.some(item =>
                    item && item.name === cat.name && Number(item.unlocked || 0) >= 3
                ))
                .map(cat => cat.name);

            if (lockedNames.length) {
                body.appendChild(makeDesc("逐件解鎖（僅列出未解鎖的款式）："));

                const select = document.createElement("select");
                lockedNames.forEach(name => {
                    const option = document.createElement("option");
                    option.value = name;
                    option.textContent = getClothesLabel(name);
                    select.appendChild(option);
                });
                body.appendChild(select);
                body.appendChild(document.createElement("br"));
                body.appendChild(document.createElement("br"));

                const unlockOneHost = makeEl("div");
                unlockOneHost.appendChild(makeButton("解鎖選中服裝", () => {
                    const name = select.value;
                    const label = getClothesLabel(name);
                    const ok = !!name && upsertSpecialClothes(name, 3);

                    render(root, {
                        actionId: "unlock-one",
                        success: ok,
                        message: ok ? `✓ 已解鎖：${label}` : "✘ 選中的特殊服裝目前無法解鎖"
                    });
                }));
                if (feedback?.actionId === "unlock-one") appendFeedback(unlockOneHost, feedback);
                body.appendChild(unlockOneHost);
                body.appendChild(document.createElement("br"));
            }

            const unlockAllHost = makeEl("div");
            unlockAllHost.appendChild(makeButton("一鍵解鎖全部特殊服裝", () => {
                let added = 0;

                catalogue.forEach(cat => {
                    if (!cat || !cat.name) return;
                    const already = Array.isArray(V.specialClothes) && V.specialClothes.some(item =>
                        item && item.name === cat.name && Number(item.unlocked || 0) >= 3
                    );
                    if (!already && upsertSpecialClothes(cat.name, 3)) added++;
                });

                render(root, {
                    actionId: "unlock-all",
                    success: true,
                    message: added > 0
                        ? `✓ 已新增解鎖 ${added} 件特殊服裝`
                        : "✓ 所有特殊服裝皆已解鎖"
                });
            }));
            if (feedback?.actionId === "unlock-all") appendFeedback(unlockAllHost, feedback);
            body.appendChild(unlockAllHost);
        } else {
            body.appendChild(makeDesc(
                '<span class="dol-red">尚未發現特殊服裝目錄</span>' +
                '<span class="note">：需先向格威嵐打聽過特殊服裝（$specialClothes 建立後此功能可用）。</span>'
            ));
        }

        body.appendChild(document.createElement("br"));
        body.appendChild(document.createElement("hr"));

        const storyTitle = makeEl("div", "dol-label mt15", "📖 故事條件助手");
        storyTitle.style.fontWeight = "bold";
        storyTitle.style.fontSize = "1.05em";
        body.appendChild(storyTitle);

        body.appendChild(makeDesc(
            "服裝故事選項受套裝條件（如觸手適應、蛛繭經歷）與事件經歷（specialClothesEvents）把門，未滿足時段內只剩「沒故事可以講」。直通開啟後所有故事選項可選；事件補全覆蓋劇情內聯檢查（如聖誕套裝）。"
        ));
        body.appendChild(document.createElement("br"));

        const eventList = Array.isArray(V.specialClothesEvents) ? V.specialClothesEvents : [];
        const eventCount = EVENT_IDS.filter(id => eventList.includes(id)).length;
        body.appendChild(makeDesc(
            `條件直通：${V.CE_fsReqBypass === true
                ? '<span class="dol-green">已開啟</span>'
                : '<span class="dol-red">未開啟</span>'}；` +
            `事件經歷：<span class="dol-blue">${eventCount} / ${EVENT_IDS.length}</span>`
        ));
        body.appendChild(document.createElement("br"));

        const bypassHost = makeEl("div");
        const bypassEnabled = V.CE_fsReqBypass === true;
        bypassHost.appendChild(makeButton(
            bypassEnabled ? "關閉故事條件直通" : "開啟故事條件直通",
            () => {
                V.CE_fsReqBypass = !bypassEnabled;
                render(root, {
                    actionId: "req-bypass",
                    success: true,
                    message: V.CE_fsReqBypass
                        ? "✓ 已開啟故事條件直通"
                        : "✓ 已關閉故事條件直通，恢復原版判定"
                });
            }
        ));
        if (feedback?.actionId === "req-bypass") appendFeedback(bypassHost, feedback);
        body.appendChild(bypassHost);
        body.appendChild(document.createElement("br"));

        const eventHost = makeEl("div");
        eventHost.appendChild(makeButton("補全服裝事件經歷", () => {
            if (!Array.isArray(V.specialClothesEvents)) V.specialClothesEvents = [];

            let added = 0;
            EVENT_IDS.forEach(id => {
                if (!V.specialClothesEvents.includes(id)) {
                    V.specialClothesEvents.push(id);
                    added++;
                }
            });

            render(root, {
                actionId: "event-fill",
                success: true,
                message: added > 0
                    ? `✓ 已補全 ${added} 項服裝事件經歷`
                    : "✓ 服裝事件經歷已全部補全"
            });
        }));
        if (feedback?.actionId === "event-fill") appendFeedback(eventHost, feedback);
        body.appendChild(eventHost);

        body.appendChild(makeDesc(
            '<span class="note">※ 解鎖為「目錄同步」：沒遇見過的服裝也會補進你的發現列表（套裝湊齊才會出現對應故事，講完故事才正式結算好感）；「故事條件直通」可隨時開關，關閉即恢復原版判定。服裝中文名來自漢化包（未安裝時顯示英文名）；解鎖後到格威嵐貨架購買，穿去聊天有額外試裝劇情分支。</span>',
            "mt8"
        ));

        shell.appendChild(body);
        root.appendChild(shell);
    }

    Macro.add("CE_forestShopPanel", {
        handler() {
            const root = document.createElement("div");
            this.output.appendChild(root);
            render(root);
        }
    });
})();
