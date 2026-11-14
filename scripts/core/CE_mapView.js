/* CE 地圖專用生命週期工具：不依賴功能註冊框架。 */
setup.CE_mapView = (id, render, disconnect = () => {}) => {
    let epoch = 0, timer, root;
    const frames = new Set();
    function clear() {
        epoch++;
        clearTimeout(timer); timer = undefined;
        for (const handle of frames) cancelAnimationFrame(handle);
        frames.clear();
        disconnect();
        root?.remove(); root = undefined;
    }
    function guard(callback, node = root) {
        const generation = epoch, state = V;
        return (...args) => {
            if (generation === epoch && V === state && node?.isConnected) callback(...args);
        };
    }
    function frame(callback) {
        const run = guard(callback);
        const handle = requestAnimationFrame(() => { frames.delete(handle); run(); });
        frames.add(handle);
        return handle;
    }
    function schedule() {
        clear();
        const generation = epoch, state = V;
        const handle = setTimeout(() => {
            if (timer === handle) timer = undefined;
            if (generation === epoch && V === state) render();
        }, 0);
        timer = handle;
    }
    // 每個地圖實例只管理自己的事件及 DOM。
    const namespace = `.CEMapView_${id.replace(/[^\w]/g, '_')}`;
    $(document).off(namespace)
        .on(':passagestart' + namespace, clear)
        .on(':passagedisplay' + namespace, schedule);
    Save.onLoad.add(clear);
    schedule();
    return {
        clear, frame, guard,
        cancelFrame(handle) { cancelAnimationFrame(handle); frames.delete(handle); },
        own(node) { root = node; }
    };
};
