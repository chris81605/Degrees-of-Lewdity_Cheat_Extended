/* =========================================================
 * Time Travel Adapter
 * 對齊 MapleBirch / Simple Framework 兩種時間旅行函數
 * ========================================================= */
const TimeTravelAdapter = (() => {

    const LOG_PREFIX = '[cheat Extended][timeTrevel] ⏱️';

    // 判斷遊戲是否有 Simple Framework
    const hasSimpleFramework =
        !!window.modUtils?.getAnyModByNameNoAlias?.('Simple Frameworks');

    console.info(
        `${LOG_PREFIX} Adapter 初始化，框架模式：`,
        hasSimpleFramework ? 'Simple Framework' : 'MapleBirch'
    );

    /* =====================================================
     * travelAbsolute
     * 將目標絕對時間傳給 MapleBirch 或 Simple Framework
     * ===================================================== */
    function travelAbsolute({ year, month, day, hour, minute, second }) {

        console.info(
            `${LOG_PREFIX} 絕對時間請求`,
            { year, month, day, hour, minute, second }
        );

        if (!hasSimpleFramework) {
            // MapleBirch / DoL 原生呼叫
            maplebirch.state.timeTravel({ year, month, day, hour, minute, second });
            Engine.play(V.passage);
            return;
        }

        // ===== Simple Framework 精準計算 =====
        const curr = new Date(Time.year, Time.month - 1, Time.monthDay, Time.hour, Time.minute, Time.second);
        const target = new Date(year, month - 1, day, hour, minute, second);

        // 判斷是向前還是向後時間旅行
        let backward = target < curr;
        let start = backward ? target : curr;
        let end = backward ? curr : target;

        // 初始化當前日期
        let y = start.getFullYear();
        let m = start.getMonth();
        let d = start.getDate();
        let h = start.getHours();
        let min = start.getMinutes();
        let s = start.getSeconds();

        let years = 0, months = 0;

        // 計算年份差
        while (new Date(y + 1, m, d, h, min, s) <= end) {
            y++;
            years++;
        }

        // 計算月份差
        while (new Date(y, m + 1, d, h, min, s) <= end) {
            m++;
            months++;
            if (m > 11) { 
                m = 0; 
                y++; // 處理跨年
            }
        }

        // 計算剩餘天/時/分/秒
        let tempDate = new Date(y, m, d, h, min, s);
        let diffMs = end - tempDate;

        let days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        diffMs -= days * 1000 * 60 * 60 * 24;

        let hours = Math.floor(diffMs / (1000 * 60 * 60));
        diffMs -= hours * 1000 * 60 * 60;

        let minutes = Math.floor(diffMs / (1000 * 60));
        diffMs -= minutes * 1000 * 60;

        let seconds = Math.floor(diffMs / 1000);

        const payload = { year: years, month: months, day: days, hour: hours, min: minutes, sec: seconds };

        console.info(`${LOG_PREFIX} Simple Framework 精準時間呼叫`, { payload, backward });

        // 呼叫 Simple Framework 的時間旅行
        TimeHandle.timeTravel(payload, backward);
        Engine.play(V.passage);
    }

    /* =====================================================
     * travelRelative
     * 直接使用相對時間（增減年/月/日/時/分/秒）
     * ===================================================== */
    function travelRelative(opts) {

        console.info(`${LOG_PREFIX} 相對時間請求`, opts);

        if (!hasSimpleFramework) {
            // MapleBirch 直接傳入
            maplebirch.state.timeTravel(opts);
            Engine.play(V.passage);
            return;
        }

        // Simple Framework：判斷是否有負值，決定 backward
        const backward = Object.values(opts).some(v => Number(v) < 0);

        // 組裝正數 payload，Simple Framework 只接受正數
        const payload = {
            year:  Math.abs(Number(opts.addYears)  || 0),
            month: Math.abs(Number(opts.addMonths) || 0),
            day:   Math.abs(Number(opts.addDays)   || 0),
            hour:  Math.abs(Number(opts.addHours)  || 0),
            min:   Math.abs(Number(opts.addMinutes)|| 0)
        };

        console.info(`${LOG_PREFIX} Simple Framework 相對時間呼叫`, { payload, backward });

        TimeHandle.timeTravel(payload, backward);
        Engine.play(V.passage);
    }

    return {
        absolute: travelAbsolute,
        relative: travelRelative
    };
})();

