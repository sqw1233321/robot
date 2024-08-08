//引擎

import { _decorator, Component, lerp, Node } from 'cc';
import { CarConfig } from './CarConfig';
import { CarMain } from './CarMain';
const { ccclass, property } = _decorator;

@ccclass('CarEngine')
export class CarEngine extends Component {
    //转速对应扭矩
    private _torqueCurve: number[] = [100, 280, 325, 420, 460, 340, 300, 100];
    //档位对应输入输出轮齿比
    private _gearRatios: number[] = [5.8, 4.5, 3.74, 2.8, 1.6, 0.79, 4.2];
    //当前档位
    private _currentGear: number = 1;
    /**
     * 获取当前档位
     */
    public getCurrentGear() {
        return this._currentGear;
    }

    /**
     * 获取当前轮齿比
     */
    public getGearRatio() {
        return this._gearRatios[this._currentGear];
    }

    /**
     * 获取有效轮齿比
     */
    public getEffectiveGearRatio() {
        return this._gearRatios[this._gearRatios.length - 1];
    }

    /**升档 */
    public ShiftUp() {
        if (this._currentGear >= CarConfig.maxShift) {
            this._currentGear = CarConfig.maxShift;
            return;
        }
        this._currentGear++;
    }

    /**降档 */
    public ShiftDown() {
        if (this._currentGear <= 0) {
            this._currentGear = 0;
            return;
        }
        this._currentGear--;
    }

    /**
     * 获取扭矩
     * @param car 
     * @returns 
     */
    public GetTorque(car: CarMain) {
        return this.RpmToTorque(this.GetRPM(car));
    }

    /**
     * 获取转速
     * @param car 
     * @returns 
     */
    public GetRPM(car: CarMain) {
        return car.getVelocity() / (Math.PI * 2 / 60.0) * (this.getGearRatio() * this.getEffectiveGearRatio());
    }

    //转速转扭矩
    private RpmToTorque(rpm: number) {
        const convert = 1000.0;
        if (rpm < 1000) {
            return lerp(this._torqueCurve[0], this._torqueCurve[1], rpm / convert);
        } else if (rpm < 2000) {
            return lerp(this._torqueCurve[1], this._torqueCurve[2], (rpm - 1000) / convert);
        } else if (rpm < 3000) {
            return lerp(this._torqueCurve[2], this._torqueCurve[3], (rpm - 2000) / convert);
        } else if (rpm < 4000) {
            return lerp(this._torqueCurve[3], this._torqueCurve[4], (rpm - 3000) / convert);
        } else if (rpm < 5000) {
            return lerp(this._torqueCurve[4], this._torqueCurve[5], (rpm - 4000) / convert);
        } else if (rpm < 6000) {
            return lerp(this._torqueCurve[5], this._torqueCurve[6], (rpm - 5000) / convert);
        } else if (rpm < 7000) {
            return lerp(this._torqueCurve[6], this._torqueCurve[7], (rpm - 6000) / convert);
        } else {
            return this._torqueCurve[6];
        }

    }

    // public void UpdateAutomaticTransmission(Rigidbody2D rb) {
	// 	float rpm = GetRPM(rb);

    //     if (rpm > 6200) {
    //         if (CurrentGear < 5)
    //             CurrentGear++;
    //     } else if (rpm < 2000) {
    //         if (CurrentGear > 0)
    //             CurrentGear--;
    //     }
    // }

}

