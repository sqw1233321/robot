//车辆本身

import { _decorator, Component, EventKeyboard, Game, Input, input, IQuatLike, KeyCode, macro, math, Node, physics, PhysicsSystem2D, Quat, quat, RigidBody2D, v2, Vec2 } from 'cc';
import { CarAxel } from './CarAxel';
import { CarEngine } from './CarEngine';
import { MathUtil } from '../Util/MathUtil';
const { ccclass, property } = _decorator;

@ccclass('CarMain')
export class CarMain extends Component {
    @property(Node)
    carBody: Node;

    @property(Node)
    engineNode: Node;

    @property(Node)
    frontAxel: Node;

    @property(Node)
    rearAxel: Node;

    @property(Node)
    weightRedDot: Node;

    //参数：
    ///////////////////////////////////////////////////////////////////////
    private _cGHeight = 0.55;
    //惯性比率
    private _inertiaScale = 1.0;

    private _brakePower = 12000;

    private _eBrakePower = 5000;

    private _weightTransfer = 0.35;

    private _maxSteerAngle = 0.75;

    private _cornerStiffnessFront = 5.0;

    private _cornerStiffnessRear = 5.2;

    private _airResistance = 2.5;

    private _rollingResistance = 8.0;

    private _eBrakeGripRatioFront = 0.9;

    private _totalTireGripFront = 2.5;

    private _eBrakeGripRatioRear = 0.4;

    private _totalTireGripRear = 2.5;

    private _steerSpeed = 2.5;

    private _steerAdjustSpeed = 1;

    private _speedSteerCorrection = 300;

    private _speedTurningStability = 10;

    private _axleDistanceCorrection = 2;

    /////////////////////////////////////////////////////////////////////

    //惯性
    private _inertia = 1;
    //前后轴距
    private _wheelBase = 1;
    //同轴轮胎间距
    private _trackWidth = 1;

    //车头朝向
    private _headingAngle;
    //总速度（速度向量模长）
    private _absoluteVelocity;
    //角速度
    private _angularVelocity;
    //轮胎方向
    private _steerDirection;
    //轮胎滑移角
    private _steerAngle;

    //世界坐标速度
    private _velocity = new Vec2();
    //世界坐标加速度
    private _acceleration = new Vec2();
    //本地坐标速度
    private _localVelocity = new Vec2();
    //本地坐标加速度
    private _localAcceleration = new Vec2();

    //油门
    private _throttle: number = 0;
    //刹车
    private _brake: number = 0;
    //手刹
    private _eBrake: number = 0;

    //刚体
    private _carRb: RigidBody2D;
    //前轴
    private _axelFront: CarAxel;
    //后轴
    private _axelRear: CarAxel;
    //引擎
    private _engine: CarEngine;
    //重心
    private _centerOfGravity: Node;
    //车载摄像(暂未添加)
    private _carCamera: Node;


    /**
     * 获取线速度
     */
    public getVelocity() {
        return 100;
    }


    protected onLoad(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        this._carRb = this.node.addComponentSafe(RigidBody2D);
        this._axelFront = this.frontAxel.addComponentSafe(CarAxel);
        this._axelRear = this.rearAxel.addComponentSafe(CarAxel);
        this._engine = this.engineNode.addComponentSafe(CarEngine);
        this._centerOfGravity = this.weightRedDot;
        this.init();
    }

    private init() {
        this._velocity = Vec2.ZERO;
        this._absoluteVelocity = 0;

        //质心
        const dis = Vec2.distance(this._centerOfGravity.getWorldPosition(), this._axelFront.node.getWorldPosition());
        this._axelFront.setDistanceToCg(dis * this._axleDistanceCorrection);
        this._axelRear.setDistanceToCg(dis * this._axleDistanceCorrection);

        this._wheelBase = this._axelFront.getDistanceToCg() + this._axelRear.getDistanceToCg();
        this._inertia = this._carRb.getMass() * this._inertiaScale;

        // Set starting angle of car
        //Rigidbody2D.rotation = transform.rotation.eulerAngles.z;
        this._headingAngle = (this._carRb.node.rotation.z + 90) * MathUtil.deg2Rad;
    }

    protected start(): void {
        this._axelFront.init(this._carRb, this._wheelBase);
        this._axelRear.init(this._carRb, this._wheelBase);
        //假定前后轮同轴轮距是一样的？？？？？？？？？？？？？？？？？？？？？？？
        this._trackWidth = Vec2.distance(this._axelRear.getLeftTire().node.position, this._axelRear.getRightTire().node.position);
        this.schedule(() => { this._fixedUpdate() }, 0.02, macro.REPEAT_FOREVER);
    }

