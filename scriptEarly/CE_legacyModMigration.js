/*=========================================
 Cheat Extended - Legacy Mod Migration

 舊版模組名稱遷移
 - 偵測舊名稱 Cheat Extended 是否仍存在
 - 自動將舊版移至 ModLoader 禁用清單
 - 提醒使用者解除安裝舊版並重新載入
=========================================*/

(() => {
	"use strict";

	const LEGACY_MOD_NAME = "oldName"; // 改成舊版名稱
	const CURRENT_MOD_NAME = "newName"; // 改成新版名稱

	function hasLegacyMod() {
		const modList =
			window.modUtils?.getModListName?.() || [];

		if (CURRENT_MOD_NAME === LEGACY_MOD_NAME) {
			return false;
		}

		return modList.includes(LEGACY_MOD_NAME);
	}

	async function disableLegacyMod() {
		const controller =
			window.modUtils?.getModLoadController?.();

		const logger =
			window.modUtils?.getLogger?.();

		if (!controller) {
			logger?.error?.(
				`[${CURRENT_MOD_NAME}] 無法取得 ModLoadController，無法自動禁用舊版 ${LEGACY_MOD_NAME}。`
			);

			return false;
		}

		try {
			const enabled =
				await controller.listModIndexDB() || [];

			const disabled =
				await controller.loadHiddenModList() || [];

			if (!enabled.includes(LEGACY_MOD_NAME)) {
				logger?.warn?.(
					`[${CURRENT_MOD_NAME}] 偵測到舊版 ${LEGACY_MOD_NAME}，` +
					"但舊版不在 ModLoader 的可管理啟用清單中，無法自動禁用。"
				);

				return false;
			}

			const nextEnabled =
				enabled.filter(
					name => name !== LEGACY_MOD_NAME
				);

			const nextDisabled =
				disabled.includes(LEGACY_MOD_NAME)
					? disabled
					: [
						...disabled,
						LEGACY_MOD_NAME
					];

			await controller.overwriteModIndexDBModList(
				nextEnabled
			);

			try {
				await controller.overwriteModIndexDBHiddenModList(
					nextDisabled
				);
			} catch (err) {
				try {
					await controller.overwriteModIndexDBModList(
						enabled
					);
				} catch (_) {
					// 回滾失敗交由下面的 error 日誌處理。
				}

				throw err;
			}

			logger?.warn?.(
				`[${CURRENT_MOD_NAME}] 偵測到舊版 ${LEGACY_MOD_NAME}，` +
				"已自動將舊版加入 ModLoader 禁用清單，重新載入後生效。"
			);

			return true;
		} catch (err) {
			logger?.error?.(
				`[${CURRENT_MOD_NAME}] 自動禁用舊版 ${LEGACY_MOD_NAME} 失敗：` +
				`${err?.message || err}`
			);

			return false;
		}
	}

	function showLegacyModWarning(autoDisabled) {
		const statusText = autoDisabled
			? `
				<span style="
					color:#8fd694;
					font-weight:bold;
				">
					舊版 ${LEGACY_MOD_NAME} 已自動加入 ModLoader 禁用清單。
				</span>
				<br>
				重新載入遊戲後將不再載入舊版。
			`
			: `
				<span class="red">
					無法自動禁用舊版 ${LEGACY_MOD_NAME}，
					請手動前往 Mod 管理器處理。
				</span>
			`;

		const options = {
			icon: "warning",
			title: `偵測到舊版 ${LEGACY_MOD_NAME}`,

			html: `
				<div style="text-align:left;">
					偵測到目前同時安裝了
					<b>${CURRENT_MOD_NAME}</b>
					與舊版
					<b>${LEGACY_MOD_NAME}</b>。
					<br><br>

					兩個版本同時存在可能造成腳本、
					GUI、事件及存檔邏輯重複執行。
					<br><br>

					${statusText}

					<br><br>

					<span class="red">
						即使已自動禁用舊版，
						仍請務必從 Mod 管理器解除安裝舊版 ${LEGACY_MOD_NAME}，
						並重新載入遊戲。
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
							id="ceLegacyConflictConfirm"
							style="
								margin-top:.25em;
								flex:none;
							"
						>

						<span>
							我知道需要解除安裝舊版 ${LEGACY_MOD_NAME}
						</span>
					</label>

					<div
						id="ceLegacyConflictError"
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
				? "我知道了，重新載入前會解除安裝舊版"
				: "我知道了，會手動處理舊版",

			didOpen: () => {
				const checkbox =
					document.getElementById(
						"ceLegacyConflictConfirm"
					);

				const error =
					document.getElementById(
						"ceLegacyConflictError"
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
						"ceLegacyConflictConfirm"
					);

				const error =
					document.getElementById(
						"ceLegacyConflictError"
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
			`偵測到舊版 ${LEGACY_MOD_NAME}。\n\n` +
			(
				autoDisabled
					? "舊版已自動加入 ModLoader 禁用清單，重新載入後生效。\n"
					: "無法自動禁用舊版，請手動處理。\n"
			) +
			`請務必解除安裝舊版 ${LEGACY_MOD_NAME}，然後重新載入遊戲。`
		);
	}

	/* =========================================================
	 * 在 Inject Early 階段提前註冊 LoadEnd
	 * ========================================================= */

	const controller =
		window.modSC2DataManager
			?.getModLoadController?.();

	if (!controller?.addLifeTimeCircleHook) {
		return;
	}

	controller.addLifeTimeCircleHook(
		"cheatExtendedLegacyMigration",
		{
			ModLoaderLoadEnd: async () => {
				if (!hasLegacyMod()) {
					return;
				}

				const autoDisabled =
					await disableLegacyMod();

				showLegacyModWarning(
					autoDisabled
				);
			}
		}
	);
})();