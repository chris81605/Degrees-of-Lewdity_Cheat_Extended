function getTargetWarmth2(targetTemperature) {
    let low = -100;
    let high = 100;
    let bestWarmth = null;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const temp = Weather.BodyTemperature.getRestingPoint(8, mid, 37, true);

        if (temp > targetTemperature) {
            bestWarmth = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }

    return bestWarmth;
}
window.getTargetWarmth2 = getTargetWarmth2;