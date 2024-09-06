//车辆本身

import { _decorator, Component, Director, director, error, EventKeyboard, Input, input, instantiate, IQuatLike, JsonAsset, KeyCode, Label, macro, math, Node, PhysicsSystem, PhysicsSystem2D, Quat, resources, RigidBody2D, v2, v3, Vec2, Vec3 } from 'cc';
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

    @property(Node)
    carCamera: Node;

    @property(Node)
    uiNode: Node;

    @property(Node)
    cameraAll: Node;

    @property(Node)
    parentNd: Node;

    //参数：
    ///////////////////////////////////////////////////////////////////////
    private _cGHeight = 0.55;
    //惯性比率
    private _inertiaScale = 1.0;

    private _brakePower = 12000;

    private _eBrakePower = 4800;

    private _weightTransfer = 0.24;

    private _maxSteerAngle = 0.797;

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

    private _speedSteerCorrection = 295;

    private _speedTurningStability = 11.8;

    private _axleDistanceCorrection = 1.7;

    /////////////////////////////////////////////////////////////////////
    //遥测数据
    public carMass: number = 1500;

    private _rpm: number;
    private _gear: number;

    private _tireFLWeight: number;
    private _tireFRWeight: number;
    private _tireRLWeight: number;
    private _tireRRWeight: number;

    private _tireFLFriction: number;
    private _tireFRFriction: number;
    private _tireRLFriction: number;
    private _tireRRFriction: number;


    private _leftTorque: number;
    private _rightTorque: number;

    private _frontSlipAngle: number;
    private _rearSlipAngle: number;

    private _angularTorque: number;


    //惯性
    private _inertia = 1;
    //前后轴距
    private _wheelBase = 1;
    //同轴轮胎间距
    private _trackWidth = 1;

    //车头朝向
    private _headingAngle = 0;
    private _accumulatedAngle = 0;
    //总速度（速度向量模长）
    private _absoluteVelocity = 0;
    //角速度
    private _angularVelocity = 0;
    //轮胎方向
    private _steerDirection = 0;
    //轮胎滑移角
    private _steerAngle = 0;

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
    //扭矩
    private _torque: number;

    private _deltaTime: number = 0;


    //显示UI
    private _allKey: string[] = [];
    private _carDatObj: [];

    private _pressCodeDirect: number = 0;
    private _pressCodeRotate: number = 0;

    private _gravity = new Vec2(0, 9.81);

    /**
     * 获取线速度
     */
    public getVelocity(): number {
        return this._absoluteVelocity;
    }

    private setPhysics() {
        const physicsSystem = PhysicsSystem2D.instance;
        physicsSystem.velocityIterations = 8;
        physicsSystem.positionIterations = 3;
    }


    protected onLoad(): void {
        this.setPhysics();
        resources.load('carDatJson', (err: any, res: JsonAsset) => {
            if (err) {
                error(err.message || err);
                return;
            }
            this._carDatObj = res.json! as [];
        })
        this._allKey = Object.keys(this);
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        this._carRb = this.parentNd.addComponentSafe(RigidBody2D);
        this._axelFront = this.frontAxel.addComponentSafe(CarAxel);
        this._axelRear = this.rearAxel.addComponentSafe(CarAxel);
        this._engine = this.engineNode.addComponentSafe(CarEngine);
        this._centerOfGravity = this.weightRedDot;
        this.init();
    }

    private init() {
        this._localVelocity = v2(0, 0);
        this._velocity = v2(0, 0);
        this._absoluteVelocity = 0;
        this._localAcceleration = v2(0, 0);

        //质心
        const disF = Vec2.distance(this._centerOfGravity.getWorldPosition(), this._axelFront.node.getWorldPosition());
        const disR = Vec2.distance(this._centerOfGravity.getWorldPosition(), this._axelRear.node.getWorldPosition());
        this._axelFront.setDistanceToCg(disF * this._axleDistanceCorrection / 100);
        this._axelRear.setDistanceToCg(disR * this._axleDistanceCorrection / 100);

        this._wheelBase = this._axelFront.getDistanceToCg() + this._axelRear.getDistanceToCg();
        this._inertia = this.carMass * this._inertiaScale;

        // Set starting angle of car
        this._headingAngle = this._carRb.node.getRotation().z + Math.PI / 2;
    }

    protected start(): void {
        this._axelFront.init(this, this._wheelBase);
        this._axelRear.init(this, this._wheelBase);
        this._trackWidth = Vec2.distance(this._axelRear.getLeftTire().node.position, this._axelRear.getRightTire().node.position);
        director.on(Director.EVENT_BEFORE_PHYSICS, this._fixedUpdate, this);
    }

    private onKeyDown(event: EventKeyboard) {
        const code = event.keyCode;
        if (code == KeyCode.ARROW_UP || code == KeyCode.ARROW_DOWN) this._pressCodeDirect = code;
        else if (code == KeyCode.ARROW_LEFT || code == KeyCode.ARROW_RIGHT) this._pressCodeRotate = code;
    }

    private onKeyUp(event: EventKeyboard) {
        const code = event.keyCode;
        if (code == KeyCode.ARROW_UP || code == KeyCode.ARROW_DOWN) this._pressCodeDirect = 0
        else if (code == KeyCode.ARROW_LEFT || code == KeyCode.ARROW_RIGHT) this._pressCodeRotate = 0;
    }

    protected update(dt: number): void {
        console.log("update");
        this._deltaTime = dt;
        this.updateCar();
        this.updateRedDot();
        this.updateUI();
        // //漂移线
        if (Math.abs(this._localAcceleration.y) > 18 || this._eBrake == 1) {
            console.log("开启漂移线");
            // AxleRear.TireRight.SetTrailActive(true);
            // AxleRear.TireLeft.SetTrailActive(true);
        } else {
            console.log("关闭漂移线");
            // AxleRear.TireRight.SetTrailActive(false);
            // AxleRear.TireLeft.SetTrailActive(false);
        }
        this._engine.updateAutomaticTransmission(this);
    }

    private _fixedUpdate() {
        console.log("fixedUpdate");
        this.calCarStatus();
        this.setOtherShowDat();
    }

    private calCarStatus() {
        const dt = PhysicsSystem2D.instance.fixedTimeStep;
        const linearvX = this._carRb.linearVelocity.x;
        const linearvY = this._carRb.linearVelocity.y;
        this._velocity.x = linearvX;
        this._velocity.y = linearvY;
        this._headingAngle = this._accumulatedAngle + Math.PI / 2;

        const sin = Math.sin(this._headingAngle);
        const cos = Math.cos(this._headingAngle);

        // Get local velocity
        this._localVelocity.x = cos * this._velocity.x + sin * this._velocity.y;
        this._localVelocity.y = cos * this._velocity.y - sin * this._velocity.x;

        // Weight transfer
        const transferX = this._weightTransfer * this._localAcceleration.x * this._cGHeight / this._wheelBase;
        const transferY = this._weightTransfer * this._localAcceleration.y * this._cGHeight / this._trackWidth * 20;

        // Weight on each axle
        const weightFront = this.carMass * (this._axelFront.getWeightRatio() * this.getGravity().y - transferX);
        const weightRear = this.carMass * (this._axelRear.getWeightRatio() * this.getGravity().y + transferX);

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
        const frontSlipAngle = Math.atan2(this._localVelocity.y + this._axelFront.getAngularVelocity(), Math.abs(this._localVelocity.x)) - MathUtil.sign(this._localVelocity.x) * this._steerAngle;
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
        this._axelRear.getLeftTire().grip = this._totalTireGripRear * (1.0 - this._eBrake * (1.0 - this._eBrakeGripRatioRear));
        this._axelRear.getRightTire().grip = this._totalTireGripRear * (1.0 - this._eBrake * (1.0 - this._eBrakeGripRatioRear));

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
        this._localAcceleration.x = totalForceX / this.carMass;
        this._localAcceleration.y = totalForceY / this.carMass;

        this._acceleration.x = cos * this._localAcceleration.x - sin * this._localAcceleration.y;
        this._acceleration.y = sin * this._localAcceleration.x + cos * this._localAcceleration.y;

        // Velocity and speed
        this._velocity.x += this._acceleration.x * dt;
        this._velocity.y += this._acceleration.y * dt;

        this._absoluteVelocity = this.getMagnitidute(this._velocity);
        //力矩主要来源于摩擦力
        let angularTorque = (this._axelFront.getFrictionForce() * this._axelFront.getDistanceToCg()) - (this._axelRear.getFrictionForce() * this._axelRear.getDistanceToCg());
        this._angularTorque = angularTorque;

        // 汽车低速且无油门时直接刹停
        if (this._absoluteVelocity < 0.5 && activeThrottle == 0) {
            this._localAcceleration = v2(0, 0);
            this._absoluteVelocity = 0;
            this._velocity = v2(0, 0);
            angularTorque = 0;
            this._angularVelocity = 0;
            this._acceleration = v2(0, 0);
            this._carRb.angularVelocity = 0;
        }

        //角加速度   角力矩 除以惯性
        const angularAcceleration = angularTorque / this._inertia;
        // 通过角加速度更新角速度
        this._angularVelocity += angularAcceleration * dt;

        // 更正低速时角加速度过高
        if (this._absoluteVelocity < 1 && Math.abs(this._steerAngle) < 0.05) {
            this._angularVelocity = 0;
        } else if (this.getSpeedKilometersPerHour(linearvX, linearvY) < 0.75) {
            this._angularVelocity = 0;
        }

        //汽车指向角度（弧度）
        this._accumulatedAngle += this._angularVelocity * dt;
        this._headingAngle = this._accumulatedAngle * 180 / Math.PI;
        const clampedAngle = this._headingAngle % 360;
        this.node.setRotationFromEuler(0, 0, clampedAngle);

        //汽车速度更新
        this._carRb.linearVelocity = this._velocity;
    }

    private setOtherShowDat() {
        this._tireFLWeight = this._axelFront.getLeftTire().activeWeight;
        this._tireFRWeight = this._axelFront.getRightTire().activeWeight;
        this._tireRLWeight = this._axelRear.getLeftTire().activeWeight;
        this._tireRRWeight = this._axelRear.getRightTire().activeWeight;
        this._tireFLFriction = this._axelFront.getLeftTire().frictionForce;
        this._tireFRFriction = this._axelFront.getRightTire().frictionForce;
        this._tireRLFriction = this._axelRear.getLeftTire().frictionForce;
        this._tireRRFriction = this._axelRear.getRightTire().frictionForce;
        this._rpm = this._engine.GetRPM(this);
        this._gear = this._engine.getCurrentGear();
        this._torque = this._engine.GetTorque(this);
        this._leftTorque = this._axelRear.getLeftTire().torque;
        this._rightTorque = this._axelRear.getRightTire().torque;
        this._frontSlipAngle = this._axelFront.getSlipAngle();
        this._rearSlipAngle = this._axelRear.getSlipAngle();
    }

    //平滑转向
    private smoothSteering(steerInput: number) {
        let steer = 0;
        if (Math.abs(steerInput) > 0.001) {
            steer = MathUtil.clamp(this._steerDirection + steerInput * this._deltaTime * this._steerSpeed, -1.0, 1.0);
        }
        else {
            if (this._steerDirection > 0) {
                steer = Math.max(this._steerDirection - this._deltaTime * this._steerAdjustSpeed, 0);
            }
            else if (this._steerDirection < 0) {
                steer = Math.min(this._steerDirection + this._deltaTime * this._steerAdjustSpeed, 0);
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
        return this._gravity;
    }


    public getSpeedKilometersPerHour(x, y) {
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    }

    private updateCar() {
        this._throttle = 0;
        this._brake = 0;
        this._eBrake = 0;
        let steerInput = 0;

        switch (this._pressCodeDirect) {
            case KeyCode.ARROW_UP:
                this._throttle = 1;
                break;
            case KeyCode.ARROW_DOWN:
                this._throttle = -1;
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

        switch (this._pressCodeRotate) {
            case KeyCode.ARROW_LEFT:
                steerInput = 1;
                break;
            case KeyCode.ARROW_RIGHT:
                steerInput = -1;
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

    private updateRedDot() {
        let pos = new Vec3();
        if (this.getMagnitidute(this._localAcceleration) > 1.0) {
            const wfl = MathUtil.max(0, (this._axelFront.getLeftTire().activeWeight - this._axelFront.getLeftTire().restingWeight));
            const wfr = MathUtil.max(0, (this._axelFront.getRightTire().activeWeight - this._axelFront.getRightTire().restingWeight));
            const wrl = MathUtil.max(0, (this._axelRear.getLeftTire().activeWeight - this._axelRear.getLeftTire().restingWeight));
            const wrr = MathUtil.max(0, (this._axelRear.getRightTire().activeWeight - this._axelRear.getRightTire().restingWeight));
            pos = this.getNodeLocalPos(this._axelFront.getLeftTire().node.getWorldPosition()).multiplyScalar(wfl)
                .add(this.getNodeLocalPos(this._axelFront.getRightTire().node.getWorldPosition()).multiplyScalar(wfr))
                .add(this.getNodeLocalPos(this._axelRear.getLeftTire().node.getWorldPosition()).multiplyScalar(wrl))
                .add(this.getNodeLocalPos(this._axelRear.getRightTire().node.getWorldPosition()).multiplyScalar(wrr));
            const weightTotal = wfl + wfr + wrl + wrr;
            if (weightTotal > 0) {
                Vec3.normalize(pos, pos.multiplyScalar(1 / weightTotal));
                pos.x = MathUtil.clamp(pos.x, -0.6, 0.6);
            } else {
                pos = v3(0, 0, 0);
            }
        }
        let t = new Vec3();
        Vec3.lerp(t, this.weightRedDot.getPosition(), pos.multiplyScalar(50), 0.1);
        this.weightRedDot.setPosition(t);
    }

    private updateUI() {
        if (!this.uiNode) {
            console.log("请挂载遥测数据节点!!!");
            return;
        }
        this.autoRefreshChildren(this.uiNode, this._carDatObj, (item, index, showDatKey) => {
            let res = "";
            if (!this._allKey.find(key => key == showDatKey)) {
                res = "do not have key !!!";
            }
            else {
                res = this[showDatKey];
            }
            item.addComponentSafe(Label).string = `${showDatKey}:${res}`;
        })
    }

    private autoRefreshChildren<T>(parent: Node, data: T[], callback: (item: Node, index: number, element?: T) => void) {
        if (!parent || !data) {
            return;
        }
        const children = parent.children;
        const defaultItem = children[0];
        if (!defaultItem) return;

        for (let i = 0; i < data.length; ++i) {
            let item = children[i];
            if (!item) {
                item = instantiate(defaultItem);
                parent.addChild(item);
            }
            item.active = true;
        }

        for (let i = 0; i < data.length || i < children.length; ++i) {
            let item = children[i];
            if (i >= data.length && i < children.length) {
                item.active = false
                continue;
            }
            callback?.(item, i, data[i]);
        }
    }


    private getMagnitidute(vec: Vec2): number {
        return Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2));
    }

    private getNodeLocalPos(worldPos: Vec3): Vec3 {
        const res = new Vec3();
        this.node.inverseTransformPoint(res, worldPos);
        return res;
    }
}

