// 黑心商店hook
(function(){

    const PATH = "stall_amount";

    function isFeatureEnabled(){
        return V.black_storeswich === 1;
    }

    function isEntryPassage(){
        return V.passage === "Stall";
    }

    function hasStallAmount(){
        return Object.prototype.hasOwnProperty.call(V, PATH);
    }

    function ensureNumeric(){
        if (typeof V[PATH] !== "number") {
            V[PATH] = Number(V[PATH] ?? 0);
        }
    }

    function installStallHook(){
        VarHook.register(PATH, 1, 1, {
            transform(ctx){

                if (V.black_storeswich === 1) {
                    const min = Number(V.black_store_FIX_MIN ?? 0);
                    const max = Number(V.black_store_FIX_MAX ?? min);

                    return random(
                        Math.min(min, max),
                        Math.max(min, max)
                    );
                }

                return ctx.old + ctx.adjustedDiff;
            }
        });

        VarHook.installAll();

        console.log("[Cheat Extended] ✅ stall_amount hook active");
    }

    function uninstallStallHook(){
        setup.CE_stallHookActive = false;
        VarHook.unregister(PATH);

        console.log("[Cheat Extended] ✅ stall_amount hook inactive");
    }

    function checkStallHook(){

        if (!isFeatureEnabled()) {
            uninstallStallHook();
            return;
        }

        if (isEntryPassage()) {
            setup.CE_stallHookActive = true;
        }

        if (!setup.CE_stallHookActive) return;

        if (!hasStallAmount()) {
            uninstallStallHook();
            return;
        }

        ensureNumeric();
        installStallHook();
    }

    $(document).on(":passagerender", function(){
        checkStallHook();
    });

})();