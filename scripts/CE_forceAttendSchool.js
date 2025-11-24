///////////////////////////////////
//每日自動簽到並填滿進度//
////////////////////////////////
// 1.定義用功學習邏輯

function CE_forceAttendSchool() {
    if (!V.daily || !V.daily.school) return;
    if (V.CE_forceAttendSchool === undefined) V.CE_forceAttendSchool = 0;
    if (V.CE_forceAttendSchool === 0) return;
    // 確保變數存在（遊戲重設為 {} 是正常）
    if (!V.daily.school.attended) V.daily.school.attended = {};
    // 設定科目已出席
    V.daily.school.attended.science  = 1;
    V.daily.school.attended.english  = 1;
    V.daily.school.attended.history  = 1;
    V.daily.school.attended.swimming = 1;
    V.daily.school.attended.housekeeping = 1;
    V.daily.school.attended.maths = 1;
    // maths / housekeeping（數學家政兩科目互斥，週二及周四數學課替換為家政課）
    if ([3, 5].includes(Time.weekDay)) {        
        delete V.daily.school.attended.maths;
    } else {        
        delete V.daily.school.attended.housekeeping;
    }
    //設定達成每日學習目標以增加對應技能
    V.science_star = 3;
    V.maths_star = 3;
    V.english_star = 3;
    V.history_star = 3;
    //設定考試成功率
    V.science_exam = 120;
    V.maths_exam = 120;
    V.english_exam = 120;
    V.history_exam = 120;
}
window.CE_forceAttendSchool = CE_forceAttendSchool;

// 2.註冊框架時間事件

function registerCE_forceAttendSchool() {
    const logger = window.modUtils.getLogger();
    const maplebirchMod = window.modUtils.getMod('maplebirch');
    const simpleMod = window.modUtils.getMod('Simple Frameworks');

    if (maplebirchMod) {
        maplebirchFrameworks.addTimeEvent('onDay', 'CE_forceAttendSchool', {
            action: ()=>CE_forceAttendSchool(),
            priority: 0,
            once: false,
            //accumulate: { unit: 'sec', target: 1 },
        });
        logger.log('[Cheat Extended] Maplebirch 已註冊用功學習事件');
    } else if (simpleMod) {
        new TimeEvent('onDay', 'CE_forceAttendSchool').Action(()=>CE_forceAttendSchool());
        logger.log('[Cheat Extended] Simple Frameworks 已註冊用功學習');
    } else {
        logger.error('[Cheat Extended] 未檢測到 Maplebirch 或 Simple Frameworks，無法註冊用功學習事件');
    }
}
// 3. 初始化
registerCE_forceAttendSchool();

///////////////////////////////////
//一鍵考試通過機率120% //
////////////////////////////////
Macro.add('cheatAllExams', {
    handler() {
        // 你要控制的四個科目
        const subjects = ["science", "maths", "english", "history"];

        // 全部設為 120
        subjects.forEach(id => {
            State.variables[id + "_exam"] = 120;
        });

        // 更新 UI
        /*
        $(this.output).wiki(
            `<<replace #CE_settingsDiv>><<study_hard_mod>><</replace>>`
        );
        */
    }
});