/*=========================================
 Cheat Extended - Sewers Map GUI

 下水道探索地圖
 - 顯示目前所在區域與相鄰通道
 - 顯示目前可用的外部出口
 - 使用 CE_SewersMapGUI 開關
=========================================*/
(() => {
	"use strict";

	const ID = "sewers-map-gui";
	const STYLE_ID = ID + "-style";
	const EVENT_NS = ".SewersMapGUI";

	let mapResizeObserver = null;
	
	if (V.CE_SewersMapGUI === undefined) {
	    V.CE_SewersMapGUI = false;
    }

	/* =========================================================
	 * 控制台測試用：清理上一版 CSS
	 * ========================================================= */

	// document.getElementById(ID)?.remove();
	// document.getElementById(STYLE_ID)?.remove();

	if (window.jQuery) {
		jQuery(document).off(EVENT_NS);
	}

	/* =========================================================
	 * 下水道內部節點
	 * ========================================================= */

	const NODES = {
		"Sewers Lake": {
			name: "地下水池",
			x: 50,
			y: 0
		},
		"Sewers Waterfall": {
			name: "潮湿的隧道",
			x: 50,
			y: 18
		},
		"Sewers Industrial": {
			name: "工业区",
			x: 50,
			y: 38
		},
		"Sewers Algae": {
			name: "水藻覆盖的管道",
			x: 25,
			y: 55
		},
		"Sewers Rubble": {
			name: "坍陷的管道",
			x: 75,
			y: 55
		},
		"Sewers Mud": {
			name: "泥泞的隧道",
			x: 25,
			y: 75
		},
		"Sewers Commercial": {
			name: "商业区",
			x: 50,
			y: 75
		},
		"Sewers Ruins": {
			name: "荒废的隧道",
			x: 75,
			y: 75
		},
		"Sewers Shrooms": {
			name: "长满真菌的管道",
			x: 0,
			y: 75
		},
		"Sewers Hole": {
			name: "风洞",
			x: 100,
			y: 75
		},
		"Sewers Residential": {
			name: "住宅区",
			x: 50,
			y: 100
		},
		"Sewers Scrap": {
			name: "充满废料的隧道",
			x: 30,
			y: 120
		},
		"Sewers Wood": {
			name: "满是木头的隧道",
			x: 70,
			y: 120
		},
		"Sewers Workshop": {
			name: "满是雕塑的隧道",
			x: 15,
			y: 140
		},
		"Sewers Webs": {
			name: "布满蜘蛛网的管道",
			x: 85,
			y: 140
		}
	};

	/* =========================================================
	 * 普通雙向道路
	 * ========================================================= */

	const EDGES = [
		["Sewers Lake", "Sewers Waterfall"],
		["Sewers Waterfall", "Sewers Industrial"],

		["Sewers Industrial", "Sewers Algae"],
		["Sewers Industrial", "Sewers Rubble"],
		["Sewers Industrial", "Sewers Commercial"],

		["Sewers Algae", "Sewers Mud"],

		["Sewers Mud", "Sewers Shrooms"],
		["Sewers Mud", "Sewers Commercial"],

		["Sewers Rubble", "Sewers Ruins"],

		["Sewers Ruins", "Sewers Commercial"],
		["Sewers Ruins", "Sewers Hole"],

		["Sewers Commercial", "Sewers Residential"],

		["Sewers Residential", "Sewers Scrap"],
		["Sewers Residential", "Sewers Wood"],

		["Sewers Scrap", "Sewers Workshop"],
		["Sewers Wood", "Sewers Webs"]
	];

	/* =========================================================
	 * 單向道路
	 *
	 * 只允許 from → to
	 *
	 * Workshop
	 * → Sewers Chute
	 * → Shrooms
	 * ========================================================= */

	const DIRECTED_EDGES = [
		["Sewers Workshop", "Sewers Shrooms"]
	];

	/* =========================================================
	 * 過渡 Passage
	 * ========================================================= */

	const TRANSIENT_LOCATIONS = {
		"Sewers Commercial Swim": "Sewers Commercial",
		"Sewers Residential Swim": "Sewers Residential",
		"Sewers Industrial Swim": "Sewers Industrial",
		"Sewers Chute": "Sewers Workshop"
	};

	/* =========================================================
	 * 外部可達地點
	 * ========================================================= */

	const EXITS = [
		{
			id: "Commercial Drain",
			from: "Sewers Commercial",
			name: "商业区排水口",
			direction: "up-right",
			show: () =>
				V.sewerschased !== 1 &&
				V.nextPassageCheck !== "Sewers Possessed"
		},
		{
			id: "Residential Drain",
			from: "Sewers Residential",
			name: "住宅区排水口",
			direction: "down",
			show: () =>
				V.sewerschased !== 1 &&
				V.nextPassageCheck !== "Sewers Possessed"
		},
		{
			id: "Industrial Drain",
			from: "Sewers Industrial",
			name: "工业区排水口",
			direction: "up",
			show: () =>
				V.sewerschased !== 1 &&
				V.nextPassageCheck !== "Sewers Possessed"
		},
		{
			id: "Smuggler Pub",
			from: "Sewers Algae",
			name: "走私者酒吧",
			direction: "left",
			show: () =>
				V.smuggler_pub_known === 1 &&
				V.sewerschased !== 1
		},
		{
			id: "Smuggler Pub Sewer Intro",
			from: "Sewers Algae",
			name: "墙上的破洞",
			direction: "left",
			show: () =>
				V.smuggler_pub_known !== 1 &&
				V.sewerschased !== 1 &&
				(
					V.historytrait >= 4 ||
					(
						V.temple_spear_mission >= 1 &&
						V.temple_spear_mission_winter === 1
					)
				)
		}
	];

	/* =========================================================
	 * Graph
	 * ========================================================= */

	function buildGraph() {
		const graph = {};

		for (const id of Object.keys(NODES)) {
			graph[id] = [];
		}

		// 普通道路：雙向
		for (const [a, b] of EDGES) {
			if (!graph[a] || !graph[b]) continue;

			if (!graph[a].includes(b)) {
				graph[a].push(b);
			}

			if (!graph[b].includes(a)) {
				graph[b].push(a);
			}
		}

		// 單向道路：只加入 a → b
		for (const [a, b] of DIRECTED_EDGES) {
			if (!graph[a] || !graph[b]) continue;

			if (!graph[a].includes(b)) {
				graph[a].push(b);
			}
		}

		return graph;
	}

	const GRAPH = buildGraph();

	function isDirectedEdge(a, b) {
		return DIRECTED_EDGES.some(
			([from, to]) => from === a && to === b
		);
	}

	/* =========================================================
	 * Current
	 * ========================================================= */

	function getCurrentNode() {
		if (NODES[State.passage]) {
			return State.passage;
		}

		return TRANSIENT_LOCATIONS[State.passage] || null;
	}

	/* =========================================================
	 * 世界拓撲方向
	 * ========================================================= */

	function getDirection(fromId, toId) {
		const from = NODES[fromId];
		const to = NODES[toId];

		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const angle = Math.atan2(dy, dx) * 180 / Math.PI;

		if (angle >= -22.5 && angle < 22.5) {
			return "right";
		}

		if (angle >= 22.5 && angle < 67.5) {
			return "down-right";
		}

		if (angle >= 67.5 && angle < 112.5) {
			return "down";
		}

		if (angle >= 112.5 && angle < 157.5) {
			return "down-left";
		}

		if (angle >= 157.5 || angle < -157.5) {
			return "left";
		}

		if (angle >= -157.5 && angle < -112.5) {
			return "up-left";
		}

		if (angle >= -112.5 && angle < -67.5) {
			return "up";
		}

		return "up-right";
	}

	/* =========================================================
	 * 固定 Slot
	 * ========================================================= */

	const DIRECTION_SLOTS = {
		up: { x: 50, y: 14 },
		"up-right": { x: 77, y: 23 },
		right: { x: 82, y: 50 },
		"down-right": { x: 77, y: 77 },
		down: { x: 50, y: 86 },
		"down-left": { x: 23, y: 77 },
		left: { x: 18, y: 50 },
		"up-left": { x: 23, y: 23 }
	};

	/* =========================================================
	 * 可見出口
	 * ========================================================= */

	function getVisibleExits(current) {
		return EXITS.filter(exit => {
			if (exit.from !== current) return false;

			try {
				return !exit.show || exit.show();
			} catch (err) {
				console.warn(
					"[SewersMapGUI] 出口判定失敗:",
					exit.id,
					err
				);

				return false;
			}
		});
	}

	/* =========================================================
	 * Layout
	 * ========================================================= */

	function buildLocalLayout(current, neighbours, exits) {
		const layout = {
			[current]: { x: 50, y: 50 }
		};

		const groups = {};

		for (const id of neighbours) {
			const direction = getDirection(current, id);

			if (!groups[direction]) {
				groups[direction] = [];
			}

			groups[direction].push({
				key: id
			});
		}

		for (const exit of exits) {
			const direction = exit.direction || "right";

			if (!groups[direction]) {
				groups[direction] = [];
			}

			groups[direction].push({
				key: `exit:${exit.id}`
			});
		}

		for (const [direction, items] of Object.entries(groups)) {
			const base = DIRECTION_SLOTS[direction];

			if (!base) continue;

			if (items.length === 1) {
				layout[items[0].key] = {
					x: base.x,
					y: base.y
				};

				continue;
			}

			const spacing = 14;
			const start = -((items.length - 1) * spacing) / 2;

			items.forEach((item, index) => {
				const offset = start + index * spacing;

				if (
					direction === "up" ||
					direction === "down"
				) {
					layout[item.key] = {
						x: base.x + offset,
						y: base.y
					};
				} else {
					layout[item.key] = {
						x: base.x,
						y: base.y + offset
					};
				}
			});
		}

		return layout;
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
		const style = document.createElement("style");
		style.id = STYLE_ID;

		style.textContent = `
			#${ID} {
				margin: 0 0 .9em;
				padding: 9px 11px;
				border: 1px solid rgba(90,130,145,.48);
				border-radius: 7px;
				background: rgba(25,35,38,.95);
				color: #eee;
			}

			#${ID} * {
				box-sizing: border-box;
			}

			#${ID} .sewers-map-title {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 2px;
				font-size: .92em;
				font-weight: bold;
			}

			#${ID} .sewers-map-location {
				font-size: .76em;
				font-weight: normal;
				opacity: .62;
			}

			#${ID} .sewers-map-scroll {
				overflow-x: auto;
				overflow-y: hidden;
			}

			#${ID} .sewers-map-area {
				position: relative;
				width: 100%;
				min-width: 620px;
				height: 260px;
				overflow: hidden;
			}

			/* 普通線 */
			#${ID} .sewers-map-line {
				position: absolute;
				height: 1px;
				background: rgba(155,195,200,.30);
				transform-origin: 0 50%;
				z-index: 1;
			}

			/* 單向線 */
			#${ID} .sewers-map-line.directed {
				height: 2px;
				background: rgba(150,210,220,.48);
			}

			#${ID} .sewers-map-line.directed::after {
				content: "";
				position: absolute;
				right: -1px;
				top: -3px;
				width: 0;
				height: 0;
				border-top: 4px solid transparent;
				border-bottom: 4px solid transparent;
				border-left: 6px solid rgba(170,230,240,.72);
			}

			/* 外部出口線 */
			#${ID} .sewers-map-line.exit-line {
				height: 1px;
				background: rgba(210,190,120,.28);
				border-top: 1px dashed rgba(210,190,120,.42);
			}

			/* 普通節點 */
			#${ID} .sewers-map-node {
				position: absolute;
				transform: translate(-50%, -50%);
				z-index: 5;
				width: 104px;
				min-height: 34px;
				padding: 5px 6px;
				border: 1px solid rgba(255,255,255,.18);
				border-radius: 6px;
				background: rgba(255,255,255,.055);
				text-align: center;
				font-size: .67em;
				line-height: 1.2;
			}

			#${ID} .sewers-map-dot {
				width: 6px;
				height: 6px;
				margin: 0 auto 3px;
				border-radius: 50%;
				background: rgba(180,205,208,.76);
			}

			/* 當前位置高亮 */
			#${ID} .sewers-map-node.current {
				z-index: 20;
				width: 114px;
				border: 2px solid rgba(220,255,255,.96);
				background: rgba(55,145,160,.58);
				box-shadow:
					0 0 0 3px rgba(110,220,235,.14),
					0 0 16px rgba(90,225,245,.40),
					inset 0 0 10px rgba(220,255,255,.10);
				font-weight: bold;
				transform: translate(-50%, -50%) scale(1.07);
			}

			#${ID} .sewers-map-node.current .sewers-map-dot {
				width: 10px;
				height: 10px;
				background: #fff;
				box-shadow:
					0 0 0 2px rgba(255,255,255,.15),
					0 0 9px rgba(220,255,255,.80);
			}

			#${ID} .sewers-map-node.current::before {
				content: "";
				position: absolute;
				inset: -7px;
				border-radius: 9px;
				border: 1px solid rgba(150,240,250,.18);
				box-shadow: 0 0 12px rgba(100,230,245,.18);
				pointer-events: none;
			}

			/* 外部出口 */
			#${ID} .sewers-map-exit {
				position: absolute;
				transform: translate(-50%, -50%);
				z-index: 6;
				width: 108px;
				min-height: 32px;
				padding: 5px 6px;
				border: 1px dashed rgba(220,195,125,.62);
				border-radius: 6px;
				background: rgba(120,100,45,.12);
				color: rgba(245,225,170,.95);
				text-align: center;
				font-size: .66em;
				line-height: 1.2;
			}

			#${ID} .sewers-map-exit-icon {
				display: inline-block;
				margin-right: 3px;
				opacity: .9;
			}

			#${ID} .sewers-map-note {
				margin-top: 0;
				text-align: center;
				font-size: .62em;
				opacity: .35;
			}

			@media (max-width: 650px) {
				#${ID} .sewers-map-area {
					min-width: 650px;
				}
			}
		`;

		document.head.appendChild(style);
	}

	/* =========================================================
	 * Lines
	 * ========================================================= */

	function addLine(area, from, to, type = "normal") {
		const line = document.createElement("div");
		line.className = "sewers-map-line";

		if (type === "exit") {
			line.classList.add("exit-line");
		}

		if (type === "directed") {
			line.classList.add("directed");
		}

		line.dataset.x1 = from.x;
		line.dataset.y1 = from.y;
		line.dataset.x2 = to.x;
		line.dataset.y2 = to.y;

		area.appendChild(line);
	}

	function positionLines(area) {
		if (!area?.isConnected) return;

		const rect = area.getBoundingClientRect();

		if (!rect.width || !rect.height) return;

		for (const line of area.querySelectorAll(".sewers-map-line")) {
			const x1 = Number(line.dataset.x1) / 100 * rect.width;
			const y1 = Number(line.dataset.y1) / 100 * rect.height;
			const x2 = Number(line.dataset.x2) / 100 * rect.width;
			const y2 = Number(line.dataset.y2) / 100 * rect.height;

			const dx = x2 - x1;
			const dy = y2 - y1;

			const length = Math.sqrt(dx * dx + dy * dy);
			const angle = Math.atan2(dy, dx) * 180 / Math.PI;

			line.style.left = `${x1}px`;
			line.style.top = `${y1}px`;
			line.style.width = `${length}px`;
			line.style.transform = `rotate(${angle}deg)`;
		}
	}

	/* =========================================================
	 * ResizeObserver
	 * ========================================================= */

	function disconnectResizeObserver() {
		if (!mapResizeObserver) return;

		mapResizeObserver.disconnect();
		mapResizeObserver = null;
	}

	function observeMapResize(area) {
		disconnectResizeObserver();

		if (typeof ResizeObserver === "undefined") {
			return;
		}

		let resizeFrame = 0;

		mapResizeObserver = new ResizeObserver(() => {
			cancelAnimationFrame(resizeFrame);

			resizeFrame = requestAnimationFrame(() => {
				positionLines(area);
			});
		});

		mapResizeObserver.observe(area);
	}

	/* =========================================================
	 * Render
	 * ========================================================= */

	function render() {
		disconnectResizeObserver();

		document.getElementById(ID)?.remove();
		
		if (!V.CE_SewersMapGUI) {
		    return;
	    }

		const current = getCurrentNode();

		if (!current) return;

		const target =
			document.querySelector("#passage-content") ||
			document.querySelector("#passages");

		if (!target) return;

		const neighbours = GRAPH[current] || [];
		const exits = getVisibleExits(current);
		const layout = buildLocalLayout(current, neighbours, exits);

		const gui = document.createElement("div");
		gui.id = ID;

		/* ---------- Title ---------- */

		const title = document.createElement("div");
		title.className = "sewers-map-title";

		title.innerHTML = `
			<span>下水道</span>
			<span class="sewers-map-location">${NODES[current].name}</span>
		`;

		/* ---------- Map ---------- */

		const scroll = document.createElement("div");
		scroll.className = "sewers-map-scroll";

		const area = document.createElement("div");
		area.className = "sewers-map-area";

		const centerPos = layout[current];

		/* ---------- Internal lines ---------- */

		for (const neighbour of neighbours) {
			const to = layout[neighbour];

			if (!to) continue;

			addLine(
				area,
				centerPos,
				to,
				isDirectedEdge(current, neighbour)
					? "directed"
					: "normal"
			);
		}

		/* ---------- Exit lines ---------- */

		for (const exit of exits) {
			const key = `exit:${exit.id}`;
			const to = layout[key];

			if (!to) continue;

			addLine(area, centerPos, to, "exit");
		}

		/* ---------- Current ---------- */

		const currentNode = document.createElement("div");
		currentNode.className = "sewers-map-node current";
		currentNode.style.left = "50%";
		currentNode.style.top = "50%";

		currentNode.innerHTML = `
			<div class="sewers-map-dot"></div>
			<div>${NODES[current].name}</div>
		`;

		currentNode.title = current;

		area.appendChild(currentNode);

		/* ---------- Internal neighbours ---------- */

		for (const passage of neighbours) {
			const info = NODES[passage];
			const pos = layout[passage];

			if (!info || !pos) continue;

			const node = document.createElement("div");
			node.className = "sewers-map-node";

			node.style.left = `${pos.x}%`;
			node.style.top = `${pos.y}%`;

			node.innerHTML = `
				<div class="sewers-map-dot"></div>
				<div>${info.name}</div>
			`;

			node.title = passage;

			area.appendChild(node);
		}

		/* ---------- External exits ---------- */

		for (const exit of exits) {
			const key = `exit:${exit.id}`;
			const pos = layout[key];

			if (!pos) continue;

			const node = document.createElement("div");
			node.className = "sewers-map-exit";

			node.style.left = `${pos.x}%`;
			node.style.top = `${pos.y}%`;

			node.innerHTML = `
				<span class="sewers-map-exit-icon">↗</span>
				<span>${exit.name}</span>
			`;

			node.title = exit.id;

			area.appendChild(node);
		}

		scroll.appendChild(area);

		const note = document.createElement("div");
		note.className = "sewers-map-note";
		note.textContent =
			"高亮節點代表目前的所在區域；箭頭表示單向通道，虛線節點表示可以離開下水道的地點。";

		gui.append(title, scroll, note);
		target.prepend(gui);

		requestAnimationFrame(() => {
			positionLines(area);
			observeMapResize(area);
			scrollToPlayer(scroll, currentNode);
		});
	}

	/* =========================================================
	 * 啟動
	 * ========================================================= */

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

	console.log(
		"[Cheat Extended][SewersMapGUI] 下水道地圖已啟用"
	);
})();

