/* =========================
   自訂髮色系統 (DOL Style)
   ========================= */

function refreshHairSidebar(useFullRedraw = false, delay = 50) {
    setTimeout(() => {
        try {
            if (useFullRedraw) {
                Renderer.lastAnimation.stop();
                Renderer.animateLayersAgain();
            } else {
                Renderer.lastAnimation.invalidateCaches();
                Renderer.lastAnimation.redraw();
            }
            Wikifier.wikifyEval('<<updatesidebarimg true>>');
        } catch (e) {
            console.warn('[cheat extended][HairCustom] refresh', e);
        }
    }, delay);
}

function pushCustomHairToSetup() {
    if (!Array.isArray(V.customHair) || !setup.colours || !Array.isArray(setup.colours.hair)) return;
    V.customHair.forEach(hair => {
        const idx = setup.colours.hair.findIndex(item => item.variable === hair.variable);
        if (idx === -1) setup.colours.hair.push({...hair});
        else setup.colours.hair[idx] = {...hair};
    });
    setup.colours.hair_map = {};
    buildColourMap('hair');
}

function setPlayerHairColour(variable, which = 'hair') {
    V.makeup ??= {};
    if (which === 'hair') {
        V.haircolour = variable;
        V.hairfringecolour = variable;
        if (V.hairColourStyle !== undefined) V.hairColourStyle = 'simple';
    } else if (which === 'brows') {
        V.makeup.browscolour = variable;
    } else if (which === 'pubic') {
        V.makeup.pbcolour = variable;
    }
    refreshHairSidebar();
}

function checkCHC() {
    console.log('[cheat extended][HairCustom] 🧾 正在執行髮色資料檢查……');
    setup.hairCustomInit = true;
}

Save.onLoad.add(checkCHC);

$(document).one(':passageinit', () => {
    if (Array.isArray(V.customHair) && V.customHair.length) checkCHC();
});

$(document).on(':passagedisplay', () => {
    if (!setup.hairCustomInit) return;
    if (Array.isArray(V.customHair)) {
        console.log('[cheat extended][HairCustom] 🔹 初始化自訂髮色...');
        pushCustomHairToSetup();
        delete setup.hairCustomInit;
    }
});


/* =========================
   私處毛染色模式覆寫
   ========================= */

const CE_PBHAIR_BLEND_MODES = [
    ['原版', 'native'],
    ['Multiply', 'multiply'],
    ['Screen', 'screen'],
    ['Overlay', 'overlay'],
    ['Darken', 'darken'],
    ['Lighten', 'lighten'],
    ['Soft Light', 'soft-light'],
    ['Hard Light', 'hard-light'],
    ['Color Dodge', 'color-dodge'],
    ['Color Burn', 'color-burn'],
    ['Hue', 'hue'],
    ['Saturation', 'saturation'],
    ['Color', 'color'],
    ['Luminosity', 'luminosity'],
    ['Difference', 'difference'],
    ['Exclusion', 'exclusion']
];

const RenderingStepCEPbHairColor = {
    name: 'cePbHairColor',

    condition(layer) {
        return V.CE_pbhairBlendMode &&
            V.CE_pbhairBlendMode !== 'native' &&
            layer.filters?.includes('pbhair');
    },

    render(image, layer) {
        const colourKey =
            V.makeup?.pbcolour != 0
                ? V.makeup.pbcolour
                : V.naturalhaircolour;

        const filter = setup.colours?.hair_map?.[
            String(colourKey).replace(' ', '')
        ]?.canvasfilter;

        if (!filter?.blend) return image;

        const canvas = Renderer.createCanvas(image.width, image.height);
        return Renderer.composeOverCutout(
            image,
            filter.blend,
            V.CE_pbhairBlendMode,
            canvas
        ).canvas;
    }
};

Renderer.RenderingPipeline = Renderer.RenderingPipeline.filter(
    step => step.name !== 'cePbHairColor'
);
Renderer.RenderingPipeline.push(RenderingStepCEPbHairColor);

