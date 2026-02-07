/* =========================
   自訂多組膚色系統 (DOL Style)
   ========================= */

// -------------------------
// 工具函式
// -------------------------
function normalizeHexColor(hex){
    if(typeof hex!=='string') return null;
    const m = hex.trim().match(/^#([0-9a-fA-F]{6})$/);
    return m ? `#${m[1].toLowerCase()}` : null;
}

function colorLuminance(hex) {
    hex = normalizeHexColor(hex);
    if(!hex) return 0;
    const r = parseInt(hex.substr(1,2),16);
    const g = parseInt(hex.substr(3,2),16);
    const b = parseInt(hex.substr(5,2),16);
    return 0.2126*r + 0.7152*g + 0.0722*b;
}

function sortColorsByLuminance(skin){
    skin.colors = skin.colors
        .map(normalizeHexColor)
        .filter(Boolean)
        .sort((a,b)=>colorLuminance(b)-colorLuminance(a)); // 從淺到深
}

function refreshSkinSidebar(useFullRedraw = false, delay = 50) {
    setTimeout(() => {
        if (useFullRedraw) {
            Renderer.lastAnimation.stop();
            Renderer.animateLayersAgain();
        } else {
            Renderer.lastAnimation.invalidateCaches();
            Renderer.lastAnimation.redraw();
        }
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
                    render();
                };
                nameRow.appendChild(nameInput);
                skinBlock.appendChild(nameRow);

                // --- 顏色選擇行 ---
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
                .filter(name=>!V.customSkin.some(s=>s.name===name));

            if(originalSkins.length){
                const origHeader = document.createElement('div');
                origHeader.style.fontWeight='bold';
                origHeader.style.marginTop='12px';
                origHeader.style.marginBottom='6px';
                origHeader.textContent='原版膚色';
                body.appendChild(origHeader);

                originalSkins.forEach(name=>{
                    const row = document.createElement('div');
                    row.className='dol-section-block';
                    row.style.display='flex';
                    row.style.alignItems='center';
                    row.style.marginBottom='4px';

                    const label = document.createElement('span');
                    label.style.width='120px';
                    label.textContent=name;
                    row.appendChild(label);

                    const gradient = setup.colours.skin_options[name].gradient || [];
                    gradient.forEach(color=>{
                        const colorBox = document.createElement('div');
                        colorBox.style.width='20px';
                        colorBox.style.height='20px';
                        colorBox.style.backgroundColor=color;
                        colorBox.style.border='1px solid #888';
                        colorBox.style.marginRight='2px';
                        colorBox.title=color;
                        row.appendChild(colorBox);
                    });

                    const useBtn = document.createElement('span');
                    useBtn.className='dol-btn';
                    useBtn.style.marginLeft='4px';
                    useBtn.textContent='使用';
                    useBtn.onclick=function(){
                        V.player.skin.color = name;
                        refreshSkinSidebar();
                    };
                    row.appendChild(useBtn);

                    body.appendChild(row);
                });
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
    onClick: () => Wikifier.wikifyEval('<<replace #CE_settingsDiv>><<skinCustomManager>><</replace>>')
});