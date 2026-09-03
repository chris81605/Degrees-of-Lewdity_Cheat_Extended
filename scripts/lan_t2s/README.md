# Cheat Extended CE 語言切換

Cheat Extended 的繁體／簡體中文介面切換模組。

CE 介面以**繁體中文作為原始文本**，當 `V.CE_langMode === "s"` 時，透過字庫將指定的 CE 介面即時轉換為簡體中文顯示。

轉換僅影響介面顯示，不會修改存檔中的原始文本。

---

## 載入順序

```text
1. CE_langDict.js
2. CE_lang.js
```

`CE_langDict.js` 必須在 `CE_lang.js` 之前載入。

---

## 語言模式

```js
V.CE_langMode = "t"; // 繁體中文（原始文本）
V.CE_langMode = "s"; // 簡體中文（轉換顯示）
```

---

## 公開接口

### `CE_trText(text)`

依目前的 `V.CE_langMode` 轉換文本。

- `"t"`：保持繁體原文
- `"s"`：轉換為簡體中文

此接口保留供 Cheat Extended 其他模組及第三方擴充使用。

### `CE_toSimplified(text)`

強制將繁體中文轉換為簡體中文，不受目前語言模式影響。

### `CE_refreshLang()`

重新套用目前的 CE 介面語言。

可在修改 `V.CE_langMode` 後呼叫，使現有 CE 介面重新套用語言設定。

---

## 字庫

`CE_langDict.js` 使用 [OpenCC](https://github.com/BYVoid/OpenCC) 提供的繁體轉簡體字庫生成。

目前使用：

- [TSCharacters.txt](https://github.com/BYVoid/OpenCC/blob/master/data/dictionary/TSCharacters.txt) — 繁體 → 簡體單字映射
- [TSPhrases.txt](https://github.com/BYVoid/OpenCC/blob/master/data/dictionary/TSPhrases.txt) — 繁體 → 簡體詞組映射

CE 另外保留少量自訂詞組規則，用於處理 CE／DoL 特定文本、人名及需要優先於通用字庫處理的例外。

---

## 更新字庫

需要同步 OpenCC 最新字庫時：

1. 從 OpenCC 官方專案下載最新的：
   - `TSCharacters.txt`
   - `TSPhrases.txt`

2. 將兩個檔案放到 `build_from_opencc.py` 所在目錄。

3. 執行：

```bash
python build_from_opencc.py TSCharacters.txt TSPhrases.txt CE_langDict.js
```

4. 使用新生成的 `CE_langDict.js` 替換原有字庫。

一般使用者不需要進行上述操作，僅在需要同步 OpenCC 字庫更新時重新生成即可。

---

## 致謝

繁體／簡體中文轉換字庫來源：

**OpenCC — Open Chinese Convert**

- 專案：https://github.com/BYVoid/OpenCC
- 授權：Apache License 2.0

感謝 OpenCC 專案及其貢獻者長期維護中文繁簡轉換字典與相關資料。

Cheat Extended 僅將相關字典資料轉換為適合模組載入的 JavaScript 格式，並在其基礎上加入少量 CE 專用例外規則。