Macro.add('hairCustomManager', {
    handler() {
        const container = document.createElement('div');
        container.className = 'dol-settings dol-shadow';
        V.customHair ??= [];
        V.makeup ??= {};
        V.CE_pbhairBlendMode ??= 'native';
        const self = this;

        function currentName(value) {
            if (!value) return '自然髮色';
            return setup.colours?.hair_map?.[value]?.name || value;
        }

        function render() {
            container.innerHTML = '';
            const header = document.createElement('div');
            header.className = 'dol-header';
            header.innerHTML = '<span class="dol-title">自訂髮色管理器</span>';
            container.appendChild(header);
            const body = document.createElement('div');
            body.className = 'dol-body';
            container.appendChild(body);

            const desc = document.createElement('div');
            desc.className = 'dol-desc';
            desc.textContent = '建立自訂髮色，並可分別套用至頭髮、眉毛與私處毛。自訂顏色會加入原版髮色色表。';
            body.appendChild(desc);

            const status = document.createElement('div');
            status.className = 'dol-desc';
            status.style.marginTop = '8px';

            function refreshCurrentHairStatus() {
                status.innerHTML = `目前：頭髮 <span class="dol-blue">${currentName(V.haircolour)}</span>　眉毛 <span class="dol-blue">${currentName(V.makeup.browscolour || V.naturalhaircolour)}</span>　私處毛 <span class="dol-blue">${currentName(V.makeup.pbcolour || V.naturalhaircolour)}</span>`;
            }

            refreshCurrentHairStatus();
            body.appendChild(status);

            const pbBlendBlock = document.createElement('div');
            pbBlendBlock.className = 'dol-section-block';
            pbBlendBlock.style.marginTop = '8px';

            const pbBlendLabel = document.createElement('span');
            pbBlendLabel.textContent = '私處毛染色模式：';
            pbBlendBlock.appendChild(pbBlendLabel);

            // 與 CE 其他設定一致的 (?) 提示說明
            const pbBlendHelp = document.createElement('mouse');
            pbBlendHelp.className = 'tooltip linkBlue';
            pbBlendHelp.textContent = '(?)';
            pbBlendHelp.style.marginLeft = '4px';
            const pbBlendHelpText = document.createElement('span');
            pbBlendHelpText.innerHTML = '部分髮色的原版染色模式可能無法正常作用於私處毛。<br>若私處毛顏色沒有變化，可在此更換染色模式。<br>不同模式的顯色效果可能有所差異。';
            pbBlendHelp.appendChild(pbBlendHelpText);
            pbBlendBlock.appendChild(pbBlendHelp);
            pbBlendBlock.appendChild(document.createElement('br'));

            const pbBlendSelect = document.createElement('select');
            CE_PBHAIR_BLEND_MODES.forEach(([label, value]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = label;
                option.selected = V.CE_pbhairBlendMode === value;
                pbBlendSelect.appendChild(option);
            });
            pbBlendSelect.onchange = function () {
                V.CE_pbhairBlendMode = this.value;
                refreshHairSidebar(true);
            };
            pbBlendBlock.appendChild(pbBlendSelect);
            body.appendChild(pbBlendBlock);

            V.customHair.forEach((hair, idx) => {
                const block = document.createElement('div');
                block.className = 'dol-section-block';
                block.style.border = '2px solid #aaa';
                block.style.padding = '6px';
                block.style.marginTop = '8px';

                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.value = hair.name;
                nameInput.style.width = '140px';
                nameInput.onchange = function () {
                    hair.name = this.value.trim() || `自訂髮色${idx + 1}`;
                    hair.name_cap = hair.name;
                    pushCustomHairToSetup();
                    render();
                };
                block.appendChild(nameInput);

                const colorInput = document.createElement('input');
                colorInput.type = 'text';
                colorInput.value = hair.canvasfilter?.blend || '#ffffff';
                colorInput.style.width = '70px';
                colorInput.style.marginLeft = '6px';
                block.appendChild(colorInput);

                $(colorInput).spectrum({
                    theme: 'sp-dark', chooseText: '選擇', cancelText: '取消',
                    color: colorInput.value, preferredFormat: 'hex', showInput: true,
                    showPalette: true, showSelectionPalette: true, maxSelectionSize: 8,
                    palette: V.customHair.map(e => [e.canvasfilter?.blend || '#ffffff']),
                    change: function (tc) {
                        hair.canvasfilter ??= {};
                        hair.canvasfilter.blend = tc.toHexString();
                        colorInput.value = hair.canvasfilter.blend;
                        pushCustomHairToSetup();
                        refreshHairSidebar();
                    }
                });

                block.appendChild(document.createElement('br'));
                block.append('亮度：');
                const brightSlider = document.createElement('input');
                brightSlider.type = 'range';
                brightSlider.min = -1; brightSlider.max = 1; brightSlider.step = 0.1;
                brightSlider.value = hair.canvasfilter?.brightness ?? 0;
                brightSlider.oninput = function () {
                    hair.canvasfilter ??= {};
                    hair.canvasfilter.brightness = parseFloat(this.value);
                    pushCustomHairToSetup();
                    refreshHairSidebar();
                };
                block.appendChild(brightSlider);
                block.appendChild(document.createElement('br'));

                [['設定頭髮','hair'],['設定眉毛','brows'],['設定私處毛','pubic']].forEach(([label, part]) => {
                    const btn = document.createElement('span');
                    btn.className = 'dol-btn'; btn.style.margin = '2px'; btn.textContent = label;
                    btn.onclick = () => { setPlayerHairColour(hair.variable, part); refreshCurrentHairStatus(); };
                    block.appendChild(btn);
                });

                const delBtn = document.createElement('span');
                delBtn.className = 'dol-btn'; delBtn.style.margin = '2px'; delBtn.textContent = '刪除';
                delBtn.onclick = () => {
                    const removed = V.customHair.splice(idx, 1)[0];
                    const fallback = V.naturalhaircolour || 'brown';
                    if (V.haircolour === removed.variable) V.haircolour = fallback;
                    if (V.hairfringecolour === removed.variable) V.hairfringecolour = fallback;
                    if (V.makeup.browscolour === removed.variable) V.makeup.browscolour = 0;
                    if (V.makeup.pbcolour === removed.variable) V.makeup.pbcolour = 0;
                    if (V.hairColourGradient?.colours) V.hairColourGradient.colours = V.hairColourGradient.colours.map(c => c === removed.variable ? fallback : c);
                    if (V.hairFringeColourGradient?.colours) V.hairFringeColourGradient.colours = V.hairFringeColourGradient.colours.map(c => c === removed.variable ? fallback : c);
                    setup.colours.hair = setup.colours.hair.filter(item => item.variable !== removed.variable);
                    setup.colours.hair_map = {};
                    buildColourMap('hair');
                    refreshHairSidebar();
                    render();
                };
                block.appendChild(delBtn);
                body.appendChild(block);
            });

            const addBtn = document.createElement('div');
            addBtn.className = 'dol-section-block dol-btn';
            addBtn.style.cursor = 'pointer'; addBtn.style.marginTop = '8px'; addBtn.textContent = '＋ 新增髮色';
            addBtn.onclick = () => {
                let id = 1;
                const used = new Set([...(setup.colours?.hair || []).map(e => e.variable), ...V.customHair.map(e => e.variable)]);
                while (used.has(`ce_hair_${id}`)) id++;
                V.customHair.push({
                    variable: `ce_hair_${id}`, name: `自訂髮色${id}`, name_cap: `自訂髮色${id}`,
                    csstext: `ce_hair_${id}`, natural: true, dye: true,
                    canvasfilter: {blend: '#8f6e56', brightness: 0}
                });
                pushCustomHairToSetup();
                render();
            };
            body.appendChild(addBtn);

            /* ==== 顯示原版髮色（摺疊） ==== */
            const defaultHair = (setup.colours?.hair || []).filter(hair =>
                !V.customHair.some(custom => custom.variable === hair.variable)
            );

            if (defaultHair.length) {
                // 折疊容器（同步原版膚色區的顯示方式）
                const details = document.createElement('div');
                details.style.marginTop = '12px';
                details.style.marginBottom = '6px';

                // 標題 + 摺疊按鈕
                const summary = document.createElement('div');
                summary.textContent = '原版髮色 ▸'; // ▸ 收合， ▾ 展開
                summary.style.fontWeight = 'bold';
                summary.style.cursor = 'pointer';
                summary.style.userSelect = 'none';
                summary.style.marginBottom = '6px';
                details.appendChild(summary);

                // 內容區塊
                const innerDiv = document.createElement('div');
                innerDiv.style.display = 'none'; // 預設摺疊
                innerDiv.style.marginTop = '4px';
                innerDiv.style.maxWidth = '100%';
                innerDiv.style.maxHeight = 'min(55vh, 520px)';
                innerDiv.style.overflowY = 'auto';
                innerDiv.style.overflowX = 'hidden';
                innerDiv.style.boxSizing = 'border-box';
                details.appendChild(innerDiv);

                // 點擊標題切換顯示
                summary.onclick = () => {
                    if (innerDiv.style.display === 'none') {
                        innerDiv.style.display = 'block';
                        summary.textContent = '原版髮色 ▾';
                    } else {
                        innerDiv.style.display = 'none';
                        summary.textContent = '原版髮色 ▸';
                    }
                };

                defaultHair.forEach(hair => {
                    const row = document.createElement('div');
                    row.className = 'dol-section-block';
                    row.style.display = 'flex';
                    row.style.alignItems = 'center';
                    row.style.marginBottom = '4px';
                    row.style.flexWrap = 'wrap';
                    row.style.width = '100%';
                    row.style.maxWidth = '100%';
                    row.style.boxSizing = 'border-box';

                    const colorBox = document.createElement('div');
                    colorBox.style.width = '20px';
                    colorBox.style.height = '20px';
                    colorBox.style.backgroundColor = hair.canvasfilter?.blend || '#ffffff';
                    colorBox.style.border = '1px solid #888';
                    colorBox.style.marginRight = '4px';
                    colorBox.title = hair.name;
                    row.appendChild(colorBox);

                    const label = document.createElement('span');
                    label.textContent = hair.name;
                    label.style.marginRight = '8px';
                    row.appendChild(label);

                    [['頭髮','hair'],['眉毛','brows'],['私處毛','pubic']].forEach(([labelText, part]) => {
                        const btn = document.createElement('span');
                        btn.className = 'dol-btn';
                        btn.style.margin = '2px';
                        btn.textContent = labelText;
                        btn.onclick = () => {
                            setPlayerHairColour(hair.variable, part);
                            refreshCurrentHairStatus();
                        };
                        row.appendChild(btn);
                    });

                    innerDiv.appendChild(row);
                });

                body.appendChild(details);
            }

            const reset = document.createElement('div');
            reset.className = 'dol-section-block'; reset.style.marginTop = '10px';
            const resetText = document.createElement('div');
            resetText.className = 'dol-desc'; resetText.textContent = '還原自然色：';
            reset.appendChild(resetText);
            [
                ['頭髮', () => { V.haircolour = V.naturalhaircolour; V.hairfringecolour = V.naturalhaircolour; if (V.hairColourStyle !== undefined) V.hairColourStyle = 'simple'; }],
                ['眉毛', () => { V.makeup.browscolour = 0; }],
                ['私處毛', () => { V.makeup.pbcolour = 0; }]
            ].forEach(([label, fn]) => {
                const btn = document.createElement('span');
                btn.className = 'dol-btn'; btn.style.margin = '2px'; btn.textContent = `還原${label}`;
                btn.onclick = () => { fn(); refreshHairSidebar(); refreshCurrentHairStatus(); };
                reset.appendChild(btn);
            });
            body.appendChild(reset);
        }

        pushCustomHairToSetup();
        render();
        self.output.append(container);
    }
});


