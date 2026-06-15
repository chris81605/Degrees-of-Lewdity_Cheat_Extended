/* =========================
   自訂多組膚色系統 (DOL Style)
   ========================= */

/* =========================
   膚色系統工具函式
   ========================= */

/**
 * 將輸入值正規化為標準 hex 顏色格式（#rrggbb）
 *
 * - 僅接受 6 碼 hex（不支援 #rgb / rgba / 其他格式）
 * - 自動去除前後空白
 * - 統一轉為小寫，避免大小寫造成比較與排序問題
 *
 * @param {any} hex - 使用者或系統輸入的顏色值
 * @returns {string|null}
 *   - 合法顏色 → "#rrggbb"
 *   - 非法或不可用 → null
 */
function normalizeHexColor(hex){
    if (typeof hex !== 'string') return null;

    // 僅允許完整 6 碼 hex 顏色
    const m = hex.trim().match(/^#([0-9a-fA-F]{6})$/);

    // 統一為小寫格式，確保後續比較與排序穩定
    return m ? `#${m[1].toLowerCase()}` : null;
}


/**
 * 計算顏色的「視覺亮度（luminance）」
 *
 * 使用 sRGB / W3C 標準加權公式，
 * 模擬人眼對不同顏色的感知亮度：
 *
 *   L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 *
 * - 綠色對亮度影響最大
 * - 藍色影響最小
 *
 * @param {string} hex - 標準 hex 顏色（#rrggbb）
 * @returns {number}
 *   - 0   → 最暗（黑）
 *   - 255 → 最亮（白）
 */
function colorLuminance(hex) {
    // 先正規化，確保格式正確
    hex = normalizeHexColor(hex);
    if (!hex) return 0; // 非法顏色視為最暗

    // 拆解 RGB 分量
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);

    // 人眼感知亮度公式
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}


/**
 * 依顏色亮度重新排序膚色陣列
 *
 * 流程：
 * 1. 正規化所有顏色（去除非法值）
 * 2. 移除無效顏色
 * 3. 依「視覺亮度」由淺到深排序
 *
 * ⚠ 會直接修改 skin.colors（in-place）
 *
 * @param {{ colors: string[] }} skin
 */
function sortColorsByLuminance(skin){
    skin.colors = skin.colors
        .map((color, index) => ({
            color, // 原樣保留
            index,
            luminance: colorLuminance(color) // 計算用
        }))
        .sort((a, b) => {
            if (b.luminance !== a.luminance) {
                return b.luminance - a.luminance; // 亮 → 暗
            }
            return a.index - b.index; // 穩定排序
        })
        .map(o => o.color); // 原封不動回去
}

// -------------------------
// 更新模型顯示
// -------------------------
function refreshSkinSidebar(useFullRedraw = false, delay = 50) {
    setTimeout(() => {
        if (useFullRedraw) {
            Renderer.lastAnimation.stop();
            Renderer.animateLayersAgain();
        } else {
            Renderer.lastAnimation.invalidateCaches();
            Renderer.lastAnimation.redraw();
        }
        //Renderer.CanvasModelCaches = {};
        Wikifier.wikifyEval('<<updatesidebarimg true>>');
    }, delay);
}

// -------------------------
// 推送自訂膚色到 setup
// -------------------------
function pushCustomSkinsToSetup(){
	if(!Array.isArray(V.customSkin)) return;

	V.customSkin.forEach(skin => {
        sortColorsByLuminance(skin);
		setup.colours.skin_options[skin.name] = {
			gradient: skin.colors,
			blendMode: "multiply",
			desaturate: !!skin.desaturate,
			alpha: skin.alpha ?? 1
		};
	});
}

// -------------------------
// 讀檔後膚色資料檢查(設定觸發旗標)
// -------------------------
function checkCSC() {    
    console.log(`[cheat extended][SkinCustom] 🧾 正在執行讀檔後膚色資料檢查……`);
    setup.skinCustomInit = true; 
} 
     
Save.onLoad.add(checkCSC);

$(document).one(':passageinit', () => {
    if(!V.customSkin || !V.customSkin.length) return;

    if(Array.isArray(V.customSkin)) {
        console.log(`[cheat extended][SkinCustom] 🧾 正在執行膚色資料檢查……`);
        setup.skinCustomInit = true;             
    }
});

