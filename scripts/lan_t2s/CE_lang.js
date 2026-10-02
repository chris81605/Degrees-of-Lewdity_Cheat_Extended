/* =========================================
 * CE 語言切換（繁體 / 簡體）
 * =========================================
 * 模組 UI 文本以繁體中文為基準；
 * 當 V.CE_langMode === "s" 時，僅把 CE 指定容器內的顯示文本
 * 即時轉換為簡體中文，不修改存檔內原始文本。
 *
 * 對外接口：
 *   window.CE_trText(text)       按目前語言模式轉換（保留舊接口）
 *   window.CE_toSimplified(text) 強制繁 -> 簡
 *   window.CE_refreshLang()      重新套用目前語言
 * ========================================= */
(function () {
	"use strict";

	/* =====================
	 * foodstuff 分類名稱
	 * ===================== */

	window.CE_foodstuffCatName = function (cat) {
		switch (cat) {
			case "flower": return "花卉";
			case "fruit": return "水果";
			case "vegetable": return "蔬菜";
			case "produce": return "農產品";
			case "ingredient": return "配料";
			case "meat": return "肉食";
			case "seafood": return "海鮮";
			case "mushroom": return "蘑菇";
			case "dish": return "菜餚";
			default: return cat;
		}
	};

	/* =====================
	 * State.variables
	 * ===================== */

	function getV() {
		try {
			return (typeof V !== "undefined" && V)
				? V
				: State.variables;
		} catch (e) {
			return window.V || null;
		}
	}

	/* =====================
	 * 字庫
	 * ===================== */

	const DICT = window.CE_T2S_DICT || Object.create(null);
	const BASE_PHRASES = window.CE_T2S_PHRASES || Object.create(null);

	/* =====================
	 * CE 自訂繁 -> 簡例外
	 *
	 * 優先級高於 OpenCC 詞庫。
	 *
	 * 同字詞條也有意義：
	 * 命中完整詞組後直接輸出，
	 * 不再拆成單字進行轉換，
	 * 可用於人名／專有名詞保護。
	 * ===================== */

	const CUSTOM_PHRASES = {
		/* 用詞轉換 */
		"烘乾": "烘干",
		"榨乾": "榨干",
		"乾淨": "干净",

		"重複": "重复",
		"複數": "复数",
		"回覆": "回复",

		"簽到": "签到",
		"註冊": "注册",
		"註解": "注解",

		"週二": "周二",
		"週四": "周四",

		/* 人名保護 */
		"艾弗里": "艾弗里",
		"艾佛里": "艾佛里",
	};

	/*
	 * OpenCC 詞庫 + CE 自訂覆蓋。
	 *
	 * CUSTOM_PHRASES 後放，
	 * 因此同名詞條會覆蓋 BASE_PHRASES。
	 */
	const PHRASES = Object.assign(
		Object.create(null),
		BASE_PHRASES,
		CUSTOM_PHRASES
	);

	/* =====================
	 * 詞組首字索引
	 * ===================== */

	const phraseBuckets = Object.create(null);

	for (const from of Object.keys(PHRASES)) {
		if (!from) continue;

		const first = String.fromCodePoint(
			from.codePointAt(0)
		);

		(
			phraseBuckets[first] ||
			(phraseBuckets[first] = [])
		).push(from);
	}

	/*
	 * 同首字詞組採最長優先。
	 *
	 * 例如：
	 *
	 *   乾乾淨淨
	 *   乾淨
	 *
	 * 會先嘗試較長詞組。
	 */
	for (const first of Object.keys(phraseBuckets)) {
		phraseBuckets[first].sort(
			(a, b) => b.length - a.length
		);
	}

	/* =====================
	 * 語言模式
	 * ===================== */

	function isS() {
		const v = getV();

		return !!v &&
			v.CE_langMode === "s";
	}

	/* =====================
	 * 純文本繁 -> 簡
	 * ===================== */

	function toSimplified(text) {
		if (
			typeof text !== "string" ||
			!text
		) {
			return text;
		}

		let out = "";
		let i = 0;

		while (i < text.length) {
			const cp = text.codePointAt(i);
			const ch = String.fromCodePoint(cp);

			/* =====================
			 * 詞組優先
			 * ===================== */

			const candidates = phraseBuckets[ch];
			let matched = false;

			if (candidates) {
				for (const from of candidates) {
					if (
						text.startsWith(
							from,
							i
						)
					) {
						out += PHRASES[from];
						i += from.length;

						matched = true;
						break;
					}
				}
			}

			if (matched) {
				continue;
			}

			/* =====================
			 * 單字轉換
			 * ===================== */

			out += DICT[ch] || ch;
			i += ch.length;
		}

		return out;
	}

	/* =====================
	 * 對外文本接口
	 * ===================== */

	/*
	 * 強制繁 -> 簡。
	 *
	 * 不受 CE_langMode 影響。
	 */
	window.CE_toSimplified = toSimplified;

	/*
	 * 保留舊接口。
	 *
	 * 繁體模式：
	 *   原樣返回。
	 *
	 * 簡體模式：
	 *   轉換為簡體。
	 */
	window.CE_trText = function (text) {
		return isS()
			? toSimplified(text)
			: text;
	};

	/* =====================
	 * CE 翻譯範圍
	 * ===================== */

	const CE_LANG_SELECTOR = [
		/* =====================
		 * CE 核心界面
		 * ===================== */
		"#CE_settingsDiv",
		"#CEstatebox",
		"#CE_UiLists",
		"#CE_Toggle",
		".CE-options",
		"#CE-cheatExtended-version",

		/* =====================
		 * CE 通用界面組件
		 * ===================== */
		".CEtab",
		".CEbuttonBar",
		".CE-tab-sorter",
		".dol-settings",

		/* =====================
		 * 遊戲內 CE HUD
		 * ===================== */
		".ce-enemy-state",

		/* =====================
		 * 探索地圖 GUI
		 * ===================== */
		"#forest-map-gui",
		"#farm-road-map-gui",
		"#moor-map-gui",
		"#sewers-map-gui",
		"#beach-cave-map-gui",
	].join(", ");

	/* =====================
	 * DOM 處理
	 * ===================== */

	const SKIP = new Set([
		"SCRIPT",
		"STYLE",
		"TEXTAREA",
		"CODE",
		"PRE",
	]);

	/*
	 * 保存 DOM 原始繁體文本。
	 *
	 * 不能只記錄「是否處理過」，
	 * 否則簡 -> 繁時無法恢復。
	 */
	const textOriginal = new WeakMap();
	const valueOriginal = new WeakMap();
	const placeholderOriginal = new WeakMap();
	const titleOriginal = new WeakMap();

	function wanted(original) {
		return isS()
			? toSimplified(original)
			: original;
	}

	/* =====================
	 * DOM 屬性轉換
	 * ===================== */

	function updateAttr(node, prop, store) {
		if (
			!node ||
			typeof node[prop] !== "string"
		) {
			return;
		}

		let original = store.get(node);

		if (original === undefined) {
			original = node[prop];
			store.set(
				node,
				original
			);
		}

		const next = wanted(original);

		if (node[prop] !== next) {
			node[prop] = next;
		}
	}

	/* =====================
	 * 遍歷 DOM
	 * ===================== */

	function walk(node) {
		if (!node) {
			return;
		}

		/* =====================
		 * Text Node
		 * ===================== */

		if (node.nodeType === 3) {
			let original = textOriginal.get(node);

			if (original === undefined) {
				original =
					node.nodeValue ||
					"";

				textOriginal.set(
					node,
					original
				);
			}

			const next = wanted(original);

			if (node.nodeValue !== next) {
				node.nodeValue = next;
			}

			return;
		}

		/* =====================
		 * Element
		 * ===================== */

		if (
			node.nodeType !== 1 ||
			SKIP.has(node.tagName)
		) {
			return;
		}

		/* =====================
		 * value
		 * ===================== */

		if (
			node.tagName === "INPUT" ||
			node.tagName === "BUTTON"
		) {
			updateAttr(
				node,
				"value",
				valueOriginal
			);
		}

		/* =====================
		 * placeholder
		 * ===================== */

		if ("placeholder" in node) {
			updateAttr(
				node,
				"placeholder",
				placeholderOriginal
			);
		}

		/* =====================
		 * title
		 * ===================== */

		if ("title" in node) {
			updateAttr(
				node,
				"title",
				titleOriginal
			);
		}

		/* =====================
		 * 子節點
		 * ===================== */

		for (
			let child = node.firstChild;
			child;
			child = child.nextSibling
		) {
			walk(child);
		}
	}

	/* =====================
	 * CE 範圍判定
	 * ===================== */

	function matchesAny(el) {
		try {
			return !!el &&
				el.matches(
					CE_LANG_SELECTOR
				);
		} catch (e) {
			return false;
		}
	}

	function insideCE(el) {
		try {
			return !!el &&
				!!el.closest(
					CE_LANG_SELECTOR
				);
		} catch (e) {
			return false;
		}
	}

	/* =====================
	 * 轉換 DOM 樹
	 * ===================== */

	function convertTree(root) {
		if (!root) {
			return;
		}

		/* =====================
		 * 新增文字節點
		 * ===================== */

		if (root.nodeType === 3) {
			if (
				insideCE(
					root.parentElement
				)
			) {
				walk(root);
			}

			return;
		}

		if (root.nodeType !== 1) {
			return;
		}

		/* =====================
		 * root 自身位於 CE 區域
		 * ===================== */

		if (
			matchesAny(root) ||
			insideCE(root)
		) {
			walk(root);
			return;
		}

		/* =====================
		 * root 內含 CE 區域
		 * ===================== */

		let roots = [];

		try {
			roots = Array.from(
				root.querySelectorAll(
					CE_LANG_SELECTOR
				)
			);
		} catch (e) {
			return;
		}

		if (!roots.length) {
			return;
		}

		/*
		 * 去掉重複的巢狀 root。
		 */
		const top = roots.filter(
			el =>
				!roots.some(
					other =>
						other !== el &&
						other.contains(el)
				)
		);

		top.forEach(walk);
	}

	/* =====================
	 * 手動刷新
	 * ===================== */

	function refreshLang() {
		try {
			convertTree(
				document.body
			);
		} catch (e) {
			console.warn(
				"[Cheat Extended] CE language refresh failed:",
				e
			);
		}
	}

	window.CE_refreshLang = refreshLang;

	/* =====================
	 * MutationObserver
	 * ===================== */

	let observer = null;

	function installObserver() {
		if (
			observer ||
			typeof MutationObserver === "undefined" ||
			!document.body
		) {
			return;
		}

		observer = new MutationObserver(
			mutations => {
				for (const m of mutations) {
					if (
						m.type !== "childList"
					) {
						continue;
					}

					m.addedNodes.forEach(
						node => {
							if (
								node.nodeType === 1 ||
								node.nodeType === 3
							) {
								convertTree(node);
							}
						}
					);
				}
			}
		);

		observer.observe(
			document.body,
			{
				childList: true,
				subtree: true,
			}
		);
	}

	/* =====================
	 * 啟動
	 * ===================== */

	function boot() {
		installObserver();
		refreshLang();
	}

	if (
		document.readyState === "loading"
	) {
		document.addEventListener(
			"DOMContentLoaded",
			boot,
			{
				once: true,
			}
		);
	} else {
		boot();
	}

	console.log(
		"[Cheat Extended] CE_lang 已掛載（繁體原文 / 簡體顯示）"
	);
})();