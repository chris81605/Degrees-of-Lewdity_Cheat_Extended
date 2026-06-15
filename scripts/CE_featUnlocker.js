function unlockAllFeats() {
    if (!V.feats) V.feats = {};
    if (!V.feats.currentSave) V.feats.currentSave = {};
    
    // Unlock achievements
    V.feats.locked = false;
    Object.keys(setup.feats).forEach(feat => {
        if (["points", "specialClothes"].includes(feat)) return;
        V.feats.currentSave[feat] = new Date();
    });
    
    // Unlock all special clothes sets
    const specialClothes = V.feats.allSaves?.specialClothes || [];
    if (setup.specialClothesSets) {
        Object.keys(setup.specialClothesSets).forEach(set => {
            if (setup.specialClothesSets[set].feat && !specialClothes.includes(set)) {
                specialClothes.push(set);
            }
        });
    }
    if (!V.feats.allSaves) V.feats.allSaves = {};
    V.feats.allSaves.specialClothes = specialClothes;
    
    updateFeats();
    localStorage.setItem("dolFeats", JSON.stringify(V.feats.allSaves));
    console.log('[cheat Extended] 🔓 已解锁全部成就并同步全局存档');
}
window.unlockAllFeats = unlockAllFeats;

function resetAllFeats() {
    if (!V.feats) V.feats = {};
    V.feats.currentSave = {};
    V.feats.allSaves = { points: 0, specialClothes: [] };
    localStorage.setItem("dolFeats", JSON.stringify(V.feats.allSaves));
    updateFeats();
    console.log('[cheat Extended] 🔒 已重置全部成就并清空全局存档');
}
window.resetAllFeats = resetAllFeats;

function toggleFeat(featName, unlock) {
    if (!V.feats) V.feats = {};
    if (!V.feats.currentSave) V.feats.currentSave = {};
    if (!V.feats.allSaves) V.feats.allSaves = { points: 0, specialClothes: [] };

    if (unlock) {
        V.feats.locked = false;
        V.feats.currentSave[featName] = new Date();
        V.feats.allSaves[featName] = V.feats.currentSave[featName];
        
        // 播放原版成就解锁动画提示
        try {
            if (typeof displayFeat === "function") {
                displayFeat(featName);
            } else if (typeof window.displayFeat === "function") {
                window.displayFeat(featName);
            } else if (typeof $.wiki === "function") {
                $.wiki('<<displayFeat `' + featName + '`>>');
            }
        } catch (e) {
            console.error('[cheat Extended] 无法播放成就解锁提示动画:', e);
        }
    } else {
        delete V.feats.currentSave[featName];
        delete V.feats.allSaves[featName];
        let featData = localStorage.getItem("dolFeats");
        if (featData) {
            featData = JSON.parse(featData);
            delete featData[featName];
            localStorage.setItem("dolFeats", JSON.stringify(featData));
        }
    }
    
    updateFeats();
    localStorage.setItem("dolFeats", JSON.stringify(V.feats.allSaves));
    console.log(`[cheat Extended] ⚙️ 成就 [${featName}] 状态已切换为: ${unlock ? '解锁' : '未解锁'}`);
}
window.toggleFeat = toggleFeat;

/* =========================================================
 * CE_FeatUnlockerPanel
 * 成就解鎖器 UI
 *
 * 用法：
 * 在 widget 內呼叫：
 * <<CE_FeatUnlockerPanel>>
 *
 * 功能：
 * - 一鍵解鎖全部成就
 * - 一鍵重置全部成就
 * - 單項解鎖 / 上鎖
 * - 每頁顯示 10 個成就
 * - 支援搜尋與篩選
 * ========================================================= */

