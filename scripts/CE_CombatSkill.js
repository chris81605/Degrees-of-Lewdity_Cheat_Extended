/* ==========================================================================
 * Combat Skill Framework
 * ==========================================================================
 *
 * 用途：
 *   提供模組戰鬥技能註冊系統。
 *
 * 功能：
 *   1. 註冊 Maplebirch 戰鬥按鈕
 *   2. 在 :passagestart 執行技能效果
 *   3. 在 :passagedisplay 顯示技能訊息
 *   4. 支援複數 NPC 戰鬥
 *   5. 支援同一技能註冊到多個部位
 *   6. 支援各部位獨立顯示條件(actionCond)
 *
 * 技能註冊格式：
 *
 * setup.myModCombatSkill.reg({
 *
 *     id: 'mod.skillId',
 *
 *     // 可註冊多個部位
 *     actionType: [
 *         'leftaction',
 *         'rightaction'
 *     ],
 *
 *     // 各部位額外條件（可選）
 *     actionCond: {
 *         leftaction: () => V.leftarm == 0,
 *         rightaction: () => V.rightarm == 0
 *     },
 *
 *     value: 'modSkillValue',
 *
 *     // 共用條件
 *     cond: () => true,
 *
 *     display: () => '技能名稱',
 *
 *     color: () => 'yellow',
 *
 *     difficulty: () => '技能說明',
 *
 *     order: -20,
 *
 *     effect: setup.myModCombatSkill.effects.someEffect,
 *
 *     message: (ctx) => '技能訊息'
 * });
 *
 * --------------------------------------------------------------------------
 * cond 與 actionCond 的差異
 * --------------------------------------------------------------------------
 *
 * cond：
 *   技能整體條件。
 *
 *   例如：
 *     V.catbuild >= 50
 *     V.orgasmdown < 1
 *
 *   所有 actionType 共用。
 *
 * actionCond：
 *   個別部位條件。
 *
 *   例如：
 *
 *   actionCond: {
 *       leftaction: () => V.leftarm == 0,
 *       rightaction: () => V.rightarm == 0
 *   }
 *
 *   左手被占用時只隱藏左手按鈕，
 *   右手仍可正常顯示。
 *
 * --------------------------------------------------------------------------
 * effect(ctx) 可用資料
 * --------------------------------------------------------------------------
 *
 * ctx.skill
 *   當前技能設定
 *
 * ctx.npc.list
 *   原始 NPCList
 *
 * ctx.npc.valid
 *   有效 NPC 清單
 *
 * ctx.npc.inserted
 *   插入中的 NPC 清單
 *
 * ctx.target.left
 * ctx.target.right
 * ctx.target.feet
 * ctx.target.mouth
 * ctx.target.chest
 * ctx.target.thigh
 * ctx.target.vagina
 * ctx.target.anus
 *
 *   各部位目前目標
 *
 * ctx.targets
 *   本技能實際命中的目標陣列
 *
 * ctx.action.left
 * ctx.action.right
 * ctx.action.feet
 * ctx.action.mouth
 * ctx.action.chest
 * ctx.action.thigh
 * ctx.action.vagina
 * ctx.action.anus
 *
 *   各部位目前動作
 *
 * --------------------------------------------------------------------------
 * 內建工具
 * --------------------------------------------------------------------------
 *
 * setup.myModCombatSkill.hasNpcState(states)
 *
 *   檢查是否有 NPC 處於指定 penis 狀態
 *
 * setup.myModCombatSkill.hasVaginaInsertion()
 *
 *   是否有 NPC 插入陰道
 *
 * setup.myModCombatSkill.hasAnusInsertion()
 *
 *   是否有 NPC 插入肛門
 *
 * setup.myModCombatSkill.hasMouthInsertion()
 *
 *   是否有 NPC 插入口部
 *
 * setup.myModCombatSkill.hasInsertion(types)
 *
 *   檢查是否有 NPC 處於指定 penis 狀態。
 *
 * 常見 penis 狀態：
 *
 * 通用
 * 0
 *  待機狀態
 *
 * 陰道路線
 *
 * vagina
 *   已完成陰道插入
 *
 * vaginadouble
 *   雙重陰道插入
 *
 * vaginaentrance
 *   位於陰道入口
 *
 * vaginaentrancedouble
 *   雙重陰道入口狀態
 *
 * vaginaimminent
 *   即將進入陰道
 *
 * vaginaimminentdouble
 *   即將形成雙重陰道插入
 *
 *
 * 肛門路線
 *
 * anus
 *   已完成肛門插入
 *
 * anusdouble
 *   雙重肛門插入
 *
 * anusentrance
 *   位於肛門入口
 *
 * anusentrancedouble
 *   雙重肛門入口狀態
 *
 * anusimminent
 *   即將進入肛門
 *
 * anusimminentdouble
 *   即將形成雙重肛門插入
 *
 *
 * 口部路線
 *
 * mouth
 *   已插入口部
 *
 * mouthentrance
 *  位於口部入口
 *
 * mouthimminent
 *  即將進入口部
 *
 * 常用組合：
 *
 * 陰道已插入：
 *   ['vagina', 'vaginadouble']
 *
 * 肛門已插入：
 *   ['anus', 'anusdouble']
 *
 * 陰道接觸中：
 *   [
 *     'vaginaimminent',
 *     'vaginaentrance',
 *     'vaginaimminentdouble',
 *     'vaginaentrancedouble'
 *   ]
 *
 * 肛門接觸中：
 *   [
 *     'anusimminent',
 *     'anusentrance',
 *     'anusimminentdouble',
 *     'anusentrancedouble'
 *   ]
 *
 *   範例：
 *
 *   setup.myModCombatSkill.hasInsertion([
 *       'vagina',
 *       'vaginadouble'
 *   ]);
 *
 *   setup.myModCombatSkill.hasInsertion([
 *       'anus',
 *       'anusdouble'
 *   ]);
 *
 *   本函式為 hasNpcState() 的相容包裝。
 *
 *   一般情況建議改用：
 *
 *   hasVaginaInsertion()
 *   hasAnusInsertion()
 *   hasMouthInsertion()
 *
 *   僅在需要自訂狀態組合時使用本函式。
 * ==========================================================================
 */
 
//工具
// 
setup.myModCombatSkill ??= {};
setup.myModCombatSkill.list ??= [];
setup.myModCombatSkill.messageQueue ??= [];
setup.myModCombatSkill.effects ??= {};

// 判斷戰鬥類型(maplebirch 戰鬥類型註冊似乎有問題)
setup.myModCombatSkill.isHumanCombat = function () {
    return (
        V.combat == 1 &&
        Array.isArray(V.NPCList) &&
        V.NPCList.some(npc =>
            npc &&
            npc.active === 'active' &&
            npc.stance !== 'defeated' &&
            npc.health != null
        )
    );
};
setup.myModCombatSkill.isTentacleCombat = function () {
    return (
        V.combat == 1 &&
        V.tentacles &&
        typeof V.tentacles === 'object' &&
        Number(V.tentacles.max || 0) > 0 &&
        Number(V.tentacles.active || 0) > 0                             
    );
};
setup.myModCombatSkill.isVoreCombat = () => false;
setup.myModCombatSkill.isMachineCombat = () => false;
setup.myModCombatSkill.isSwarmCombat = () => false;
setup.myModCombatSkill.isStruggleCombat = () => false;
setup.myModCombatSkill.isSelfCombat = () => false;

setup.myModCombatSkill.isCombatType = function (type) {

    switch (type) {
        case 'Default':
            return setup.myModCombatSkill.isHumanCombat();
        case 'Tentacle':
            return setup.myModCombatSkill.isTentacleCombat();
        case 'Vore':
        case 'Machine':
        case 'Swarm':
        case 'Struggle':
        case 'Self':
            return false;
        default:
            return false;
    }
};

// 顯示技能效果用
setup.myModCombatSkill.tip = function (title, detail) {

    // 只傳一個參數
    if (detail === undefined) {
        return `<mouse class="tooltip linkBlue">(?)<span class="blue">${title}</span></mouse>`;
    }

    // 傳兩個參數
    return `
        ${title}
        <mouse class="tooltip linkBlue">(?)<span class="blue">${detail}</span></mouse>
    `;
};

// 能否使用技能及當前狀態函數
setup.myModCombatSkill.getActionBlockReason = function () {
    
    // 高潮
    if (V.orgasmdown >= 1)
        return 'orgasm';
    
    // 疼痛爆表
    if (
        V.pain >= 100 &&
        V.willpowerpain == 0
    )
        return 'pain';
    
    // 精神崩潰
    if (V.dissociation >= 2)
        return 'dissociation';
    // 失控無法行動
    if (V.panicviolence >= 1)
        return 'panicviolence';
    
    // 失控亂打
    if (V.panicparalysis >= 1)
        return 'panicparalysis';
    
    // 被催眠
    if (V.trance >= 1)
        return 'trance';
    
    // 被附身
    if (V.possessed === true)
        return 'possessed';

    return null;
};

setup.myModCombatSkill.isActionBlocked = function () {
    return setup.myModCombatSkill.getActionBlockReason() !== null;
};

// 插入狀態判斷函式(判斷是否有npc的GG狀態符合傳入的值)
setup.myModCombatSkill.hasNpcState = function (states) {

    if (!Array.isArray(V.NPCList)) {
        return false;
    }

    return V.NPCList.some(npc =>
        npc &&
        states.includes(npc.penis)
    );
};

// 語意糖 判斷是否被插入
setup.myModCombatSkill.hasInsertion = function (types) {
    return setup.myModCombatSkill.hasNpcState(types);
};

// 語意糖 判斷嘴巴是否被插入
setup.myModCombatSkill.hasMouthInsertion = function () {
    return setup.myModCombatSkill.hasNpcState([
        'mouth'
    ]);
};
// 語意糖 判斷小雪是否被插入
setup.myModCombatSkill.hasVaginaInsertion = function () {
    return setup.myModCombatSkill.hasNpcState([
        'vagina',
        'vaginadouble'
    ]);
};
// 語意糖 判斷菊花是否被插入
setup.myModCombatSkill.hasAnusInsertion = function () {
    return setup.myModCombatSkill.hasNpcState([
        'anus',
        'anusdouble'
    ]);
};

// 只能使用一次的技能flag處理
setup.myModCombatSkill.once ??= {};

setup.myModCombatSkill.once.isUsed = function (key) {
    V.myModCombatSkillOnceUsed ??= {};
    return V.myModCombatSkillOnceUsed[key] === true;
};

setup.myModCombatSkill.once.markUsed = function (key) {
    V.myModCombatSkillOnceUsed ??= {};
    V.myModCombatSkillOnceUsed[key] = true;
};

setup.myModCombatSkill.once.reset = function () {
    V.myModCombatSkillOnceUsed = {};
};

$(document).on(':passagestart', function () {
    if (T.combatend) {
        setup.myModCombatSkill.once.reset();
    }
});

// 擊敗處理鏈
// 記錄本次技能造成擊敗的 NPC index
setup.myModCombatSkill.defeatQueue ??= [];

// 記錄造成擊敗時的傷害值
// 用於還原原版 <<defeatnpc>> 所需的 _thedamage
setup.myModCombatSkill.defeatDamageMap ??= {};

// 記錄待擊敗 NPC 及本次造成的傷害
setup.myModCombatSkill.queueDefeatNPC = function (target, damage = 0) {

    // 目標不存在或 NPCList 異常時中止
    if (!target || !Array.isArray(V.NPCList)) return;

    // 取得 NPC 在 NPCList 中的索引
    const index = V.NPCList.indexOf(target);

    // 找不到 NPC 時中止
    if (index < 0) return;

    // 已被擊敗的 NPC 不重複加入佇列
    if (target.stance === 'defeated') return;

    // 累計造成擊敗的傷害
    // 供原版 <<defeatnpc>> 使用 _thedamage
    setup.myModCombatSkill.defeatDamageMap[index] =
        Number(setup.myModCombatSkill.defeatDamageMap[index] || 0) +
        Number(damage || 0);

    // 同一 NPC 僅加入一次
    // 避免重複執行擊敗流程
    if (!setup.myModCombatSkill.defeatQueue.includes(index)) {
        setup.myModCombatSkill.defeatQueue.push(index);
    }
};

// 執行原版 <<defeatnpc>> 流程
setup.myModCombatSkill.defeatNpc = function (index) {

    // 取得 NPC
    const npc = V.NPCList?.[index];

    // NPC 不存在
    if (!npc) return false;

    // 已被擊敗
    if (npc.stance === 'defeated') return false;

    // 生命值尚未歸零
    if (npc.health > 0) return false;

    // 對齊原版 npcdamage 特殊判斷
    if (State.passage === 'Robin Fight Together') return false;

    // 取得造成擊敗時的傷害值
    const damage =
        setup.myModCombatSkill.defeatDamageMap[index] ?? 0;

    // 建立暫存容器接收 <<defeatnpc>> 輸出
    const output = document.createElement('div');

    // 執行原版擊敗流程
    // 並注入原版使用的 _thedamage
    new Wikifier(
        output,
        `<<set _thedamage to ${damage}>><<defeatnpc ${index}>>`
    );

    const html = output.innerHTML.trim();

    // 將原版擊敗訊息加入框架訊息佇列
    if (html) {
        setup.myModCombatSkill.messageQueue.push(html);
    }

    return true;
};