/* =========================
   髮色文字輸出
   ========================= */

function CEHairColourTextBrightness(hex, amount) {
    if (typeof hex !== 'string') return '#ffffff';

    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return '#ffffff';

    const bigint = parseInt(hex, 16);
    const factor = 1 + (Number(amount) || 0);
    const clamp = value => Math.min(Math.max(value, 0), 255);
    const r = clamp(((bigint >> 16) & 255) * factor);
    const g = clamp(((bigint >> 8) & 255) * factor);
    const b = clamp((bigint & 255) * factor);

    return `rgb(${r},${g},${b})`;
}

setup.CEHairColourMarkup = function (key) {
    if (!key) return '';

    const hair = setup.colours?.hair_map?.[key];
    if (!hair) return String(key);

    const name = hair.name_cap || hair.name || hair.variable || key;
    const blend = hair.canvasfilter?.blend;
    if (!blend) return String(name);

    const color = CEHairColourTextBrightness(
        blend,
        hair.canvasfilter?.brightness ?? 0
    );

    return `<span style="
        color:${color};
        padding:0 2px;
        border-radius:2px;
        text-shadow:
            1px 1px 2px rgba(0,0,0,0.6),
           -1px 1px 2px rgba(0,0,0,0.6),
            1px -1px 2px rgba(0,0,0,0.6),
           -1px -1px 2px rgba(0,0,0,0.6);
    ">${name}</span>`;
};

Macro.add('CEhaircolourtext', {
    handler() {
        const key = this.args[0];
        if (!key) return;
        $(this.output).wiki(setup.CEHairColourMarkup(key));
    }
});
