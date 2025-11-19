/*
simpleFrameworks.addto('iModCheats', 'cheat_extended')
simpleFrameworks.addto('ModMenuBig', 'bccmeditor_button')
simpleFrameworks.addto('ModCaptionAfterDescription', 'bccmeditor_init')
simpleFrameworks.addto('ModCaptionAfterDescription', 'CEstatebox')
simpleFrameworks.addto('iModOptions', 'swich_DEBUG_MODE')
*/

(() => {
    window.modSC2DataManager.getModLoadController().addLifeTimeCircleHook(
        'cheatExtended',
        {
            ModLoaderLoadEnd: async () => {
                function parseVersion(versionString) {
                    return versionString.split('.').map(Number);
                }
                function compareVersions(vLoaded, vRequired) {
                    const vl = parseVersion(vLoaded);
                    const vr = parseVersion(vRequired);
                    const vLength = Math.max(vl.length, vr.length);
                    for (let i = 0; i < vLength; i++) {
                        const num1 = vl[i] || 0;
                        const num2 = vr[i] || 0;
                        if (num1 > num2) return 1;
                        if (num1 < num2) return 0;
                    }
                    return 1;
                }

                const logger = window.modUtils.getLogger();

                // Maplebirch 框架檢測
                const maplebirchMod = window.modUtils.getMod('maplebirch');
                if (maplebirchMod) {
                    if (compareVersions(maplebirchMod.version, "2.4.3") === 1) {
                        logger.log(`[Cheat Extended] 检测到 maplebirch 框架 v${maplebirchMod.version}`);

                        // Maplebirch 註冊對應 Cheat Extended
                        maplebirchFrameworks.addto('Cheats', 'cheat_extended');
                        maplebirchFrameworks.addto('MenuBig', 'bccmeditor_button');
                        maplebirchFrameworks.addto('MenuBig', 'CE_buttom');
                        maplebirchFrameworks.addto('CaptionAfterDescription', 'bccmeditor_init');
                        maplebirchFrameworks.addto('CaptionAfterDescription', 'CEstatebox');
                        maplebirchFrameworks.addto('Options', 'swich_DEBUG_MODE');

                    } else {
                        logger.error(`[Cheat Extended] maplebirch 版本過低，至少需要 v2.4.3，當前 v${maplebirchMod.version}`);
                    }
                    return;
                }

                // Simple Frameworks 框架檢測
                const simpleMod = window.modUtils.getMod('Simple Frameworks');
                if (simpleMod) {
                    if (compareVersions(simpleMod.version, "2.0.5") === 1) {
                        logger.log(`[Cheat Extended] 检测到 Simple Frameworks 框架 v${simpleMod.version}`);

                        // Simple Frameworks 註冊 Cheat Extended
                        simpleFrameworks.addto('iModCheats', 'cheat_extended');
                        simpleFrameworks.addto('ModMenuBig', 'bccmeditor_button');
                        simpleFrameworks.addto('ModMenuBig', 'CE_buttom');
                        simpleFrameworks.addto('ModCaptionAfterDescription', 'bccmeditor_init');
                        simpleFrameworks.addto('ModCaptionAfterDescription', 'CEstatebox');
                        simpleFrameworks.addto('iModOptions', 'swich_DEBUG_MODE');

                    } else {
                        logger.error(`[Cheat Extended] Simple Frameworks 版本過低，至少需要 v2.0.5，當前 v${simpleMod.version}`);
                    }
                    return;
                }

                // 都沒檢測到
                logger.error(`[Cheat Extended] 未检测到 maplebirch 或 Simple Frameworks 框架，请加载前置模组`);
            },
        }
    );
})();
