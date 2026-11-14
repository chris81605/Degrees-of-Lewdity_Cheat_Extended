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
                    if (compareVersions(maplebirchMod.version, "3.2.5") === 1) {
                        logger.log(`[Cheat Extended] 检测到 maplebirch 框架 v${maplebirchMod.version}`);
                        
                        maplebirch.modList.pushUnique("cheat extended");
                        // Maplebirch 註冊對應 Cheat Extended
                        maplebirch.tool.addTo('Cheats', 'cheat_extended');                        
                       // maplebirch.tool.addTo('MenuBig', 'CE_buttom');
                       //maplebirch.tool.addTo('MenuSmall', 'CE_originalCheatButton');
                       maplebirch.tool.addTo('MenuBig', 'CE_originalCheatButton');                      
                        maplebirch.tool.addTo('CaptionAfterDescription', 'CEstatebox');
                        maplebirch.tool.addTo('Options', 'CE_options');
                        maplebirch.tool.addTo('HintMobile', 'CE_sideBarIcon');
                        maplebirch.tool.addTo('Footer', 'CE_CheatExtendedVersion');                        
                        
                    } else {
                        logger.error(`[Cheat Extended] maplebirch 版本過低，至少需要 v3.2.5，當前 v${maplebirchMod.version}`);
                    }
                    return;
                }

                logger.error('[Cheat Extended] 未檢測到 maplebirch 框架，請安裝 MapleBirch >=3.2.5');
            },
        }
    );
})();
