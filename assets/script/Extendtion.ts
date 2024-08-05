import { _decorator, Component, Constructor, Node, Size } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Extendtion')
export class Extendtion extends Component {

}

let mulitply = function (ratio: number) {
    const self: Size = this as Size;
    const newSize = new Size();
    newSize.width = self.width * ratio;
    newSize.height = self.height * ratio;
    return newSize;
}

let addComponentSafe = function <T extends Component>(typeOrClassName: Constructor<T>): T {
    let self: Component = this as Component;
    let com = self.getComponent(typeOrClassName);
    if (!com) {
        com = self.addComponent(typeOrClassName)
    }
    return com;
}

Size.prototype.mulitply = mulitply;
Node.prototype.addComponentSafe = addComponentSafe;
Component.prototype.addComponentSafe = addComponentSafe;

