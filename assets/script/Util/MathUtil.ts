import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MathUtil')
export class MathUtil {
    public static deg2Rad = Math.PI / 180.0;
    public static rad2Deg = 180.0 / Math.PI;

    public static clamp(value: number, min: number, max: number) {
        if (value < min) {
            return min;
        }
        else if (value > max) {
            return max;
        }
        else {
            return value;
        }
    }
}

