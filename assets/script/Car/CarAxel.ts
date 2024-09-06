//车轴

import { _decorator, Component, Node, PhysicsSystem2D, RigidBody, RigidBody2D, Vec2 } from 'cc';
import { CarTire } from './CarTire';
import { CarMain } from './CarMain';
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
    private _frictionForce: number;

    private _gravity = new Vec2(0, 9.81);

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


    public init(carRb: CarMain, wheelBase: number) {
        this._weightRatio = this._distanceToCg / wheelBase;
        const carMass = carRb.carMass;
        const weight = carMass * (this._weightRatio * this._gravity.y);
        this._leftTire.restingWeight = weight;
        this._rightTire.restingWeight = weight;
    }


}

