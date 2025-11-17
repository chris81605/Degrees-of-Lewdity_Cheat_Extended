/*new TimeEvent('onSec', 'milk_edit')
    //.Cond(V.milk_releasedswich == 1 && V.milk_max !== V.CE_milk_max || V.milk_volume !== V.CE_milk_volume || V.milk_amount !== V.CE_milk_amoumt) 
    .Action(() => { 
        if ( V.milk_releasedswich == 1 && (V.milk_max !== V.CE_milk_max || V.milk_volume !== V.CE_milk_volume)) { 
            V.milk_max = V.CE_milk_max;
            V.milk_volume = V.CE_milk_volume;
          //  V.milk_amount = V.CE_milk_amount; // 修正拼寫錯誤 "amoumt" -> "amount"
        }
    });*/

/*
new TimeEvent('onSec', 'auto_clothes_Warmth')
  .Action(() => {
    if (V.swich_auto_clothes_Warmth === 1) {
      const minWarmth = getTargetWarmth(36.5); // 獲取原版舒適溫度下限
      const maxWarmth = getTargetWarmth(37.5); // 獲取原版舒適溫度上限
      let baseInsulation = 0;
      let temp;

      if (minWarmth !== null && maxWarmth !== null) {
        const currentWarmth = Weather.BodyTemperature.getWarmth();

        if (currentWarmth <= minWarmth) {
          temp = minWarmth - currentWarmth;
          baseInsulation = temp + 1;
          console.log('作弊拓展-自動恆溫：當前修正值' ,temp);
        } else if (currentWarmth >= maxWarmth) {
          temp = maxWarmth - currentWarmth;
          baseInsulation = temp - 1;
          console.log('作弊拓展-自動恆溫：當前修正值' ,temp);
        } else {
          // baseInsulation = 0;
          console.log('作弊拓展-自動恆溫：現在正在溫度範圍內無須調整' ,temp);
        }
      } else {
        baseInsulation = 20;
        console.log('作弊拓展-自動恆溫：出現低溫null，保暖值直接拉給他爆' ,temp); 
      }

      Weather.tempSettings.baseInsulation = baseInsulation;
    }
  });
*/

// 1. 定義自動恆溫邏輯
function autoWarmthAction() {
    if (V.swich_auto_clothes_Warmth !== 1) return;

    const minWarmth = getTargetWarmth(36.5);
    const maxWarmth = getTargetWarmth(37.5);
    let baseInsulation = 0;
    let temp;

    if (minWarmth !== null && maxWarmth !== null) {
        const currentWarmth = Weather.BodyTemperature.getWarmth();

        if (currentWarmth <= minWarmth) {
            temp = minWarmth - currentWarmth;
            baseInsulation = temp + 1;
            console.log('作弊拓展-自動恆溫：當前修正值', temp);
        } else if (currentWarmth >= maxWarmth) {
            temp = maxWarmth - currentWarmth;
            baseInsulation = temp - 1;
            console.log('作弊拓展-自動恆溫：當前修正值', temp);
        } else {
            console.log('作弊拓展-自動恆溫：在溫度範圍內無須調整', temp);
        }
    } else {
        baseInsulation = 20;
        console.log('作弊拓展-自動恆溫：出現低溫null，保暖值直接拉爆', temp);
    }

    Weather.tempSettings.baseInsulation = baseInsulation;
}
window.autoWarmthAction = autoWarmthAction;

// 2. 註冊事件（已移除框架初始化驗證）
function registerAutoClothesWarmth() {
    const logger = window.modUtils.getLogger();
    const maplebirchMod = window.modUtils.getMod('maplebirch');
    const simpleMod = window.modUtils.getMod('Simple Frameworks');

    if (maplebirchMod) {
        maplebirchFrameworks.addTimeEvent('onSec', 'auto_clothes_Warmth', {
            action: ()=>autoWarmthAction(),
            priority: 0,
            once: false,
            //accumulate: { unit: 'sec', target: 1 },
        });
        logger.log('[Cheat Extended] Maplebirch 已註冊自動恆溫事件');
    } else if (simpleMod) {
        new TimeEvent('onSec', 'auto_clothes_Warmth').Action(()=>autoWarmthAction());
        logger.log('[Cheat Extended] Simple Frameworks 已註冊自動恆溫事件');
    } else {
        logger.error('[Cheat Extended] 未檢測到 Maplebirch 或 Simple Frameworks，無法註冊自動恆溫事件');
    }
}

// 3. 初始化
registerAutoClothesWarmth();