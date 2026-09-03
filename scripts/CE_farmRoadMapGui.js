/*=========================================
 Cheat Extended - Farm Road Map GUI

 鄉間道路探索地圖
 - 顯示目前所在的道路區段
 - 記錄並顯示已探索區域
 - 未探索區域不會提前顯示
 - 使用 CE_FarmRoadMapGUI 獨立開關
=========================================*/

(() => {
	"use strict";

	const ID = "farm-road-map-gui";
	const STYLE_ID = ID + "-style";
	const EVENT_NS = ".FarmRoadMapGUI";

	/* =========================================================
	 * 開關初始化
	 * ========================================================= */

	if (V.CE_FarmRoadMapGUI === undefined) {
		V.CE_FarmRoadMapGUI = false;
	}

	/* =========================================================
	 * 道路區段
	 * ========================================================= */

	const ROAD = {
		"Farm Road 1": {
			index: 1,
			id: "road1",
			name: "城鎮近郊"
		},
		"Farm Road 2": {
			index: 2,
			id: "road2",
			name: "莊園丘陵"
		},
		"Farm Road 3": {
			index: 3,
			id: "road3",
			name: "林間道路"
		},
		"Farm Road 4": {
			index: 4,
			id: "road4",
			name: "海景山丘"
		},
		"Farm Road 5": {
			index: 5,
			id: "road5",
			name: "貧瘠平原"
		},
		"Farm Road 6": {
			index: 6,
			id: "road6",
			name: "農田道路"
		}
	};

	const PLACES = [
		{
			id: "town",
			name: "城鎮",
			pos: 0
		},
		{
			id: "road1",
			name: "城鎮近郊",
			pos: 1 / 7 * 100
		},
		{
			id: "road2",
			name: "莊園丘陵",
			pos: 2 / 7 * 100
		},
		{
			id: "road3",
			name: "林間道路",
			pos: 3 / 7 * 100
		},
		{
			id: "road4",
			name: "海景山丘",
			pos: 4 / 7 * 100
		},
		{
			id: "road5",
			name: "貧瘠平原",
			pos: 5 / 7 * 100
		},
		{
			id: "road6",
			name: "農田道路",
			pos: 6 / 7 * 100
		},
		{
			id: "farmland",
			name: "農田",
			pos: 100
		}
	];

	/* =========================================================
	 * 基本判定
	 * ========================================================= */

	function getCurrentRoad() {
		return ROAD[State.passage] || null;
	}

	/* =========================================================
	 * 發現紀錄
	 * ========================================================= */

	function ensureDiscoveryStore() {
		if (!V.farmRoadMapDiscovered) {
			V.farmRoadMapDiscovered = {};
		}

		return V.farmRoadMapDiscovered;
	}

	function discover(id) {
		ensureDiscoveryStore()[id] = true;
	}

	function isDiscovered(id) {
		return !!ensureDiscoveryStore()[id];
	}

	function updateDiscoveries(current) {
		if (!current) return;

		discover(current.id);

		/*
		 * 第一段道路已經位於城鎮端，
		 * 因此抵達 Farm Road 1 後即可確認城鎮方向。
		 */
		if (current.index === 1) {
			discover("town");
		}

		/*
		 * 第六段道路已經位於農田端，
		 * 因此抵達 Farm Road 6 後即可確認農田方向。
		 */
		if (current.index === 6) {
			discover("farmland");
		}
	}

	/* =========================================================
	 * CSS
	 * ========================================================= */

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
				background: rgba(38, 35, 27, .95);
				color: #eee;
			}

			#${ID} * {
				box-sizing: border-box;
			}

			#${ID} .farm-road-map-title {
				display: flex;
				justify-content: space-between;
				align-items: center;
				font-weight: bold;
				margin-bottom: 40px;
			}

			#${ID} .farm-road-map-depth {
				font-size: .8em;
				opacity: .65;
			}

			#${ID} .farm-road-map {
				padding: 42px 14px 42px;
			}

			#${ID} .farm-road-map-track {
				position: relative;
				height: 8px;
				border-radius: 999px;
				background: rgba(255,255,255,.12);
			}

			#${ID} .farm-road-map-fill {
				position: absolute;
				left: 0;
				top: 0;
				height: 100%;
				border-radius: inherit;
				background: #6ea876;
			}

			/* 玩家位置 */

			#${ID} .farm-road-map-player {
				position: absolute;
				top: 50%;
				transform: translate(-50%, -50%);
				z-index: 10;
			}

			#${ID} .farm-road-map-player-dot {
				width: 16px;
				height: 16px;
				border-radius: 50%;
				background: white;
				border: 3px solid #4f8257;
				box-shadow: 0 0 0 4px rgba(255,255,255,.12);
			}

			#${ID} .farm-road-map-player-text {
				position: absolute;
				top: 18px;
				left: 50%;
				transform: translateX(-50%);
				white-space: nowrap;
				font-size: .75em;
				font-weight: bold;
			}

			/* 已探索地點 */

			#${ID} .farm-road-map-place {
				position: absolute;
				top: 50%;
				transform: translateX(-50%);
				z-index: 4;
			}

			#${ID} .farm-road-map-place-dot {
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

			#${ID} .farm-road-map-place-line {
				position: absolute;
				left: 50%;
				width: 1px;
				background: rgba(255,255,255,.22);
			}

			#${ID} .farm-road-map-place-label {
				position: absolute;
				left: 50%;
				transform: translateX(-50%);
				white-space: nowrap;
				font-size: .68em;
				opacity: .85;
			}

			#${ID} .farm-road-map-place.above
			.farm-road-map-place-line {
				height: 20px;
				bottom: 4px;
			}

			#${ID} .farm-road-map-place.above
			.farm-road-map-place-label {
				bottom: 25px;
			}

			#${ID} .farm-road-map-place.below
			.farm-road-map-place-line {
				height: 20px;
				top: 4px;
			}

			#${ID} .farm-road-map-place.below
			.farm-road-map-place-label {
				top: 25px;
			}

			#${ID} .farm-road-map-note {
				margin-top: 2px;
				font-size: .7em;
				opacity: .45;
				text-align: center;
			}

			@media (max-width: 600px) {
				#${ID} .farm-road-map {
					overflow-x: auto;
					padding-left: 25px;
					padding-right: 25px;
				}

				#${ID} .farm-road-map-track {
					min-width: 650px;
				}
			}
		`;

		document.head.appendChild(style);
	}

	/* =========================================================
	 * Render
	 * ========================================================= */

	function render() {
		document.getElementById(ID)?.remove();

		/*
		 * 獨立開關。
		 * 關閉後只是不顯示 GUI，
		 * 不會清除已探索紀錄。
		 */
		if (!V.CE_FarmRoadMapGUI) {
			return;
		}

		const current = getCurrentRoad();

		if (!current) {
			return;
		}

		const target =
			document.querySelector("#passage-content") ||
			document.querySelector("#passages");

		if (!target) {
			return;
		}

		updateDiscoveries(current);

		/*
		 * 整條道路：
		 *
		 * 0 = 城鎮
		 * 1~6 = Farm Road 1~6
		 * 7 = 農田
		 */
		const progress = current.index / 7 * 100;

		const gui = document.createElement("div");
		gui.id = ID;

		/* ---------- Title ---------- */

		const title = document.createElement("div");
		title.className = "farm-road-map-title";

		title.innerHTML = `
			<span>🌾 ${current.name}</span>
			<span class="farm-road-map-depth">${current.index} / 6</span>
		`;

		/* ---------- Map ---------- */

		const map = document.createElement("div");
		map.className = "farm-road-map";

		const track = document.createElement("div");
		track.className = "farm-road-map-track";

		const fill = document.createElement("div");
		fill.className = "farm-road-map-fill";
		fill.style.width = `${progress}%`;

		const player = document.createElement("div");
		player.className = "farm-road-map-player";
		player.style.left = `${progress}%`;

		player.innerHTML = `
			<div class="farm-road-map-player-dot"></div>
			<div class="farm-road-map-player-text">你</div>
		`;

		track.append(fill, player);

		/* ---------- 已探索區段 ---------- */

		for (let i = 0; i < PLACES.length; i++) {
			const place = PLACES[i];

			if (!isDiscovered(place.id)) {
				continue;
			}

			const marker = document.createElement("div");
			marker.className = "farm-road-map-place";

			/*
			 * 最左右兩端略微內縮，
			 * 避免文字貼到容器邊界被裁切。
			 */
			const markerPos =
				place.pos <= 0
					? 3
					: place.pos >= 100
						? 97
						: place.pos;

			marker.style.left = `${markerPos}%`;

			if (i % 2 === 0) {
				marker.classList.add("above");
			} else {
				marker.classList.add("below");
			}

			marker.innerHTML = `
				<div class="farm-road-map-place-label">${place.name}</div>
				<div class="farm-road-map-place-line"></div>
				<div class="farm-road-map-place-dot"></div>
			`;

			track.appendChild(marker);
		}

		map.appendChild(track);

		const note = document.createElement("div");
		note.className = "farm-road-map-note";
		note.textContent =
			"已走過的道路區域會記錄在地圖上。";

		gui.append(title, map, note);

		target.prepend(gui);
		scrollToPlayer(map, player);
	}

	/* =========================================================
	 * 啟動
	 * ========================================================= */

	installStyle();

	if (window.jQuery) {
		jQuery(document)
			.off(EVENT_NS)
			.on(
				":passagedisplay" + EVENT_NS,
				() => {
					setTimeout(render, 0);
				}
			);
	}

	render();
})();

/*=========================================
 Cheat Extended - Moor Map GUI

 荒原探索地圖
 - 顯示目前荒原探索深度
 - 記錄並顯示已探索地點
 - 未探索地點不會提前顯示
 - 與鄉間道路共用 CE_FarmRoadMapGUI 開關
=========================================*/

(() => {
	"use strict";

	const ID = "moor-map-gui";
	const STYLE_ID = ID + "-style";
	const EVENT_NS = ".MoorMapGUI";

	/* =========================================================
	 * 地標
	 * ========================================================= */

	const PLACES = [
		{
			id: "farmland",
			name: "農田",
			pos: 0,
			discover: depth => depth <= 0
		},
		{
			id: "estate",
			name: "雷米莊園",
			pos: 10,
			discover: depth => depth === 10
		},
		{
			id: "sign20",
			name: "褪色標誌",
			pos: 20,
			discover: depth => depth === 20
		},
		{
			id: "sign50",
			name: "褪色標誌",
			pos: 50,
			discover: depth => depth === 50
		},
		{
			id: "bog",
			name: "沼澤",
			pos: 85,
			discover: depth =>
				depth >= 80 &&
				depth <= 90 &&
				V.bogProgress >= 1
		},
		{
			id: "castle",
			name: "廢墟城堡",
			pos: 100,
			discover: depth => depth >= 100
		}
	];

	/* =========================================================
	 * 基本判定
	 * ========================================================= */

	function isMoor() {
		return State.passage === "Moor";
	}

	function getDepth() {
		return Math.max(
			0,
			Math.min(
				100,
				Number(V.moor) || 0
			)
		);
	}

	function getZone(depth) {
		if (depth <= 0) return "荒原邊緣";
		if (depth <= 20) return "荒原外圍";
		if (depth <= 50) return "荒原中段";
		if (depth < 100) return "荒原深處";
		return "荒原盡頭";
	}

	/* =========================================================
	 * 發現紀錄
	 * ========================================================= */

	function ensureDiscoveryStore() {
		if (!V.moorMapDiscovered) {
			V.moorMapDiscovered = {};
		}

		return V.moorMapDiscovered;
	}

	function discoverPlace(id) {
		ensureDiscoveryStore()[id] = true;
	}

	function isDiscovered(id) {
		return !!ensureDiscoveryStore()[id];
	}

	function updateDiscoveries(depth) {
		for (const place of PLACES) {
			if (isDiscovered(place.id)) {
				continue;
			}

			try {
				if (place.discover?.(depth)) {
					discoverPlace(place.id);
				}
			} catch (err) {
				console.warn(
					"[Cheat Extended][MoorMapGUI] 地點判定失敗:",
					place.name,
					err
				);
			}
		}
	}

	/* =========================================================
	 * CSS
	 *
	 * 直接沿用森林地圖 CSS 結構，
	 * 只保留荒原自己的棕灰色系。
	 * ========================================================= */

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
				background: rgba(39, 38, 30, .95);
				color: #eee;
			}

			#${ID} * {
				box-sizing: border-box;
			}

			#${ID} .moor-map-title {
				display: flex;
				justify-content: space-between;
				align-items: center;
				font-weight: bold;
				margin-bottom: 40px;
			}

			#${ID} .moor-map-depth {
				font-size: .8em;
				opacity: .65;
			}

			#${ID} .moor-map {
				padding: 42px 14px 42px;
			}

			#${ID} .moor-map-track {
				position: relative;
				height: 8px;
				border-radius: 999px;
				background: rgba(255,255,255,.12);
			}

			#${ID} .moor-map-fill {
				position: absolute;
				left: 0;
				top: 0;
				height: 100%;
				border-radius: inherit;
				background: #6ea876;
			}

			#${ID} .moor-map-player {
				position: absolute;
				top: 50%;
				transform: translate(-50%, -50%);
				z-index: 10;
			}

			#${ID} .moor-map-player-dot {
				width: 16px;
				height: 16px;
				border-radius: 50%;
				background: white;
				border: 3px solid #4f8257;
				box-shadow: 0 0 0 4px rgba(255,255,255,.12);
			}

			#${ID} .moor-map-player-text {
				position: absolute;
				top: 18px;
				left: 50%;
				transform: translateX(-50%);
				white-space: nowrap;
				font-size: .75em;
				font-weight: bold;
			}

			#${ID} .moor-map-place {
				position: absolute;
				top: 50%;
				transform: translateX(-50%);
				z-index: 4;
			}

			#${ID} .moor-map-place-dot {
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

			#${ID} .moor-map-place-line {
				position: absolute;
				left: 50%;
				width: 1px;
				background: rgba(255,255,255,.22);
			}

			#${ID} .moor-map-place-label {
				position: absolute;
				left: 50%;
				transform: translateX(-50%);
				white-space: nowrap;
				font-size: .68em;
				opacity: .85;
			}

			#${ID} .moor-map-place.above .moor-map-place-line {
				height: 20px;
				bottom: 4px;
			}

			#${ID} .moor-map-place.above .moor-map-place-label {
				bottom: 25px;
			}

			#${ID} .moor-map-place.below .moor-map-place-line {
				height: 20px;
				top: 4px;
			}

			#${ID} .moor-map-place.below .moor-map-place-label {
				top: 25px;
			}

			#${ID} .moor-map-note {
				margin-top: 2px;
				font-size: .7em;
				opacity: .45;
				text-align: center;
			}

			@media (max-width: 600px) {
				#${ID} .moor-map {
					overflow-x: auto;
					padding-left: 25px;
					padding-right: 25px;
				}

				#${ID} .moor-map-track {
					min-width: 650px;
				}
			}
		`;

		document.head.appendChild(style);
	}

	/* =========================================================
	 * Render
	 * ========================================================= */

	function render() {
		document.getElementById(ID)?.remove();

		if (!V.CE_FarmRoadMapGUI) {
			return;
		}

		if (!isMoor()) {
			return;
		}

		const target =
			document.querySelector("#passage-content") ||
			document.querySelector("#passages");

		if (!target) {
			return;
		}

		const depth = getDepth();

		updateDiscoveries(depth);

		const gui = document.createElement("div");
		gui.id = ID;

		const title = document.createElement("div");
		title.className = "moor-map-title";

		title.innerHTML = `
			<span>🌾 ${getZone(depth)}</span>
			<span class="moor-map-depth">${depth} / 100</span>
		`;

		const map = document.createElement("div");
		map.className = "moor-map";

		const track = document.createElement("div");
		track.className = "moor-map-track";

		const fill = document.createElement("div");
		fill.className = "moor-map-fill";
		fill.style.width = `${depth}%`;

		const player = document.createElement("div");
		player.className = "moor-map-player";
		player.style.left = `${depth}%`;

		player.innerHTML = `
			<div class="moor-map-player-dot"></div>
			<div class="moor-map-player-text">你</div>
		`;

		track.append(fill, player);

		for (let i = 0; i < PLACES.length; i++) {
			const place = PLACES[i];

			if (!isDiscovered(place.id)) {
				continue;
			}

			const marker = document.createElement("div");
			marker.className = "moor-map-place";

			const markerPos =
				place.pos <= 0
					? 3
					: place.pos >= 100
						? 97
						: place.pos;

			marker.style.left = `${markerPos}%`;

			if (i % 2 === 0) {
				marker.classList.add("above");
			} else {
				marker.classList.add("below");
			}

			marker.innerHTML = `
				<div class="moor-map-place-label">${place.name}</div>
				<div class="moor-map-place-line"></div>
				<div class="moor-map-place-dot"></div>
			`;

			track.appendChild(marker);
		}

		map.appendChild(track);

		const note = document.createElement("div");
		note.className = "moor-map-note";
		note.textContent =
			"已探索過的地點會記錄在荒原地圖上。";

		gui.append(title, map, note);

		target.prepend(gui);
		scrollToPlayer(map, player);
	}

	/* =========================================================
	 * 啟動
	 * ========================================================= */

	installStyle();

	if (window.jQuery) {
		jQuery(document)
			.off(EVENT_NS)
			.on(
				":passagedisplay" + EVENT_NS,
				() => {
					setTimeout(render, 0);
				}
			);
	}

	render();
})();