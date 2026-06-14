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