// 統一結算所有待擊敗 NPC
setup.myModCombatSkill.flushDefeatedNPCs = function () {

    const queue = setup.myModCombatSkill.defeatQueue;

    // 沒有待擊敗 NPC
    if (!Array.isArray(queue) || queue.length === 0) {
        return;
    }

    let defeatedAny = false;

    // 依序執行擊敗流程
    queue.forEach(index => {

        if (setup.myModCombatSkill.defeatNpc(index)) {
            defeatedAny = true;
        }

    });

    // 清空本次結算資料
    setup.myModCombatSkill.defeatQueue = [];
    setup.myModCombatSkill.defeatDamageMap = {};

    // 若原版設定了新目標
    // 同步更新所有 target 變數
    if (defeatedAny && V.newtarget !== undefined) {
        new Wikifier(null, '<<setnewtarget>>');
    }

};

// 修改玩家狀態，支援上下限
setup.myModCombatSkill.modPlayerStat = function (key, amount, min = 0, max = Infinity) {
    
    if (V[key] == null) return;
    
    V[key] = Math.max(
        min,
        Math.min(
            max,
            Number(V[key] || 0) + amount
        )
    );
};

// 玩家數值倍率修改
setup.myModCombatSkill.mulPlayerStat = function (
    key,
    rate,
    min = 0,
    max = Infinity
) {
    
    if (V[key] == null) return;
    
    const value = Math.round(
        Number(V[key] || 0) * rate
    );

    V[key] = Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
};

// 對單一 NPC 造成傷害，並同步扣除 V.enemyhealth
setup.myModCombatSkill.damageTarget = function (target, damage) {
    if (!target || target.health == null) return 0;

    const oldHealth = Math.max(0, Number(target.health));
    const newHealth = Math.max(0, oldHealth - Number(damage || 0));
    const actualDamage = oldHealth - newHealth;

    target.health = newHealth;

    if (V.enemyhealth != null) {
        V.enemyhealth = Math.max(
            0,
            Number(V.enemyhealth) - actualDamage
        );
    }
    // 目標生命歸零後放入擊敗序列
    if (target.health <= 0) {
        setup.myModCombatSkill.queueDefeatNPC(target, actualDamage);
    }

    return actualDamage;
};

// 對目標造成最大生命值百分比傷害
setup.myModCombatSkill.damageTargetByMaxHealthPercent = function (target, percent) {
    if (!target || target.health == null) return 0;

    const max = Math.max(
        1,
        Number(target.healthmax || 100)
    );

    const damage = Math.max(
        1,
        Math.round(max * percent)
    );

    return setup.myModCombatSkill.damageTarget(
        target,
        damage
    );
};

// 敵方性奮倍率修改
setup.myModCombatSkill.mulEnemyArousal = function (rate) {

    V.enemyarousal = Math.round(
        Number(V.enemyarousal || 0) * rate
    );

    if (V.enemyarousalmax != null) {
        V.enemyarousal = Math.min(
            Number(V.enemyarousalmax),
            V.enemyarousal
        );
    }
};

// 敵方性奮按最大值百分比增加
setup.myModCombatSkill.addEnemyArousalPercent = function (percent) {
    if (V.enemyarousal == null || V.enemyarousalmax == null) return;

    const gain = Math.round(Number(V.enemyarousalmax) * percent);

    V.enemyarousal = Math.min(
        Number(V.enemyarousalmax),
        Number(V.enemyarousal || 0) + gain
    );
};

// 對敵方共用數值進行修改
setup.myModCombatSkill.modEnemyStat = function (
    key,
    amount,
    min = -Infinity,
    max = Infinity
) {

    const value = Number(V[key] || 0);

    V[key] = Math.max(
        min,
        Math.min(
            max,
            value + amount
        )
    );
};

// 註冊框架

(function () {

    setup.myModCombatSkill ??= {};
    setup.myModCombatSkill.list ??= [];
    setup.myModCombatSkill.messageQueue ??= [];
    setup.myModCombatSkill.effects ??= {};

    const DEBUG = () => V.debug == 1;

    function log(...args) {
        if (DEBUG()) console.log('[myModCombatSkill]', ...args);
    }

    function warn(...args) {
        if (DEBUG()) console.warn('[myModCombatSkill]', ...args);
    }

    /**
     * 取得有效 NPC
     *
     * 過濾：
     * - null
     * - undefined
     * - 沒有 health 的 NPC
     */
    function getValidNPCs() {
        return Array.isArray(V.NPCList)
            ? V.NPCList.filter(npc =>
                npc &&
                npc.health !== undefined &&
                npc.health !== null
            )
            : [];
    }

    /**
     * 在 passage-content 的第一個直屬 div 開頭插入訊息容器
     */
    function insertMessageAtFirstDiv(slotId) {
        const passageContent = document.getElementById('passage-content');

        if (!passageContent) {
            warn('找不到 #passage-content');
            return null;
        }

        const divs = passageContent.querySelectorAll(':scope > div');

        if (!divs[0]) {
            warn('找不到第一個直屬 div');
            return null;
        }

        const targetDiv = divs[0];

        if (targetDiv.querySelector(`#${slotId}`)) {
            warn('slot 已存在', slotId);
            return null;
        }

        const container = document.createElement('div');
        container.className = 'my-mod-combat-skill-message-container';

        const slot = document.createElement('div');
        slot.id = slotId;

        container.appendChild(slot);
        targetDiv.insertBefore(container, targetDiv.firstChild);

        return slot;
    }

    /**
     * 註冊戰鬥技能
     */
    setup.myModCombatSkill.reg = function (...skills) {
        skills.forEach(skill => {
            if (!skill || !skill.id || !skill.value) {
                warn('技能註冊失敗：缺少 id 或 value', skill);
                return;
            }

            setup.myModCombatSkill.list.push(skill);

            const actionTypes = Array.isArray(skill.actionType)
                ? skill.actionType
                : [skill.actionType];

            const getDifficulty = () => {
                const text =
                    typeof skill.difficulty === 'function'
                        ? skill.difficulty()
                        : (skill.difficulty ?? '');

                return text
                    ? setup.myModCombatSkill.tip(text)
                    : '';
            };

            actionTypes.forEach(type => {
                maplebirch.combat.CombatAction.reg({
                    id: `${skill.id}.${type}`,

                    actionType: [type],

                    cond: () => {
                        // 預設(Default)技能僅在人類戰鬥中顯示
                        // 若目前不是人類戰（如觸手、吞噬、機械等特殊戰鬥）
                        // 則直接隱藏此技能按鈕
                        // Maplebirch框架戰鬥類型註冊疑似有問題不能正常顯示
                        const combatType =
                            skill.combatType ?? 'Default';
                        if (
                            !setup.myModCombatSkill.isCombatType(combatType)
                        ) {
                            return false;
                        }
                        
                        // 部位專屬條件
                        // 例如左右手共用同一技能時，可額外限制某個部位是否顯示
                        const partCond = skill.actionCond?.[type];

                        if (
                            typeof partCond === 'function' &&
                            !partCond()
                        ) {
                            return false;
                        }
                        
                        // 技能本身條件
                        // 回傳 false 時不顯示按鈕
                        return typeof skill.cond === 'function'
                            ? skill.cond()
                            : true;
                    },

                    display: skill.display,

                    value: () => skill.value,

                    color: skill.color ?? (() => 'white'),

                    difficulty: getDifficulty,

                    combatType: skill.combatType ?? 'Default',

                    order: skill.order ?? -4
                });
            });

            log('技能已註冊', skill.id);
        });
    };

    /**
     * 處理已選擇的技能
     *
     * 執行時機：
     *   :passagestart
     */
    function processSkills() {
        setup.myModCombatSkill.list.forEach(skill => {

            const actionTypeMap = {
                leftaction: V.leftaction,
                rightaction: V.rightaction,
                feetaction: V.feetaction,
                mouthaction: V.mouthaction,
                chestaction: V.chestaction,
                thighaction: V.thighaction,
                vaginaaction: V.vaginaaction,
                anusaction: V.anusaction
            };
            
            const selected =
                Array.isArray(skill.actionType) &&
                skill.actionType.some(type =>
                    actionTypeMap[type] === skill.value
                );

            if (!selected) return;

            try {
                const validNPCs = getValidNPCs();

                const actionMap = {
                    left: V.leftaction,
                    right: V.rightaction,

                    feet: V.feetaction,
                    mouth: V.mouthaction,

                    chest: V.chestaction,
                    thigh: V.thighaction,

                    vagina: V.vaginaaction,
                    anus: V.anusaction
                };

                const targetMap = {
                    left: validNPCs[V.lefttarget],
                    right: validNPCs[V.righttarget],

                    feet: validNPCs[V.feettarget],
                    mouth: validNPCs[V.mouthtarget],

                    chest: validNPCs[V.chesttarget],
                    thigh: validNPCs[V.thightarget],

                    vagina: validNPCs[V.vaginatarget],
                    anus: validNPCs[V.anustarget]
                };

                const targets = [];

                Object.entries(actionMap).forEach(([part, action]) => {
                    if (action !== skill.value) return;

                    const target = targetMap[part];

                    if (target) {
                        targets.push(target);
                    }
                });

                const ctx = {
                    skill,

                    npc: {
                        list: V.NPCList ?? [],
                        valid: validNPCs,

                        inserted: validNPCs.filter(npc =>
                            npc &&
                            (
                                npc.penis === 'vagina' ||
                                npc.penis === 'vaginadouble' ||
                                npc.penis === 'anus' ||
                                npc.penis === 'anusdouble'
                            )
                        )
                    },

                    action: actionMap,
                    target: targetMap,

                    // 本技能實際命中的目標
                    targets
                };

                if (typeof skill.effect === 'function') {
                    skill.effect(ctx);
                }
                                
                if (skill.message) {
                    setup.myModCombatSkill.messageQueue.push(
                        typeof skill.message === 'function'
                            ? skill.message(ctx)
                            : skill.message
                    );
                }
                
                // 處理擊敗事件
                setup.myModCombatSkill.flushDefeatedNPCs();

                log('技能已執行', skill.id);

            } catch (e) {
                warn('技能執行失敗', skill.id, e);
            }
        });
    }

    /**
     * 顯示技能訊息
     *
     * 執行時機：
     *   :passagedisplay
     */
    function displayMessages() {
        const queue = setup.myModCombatSkill.messageQueue;

        if (!Array.isArray(queue) || queue.length === 0) return;

        const slot = insertMessageAtFirstDiv('myModCombatSkillMessageSlot');

        if (!slot) return;

        queue.forEach(message => {
            new Wikifier(
                slot,
                `<div class="my-mod-combat-skill-message">${message}</div>`
            );
        });

        setup.myModCombatSkill.messageQueue = [];
    }

    $(document).on(':passagestart', function () {        
        processSkills();
    });

    $(document).on(':passagedisplay', function () {
        displayMessages();
    });

})();

/* ==========================================================================
 * Skill Effects
 * ========================================================================== */

//天使轉化
//聖光
setup.myModCombatSkill.effects.holyLight = function (ctx) {

    const validNPCs = ctx.npc.valid;

    function damageByCurrentHealth(target) {
        if (!target) return 0;
        if (target.health === undefined || target.health === null) return 0;

        const oldHealth = Math.max(0, Number(target.health));
        if (oldHealth <= 0) return 0;

        const damage = Math.max(1, Math.round(oldHealth / 3));
        const newHealth = Math.max(0, oldHealth - damage);
        const actualDamage = oldHealth - newHealth;

        target.health = newHealth;

        return actualDamage;
    }

    // 複數 NPC：逐個扣 NPC health，再同步總血量
    if (validNPCs.length > 1) {
        const totalDamage = validNPCs.reduce((sum, npc) => {
            return sum + damageByCurrentHealth(npc);
        }, 0);

        if (V.enemyhealth !== undefined && V.enemyhealth !== null) {
            V.enemyhealth = Math.max(0, Number(V.enemyhealth) - totalDamage);
        }
    }

    // 單一敵人：以 enemyhealth 為主
    else if (
        V.enemyhealth !== undefined &&
        V.enemyhealth !== null
    ) {
        const oldHealth = Math.max(0, Number(V.enemyhealth));

        if (oldHealth > 0) {
            const damage = Math.max(1, Math.round(oldHealth / 3));
            const newHealth = Math.max(0, oldHealth - damage);
            const actualDamage = oldHealth - newHealth;

            V.enemyhealth = newHealth;

            // 如果有 NPC 物件，也同步它
            const npc = validNPCs[0];
            if (npc && npc.health !== undefined && npc.health !== null) {
                npc.health = Math.max(0, Number(npc.health) - actualDamage);
            }
        }
    }
    
    setup.myModCombatSkill.modEnemyStat('enemyanger', 40, 0, Number(V.enemyangermax || 100));

    setup.myModCombatSkill.modEnemyStat('enemytrust', -40, 0);

    // 消耗一次聖光
    V.angelBanish = Math.max(0, Number(V.angelBanish || 0) - 1);
};

// 聖療
setup.myModCombatSkill.effects.holyHeal = function () {
    setup.myModCombatSkill.modPlayerStat('pain', -20, 0, 200);
    setup.myModCombatSkill.modPlayerStat('stress', -500, 0, 10000);
    setup.myModCombatSkill.modPlayerStat('trauma', -50, 0, 5000);
    setup.myModCombatSkill.modPlayerStat('control', 100, 0, 1000);
};

