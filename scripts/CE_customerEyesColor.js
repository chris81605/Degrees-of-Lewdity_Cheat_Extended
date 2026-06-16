/* =========================
   自訂眼睛顏色系統 (DOL Style) - 左右眼版本
   ========================= */

/* -------------------------
    更新模型顯示
    ------------------------- */
function refreshEyesSidebar(useFullRedraw = false, delay = 50) {
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

function pushCustomEyesToSetup(){
    if(!Array.isArray(V.customEye)) return;

    // 只新增尚未存在的自訂眼色
    V.customEye.forEach(e => {
        const idx = setup.colours.eyes.findIndex(eye => eye.variable === e.variable);
        if(idx === -1){
            setup.colours.eyes.push({...e});
        } else {
            // 覆蓋原本物件，但保留 reference key（避免重複）
            setup.colours.eyes[idx] = {...e};
        }
    });
    
    // 原版顏色定義後會執行這段建立setup.colours.eyes_map，供後續使用
    setup.colours.eyes_map = {};
    buildColourMap("eyes");
}

function setPlayerEyeColour(variable, which='both'){
    if(which==='left' || which==='both') V.leftEyeColour = variable;
    if(which==='right' || which==='both') V.rightEyeColour = variable;
    refreshEyesSidebar();
}

function checkCEC() {    
    console.log(`[cheat extended][eyesCustom] 🧾 正在執行瞳色資料檢查……`);
    setup.eyeCustomInit = true; 
} 

Save.onLoad.add(() => checkCEC());

$(document).one(':passageinit', () => { 
    if(V.customEye) checkCEC(); 
});

$(document).on(':passagedisplay', () => {
	if(!setup.eyeCustomInit) return;

	if(Array.isArray(V.customSkin)){	
	    console.log('[cheat extended][eyesCustom] 🔹 初始化自訂瞳色...');	
		pushCustomEyesToSetup();
		delete setup.eyeCustomInit;
	}
});

Macro.add('eyeCustomManager', {
    handler() {
        const container = document.createElement('div');
        container.className = 'dol-settings dol-shadow';
        if(!V.customEye) V.customEye = [];
        // 按鈕文字
        setup.eyeButtonLabels ??= {
            left: '設定左眼',
            right: '設定右眼',
            both: '設定雙眼'        
        };
        const self = this;

        function render() {
            container.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'dol-header';
            header.innerHTML = `<span class="dol-title">自訂眼睛顏色管理器</span>`;
            container.appendChild(header);

            const body = document.createElement('div');
            body.className = 'dol-body';
            container.appendChild(body);

            const desc = document.createElement('div');
            desc.className = 'dol-desc';
            desc.textContent = '管理眼睛顏色，可設定左右眼或雙眼顏色，貓化Pc異色曈自己設定。';
            body.appendChild(desc);
            body.appendChild(document.createElement('br'));

            

            /* ==== 自訂眼色列表 ==== */
            V.customEye.forEach((eye, idx)=>{
                const eyeBlock = document.createElement('div');
                eyeBlock.className='dol-section-block';
                eyeBlock.style.border='2px solid #aaa';  // 外框變寬
                eyeBlock.style.padding='6px';
                eyeBlock.style.marginBottom='8px';

                // 名稱
                const nameInput = document.createElement('input');
                nameInput.type='text';
                nameInput.value=eye.name;
                nameInput.style.width='140px';
                nameInput.onchange = function(){
                    eye.name=this.value.trim()||`自訂眼色${idx+1}`;
                    eye.name_cap=eye.name;
                    pushCustomEyesToSetup();
                    render();
                };
                eyeBlock.appendChild(nameInput);

                // 顏色選擇
                const colorInput=document.createElement('input');
                colorInput.type='text';
                colorInput.value=eye.canvasfilter?.blend||'#ffffff';
                colorInput.style.width='70px';
                eyeBlock.appendChild(colorInput);

                $(colorInput).spectrum({
                    theme: "sp-dark",
                    chooseText : "選擇", 
                    cancelText : "取消",
                    color: colorInput.value,
                    preferredFormat: "hsl",
                    showInput: true,
                    showPalette: true,
                    showSelectionPalette: true,
                    maxSelectionSize: 8,
                    palette: V.customEye.map(e=>[e.canvasfilter?.blend||'#ffffff']),
                    change: function(tc){
                        eye.canvasfilter = eye.canvasfilter||{};
                        eye.canvasfilter.blend=tc.toHexString();
                        pushCustomEyesToSetup();
                    }
                });

                // natural 勾選
                const naturalCheckbox=document.createElement('input');
                naturalCheckbox.type='checkbox';
                naturalCheckbox.checked=!!eye.natural;
                naturalCheckbox.onchange=function(){
                    eye.natural=this.checked;
                    pushCustomEyesToSetup();
                    render();
                };
                eyeBlock.appendChild(naturalCheckbox);
                const naturalLabel=document.createElement('span');
                naturalLabel.textContent=' natural ';
                eyeBlock.appendChild(naturalLabel);

                // lens 勾選
                const lensCheckbox=document.createElement('input');
                lensCheckbox.type='checkbox';
                lensCheckbox.checked=!!eye.lens;
                lensCheckbox.onchange=function(){
                    eye.lens=this.checked;
                    pushCustomEyesToSetup();
                    render();
                };
                eyeBlock.appendChild(lensCheckbox);
                const lensLabel=document.createElement('span');
                lensLabel.textContent=' lens';
                eyeBlock.appendChild(lensLabel);

                // 換行
                eyeBlock.appendChild(document.createElement('br'));
                
                // brightness slider
                const brightSlider = document.createElement('input');
                brightSlider.type = 'range';
                brightSlider.min = -1;
                brightSlider.max = 1;
                brightSlider.step = 0.1;
                brightSlider.value = eye.canvasfilter?.brightness ?? 0;
                brightSlider.style.marginLeft = '12px';
                brightSlider.oninput = function() {
                    eye.canvasfilter = eye.canvasfilter || {};
                    eye.canvasfilter.brightness = parseFloat(this.value);
                    pushCustomEyesToSetup();
                };
                eyeBlock.appendChild(brightSlider);
                
                eyeBlock.appendChild(document.createElement('br'));
                
                // 按鈕
                ['left','right','both'].forEach(side=>{
                    const btn=document.createElement('span');
                    btn.className='dol-btn';
                    btn.style.margin='2px';
                    btn.textContent = setup.eyeButtonLabels[side] || side;
                    btn.onclick=()=>setPlayerEyeColour(eye.variable, side);
                    eyeBlock.appendChild(btn);
                });

                // 刪除
                const delBtn=document.createElement('span');
                delBtn.className='dol-btn';
                delBtn.style.margin='2px';
                delBtn.textContent='刪除';
                delBtn.onclick = () => {
                    const removed = V.customEye.splice(idx, 1)[0];

                    // 更新 setup.colours.eyes
                    setup.colours.eyes = setup.colours.eyes.filter(e => e.variable !== removed.variable);

                    // 如果正在使用，切換到 fallback
                    if (V.leftEyeColour === removed.variable || V.rightEyeColour === removed.variable) {
                        const fallback = setup.colours.eyes.filter(e => !V.customEye.some(c => c.variable === e.variable));
                        const randomEye = fallback[Math.floor(Math.random() * fallback.length)];
                        if (V.leftEyeColour === removed.variable) V.leftEyeColour = randomEye.variable;
                        if (V.rightEyeColour === removed.variable) V.rightEyeColour = randomEye.variable;
                    }

                    // 重新建立 map
                    setup.colours.eyes_map = {};
                    buildColourMap("eyes");
                    
                    refreshEyesSidebar();

                    render();
                };
                eyeBlock.appendChild(delBtn);

                body.appendChild(eyeBlock);
            });

            // 新增眼色
            const addBtn=document.createElement('div');
            addBtn.className='dol-section-block dol-btn';
            addBtn.style.cursor='pointer';
            addBtn.style.marginTop='6px';
            addBtn.textContent='＋ 新增眼色';
            addBtn.onclick=()=>{
                const id=V.customEye.length+1;
                V.customEye.push({
                    variable:`eye${id}`,
                    name:`自訂眼色${id}`,
                    name_cap:`自訂眼色${id}`,
                    csstext:`eye${id}`,
                    natural:true,
                    lens:true,
                    canvasfilter:{blend:'#00ff00'}
                });
                pushCustomEyesToSetup();
                render();
            };
            body.appendChild(addBtn);
            
            /* ==== 顯示原版眼色（摺疊） ==== */
            const defaultEyes = setup.colours.eyes.filter(e => 
                !V.customEye.some(c => c.variable === e.variable)
            );

            if (defaultEyes.length) {
                const details = document.createElement('details');
                details.style.marginTop = '12px';
                details.style.marginBottom = '6px';
    
                // summary
                const summary = document.createElement('summary');
                summary.textContent = '原版眼睛顏色（點擊展開）';
                summary.style.fontWeight = 'bold';
                summary.style.cursor = 'pointer';
                summary.style.marginBottom = '4px';
                details.appendChild(summary);

                // 內部列表
                const innerDiv = document.createElement('div');
                innerDiv.style.display = 'flex';
                innerDiv.style.flexWrap = 'wrap';
                innerDiv.style.gap = '4px'; // 每個按鈕間隔
                innerDiv.style.marginTop = '4px';

                defaultEyes.forEach(eye => {
                    const row = document.createElement('div');
                    row.className = 'dol-section-block';
                    row.style.display = 'flex';
                    row.style.alignItems = 'center';
                    row.style.marginBottom = '4px';
                    row.style.flexWrap = 'wrap';

                    // 色塊
                    const colorBox = document.createElement('div');
                    colorBox.style.width = '20px';
                    colorBox.style.height = '20px';
                    colorBox.style.backgroundColor = eye.canvasfilter?.blend || '#ffffff';
                    colorBox.style.border = '1px solid #888';
                    colorBox.style.marginRight = '4px';
                    colorBox.title = eye.name;
                    row.appendChild(colorBox);

                    // 名稱
                    const label = document.createElement('span');
                    label.textContent = eye.name;
                    label.style.marginRight = '8px';
                    row.appendChild(label);

                    // 左右眼 / 雙眼按鈕
                    ['left','right','both'].forEach(side => {
                        const btn = document.createElement('span');
                        btn.className = 'dol-btn';
                        btn.style.margin = '2px';
                        btn.textContent = setup.eyeButtonLabels[side] || side;
                        btn.onclick = () => setPlayerEyeColour(eye.variable, side);
                            row.appendChild(btn);
                    });

                    innerDiv.appendChild(row);
                });

                details.appendChild(innerDiv);
                body.appendChild(details);
            }
        }

        render();
        self.output.append(container);
    }
});

/* 註冊 Tab */
CE_TabManager.register({
    id:'eyeCustomManager',
    title:'眼色自定義',
    onClick:()=>CE_renderSettings('<<eyeCustomManager>>')
});

/* 自訂眼色文字輸出(hook函數) */

/* =========================
   Hook buildEyeDetails 顯示顏色（無背景）
   ========================= */
(function(){
    const originalBuildEyeDetails = window.buildEyeDetails;

    window.buildEyeDetails = function(){
        let sentence = "";
        let concatFlag = false;
        const lenses = V.makeup.eyelenses || {};
        const colourMap = setup.colours.eyes_map || {};

        // 隱形眼鏡部分
        if (lenses.right || lenses.left) {
            if (typeof lenses.left === "string") {
                const leftL = colourMap[lenses.left];
                sentence += leftL ? leftL.name : lenses.left;
                concatFlag = true;
            }
            if (typeof lenses.right === "string" && lenses.left !== lenses.right) {
                if (concatFlag) sentence += "和";
                const rightL = colourMap[lenses.right];
                sentence += rightL ? rightL.name : lenses.right;
                concatFlag = true;
            }
            if (concatFlag) sentence += "的隐形眼镜";
            sentence += "盖住你的";
        } else {
            sentence += "你有着";
        }
        concatFlag = false;

        const leftEye = colourMap[V.leftEyeColour] || {};
        const rightEye = colourMap[V.rightEyeColour] || {};

        function colourSpan(eye){
            const blend = eye.canvasfilter?.blend || '#ffffff';
            const brightness = eye.canvasfilter?.brightness ?? 0;
            const color = adjustBrightness(blend, brightness);

            return `<span style="
                color:${color};
                padding:0 2px;
                border-radius:2px;
                text-shadow:
                    1px 1px 2px rgba(0,0,0,0.6),
                   -1px 1px 2px rgba(0,0,0,0.6),
                    1px -1px 2px rgba(0,0,0,0.6),
                   -1px -1px 2px rgba(0,0,0,0.6);
            ">${eye.name || eye.variable}</span>`;
        }

        let leftText = colourSpan(leftEye);
        let rightText = (V.leftEyeColour !== V.rightEyeColour) ? colourSpan(rightEye) : '';
        if (rightText) sentence += leftText + "和" + rightText + "的眼睛";
        else sentence += leftText + "的眼睛";

        return sentence + "。";
    };

    function adjustBrightness(hex, amount){
        const rgb = hexToRgb(hex);
        const r = clamp(rgb.r * (1 + amount), 0, 255);
        const g = clamp(rgb.g * (1 + amount), 0, 255);
        const b = clamp(rgb.b * (1 + amount), 0, 255);
        return `rgb(${r},${g},${b})`;
    }

    function hexToRgb(hex){
        hex = hex.replace('#','');
        if(hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
        const bigint = parseInt(hex,16);
        return { r:(bigint>>16)&255, g:(bigint>>8)&255, b:bigint&255 };
    }

    function clamp(value, min, max){ return Math.min(Math.max(value,min),max); }
})();