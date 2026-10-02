/*=========================================
 Head Mask Compatibility

 功能：
 修正新版 Head Mask 對舊版頭部服裝模組造成的顯示異常。

 模式：
 vanilla：使用原版 Head Mask(原版遊戲0.5.10.12或以上)
 compat ：僅保留手持物遮罩（推薦，兼容模式，保留兩個版本间不衝突的特性）
 off    ：完全停用 Head Mask(原版遊戲0.5.8.10或以下)
=========================================*/

(function () {
    "use strict";

    // 預設模式（只在第一次建立存檔變數時設定）
    V.CE_HeadMaskMode ??= "compat";

    function headMaskOnlyHandheld(options) {

        switch (V.CE_HeadMaskMode) {

            // 原版
            case "vanilla":
                return options.headMask;

            // 相容模式：只保留手持物遮罩
            case "compat": {
                const handheld = options.worn?.handheld;

                if (
                    handheld?.setup?.mask_img === 1 &&
                    handheld?.setup?.variable
                ) {
                    return `img/clothes/handheld/${handheld.setup.variable}/mask.png`;
                }

                return null;
            }

            // 完全關閉 Head Mask
            case "off":
                return null;
        }

        // 未知模式時回退原版
        return options.headMask;
    }

    // 覆寫 Head 相關圖層的遮罩來源
    maplebirch.char.use({
        head: { masksrcfn: headMaskOnlyHandheld },
        head_acc: { masksrcfn: headMaskOnlyHandheld },
        head_detail: { masksrcfn: headMaskOnlyHandheld },
        head_back_acc: { masksrcfn: headMaskOnlyHandheld },
        head_back: { masksrcfn: headMaskOnlyHandheld },
    });

})();