// 神聖治癒
setup.myModCombatSkill.effects.holyRestoration = function () {
    V.angelBanish = Math.max(0, Number(V.angelBanish || 0) - 1);

    setup.myModCombatSkill.modPlayerStat('pain', -50, 0, 200);
    setup.myModCombatSkill.modPlayerStat('stress', -1500, 0, 10000);
    setup.myModCombatSkill.modPlayerStat('trauma', -150, 0, 5000);
    setup.myModCombatSkill.modPlayerStat('tiredness', -300, 0, 2000);
    setup.myModCombatSkill.modPlayerStat('arousal', -1500, 0, 10000);
    setup.myModCombatSkill.modPlayerStat('control', 250, 0, 1000);
    setup.myModCombatSkill.modPlayerStat('drunk', -200, 0, 1000);
    setup.myModCombatSkill.modPlayerStat('drugged', -200, 0, 1000);
    setup.myModCombatSkill.modPlayerStat('hallucinogen', -200, 0, 1000);
};

// 祈禱
setup.myModCombatSkill.effects.angelPray = function (ctx) {

    setup.myModCombatSkill.once.markUsed('angelPray');

    // 恢復聖光
    V.angelBanish = Math.min(
        Number(V.angelBanishMax || 1),
        Number(V.angelBanish || 0) + 1
    );

    // 清空雙方性奮
    V.arousal = 0;
    V.enemyarousal = 0;

    // 敵方恢復生命
    ctx.npc.valid.forEach(target => {

        if (!target || target.health == null) {
            return;
        }

        const maxHealth = Math.max(
            1,
            Number(target.healthmax || 100)
        );

        const heal = Math.max(
            1,
            Math.round(maxHealth * 0.05)
        );

        target.health = Math.min(
            maxHealth,
            Number(target.health) + heal
        );

        if (V.enemyhealth != null) {
            V.enemyhealth = Math.min(
                Number(V.enemyhealthmax || Infinity),
                Number(V.enemyhealth) + heal
            );
        }
    });

    // 恢復自身狀態
    setup.myModCombatSkill.modPlayerStat('pain', -20, 0, 200);

    setup.myModCombatSkill.modPlayerStat('stress', -500, 0, 10000);

    setup.myModCombatSkill.modPlayerStat('trauma', -50, 0, 5000);

    setup.myModCombatSkill.modPlayerStat('control', 100, 0, 1000);
};

// 神聖屏障
setup.myModCombatSkill.effects.angelBarrier = function (ctx) {

    setup.myModCombatSkill.once.markUsed('angelBarrier');

    ctx.angelBarrierTargets = [];

    const npcRetreatMap = {
        vaginaimminent: 'vaginaentrance',
        vaginaentrance: 0,

        vaginaimminentdouble: 'vaginaentrancedouble',
        vaginaentrancedouble: 0,

        anusimminent: 'anusentrance',
        anusentrance: 0,

        anusimminentdouble: 'anusentrancedouble',
        anusentrancedouble: 0
    };

    const pcRetreatMap = {
        imminent: 'entrance',
        entrance: 0,
        doubleimminent: 'doubleentrance',
        doubleentrance: 0
    };

    let touchedVagina = false;
    let touchedAnus = false;

    (ctx.npc?.valid ?? []).forEach(npc => {

        if (!npc || !npc.penis) return;

        const oldState = npc.penis;

        if (!(oldState in npcRetreatMap)) return;

        npc.penis = npcRetreatMap[oldState];

        if (oldState.startsWith('vagina')) {
            touchedVagina = true;
        }

        if (oldState.startsWith('anus')) {
            touchedAnus = true;
        }

        ctx.angelBarrierTargets.push(
            npc.fullDescription ?? '對方'
        );
    });

    if (touchedVagina) {
        V.vaginastate = pcRetreatMap[V.vaginastate] ?? V.vaginastate;
    }

    if (touchedAnus) {
        V.anusstate = pcRetreatMap[V.anusstate] ?? V.anusstate;
    }

    V.angelBanish = Math.max(
        0,
        Number(V.angelBanish || 0) - 1
    );
    
    setup.myModCombatSkill.modEnemyStat('enemyanger', 50, 0, Number(V.enemyangermax || 100));
    setup.myModCombatSkill.modEnemyStat('enemytrust', -40, 0);

    setup.myModCombatSkill.modPlayerStat('arousal', -500, 0, 10000);
    setup.myModCombatSkill.modPlayerStat('control', 100, 0, 1000);    
};

/* ==========================================================================
 * 天使觸手戰
 * ========================================================================== */

// 工具： 

// 天使高性奮施法判定
setup.myModCombatSkill.checkAngelTentacleSkill = function (ctx) {

    const arousal = Number(V.arousal || 0);

    // 8000以下完全不受影響
    if (arousal < 8000) {
        ctx.angelSkillRoll = null;
        ctx.angelSkillSuccessRate = 100;
        ctx.angelSkillFailed = false;
    return true;
    }

    let successRate;

    if (arousal >= 9500) {
        successRate = 35;
    }
    else if (arousal >= 9000) {
        successRate = 60;
    }
    else {
        successRate = 80;
    }

    const roll = random(1, 100);

    ctx.angelSkillRoll = roll;
    ctx.angelSkillSuccessRate = successRate;
    ctx.angelSkillFailed = roll > successRate;

    return !ctx.angelSkillFailed;
};

// 觸手瀕臨插入狀態判定
setup.myModCombatSkill.hasTentacleEntranceThreat = function () {

    if (!V.tentacles || !Number(V.tentacles.max || 0)) {
        return false;
    }

    for (let i = 0; i < V.tentacles.max; i++) {

        const tentacle = V.tentacles[i];

        if (!tentacle) continue;

        if ([
            'vaginaentrance',
            'vaginaimminent',
            'anusentrance',
            'anusimminent',
            'mouthentrance',
            'mouthimminent'
        ].includes(tentacle.head)) {
            return true;
        }
    }

    return false;
};

// 清理本次選擇的技能，避免失敗後卡住
setup.myModCombatSkill.clearSelectedAction = function (ctx) {

    if (ctx.action.left === ctx.skill.value) {
        V.leftaction = 0;
        V.leftactiondefault = 'rest';
    }

    if (ctx.action.right === ctx.skill.value) {
        V.rightaction = 0;
        V.rightactiondefault = 'rest';
    }

    if (ctx.action.mouth === ctx.skill.value) {
        V.mouthaction = 0;
        V.mouthactiondefault = 'rest';
    }

    if (ctx.action.vagina === ctx.skill.value) {
        V.vaginaaction = 'rest';
    }

    if (ctx.action.anus === ctx.skill.value) {
        V.anusaction = 'rest';
    }
};

// 清理本次被推開部位的殘留 action
setup.myModCombatSkill.clearReleasedTentacleActions = function (releasedParts) {

    if (!(releasedParts instanceof Set)) return;

    if (releasedParts.has('vagina')) V.vaginaaction = 'rest';
    if (releasedParts.has('anus')) V.anusaction = 'rest';
    if (releasedParts.has('mouth')) V.mouthaction = 'rest';
};

// 取得目前使用此技能的手，所指定的觸手與索引
setup.myModCombatSkill.getSelectedTentacleInfoByAction = function (ctx) {

    let targetId = null;

    if (ctx.action.left === ctx.skill.value) {
        targetId = V.leftactionTarget;
    }

    if (ctx.action.right === ctx.skill.value) {
        targetId = V.rightactionTarget;
    }

    if (!targetId || !V.tentacles) return null;

    for (let i = 0; i < V.tentacles.max; i++) {
        const tentacle = V.tentacles[i];
        if (!tentacle) continue;

        if (tentacle.id === targetId) {
            return {
                index: i,
                tentacle
            };
        }
    }

    return null;
};

// 取得聖痕層數
setup.myModCombatSkill.getHolyMarkStacks = function (tentacle) {
    return Math.max(
        0,
        Number(tentacle?.myModHolyMarkStacks || 0)
    );
};

// 增加聖痕層數
setup.myModCombatSkill.addHolyMarkStacks = function (tentacle, amount = 1, max = 3) {
    if (!tentacle) return 0;

    tentacle.myModHolyMarkStacks = Math.min(
        max,
        setup.myModCombatSkill.getHolyMarkStacks(tentacle) + amount
    );

    return tentacle.myModHolyMarkStacks;
};

// 套用聖痕加成傷害
setup.myModCombatSkill.applyHolyMarkDamage = function (tentacle, baseDamage) {

    let damage = Number(baseDamage || 0);
    const stacks = setup.myModCombatSkill.getHolyMarkStacks(tentacle);

    if (stacks > 0) {
        damage = Math.round(damage + (stacks * 3));
        delete tentacle.myModHolyMarkStacks;
    }

    return Math.max(1, damage);
};


/* ==========================================================================
 * 天使觸手戰效果
 * ========================================================================== */

// 聖潔庇護：不受高性奮判定影響
setup.myModCombatSkill.effects.pushAwayTentacle = function (ctx) {

    const released = [];
    const releasedParts = new Set();

    function pushReleased(tentacle, partName, partKey) {
        released.push({
            part: partName,
            name: tentacle.fullDesc ?? '觸手',
            id: tentacle.id
        });

        releasedParts.add(partKey);
    }

    for (let i = 0; i < V.tentacles.max; i++) {

        const tentacle = V.tentacles[i];
        if (!tentacle) continue;

        switch (tentacle.head) {

            case 'vaginaentrance':
            case 'vaginaimminent':
                tentacle.head = 0;

                if (
                    V.vaginastate === 'tentacleentrance' ||
                    V.vaginastate === 'tentacleimminent'
                ) {
                    V.vaginastate = 0;
                    V.vaginause = 0;
                }

                pushReleased(tentacle, '小穴', 'vagina');
                break;

            case 'anusentrance':
            case 'anusimminent':
                tentacle.head = 0;

                if (
                    V.anusstate === 'tentacleentrance' ||
                    V.anusstate === 'tentacleimminent'
                ) {
                    V.anusstate = 0;
                    V.anususe = 0;
                }

                pushReleased(tentacle, '菊穴', 'anus');
                break;

            case 'mouthentrance':
            case 'mouthimminent':
                tentacle.head = 0;

                if (
                    V.mouthstate === 'tentacleentrance' ||
                    V.mouthstate === 'tentacleimminent'
                ) {
                    V.mouthstate = 0;
                    V.mouthuse = 0;
                }

                pushReleased(tentacle, '嘴巴', 'mouth');
                break;
        }
    }

    V.angelbuild = Math.max(
        0,
        Number(V.angelbuild || 0) - 1
    );

    setup.myModCombatSkill.clearReleasedTentacleActions(releasedParts);

    ctx.releasedTentacles = released;
};

// 光耀驅邪
setup.myModCombatSkill.effects.banishTentacle = function (ctx) {

    if (!setup.myModCombatSkill.checkAngelTentacleSkill(ctx)) {
        setup.myModCombatSkill.clearSelectedAction(ctx);
    return;
    }

    const info =
        setup.myModCombatSkill.getSelectedTentacleInfoByAction(ctx);

    if (!info) {
        ctx.banishedTentacle = null;
        return;
    }

    const { index, tentacle } = info;

    ctx.banishedTentacle = tentacle.fullDesc ?? '觸手';

    V.angelbuild = Math.max(
        0,
        Number(V.angelbuild || 0) - 5
    );

    new Wikifier(
        null,
        `<<tentacleadvdisable $tentacles[${index}]>>`
    );

    tentacle.shaft = 'finished';
    tentacle.head = 'finished';

    setup.myModCombatSkill.clearSelectedAction(ctx);
};

// 聖痕
setup.myModCombatSkill.effects.holyMarkTentacle = function (ctx) {

    if (!setup.myModCombatSkill.checkAngelTentacleSkill(ctx)) {
        setup.myModCombatSkill.clearSelectedAction(ctx);
    return;
    }

    const info =
        setup.myModCombatSkill.getSelectedTentacleInfoByAction(ctx);

    if (!info) {
        ctx.holyMarkedTentacle = null;
        return;
    }

    const { tentacle } = info;

    V.angelbuild = Math.max(
        0,
        Number(V.angelbuild || 0) - 2
    );

    const oldHealth = Math.max(
        0,
        Number(tentacle.tentaclehealth || 0)
    );

    const damage = Math.max(
        0,
        Math.round(oldHealth * 0.03)
    );

    tentacle.tentaclehealth = Math.max(
        0,
        oldHealth - damage
    );

    new Wikifier(
        null,
        `<<tentacle_record "banish" ${damage}>>`
    );

    const stacks =
        setup.myModCombatSkill.addHolyMarkStacks(tentacle, 1, 3);

    ctx.holyMarkedTentacle = tentacle.fullDesc ?? '觸手';
    ctx.holyMarkDamage = damage;
    ctx.holyMarkStacks = stacks;

    setup.myModCombatSkill.clearSelectedAction(ctx);
};

