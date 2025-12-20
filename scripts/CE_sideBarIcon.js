// 抄作業就完事了！
function CEiconClicked() {
    $.wiki("<<CEoverlayReplace \"CEcheatMenu\">>");
}
window.CEiconClicked = CEiconClicked;

function CEiconSFdetect(){    
    const simpleMod = window.modUtils.getAnyModByNameNoAlias('Simple Frameworks'); // ⚡ Simple Frameworks
    const logger = window.modUtils.getLogger();
    //logger.warn(`[cheat Extended][CEiconSFdetect] 🧾 simpleMod = ${simpleMod}`);
    //console.warn(`[cheat Extended][CEiconSFdetect] 🧾 simpleMod = ${simpleMod}`);
    if (simpleMod) V.CE_SFflag = true;
    //logger.warn(`[cheat Extended][CEiconSFdetect] 🧾 V.CE_SFflag = ${V.CE_SFflag}`);
    //console.warn(`[cheat Extended][CEiconSFdetect] 🧾 V.CE_SFflag = ${V.CE_SFflag}`);
}
CEiconSFdetect();