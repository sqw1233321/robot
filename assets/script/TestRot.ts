import { _decorator, Component, Node, Quat, Vec3 } from 'cc';
import { MathUtil } from './Util/MathUtil';
const { ccclass, property } = _decorator;

@ccclass('TestRot')
export class TestRot extends Component {
    private _accumulatedAngle = 0;

    private _headingAngle: number = 0;

    update(deltaTime: number) {
        const nowRot = this.node.getRotation();
        const nowAngular = new Vec3();
        nowRot.getEulerAngles(nowAngular);
        const eulerZ = nowAngular.z;  // 假设我们只关心 z 轴的旋转角度
        const normalizedAngle = (eulerZ + 360) % 360;

        //console.log("累积角度 (度): ", normalizedAngle);

        // 每帧增加 45 度（可以根据需要调整）
        const angleIncrementDegrees = 45;

        // 将角度增量转换为弧度增量
        const angleIncrementRadians = angleIncrementDegrees * Math.PI / 180;

        // 计算每帧的旋转增量
        const rotationDelta = angleIncrementRadians * deltaTime;

        // 累积弧度
        this._accumulatedAngle += rotationDelta;

        // 将累积的弧度转换为度数，以便于设置旋转
        this._headingAngle = this._accumulatedAngle * 180 / Math.PI;

        // 如果角度超过 360 度，则将其限制在 0 到 360 度之间
        const clampedAngle = this._headingAngle % 360;

        // 直接从欧拉角设置旋转
        this.node.setRotationFromEuler(0, 0, clampedAngle);
    }
}

