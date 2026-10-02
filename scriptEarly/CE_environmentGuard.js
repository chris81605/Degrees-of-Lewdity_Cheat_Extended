/*=========================================
 Cheat Extended - Environment Guard

 模組版本環境保護
 - DoLP 環境僅允許 CheatExpansion for Dolp
 - 一般 DoL 環境僅允許 cheat extended
 - 偵測到錯誤版本時，自動將自己加入 ModLoader 禁用清單
 - 非同步等待 StartConfig.version 出現，最長 5 分鐘
 - ModLoaderLoadEnd 保持 async，但不等待長時間輪詢
 - 若最終仍無法取得版本，彈窗提醒使用者自行確認
=========================================*/

(() => {
	"use strict";

	/* =========================================================
	 * 模組名稱
	 * ========================================================= */

	const DOL_MOD_NAME = "cheat extended";
	const DOLP_MOD_NAME = "CheatExpansion for DolPlus";

	/*
	 * 這份腳本所在模組的名稱。
	 *
	 * 一般 DoL 版：
	 * const CURRENT_MOD_NAME = DOL_MOD_NAME;
	 *
	 * DoLP 版：
	 * const CURRENT_MOD_NAME = DOLP_MOD_NAME;
	 */
	const CURRENT_MOD_NAME = DOL_MOD_NAME;

	/* =========================================================
	 * 等待設定
	 * ========================================================= */

	const ENVIRONMENT_CHECK_INTERVAL = 100;
	const ENVIRONMENT_CHECK_TIMEOUT = 5 * 60 * 1000;

	/* =========================================================
	 * 工具
	 * ========================================================= */

	function getLogger() {
		return window.modUtils?.getLogger?.();
	}

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/* =========================================================
	 * 環境偵測
	 * ========================================================= */

	function detectGameEnvironment() {
		const version = String(
			window.StartConfig?.version || ""
		).trim();

		if (!version) {
			return {
				type: "UNKNOWN",
				version: ""
			};
		}

		if (/\bDoLP\b/i.test(version)) {
			return {
				type: "DOLP",
				version
			};
		}

		return {
			type: "DOL",
			version
		};
	}

	function getExpectedModName(environment) {
		switch (environment?.type) {
			case "DOLP":
				return DOLP_MOD_NAME;

			case "DOL":
				return DOL_MOD_NAME;

			default:
				return null;
		}
	}

	function getEnvironmentName(environment) {
		switch (environment?.type) {
			case "DOLP":
				return "Degrees of Lewdity Plus（DoLP）";

			case "DOL":
				return "Degrees of Lewdity（DoL）";

			default:
				return "未知";
		}
	}

	function isWrongEnvironment(environment) {
		const expected = getExpectedModName(environment);

		if (!expected) {
			return false;
		}

		return CURRENT_MOD_NAME !== expected;
	}

	/* =========================================================
	 * 等待 StartConfig.version
	 * ========================================================= */

	async function waitForGameEnvironment({
		delay = ENVIRONMENT_CHECK_INTERVAL,
		timeout = ENVIRONMENT_CHECK_TIMEOUT
	} = {}) {
		const startTime = Date.now();

		while (Date.now() - startTime < timeout) {
			const environment = detectGameEnvironment();

			if (environment.type !== "UNKNOWN") {
				return environment;
			}

			await sleep(delay);
		}

		/*
		 * timeout 到達後最後再檢查一次，
		 * 避免剛好在邊界時建立。
		 */
		return detectGameEnvironment();
	}

	/* =========================================================
	 * 自動禁用目前模組
	 * ========================================================= */

	async function disableSelf() {
		const controller =
			window.modUtils?.getModLoadController?.();

		const logger = getLogger();

		if (!controller) {
			logger?.error?.(
				`[${CURRENT_MOD_NAME}] 無法取得 ModLoadController，` +
				"無法自動禁用目前模組。"
			);

			return false;
		}

		try {
			const enabled =
				await controller.listModIndexDB() || [];

			const disabled =
				await controller.loadHiddenModList() || [];

			/*
			 * 只操作目前這個分支本身，
			 * 不會碰另一個 Cheat Extended 分支。
			 */
			if (!enabled.includes(CURRENT_MOD_NAME)) {
				logger?.warn?.(
					`[${CURRENT_MOD_NAME}] 偵測到環境不相容，` +
					"但目前模組不在 ModLoader 的可管理啟用清單中，" +
					"無法自動禁用。"
				);

				return false;
			}

			const nextEnabled =
				enabled.filter(
					name => name !== CURRENT_MOD_NAME
				);

			const nextDisabled =
				disabled.includes(CURRENT_MOD_NAME)
					? disabled
					: [
						...disabled,
						CURRENT_MOD_NAME
					];

			await controller.overwriteModIndexDBModList(
				nextEnabled
			);

			try {
				await controller.overwriteModIndexDBHiddenModList(
					nextDisabled
				);
			} catch (err) {
				/*
				 * Hidden List 寫入失敗時，
				 * 嘗試回滾 enabled list。
				 */
				try {
					await controller.overwriteModIndexDBModList(
						enabled
					);
				} catch (_) {
					// 回滾失敗交由下面 error 日誌處理。
				}

				throw err;
			}

			logger?.warn?.(
				`[${CURRENT_MOD_NAME}] 偵測到不相容遊戲環境，` +
				"已自動將目前模組加入 ModLoader 禁用清單，" +
				"重新載入後生效。"
			);

			return true;
		} catch (err) {
			logger?.error?.(
				`[${CURRENT_MOD_NAME}] 自動禁用目前模組失敗：` +
				`${err?.message || err}`
			);

			return false;
		}
	}

	/* =========================================================
	 * 錯版警告
	 * ========================================================= */

	function showEnvironmentWarning(
		autoDisabled,
		environment
	) {
		const expectedMod =
			getExpectedModName(environment);

		const environmentName =
			getEnvironmentName(environment);

		const versionText =
			environment.version
				? `
					<br>
					目前偵測到的遊戲版本：
					<br>
					<code>${environment.version}</code>
				`
				: "";

		const statusText =
			autoDisabled
				? `
					<span style="
						color:#8fd694;
						font-weight:bold;
					">
						目前錯誤版本已自動加入 ModLoader 禁用清單。
					</span>
					<br>
					重新載入遊戲後將不再載入此版本。
				`
				: `
					<span class="red">
						無法自動禁用目前模組，
						請手動前往 Mod 管理器停用或解除安裝。
					</span>
				`;

		const options = {
			icon: "warning",

			title: "Cheat Extended 版本不相容",

			html: `
				<div style="text-align:left;">
					目前偵測到的遊戲環境為：
					<br>
					<b>${environmentName}</b>

					${versionText}

					<br><br>

					但目前載入的是：
					<br>
					<b>${CURRENT_MOD_NAME}</b>

					<br><br>

					此版本不適用於目前遊戲環境。

					<br><br>

					${statusText}

					<br><br>

					正確版本應為：
					<br>
					<span style="
						color:#8fd694;
						font-weight:bold;
					">
						${expectedMod}
					</span>

					<br><br>

					<span class="red">
						請解除安裝目前錯誤版本，
						安裝正確版本後重新載入遊戲。
					</span>

					<br><br>

					<label
						style="
							display:flex;
							align-items:flex-start;
							gap:.5em;
							cursor:pointer;
							color:#fff;
							font-weight:bold;
						"
					>
						<input
							type="checkbox"
							id="ceEnvironmentMismatchConfirm"
							style="
								margin-top:.25em;
								flex:none;
							"
						>

						<span>
							我知道需要安裝正確版本
						</span>
					</label>

					<div
						id="ceEnvironmentMismatchError"
						class="red"
						style="
							display:none;
							margin-top:.8em;
							font-weight:bold;
						"
					>
						請先勾選確認。
					</div>
				</div>
			`,

			showCancelButton: false,
			allowOutsideClick: false,
			allowEscapeKey: false,

			confirmButtonColor: "#3085d6",

			confirmButtonText: autoDisabled
				? "我知道了，重新載入前會更換版本"
				: "我知道了，會手動處理",

			didOpen: () => {
				const checkbox =
					document.getElementById(
						"ceEnvironmentMismatchConfirm"
					);

				const error =
					document.getElementById(
						"ceEnvironmentMismatchError"
					);

				checkbox?.addEventListener(
					"change",
					() => {
						if (
							checkbox.checked &&
							error
						) {
							error.style.display = "none";
						}
					}
				);
			},

			preConfirm: () => {
				const checkbox =
					document.getElementById(
						"ceEnvironmentMismatchConfirm"
					);

				const error =
					document.getElementById(
						"ceEnvironmentMismatchError"
					);

				if (!checkbox?.checked) {
					if (error) {
						error.style.display = "block";
					}

					return false;
				}

				return true;
			}
		};

		if (window.modSweetAlert2Mod?.fire) {
			window.modSweetAlert2Mod.fire(options);
			return;
		}

		window.alert?.(
			`Cheat Extended 版本不相容。\n\n` +
			`目前遊戲：${environmentName}\n` +
			(
				environment.version
					? `遊戲版本：${environment.version}\n`
					: ""
			) +
			`目前模組：${CURRENT_MOD_NAME}\n` +
			`正確版本：${expectedMod}\n\n` +
			(
				autoDisabled
					? "目前模組已自動加入 ModLoader 禁用清單，重新載入後生效。\n\n"
					: "無法自動禁用目前模組，請手動處理。\n\n"
			) +
			"請解除安裝錯誤版本並安裝正確版本。"
		);
	}

	/* =========================================================
	 * 無法確認環境警告
	 * ========================================================= */

	function showUnknownEnvironmentWarning() {
		const options = {
			icon: "warning",

			title: "無法確認遊戲版本",

			html: `
				<div style="text-align:left;">
					Cheat Extended 等待
					<code>StartConfig.version</code>
					超過 5 分鐘仍無法取得。

					<br><br>

					因此無法可靠判斷目前執行的是：
					<br>
					<b>Degrees of Lewdity（DoL）</b>
					<br>
					或
					<br>
					<b>Degrees of Lewdity Plus（DoLP）</b>

					<br><br>

					為避免誤判，本模組
					<span style="
						color:#8fd694;
						font-weight:bold;
					">
						不會自動禁用任何版本。
					</span>

					<br><br>

					<span class="red">
						請務必自行確認目前遊戲版本，
						以及安裝的 Cheat Extended 分支是否正確。
					</span>

					<br><br>

					一般 DoL 應使用：
					<br>
					<b>${DOL_MOD_NAME}</b>

					<br><br>

					DoLP 應使用：
					<br>
					<b>${DOLP_MOD_NAME}</b>

					<br><br>

					如果版本安裝錯誤，
					請前往 Mod 管理器解除安裝錯誤版本，
					再安裝正確版本並重新載入遊戲。

					<br><br>

					<label
						style="
							display:flex;
							align-items:flex-start;
							gap:.5em;
							cursor:pointer;
							color:#fff;
							font-weight:bold;
						"
					>
						<input
							type="checkbox"
							id="ceEnvironmentUnknownConfirm"
							style="
								margin-top:.25em;
								flex:none;
							"
						>

						<span>
							我知道需要自行確認遊戲與模組版本
						</span>
					</label>

					<div
						id="ceEnvironmentUnknownError"
						class="red"
						style="
							display:none;
							margin-top:.8em;
							font-weight:bold;
						"
					>
						請先勾選確認。
					</div>
				</div>
			`,

			showCancelButton: false,
			allowOutsideClick: false,
			allowEscapeKey: false,

			confirmButtonColor: "#3085d6",

			confirmButtonText:
				"我知道了，會自行確認版本",

			didOpen: () => {
				const checkbox =
					document.getElementById(
						"ceEnvironmentUnknownConfirm"
					);

				const error =
					document.getElementById(
						"ceEnvironmentUnknownError"
					);

				checkbox?.addEventListener(
					"change",
					() => {
						if (
							checkbox.checked &&
							error
						) {
							error.style.display = "none";
						}
					}
				);
			},

			preConfirm: () => {
				const checkbox =
					document.getElementById(
						"ceEnvironmentUnknownConfirm"
					);

				const error =
					document.getElementById(
						"ceEnvironmentUnknownError"
					);

				if (!checkbox?.checked) {
					if (error) {
						error.style.display = "block";
					}

					return false;
				}

				return true;
			}
		};

		if (window.modSweetAlert2Mod?.fire) {
			window.modSweetAlert2Mod.fire(options);
			return;
		}

		window.alert?.(
			"Cheat Extended 無法確認目前遊戲版本。\n\n" +
			"等待 StartConfig.version 超過 5 分鐘仍無法取得。\n\n" +
			"為避免誤判，本模組不會自動禁用任何版本。\n\n" +
			`一般 DoL 請使用：${DOL_MOD_NAME}\n` +
			`DoLP 請使用：${DOLP_MOD_NAME}\n\n` +
			"請自行確認目前遊戲版本與安裝的模組版本是否相符。"
		);
	}

	/* =========================================================
	 * 環境檢查主流程
	 * ========================================================= */

	async function runEnvironmentGuard() {
		const logger = getLogger();

		logger?.log?.(
			`[${CURRENT_MOD_NAME}] ` +
				"開始等待 StartConfig.version 以確認遊戲環境。"
		);

		const environment =
			await waitForGameEnvironment();

		/*
		 * 最長等待 5 分鐘仍無法確認。
		 *
		 * UNKNOWN 絕對不當成普通 DoL。
		 * 不自動禁用任何模組。
		 * 但一定提醒使用者自行確認。
		 */
		if (environment.type === "UNKNOWN") {
			logger?.error?.(
				`[${CURRENT_MOD_NAME}] ` +
					"等待 StartConfig.version 超過 5 分鐘仍無法取得，" +
					"無法確認 DoL / DoLP 環境。" +
					"本次不執行自動禁用。"
			);

			showUnknownEnvironmentWarning();

			return;
		}

		logger?.log?.(
			`[${CURRENT_MOD_NAME}] ` +
				`偵測遊戲環境：${environment.type} ` +
				`(${environment.version})`
		);

		/*
		 * 環境正確，不處理。
		 */
		if (!isWrongEnvironment(environment)) {
			logger?.log?.(
				`[${CURRENT_MOD_NAME}] ` +
					"目前模組版本與遊戲環境相符。"
			);

			return;
		}

		const expectedMod =
			getExpectedModName(environment);

		logger?.warn?.(
			`[${CURRENT_MOD_NAME}] ` +
				"模組版本與目前遊戲環境不相容。" +
				`正確版本應為 ${expectedMod}。`
		);

		const autoDisabled =
			await disableSelf();

		showEnvironmentWarning(
			autoDisabled,
			environment
		);
	}

	/* =========================================================
	 * Inject Early / ModLoaderLoadEnd
	 * ========================================================= */

	const controller =
		window.modSC2DataManager
			?.getModLoadController?.();

	if (!controller?.addLifeTimeCircleHook) {
		return;
	}

	controller.addLifeTimeCircleHook(
		"cheatExtendedEnvironmentGuard",
		{
			/*
			 * ModLoader 要求此 lifecycle hook 為 async，
			 * 所以保留 async。
			 *
			 * 但這裡絕對不能：
			 *
			 * await runEnvironmentGuard();
			 *
			 * 或：
			 *
			 * return runEnvironmentGuard();
			 *
			 * 否則 ModLoader 可能等待這個 Promise，
			 * 而 StartConfig.version 又需要
			 * ModLoaderLoadEnd 完成後才能建立，
			 * 形成邏輯死鎖。
			 */
			ModLoaderLoadEnd: async () => {
				void runEnvironmentGuard().catch(err => {
					const logger = getLogger();

					logger?.error?.(
						`[${CURRENT_MOD_NAME}] ` +
							"環境檢查發生未預期錯誤：" +
							`${err?.stack || err?.message || err}`
					);
				});

				/*
				 * async hook 在這裡立即完成。
				 * 不等待 runEnvironmentGuard。
				 */
				return;
			}
		}
	);
})();