new TimeEvent('onSec', 'milk_edit')
    //.Cond(V.milk_releasedswich == 1 && V.milk_max !== V.CE_milk_max || V.milk_volume !== V.CE_milk_volume || V.milk_amount !== V.CE_milk_amoumt) 
    .Action(() => { 
        if ( V.milk_releasedswich == 1 && (V.milk_max !== V.CE_milk_max || V.milk_volume !== V.CE_milk_volume)) { 
            V.milk_max = V.CE_milk_max;
            V.milk_volume = V.CE_milk_volume;
          //  V.milk_amount = V.CE_milk_amount; // 修正拼寫錯誤 "amoumt" -> "amount"
        }
    });

/*new TimeEvent('onSec', 'auto_clothes_Warmth')
    .Action(() => { 
        if ( V.swich_auto_clothes_Warmth == 1) { 
            
        }
    });
        
        
/* <<if $milk_max != $CE_milk_max or $milk_volume != $CE_milk_volume or $milk_amount != $CE_milk_amount>>
        <<set $milk_max to $CE_milk_max>>
        <<set $milk_volume to $CE_milk_volume>>
        <<set $milk_amount to $CE_milk_amount>>
<</if>>   */ 