/* =========================================================
 * createTimeTravelUI
 * 建立時空穿越的完整 UI，回傳各區塊 DOM
 * ========================================================= */
function createTimeTravelUI() {
    const container = document.createElement('div');
    container.className = 'dol-settings dol-shadow';

    // 標題區
    const header = document.createElement('div');
    header.className = 'dol-header';
    header.innerHTML = '<span class="dol-title gold">時空穿越</span>';
    container.appendChild(header);

    // 主體內容
    const body = document.createElement('div');
    body.className = 'dol-body';
    container.appendChild(body);

    // 今天/昨天/明天快捷按鈕區
    const quickDayDiv = document.createElement('div');
    quickDayDiv.style.display = 'flex';
    quickDayDiv.style.flexWrap = 'wrap';
    quickDayDiv.style.gap = '0.5em';
    quickDayDiv.style.marginBottom = '1em';
    body.appendChild(quickDayDiv);

    // 快速小時跳轉按鈕區
    const quickHourDiv = document.createElement('div');
    quickHourDiv.style.display = 'flex';
    quickHourDiv.style.flexWrap = 'wrap';
    quickHourDiv.style.gap = '0.3em';
    quickHourDiv.style.marginBottom = '1em';
    body.appendChild(quickHourDiv);

    // 精準時間說明
    const exactDesc = document.createElement('div');
    exactDesc.className = 'dol-desc';
    exactDesc.textContent = '直接輸入目標時間進行時間旅行：';
    body.appendChild(exactDesc);

    // 精準時間輸入區
    const targetDiv = document.createElement('div');
    targetDiv.style.display = 'flex';
    targetDiv.style.flexWrap = 'wrap';
    targetDiv.style.gap = '0.5em';
    targetDiv.style.marginBottom = '0.5em';
    body.appendChild(targetDiv);

    // 區塊分隔線
    const hr = document.createElement('hr');
    hr.style.margin = '1em 0';
    body.appendChild(hr);

    // 相對時間說明
    const relativeDesc = document.createElement('div');
    relativeDesc.className = 'dol-desc';
    relativeDesc.textContent = '相對時間增減（可輸入正負數）：';
    body.appendChild(relativeDesc);

    // 相對時間輸入區
    const relativeDiv = document.createElement('div');
    relativeDiv.style.display = 'flex';
    relativeDiv.style.flexWrap = 'wrap';
    relativeDiv.style.gap = '0.5em';
    relativeDiv.style.marginBottom = '0.5em';
    body.appendChild(relativeDiv);

    return {
        container,
        body,
        quickDayDiv,
        quickHourDiv,
        targetDiv,
        relativeDiv
    };
}

/* =========================================================
 * jumpToDay
 * 根據偏移量跳轉日期（昨天/今天/明天）
 * ========================================================= */
function jumpToDay(offset = 0) {
    let y = Time.year;
    let m = Time.month;
    let d = Time.monthDay + offset;
    let h = Time.hour;
    let mi = Time.minute;
    let s = Time.second;

    // 每月天數（含閏年）
    const daysInMonth = [
        31,
        (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0) ? 29 : 28,
        31,30,31,30,31,31,30,31,30,31
    ];

    // 跨月修正
    if (d < 1) { m -= 1; if (m < 1) { m = 12; y -= 1; } d = daysInMonth[m - 1]; }
    else if (d > daysInMonth[m - 1]) { d = 1; m += 1; if (m > 12) { m = 1; y += 1; } }

    TimeTravelAdapter.absolute({ year: y, month: m, day: d, hour: h, minute: mi, second: s });
}

/* =========================================================
 * jumpToHour
 * 快速跳轉到指定小時
 * ========================================================= */
