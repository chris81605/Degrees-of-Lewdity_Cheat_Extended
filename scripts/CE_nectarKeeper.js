// registerCE_genericTimeEvent定義於CE_Time_Event.js
// boot.json本腳本需放置於CE_Time_Event.js下放避免錯誤
// 功能：蜜飲者特質鎖定，不用天天找花蜜喝了

registerCE_genericTimeEvent('onDay', 'CE_蜜飲者特質鎖定', () => {
    // 初始化控制變量，避免 undefined
    if (V.CE_nectarKeeperEnabled === undefined) V.CE_nectarKeeperEnabled = false;
    
    // 邏輯=>功能啟用則每日蜜飲者timer+1(剛好與每日-1互相抵消達到鎖定目的)
    const toggle = V.CE_nectarKeeperEnabled;
    
    // 確認特質存在，不存在直接返回
    if (!V.backgroundTraits.includes("plantlover")) return;
    // 確認對應變數存在，且是類型正確
    V.nectar_timer = Number.isFinite(V.nectar_timer) ? V.nectar_timer : 0;    
   
    if (toggle) {
        V.nectar_timer ++;  
        V.nectar_timer = Math.max(0, V.nectar_timer);      
    }   
});