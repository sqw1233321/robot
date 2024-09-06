import { _decorator, Component, EventKeyboard, EventMouse, EventTouch, Input, input, KeyCode, math, Node, NodeEventType, Sprite, tween, Tween, v2, v3, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Testttt')
export class Testttt extends Component {

    //鼠标进入进出时的缓动
    private _scaleTween: Tween<Readonly<Vec3>>;

    protected onLoad(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        this.creatComBtn(this.node, () => { });
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

    public creatComBtn(node: Node, endFunc: () => void, startFunc = () => { }) {
        let nowScale: Vec3 = node.scale.clone().multiplyScalar(1)
        let nowScale2: Vec3 = node.scale.clone().multiplyScalar(0.95)

        node.off(NodeEventType.MOUSE_MOVE,)
        node.on(NodeEventType.MOUSE_MOVE, (event: EventTouch) => {
            startFunc && startFunc()
            Tween.stopAllByTarget(node);
            tween(node).to(0.05, { scale: nowScale2 }).start()
            event.propagationStopped = true;
        })
        // node.on(Node.EventType.TOUCH_MOVE,()=>{
        // })
        node.off(NodeEventType.MOUSE_LEAVE)
        node.on(NodeEventType.MOUSE_LEAVE, (event) => {
            endFunc()
            Tween.stopAllByTarget(node);
            tween(node).to(0.05, { scale: nowScale }).start()
        })
        node.off(NodeEventType.MOUSE_UP)
        node.on(Node.EventType.MOUSE_UP, (event) => {
            Tween.stopAllByTarget(node);
            tween(node).to(0.05, { scale: nowScale }).start()
        })
    }
}

