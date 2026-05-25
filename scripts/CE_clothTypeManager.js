// 獲取原版特質
// setup.clothTypeList = Object.keys(setup.shopDetails);
Object.defineProperty(setup, "clothTypeList", {
    get() {
        return Object.keys(setup.shopDetails || {});
    }
});

// 獲取对应中文名称
/*
setup.clothTypeNameMap = Object.fromEntries(
    Object.entries(setup.shopDetails).map(([key, data]) => [
        key,
        data.name || key
    ])
);
*/
Object.defineProperty(setup, "clothTypeNameMap", {
    get() {
        const result = {};
        for (const key in setup.shopDetails) {
            result[key] = setup.shopDetails[key]?.name ?? key;
        }
        return result;
    }
});

/* === DOL 風格：服裝 Type 管理器 === */
Macro.add('clothTypeManager', {
    handler() {
        if (!V.worn || !setup.clothes) {
            this.output.append('服裝資料不完整');
            return;
        }

        if (!V.clothTypePresets) V.clothTypePresets = {};
        if (V.clothTypeAutoApply === undefined) {
            V.clothTypeAutoApply = false;
        }

        /* ===== 核心函式 ===== */
        /*
        const applyTypesToPart = (part, typesToAdd) => {
            const cloth = V.worn[part];
            if (!cloth) return;

            const current = Array.isArray(cloth.type)
                ? cloth.type.slice()
                : cloth.type ? [cloth.type] : [];

            typesToAdd.forEach(t => {
                if (!current.includes(t)) current.push(t);
            });

            cloth.type = current;
        };
        */
        const applyTypesToPart = (part, types) => {
            const cloth = V.worn[part];
            if (!cloth) return;
            cloth.type = Array.from(new Set(types));
        };

        const restoreTypesForPart = (part) => {
            const cloth = V.worn[part];
            if (!cloth || !cloth.name) return;

            const partList = setup.clothes[part];
            if (!Array.isArray(partList)) return;

            const base = partList.find(item => item.name === cloth.name);
            if (!base) return;

            const baseType = base.type;
            if (Array.isArray(baseType)) cloth.type = baseType.slice();
            else if (baseType) cloth.type = [baseType];
            else cloth.type = [];
        };

        /* ===== 外框 ===== */
        const root = document.createElement('div');
        root.className = 'dol-settings dol-shadow';

        const header = document.createElement('div');
        header.className = 'dol-header';
        header.innerHTML = `<span class="dol-title">服裝類型管理</span>`;
        root.appendChild(header);

        const body = document.createElement('div');
        body.className = 'dol-body';

        body.innerHTML += `
            <div class="dol-desc">
                可為目前穿著的各部位服裝動態指定多個類型，並可隨時還原為原始定義。
            </div><br>
        `;

        /* ===== 服裝部位 ===== */
        const partsContainer = document.createElement('div');
        body.appendChild(partsContainer);

        const selections = {};
        const checkboxes = {};

        Object.keys(V.worn).forEach(part => {
            const cloth = V.worn[part];
            if (!cloth || (cloth.name === 'naked' && !V.debug)) return;

            selections[part] = new Set();
            checkboxes[part] = {};

            const block = document.createElement('div');
            block.className = 'dol-section-block';

            block.innerHTML = `
                <div style="margin-bottom:4px">
                    <span style="color:gold;font-weight:bold">${part}：</span>
                    <span style="color:white">${cloth.cn_name_cap || cloth.name}</span>
                </div>
            `;

            const currentTypes = Array.isArray(cloth.type)
                ? cloth.type
                : cloth.type ? [cloth.type] : [];

            setup.clothTypeList.forEach(type => {
                const label = document.createElement('label');
                label.style.display = 'inline-block';
                label.style.marginRight = '8px';
                label.style.fontSize = '0.85rem';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';

                if (currentTypes.includes(type)) {
                    checkbox.checked = true;
                    selections[part].add(type);
                }

                checkbox.onchange = () => {
                    checkbox.checked
                        ? selections[part].add(type)
                        : selections[part].delete(type);
                };

                label.appendChild(checkbox);
                label.append(` ${setup.clothTypeNameMap[type] || type}`);
                block.appendChild(label);

                checkboxes[part][type] = checkbox;
            });

            partsContainer.appendChild(block);
        });

        /* ===== 套用 / 還原 ===== */
        const buttonBlock = document.createElement('div');
        buttonBlock.className = 'dol-section-block';

        const applyBtn = document.createElement('span');
        applyBtn.className = 'dol-btn';
        applyBtn.textContent = '套用';

        const restoreBtn = document.createElement('span');
        restoreBtn.className = 'dol-btn';
        restoreBtn.style.marginLeft = '6px';
        restoreBtn.textContent = '還原';

        const statusDiv = document.createElement('div');
        statusDiv.id = 'clothStatus';
        statusDiv.style.marginTop = '6px';
        statusDiv.style.fontSize = '0.85rem';

        applyBtn.onclick = () => {
            const statusLines = [];

            Object.keys(selections).forEach(part => {
                const cloth = V.worn[part];
                if (!cloth) return;

                const before = Array.isArray(cloth.type) ? cloth.type.slice() : [];

                applyTypesToPart(part, Array.from(selections[part]));

                const after = Array.isArray(cloth.type) ? cloth.type : [];

                const added   = after.filter(t => !before.includes(t));
                const removed = before.filter(t => !after.includes(t));

                if (added.length || removed.length) {
                    const parts = [];

                    if (added.length) {
                        parts.push(`<span class="green">＋${added.join(", ")}</span>`);
                    }
                    if (removed.length) {
                        parts.push(`<span class="red">－${removed.join(", ")}</span>`);
                    }

                    statusLines.push(
                        `<b><span class="yellow">${part}</span></b>：${parts.join(" ")}`
                    );
                }
            });

            Wikifier.wikifyEval(
                `<<replace #clothStatus>>${
                    statusLines.length
                        ? statusLines.join("<br>")
                        : "未產生任何變更"
                }<</replace>>`
            );
        };

        restoreBtn.onclick = () => {
            const statusLines = [];

            Object.keys(selections).forEach(part => {
                const cloth = V.worn[part];
                if (!cloth) return;

                const before = Array.isArray(cloth.type) ? cloth.type.slice() : [];

                restoreTypesForPart(part);

                const after = Array.isArray(cloth.type) ? cloth.type : [];

                selections[part] = new Set(after);

                Object.keys(checkboxes[part]).forEach(t => {
                    checkboxes[part][t].checked = after.includes(t);
                });

                const added   = after.filter(t => !before.includes(t));
                const removed = before.filter(t => !after.includes(t));

                if (added.length || removed.length) {
                    const parts = [];

                    if (added.length) {
                        parts.push(`<span class="green">＋${added.join(", ")}</span>`);
                    }
                    if (removed.length) {
                        parts.push(`<span class="red">－${removed.join(", ")}</span>`);
                    }

                    statusLines.push(
                        `<b><span class="yellow">${part}</span></b>：${parts.join(" ")}`
                    );
                }
            });

            Wikifier.wikifyEval(
                `<<replace #clothStatus>>${
                    statusLines.length
                        ? statusLines.join("<br>")
                        : "已還原，無差異"
                }<</replace>>`
            );
        };

        buttonBlock.append(applyBtn, restoreBtn, document.createElement('br'), statusDiv);
        body.appendChild(buttonBlock);

        /* ===== 分隔線 ===== */
        body.appendChild(document.createElement('br'));
        body.appendChild(document.createElement('hr'));

        /* ===== 預設管理 ===== */
        const presetDiv = document.createElement('div');
        presetDiv.style.marginTop = '6px';

        const presetSelect = document.createElement('select');
        Object.keys(V.clothTypePresets).forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            presetSelect.appendChild(opt);
        });

        const applyPresetBtn = document.createElement('span');
        applyPresetBtn.className = 'dol-btn';
        applyPresetBtn.textContent = '套用預設';
        applyPresetBtn.onclick = () => {
            const preset = V.clothTypePresets[presetSelect.value];
            if (!preset) return;
            Object.keys(selections).forEach(p => {
                selections[p] = new Set(preset[p] || []);
                Object.keys(checkboxes[p]).forEach(t => {
                    checkboxes[p][t].checked = selections[p].has(t);
                });
            });
            V.clothTypeLastPreset = presetSelect.value;
        };

        const savePresetBtn = document.createElement('span');
        savePresetBtn.className = 'dol-btn';
        savePresetBtn.textContent = '保存新預設';
        savePresetBtn.onclick = () => {
            const name = prompt('預設名稱');
            if (!name) return;
            V.clothTypePresets[name] = {};
            Object.keys(selections).forEach(p => {
                V.clothTypePresets[name][p] = Array.from(selections[p]);
            });
            presetSelect.append(new Option(name, name));
            presetSelect.value = name;
        };

        const deletePresetBtn = document.createElement('span');
        deletePresetBtn.className = 'dol-btn';
        deletePresetBtn.textContent = '刪除預設';
        deletePresetBtn.onclick = () => {
            const n = presetSelect.value;
            if (!n) return;
            delete V.clothTypePresets[n];
            presetSelect.querySelector(`option[value="${n}"]`)?.remove();
        };

        presetDiv.append(presetSelect, applyPresetBtn, savePresetBtn, deletePresetBtn);

        /* 預設 / 自動套用 分隔 */
        presetDiv.appendChild(document.createElement('hr'));

        const autoLabel = document.createElement('label');
        const autoCheck = document.createElement('input');
        autoCheck.type = 'checkbox';
        autoCheck.checked = V.clothTypeAutoApply;
        autoCheck.onchange = () => V.clothTypeAutoApply = autoCheck.checked;
        autoLabel.append(autoCheck, ' 換裝後自動套用最後預設');

        presetDiv.appendChild(autoLabel);
        body.appendChild(presetDiv);

        body.appendChild(document.createElement('br'));
        body.appendChild(Object.assign(document.createElement('span'), {
            className: 'note',
            textContent: '💡 套用添加或去掉指定類型；還原會回到原始服裝定義'
        }));

        root.appendChild(body);
        this.output.append(root);
    }
});

