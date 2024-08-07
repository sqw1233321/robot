//车轴

import { _decorator, Component, Node, PhysicsSystem2D, RigidBody, RigidBody2D } from 'cc';
import { CarTire } from './CarTire';
const { ccclass, property } = _decorator;

@ccclass('CarAxel')
export class CarAxel extends Component {
    @property(Node)
    leftTireNd: Node;
    @property(Node)
    rightTireNd: Node;
    private _leftTire: CarTire;
    private _rightTire: CarTire;

    //离重心的距离
    private _distanceToCg: number;
    //重心影响比率
    private _weightRatio: number;
    //滑移角
    private _slipAngle: number;
    //摩擦力
    private _frictionForce: number

    onLoad() {
        this._leftTire = this.leftTireNd.addComponentSafe(CarTire);
        this._rightTire = this.rightTireNd.addComponentSafe(CarTire);
    }


    /**
     * 摩擦力
     */
    public getFrictionForce() {
        return (this._leftTire.frictionForce + this._rightTire.frictionForce) / 2;
    }

    public getDistanceToCg() {
        return this._distanceToCg;
    }

    public setDistanceToCg(dis: number) {
        this._distanceToCg = dis;
    }

    public getWeightRatio() {
        return this._weightRatio;
    }

    public setWeightRatio(ratio: number) {
        this._weightRatio = ratio;
    }

    //偏滑角
    public getSlipAngle() {
        return this._slipAngle;
    }

    public setSlipAngle(angle: number) {
        this._slipAngle = angle;
    }

    //为什么传入的参数是+ ？？？？？？？？？？？？？？？？？
    public getAngularVelocity() {
        return Math.min(this._leftTire.angularVelocity + this._rightTire.angularVelocity);
    }

    /**
     * 扭矩
     */
    public getTorque() {
        return (this._leftTire.torque + this._rightTire.torque) / 2.0;
    }

    public getLeftTire() {
        return this._leftTire;
    }

    public getRightTire() {
        return this._rightTire;
    }


    public init(carRb: RigidBody2D, wheelBase: number) {
        //重力贡献到每个轴和轮胎上
        this._weightRatio = this._distanceToCg / wheelBase;
        //计算每个轮胎上剩余的重量
        const carMass = carRb.getMass();
        const weight = carMass * (this._weightRatio * PhysicsSystem2D.instance.gravity.y);
        this._leftTire.restingWeight = weight;
        this._rightTire.restingWeight = weight;
    }
}