$(document).on(':passagedisplay', () => {
	if(!setup.skinCustomInit) return;

	if(Array.isArray(V.customSkin)){
		console.log('[cheat extended][SkinCustom] 🔹 初始化自訂膚色...');
		pushCustomSkinsToSetup();
		delete setup.skinCustomInit;
	}
});

/* =========================
   Skin Color Presets
   每一組皆為「由淺到深」
   用途：Spectrum palette 快選，不影響實際儲存值
   ========================= */

setup.SkinColorPalettes = {

    // ── 基礎亞洲／通用膚色 ──
    base: [
        '#fff1e8', // 很淺自然膚
        '#e0b090', // 標準膚色
        '#c68642', // 偏小麥
        '#8a5a3c'  // 深棕膚
    ],

    // ── 冷色調膚色（偏白、陰影偏冷）──
    // 常見於室內光源、月光、蒼白角色
    cool: [
        '#fff5f0',
        '#f2e6dc',
        '#e5d4c4',
        '#d0b8a4'
    ],

    // ── 中性膚色（最不吃光源）──
    // 適合寫實角色、預設 NPC
    neutral: [
        '#f6d7c0',
        '#e8bfa0',
        '#d1a07a',
        '#b07a55'
    ],

    // ── 暖色膚色（陽光、健康感）──
    // 戶外活動、運動系、沙漠地區角色
    warm: [
        '#f3c2a0',
        '#dd9c6c',
        '#c27a4a',
        '#8f4f2a'
    ],

    // ── 深色膚系 ──
    // 非黑皮 caricature，而是自然深膚
    dark: [
        '#a8744f',
        '#7a4e32',
        '#5a3824',
        '#3b2418'
    ],

    // ── 蒼白 / 病弱 / 非日照角色 ──
    // 吸血鬼、實驗體、病嬌、地下居民
    pale: [
        '#ffffff',
        '#f2f2f2',
        '#e6e6e6',
        '#cccccc'
    ],

    // ── 灰階測試 / 陰影對照 ──
    // 用途：測試材質、亮度排序、遮色片
    grayscale: [
        '#ffffff',
        '#cccccc',
        '#888888',
        '#000000'
    ],

    // ==================================================
    // ☆ 奇幻膚色（Fantasy / 非人類）
    // ==================================================

    // ── 精靈 / 魔法血統（淡色冷膚）──
    elf: [
        '#f4fff9', // 月白
        '#dff2e8', // 淡薄荷
        '#bcd6c8', // 冷青膚
        '#8fa99a'  // 深林色
    ],

    // ── 魔族 / 魅魔（暖紅棕系）──
    demon: [
        '#f3c0b0',
        '#d98a73',
        '#b45a45',
        '#7a2e22'
    ],

    // ── 獸人 / 野性種族（偏土色）──
    beast: [
        '#e2c2a1',
        '#c49a6c',
        '#9c6b3f',
        '#6b4326'
    ],

    // ── 不死 / 幽冥 / 屍化 ──
    undead: [
        '#d8e0d4',
        '#aeb8aa',
        '#7d8a7b',
        '#4f5a50'
    ],

    // ── 龍裔 / 高魔種 ──
    // 帶輕微色相但仍能當「皮膚」
    draconic: [
        '#e6d6c3',
        '#c7b091',
        '#9e7e5d',
        '#6a4a33'
    ],
    
    // ── 螢光 / 魔力皮膚──
    neon: [
        '#ff00ff', // 紫粉
        '#00ffff', // 藍綠
        '#ff9900', // 橘黃
        '#99ff00'  // 螢光綠
    ],

    // ── 水元素 / 冰霜膚──
    water: [
        '#ccefff', // 淡藍
        '#99ddff', // 冰湖
        '#66bbff', // 藍霜
        '#3399ff'  // 深海
    ],

    // ── 火元素 / 熔岩膚──
    lava: [
        '#ffddcc', // 熱灰
        '#ff9955', // 火橙
        '#ff4422', // 熔岩紅
        '#aa1100'  // 深紅岩
    ],

    // ── 植物 / 藤蔓膚──
    plant: [
        '#e0ffe0', // 淡綠
        '#a0d080', // 枯葉綠
        '#608040', // 樹皮綠
        '#304020'  // 森林深綠
    ],

    // ── 魂 / 幽冥膚──
    spectral: [
        '#ffffff', // 幽白
        '#c0c0ff', // 幽藍
        '#8080ff', // 幽紫
        '#4040ff'  // 深魂色
    ],

    // ── 金屬 / 鎧甲膚──
    metallic: [
        '#fff8e0', // 金黃
        '#d4af37', // 黃金
        '#b08d57', // 古銅
        '#6e4b2a'  // 銅棕
    ]
};