CE_TabManager.register({
    id: 'clothTypeManager',
    title: '服裝類型管理',
    onClick: () => Wikifier.wikifyEval('<<replace #CE_settingsDiv>><<clothTypeManager>><</replace>>')
});

setup.autoApplyClothTypePreset = function () {
    if (!V.clothTypeAutoApply) return;
    if (!V.clothTypeLastPreset) return;

    const preset = V.clothTypePresets?.[V.clothTypeLastPreset];
    if (!preset) return;

    if (!V.worn) return;

    Object.keys(V.worn).forEach(part => {
        const cloth = V.worn[part];
        if (!cloth || (cloth.name === 'naked' && !V.debug)) return;

        const types = preset[part];
        if (!Array.isArray(types)) return;

        // 直接覆寫 type
        cloth.type = types.slice();
    });

    console.log(
        `[cheat extended][clothTypeManager] 已自動套用預設：${V.clothTypeLastPreset}`
    );
};

$(document).on(':passagedisplay', () => {
    setup.autoApplyClothTypePreset();
});



// 自动补全 setup.shopDetails 的函数

$(document).one(':passagedisplay', () => {
    console.log("[clothesTraitFix] === autoCompleteShopDetails 开始 ===");

    if (!setup.clothes || typeof setup.clothes !== "object") {
        console.warn("[clothesTraitFix] setup.clothes 未定义或不是对象，跳过补全特质");
        return;
    }

    if (setup.autoCompleteShopDetailsFixed === true) {
        console.log("[clothesTraitFix] 特质已补全过，跳过本次执行");
        return; 
    }

    console.log("[clothesTraitFix] 开始收集所有服装特质...");

    const traitsInAllClothes = [
        ...new Set(
            Object.keys(setup.clothes)
                .filter(cat => Array.isArray(setup.clothes[cat]))
                .flatMap(cat => setup.clothes[cat])
                .filter(item => item)
                .flatMap(item => Array.isArray(item.type) ? item.type : [])
        )
    ];

    console.log(`[clothesTraitFix] 共收集到 ${traitsInAllClothes.length} 个特质`);

    let addedCount = 0;
    traitsInAllClothes.forEach(trait => {
        if (!setup.shopDetails[trait]) {
            setup.shopDetails[trait] = {
                name: trait,
                desc: "未定义描述",
                details: "无"
            };
            console.log(`[clothesTraitFix] 已补全特质: ${trait}`);
            addedCount++;
        }
    });

    console.log(`[clothesTraitFix] 本次补全特质数量: ${addedCount}`);
    console.log("[clothesTraitFix] === autoCompleteShopDetails 完成 ===");

    setup.autoCompleteShopDetailsFixed = true;
});