// 聖裁
setup.myModCombatSkill.effects.holyJudgementTentacle = function (ctx) {

    if (!setup.myModCombatSkill.checkAngelTentacleSkill(ctx)) {
        setup.myModCombatSkill.clearSelectedAction(ctx);
    return;
    }

    const info =
        setup.myModCombatSkill.getSelectedTentacleInfoByAction(ctx);

    if (!info) {
        ctx.holyJudgementTentacle = null;
        return;
    }

    const { index, tentacle } = info;

    ctx.holyJudgementTentacle = tentacle.fullDesc ?? '觸手';

    V.angelbuild = Math.max(
        0,
        Number(V.angelbuild || 0) - 3
    );

    const oldHealth = Math.max(
        0,
        Number(tentacle.tentaclehealth || 0)
    );

    let damage = Math.max(
        1,
        Math.round(oldHealth * 0.6)
    );

    damage = setup.myModCombatSkill.applyHolyMarkDamage(
        tentacle,
        damage
    );

    const actualDamage = Math.min(
        oldHealth,
        damage
    );

    tentacle.tentaclehealth = Math.max(
        0,
        oldHealth - actualDamage
    );

    ctx.holyJudgementDamage = actualDamage;
    ctx.holyJudgementOldHealth = oldHealth;
    ctx.holyJudgementNewHealth = tentacle.tentaclehealth;

    new Wikifier(
        null,
        `<<tentacle_record "banish" ${actualDamage}>>`
    );

    new Wikifier(
        null,
        `<<tentacleadvdisable $tentacles[${index}]>>`
    );

    tentacle.head = 0;
    tentacle.shaft = 0;

    setup.myModCombatSkill.clearSelectedAction(ctx);
};

// 聖光爆發
setup.myModCombatSkill.effects.holyBurstTentacles = function (ctx) {

    if (!setup.myModCombatSkill.checkAngelTentacleSkill(ctx)) {
        setup.myModCombatSkill.clearSelectedAction(ctx);
    return;
    }

    const damaged = [];

    if (!V.tentacles || !Number(V.tentacles.max || 0)) {
        ctx.holyBurstTentacles = [];
        return;
    }

    V.angelbuild = Math.max(
        0,
        Number(V.angelbuild || 0) - 8
    );

    for (let i = 0; i < V.tentacles.max; i++) {

        const tentacle = V.tentacles[i];

        if (!tentacle) continue;
        if (tentacle.shaft === 'finished') continue;
        if (tentacle.head === 'finished') continue;

        const oldHealth = Math.max(
            0,
            Number(tentacle.tentaclehealth || 0)
        );

        let damage = Math.max(
            1,
            Math.round(oldHealth * 0.5)
        );

        damage = setup.myModCombatSkill.applyHolyMarkDamage(
            tentacle,
            damage
        );

        const actualDamage = Math.min(
            oldHealth,
            damage
        );

        tentacle.tentaclehealth = Math.max(
            0,
            oldHealth - actualDamage
        );

        damaged.push(tentacle.fullDesc ?? '觸手');

        new Wikifier(
            null,
            `<<tentacle_record "banish" ${actualDamage}>>`
        );

        new Wikifier(
            null,
            `<<tentacleadvdisable $tentacles[${i}]>>`
        );

        tentacle.head = 0;
        tentacle.shaft = 0;
    }

    ctx.holyBurstTentacles = damaged;

    V.leftaction = 0;
    V.rightaction = 0;
    V.feetaction = 0;
    V.mouthaction = 0;
    V.vaginaaction = 0;
    V.anusaction = 0;

    V.leftactiondefault = 'rest';
    V.rightactiondefault = 'rest';
    V.feetactiondefault = 'rest';
    V.mouthactiondefault = 'rest';
    V.vaginaactiondefault = 'rest';
    V.anusactiondefault = 'rest';
};

// 祈禱：
setup.myModCombatSkill.effects.angelPrayer = function (ctx) {

    const success =
        setup.myModCombatSkill.checkAngelTentacleSkill(ctx);

    const buildRecover =
        success ? 5 : 2;

    const lightRecover =
        success ? 1 : 0;

    V.angelbuild = Math.min(
        100,
        Number(V.angelbuild || 0) + buildRecover
    );

    V.angelBanish = Math.min(
        Number(V.angelBanishMax || 0),
        Number(V.angelBanish || 0) + lightRecover
    );

    ctx.angelPrayerRecover = buildRecover;
    ctx.angelPrayerLightRecover = lightRecover;

    // 祈禱代價
    setup.myModCombatSkill.modPlayerStat(
        'tiredness',
        150,
        0,
        2000
    );

    setup.myModCombatSkill.modPlayerStat(
        'stress',
        200,
        0,
        10000
    );

    V.mouthaction = 0;
    V.mouthactiondefault = 'rest';
};

// 惡魔轉化：
// 淫蝕
setup.myModCombatSkill.effects.demonCorruption = function ({ targets }) {

    targets.forEach(target => {
        setup.myModCombatSkill.damageTargetByMaxHealthPercent(target, 0.03);
    });

    setup.myModCombatSkill.addEnemyArousalPercent(0.15);

    setup.myModCombatSkill.mulPlayerStat('arousal', 1.05, 0, 10000);
};

// 惡魔之觸
setup.myModCombatSkill.effects.demonTouch = function ({ targets }) {

    const damage = Math.max(
        1,
        Math.round(
            Number(V.enemyarousal || 0) * 0.25
        )
    );

    targets.forEach(target => {

        if (!target || target.health == null) return;

        setup.myModCombatSkill.damageTarget(target, damage);
    });

    setup.myModCombatSkill.addEnemyArousalPercent(0.05);
    setup.myModCombatSkill.modEnemyStat('enemyanger', 15, 0, Number(V.enemyangermax || 100));
    setup.myModCombatSkill.modEnemyStat('enemytrust', -15, 0);

    setup.myModCombatSkill.modPlayerStat('arousal', 500, 0, 10000);

    setup.myModCombatSkill.modPlayerStat('control',-50,0, 1000);
};

// 痛苦轉嫁
setup.myModCombatSkill.effects.demonPainTransfer = function (ctx) {

    setup.myModCombatSkill.once.markUsed('demonPainTransfer');

    // 只作用於插入中的有效 NPC
    const insertedTargets = (ctx.npc?.valid ?? []).filter(npc =>
        npc &&
        (
            npc.penis === 'vagina' ||
            npc.penis === 'vaginadouble' ||
            npc.penis === 'anus' ||
            npc.penis === 'anusdouble'
        )
    );

    if (insertedTargets.length === 0) return;

    // 計算可恢復量
    const painRecover = Math.min(Number(V.pain || 0), 180);
    const stressRecover = Math.min(Number(V.stress || 0), 9000);
    const traumaRecover = Math.min(Number(V.trauma || 0), 4500);
    const tirednessRecover = Math.min(Number(V.tiredness || 0), 1800);

    // 將恢復量轉換成傷害
    const totalDamage = Math.max(
        1,
        Math.round(
            painRecover * 1.5 +
            stressRecover / 100 +
            traumaRecover / 50 +
            tirednessRecover / 20
        )
    );
    // 性奮加乘
    if (V.arousal >=8000) totalDamage *= 1.25;

    // 多目標時平均分配傷害
    const damagePerTarget = Math.max(
        1,
        Math.round(totalDamage / insertedTargets.length)
    );

    insertedTargets.forEach(target => {
        setup.myModCombatSkill.damageTarget(
            target,
            damagePerTarget
        );
    });

    // 恢復自身狀態
    setup.myModCombatSkill.modPlayerStat('pain', -painRecover, 0, 200);
    setup.myModCombatSkill.modPlayerStat('stress', -stressRecover, 0, 10000);
    setup.myModCombatSkill.modPlayerStat('trauma', -traumaRecover, 0, 5000);
    setup.myModCombatSkill.modPlayerStat('tiredness', -tirednessRecover, 0, 2000);

    // 副作用：
    setup.myModCombatSkill.modEnemyStat('enemyanger', 50, 0, Number(V.enemyangermax || 100));
    setup.myModCombatSkill.modEnemyStat('enemytrust', -50, 0);
    
    setup.myModCombatSkill.modPlayerStat('arousal', 1800, 0, 10000);

    // 訊息用
    ctx.demonPainTransferTargets = insertedTargets.map(
        npc => npc.fullDescription ?? '對方'
    );
};

// 沉淪
setup.myModCombatSkill.effects.demonCorrupt = function ({ targets }) {

    targets.forEach(target => {

        if (!target || target.health == null) {
            return;
        }

        const damage = Math.max(
            1,
            Math.round(
                Number(target.healthmax || 100) * 0.01
            )
        );

        setup.myModCombatSkill.damageTarget(
            target,
            damage
        );
    });

    // 敵方性奮 +15%
    setup.myModCombatSkill.addEnemyArousalPercent(0.15);

    // 純潔降低
    setup.myModCombatSkill.modPlayerStat('purity',-25, 0, 1000);

    // 自身性奮 +5%
    setup.myModCombatSkill.mulPlayerStat('arousal', 1.05, 0,10000);
};

// 純潔轉傷害
setup.myModCombatSkill.effects.demonPurityDamage = function (ctx) {

    const validNPCs = ctx.npc.valid;

    // 純潔越低，傷害越高
    // purity 1000 = 0 傷害
    // purity 500  = 100 傷害
    // purity 0    = 200 傷害
    const damage = Math.max(
        1,
        Math.round((1000 - Number(V.purity || 0)) / 5)
    );

    validNPCs.forEach(target => {
        setup.myModCombatSkill.damageTarget(target, damage);
    });
    
    setup.myModCombatSkill.modEnemyStat('enemyanger', 40, 0, Number(V.enemyangermax || 100));

    setup.myModCombatSkill.modEnemyStat('enemytrust', -40, 0);

    // 副作用：自身性奮增加
    setup.myModCombatSkill.modPlayerStat('arousal', 1000, 0, 10000);

    // 副作用：自控力下降
    setup.myModCombatSkill.modPlayerStat('control', -100, 0, 1000);
    
};

//貓貓轉化
// 貓爪攻擊
setup.myModCombatSkill.effects.catClaw = function ({ targets }) {
    targets.forEach(target => {
        setup.myModCombatSkill.damageTargetByMaxHealthPercent(target, 0.10);
    });
    setup.myModCombatSkill.modEnemyStat('enemyanger', 10, 0, Number(V.enemyangermax || 100));

    setup.myModCombatSkill.modEnemyStat('enemytrust', -15, 0);
};

// 呼嚕
setup.myModCombatSkill.effects.catPurr = function () {
    setup.myModCombatSkill.modEnemyStat('enemyanger',-8,0);
    setup.myModCombatSkill.modEnemyStat('enemytrust',8);

    setup.myModCombatSkill.modPlayerStat('pain', -20, 0, 200);
    setup.myModCombatSkill.modPlayerStat('stress', -250, 0, 10000);
};

// 舔舐
setup.myModCombatSkill.effects.catLick = function () {
    setup.myModCombatSkill.addEnemyArousalPercent(0.4);
    setup.myModCombatSkill.modPlayerStat('arousal', 300, 0, 10000);

    setup.myModCombatSkill.modEnemyStat('enemytrust', 5);
};

// 理毛
setup.myModCombatSkill.effects.catGroom = function () {
    setup.myModCombatSkill.modPlayerStat('stress', -800, 0, 10000);
    setup.myModCombatSkill.modPlayerStat('tiredness', -200, 0, 2000);
    setup.myModCombatSkill.modPlayerStat('trauma', -50, 0, 5000);
    setup.myModCombatSkill.modPlayerStat('control', 100, 0, 1000);
};

// 發情
setup.myModCombatSkill.effects.catHeat = function () {
    setup.myModCombatSkill.once.markUsed('catHeat');

    setup.myModCombatSkill.addEnemyArousalPercent(0.66);
    setup.myModCombatSkill.modPlayerStat('arousal', 1000, 0, 10000);
    setup.myModCombatSkill.modPlayerStat('control', -100, 0, 1000);
    setup.myModCombatSkill.modEnemyStat('enemytrust', 10);
};

/* ==========================================================================
 * 貓貓觸手戰效果
 * ========================================================================== */

// 工具 技能失敗判定(沿用天使的邏輯)
setup.myModCombatSkill.checkCatTentacleSkill = function (ctx) {
    const success =
        setup.myModCombatSkill.checkAngelTentacleSkill(ctx);

    ctx.catSkillFailed = ctx.angelSkillFailed;

    return success;
};

// 貓爪：指定單一觸手，造成目前生命值 30% 傷害
setup.myModCombatSkill.effects.catClawTentacle = function (ctx) {

    if (!setup.myModCombatSkill.checkCatTentacleSkill(ctx)) {
        setup.myModCombatSkill.clearSelectedAction(ctx);
        return;
    }

    const info =
        setup.myModCombatSkill.getSelectedTentacleInfoByAction(ctx);

    if (!info) {
        ctx.catClawTentacle = null;
        return;
    }

    const { tentacle } = info;

    const oldHealth = Math.max(
        0,
        Number(tentacle.tentaclehealth || 0)
    );

    const damage = Math.max(
        1,
        Math.round(oldHealth * 0.3)
    );

    const actualDamage = Math.min(oldHealth, damage);

    tentacle.tentaclehealth = Math.max(
        0,
        oldHealth - actualDamage
    );

    new Wikifier(
        null,
        `<<tentacle_record "damage" ${actualDamage}>>`
    );

    ctx.catClawTentacle = tentacle.fullDesc ?? '觸手';
    ctx.catClawTentacleDamage = actualDamage;

    setup.myModCombatSkill.clearSelectedAction(ctx);
};

