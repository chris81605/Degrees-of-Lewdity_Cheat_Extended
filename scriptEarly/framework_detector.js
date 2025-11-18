(() => {
    const modUtils = window.modUtils;
    const logger = modUtils.getLogger();
    const modSC2DataManager = window.modSC2DataManager;

    function parseVersion(versionString) {
        return versionString.split('.').map(Number);
    }
    
    function compareVersions(vLoaded, vRequired) {
        let vl = parseVersion(vLoaded);
        let vr = parseVersion(vRequired);
        let vLength = Math.max(vr.length, vl.length);
        for (let i = 0; i < vLength; i++) {
            let num1 = vl[i] || 0;
            let num2 = vr[i] || 0;
            if (num1 > num2) return 1;
            if (num1 < num2) return 0;
        }
        return 1;
    }

    // 创建等待用户响应的函数
    async function waitForUserResponse(alertConfig) {
        return new Promise((resolve) => {
            window.modSweetAlert2Mod.fire({
                ...alertConfig,
                willClose: () => {
                    resolve();
                }
            });
        });
    }

    modSC2DataManager.getAddonPluginManager().registerAddonPlugin(
        'cheatExtended',
        'CEModalert',
        {
            async afterInjectEarlyLoad() {
                if (modUtils.getMod('maplebirch')) {
                    if (compareVersions(modUtils.getMod('maplebirch').version, "2.4.3") === 0) {
                        await waitForUserResponse({
							title: 'maplebirch框架版本過低！',
							icon: "warning",
							html: `
								檢測到<span class="orange">秋枫白桦框架模组</span><span class="red">版本過低</span>。為保證<span style="
									animation: 180s infinite linear lustful;
									background: linear-gradient(-90deg, #1ea44a, #1ea44a, #1ea44a, #1ea44a, #1ea44a, #d9e299);
									background-clip: text;
									-webkit-background-clip: text;
									color: transparent;
								">cheat extended</span>所有功能正常，建議將其更新至v2.4.3版本或以上。<br>
								<br>
								你可以從<a href="https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchframework" target="_blank">【秋枫白桦框架】模組的Github頁面</a>更新這個模組。<br>
								<br>
							`,
                            showCancelButton: false,
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                            confirmButtonColor: '#1ea44a',
                            confirmButtonText: 'Ok',
                        });
                    }
                } else if (modUtils.getMod('Simple Frameworks')) {
                    if (compareVersions(modUtils.getMod('Simple Frameworks').version, "2.0.5") === 0) {
                        await waitForUserResponse({
							title: 'Simple Frameworks版本過低',
							html: `
								檢測到<span class="orange">秋枫白桦框架模组</span><span class="red">版本過低</span>。為保證<span style="
									animation: 180s infinite linear lustful;
									background: linear-gradient(-90deg, #1ea44a, #1ea44a, #1ea44a, #1ea44a, #1ea44a, #d9e299);
									background-clip: text;
									-webkit-background-clip: text;
									color: transparent;
								">cheat extended</span>所有功能正常，建議將其更新至v2.0.5版本或以上。<br>
								<br>
								你可以從<a href="https://github.com/emicoto/SCMLSimpleFramework" target="_blank">【简易框架】模組的Github頁面</a>更新這個模組。<br>
								<br>
							`,
                            showCancelButton: false,
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                            confirmButtonColor: '#1ea44a',
                            confirmButtonText: 'Ok',
                        });
                    }
                } else {
                    await waitForUserResponse({
						title: '沒有檢測到前置框架！',
						icon: "error",
						html: `
							檢測到<span class="red">沒有載入</span><span class="orange">秋枫白桦框架模组</span>或<span class="yellow">简易框架模组</span>，而<span style="
								animation: 180s infinite linear lustful;
								background: linear-gradient(-90deg, #1ea44a, #1ea44a, #1ea44a, #1ea44a, #1ea44a, #d9e299);
								background-clip: text;
								-webkit-background-clip: text;
								color: transparent;
							">Cheat Extended</span>多數功能需要安裝任一框架才能正常運作（請不要同時安裝兩個框架以避免嚴重衝突）<br>
							<br>
							你可以從<a href="https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchframework" target="_blank">【秋枫白桦框架】模組的Github頁面</a>或<a href="https://github.com/emicoto/SCMLSimpleFramework" target="_blank">【简易框架】模組的Github頁面</a>下載模組。<br>
							<br>
						`,
                        showCancelButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        confirmButtonColor: '#1ea44a',
                        confirmButtonText: 'Ok',
                    });
                }
            }
        },
    );
})();