setup.getSkinPalette = function () {
    return Object.values(setup.SkinColorPalettes);
};

/* =========================
   自訂多組膚色系統 (DOL Style) + 去飽和 + 透明度滑桿
   ========================= */

Macro.add('skinCustomManager', {
    handler() {
        const container = document.createElement('div');
        container.className = 'dol-settings dol-shadow';
        const self = this;

        if(!V.customSkin) V.customSkin = [];

        function render() {
            container.innerHTML = '';

            // ===== 標題 =====
            const header = document.createElement('div');
            header.className = 'dol-header';
            header.innerHTML = `<span class="dol-title">自訂膚色管理器</span>`;
            container.appendChild(header);

            // ===== 主體 =====
            const body = document.createElement('div');
            body.className = 'dol-body';
            container.appendChild(body);

            // 說明文字
            const desc = document.createElement('div');
            desc.className = 'dol-desc';
            desc.textContent = '管理自訂膚色，可設定 2~4 顏色，顏色自動由淺至深排列，可設定去飽和與透明度。';
            body.appendChild(desc);
            body.appendChild(document.createElement('br'));

            // ===== 自訂膚色區 =====
            if(V.customSkin.length){
                const sectionHeader = document.createElement('div');
                sectionHeader.style.fontWeight='bold';
                sectionHeader.style.marginBottom='6px';
                sectionHeader.textContent='自訂膚色';
                body.appendChild(sectionHeader);
            }

            V.customSkin.forEach((skin, idx)=>{
                const skinBlock = document.createElement('div');
                skinBlock.className='dol-section-block';
                skinBlock.style.border='1px solid #ccc';
                skinBlock.style.padding='4px';
                skinBlock.style.marginBottom='6px';

                // --- 名稱輸入 ---
                const nameRow = document.createElement('div');
                nameRow.style.marginBottom='4px';
                const nameInput = document.createElement('input');
                nameInput.type='text';
                nameInput.value = skin.name;
                nameInput.style.width='140px';
                nameInput.onchange = function(){
                    for(const key in setup.colours.skin_options){
                        if(key===skin.name) delete setup.colours.skin_options[key];
                    }
                    skin.name = this.value.trim() || `自訂膚色${idx+1}`;
                    pushCustomSkinsToSetup();
                    V.player.skin.color = skin.name;
                    render();
                };
                nameRow.appendChild(nameInput);
                skinBlock.appendChild(nameRow);

                // --- 顏色選擇行 ---
                /*
                // 調用瀏覽器調色盤
                const colorRow = document.createElement('div');
                colorRow.style.marginBottom='4px';
                skin.colors.forEach((color, cidx)=>{
                    const input = document.createElement('input');
                    input.type='color';
                    input.value=color;
                    input.style.marginRight='4px';
                    input.title=color;
                    input.onchange=function(){
                        skin.colors[cidx] = this.value;
                        pushCustomSkinsToSetup();
                        render();
                    };
                    colorRow.appendChild(input);
                });
                */
                
                // 使用Spectrum顏色選擇庫
                const colorRow = document.createElement('div');
                colorRow.style.marginBottom='4px';
                skin.colors.forEach((color, cidx)=>{
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = color;
                    input.style.width = '70px';
                    input.style.marginRight = '4px';                    
                    
                    colorRow.appendChild(input);
                    
                    $(input).spectrum({
                        theme: "sp-dark",
                        color: color,
                        preferredFormat: "hsl",
                        showInput: true,
                        showAlpha: false,
                        showPalette: true,
                        showSelectionPalette: true,
                        maxSelectionSize: 8,                       
                        showPaletteOnly : true, 
                        togglePaletteOnly : true, 
                        togglePaletteMoreText : '更多膚色', 
                        togglePaletteLessText : '收起',
                        chooseText : "選擇", 
                        cancelText : "取消",
                        showInitial : true,
                        clickoutFiresChange: false,
                        palette: setup.getSkinPalette(),
                        change: function(tinycolor){
                            const hex = tinycolor.toHexString();
                            skin.colors[cidx] = hex;

                            sortColorsByLuminance(skin);
                            pushCustomSkinsToSetup();
                            V.player.skin.color = skin.name;
                            refreshSkinSidebar();
                            render();
                        },
                        move: function(tinycolor){
                            const hex = tinycolor.toHexString();
                            skin.colors[cidx] = hex;

                            sortColorsByLuminance(skin);
                            pushCustomSkinsToSetup();
                            V.player.skin.color = skin.name;
                            refreshSkinSidebar();
                            render();
                        },
                    });
                    
                });

                // + / - 顏色按鈕
                if(skin.colors.length<4){
                    const addColorBtn = document.createElement('span');
                    addColorBtn.className='dol-btn';
                    addColorBtn.style.marginRight='4px';
                    addColorBtn.textContent='+顏色';
                    addColorBtn.onclick = function(){
                        skin.colors.push('#ffffff');
                        pushCustomSkinsToSetup();
                        render();
                    };
                    colorRow.appendChild(addColorBtn);
                }
                if(skin.colors.length>2){
                    const delColorBtn = document.createElement('span');
                    delColorBtn.className='dol-btn';
                    delColorBtn.style.marginRight='4px';
                    delColorBtn.textContent='-顏色';
                    delColorBtn.onclick = function(){
                        skin.colors.pop();
                        pushCustomSkinsToSetup();
                        render();
                    };
                    colorRow.appendChild(delColorBtn);
                }

                skinBlock.appendChild(colorRow);

                // --- 效果控制行: 去飽和 + 透明度 ---
                const effectRow = document.createElement('div');
                effectRow.style.marginBottom='4px';
                
                // 去飽和 checkbox
                const desatCheckbox = document.createElement('input');
                desatCheckbox.type='checkbox';
                desatCheckbox.checked = !!skin.desaturate;
                desatCheckbox.style.marginRight='6px';
                desatCheckbox.title='去飽和膚色(仿U0膚色效果)';
                desatCheckbox.onchange = function(){
                    skin.desaturate = this.checked;
                    pushCustomSkinsToSetup();
                };
                effectRow.appendChild(desatCheckbox);
                const desatLabel = document.createElement('span');
                desatLabel.textContent = '去飽和';
                effectRow.appendChild(desatLabel);

                // 透明度滑桿
                const alphaSlider = document.createElement('input');
                alphaSlider.type='range';
                alphaSlider.min=0; alphaSlider.max=1; alphaSlider.step=0.01;
                alphaSlider.value = skin.alpha != null ? skin.alpha : 1;
                alphaSlider.style.marginLeft='12px';
                alphaSlider.title='透明度';
                alphaSlider.oninput=function(){
                    skin.alpha = parseFloat(this.value);
                    pushCustomSkinsToSetup();
                };
                effectRow.appendChild(alphaSlider);
                const alphaLabel = document.createElement('span');
                alphaLabel.textContent = ` ${parseFloat(alphaSlider.value).toFixed(2)}`;
                effectRow.appendChild(alphaLabel);
                alphaSlider.oninput = function(){
                    skin.alpha = parseFloat(this.value);
                    alphaLabel.textContent = ` ${parseFloat(this.value).toFixed(2)}`;
                    pushCustomSkinsToSetup();
                };

                skinBlock.appendChild(effectRow);

                // --- 操作按鈕行: 使用 / 刪除 ---
                const opRow = document.createElement('div');
                opRow.style.marginBottom='2px';
                
                const useBtn = document.createElement('span');
                useBtn.className='dol-btn';
                useBtn.style.marginRight='4px';
                useBtn.textContent='使用';
                useBtn.onclick = function(){                   
                    V.player.skin.color = skin.name;
                    refreshSkinSidebar();
                };
                opRow.appendChild(useBtn);

                const delBtn = document.createElement('span');
                delBtn.className='dol-btn';
                delBtn.textContent='刪除';
                delBtn.onclick = function(){
                    V.customSkin.splice(idx,1);
                    delete setup.colours.skin_options[skin.name];
                    render();
                };
                opRow.appendChild(delBtn);

                skinBlock.appendChild(opRow);

                body.appendChild(skinBlock);
            });

            // 新增自訂膚色按鈕
            const addBtn = document.createElement('div');
            addBtn.className='dol-section-block dol-btn';
            addBtn.style.cursor='pointer';
            addBtn.style.marginTop='6px';
            addBtn.textContent='＋ 新增膚色';
            addBtn.onclick = function(){
                const newSkin = {
                    name:`自訂膚色${V.customSkin.length+1}`,
                    colors:['#fff1e8','#8a5a3c'],
                    desaturate: false,
                    alpha: 1
                };
                V.customSkin.push(newSkin);
                pushCustomSkinsToSetup();
                render();
            };
            body.appendChild(addBtn);
            body.appendChild(document.createElement('br'));

            // ===== 原版膚色區 =====
            const originalSkins = Object.keys(setup.colours.skin_options)
                .filter(name => !V.customSkin.some(s => s.name === name));

            if(originalSkins.length){
                // 折疊容器
                const container = document.createElement('div');
                container.style.marginTop = '12px';

                // 標題 + 摺疊按鈕
                const header = document.createElement('div');
                header.style.fontWeight = 'bold';
                header.style.cursor = 'pointer';
                header.style.userSelect = 'none';
                header.style.marginBottom = '6px';
                header.textContent = '原版膚色 ▸'; // ▸ 收合， ▾ 展開
                container.appendChild(header);

                // 內容區塊
                const content = document.createElement('div');
                content.style.display = 'none'; // 預設摺疊
                container.appendChild(content);

                // 點擊標題切換顯示
                header.onclick = () => {
                    if(content.style.display === 'none'){
                        content.style.display = 'block';
                        header.textContent = '原版膚色 ▾';
                    } else {
                        content.style.display = 'none';
                        header.textContent = '原版膚色 ▸';
                    }
                };

                // 寫入每個膚色
                originalSkins.forEach(name => {
                    const row = document.createElement('div');
                    row.className = 'dol-section-block';
                    row.style.display = 'flex';
                    row.style.alignItems = 'center';
                    row.style.marginBottom = '4px';

                    const label = document.createElement('span');
                    label.style.width = '120px';
                    label.textContent = name;
                    row.appendChild(label);

                    const gradient = setup.colours.skin_options[name].gradient || [];
                    gradient.forEach(color => {
                        const colorBox = document.createElement('div');
                        colorBox.style.width = '20px';
                        colorBox.style.height = '20px';
                        colorBox.style.backgroundColor = color;
                        colorBox.style.border = '1px solid #888';
                        colorBox.style.marginRight = '2px';
                        colorBox.title = color;
                        row.appendChild(colorBox);
                    });

                    const useBtn = document.createElement('span');
                    useBtn.className = 'dol-btn';
                    useBtn.style.marginLeft = '4px';
                    useBtn.textContent = '使用';
                    useBtn.onclick = function(){
                        V.player.skin.color = name;
                        refreshSkinSidebar();
                    };
                    row.appendChild(useBtn);

                    content.appendChild(row);
                });

                body.appendChild(container);
            }
        }

        render();
        self.output.append(container);
    },
});