// 呼嚕：舒緩自身，並使所有觸手受到微量干擾
setup.myModCombatSkill.effects.catPurrTentacle = function (ctx) {

    if (!setup.myModCombatSkill.checkCatTentacleSkill(ctx)) {
        V.mouthaction = 0;
        V.mouthactiondefault = 'rest';
        return;
    }

    const soothed = [];

    // 呼嚕讓自己放鬆
    setup.myModCombatSkill.modPlayerStat('stress', -1000, 0, 10000);

    setup.myModCombatSkill.modPlayerStat('pain', -20, 0, 200);

    // 但也會變得更性份
    setup.myModCombatSkill.modPlayerStat('arousal', 200, 0, 10000);

    if (!V.tentacles || !Number(V.tentacles.max || 0)) {
        ctx.catPurrTentacles = [];
        return;
    }

    for (let i = 0; i < V.tentacles.max; i++) {

        const tentacle = V.tentacles[i];

        if (!tentacle) continue;
        if (tentacle.shaft === 'finished') continue;
        if (tentacle.head === 'finished') continue;

        const oldHealth = Math.max(
            0,
            Number(tentacle.tentaclehealth || 0)
        );

        const damage = Math.max(
            1,
            Math.round(oldHealth * 0.08)
        );

        const actualDamage = Math.min(
            oldHealth,
            damage
        );

        tentacle.tentaclehealth = Math.max(
            0,
            oldHealth - actualDamage
        );

        new Wikifier(
            null,
            `<<tentacle_record "soothe" ${actualDamage}>>`
        );

        soothed.push(
            tentacle.fullDesc ?? '觸手'
        );
    }

    ctx.catPurrTentacles = soothed;

    V.mouthaction = 0;
    V.mouthactiondefault = 'rest';
};

// 貓之柔韌：扭身閃避，打斷正在接近入口的觸手
setup.myModCombatSkill.effects.catFlexTentacle = function (ctx) {

    if (!setup.myModCombatSkill.checkCatTentacleSkill(ctx)) {
        setup.myModCombatSkill.clearSelectedAction(ctx);
        return;
    }

    const avoided = [];

    if (!V.tentacles || !Number(V.tentacles.max || 0)) {
        ctx.catFlexTentacles = [];
        return;
    }

    const releasedParts = new Set();

    function resetVagina() {
        V.vaginastate = 0;
        V.vaginause = 0;
        releasedParts.add('vagina');
    }

    function resetAnus() {
        V.anusstate = 0;
        V.anususe = 0;
        releasedParts.add('anus');
    }

    function resetMouth() {
        V.mouthstate = 0;
        V.mouthuse = 0;
        releasedParts.add('mouth');
    }

    for (let i = 0; i < V.tentacles.max; i++) {

        const tentacle = V.tentacles[i];

        if (!tentacle) continue;
        if (tentacle.shaft === 'finished') continue;
        if (tentacle.head === 'finished') continue;

        switch (tentacle.head) {

            case 'vaginaentrance':
            case 'vaginaimminent':
                tentacle.head = 0;
                resetVagina();
                avoided.push(tentacle.fullDesc ?? '觸手');
                break;

            case 'anusentrance':
            case 'anusimminent':
                tentacle.head = 0;
                resetAnus();
                avoided.push(tentacle.fullDesc ?? '觸手');
                break;

            case 'mouthentrance':
            case 'mouthimminent':
                tentacle.head = 0;
                resetMouth();
                avoided.push(tentacle.fullDesc ?? '觸手');
                break;
        }
    }

    setup.myModCombatSkill.modPlayerStat('tiredness',300, 0, 2000);
    setup.myModCombatSkill.modPlayerStat('control', 500, 0, 1000);

    setup.myModCombatSkill.clearReleasedTentacleActions(releasedParts);

    V.feetaction = 0;
    V.feetactiondefault = 'rest';

    ctx.catFlexTentacles = avoided;
};

/* ==========================================================================
 * 惡魔觸手戰工具
 * ========================================================================== */
// 觸手插入狀態判定
setup.myModCombatSkill.hasTentacleState = function (states) {

    if (!V.tentacles) return false;

    for (let i = 0; i < V.tentacles.max; i++) {

        const tentacle = V.tentacles[i];

        if (!tentacle) continue;

        if (states.includes(tentacle.head)) {
            return true;
        }
    }

    return false;
};

setup.myModCombatSkill.hasTentacleVaginaInsertion = function () {
    return setup.myModCombatSkill.hasTentacleState([
        'vagina',
        'vaginadeep'
    ]);
};

setup.myModCombatSkill.hasTentacleAnusInsertion = function () {
    return setup.myModCombatSkill.hasTentacleState([
        'anus',
        'anusdeep'
    ]);
};

setup.myModCombatSkill.hasTentacleMouthInsertion = function () {
    return setup.myModCombatSkill.hasTentacleState([
        'mouth',
        'mouthdeep'
    ]);
};

// 單一觸手是否已插入
setup.myModCombatSkill.isTentacleInserted = function (tentacle) {
    if (!tentacle) return false;

    return [
        'vagina',
        'vaginadeep',
        'anus',
        'anusdeep',
        'mouth',
        'mouthdeep'
    ].includes(tentacle.head);
};

// 判斷是否有任一觸手插入
setup.myModCombatSkill.hasTentacleInsertion = function () {
    return setup.myModCombatSkill.hasTentacleState([
        'vagina',
        'vaginadeep',
        'anus',
        'anusdeep',
        'mouth',
        'mouthdeep'
    ]);
};

// 取得觸手最大生命值
setup.myModCombatSkill.getTentacleMaxHealth = function (tentacle) {
    return Math.max(
        1,
        Number(
            tentacle?.tentaclehealthstart ??
            tentacle?.tentaclehealth ??
            15
        )
    );
};

// 取得所有可用觸手
setup.myModCombatSkill.getActiveTentacles = function () {
    if (!V.tentacles || !Number(V.tentacles.max || 0)) {
        return [];
    }

    const result = [];

    for (let i = 0; i < V.tentacles.max; i++) {
        const tentacle = V.tentacles[i];

        if (!tentacle) continue;
        if (tentacle.head === 'finished') continue;
        if (tentacle.shaft === 'finished') continue;

        result.push({
            index: i,
            tentacle
        });
    }

    return result;
};

// 取得插入中的觸手
setup.myModCombatSkill.getInsertedTentacles = function () {
    return setup.myModCombatSkill
        .getActiveTentacles()
        .filter(info =>
            setup.myModCombatSkill.isTentacleInserted(info.tentacle)
        );
};

// 取得未插入的觸手
setup.myModCombatSkill.getFreeTentacles = function () {
    return setup.myModCombatSkill
        .getActiveTentacles()
        .filter(info =>
            !setup.myModCombatSkill.isTentacleInserted(info.tentacle)
        );
};

// 是否有已標記且插入中的觸手
setup.myModCombatSkill.hasInsertedDemonMarkedTentacle = function () {
    return setup.myModCombatSkill
        .getInsertedTentacles()
        .some(info =>
            info.tentacle?.myModDemonTentacleMarked === true
        );
};

/* ==========================================================================
 * 惡魔觸手戰效果
 * ========================================================================== */

// 1. 深淵汲取：吸收插入觸手當前生命一半，恢復自身狀態，代價是提升性奮
setup.myModCombatSkill.effects.demonTentacleDrain = function (ctx) {
    const inserted = setup.myModCombatSkill.getInsertedTentacles();

    let totalDrain = 0;
    const names = [];

    inserted.forEach(({ tentacle }) => {
        const oldHealth = Math.max(
            0,
            Number(tentacle.tentaclehealth || 0)
        );

        if (oldHealth <= 0) return;

        const damage = Math.max(
            1,
            Math.round(oldHealth * 0.5)
        );

        const actualDamage = Math.min(oldHealth, damage);

        tentacle.tentaclehealth = Math.max(
            0,
            oldHealth - actualDamage
        );

        totalDrain += actualDamage;
        names.push(tentacle.fullDesc ?? '觸手');

        new Wikifier(
            null,
            `<<tentacle_record "damage" ${actualDamage}>>`
        );
    });

    // 依吸收量恢復自身狀態，除了性奮外
    setup.myModCombatSkill.modPlayerStat('pain', -Math.round(totalDrain * 0.5), 0, 200);
    setup.myModCombatSkill.modPlayerStat('stress', -Math.round(totalDrain * 50), 0, 10000);
    setup.myModCombatSkill.modPlayerStat('trauma', -Math.round(totalDrain * 3), 0, 5000);
    setup.myModCombatSkill.modPlayerStat('tiredness', -Math.round(totalDrain * 10), 0, 2000);
    setup.myModCombatSkill.modPlayerStat('control', Math.round(totalDrain * 5), 0, 1000);

    // 代價：提升自身性奮
    setup.myModCombatSkill.modPlayerStat('arousal', 2500, 0, 10000);

    ctx.demonTentacleDrainTargets = names;
    ctx.demonTentacleDrainAmount = totalDrain;

    setup.myModCombatSkill.clearSelectedAction(ctx);
};

// 2. 淫慾供奉：清空自身性奮，恢復所有插入觸手最大生命值 1.25 倍，代價是自控力下降
setup.myModCombatSkill.effects.demonTentacleOffering = function (ctx) {
    const inserted = setup.myModCombatSkill.getInsertedTentacles();

    const oldArousal = Math.max(
        0,
        Number(V.arousal || 0)
    );

    const names = [];

    inserted.forEach(({ tentacle }) => {
        const max = setup.myModCombatSkill.getTentacleMaxHealth(tentacle);
        const heal = Math.round(max * 1.25);

        tentacle.tentaclehealth += heal;

        // 超過原本上限
        if (tentacle.tentaclehealth > max) {
            tentacle.tentaclehealthstart = tentacle.tentaclehealth;
        }

        names.push(tentacle.fullDesc ?? '觸手');

        new Wikifier(
            null,
            `<<tentacle_record "soothe" ${heal}>>`
        );
    });

    // 清空自身性奮
    V.arousal = 0;

    // 代價：自控下降
    setup.myModCombatSkill.modPlayerStat('control', -200, 0, 1000);

    ctx.demonTentacleOfferingTargets = names;
    ctx.demonTentacleOfferingArousal = oldArousal;

    setup.myModCombatSkill.clearSelectedAction(ctx);
};

// 3. 肉慾轉嫁：插入觸手生命歸零，將其最大生命值轉嫁給未插入觸手並標記，代價是疼痛
setup.myModCombatSkill.effects.demonTentacleTransfer = function (ctx) {
    const inserted = setup.myModCombatSkill.getInsertedTentacles();
    const free = setup.myModCombatSkill.getFreeTentacles();

    const consumedNames = [];
    const markedNames = [];

    let totalMaxHealth = 0;

    inserted.forEach(({ tentacle }) => {
        const max = setup.myModCombatSkill.getTentacleMaxHealth(tentacle);

        totalMaxHealth += max;

        tentacle.tentaclehealth = 0;

        consumedNames.push(tentacle.fullDesc ?? '觸手');

        new Wikifier(
            null,
            `<<tentacle_record "damage" ${max}>>`
        );
    });

    if (free.length > 0 && totalMaxHealth > 0) {
        const gainPerTentacle = Math.max(
            1,
            Math.round(totalMaxHealth / free.length)
        );

        free.forEach(({ tentacle }) => {
            tentacle.tentaclehealth += gainPerTentacle;
            tentacle.tentaclehealthstart += gainPerTentacle;

            tentacle.myModDemonTentacleMarked = true;
            
            tentacle.myModOriginalFullDesc ??= tentacle.fullDesc;
            tentacle.fullDesc =
            `被惡魔標記的${tentacle.myModOriginalFullDesc}`;

            markedNames.push(tentacle.fullDesc ?? '觸手');
        });
    }

    // 代價：疼痛增加
    setup.myModCombatSkill.modPlayerStat('pain', 50, 0, 200);

    ctx.demonTentacleTransferConsumed = consumedNames;
    ctx.demonTentacleTransferMarked = markedNames;
    ctx.demonTentacleTransferTotal = totalMaxHealth;

    setup.myModCombatSkill.clearSelectedAction(ctx);
};

// 4. 惡魔回收：被標記觸手插入時可發動，恢復 demonbuild +10，並造成當前生命六成傷害，每場一次
setup.myModCombatSkill.effects.demonTentacleHarvest = function (ctx) {
    setup.myModCombatSkill.once.markUsed('demonTentacleHarvest');

    const markedInserted =
        setup.myModCombatSkill
            .getInsertedTentacles()
            .filter(info =>
                info.tentacle?.myModDemonTentacleMarked === true
            );

    const names = [];
    let totalDamage = 0;

    markedInserted.forEach(({ tentacle }) => {
        const oldHealth = Math.max(
            0,
            Number(tentacle.tentaclehealth || 0)
        );

        const damage = Math.max(
            1,
            Math.round(oldHealth * 0.6)
        );

        const actualDamage = Math.min(
            oldHealth,
            damage
        );

        tentacle.tentaclehealth = Math.max(
            0,
            oldHealth - actualDamage
        );

        delete tentacle.myModDemonTentacleMarked;

        names.push(tentacle.fullDesc ?? '觸手');
        totalDamage += actualDamage;

        new Wikifier(
            null,
            `<<tentacle_record "damage" ${actualDamage}>>`
        );
    });

    V.demonbuild = Math.min(
        100,
        Number(V.demonbuild || 0) + 10
    );

    ctx.demonTentacleHarvestTargets = names;
    ctx.demonTentacleHarvestDamage = totalDamage;

    setup.myModCombatSkill.clearSelectedAction(ctx);
};

