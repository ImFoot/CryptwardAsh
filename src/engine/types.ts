import type {DungeonDefinition,DungeonObject} from '../dungeon';

export type Entity={id:number;family:string;x:number;y:number;hp:number;max:number;next:number;born:number;hit:number;home?:DungeonObject;tell?:{until:number;x:number;y:number;radius:number};dead?:boolean};
export type Obj=DungeonObject&{done?:boolean;next?:number};
export type Shot={x:number;y:number;vx:number;vy:number;life:number;damage:number};
export type Spark={x:number;y:number;vx:number;vy:number;life:number;max:number;color:number;size:number};
export type Impact={x:number;y:number;radius:number;until:number};
export interface RenderState {
 d:DungeonDefinition;objects:Obj[];enemies:Entity[];shots:Shot[];sparks:Spark[];impacts:Impact[];
 x:number;y:number;face:number;clock:number;hp:number;move:boolean;dashUntil:number;attackAnim:number;guard:number;invuln:number;
 furnaceOpen:boolean;gateOpen:boolean;bossDead:boolean;menu:boolean;paused:boolean;active:boolean;
 moveTarget?:{x:number;y:number};
}
