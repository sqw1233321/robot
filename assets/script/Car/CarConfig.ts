//车辆一些属性配置

import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CarConfig')
export class CarConfig {
    //最大档位
    static maxShift = 5;
}

