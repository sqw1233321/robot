import { _decorator, Component, EventKeyboard, EventMouse, Input, input, KeyCode, math, Node, NodeEventType, Sprite, tween, Tween, v2, v3, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Testttt')
export class Testttt extends Component {

    //鼠标进入进出时的缓动
    private _scaleTween: Tween<Readonly<Vec3>>;

    protected onLoad(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    private onKeyDown(event: EventKeyboard) {
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

