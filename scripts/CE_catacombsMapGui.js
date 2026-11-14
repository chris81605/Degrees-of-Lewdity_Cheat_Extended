/*=========================================
 Cheat Extended - Catacombs Map GUI
 地下墓穴：依實際造訪逐步揭露節點，探索紀錄跟隨存檔。
 僅讀取原版房間與事件狀態，不改動移動及事件判定。
=========================================*/
(() => {
    "use strict";
    const ID = "ce-catacombs-map-gui";
    const ROOMS = [
        ["Catacombs", "入口", 280, 65, "catacombs"],
        ["Catacombs Sarcophagi", "石棺", 420, 145, "sarcophagi"],
        ["Catacombs Chasm", "深淵", 420, 230, "chasm"],
        ["Catacombs Prison", "監牢", 140, 145, "prison"],
        ["Catacombs Ridge", "崖壁", 140, 230, "ridge"],
        ["Catacombs Mud", "泥地", 140, 315, "mud"],
        ["Catacombs Masonry", "崩塌石道", 140, 400, "masonry"],
        ["Catacombs Barrow", "墳丘", 140, 485, "barrow"],
        ["Catacombs Stream", "溪流", 140, 570, "stream"],
        ["Catacombs Stalagmites", "岩峰", 140, 655, "stalagmites"],
        ["Catacombs Bores", "鑽孔區", 420, 655, "bores"],
        ["Catacombs Engravings", "骨雕石壁", 420, 740, "engravings"],
        ["Catacombs Museum", "碎玻璃區", 420, 825, "museum"],
        ["Catacombs Statues", "雕像", 420, 910, "statues"],
        ["Catacombs Compound", "機械遺跡", 420, 995, "compound"]
    ];
    // 通道以原版主要 Passage 的實際連結為準。
    const EDGES = [[0,1],[0,3],[1,2],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14]];
    const SPECIAL = [[4,5],[9,10]]; // 攀爬通道
    // 依原版 Passage 移動選項記錄「從 a 到 b」的實際移動方向（包含攀爬上／下），與地圖視覺方位無關。
    // 反向通行時顯示相反方向；特殊捷徑不套用一般通道方向。
    const EDGE_DIRECTIONS = ["東", "西", "東", "西", "下", "東", "東", "東", "東", "上", "北", "北", "北", "北"];
    const OPPOSITE = { "東":"西", "西":"東", "南":"北", "北":"南", "上":"下", "下":"上" };
    const roomIndex = new Map(ROOMS.map((r,i) => [r[0],i]));
    const busIndex = new Map(ROOMS.map((r,i) => [r[4],i]));
    let view;

    function store() {
        if (!V.catacombsMapDiscovered || typeof V.catacombsMapDiscovered !== "object" || Array.isArray(V.catacombsMapDiscovered)) {
            V.catacombsMapDiscovered = {};
        }
        return V.catacombsMapDiscovered;
    }
    function currentRoom() {
        // 水晶是機械遺跡內的互動頁面，沿用同一地圖節點。
        if (State.passage === "Catacombs Crystal" || State.passage === "Catacombs Crystal 2") return roomIndex.get("Catacombs Compound");
        const exact = roomIndex.get(State.passage);
        if (exact !== undefined) return exact;
        if (!State.passage.startsWith("Catacombs")) return -1;
        // 事件頁面只用於定位，不作為新房間探索證據。
        const bus = String(V.bus || "").toLowerCase().replace(/^catacombs[\s_-]*/, "").trim();
        return busIndex.get(bus) ?? -1;
    }
    function visibleNodes(found) {
        const result = new Set(found);
        for (const [a,b] of EDGES) {
            if (found.has(a)) result.add(b);
            if (found.has(b)) result.add(a);
        }
        return result;
    }
    function svgEl(tag, attributes, label) {
        const node = document.createElementNS("http://www.w3.org/2000/svg",tag);
        for (const [key,val] of Object.entries(attributes)) node.setAttribute(key,String(val));
        if (label !== undefined) node.textContent = label;
        return node;
    }
    function drawEdge(svg,a,b,style) {
        const ra=ROOMS[a], rb=ROOMS[b];
        svg.appendChild(svgEl("line",{
            x1:ra[2],y1:ra[3],x2:rb[2],y2:rb[3],
            stroke:style === "shortcut" ? "#e5ae62" : "#7798ac",
            "stroke-width":style === "shortcut" ? 3 : 3,
            "stroke-dasharray":style === "shortcut" || style === "unknown" ? "7 6" : "none",
            opacity:style === "unknown" ? .48 : .85
        }));
    }
    function drawDirection(svg,a,b,direction,current) {
        // 標記只顯示在已揭露的通道上，保持 12px 直徑與 9px 字級。
        // 當玩家站在 b 端時，改為顯示由 b 返回 a 的實際方向。
        const ra=ROOMS[a], rb=ROOMS[b];
        const label=current === b ? OPPOSITE[direction] : direction;
        const x=(ra[2]+rb[2])/2, y=(ra[3]+rb[3])/2;
        const group=svgEl("g",{"pointer-events":"none"});
        group.appendChild(svgEl("circle",{cx:x,cy:y,r:6,fill:"#1b3443",stroke:"#8cb0c4","stroke-width":.8}));
        group.appendChild(svgEl("text",{x,y:y+3,"text-anchor":"middle","font-size":9,"font-weight":"bold",fill:"#e8f5fa"},label));
        svg.appendChild(group);
    }
    function drawNode(svg,index,found,current) {
        const r=ROOMS[index], explored=found.has(index), here=index === current;
        const group=svgEl("g",{});
        group.appendChild(svgEl("rect",{
            x:r[2]-55,y:r[3]-20,width:110,height:40,rx:8,
            fill:here ? "#257fa6" : explored ? "#31566d" : "#26343e",
            stroke:here ? "#ffffff" : explored ? "#76b5d2" : "#697b87",
            "stroke-width":here ? 3 : 1.5
        }));
        group.appendChild(svgEl("text",{
            x:r[2],y:r[3]+5,"text-anchor":"middle", "font-size":14,
            fill:explored ? "#ffffff" : "#a6b3bb"
        },explored ? r[1] : "？？？"));
        if (here) group.appendChild(svgEl("circle",{
            cx:r[2]+48,cy:r[3]-17,r:7,fill:"#70e8a9",stroke:"#fff","stroke-width":2
        }));
        svg.appendChild(group);
    }
    function render() {
        view.clear();
        // 戰鬥中不顯示地圖，也不將戰鬥頁面計入探索紀錄。
        if (V.combat === 1 || V.combat === true) return;
        if (!V.CE_CatacombsMapGUI || !State.passage.startsWith("Catacombs")) return;
        const index=currentRoom();
        if (index < 0) return;
        const target=document.querySelector("#passage-content") || document.querySelector("#passages");
        if (!target) return;
        const data=store();
        // 僅在實際抵達主要房間時解除迷霧。
        if (roomIndex.has(State.passage)) data[ROOMS[index][4]]=true;
        // 必須實際進入特殊捷徑 Passage 才揭露捷徑。
        if (State.passage === "Catacombs Chasm Coax 2" || State.passage === "Catacombs Bores Coax 2") data.shortcutChasmBores=true;
        const found=new Set(ROOMS.map((r,i)=>data[r[4]] ? i : -1).filter(i=>i>=0));
        const visible=visibleNodes(found);
        const root=document.createElement("div");
        root.id=ID;
        root.style.cssText="margin:0 0 1.2em;padding:12px;background:#172b39;color:#e7f2f8;border:1px solid #41687d;border-radius:9px";
        const header=document.createElement("div");
        header.style.cssText="display:flex;justify-content:space-between;gap:8px;margin-bottom:10px";
        const title=document.createElement("strong"); title.textContent="地下墓穴探索導覽圖";
        const count=document.createElement("span"); count.textContent=found.size+" / "+ROOMS.length;
        header.append(title,count);
        const scroll=document.createElement("div");
        scroll.style.cssText="overflow:auto;max-height:400px;border:1px solid #365164;border-radius:6px;background:#101f2b";
        const svg=svgEl("svg",{viewBox:"0 0 560 1050",width:560,height:1050,style:"display:block"});
        const shownEdges=[];
        for (const [edgeIndex,[a,b]] of EDGES.entries()) {
            if (!visible.has(a) || !visible.has(b) || (!found.has(a) && !found.has(b))) continue;
            drawEdge(svg,a,b,found.has(a) && found.has(b) ? (SPECIAL.some(([x,y])=>x===a&&y===b) ? "shortcut" : "normal") : "unknown");
            shownEdges.push([a,b,EDGE_DIRECTIONS[edgeIndex]]);
        }
        if (data.shortcutChasmBores && found.has(2) && found.has(10)) drawEdge(svg,2,10,"shortcut");
        for (const [a,b,direction] of shownEdges) drawDirection(svg,a,b,direction,index);
        for (const i of visible) drawNode(svg,i,found,index);
        scroll.appendChild(svg);
        const foot=document.createElement("div");
        foot.style.cssText="font-size:12px;opacity:.8;margin-top:9px";
        foot.textContent="● 目前位置　？？？ 未探索　虛線：未知或特殊通道";
        root.append(header,scroll,foot);
        view.own(root);
        target.prepend(root);
        view.frame(()=>{
            const r=ROOMS[index];
            scroll.scrollLeft=Math.max(0,r[2]-scroll.clientWidth/2);
            scroll.scrollTop=Math.max(0,r[3]-scroll.clientHeight/2);
        });
    }
    view=setup.CE_mapView(ID,render);
})();
