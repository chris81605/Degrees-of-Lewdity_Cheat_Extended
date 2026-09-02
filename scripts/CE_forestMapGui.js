/*=========================================
 Cheat Extended - Forest Map GUI

 森林探索地圖
 - 顯示目前森林探索深度
 - 記錄並顯示已發現地點
 - 使用 CE_ForestMapGUI 開關
=========================================*/

(() => {
	"use strict";

	const ID = "forest-map-gui";
	const STYLE_ID = ID + "-style";
	const EVENT_NS = ".ForestMapGUI";

	if (V.CE_ForestMapGUI === undefined) {
		V.CE_ForestMapGUI = true;
	}

	function isForest() {
		return State.passage === "Forest";
	}

	function getZone(n) {
		if (n <= 0) return "森林郊區";
		if (n <= 20) return "森林外圍";
		if (n <= 50) return "森林中段";
		if (n < 100) return "森林深處";
		return "森林盡頭";
	}

	function ensureDiscoveryStore() {
		if (!V.forestMapDiscovered) {
			V.forestMapDiscovered = {};
		}

		return V.forestMapDiscovered;
	}

	function discoverPlace(id) {
		ensureDiscoveryStore()[id] = true;
	}

	function isDiscovered(id) {
		return !!ensureDiscoveryStore()[id];
	}

	const places = [
		{
			id: "town",
			name: "城鎮",
			pos: 0,
			discover: () => true
		},
		{
			id: "churchyard",
			name: "老教堂墓地",
			pos: 12,
			discover: () =>
				V.forest >= 10 &&
				V.forest <= 14
		},
		{
			id: "lakeShore",
			name: "湖岸",
			pos: 27,
			discover: () =>
				V.forest > 20 &&
				V.forest <= 30
		},
		{
			id: "waterfall",
			name: "瀑布",
			pos: 35,
			discover: () =>
				V.forest > 30 &&
				V.forest <= 40
		},
		{
			id: "fishingRock",
			name: "釣魚岩",
			pos: 45,
			discover: () =>
				V.forest > 40 &&
				V.forest <= 50
		},
		{
			id: "chimera",
			name: "巨石",
			pos: 55,
			discover: () =>
				V.forest === 55
		},
		{
			id: "eden",
			name: "伊甸小屋",
			pos: 68,
			discover: () =>
				V.forest > 50 &&
				V.forest < 100 &&
				(
					V.edenfreedom >= 1 ||
					V.syndromeeden >= 1
				)
		},
		{
			id: "wolfCave",
			name: "狼洞",
			pos: 74,
			discover: () =>
				V.forest > 50 &&
				V.forest < 100 &&
				V.syndromewolves >= 1
		},
		{
			id: "honey",
			name: "蜂蜜池",
			pos: 84,
			discover: () =>
				V.forest >= 80 &&
				V.forest <= 90 &&
				V.fishing_place_honey_unlock === true
		},
		{
			id: "brook",
			name: "小溪",
			pos: 88,
			discover: () =>
				V.forest >= 80 &&
				V.forest <= 90 &&
				V.brookIntro >= 1
		},
		{
			id: "asylum",
			name: "精神病院",
			pos: 100,
			discover: () =>
				V.forest >= 100
		}
	];

	function updateDiscoveries() {
		for (const place of places) {
			try {
				if (
					!isDiscovered(place.id) &&
					place.discover &&
					place.discover()
				) {
					discoverPlace(place.id);

					console.log(
						"[Cheat Extended][ForestMapGUI] 發現地點:",
						place.name
					);
				}
			} catch (err) {
				console.warn(
					"[Cheat Extended][ForestMapGUI] 地點判定失敗:",
					place.name,
					err
				);
			}
		}
	}

	/* =========================================================
	 * 手機版自動定位目前位置
	 * ========================================================= */

	function scrollToPlayer(scroller, player) {
		if (!scroller || !player) return;

		requestAnimationFrame(() => {
			if (!scroller.isConnected || !player.isConnected) return;
			if (scroller.scrollWidth <= scroller.clientWidth) return;

			const scrollerRect = scroller.getBoundingClientRect();
			const playerRect = player.getBoundingClientRect();

			const playerCenter =
				playerRect.left - scrollerRect.left +
				scroller.scrollLeft + playerRect.width / 2;

			const maxScroll =
				Math.max(0, scroller.scrollWidth - scroller.clientWidth);

			scroller.scrollLeft = Math.max(
				0,
				Math.min(maxScroll, playerCenter - scroller.clientWidth / 2)
			);
		});
	}

	function installStyle() {
		if (document.getElementById(STYLE_ID)) {
			return;
		}

		const style = document.createElement("style");
		style.id = STYLE_ID;

		style.textContent = `
			#${ID} {
				margin: 0 0 1.2em;
				padding: 14px 16px 12px;
				border: 1px solid rgba(100, 145, 105, .55);
				border-radius: 9px;
				background: rgba(24, 40, 28, .95);
				color: #eee;
			}

			#${ID} * {
				box-sizing: border-box;
			}

			#${ID} .forest-map-title {
				display: flex;
				justify-content: space-between;
				align-items: center;
				font-weight: bold;
				margin-bottom: 40px;
			}

			#${ID} .forest-map-depth {
				font-size: .8em;
				opacity: .65;
			}

			#${ID} .forest-map {
				padding: 42px 14px 42px;
			}

			#${ID} .forest-map-track {
				position: relative;
				height: 8px;
				border-radius: 999px;
				background: rgba(255,255,255,.12);
			}

			#${ID} .forest-map-fill {
				position: absolute;
				left: 0;
				top: 0;
				height: 100%;
				border-radius: inherit;
				background: #6ea876;
			}

			#${ID} .forest-map-player {
				position: absolute;
				top: 50%;
				transform: translate(-50%, -50%);
				z-index: 10;
			}

			#${ID} .forest-map-player-dot {
				width: 16px;
				height: 16px;
				border-radius: 50%;
				background: white;
				border: 3px solid #4f8257;
				box-shadow: 0 0 0 4px rgba(255,255,255,.12);
			}

			#${ID} .forest-map-player-text {
				position: absolute;
				top: 18px;
				left: 50%;
				transform: translateX(-50%);
				white-space: nowrap;
				font-size: .75em;
				font-weight: bold;
			}

			#${ID} .forest-map-place {
				position: absolute;
				top: 50%;
				transform: translateX(-50%);
				z-index: 4;
			}

			#${ID} .forest-map-place-dot {
				position: absolute;
				left: 50%;
				top: 50%;
				width: 9px;
				height: 9px;
				border-radius: 50%;
				transform: translate(-50%, -50%);
				background: #a8c5a9;
				border: 2px solid #263d2a;
			}

			#${ID} .forest-map-place-line {
				position: absolute;
				left: 50%;
				width: 1px;
				background: rgba(255,255,255,.22);
			}

			#${ID} .forest-map-place-label {
				position: absolute;
				left: 50%;
				transform: translateX(-50%);
				white-space: nowrap;
				font-size: .68em;
				opacity: .85;
			}

			#${ID} .forest-map-place.above .forest-map-place-line {
				height: 20px;
				bottom: 4px;
			}

			#${ID} .forest-map-place.above .forest-map-place-label {
				bottom: 25px;
			}

			#${ID} .forest-map-place.below .forest-map-place-line {
				height: 20px;
				top: 4px;
			}

			#${ID} .forest-map-place.below .forest-map-place-label {
				top: 25px;
			}

			#${ID} .forest-map-note {
				margin-top: 2px;
				font-size: .7em;
				opacity: .45;
				text-align: center;
			}

			@media (max-width: 600px) {
				#${ID} .forest-map {
					overflow-x: auto;
					padding-left: 25px;
					padding-right: 25px;
				}

				#${ID} .forest-map-track {
					min-width: 650px;
				}
			}
		`;

		document.head.appendChild(style);
	}

	function render() {
		document.getElementById(ID)?.remove();

		if (!V.CE_ForestMapGUI) {
			return;
		}

		if (!isForest()) {
			return;
		}

		const target =
			document.querySelector("#passage-content") ||
			document.querySelector("#passages");

		if (!target) {
			console.warn(
				"[Cheat Extended][ForestMapGUI] 找不到 passage 容器"
			);
			return;
		}

		updateDiscoveries();

		const depth = Math.max(
			0,
			Math.min(
				100,
				Number(V.forest) || 0
			)
		);

		const gui = document.createElement("div");
		gui.id = ID;

		const title = document.createElement("div");
		title.className = "forest-map-title";

		title.innerHTML = `
			<span>🌲 ${getZone(depth)}</span>
			<span class="forest-map-depth">
				${depth} / 100
			</span>
		`;

		const map = document.createElement("div");
		map.className = "forest-map";

		const track = document.createElement("div");
		track.className = "forest-map-track";

		const fill = document.createElement("div");
		fill.className = "forest-map-fill";
		fill.style.width = `${depth}%`;

		const player = document.createElement("div");
		player.className = "forest-map-player";
		player.style.left = `${depth}%`;

		player.innerHTML = `
			<div class="forest-map-player-dot"></div>
			<div class="forest-map-player-text">你</div>
		`;

		track.append(fill, player);

		for (const place of places) {
			if (!isDiscovered(place.id)) {
				continue;
			}

			const marker = document.createElement("div");
			marker.className = "forest-map-place";
			marker.style.left = `${place.pos}%`;

			const above = place.pos % 2 === 0;

			if (above) {
				marker.classList.add("above");
			} else {
				marker.classList.add("below");
			}

			marker.innerHTML = `
				<div class="forest-map-place-label">
					${place.name}
				</div>
				<div class="forest-map-place-line"></div>
				<div class="forest-map-place-dot"></div>
			`;

			track.appendChild(marker);
		}

		map.appendChild(track);

		const note = document.createElement("div");
		note.className = "forest-map-note";
		note.textContent =
			"已探索過的地點會記錄在森林地圖上；部分位置為區段內的概略標示。";

		gui.append(
			title,
			map,
			note
		);

		target.prepend(gui);
		scrollToPlayer(map, player);
	}

	if (window.jQuery) {
		jQuery(document).off(EVENT_NS);
	}

	installStyle();

	if (window.jQuery) {
		jQuery(document).on(
			":passagedisplay" + EVENT_NS,
			() => {
				setTimeout(render, 0);
			}
		);
	}

	render();
})();