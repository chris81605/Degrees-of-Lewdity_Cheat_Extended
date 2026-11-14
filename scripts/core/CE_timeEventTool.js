// CE 共用時間事件註冊工具（MapleBirch）
// 僅封裝事件註冊，不介入事件內容或自行管理生命週期。
function registerCE_genericTimeEvent(eventType, eventName, callback) {
    const api = window.maplebirch?.dynamic?.regTimeEvent;
    if (typeof api !== 'function') {
        console.error(`[Cheat Extended] MapleBirch 時間事件 API 不可用: ${eventName} (${eventType})`);
        return;
    }
    api.call(window.maplebirch.dynamic, eventType, eventName, {
        action: callback,
        priority: 0,
        once: false
    });
    console.log(`[Cheat Extended] MapleBirch 已註冊事件: ${eventName} (${eventType})`);
}
window.registerCE_genericTimeEvent = registerCE_genericTimeEvent;