// 通用
// 夾緊
setup.myModCombatSkill.effects.tighten = function ({ targets }) {

    if (V.consensual == 0) {

        targets.forEach(target => {
            setup.myModCombatSkill.damageTargetByMaxHealthPercent(target, 0.02);
        });
    }

    setup.myModCombatSkill.mulPlayerStat('arousal', 1.05, 0, 10000);
    setup.myModCombatSkill.addEnemyArousalPercent(0.2);
};

// 絞緊
setup.myModCombatSkill.effects.tightenCrush = function (ctx) {
    setup.myModCombatSkill.once.markUsed('tightenCrush');

    ctx.targets.forEach(target => {
        if (!target || target.health == null) return;

        const currentHealth = Math.max(0, Number(target.health));
        const damage = Math.round(currentHealth * 2 / 3);

        setup.myModCombatSkill.damageTarget(target, damage);
    });

    const crushedNPCs = (ctx.npc?.valid ?? []).filter(npc =>
        npc &&
        (
            npc.penis === 'vagina' ||
            npc.penis === 'vaginadouble' ||
            npc.penis === 'anus' ||
            npc.penis === 'anusdouble'
        )
    );

    ctx.crushedTargets = crushedNPCs.map(
        npc => npc.fullDescription
    );

    crushedNPCs.forEach(npc => {
        switch (npc.penis) {
            case 'vagina':
                npc.penis = 'vaginaentrance';
                V.vaginastate = 'entrance';
                break;

            case 'vaginadouble':
                npc.penis = 'vaginaentrancedouble';
                V.vaginastate = 'doubleentrance';
                break;

            case 'anus':
                npc.penis = 'anusentrance';
                V.anusstate = 'entrance';
                break;

            case 'anusdouble':
                npc.penis = 'anusentrancedouble';
                V.anusstate = 'doubleentrance';
                break;
        }
    });

    setup.myModCombatSkill.modEnemyStat('enemyanger', 100, 0, Number(V.enemyangermax || 100));

    setup.myModCombatSkill.modEnemyStat('enemytrust', -100, 0);

    setup.myModCombatSkill.mulEnemyArousal(0.2);

    setup.myModCombatSkill.modPlayerStat('pain', 15, 0, 200);
    setup.myModCombatSkill.modPlayerStat('arousal', 800, 0, 10000);
};


/* ==========================================================================
 * Skill Register
 * ========================================================================== */

// 工具：
const handFreeCond = {
    leftaction: () => V.leftarm == 0,
    rightaction: () => V.rightarm == 0,
    mouthaction: () => V.leftarm == 0 || V.rightarm == 0,
    vaginaaction: () => V.leftarm == 0 || V.rightarm == 0,
    anusaction: () => V.leftarm == 0 || V.rightarm == 0
};

const insertCond = {
    vaginaaction: () =>
        setup.myModCombatSkill.hasInsertion([
            'vagina',
            'vaginadouble'
        ]),

    anusaction: () =>
        setup.myModCombatSkill.hasInsertion([
            'anus',
            'anusdouble'
        ])
};

const barrierCond = {
    vaginaaction: () =>
        setup.myModCombatSkill.hasNpcState([
            'vaginaimminent',
            'vaginaentrance',
            'vaginaimminentdouble',
            'vaginaentrancedouble'
        ]),

    anusaction: () =>
        setup.myModCombatSkill.hasNpcState([
            'anusimminent',
            'anusentrance',
            'anusimminentdouble',
            'anusentrancedouble'
        ])
};

// 天使轉化：
// 聖光
setup.myModCombatSkill.reg({
    id: 'angelTransform.holyLight',
    actionType: ['leftaction', 'rightaction'],
    actionCond: handFreeCond,

    value: 'myModAngelHolyLight',

    cond: () =>
        V.angelbuild >= 50 &&
        V.angelBanish > 0 &&
        V.consensual == 0 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => {
        const current = V.angelBanish ?? 0;
        const max = V.angelBanishMax ?? '?';
        return `聖光 (${current}/${max})`;
    },

    color: () => 'yellow',
    difficulty: () => '聖光灼傷所有不懷好意的人。提升對方憤怒並降低信任。',
    order: -11,
    effect: setup.myModCombatSkill.effects.holyLight,

    message: () =>
        `你釋放了<span class="yellow">聖光</span>，耀眼的光芒自你手心爆發，灼燒了在場所有人。`
});

// 聖療
setup.myModCombatSkill.reg({
    id: 'angelTransform.holyHeal',
    actionType: ['leftaction', 'rightaction'],
    actionCond: handFreeCond,

    value: 'myModAngelHolyHeal',

    cond: () =>
        V.angelbuild >= 50 &&
        V.consensual == 0 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '聖療',
    color: () => 'yellow',
    difficulty: () => '以聖光撫平身心，降低疼痛、壓力與創傷，並恢復少量自控力',
    order: -12,
    effect: setup.myModCombatSkill.effects.holyHeal,

    message: () =>
        `你將<span class="yellow">聖光</span>引導至自身，溫暖的光芒撫平了疼痛與不安，讓你的意志重新穩定。`
});

// 神聖治癒
setup.myModCombatSkill.reg({
    id: 'angelTransform.holyRestoration',
    actionType: ['leftaction', 'rightaction'],
    actionCond: handFreeCond,

    value: 'myModHolyRestoration',

    cond: () =>
        V.angelbuild >= 50 &&
        V.angelBanish > 0 &&
        V.consensual == 0 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => {
        const current = V.angelBanish ?? 0;
        const max = V.angelBanishMax ?? '?';
        return `神聖治癒 (${current}/${max})`;
    },

    color: () => 'yellow',
    difficulty: () => '消耗一次聖光，大幅恢復身心狀態並淨化異常效果',
    order: -13,
    effect: setup.myModCombatSkill.effects.holyRestoration,

    message: () =>
        '神聖的光輝自你體內湧現，溫暖而純淨的力量洗滌著你的身心，驅散了傷痛與負面影響。'
});

// 祈禱
setup.myModCombatSkill.reg({
    id: 'angelTransform.pray',
    actionType: ['leftaction', 'rightaction'],
    actionCond: handFreeCond,

    value: 'angelPray',

    cond: () =>
        V.angelbuild >= 50 &&
        !setup.myModCombatSkill.once.isUsed('angelPray') &&
        !setup.myModCombatSkill.isActionBlocked() &&
        V.mouthuse == 0,

    display: () => '祈禱',
    color: () => 'yellow',
    difficulty: () => '每場戰鬥限一次。恢復1點聖光，清空雙方性奮，治療所有敵人並恢復自身狀態',
    order: -14,
    effect: setup.myModCombatSkill.effects.angelPray,

    message: () =>
        '你雙手合十低聲祈禱，神聖的光輝撫平了慾望與混亂。現場短暫歸於平靜，而新的聖光再次回應了你的呼喚。'
});

// 神聖屏障
setup.myModCombatSkill.reg({
    id: 'angelTransform.barrier',
    actionType: ['vaginaaction', 'anusaction'],
    actionCond: barrierCond,

    value: 'angelBarrier',

    cond: () =>
        V.angelbuild >= 50 &&
        V.angelBanish > 0 &&
        !setup.myModCombatSkill.once.isUsed('angelBarrier') &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '神聖屏障',
    color: () => 'yellow',
    difficulty: () => '每場戰鬥限用一次。消耗一次聖光，將接近插入的目標擊退。降低自身性奮及提升控制。提升對方憤怒並降低信任。',
    order: -15,
    effect: setup.myModCombatSkill.effects.angelBarrier,

    message: (ctx) => {
        const names = ctx.angelBarrierTargets ?? [];

        if (names.length === 0) {
            return '神聖的屏障在你身前展開，守護著你的純潔。';
        }

        return `神聖的屏障在你身前展開，將${names.join('與')}隔絕在外，守護住了你的純潔。`;
    }
});
/* ==========================================================================
 * 天使觸手戰註冊
 * ========================================================================== */

// 聖潔庇護
setup.myModCombatSkill.reg({
    id: 'angelTransform.tentacle.pushAway',

    combatType: 'Tentacle',

    actionType: ['vaginaaction', 'anusaction', 'mouthaction'],

    actionCond: handFreeCond,

    value: 'tentaclePushAway',

    cond: () =>
        V.angelbuild >= 51 &&
        V.tentacles &&
        Number(V.tentacles.max || 0) > 0 &&
        !setup.myModCombatSkill.isActionBlocked() &&
        setup.myModCombatSkill.hasTentacleEntranceThreat(),       

    display: () =>
        `聖潔庇護 (${Math.max(0, Number(V.angelbuild || 0) - 50)} / 50)`,

    color: () => 'yellow',

    difficulty: () =>
        '柔和的聖光會逼退即將侵入的不潔觸手。消耗1點天使轉化。此技能不受高性奮失敗判定影響。',

    order: -11,

    effect: setup.myModCombatSkill.effects.pushAwayTentacle,

    message: ctx => {
        const released = ctx.releasedTentacles ?? [];

        if (released.length === 0) {
            return `你試著喚起<span class="yellow">聖光</span>，但不潔之物沒有退去。`;
        }

        const text = released
            .map(t => `${t.name}從你的${t.part}旁退開`)
            .join('，');

        return `柔和的<span class="yellow">聖光</span>自你體內散開，那些試圖玷污你純潔的觸手在光輝前畏縮退避，${text}。`;
    }
});

// 光耀驅邪
setup.myModCombatSkill.reg({
    id: 'angelTransform.banishTentacle',
    combatType: 'Tentacle',
    actionType: ['leftaction', 'rightaction'],
    actionCond: handFreeCond,
    value: 'angelBanishTentacle',

    cond: () =>
        V.angelbuild >= 55 &&
        !setup.myModCombatSkill.isActionBlocked() &&
        V.tentacles &&
        Number(V.tentacles.active || 0) > 0,

    display: () =>
        `光耀驅邪 (${Math.floor(Math.max(0, Number(V.angelbuild || 0) - 49) / 5)} / 10)`,

    color: () => 'yellow',
    difficulty: () =>
        '消耗5點天使轉化，發動聖光驅離觸手。高性奮時可能失敗。',
    order: -12,
    effect: setup.myModCombatSkill.effects.banishTentacle,

    message: ctx => {
        if (ctx.angelSkillFailed) {
            return `<span class="pink">高漲的情慾擾亂了你的思緒</span>，你試圖凝聚<span class="yellow">聖光</span>，但神術在成形前便<span class="red">消散了</span>。`;
        }

        if (!ctx.banishedTentacle) {
            return `你試圖凝聚<span class="yellow">聖光</span>驅離觸手，但沒有找到目標。`;
        }

        return `<span class="yellow">神聖的光輝</span>凝聚於你的掌心，${ctx.banishedTentacle}在聖光照耀下猛然收縮，隨後從你身旁退去。`;
    }
});

// 聖痕
setup.myModCombatSkill.reg({
    id: 'angelTransform.holyMarkTentacle',
    combatType: 'Tentacle',
    actionType: ['leftaction', 'rightaction'],
    actionCond: handFreeCond,
    value: 'angelHolyMarkTentacle',

    cond: () =>
        V.angelbuild >= 52 &&
        !setup.myModCombatSkill.isActionBlocked() &&
        V.tentacles &&
        Number(V.tentacles.active || 0) > 0,

    display: () =>
        `聖痕 (${Math.floor(Math.max(0, Number(V.angelbuild || 0) - 49) / 2)} / 25)`,

    color: () => 'yellow',
    difficulty: () =>
        '消耗2點天使轉化，在指定觸手上刻下聖痕，造成微量傷害。聖痕最多疊加3層，會強化下一次聖光傷害。高性奮時可能失敗。',
    order: -13,
    effect: setup.myModCombatSkill.effects.holyMarkTentacle,

    message: ctx => {
        if (ctx.angelSkillFailed) {
            return `你的呼吸逐漸<span class="pink">急促</span>，原本準備刻下的<span class="yellow">聖痕</span>無法穩定成形。`;
        }

        if (!ctx.holyMarkedTentacle) {
            return `你試圖刻下<span class="yellow">聖痕</span>，但沒有找到目標。`;
        }

        return `你將<span class="yellow">神聖的印記</span>烙在${ctx.holyMarkedTentacle}上，造成<span class="red">${ctx.holyMarkDamage || 0}</span>點傷害。聖痕目前為<span class="yellow">${ctx.holyMarkStacks || 1}</span>層。`;
    }
});

// 聖裁
setup.myModCombatSkill.reg({
    id: 'angelTransform.holyJudgementTentacle',
    combatType: 'Tentacle',
    actionType: ['leftaction', 'rightaction'],
    actionCond: handFreeCond,
    value: 'angelHolyJudgementTentacle',

    cond: () =>
        V.angelbuild >= 53 &&
        !setup.myModCombatSkill.isActionBlocked() &&
        V.tentacles &&
        Number(V.tentacles.active || 0) > 0,

    display: () =>
        `聖裁 (${Math.floor(Math.max(0, Number(V.angelbuild || 0) - 49) / 3)} / 17)`,

    color: () => 'yellow',
    difficulty: () =>
        '消耗3點天使轉化，以聖光重創指定觸手，並打斷其目前行動。高性奮時可能失敗。',
    order: -14,
    effect: setup.myModCombatSkill.effects.holyJudgementTentacle,

    message: ctx => {
        if (ctx.angelSkillFailed) {
            return `<span class="pink">高漲的情慾</span>擾亂了你的祈念，你試圖降下<span class="yellow">聖裁</span>，但聖光在成形前便<span class="red">消散了</span>。`;
        }

        if (!ctx.holyJudgementTentacle) {
            return `你試圖降下<span class="yellow">聖裁</span>，但沒有找到目標。`;
        }

        return `<span class="yellow">聖光凝聚成刃</span>，重重灼燒${ctx.holyJudgementTentacle}，迫使它從你身旁退開。`;
    }
});