Macro.add("CE_FeatUnlockerPanel", {
	handler() {

		/* ===============================
		 * 建立最外層面板容器
		 * =============================== */
		const root = document.createElement("div");
		root.className = "dol-settings dol-shadow";
		this.output.appendChild(root);

		/* ===============================
		 * UI 狀態
		 *
		 * 使用 window 保存狀態，避免面板重繪後
		 * 搜尋內容、頁碼、篩選條件全部重置。
		 * =============================== */
		const state = window.CE_FeatUnlockerState ??= {
			page: 1,        // 目前頁碼
			perPage: 10,    // 每頁顯示數量
			filter: "all",  // all / unlocked / locked
			search: "",     // 搜尋關鍵字
		};

		/* ===============================
		 * 重新載入整個 CE 設定面板
		 *
		 * 目前沒有使用。
		 * 若之後某些操作必須重新跑整個 widget，
		 * 可以改用 refreshPassage()。
		 * =============================== */
		const refreshPassage = () => {
			$("#CE_settingsDiv").empty().wiki("<<CE_featUnlockerPanel>>");
		};

		/* ===============================
		 * 取得目前已解鎖成就 key
		 *
		 * $feats.currentSave 會記錄目前存檔已解鎖成就。
		 * 這裡用 optional chaining 避免變數不存在報錯。
		 * =============================== */
		const getUnlockedKeys = () => {
			const V = State.variables;
			return Object.keys(V.feats?.currentSave ?? {});
		};

		/* ===============================
		 * 整理成就資料
		 *
		 * setup.feats：
		 *   遊戲中全部成就定義
		 *
		 * 回傳格式：
		 * {
		 *   key: 成就 id,
		 *   title: 成就標題,
		 *   desc: 解鎖後描述,
		 *   hint: 未解鎖提示,
		 *   unlocked: 是否已解鎖
		 * }
		 * =============================== */
		const getFeatList = () => {
			const feats = setup.feats ?? {};
			const unlockedKeys = getUnlockedKeys();

			return Object.keys(feats).map(key => {
				const feat = feats[key] ?? {};
				const unlocked = unlockedKeys.includes(key);

				return {
					key,
					title: feat.title ?? key,
					desc: feat.desc ?? "",
					hint: feat.hint ?? "",
					unlocked,
				};
			});
		};

		/* ===============================
		 * DOM 建立工具
		 *
		 * el("div", { className, text, style, attrs, on }, children)
		 *
		 * options:
		 * - className: class 名稱
		 * - text: textContent
		 * - html: innerHTML
		 * - style: inline style 物件
		 * - attrs: HTML attributes
		 * - on: 事件監聽
		 * =============================== */
		const el = (tag, options = {}, children = []) => {
			const node = document.createElement(tag);

			if (options.className) node.className = options.className;
			if (options.text !== undefined) node.textContent = options.text;
			if (options.html !== undefined) node.innerHTML = options.html;

			if (options.style) {
				Object.assign(node.style, options.style);
			}

			if (options.attrs) {
				for (const [k, v] of Object.entries(options.attrs)) {
					node.setAttribute(k, v);
				}
			}

			if (options.on) {
				for (const [event, fn] of Object.entries(options.on)) {
					node.addEventListener(event, fn);
				}
			}

			for (const child of children) {
				if (child) node.appendChild(child);
			}

			return node;
		};

		/* ===============================
		 * 按鈕建立工具
		 * =============================== */
		const button = (text, onClick, disabled = false) => {
			const btn = el("button", {
				text,
				on: { click: onClick },
			});

			btn.disabled = disabled;
			return btn;
		};

		/* ===============================
		 * 主渲染函式
		 *
		 * 每次：
		 * - 搜尋內容改變
		 * - 篩選條件改變
		 * - 換頁
		 * - 解鎖 / 上鎖
		 *
		 * 都會重新呼叫 render() 更新畫面。
		 * =============================== */
		const render = () => {
			root.innerHTML = "";

			/* 取得全部成就 */
			const allFeats = getFeatList();

			/* ===============================
			 * 套用篩選與搜尋
			 * =============================== */
			let filtered = allFeats.filter(feat => {
				if (state.filter === "unlocked" && !feat.unlocked) return false;
				if (state.filter === "locked" && feat.unlocked) return false;

				const keyword = state.search.trim().toLowerCase();

				if (keyword) {
					const text = [
						feat.key,
						feat.title,
						feat.desc,
						feat.hint,
					].join(" ").toLowerCase();

					if (!text.includes(keyword)) return false;
				}

				return true;
			});

			/* ===============================
			 * 分頁計算
			 * =============================== */
			const totalPages = Math.max(1, Math.ceil(filtered.length / state.perPage));
			state.page = Math.min(Math.max(state.page, 1), totalPages);

			const start = (state.page - 1) * state.perPage;
			const pageItems = filtered.slice(start, start + state.perPage);

			/* ===============================
			 * 標題區
			 * =============================== */
			root.appendChild(
				el("div", { className: "dol-header" }, [
					el("span", {
						className: "dol-title",
						text: "🏆 成就解锁器 (Achievement Unlocker)",
					}),
				])
			);

			const body = el("div", { className: "dol-body" });
			root.appendChild(body);

			body.appendChild(
				el("div", {
					className: "dol-desc",
					text: "管理当前存档与浏览器本地全局成就，可单独解锁、上锁，或一键批量处理。",
				})
			);

			body.appendChild(el("br"));

			/* ===============================
			 * 全局操作區
			 * =============================== */
			body.appendChild(
				el("div", { className: "dol-header" }, [
					el("span", {
						className: "dol-title",
						text: "全局操作 (Bulk Operations)",
					}),
				])
			);

			body.appendChild(el("br"));

			body.appendChild(
				el("div", { className: "dol-section" }, [
					el("div", {
						className: "dol-btn",
						style: {
							display: "flex",
							gap: "10px",
							flexWrap: "wrap",
						},
					}, [
						button("一键解锁全部成就 (Unlock All)", () => {
							unlockAllFeats();
							render();
						}),

						button("一键重置全部成就 (Reset All)", () => {
							resetAllFeats();
							state.page = 1;
							render();
						}),
					]),

					el("div", {
						className: "dol-desc",
						text: "※ 解锁或重置会直接同步修改当前存档及浏览器的本地全局成就 localStorage。",
						style: {
							fontSize: "0.85em",
							color: "gray",
							marginTop: "6px",
						},
					}),
				])
			);

			body.appendChild(el("br"));
			body.appendChild(el("br"));

			/* ===============================
			 * 成就列表標題
			 * =============================== */
			body.appendChild(
				el("div", { className: "dol-header" }, [
					el("span", {
						className: "dol-title",
						text: "成就列表 (Achievement List)",
					}),
				])
			);

			body.appendChild(el("br"));

			const listSection = el("div", { className: "dol-section" });
			body.appendChild(listSection);

			/* ===============================
			 * 搜尋框
			 * =============================== */
			const searchInput = el("input", {
				attrs: {
					type: "text",
					placeholder: "搜索成就标题 / 描述 / 提示...",
				},
				style: {
					flex: "1",
					minWidth: "180px",
					padding: "4px",
				},
				on: {
					input() {
						state.search = this.value;
						state.page = 1;
						render();
					},
				},
			});

			searchInput.value = state.search;

			/* ===============================
			 * 篩選選單
			 * =============================== */
			const filterSelect = el("select", {
				style: { padding: "4px" },
				on: {
					change() {
						state.filter = this.value;
						state.page = 1;
						render();
					},
				},
			});

			[
				["all", "全部"],
				["unlocked", "已解锁"],
				["locked", "未解锁"],
			].forEach(([value, text]) => {
				const option = el("option", {
					text,
					attrs: { value },
				});

				if (state.filter === value) {
					option.selected = true;
				}

				filterSelect.appendChild(option);
			});

			/* 搜尋 + 篩選列 */
			listSection.appendChild(
				el("div", {
					style: {
						display: "flex",
						gap: "8px",
						flexWrap: "wrap",
						alignItems: "center",
						marginBottom: "10px",
					},
				}, [
					searchInput,
					filterSelect,
				])
			);

			/* ===============================
			 * 沒有搜尋結果時顯示提示
			 * =============================== */
			if (pageItems.length === 0) {
				listSection.appendChild(
					el("div", {
						className: "dol-desc",
						text: "没有符合条件的成就。",
						style: { color: "gray" },
					})
				);
			}

			/* ===============================
			 * 成就卡片列表
			 * =============================== */
			for (const feat of pageItems) {
				const card = el("div", {
					className: "dol-settings dol-shadow",
					style: {
						padding: "8px",
						marginBottom: "8px",
					},
				});

				const status = el("span", {
					className: feat.unlocked ? "dol-green" : "dol-red",
					text: feat.unlocked
						? "★ [已解锁 / Unlocked]"
						: "☆ [未解锁 / Locked]",
				});

				const title = el("span", {
					className: "gold bold",
					text: feat.title,
					style: { marginLeft: "5px" },
				});

				const desc = el("div", {
					className: "dol-desc",
					text: feat.unlocked || !feat.hint ? feat.desc : feat.hint,
					style: {
						fontSize: "0.85em",
						color: "gray",
						marginTop: "3px",
					},
				});

				const info = el("div", { style: { flex: "1" } }, [
					status,
					title,
					el("br"),
					desc,
				]);

				const action = el("div", {
					className: "dol-btn",
					style: { whiteSpace: "nowrap" },
				}, [
					button(feat.unlocked ? "上锁 (Lock)" : "解锁 (Unlock)", () => {
						toggleFeat(feat.key, !feat.unlocked);
						render();
					}),
				]);

				card.appendChild(
					el("div", {
						style: {
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							gap: "10px",
						},
					}, [
						info,
						action,
					])
				);

				listSection.appendChild(card);
			}

			/* ===============================
			 * 分頁按鈕
			 * =============================== */
			listSection.appendChild(
				el("div", {
					style: {
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						gap: "10px",
						marginTop: "10px",
					},
				}, [
					button("上一页", () => {
						state.page--;
						render();
					}, state.page <= 1),

					el("span", {
						className: "dol-desc",
						text: `第 ${state.page} / ${totalPages} 页，共 ${filtered.length} 项`,
					}),

					button("下一页", () => {
						state.page++;
						render();
					}, state.page >= totalPages),
				])
			);
		};

		/* 初次渲染 */
		render();
	},
});