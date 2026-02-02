/*
 * ============================================================
 * CE_fixVar
 * ------------------------------------------------------------
 * 用途：
 *   檢查指定的 SugarCube 變數是否符合預期型別，
 *   若不符合（undefined / null / NaN / 型別錯誤），
 *   則自動修正為指定的 fallback 值，並寫回 State。
 *
 * 使用方式（Twee）：
 *   <<CE_fixVar "number" "$plants[_type].amount" 0>>
 *   <<CE_fixVar "string" "$player.name" "">>
 *   <<CE_fixVar "boolean" "$flag" false>>
 *   <<CE_fixVar "array" "$inventory" []>>
 *   <<CE_fixVar "object" "$stats" {}>>
 *
 * 參數說明：
 *   1. expectType（string）
 *      - "number" | "string" | "boolean" | "array" | "object"
 *
 *   2. varPath（string）
 *      - 必須是 SugarCube 變數路徑字串（以 $ 開頭）
 *      - 例如 "$plants[_type].amount"
 *
 *   3. fallback（可選）
 *      - 當修正發生時使用的替代值
 *      - 若未提供，將使用型別的預設安全值
 *
 * 注意：
 *   - 此 Macro 會直接修改 SugarCube State 中的變數
 *   - 若變數不存在，會自動建立
 *   - 修正發生時會輸出 console log 供除錯用
 * ============================================================
 */

Macro.add('CE_fixVar', {
    handler() {
        const expectType = this.args[0];   // 期望型別
        const varPath    = this.args[1];   // "$plants[_type].amount"
        const fallback   = this.args[2];   // 修正時使用的值

        // 第二參數必須是 SugarCube 變數路徑字串
        if (typeof varPath !== 'string' || varPath[0] !== '$') {
            return this.error('CE_fixVar：第二參數必須是變數路徑字串（例如 "$foo.bar"）');
        }

        // 取得目前變數值
        const value = State.getVar(varPath);

        let fixedValue = value;
        let needFix = false;

        switch (expectType) {

            case 'number':
                // undefined / null / NaN 都視為錯誤
                if (value === undefined || value === null || value !== value) {
                    fixedValue = fallback !== undefined ? fallback : 0;
                    needFix = true;
                }
                break;

            case 'string':
                if (value === undefined || value === null) {
                    fixedValue = fallback !== undefined ? fallback : '';
                    needFix = true;
                }
                break;

            case 'boolean':
                if (value !== true && value !== false) {
                    fixedValue = fallback !== undefined ? fallback : false;
                    needFix = true;
                }
                break;

            case 'array':
                if (!Array.isArray(value)) {
                    fixedValue = fallback !== undefined ? fallback : [];
                    needFix = true;
                }
                break;

            case 'object':
                if (value === null || Array.isArray(value) || typeof value !== 'object') {
                    fixedValue = fallback !== undefined ? fallback : {};
                    needFix = true;
                }
                break;

            default:
                return this.error(`CE_fixVar：未知型別 ${expectType}`);
        }

        // 若需要修正，寫回變數（object / array 會 clone）
        if (needFix) {
            let finalValue = fixedValue;

            // 防止 reference 污染
            if (expectType === 'object') {
                finalValue = Object.assign({}, fixedValue);
            }
            if (expectType === 'array') {
                finalValue = fixedValue.slice();
            }

            State.setVar(varPath, finalValue);

            console.log(
                '[cheat Extended] CE_fixVar 修正',
                varPath,
                'from =', value,
                'to =', finalValue
            );
        }
    }
});

/*
Macro: CE_fixNestedVarsBatch
用途：批量檢查與修正巢狀結構變數
說明：
    - 可批量檢查多個變數（包含巢狀索引的變數）
    - 若變數不存在或型別不符合，會自動設定為指定的預設值
    - 預設值可直接傳入，也可為函數動態生成
    - 使用方式：
        <<CE_fixNestedVarsBatch $varsCheck>>
      其中 $varsCheck 例子：
        {
            "$plants[_type].amount": 0,
            "$playerName": "未知",
            "$items[_id].count": idx => 0  // 使用索引動態生成初始值
        }
*/

Macro.add('CE_fixNestedVarsBatch', {
    handler() {
        // 傳入檢查表，若未提供則使用預設值 setup.defaultNestedVars
        const varsToCheck = this.args[0] || setup.defaultNestedVars;
        if (!varsToCheck) return;

        // 遍歷檢查表中的每個變數模板
        Object.keys(varsToCheck).forEach(varTemplate => {
            const fallbackTemplate = varsToCheck[varTemplate];

            // 檢查變數模板中是否包含巢狀索引符號 [xxx]
            const matches = varTemplate.match(/\[([^\]]+)\]/g);

            if (!matches) {
                // 沒有索引的情況，直接使用 CE_fixVar
                let fallback = fallbackTemplate;
                if (typeof fallback === 'function') fallback = fallback(); // 若為函數，執行取得值
                Wikifier.wikifyEval(
                    `<<CE_fixVar "${typeof fallback}" "${varTemplate}" ${JSON.stringify(fallback)}>>`
                );
            } else {
                // 含有索引的情況
                const indexVar = matches[0].slice(1, -1); // 取得索引變數名，如 _type
                const rootVarName = varTemplate.split('[')[0]; // 取得根變數名稱，如 $plants

                // 取得根變數的值
                const rootObj = State.getVar(rootVarName);
                if (!rootObj || typeof rootObj !== 'object') return;

                // 遍歷根變數的每個索引值，生成完整變數路徑
                Object.keys(rootObj).forEach(idx => {
                    const resolvedVarPath = varTemplate.replace(`[${indexVar}]`, `[${idx}]`);

                    // 計算 fallback 值，可依索引生成
                    let fallback = fallbackTemplate;
                    if (typeof fallback === 'function') fallback = fallback(idx);

                    // 執行 CE_fixVar 修正
                    Wikifier.wikifyEval(
                        `<<CE_fixVar "${typeof fallback}" "${resolvedVarPath}" ${JSON.stringify(fallback)}>>`
                    );
                });
            }
        });
    }
});