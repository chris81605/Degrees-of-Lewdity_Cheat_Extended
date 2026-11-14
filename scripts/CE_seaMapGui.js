/*=========================================
 Cheat Extended - Sea Map GUI
 海洋探索導覽圖：只讀取 $sea，不修改原版游泳流程。
=========================================*/
(() => {
    "use strict";
    const ID = "ce-sea-map-gui";
    const STYLE_ID = ID + "-style";
    let view;

    function zone(n) {
        if (n === 0) return "海岸附近";
        if (n <= 20) return "近海";
        if (n <= 50) return "外海";
        if (n < 100) return "遠海";
        return "堡壘島附近";
    }

    function installStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #${ID} { margin: 0 0 1.2em; padding: 14px 16px; background: #142b3c; border: 1px solid #387e9d; border-radius: 9px; color: #e8f5ff; }
            #${ID} * { box-sizing: border-box; }
            #${ID} .sea-title { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 12px; }
            #${ID} .sea-title span:last-child { font-size: .85em; opacity: .8; }
            #${ID} .sea-scroll { overflow-x: auto; padding: 48px 30px; }
            #${ID} .sea-track { position: relative; min-width: 650px; height: 8px; border-radius: 10px; background: #34556c; }
            #${ID} .sea-fill { height: 100%; border-radius: inherit; background: #48b8d8; }
            #${ID} .sea-player { position: absolute; top: 50%; transform: translate(-50%, -50%); z-index: 10; }
            #${ID} .sea-player-dot { width: 16px; height: 16px; border-radius: 50%; background: white; border: 3px solid #168eb8; box-shadow: 0 0 0 4px #ffffff25; }
            #${ID} .sea-player-label { position: absolute; top: 18px; left: 50%; transform: translateX(-50%); font-size: .75em; }
            #${ID} .sea-place { position: absolute; transform: translateX(-50%); font-size: .75em; white-space: nowrap; opacity: .85; }
            #${ID} .sea-place.above { bottom: 23px; }
            #${ID} .sea-place.below { top: 23px; }
            #${ID} .sea-note { text-align: center; font-size: .75em; opacity: .7; }
        `;
        document.head.appendChild(style);
    }

    function render() {
        view.clear();
        if (State.passage !== "Sea" || !V.CE_SeaMapGUI) return;
        const target = document.querySelector("#passage-content") || document.querySelector("#passages");
        if (!target) return;
        const depth = Math.max(0, Math.min(100, Number(V.sea) || 0));
        const gui = document.createElement("div");
        gui.id = ID;
        const title = document.createElement("div");
        title.className = "sea-title";
        const name = document.createElement("strong");
        name.textContent = "🌊 " + zone(depth);
        const number = document.createElement("span");
        number.textContent = depth + " / 100";
        title.append(name, number);
        const scroll = document.createElement("div");
        scroll.className = "sea-scroll";
        const track = document.createElement("div");
        track.className = "sea-track";
        const fill = document.createElement("div");
        fill.className = "sea-fill";
        fill.style.width = depth + "%";
        const player = document.createElement("div");
        player.className = "sea-player";
        player.style.left = depth + "%";
        player.innerHTML = '<div class="sea-player-dot"></div><div class="sea-player-label">你</div>';
        track.append(fill, player);
        const markers = [
            [0, "🏖️ 海岸", "above"],
            [20, "近海", "below"],
            [50, "外海", "above"],
            [80, "遠海", "below"],
            [100, "🏝️ 堡壘島", "above"]
        ];
        for (const [position, label, side] of markers) {
            const marker = document.createElement("div");
            marker.className = "sea-place " + side;
            marker.style.left = position + "%";
            marker.textContent = label;
            track.appendChild(marker);
        }
        scroll.appendChild(track);
        const note = document.createElement("div");
        note.className = "sea-note";
        note.textContent = "地點與海域為概略標示；目前位置依海洋探索進度顯示。";
        gui.append(title, scroll, note);
        view.own(gui);
        target.prepend(gui);
        view.frame(() => {
            scroll.scrollLeft = Math.max(0, player.offsetLeft - scroll.clientWidth / 2);
        });
    }

    installStyle();
    view = setup.CE_mapView(ID, render);
})();
