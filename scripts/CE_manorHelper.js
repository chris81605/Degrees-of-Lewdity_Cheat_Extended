/*=========================================
 Cheat Extended - 艾弗里莊園自動管家
=========================================*/
(function () {
    "use strict";

    const ROOMS = ["lounge", "kitchen", "dining", "display", "bedroom", "bathroom", "garden", "pool"];

    function cleanNow() {
        const V = State.variables;
        if (!V.avery_mansion || typeof V.avery_mansion !== "object") return 0;

        let dirty = 0;
        ROOMS.forEach(room => {
            if (typeof V.avery_mansion[room] === "number" && V.avery_mansion[room] > 0) dirty++;
            V.avery_mansion[room] = 0;
        });
        return dirty;
    }

    function run() {
        const V = State.variables;
        if (V.CE_manorClean !== true) return;
        const dirty = cleanNow();
        if (dirty > 0) console.log(`[Cheat Extended] 🏰 艾弗里莊園自動打掃：清理 ${dirty} 個房間`);
    }

    setup.CE_ManorHelper = {
        rooms: ROOMS.slice(),
        cleanNow,
    };

    if (typeof $ === "function") $(document).on(":passagestart", run);
})();