    private onKeyDown(event: EventKeyboard) {
        this._throttle = 0;
        this._brake = 0;
        this._eBrake = 0;
        let steerInput = 0;
        const code = event.keyCode;
        switch (code) {
            case KeyCode.ARROW_UP:
                this._throttle = 1;
                break;
            case KeyCode.ARROW_DOWN:
                this._throttle = -1;
                break;
            case KeyCode.ARROW_LEFT:
                steerInput = 1;
                break;
            case KeyCode.ARROW_RIGHT:
                steerInput = -1;
                break;
            case KeyCode.SPACE:
                this._eBrake = 1;
                break;
            case KeyCode.KEY_A:
                this._engine.ShiftUp();
                break;
            case KeyCode.KEY_Z:
                this._engine.ShiftDown();
                break;
        }

        // Apply filters to our steer direction
        this._steerDirection = this.smoothSteering(steerInput);
        this._steerDirection = this.speedAdjustedSteering(this._steerDirection);

        // Calculate the current angle the tires are pointing
        this._steerAngle = this._steerDirection * this._maxSteerAngle;

        // Set front axle tires rotation
        const rot: IQuatLike = {
            x: 0,
            y: 0,
            z: 0,
            w: 0
        };
        Quat.fromEuler(rot, 0, 0, MathUtil.rad2Deg * this._steerAngle);
        this._axelFront.getRightTire().node.setRotation(new Quat(rot.x, rot.y, rot.z));
        this._axelFront.getLeftTire().node.setRotation(new Quat(rot.x, rot.y, rot.z));
    }

    protected update(dt: number): void {

    }

