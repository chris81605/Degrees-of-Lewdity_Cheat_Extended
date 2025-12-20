setup.CEaddAllClotehes = setup.CEaddAllClotehes || {};

/* ========= 常數 ========= */
setup.CEaddAllClotehes.colors =
	setup.colours?.clothes
		? setup.colours.clothes.map(c => c.variable)
		: ["black", "blue", "brown", "green",
	"pink", "purple", "red", "tangerine", "teal"];

/* ========= 工具 ========= */
setup.CEaddAllClotehes.randomColor = function () {
	return setup.CEaddAllClotehes.colors[random(0, setup.CEaddAllClotehes.colors.length - 1)];
};

/* ========= 取得指定類型的服裝名稱（UI 用） ========= */
setup.CEaddAllClotehes.getClothesNameList = function (type) {
	if (!setup.clothes[type]) return [];

	return setup.clothes[type]
		.filter(c => c.cn_name_cap && c.cn_name_cap !== "赤裸")
		.map(c => c.cn_name_cap);
};

/* ========= 指定名稱添加一件 ========= */
setup.CEaddAllClotehes.addOneByName = function (type, name, color, accColor) {
	const list = setup.clothes[type];
	if (!list) return false;

	for (let i = 0; i < list.length; i++) {
		if (list[i].cn_name_cap === name) {
			Wikifier.wikifyEval(
				`<<generalSend "wardrobe" "${type}" ${i} "${color}" "${accColor}">>`
			);
			return true;
		}
	}
	return false;
};

/* ========= 一鍵全添加 ========= */
setup.CEaddAllClotehes.addAll = function (type) {
	const list = setup.clothes[type];
	if (!list) return;

	for (let i = list.length - 1; i > 0; i--) {
		Wikifier.wikifyEval(
			`<<generalSend "wardrobe" "${type}" ${i} "${setup.CEaddAllClotehes.randomColor()}" "${setup.CEaddAllClotehes.randomColor()}">>`
		);
	}
};

/* ========= 關鍵字添加 ========= */
/* 全匹配
setup.CEaddAllClotehes.addByKeyword = function(type, keyword, mainColor, accColor) {
    const list = setup.clothes[type];
    if (!list || !keyword) return 0;

    let count = 0;
    for (let i = 0; i < list.length; i++) {
        const name = list[i].cn_name_cap;
        if (name && name !== "赤裸" && name.includes(keyword)) {
            Wikifier.wikifyEval(
                `<<generalSend "wardrobe" "${type}" ${i} "${mainColor}" "${accColor}">>`
            );
            count++;
        }
    }
    return count;
};
*/

//模糊搜索
setup.CEaddAllClotehes.addByKeyword = function (type, keyword, mainColor, accColor) {
	const list = setup.clothes[type];
	if (!list || !keyword) return 0;

	const keys = keyword
		.toLowerCase()
		.trim()
		.split(/\s+/); // 支援多關鍵字

	let count = 0;

	for (let i = 0; i < list.length; i++) {
		const name = list[i].cn_name_cap;
		if (!name || name === "赤裸") continue;

		const lowerName = name.toLowerCase();

		// 每個關鍵字都要命中
		const matched = keys.every(k => lowerName.includes(k));
		if (!matched) continue;

		Wikifier.wikifyEval(
			`<<generalSend "wardrobe" "${type}" ${i} "${mainColor}" "${accColor}">>`
		);
		count++;
	}
	return count;
};

/* ========= 穿上指定 genitals ========= */
setup.CEaddAllClotehes.wearGenitalsByName = function (name) {
	const list = setup.clothes.genitals;
	if (!list) return false;

	for (let i = 0; i < list.length; i++) {
		if (list[i].cn_name_cap === name) {
			Wikifier.wikifyEval(`<<genitalswear ${i}>>`);
			Wikifier.wikifyEval(`<<set $worn.genitals.origin to "Temple">>`);
			return true;
		}
	}
	return false;
};