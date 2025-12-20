// 隱藏特寫頭上的箭頭按鈕
/*
$(document).on(":passageend",() => {
    if (V.CE_hideUiBarToggleEnable === true) {
        $("#ui-bar-toggle").hide();
    } else {
        $("#ui-bar-toggle").show();
    }
});
*/
$(document).on(":passageend", () => {
    const toggleEnabled = V.CE_hideUiBarToggleEnable === true;
    $("#ui-bar-toggle").toggle(!toggleEnabled);
});

//隱藏cheat Extended 於狀態欄的操作介面
$(document).on(":passageend", () => {
    const toggleEnabled = V.CE_hideCEToggleDisable === true;
    $("#CE_Toggle").toggle(!toggleEnabled);
    $("#CEstatebox").toggle(!toggleEnabled);
    
});