    private _fixedUpdate() {
        // Update from rigidbody to retain collision responses
        this._velocity = this._carRb.linearVelocity;
        this._headingAngle = (this._carRb.node.rotation.z + 90) * MathUtil.deg2Rad;

        const sin = Math.sin(this._headingAngle);
        const cos = Math.cos(this._headingAngle);

        // Get local velocity
        this._localVelocity.x = cos * this._velocity.x + sin * this._velocity.y;
        this._localVelocity.y = cos * this._velocity.y - sin * this._velocity.x;

        // Weight transfer
        const transferX = this._weightTransfer * this._localAcceleration.x * this._cGHeight / this._wheelBase;
        const transferY = this._weightTransfer * this._localAcceleration.y * this._cGHeight / this._trackWidth * 20;		//exagerate the weight transfer on the y-axis

        // Weight on each axle
        const weightFront = this._carRb.getMass() * (this._axelFront.getWeightRatio() * -this.getGravity().y - transferX);
        const weightRear = this._carRb.getMass() * (this._axelRear.getWeightRatio() * -this.getGravity().y + transferX);

        // Weight on each tire
        this._axelFront.getLeftTire().activeWeight = weightFront - transferY;
        this._axelFront.getRightTire().activeWeight = weightFront + transferY;
        this._axelRear.getLeftTire().activeWeight = weightRear - transferY;
        this._axelRear.getRightTire().activeWeight = weightRear + transferY;

        // Velocity of each tire
        this._axelFront.getLeftTire().angularVelocity = this._axelFront.getDistanceToCg() * this._angularVelocity;
        this._axelFront.getRightTire().angularVelocity = this._axelFront.getDistanceToCg() * this._angularVelocity;
        this._axelRear.getLeftTire().angularVelocity = -this._axelRear.getDistanceToCg() * this._angularVelocity;
        this._axelRear.getRightTire().angularVelocity = -this._axelRear.getDistanceToCg() * this._angularVelocity;

        // Slip angle
        const frontSlipAngle = Math.atan2(this._localVelocity.y + this._axelFront.getAngularVelocity(), Math.abs(this._localVelocity.x)) - Math.sign(this._localVelocity.x) * this._steerAngle;
        const rearSlipAngle = Math.atan2(this._localVelocity.y + this._axelRear.getAngularVelocity(), Math.abs(this._localVelocity.x));
        this._axelFront.setSlipAngle(frontSlipAngle);
        this._axelRear.setSlipAngle(rearSlipAngle);

        // Brake and Throttle power
        const activeBrake = Math.min(this._brake * this._brakePower + this._eBrake * this._eBrakePower, this._brakePower);
        const activeThrottle = (this._throttle * this._engine.GetTorque(this)) * (this._engine.getGearRatio() * this._engine.getEffectiveGearRatio());

        // Torque of each tire (rear wheel drive)
        this._axelRear.getLeftTire().torque = activeThrottle / this._axelRear.getLeftTire().radius;
        this._axelRear.getRightTire().torque = activeThrottle / this._axelRear.getRightTire().radius;

        // Grip and Friction of each tire
        this._axelFront.getLeftTire().grip = this._totalTireGripFront * (1.0 - this._eBrake * (1.0 - this._eBrakeGripRatioFront));
        this._axelFront.getRightTire().grip = this._totalTireGripFront * (1.0 - this._eBrake * (1.0 - this._eBrakeGripRatioFront));
        this._axelRear.getLeftTire().grip = this._totalTireGripFront * (1.0 - this._eBrake * (1.0 - this._eBrakeGripRatioRear));
        this._axelRear.getRightTire().grip = this._totalTireGripFront * (1.0 - this._eBrake * (1.0 - this._eBrakeGripRatioRear));

        this._axelFront.getLeftTire().frictionForce = MathUtil.clamp(-this._cornerStiffnessFront * this._axelFront.getSlipAngle(), -this._axelFront.getLeftTire().grip, this._axelFront.getLeftTire().grip) * this._axelFront.getLeftTire().activeWeight;
        this._axelFront.getRightTire().frictionForce = MathUtil.clamp(-this._cornerStiffnessFront * this._axelFront.getSlipAngle(), -this._axelFront.getRightTire().grip, this._axelFront.getRightTire().grip) * this._axelFront.getRightTire().activeWeight;
        this._axelRear.getLeftTire().frictionForce = MathUtil.clamp(-this._cornerStiffnessRear * this._axelRear.getSlipAngle(), -this._axelRear.getLeftTire().grip, this._axelRear.getLeftTire().grip) * this._axelRear.getLeftTire().activeWeight;
        this._axelRear.getRightTire().frictionForce = MathUtil.clamp(-this._cornerStiffnessRear * this._axelRear.getSlipAngle(), -this._axelRear.getRightTire().grip, this._axelRear.getRightTire().grip) * this._axelRear.getRightTire().activeWeight;

        // Forces
        const tractionForceX = this._axelRear.getTorque() - activeBrake * Math.sign(this._localVelocity.x);
        const tractionForceY = 0;

        const dragForceX = -this._rollingResistance * this._localVelocity.x - this._airResistance * this._localVelocity.x * Math.abs(this._localVelocity.x);
        const dragForceY = -this._rollingResistance * this._localVelocity.y - this._airResistance * this._localVelocity.y * Math.abs(this._localVelocity.y);

        let totalForceX = dragForceX + tractionForceX;
        let totalForceY = dragForceY + tractionForceY + Math.cos(this._steerAngle) * this._axelFront.getFrictionForce() + this._axelRear.getFrictionForce();

        //adjust Y force so it levels out the car heading at high speeds
        if (this._absoluteVelocity > 10) {
            totalForceY *= (this._absoluteVelocity + 1) / (21.0 - this._speedTurningStability);
        }

        // If we are not pressing gas, add artificial drag - helps with simulation stability
        if (this._throttle == 0) {
            Vec2.lerp(this._velocity, this._velocity, Vec2.ZERO, 0.005);
        }

        // Acceleration
        this._localAcceleration.x = totalForceX / this._carRb.getMass();
        this._localAcceleration.y = totalForceY / this._carRb.getMass();

        this._acceleration.x = cos * this._localAcceleration.x - sin * this._localAcceleration.y;
        this._acceleration.y = sin * this._localAcceleration.x + cos * this._localAcceleration.y;

        const deltaTime = Game.prototype.frameTime;
        // Velocity and speed
        this._velocity.x += this._acceleration.x * deltaTime;
        this._velocity.y += this._acceleration.y * deltaTime;

        this._absoluteVelocity = Vec2.len(this._velocity);

        // Angular torque of car
        let angularTorque = (this._axelFront.getFrictionForce() * this._axelFront.getDistanceToCg()) - (this._axelRear.getFrictionForce() * this._axelRear.getDistanceToCg());

        // Car will drift away at low speeds
        if (this._absoluteVelocity < 0.5 && activeThrottle == 0) {
            this._localAcceleration = Vec2.ZERO;
            this._absoluteVelocity = 0;
            this._velocity = Vec2.ZERO;
            angularTorque = 0;
            this._angularVelocity = 0;
            this._acceleration = Vec2.ZERO;
            this._carRb.angularVelocity = 0;
        }

        const angularAcceleration = angularTorque / this._inertia;

        // Update 
        this._angularVelocity += angularAcceleration * deltaTime;

        // Simulation likes to calculate high angular velocity at very low speeds - adjust for this
        if (this._absoluteVelocity < 1 && Math.abs(this._steerAngle) < 0.05) {
            this._angularVelocity = 0;
        } else if (this.getSpeedKilometersPerHour() < 0.75) {
            this._angularVelocity = 0;
        }

        this._headingAngle += this._angularVelocity * deltaTime;
        this._carRb.linearVelocity = this._velocity;

        // this._carRb.MoveRotation(MathUtil.rad2Deg * this._headingAngle - 90);
    }

    //平滑转向
    private smoothSteering(steerInput: number) {
        let steer = 0;
        const deltaTime = Game.prototype.frameTime;
        if (Math.abs(steerInput) > 0.001) {
            steer = MathUtil.clamp(this._steerDirection + steerInput * deltaTime * this._steerSpeed, -1.0, 1.0);
        }
        else {
            if (this._steerDirection > 0) {
                steer = Math.max(this._steerDirection - deltaTime * this._steerAdjustSpeed, 0);
            }
            else if (this._steerDirection < 0) {
                steer = Math.min(this._steerDirection + deltaTime * this._steerAdjustSpeed, 0);
            }
        }
        return steer;
    }

    private speedAdjustedSteering(steerInput: number) {
        const activeVelocity = Math.min(this._absoluteVelocity, 250.0);
        const steer = steerInput * (1.0 - (this._absoluteVelocity / this._speedSteerCorrection));
        return steer;
    }

    private getGravity() {
        return PhysicsSystem2D.instance.gravity;
    }


    public getSpeedKilometersPerHour() {
        return Vec2.len(this._carRb.linearVelocity) * 18.0 / 5.0;
    }

}