CE_TabManager.register({
    id: 'skinCustomManager',
    title: '膚色自定義',
    //condition: () => V.debug
    onClick: () => CE_renderSettings('<<skinCustomManager>>')
});

//針對自定義膚色輸出對應文字
Macro.add('skinColourFallback', {
    handler() {
        const key = V.player?.skin?.color;
        if (!key) return;
        if(!V.customSkin) V.customSkin = [];

        const vanilla = new Set(Object.keys(setup.colours.skin_options)
            .filter(name => !V.customSkin.some(s => s.name === name))
        );
        if (vanilla.has(key)) return;

        const tan = V.player?.skin?.tan ?? 0;
        let colorHex = '#ffffff';

        try {
            const skinOpt = setup.colours.skin_options[key];
            if (skinOpt) {
                colorHex = setup.colours.getSkinRgb(skinOpt, tan / 100);
            }
        } catch (e) { /* fallback */ }

        // 日曬文字
        let tanText = '';
        if (tan >= 80) tanText = '，上面有深深的晒痕';
        else if (tan >= 60) tanText = '，上面有中等程度的晒痕';
        else if (tan >= 30) tanText = '，上面有着晒痕';
        else if (tan >= 10) tanText = '，上面有轻微的晒痕';

        // ===== CSS 加強可讀性 =====
        const style = `
            color: ${colorHex};
            text-shadow:
                1px 1px 2px rgba(0,0,0,0.8),
               -1px 1px 2px rgba(0,0,0,0.8),
                1px -1px 2px rgba(0,0,0,0.8),
               -1px -1px 2px rgba(0,0,0,0.8);
            padding: 0 2px;
            border-radius: 2px;
        `;

        $(this.output).wiki(`<span style="${style}">${key}${tanText}</span>`);
    }
});