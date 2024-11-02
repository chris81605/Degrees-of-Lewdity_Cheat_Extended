new TimeEvent('onSec', 'milk_edit')
    //.Cond(V.milk_releasedswich == 1 && V.milk_max !== V.CE_milk_max || V.milk_volume !== V.CE_milk_volume || V.milk_amount !== V.CE_milk_amoumt) 
    .Action(() => { 
        if ( V.milk_releasedswich == 1 && (V.milk_max !== V.CE_milk_max || V.milk_volume !== V.CE_milk_volume)) { 
            V.milk_max = V.CE_milk_max;
            V.milk_volume = V.CE_milk_volume;
          //  V.milk_amount = V.CE_milk_amount; // 修正拼寫錯誤 "amoumt" -> "amount"
        }
    });


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
        baseInsulation = 200;
        console.log('作弊拓展-自動恆溫：出現低溫null，保暖值直接拉給他爆' ,temp); 
      }

      Weather.tempSettings.baseInsulation = baseInsulation;
    }
  });
        
        
/* <<if $milk_max != $CE_milk_max or $milk_volume != $CE_milk_volume or $milk_amount != $CE_milk_amount>>
        <<set $milk_max to $CE_milk_max>>
        <<set $milk_volume to $CE_milk_volume>>
        <<set $milk_amount to $CE_milk_amount>>
<</if>>   */ 