function jumpToHour(hour) {
    TimeTravelAdapter.absolute({ year: Time.year, month: Time.month, day: Time.monthDay, hour, minute: 0, second: 0 });
    Engine.play(V.passage);
}

/* =========================================================
 * jumpToExactTime
 * 精準跳轉到指定時間
 * ========================================================= */
function jumpToExactTime(y, m, d, h, mi, s) {
    TimeTravelAdapter.absolute({ year: y, month: m, day: d, hour: h, minute: mi, second: s });
}

/* =========================================================
 * addRelativeTime
 * 執行相對時間增減
 * ========================================================= */
function addRelativeTime(opts) {
    TimeTravelAdapter.relative(opts);    
}

/* =========================================================
 * Macro：CE_TimeTravelPlus
 * 組裝 UI 並掛事件
 * ========================================================= */
Macro.add('CE_TimeTravelPlus', {
    handler() {
        // 建立 UI 區塊
        const ui = createTimeTravelUI();

        // 今天 / 昨天 / 明天按鈕
        ['昨天','今天','明天'].forEach((label,i)=>{
            const btn = document.createElement('button');
            btn.className = 'dol-btn';
            btn.textContent = label;
            btn.onclick = () => jumpToDay(i-1);
            ui.quickDayDiv.appendChild(btn);
        });

        // 小時快速跳轉按鈕
        const buttons = [];
        for(let h=0; h<=23; h++){
            const btn = document.createElement('button');
            btn.className = 'dol-btn';
            btn.textContent = `${h}點`;
            btn.onclick = () => jumpToHour(h);
            ui.quickHourDiv.appendChild(btn);
            buttons.push(btn);
        }

        // 統一按鈕寬度
        requestAnimationFrame(()=>{
            let maxWidth=0;
            buttons.forEach(btn=>{ const w=btn.getBoundingClientRect().width; if(w>maxWidth) maxWidth=w; });
            buttons.forEach(btn=>btn.style.width=maxWidth+'px');
        });

        // 精準時間輸入欄位
        const fields = ['年','月','日','時','分','秒'];
        const ids = ['tt-year','tt-month','tt-day','tt-hour','tt-minute','tt-second'];
        const defaults = [Time.year,Time.month,Time.monthDay,Time.hour,Time.minute,Time.second];
        fields.forEach((label,i)=>{
            const l=document.createElement('label');
            l.textContent = label+': ';
            const input=document.createElement('input');
            input.type='number'; input.id=ids[i]; input.value=defaults[i]; input.style.width='3em';
            l.appendChild(input);
            ui.targetDiv.appendChild(l);
        });

        // 精準跳轉按鈕
        const btnJump=document.createElement('button');
        btnJump.className='dol-btn'; btnJump.textContent='跳轉到指定時間';
        btnJump.onclick=()=>{
            const vals = ids.map(id=>parseInt(document.getElementById(id).value));
            jumpToExactTime(...vals);
        };
        ui.targetDiv.appendChild(btnJump);

        // 相對時間輸入欄位（英文 id 對應框架）
        const relIds=['addYears','addMonths','addDays','addHours','addMinutes','addSeconds'];
        const relLabels=['增加年','增加月','增加天','增加時','增加分','增加秒'];
        relIds.forEach((id,i)=>{
            const l=document.createElement('label'); l.textContent=relLabels[i]+': ';
            const input=document.createElement('input'); input.type='number'; input.id=id; input.value=0; input.style.width='3em';
            l.appendChild(input); ui.relativeDiv.appendChild(l);
        });

        // 相對時間執行按鈕
        const btnRel=document.createElement('button');
        btnRel.className='dol-btn'; btnRel.textContent='增減時間';
        btnRel.onclick=()=>{
            const opts={};
            relIds.forEach(id=>{
                const v=parseInt(document.getElementById(id).value);
                if(!isNaN(v) && v!==0) opts[id]=v;
            });
            addRelativeTime(opts);
        };
        ui.relativeDiv.appendChild(btnRel);

        // 將整個 UI 放入 passage
        this.output.appendChild(ui.container);
    }
});