// 聖光爆發
setup.myModCombatSkill.reg({
    id: 'angelTransform.holyBurstTentacles',
    combatType: 'Tentacle',
    actionType: ['leftaction', 'rightaction'],
    actionCond: handFreeCond,
    value: 'angelHolyBurstTentacles',

    cond: () =>
        V.angelbuild >= 58 &&
        !setup.myModCombatSkill.isActionBlocked() &&
        V.tentacles &&
        Number(V.tentacles.active || 0) > 0,

    display: () =>
        `聖光爆發 (${Math.floor(Math.max(0, Number(V.angelbuild || 0) - 49) / 8)} / 6)`,

    color: () => 'yellow',
    difficulty: () =>
        '消耗8點天使轉化，釋放聖光重創所有觸手，並打斷牠們目前的行動。高性奮時可能失敗。',
    order: -15,
    effect: setup.myModCombatSkill.effects.holyBurstTentacles,

    message: ctx => {
        if (ctx.angelSkillFailed) {
            return `你試圖釋放體內的<span class="yellow">神聖力量</span>，但<span class="pink">情慾帶來的悸動</span>讓聖光失去了控制。`;
        }

        const list = ctx.holyBurstTentacles ?? [];

        if (list.length === 0) {
            return `你試圖釋放<span class="yellow">聖光爆發</span>，但周圍沒有可影響的觸手。`;
        }

        return `<span class="yellow">耀眼的聖光</span>自你身體爆發，灼燒周遭的不潔觸手，迫使${list.join('、')}一同退開。`;
    }
});

// 祈禱
setup.myModCombatSkill.reg({
    id: 'angelTransform.prayer',
    combatType: 'Tentacle',
    actionType: ['mouthaction', 'leftaction', 'rightaction'],
    value: 'angelPrayer',

    cond: () =>
        V.angelbuild >= 50 &&
        V.angelbuild < 100 &&
        V.mouthuse === 0 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => `祈禱`,
    color: () => 'gold',
    difficulty: () =>
        '虔誠的祈禱將神聖力量重新導入體內，恢復天使轉化與聖光璀璨，但也會使精神逐漸疲憊。恢復5點天使轉化、恢復1點聖光璀璨。',
    order: -16,
    effect: setup.myModCombatSkill.effects.angelPrayer,

    message: ctx => {

    if (ctx.angelSkillFailed) {
        return `你試圖平復<span class="pink">高漲的情慾</span>並向神明祈禱，但紊亂的思緒始終無法完全平靜。你僅恢復了<span class="green">${ctx.angelPrayerRecover}</span>點天使轉化。`;
    }

    return `你<span class="lblue">虔誠地祈禱</span>。<span class="yellow">溫暖的光輝</span>灑落在你的身上，逐漸補充流失的神聖力量。天使轉化恢復了<span class="green">${ctx.angelPrayerRecover}</span>點，聖光璀璨恢復了<span class="green">${ctx.angelPrayerLightRecover}</span>點。`;
}     
        
});

// 惡魔轉化：淫蝕
setup.myModCombatSkill.reg({
    id: 'demonTransform.corruption',
    actionType: ['leftaction', 'rightaction'],
    actionCond: handFreeCond,

    value: 'demonCorruption',

    cond: () =>
        V.demonbuild >= 30 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '淫蝕',
    color: () => 'purple',
    difficulty: () => '提升敵方性奮度並造成少量傷害，自身也會逐漸性奮',
    order: -21,
    effect: setup.myModCombatSkill.effects.demonCorruption,

    message: ({ targets }) => {
        const names = targets
            .filter(Boolean)
            .map(t => t.fullDescription ?? '敵人');

        return `你以惡魔的力量侵蝕${names.join('與')}的意志，使其逐漸沉溺於慾望之中。`;
    }
});

// 惡魔之觸
setup.myModCombatSkill.reg({
    id: 'demonTransform.touch',
    actionType: ['leftaction', 'rightaction'],
    actionCond: handFreeCond,

    value: 'demonTouch',

    cond: () =>
        V.demonbuild >= 30 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '惡魔之觸',
    color: () => 'purple',
    difficulty: () => '以對方的慾望侵蝕其肉體，造成傷害。提升自身性奮並降低控制。提升對方憤怒並降低信任。',
    order: -22,
    effect: setup.myModCombatSkill.effects.demonTouch,

    message: ({ targets }) => {
        const names = targets
            .filter(Boolean)
            .map(t => t.fullDescription ?? '敵人');

        return `你將惡魔的力量注入${names.join('與')}體內，將其慾望轉化為痛苦。`;
    }
});

// 痛苦轉嫁：陰道 / 肛門合併
setup.myModCombatSkill.reg({
    id: 'demonTransform.painTransfer',
    actionType: ['vaginaaction', 'anusaction'],
    actionCond: insertCond,

    value: 'demonPainTransfer',

    cond: () =>
        V.demonbuild >= 30 &&
        !setup.myModCombatSkill.once.isUsed('demonPainTransfer') &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '痛苦轉嫁',
    color: () => 'purple',
    difficulty: () => '每場戰鬥限用一次。將自身疼痛、壓力、創傷與疲勞轉化為傷害並恢復自身，自身足夠性奮時傷害增加。會大幅提升自身性奮、對方憤怒，及大幅降低對方信任。',
    order: -23,
    effect: setup.myModCombatSkill.effects.demonPainTransfer,

    message: (ctx) => {
        const names = ctx.demonPainTransferTargets ?? [];

        if (names.length === 0) {
            return '你試圖將體內的痛苦轉嫁出去，但沒有找到合適的目標。';
        }

        return `你將體內累積的痛苦與疲憊化作惡魔的力量，反噬${names.join('與')}。`;
    }
});

// 沉淪：陰道 / 肛門合併
setup.myModCombatSkill.reg({
    id: 'demonTransform.corrupt',
    actionType: ['vaginaaction', 'anusaction'],
    actionCond: insertCond,

    value: 'demonCorrupt',

    cond: () =>
        V.demonbuild >= 30 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '沉淪',
    color: () => 'purple',
    difficulty: () => '降低純潔以換取魅魔力量，提升敵方性奮並造成少量傷害',
    order: -24,
    effect: setup.myModCombatSkill.effects.demonCorrupt,

    message: ({ targets }) => {
        const targetText = targets
            .filter(Boolean)
            .map(target =>
                `${target.fullDescription}的${target.penisdesc}`
            );

        if (targetText.length === 0) return;

        return `你主動迎合${targetText.join('與')}帶來的刺激，將自身的純潔逐漸轉化為魅魔的力量。`;
    }
});

// 沉淪 口部
setup.myModCombatSkill.reg({
    id: 'demonTransform.corruptMouth',
    actionType: ['mouthaction'],

    value: 'demonCorrupt',

    cond: () =>
        V.demonbuild >= 30 &&
        setup.myModCombatSkill.hasMouthInsertion() &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '沉淪',
    color: () => 'purple',
    difficulty: () => '降低純潔以換取魅魔力量，提升敵方性奮並造成少量傷害',
    order: -24,
    effect: setup.myModCombatSkill.effects.demonCorrupt,

    message: ({ targets }) => {
        const targetText = targets
            .filter(Boolean)
            .map(target =>
                `${target.fullDescription}的${target.penisdesc}`
            );

        if (targetText.length === 0) return;

        return `你放棄了最後的矜持，主動迎合${targetText.join('與')}帶來的刺激，讓魅魔的力量在體內愈發強盛。`;
    }
});

// 墮慾衝擊
setup.myModCombatSkill.reg({
    id: 'demonTransform.purityDamage',
    actionType: ['leftaction', 'rightaction'],
    actionCond: handFreeCond,

    value: 'demonPurityDamage',

    cond: () =>
        V.demonbuild >= 30 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '墮慾衝擊',
    color: () => 'purple',
    difficulty: () => '純潔越低，對所有敵人造成的傷害越高，但會增加自身性奮並降低自控力。提升對方憤怒並降低信任。',
    order: -25,
    effect: setup.myModCombatSkill.effects.demonPurityDamage,

    message: () =>
        '你將失去的純潔化作惡魔的力量，向在場所有敵人釋放出墮落的衝擊。'
});

/* ==========================================================================
 * 惡魔觸手戰註冊
 * ========================================================================== */
// 工具

const tentacleInsertCond = {
    vaginaaction: () =>
        setup.myModCombatSkill.hasTentacleVaginaInsertion(),

    anusaction: () =>
        setup.myModCombatSkill.hasTentacleAnusInsertion(),
    
    mouthaction: () =>    
        setup.myModCombatSkill.hasTentacleMouthInsertion(),    
};

// 深淵汲取
setup.myModCombatSkill.reg({
    id: 'demonTransform.tentacle.drain',

    combatType: 'Tentacle',

    actionType: ['vaginaaction', 'anusaction', 'mouthaction'],
    
    actionCond: tentacleInsertCond,
    
    value: 'demonTentacleDrain',

    cond: () =>
        V.demonbuild >= 30 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '深淵汲取',

    color: () => 'purple',

    difficulty: () =>
        '吸收插入觸手當前生命值的一半，恢復自身疼痛、壓力、創傷、疲勞與自控力，但會提升自身性奮。',

    order: -31,

    effect: setup.myModCombatSkill.effects.demonTentacleDrain,

    message: ctx => {
        const list = ctx.demonTentacleDrainTargets ?? [];

        if (list.length === 0) {
            return `你試圖汲取觸手的生命，但沒有可吸收的目標。`;
        }

        return `你放任<span class="purple">惡魔本能</span>沿著侵入體內的觸手逆流而上，汲取${list.join('、')}的生命，恢復了些許身心狀態與自控力，卻也讓慾望更加高漲。`;
    }
});

// 淫慾供奉
setup.myModCombatSkill.reg({
    id: 'demonTransform.tentacle.offering',

    combatType: 'Tentacle',

    actionType: ['vaginaaction', 'anusaction', 'mouthaction'],
    
    actionCond: tentacleInsertCond,

    value: 'demonTentacleOffering',

    cond: () =>
        V.demonbuild >= 30 &&
        V.arousal >= 2500 &&
        Number(V.arousal || 0) > 0 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '淫慾供奉',

    color: () => 'purple',

    difficulty: () =>
        '清空自身性奮，恢復所有插入觸手最大生命值1.25倍。代價是降低自控力。',

    order: -32,

    effect: setup.myModCombatSkill.effects.demonTentacleOffering,

    message: ctx => {
        const list = ctx.demonTentacleOfferingTargets ?? [];

        if (list.length === 0) {
            return `你試圖將高漲的慾望供奉出去，但沒有觸手正在侵入你。`;
        }

        return `你將體內累積的慾望<span class ="purple">化作甜美的供品</span>，灌入${list.join('、')}之中。你的興奮被抽空，觸手卻因此變得更加旺盛。`;
    }
});

// 肉慾轉嫁
setup.myModCombatSkill.reg({
    id: 'demonTransform.tentacle.transfer',

    combatType: 'Tentacle',

    actionType: ['vaginaaction', 'anusaction', 'mouthaction'],
    
    actionCond: tentacleInsertCond,

    value: 'demonTentacleTransfer',

    cond: () =>
        V.demonbuild >= 30 &&
        !setup.myModCombatSkill.isActionBlocked() &&
        setup.myModCombatSkill.getFreeTentacles().length > 0,

    display: () => '肉慾轉嫁',

    color: () => 'purple',

    difficulty: () =>
        '使插入中的觸手生命歸零，將其最大生命值轉嫁給未插入觸手並標記。代價是增加疼痛。',

    order: -33,

    effect: setup.myModCombatSkill.effects.demonTentacleTransfer,

    message: ctx => {
        const consumed = ctx.demonTentacleTransferConsumed ?? [];
        const marked = ctx.demonTentacleTransferMarked ?? [];

        if (consumed.length === 0) {
            return `你試圖轉嫁觸手的生命，但沒有可用的目標。`;
        }

        if (marked.length === 0) {
            return `你強行榨乾了${consumed.join('、')}的生命，但沒有其他觸手能承接這份力量。`;
        }

        return `你以疼痛為代價，將${consumed.join('、')}的生命強行剝離，轉嫁至${marked.join('、')}身上，留下了<span class ="purple">惡魔的標記</span>。`;
    }
});

// 惡魔回收
setup.myModCombatSkill.reg({
    id: 'demonTransform.tentacle.harvest',

    combatType: 'Tentacle',

    actionType: ['vaginaaction', 'anusaction', 'mouthaction'],
    
    actionCond: tentacleInsertCond,

    value: 'demonTentacleHarvest',

    cond: () =>
        V.demonbuild >= 30 &&
        !setup.myModCombatSkill.once.isUsed('demonTentacleHarvest') &&
        !setup.myModCombatSkill.isActionBlocked() &&
        setup.myModCombatSkill.hasInsertedDemonMarkedTentacle(),

    display: () => '惡魔回收',

    color: () => 'purple',

    difficulty: () =>
        '每場戰鬥限用一次。被惡魔標記的觸手插入時可發動，恢復10點惡魔轉化。',

    order: -34,

    effect: setup.myModCombatSkill.effects.demonTentacleHarvest,

    message: ctx => {
        const list = ctx.demonTentacleHarvestTargets ?? [];

        if (list.length === 0) {
            return `你試圖回收惡魔標記，但沒有標記觸手正在侵入你。`;
        }

        return `當${list.join('、')}侵入你時，早已埋下的<span class="purple">惡魔標記</span>被喚醒。你回收了其中的力量，惡魔轉化得到恢復，並反噬觸手造成<span class="red">${ctx.demonTentacleHarvestDamage || 0}</span>點傷害。`;
}
});

