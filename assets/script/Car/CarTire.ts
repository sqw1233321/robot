//车辆轮胎
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CarTire')
export class CarTire extends Component {
    // public float RestingWeight { get; set; }
    // public float ActiveWeight { get; set; }
    // public float Grip { get; set; }
    // public float FrictionForce { get; set; }
    // public float AngularVelocity { get; set; }
    // public float Torque { get; set; }

    // public float Radius = 0.5f;

    // float TrailDuration = 5;
    // trailActive:boolean = false; 
    // GameObject Skidmark;

    public restingWeight: number;
    public activeWeight:number;
    public grip:number;

    public frictionForce: number;
    public angularVelocity: number;
    public torque: number;

    public radius = 0.5;
    
    public trailActive = false;

    //漂移线
    public SetTrailActive(active: boolean) {
        // if (active && !this.trailActive) {
        //     // These should be pooled and re-used
        //     Skidmark = GameObject.Instantiate(Resources.Load("Skidmark") as GameObject);

        //     Skidmark.GetComponent<TrailRenderer>().time = TrailDuration;
        //     Skidmark.GetComponent<TrailRenderer>().sortingOrder = 0;
        //     Skidmark.transform.parent = this.transform;
        //     Skidmark.transform.localPosition = Vector2.zero;

        //     //Fix issue where skidmarks draw at 0,0,0 at slow speeds
        //     Skidmark.GetComponent<TrailRenderer>().Clear();
        // } else if (!active && this.trailActive) {
        //     Skidmark.transform.parent = null;
        //     GameObject.Destroy(Skidmark.gameObject, TrailDuration);
        // }
        // TrailActive = active;
    }
}

