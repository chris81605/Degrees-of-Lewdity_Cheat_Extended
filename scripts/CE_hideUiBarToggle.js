// 隱藏特寫頭上的箭頭按鈕/溫度計
/*
$(document).on(":passageend",() => {
    if (V.CE_hideUiBarToggleEnable === true) {
        $("#ui-bar-toggle").hide();
    } else {
        $("#ui-bar-toggle").show();
    }
});
*/
$(document).on(":passagedisplay", () => {
    setTimeout(() => {
        const show = !V.CE_hideUiBarToggleEnable;
        const ids = [
            "#ui-bar-toggle",
            "#characterTemperature",
            "#pepper-sprays",
            "#condoms-sidebar",
            "#condoms-sidebar-text"
        ];
        $(ids.join(",")).toggle(show);
    }, 100); // 延時 100ms，可視情況調整
});

//隱藏cheat Extended 於狀態欄的操作介面
$(document).on(":passageend", () => {
    const toggleEnabled = V.CE_hideCEToggleDisable === true;
    $("#CE_Toggle").toggle(!toggleEnabled);
    $("#CEstatebox").toggle(!toggleEnabled);
    
});