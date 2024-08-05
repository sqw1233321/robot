//车辆本身

import { _decorator, Component, EventKeyboard, Input, input, KeyCode, macro, Node, RigidBody2D, v2 } from 'cc';
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

    private _carRb: RigidBody2D;

    protected onLoad(): void {
        this.schedule(() => { this._fixedUpdate() }, 0.02, macro.REPEAT_FOREVER);
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        this._carRb = this.node.addComponentSafe(RigidBody2D);
        this._carRb!.linearVelocity = v2(10,10);
    }


    /**
     * 获取线速度
     */
    public getVelocity() {
        return 100;
    }

    protected update(dt: number): void {

    }

    private _fixedUpdate() {
     
    }

    private onKeyDown(event: EventKeyboard) {
        const code = event.keyCode;
        switch (code) {
            case KeyCode.ARROW_UP:
                this._carRb.linearVelocity = v2(10,10);
                break;
            case KeyCode.ARROW_DOWN:
                break;
            case KeyCode.ARROW_LEFT:
                break;
            case KeyCode.ARROW_RIGHT:
                break;
        }
    }

    private onKeyUp(event: EventKeyboard) {
        const code = event.keyCode;
        switch (code) {
            case KeyCode.ARROW_UP:
                break;
            case KeyCode.ARROW_DOWN:
                break;
            case KeyCode.ARROW_LEFT:
                break;
            case KeyCode.ARROW_RIGHT:
                break;
        }
    }


}

