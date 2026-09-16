/*=========================================
 Cheat Extended - 布萊爾售貨機自動補貨
=========================================*/
(function () {
    "use strict";

    function restock() {
        const V = State.variables;
        if (V.CE_vendingRestock !== true) return;
        if (!V.brothelVending || V.brothelVending.status !== "set") return;

        const vending = V.brothelVending;
        let refilled = false;

        if (typeof vending.condoms === "number" && vending.condoms < 200) {
            vending.condoms = 200;
            refilled = true;
        }
        if (typeof vending.lube === "number" && vending.lube < 200) {
            vending.lube = 200;
            refilled = true;
        }

        vending.condomsToRefill = 0;
        vending.lubeToRefill = 0;
        vending.weeksEmpty = 0;

        if (refilled) console.log("[Cheat Extended] 🥤 布萊爾售貨機自動補貨：避孕套／潤滑劑已補滿（200）");
    }

    setup.CE_registerOptions?.([
        {
            type: "checkbox",
            key: "CE_vendingRestock",
            default: false,
            desc: "布萊爾售貨機自動補貨",
            label: "布萊爾售貨機自動補貨",
            tooltip: "售貨機安裝後，每次進入場景自動免費補滿避孕套與潤滑劑至 200，並避免因長期缺貨被收回。",
        },
    ]);

    if (typeof $ === "function") $(document).on(":passagestart", restock);
})();
