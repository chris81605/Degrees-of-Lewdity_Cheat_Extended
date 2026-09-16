/*=========================================
 Cheat Extended - Hopeless Cycle Panel
 JS 重構版

 功能：
 - 一鍵解鎖絕望輪迴全部結局與挑戰 S 記錄
 - 取得博物館畫像
 - 操作提示僅存在於目前 DOM，不寫入 setup / V
=========================================*/

(() => {
    "use strict";

    const ENDINGS = ["F", "E", "D", "C", "B", "A", "S"];

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

    function runWiki(code) {
        try {
            Wikifier.wikifyEval(code);
            return true;
        } catch (e) {
            console.warn("[CE] Hopeless Cycle wiki action failed:", code, e);
            return false;
        }
    }

    function render(root, feedback = null) {
        const V = State.variables;
        root.replaceChildren();

        const shell = makeEl("div", "dol-settings dol-shadow");
        const header = makeEl("div", "dol-header");
        header.appendChild(makeEl("span", "dol-title", "🖼️ 絕望輪迴全結局解鎖"));
        shell.appendChild(header);

        const body = makeEl("div", "dol-body");
        body.appendChild(makeDesc(
            "實在不想玩遊戲中的小遊戲，流程好長而且沒什麼意思，故做出了此功能。" +
            "一鍵解鎖全部結局：F憎恨 / E疑懼 / D停滯 / C永劫 / B絕途 / A癡愛 / S隱藏" +
            "（含成就「信仰的試煉」與挑戰模式全 S 記錄）。"
        ));

        const seen = Array.isArray(V.hcEndings) && V.hcEndings.length
            ? V.hcEndings.join(" ")
            : "（無）";
        body.appendChild(makeDesc(`已見結局：<span class="dol-blue">${seen}</span>`));
        body.appendChild(document.createElement("br"));

        body.appendChild(makeButton("一鍵解鎖全部結局", () => {
            if (!Array.isArray(V.hcEndings)) V.hcEndings = [];

            let added = 0;
            ENDINGS.forEach(letter => {
                if (!V.hcEndings.includes(letter)) {
                    V.hcEndings.push(letter);
                    added++;
                }
            });

            try {
                localStorage.setItem("hopelessCycle", ENDINGS.join(","));
            } catch (e) {
                console.warn("[CE] 絕望輪迴 localStorage 寫入失敗", e);
            }

            if (!V.hcChallengesCompleted || typeof V.hcChallengesCompleted !== "object") {
                V.hcChallengesCompleted = {};
            }

            (setup.hopelessCycleChallenges || []).forEach(challenge => {
                if (challenge && challenge.key) {
                    V.hcChallengesCompleted[challenge.key] = "S";
                }
            });

            runWiki('<<earnFeat "Trials of Faith">>');

            render(root, added > 0
                ? { success: true, message: `✓ 已新增解鎖 ${added} 個結局，挑戰紀錄已設為全 S` }
                : { success: true, message: "✓ 全部結局已經解鎖，挑戰紀錄已設為全 S" });
        }));

        body.appendChild(document.createElement("br"));

        body.appendChild(makeButton("取得畫像（博物館展出）", () => {
            const alreadyInMuseum =
                V.museumAntiques?.paintings?.paintingsnake === "museum";

            runWiki("<<updateMuseumAntiques>>");

            if (!V.museumAntiques || typeof V.museumAntiques !== "object") {
                V.museumAntiques = {};
            }
            if (!V.museumAntiques.paintings || typeof V.museumAntiques.paintings !== "object") {
                V.museumAntiques.paintings = {};
            }
            V.museumAntiques.paintings.paintingsnake = "museum";

            render(root, alreadyInMuseum
                ? { success: true, message: "✓ 絕望輪迴畫像原本就已在博物館展出" }
                : { success: true, message: "✓ 已取得絕望輪迴畫像並送往博物館展出" });
        }));

        body.appendChild(makeDesc(
            '<span class="note">※ 取得畫像後，到博物館畫像區即可觀看故事（結局已全解鎖時可直接翻到各結局）。挑戰模式紀錄會被標為全 S，屬預期。</span>',
            "mt8"
        ));

        // 一次性操作提示：只存在於本次渲染出的 DOM。
        if (feedback) {
            body.appendChild(makeDesc(
                `<span class="${feedback.success === false ? "dol-red" : "green"}">${feedback.message}</span>`,
                "mt8"
            ));
        }

        shell.appendChild(body);
        root.appendChild(shell);
    }

    Macro.add("CE_hopelessCyclePanel", {
        handler() {
            const root = document.createElement("div");
            this.output.appendChild(root);
            render(root);
        }
    });
})();