/*=========================================
 Cheat Extended - Beach Cave Map GUI

 海岸洞穴探索地圖
 - 顯示目前洞穴探索深度
 - 記錄並顯示已發現地點
 - 共用 CE_SewersMapGUI 開關
=========================================*/
(() => {
	"use strict";

	const ID = "beach-cave-map-gui";
	const STYLE_ID = ID + "-style";
	const EVENT_NS = ".BeachCaveMapGUI";

	/* =========================================================
	 * 基本判定
	 * ========================================================= */

	function isBeachCave() {
		return State.passage === "Beach Cave";
	}

	function getDepth() {
		return Math.max(
			0,
			Math.min(
				100,
				Number(V.cave) || 0
			)
		);
	}

	function getZone(depth) {
		if (depth <= 0) return "洞口附近";
		if (depth < 20) return "浅水区域";
		if (depth < 50) return "腰深水域";
		if (depth < 100) return "洞穴深处";
		return "洞穴尽头";
	}

	/* =========================================================
	 * 發現紀錄
	 * ========================================================= */

	function ensureDiscoveryStore() {
		if (!V.beachCaveMapDiscovered) {
			V.beachCaveMapDiscovered = {};
		}

		return V.beachCaveMapDiscovered;
	}

	function discover(id) {
		ensureDiscoveryStore()[id] = true;
	}

	function isDiscovered(id) {
		return !!ensureDiscoveryStore()[id];
	}

	/* =========================================================
	 * 地標
	 * ========================================================= */

	const PLACES = [
		{
			id: "entrance",
			name: "海面出口",
			pos: 0,
			discover: () =>
				V.cave <= 0
		},
		{
			id: "smuggler",
			name: "走私者通道",
			pos: 52,
			discover: () =>
				V.cave >= 50 &&
				V.cave < 54 &&
				(
					V.smuggler_pub_known === 1 ||
					V.historytrait >= 4 ||
					(
						V.temple_spear_mission >= 1 &&
						V.temple_spear_mission_winter === 1
					)
				)
		},
		{
			id: "throne",
			name: "腐朽木王座",
			pos: 100,
			discover: () =>
				V.cave >= 100
		}
	];

	/* =========================================================
	 * 更新發現紀錄
	 * ========================================================= */

	function updateDiscoveries() {
		for (const place of PLACES) {
			try {
				if (
					!isDiscovered(place.id) &&
					place.discover()
				) {
					discover(place.id);
				}
			} catch (err) {
				console.warn(
					"[Cheat Extended][BeachCaveMapGUI] 地點判定失敗:",
					place.name,
					err
				);
			}
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
				background: rgba(22, 31, 38, .95);
				color: #eee;
			}

			#${ID} * {
				box-sizing: border-box;
			}

			#${ID} .beach-cave-map-title {
				display: flex;
				justify-content: space-between;
				align-items: center;
				font-weight: bold;
				margin-bottom: 40px;
			}

			#${ID} .beach-cave-map-depth {
				font-size: .8em;
				opacity: .65;
			}

			#${ID} .beach-cave-map {
				padding: 42px 14px 42px;
			}

			#${ID} .beach-cave-map-track {
				position: relative;
				height: 8px;
				border-radius: 999px;
				background: rgba(255,255,255,.12);
			}

			#${ID} .beach-cave-map-fill {
				position: absolute;
				left: 0;
				top: 0;
				height: 100%;
				border-radius: inherit;
				background: #6ea876;
			}

			#${ID} .beach-cave-map-player {
				position: absolute;
				top: 50%;
				transform: translate(-50%, -50%);
				z-index: 10;
			}

			#${ID} .beach-cave-map-player-dot {
				width: 16px;
				height: 16px;
				border-radius: 50%;
				background: white;
				border: 3px solid #4f8257;
				box-shadow: 0 0 0 4px rgba(255,255,255,.12);
			}

			#${ID} .beach-cave-map-player-text {
				position: absolute;
				top: 18px;
				left: 50%;
				transform: translateX(-50%);
				white-space: nowrap;
				font-size: .75em;
				font-weight: bold;
			}

			#${ID} .beach-cave-map-place {
				position: absolute;
				top: 50%;
				transform: translateX(-50%);
				z-index: 4;
			}

			#${ID} .beach-cave-map-place-dot {
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

			#${ID} .beach-cave-map-place-line {
				position: absolute;
				left: 50%;
				width: 1px;
				background: rgba(255,255,255,.22);
			}

			#${ID} .beach-cave-map-place-label {
				position: absolute;
				left: 50%;
				transform: translateX(-50%);
				white-space: nowrap;
				font-size: .68em;
				opacity: .85;
			}

			#${ID} .beach-cave-map-place.above
			.beach-cave-map-place-line {
				height: 20px;
				bottom: 4px;
			}

			#${ID} .beach-cave-map-place.above
			.beach-cave-map-place-label {
				bottom: 25px;
			}

			#${ID} .beach-cave-map-place.below
			.beach-cave-map-place-line {
				height: 20px;
				top: 4px;
			}

			#${ID} .beach-cave-map-place.below
			.beach-cave-map-place-label {
				top: 25px;
			}

			#${ID} .beach-cave-map-note {
				margin-top: 2px;
				font-size: .7em;
				opacity: .45;
				text-align: center;
			}

			@media (max-width: 600px) {
				#${ID} .beach-cave-map {
					overflow-x: auto;
					padding-left: 25px;
					padding-right: 25px;
				}

				#${ID} .beach-cave-map-track {
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

		if (!V.CE_SewersMapGUI) {
			return;
		}

		if (!isBeachCave()) {
			return;
		}

		const target =
			document.querySelector("#passage-content") ||
			document.querySelector("#passages");

		if (!target) {
			return;
		}

		updateDiscoveries();

		const depth = getDepth();

		const gui = document.createElement("div");
		gui.id = ID;

		const title = document.createElement("div");
		title.className = "beach-cave-map-title";

		title.innerHTML = `
			<span>🕳️ ${getZone(depth)}</span>
			<span class="beach-cave-map-depth">${depth} / 100</span>
		`;

		const map = document.createElement("div");
		map.className = "beach-cave-map";

		const track = document.createElement("div");
		track.className = "beach-cave-map-track";

		const fill = document.createElement("div");
		fill.className = "beach-cave-map-fill";
		fill.style.width = `${depth}%`;

		const player = document.createElement("div");
		player.className = "beach-cave-map-player";
		player.style.left = `${depth}%`;

		player.innerHTML = `
			<div class="beach-cave-map-player-dot"></div>
			<div class="beach-cave-map-player-text">你</div>
		`;

		track.append(fill, player);

		for (const place of PLACES) {
			if (!isDiscovered(place.id)) {
				continue;
			}

			const marker = document.createElement("div");
			marker.className = "beach-cave-map-place";

			const markerPos =
				place.pos <= 0
					? 3
					: place.pos >= 100
						? 97
						: place.pos;

			marker.style.left = `${markerPos}%`;

			if (place.pos === 52) {
				marker.classList.add("below");
			} else {
				marker.classList.add("above");
			}

			marker.innerHTML = `
				<div class="beach-cave-map-place-label">${place.name}</div>
				<div class="beach-cave-map-place-line"></div>
				<div class="beach-cave-map-place-dot"></div>
			`;

			track.appendChild(marker);
		}

		map.appendChild(track);

		const note = document.createElement("div");
		note.className = "beach-cave-map-note";
		note.textContent =
			"已探索或发现的地点会记录在洞穴地图上。";

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