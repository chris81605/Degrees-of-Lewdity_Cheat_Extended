// ----------------------------
// 1. 生成 CE 紋身資料
// ----------------------------
function createCETattoos() {
    return [
        { key: 'tattoo_CE0', type: 'text', name: '$CE_tattoo[0]', cn: '$CE_tattoo[0]', special: 'none', arrow: 0, gender: 'n', lewd: 0, degree: 0 },
        { key: 'tattoo_CE1', type: 'text', name: '$CE_tattoo[1]', cn: '$CE_tattoo[1]', special: 'none', arrow: 0, gender: 'n', lewd: 0, degree: 0 },
        { key: 'tattoo_CE2', type: 'text', name: '$CE_tattoo[2]', cn: '$CE_tattoo[2]', special: 'none', arrow: 0, gender: 'n', lewd: 0, degree: 0 },
        { key: 'tattoo_CE3', type: 'text', name: '$CE_tattoo[3]', cn: '$CE_tattoo[3]', special: 'none', arrow: 0, gender: 'n', lewd: 0, degree: 0 },
        { key: 'tattoo_CE4', type: 'text', name: '$CE_tattoo[4]', cn: '$CE_tattoo[4]', special: 'none', arrow: 0, gender: 'n', lewd: 0, degree: 0 },
        { key: 'tattoo_CE5', type: 'text', name: '$CE_tattoo[5]', cn: '$CE_tattoo[5]', special: 'none', arrow: 0, gender: 'n', lewd: 0, degree: 0 },
        { key: 'tattoo_CE6', type: 'text', name: '$CE_tattoo[6]', cn: '$CE_tattoo[6]', special: 'none', arrow: 0, gender: 'n', lewd: 0, degree: 0 },
        { key: 'tattoo_CE7', type: 'text', name: '$CE_tattoo[7]', cn: '$CE_tattoo[7]', special: 'none', arrow: 0, gender: 'n', lewd: 0, degree: 0 },
        { key: 'tattoo_CE8', type: 'text', name: '$CE_tattoo[8]', cn: '$CE_tattoo[8]', special: 'none', arrow: 0, gender: 'n', lewd: 0, degree: 0 },
        { key: 'tattoo_CE9', type: 'text', name: '$CE_tattoo[9]', cn: '$CE_tattoo[9]', special: 'none', arrow: 0, gender: 'n', lewd: 0, degree: 0 },
        { key: 'tattoo_CE10', type: 'text', name: '$CE_tattoo[10]', cn: '$CE_tattoo[10]', special: 'none', arrow: 0, gender: 'n', lewd: 0, degree: 0 },
        { key: 'tattoo_CE11', type: 'text', name: '$CE_tattoo[11]', cn: '$CE_tattoo[11]', special: 'none', arrow: 0, gender: 'n', lewd: 0, degree: 0 },
        { key: 'tattoo_CE12', type: 'text', name: '$CE_tattoo[12]', cn: '$CE_tattoo[12]', special: 'none', arrow: 0, gender: 'n', lewd: 0, degree: 0 },
    ];
}

// ----------------------------
// 2. Maplebirch 專用：添加紋身資料到 setup
// ----------------------------
function addBodyWritingForMaplebirch(tattoos) {
    if (!window.setup) {
        console.error('[Cheat Extended] ❌ setup 不存在，無法添加紋身');
        return;
    }

    setup.bodywriting = setup.bodywriting || {};
    setup.bodywriting_namebyindex = setup.bodywriting_namebyindex || {};

    let addedCount = 0;

    tattoos.forEach(obj => {
        if (!setup.bodywriting[obj.key]) { // 避免重複添加
            const item = {
                index   : Object.keys(setup.bodywriting).length,
                writing : obj.name,
                type    : obj.type ?? 'text',
                writ_cn : obj.cn ?? obj.name,
                arrow   : obj.arrow ?? 0,
                special : obj.special ?? 'none',
                gender  : obj.gender ?? 'n',
                lewd    : typeof obj.lewd === 'number' ? obj.lewd : 1,
                degree  : obj.degree ?? 0,
                key     : obj.key,
                sprites : obj.sprites ?? []
            };

            setup.bodywriting[obj.key] = item;
            setup.bodywriting_namebyindex[item.index] = obj.key;
            addedCount++;
        }
    });

    console.log(`[Cheat Extended] ✅ Maplebirch 環境下已添加 ${addedCount} 個 CE 紋身，總數 ${Object.keys(setup.bodywriting).length}`);
}

// ----------------------------
// 3. 註冊函數，兼容兩個框架
// ----------------------------
function registerCETattoos() {
    const logger = window.modUtils.getLogger();
    const maplebirchMod = window.modUtils.getMod('maplebirch');
    const simpleMod = window.modUtils.getMod('Simple Frameworks');

    const tattoos = createCETattoos();

    if (simpleMod) {
        setup.modTattoos = setup.modTattoos || [];
        setup.modTattoos.push(...tattoos);
        logger.log(`[Cheat Extended] ✅ Simple Frameworks 已註冊 CE 紋身，總數 ${setup.modTattoos.length}`);
        console.log(`[Cheat Extended] ✅ Simple Frameworks 已註冊 CE 紋身，總數 ${setup.modTattoos.length}`);
    }

    if (maplebirchMod) {
        // 等待 setup.bodywriting 初始化且已有資料後再添加
        const interval = setInterval(() => {
            if (setup.bodywriting && Object.keys(setup.bodywriting).length > 0) {
                addBodyWritingForMaplebirch(tattoos);
                clearInterval(interval);
            }
        }, 50);
    }

    if (!simpleMod && !maplebirchMod) {
        logger.error('[Cheat Extended] ❌ 未檢測到 Maplebirch 或 Simple Frameworks，無法註冊 CE 紋身');
        console.error('[Cheat Extended] ❌ 未檢測到 Maplebirch 或 Simple Frameworks，無法註冊 CE 紋身');
    }
}

// ----------------------------
// 4. 初始化
// ----------------------------
registerCETattoos();