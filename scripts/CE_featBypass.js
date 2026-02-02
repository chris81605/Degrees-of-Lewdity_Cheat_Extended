function patchEarnFeatMacro() {
    const macro = Macro.get('earnFeat');
    if (!macro || macro._CE_patched) return;

    console.log('[cheat Extended] 🧩 宏 earnFeat 已Hook');

    const originalHandler = macro.handler;
    
    macro.handler = function earnFeatPatched() {
        const featName = this.args[0];
        console.log(`[cheat Extended] ▶ 執行 earnFeat: ${featName}`);

        // 🚪 檢查全局開關
        if (!V.CE_featBypass) {
            console.log('[cheat Extended] ❌ 無視限制獲取成就：功能開關關閉，執行原始宏');
            return originalHandler.call(this);
        }
        
        V.feats.locked = false;
        console.log('[cheat Extended] 🔓 無視限制獲取成就：功能開關開啟，跳過條件檢查');

        const backup = {
            featLock: V.feats.locked,
            cheatsEnabled: V.cheatsEnabled,
            debug: V.debug,
            statFreeze: V.statFreeze,
           // gamemode: V.gamemode,
            allureModifier: V.settings?.allureModifier,
        };

        V.feats.locked = false;
        V.cheatsEnabled = false;
        V.debug = false;
        V.statFreeze = false;
        if (V.settings) V.settings.allureModifier = 1;

        try {
            return originalHandler.call(this);
        } finally {
            V.cheatsEnabled = backup.cheatsEnabled;
            V.debug = backup.debug;
            V.statFreeze = backup.statFreeze;
           // V.gamemode = backup.gamemode;
            if (V.settings) V.settings.allureModifier = backup.allureModifier;

            console.log('[cheat Extended] 🔒 無視限制獲取成就：狀態已還原');
        }
    };

    macro._CE_patched = true;
}

// 調用 patch
patchEarnFeatMacro();