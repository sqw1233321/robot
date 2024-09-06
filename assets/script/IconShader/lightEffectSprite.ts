import { _decorator, Component, Node, Sprite, CCFloat, resources, Material, Vec4, v4 } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property } = _decorator;

@ccclass('lightEffectSprite')
export class lightEffectSprite extends Sprite {

    @property
    lightTime: number = 2;
    @property
    lightInterval: number = 1;
    @property
    lightAngle: number = 70;
    @property
    lightWidth: number = 0.3;

    @property
    _testTime = 0;
    @property({ slide: true, step: 0.01, min: 0, max: 1 })
    get testTime() {
        return this._testTime;
    }

    set testTime(value) {
        this._testTime = value;
        if (EDITOR) {
            if (!this.customMaterial) {
                console.log("请先添加自定义材质<< lightMaterial >>再调试")
                return;
            }
            this.material.setProperty("testTime", value)
            this.setMaterialProperty()
        }
    }

    public get noPackable() {
        return true
    }

    public start() {
        this.loadEffectMaterial()
    }

    public loadEffectMaterial() {
        // lightTimeV: { value: 30 }
        // lightAngle: { value: 70} #0~180
        // lightWidth: { value: 0.3} #0~180
        resources.load("materials/lightMaterial", Material, (err, mat: Material) => {
            this.customMaterial = mat;
            if (this.customMaterial) {
                this.setMaterialProperty()
            }
        })
        // const mat = new Material();
        // mat.initialize({
        //     // 通过 effect 名指定材质使用的着色器资源
        //     effectName: '../resources/materials/lightMaterial',
        //     // defines: {
        //     //     USE_RGBE_CUBEMAP: true
        //     // }
        // });
        // this.customMaterial = mat;
    }

    private setMaterialProperty() {
        let uv: number[] = this.spriteFrame?.uv
        if (uv) {
            this.material.setProperty("lightTime", this.lightTime)
            this.material.setProperty("lightInterval", this.lightInterval)
            this.material.setProperty("lightAngle", this.lightAngle)
            this.material.setProperty("lightWidth", this.lightWidth)
            let rotated = this.spriteFrame.rotated
            //旋转之后uv所代表的值会有所改变
            let [uv0, uv1, uv2, uv3, uv4, uv5, uv6, uv7] = [...uv]
            let uvRoEnd = !rotated ? v4(uv0, uv6, uv7, uv1) : v4(uv0, uv3 - uv1 + uv0, uv1, uv4 - uv0 + uv1)
            let rotatedNum = rotated ? 1.0 : -1.0
            this.material.setProperty("spriteFrameUv", uvRoEnd)
            this.material.setProperty("spriteRotated", rotatedNum)
        }
    }
}