// 貓轉化：貓爪攻擊
setup.myModCombatSkill.reg({
    id: 'catTransform.catClaw',
    actionType: ['leftaction', 'rightaction'],
    actionCond: handFreeCond,

    value: 'myModCatClaw',

    cond: () =>
        V.catbuild >= 50 &&
        V.consensual == 0 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '貓爪攻擊',
    color: () => 'pink',
    difficulty: () => '對指定敵人造成最大生命值10%的傷害，少量提升對方憤怒並降低信任。',
    order: -31,
    effect: setup.myModCombatSkill.effects.catClaw,

    message: ({ targets }) => {
        const names = targets
            .filter(Boolean)
            .map(target => target.fullDescription ?? '敵人');

        const targetText = names.length > 0
            ? names.join('與')
            : '敵人';

        return `你揮出<span class="pink">貓爪</span>，狠狠抓向${targetText}。`;
    }
});

// 呼嚕
setup.myModCombatSkill.reg({
    id: 'catTransform.purr',
    actionType: ['mouthaction'],

    value: 'catPurr',

    cond: () =>
        V.catbuild >= 50 &&
        V.consensual == 0 &&
        V.mouthuse == 0 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '呼嚕',
    color: () => 'pink',
    difficulty: () => '發出安撫性的呼嚕聲，降低對方憤怒並提升信任，同時舒緩自身疼痛與壓力',
    order: -32,
    effect: setup.myModCombatSkill.effects.catPurr,

    message: () =>
        '你輕輕發出低沉而規律的呼嚕聲。熟悉的震動逐漸平復了你的緊張，也讓對方的態度稍微緩和。'
});

// 舔舐
setup.myModCombatSkill.reg({
    id: 'catTransform.lick',
    actionType: ['mouthaction'],

    value: 'catLick',

    cond: () =>
        V.catbuild >= 50 &&
        setup.myModCombatSkill.hasMouthInsertion() &&
        !setup.myModCombatSkill.isActionBlocked() &&
        V.mouthuse == 0,

    display: () => '舔舐',
    color: () => 'pink',
    difficulty: () => '利用舌頭刺激對方，大幅提升其性奮並增加少量信任',
    order: -33,
    effect: setup.myModCombatSkill.effects.catLick,

    message: ({ targets }) => {
        const targetText = targets
            .filter(Boolean)
            .map(target =>
                `${target.fullDescription}的${target.penisdesc}`
            );

        if (targetText.length === 0) return;

        return `你像貓一樣用帶著倒刺的舌頭舔舐${targetText.join('與')}，讓對方變得更加性奮。`;
    }
});

// 理毛
setup.myModCombatSkill.reg({
    id: 'catTransform.groom',
    actionType: ['mouthaction'],

    value: 'catGroom',

    cond: () =>
        V.catbuild >= 50 &&
        V.mouthuse == 0 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '理毛',
    color: () => 'pink',
    difficulty: () => '整理毛髮與儀容，降低壓力、疲勞與創傷，並恢復少量自控力',
    order: -34,
    effect: setup.myModCombatSkill.effects.catGroom,

    message: () =>
        '你低下頭細心整理凌亂的毛髮。熟悉的動作讓你逐漸平靜下來，重新找回些許從容。'
});

// 發情：陰道 / 肛門合併
setup.myModCombatSkill.reg({
    id: 'catTransform.heat',
    actionType: ['vaginaaction', 'anusaction'],
    actionCond: insertCond,

    value: 'catHeat',

    cond: () =>
        V.catbuild >= 50 &&
        !setup.myModCombatSkill.once.isUsed('catHeat') &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '發情',
    color: () => 'pink',
    difficulty: () => '大幅提升對方性奮，也會增加自身性奮並降低自控力',
    order: -35,
    effect: setup.myModCombatSkill.effects.catHeat,

    message: ({ targets }) => {
        const targetText = targets
            .filter(Boolean)
            .map(target =>
                `${target.fullDescription}的${target.penisdesc}`
            );

        if (targetText.length === 0) return;

        return `貓科的本能在你體內甦醒，你正忘我的壓榨${targetText.join('與')}以滿足本能。`;
    }
});

/* ==========================================================================
 * 貓貓觸手戰註冊
 * ========================================================================== */
// 工具
const tentacleNotInsertedCond = {
    vaginaaction: () =>
        !setup.myModCombatSkill.hasTentacleVaginaInsertion(),

    anusaction: () =>
        !setup.myModCombatSkill.hasTentacleAnusInsertion(),

    mouthaction: () =>
        !setup.myModCombatSkill.hasTentacleMouthInsertion(),
};

// 貓爪
setup.myModCombatSkill.reg({
    id: 'catTransform.tentacle.catClaw',

    combatType: 'Tentacle',

    actionType: ['leftaction', 'rightaction'],

    actionCond: handFreeCond,

    value: 'catClawTentacle',

    cond: () =>
        V.catbuild >= 50 &&
        !setup.myModCombatSkill.isActionBlocked() &&
        V.tentacles &&
        Number(V.tentacles.active || 0) > 0,

    display: () =>
        '貓爪',

    color: () => 'pink',

    difficulty: () =>
        '以貓爪抓傷指定觸手，造成目前生命值30%的傷害。',

    order: -31,

    effect: setup.myModCombatSkill.effects.catClawTentacle,

    message: ctx => {
        
        if (ctx.catSkillFailed) {
            return `高漲的<span class="pink">情慾</span>讓你的身體一陣發軟，你試圖揮出<span class="pink">貓爪</span>，卻沒能抓準觸手的位置。`;
        }
        
        if (!ctx.catClawTentacle) {
            return '你揮出貓爪，但沒有抓到任何觸手。';
        }               
        
        return `你揮出<span class="pink">貓爪</span>，狠狠抓向${ctx.catClawTentacle}，造成<span class="red">${ctx.catClawTentacleDamage || 0}</span>點傷害。`;
    }
});


// 呼嚕
setup.myModCombatSkill.reg({
    id: 'catTransform.tentacle.purr',

    combatType: 'Tentacle',

    actionType: ['mouthaction'],

    value: 'catPurrTentacle',

    cond: () =>
        V.catbuild >= 50 &&
        !setup.myModCombatSkill.isActionBlocked() &&
        V.mouthuse === 0 &&
        V.tentacles &&
        Number(V.tentacles.active || 0) > 0,

    display: () =>
        '呼嚕',

    color: () => 'pink',

    difficulty: () =>
        '發出安撫性的呼嚕聲，降低自身壓力、疼痛與性奮，並對所有觸手造成微量干擾。',

    order: -32,

    effect: setup.myModCombatSkill.effects.catPurrTentacle,

    message: ctx => {

        const list = ctx.catPurrTentacles ?? [];

        if (ctx.catSkillFailed) {
            return `你試圖發出<span class="pink">呼嚕聲</span>平復自己，但紊亂的呼吸讓聲音斷斷續續，沒能穩定下來。`;
        }
        
        if (list.length === 0) {
            return `你發出低沉的<span class="pink">呼嚕聲</span>，讓自己稍微冷靜下來。`;
        }
        
        return `你發出低沉而規律的<span class="pink">呼嚕聲</span>。震動讓你稍微冷靜下來，也使${list.join('、')}的動作變得遲緩。`;
    }
});


// 貓之柔韌
setup.myModCombatSkill.reg({
    id: 'catTransform.tentacle.flex',

    combatType: 'Tentacle',

    actionType: ['vaginaaction', 'anusaction', 'mouthaction'],
    
    actionCond: tentacleNotInsertedCond,

    value: 'catFlexTentacle',

    cond: () =>
        V.catbuild >= 50 &&
        !setup.myModCombatSkill.isActionBlocked() &&
        V.tentacles &&
        Number(V.tentacles.active || 0) > 0 &&
        setup.myModCombatSkill.hasTentacleEntranceThreat(),

    display: () =>
        '貓之柔韌',

    color: () => 'pink',

    difficulty: () =>
        '以貓一般柔軟的身體閃避觸手，打斷正接近入口的觸手。無法解除已經深入的觸手。',

    order: -33,

    effect: setup.myModCombatSkill.effects.catFlexTentacle,

    message: ctx => {

        const list = ctx.catFlexTentacles ?? [];

        if (ctx.catSkillFailed) {
            return `你試圖像貓一樣<span class="pink">柔軟地扭身閃避</span>，但高漲的情慾讓動作慢了一拍。`;
        }
        
        if (list.length === 0) {
            return `你像貓一樣靈巧地扭動身體，試圖避開觸手，但沒有觸手正好露出破綻。`;
        }        

        return `你像貓一樣<span class="pink">柔軟地扭動身體</span>，從${list.join('、')}的逼近中滑脫。`;
    }
});

// 通用：夾緊，陰道 / 肛門合併
setup.myModCombatSkill.reg({
    id: 'instinct.tighten',
    actionType: ['vaginaaction', 'anusaction'],
    actionCond: insertCond,

    value: 'myModTighten',

    cond: () =>
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '夾緊',
    color: () => 'pink',

    difficulty: () =>
        V.consensual
            ? '收緊身體迎合刺激，提升雙方性慾'
            : '收緊身體抵抗侵入，對插入者造成微量傷害並提升雙方性慾',

    order: -91,
    effect: setup.myModCombatSkill.effects.tighten,

    message: () =>
        V.consensual
            ? '你順從本能地收緊身體，突如其來的刺激讓雙方都變得更加性奮。'
            : '你下意識地收緊身體，試圖抵抗侵入帶來的不適，但強烈的刺激仍讓雙方受到影響。'
});

// 通用：絞緊，陰道 / 肛門合併
setup.myModCombatSkill.reg({
    id: 'instinct.tightenCrush',
    actionType: ['vaginaaction', 'anusaction'],
    actionCond: insertCond,

    value: 'tightenCrush',

    cond: () =>
        !setup.myModCombatSkill.once.isUsed('tightenCrush') &&
        V.consensual == 0 &&
        !setup.myModCombatSkill.isActionBlocked(),

    display: () => '絞緊',
    color: () => 'red',
    difficulty: () => '對插入者造成當前生命值三分之二的傷害，大幅提升對方憤怒並降低信任及性奮',
    order: -92,
    effect: setup.myModCombatSkill.effects.tightenCrush,

    message: (ctx) => {
        const names = ctx.crushedTargets ?? [];
        return `你猛然收緊肌肉，劇烈的反抗讓${names.join('、')}發出痛苦的哀嚎，被迫退出了你的身體。`;
    }
});

//debud table

setup.debugCombatTargets = function () {

    const validNPCs = Array.isArray(V.NPCList)
        ? V.NPCList.filter(
            npc =>
                npc &&
                npc.health !== undefined &&
                npc.health !== null
        )
        : [];

    const parts = [
        ['left',   'leftaction',   'lefttarget'],
        ['right',  'rightaction',  'righttarget'],

        ['feet',   'feetaction',   'feettarget'],
        ['mouth',  'mouthaction',  'mouthtarget'],

        ['chest',  'chestaction',  'chesttarget'],
        ['thigh',  'thighaction',  'thightarget'],

        ['vagina', 'vaginaaction', 'vaginatarget'],
        ['anus',   'anusaction',   'anustarget'],

        ['penis',  'penisaction',  'thightarget']
    ];

    console.log('==============================');
    console.log('Combat Target Debug');
    console.log('==============================');

    console.log('=== validNPCs ===');

    console.table(
        validNPCs.map((npc, i) => ({
            validIndex: i,

            name:
                npc.fullDescription ??
                npc.description ??
                npc.name ??
                'unknown',

            health: npc.health,
            healthmax: npc.healthmax
        }))
    );

    console.log('=== action / target mapping ===');

    console.table(
        parts.map(([part, actionKey, targetKey]) => {

            const targetIndex = V[targetKey];
            const npc = validNPCs[targetIndex];

            return {
                part,

                actionKey,
                actionValue: V[actionKey],

                targetKey,
                targetIndex,

                targetName:
                    npc?.fullDescription ??
                    npc?.description ??
                    npc?.name ??
                    '無',

                targetHealth: npc?.health,
                targetHealthMax: npc?.healthmax
            };
        })
    );

    console.log('=== Raw Target Variables ===');

    console.table({
        lefttarget: V.lefttarget,
        righttarget: V.righttarget,

        feettarget: V.feettarget,
        mouthtarget: V.mouthtarget,

        chesttarget: V.chesttarget,
        thightarget: V.thightarget,

        vaginatarget: V.vaginatarget,
        anustarget: V.anustarget,

        handtarget: V.handtarget,

        leftactionTarget: V.leftactionTarget,
        rightactionTarget: V.rightactionTarget,
        feetactionTarget: V.feetactionTarget
    });

    console.log('==============================');
    console.log('Combat Target Debug End');
    console.log('==============================');
};