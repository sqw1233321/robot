import { _decorator, Component, Material, Node, Sprite, UITransform, v4, NodeEventType, EventMouse, Vec2, v2, director, EffectAsset, tween, Vec3, Tween, math, Size, Widget, view, Rect, lerp } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Card')
export class Card extends Component {
    @property(Node)
    cardNode: Node;
    @property(EffectAsset)
    cardEffect: EffectAsset;
    @property(Node)
    shadow: Node;

    private cardMat: Material;
    private angle_x_max: number = 0.26;
    private angle_y_max: number = 0.26;
    //鼠标进入进出时的缓动
    private _scaleTween: Tween<Readonly<Vec3>>;
    //卡牌缩放倍数
    private _flatRate: number = 1.5;

    private _parentNode: Node;
    private _originSize: Size;
    private max_offset_shadow:number = 50;

    protected onLoad(): void {
        this._parentNode = this.cardNode.parent;
        this._parentNode.on(NodeEventType.MOUSE_MOVE, this.onMouseMove, this);
        this._parentNode.on(NodeEventType.MOUSE_ENTER, this.onMouseEnter, this);
        this._parentNode.on(NodeEventType.MOUSE_LEAVE, this.onMouseLeave, this);
        const parentTrans = this._parentNode.getComponent(UITransform);
        this._originSize = new Size(parentTrans.contentSize.width, parentTrans.contentSize.height);
        const mat = new Material();
        mat.initialize({
            effectAsset: this.cardEffect,
            effectName: "card_effect",
            defines: {
                USE_TEXTURE: true
            }
        });
        const sp = this.cardNode.getComponent(Sprite);
        sp.customMaterial = mat;
        const trans = this.cardNode.getComponent(UITransform);
        const ndRect = v4(trans.width, trans.height);
        this.cardMat = mat;
        this.cardMat.setProperty("rect_size", ndRect);
    }


    private onMouseMove(e: EventMouse) {
        const mouseWorldPos = e.getLocation();
        const temPos = mouseWorldPos.clone();
        const mouse_pos: Vec2 = temPos.transformMat4(this.node.worldMatrix.clone().invert());
        const contentSize = this.cardNode.getComponent(UITransform).contentSize;
        const size = v2(contentSize.x, contentSize.y);

        const lerp_val_x: number = this.remap(mouse_pos.x, 0.0, size.x, 0, 1);
        const lerp_val_y: number = this.remap(mouse_pos.y, 0.0, size.y, 0, 1);

        const lerpAngleX = this.lerp_angle(this.angle_x_max, -this.angle_x_max, lerp_val_x);
        const lerpAngleY = this.lerp_angle(this.angle_y_max, -this.angle_y_max, lerp_val_y);
        var rot_x: number = this.rad_to_deg(lerpAngleX);
        var rot_y: number = this.rad_to_deg(lerpAngleY);

        this.cardMat?.setProperty("y_rot", rot_x);
        this.cardMat?.setProperty("x_rot", rot_y);
    }


    private onMouseEnter() {
        const tweenDuration: number = 0.2;
        this._scaleTween?.stop();
        this._scaleTween = tween(this.cardNode.scale)
            .to(tweenDuration, new Vec3(this._flatRate, this._flatRate, 0), {
                easing: "backOut",
                onUpdate: (target: Vec3, ratio: number) => {
                    this.cardNode.scale = target;
                }
            }).start();
        this._parentNode.getComponent(UITransform).setContentSize(this._originSize.mulitply(this._flatRate));
    }

    private onMouseLeave() {
        const tweenDuration: number = 0.2;
        this._scaleTween?.stop();
        tween(this.cardNode.scale)
            .to(tweenDuration, new Vec3(1, 1, 0), {
                easing: "backOut",
                onUpdate: (target: Vec3, ratio: number) => {
                    this.cardNode.scale = target;
                }
            })
            .start();

        this.cardMat?.setProperty("y_rot", 0);
        this.cardMat?.setProperty("x_rot", 0);
        this._parentNode.getComponent(UITransform).setContentSize(this._originSize.mulitply(1 / this._flatRate));
    }

    protected update(dt: number): void {
        this.handleShadow(dt);
    }

    private handleShadow(dt: number) {
        const center: Size = view.getViewportRect().size.mulitply(0.5);
        const distance: number = this.node.getWorldPosition().x - center.x;
        const x = lerp(0.0, -this.sign(distance) * this.max_offset_shadow, Math.abs(distance / (center.x)))
        const y = this.shadow.position.y;
        this.shadow.setPosition(x, y);
    }


    private remap(value, istart, istop, ostart, ostop) {
        let res = ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
        if (res < ostart) res = ostart;
        else if (res > ostop) res = ostop;
        return res;
    }

    private lerp_angle(from, to, weight) {
        let difference = to - from;
        while (difference < -Math.PI) {
            difference += 2 * Math.PI;
        }
        while (difference > Math.PI) {
            difference -= 2 * Math.PI;
        }
        return from + difference * weight;
    }

    private rad_to_deg(rad) {
        return rad * (180 / Math.PI);
    }


    private sign(num): number {
        if (typeof (num) !== "number") return 0;
        if (isNaN(num)) return 0;
        return num == 0 ? 0 : num > 0 ? 1 : -1;
    }


}

