import * as THREE from "three";
import { Settings } from "./settings.js";

export class CustomTeleportMovementManager {

  engine;
  mode;

  leftRotateTrigger;
  rightRotateTrigger;

  constructor(eng, mode) {

    this.engine = eng; 
    this.mode = mode;
  }

  setRotateTriggers(left, right) {

    this.leftRotateTrigger = left;
    //this.leftRotateTrigger.rotation.x = THREE.MathUtils.degToRad(45);

    this.rightRotateTrigger = right;
    //this.rightRotateTrigger.rotation.x = THREE.MathUtils.degToRad(45);
  }

  positionRotateTriggers(dolly) {

    console.log(dolly.rotation.y)
    let leftVec = new THREE.Vector3(-0.20, 1.6, -0.3);
    leftVec.applyQuaternion(dolly.quaternion);
    leftVec.multiplyScalar(1);  
    this.leftRotateTrigger.position.copy(dolly.position).add(leftVec);

    let rightVec = new THREE.Vector3(0.20, 1.6, -0.3);
    rightVec.applyQuaternion(dolly.quaternion);
    rightVec.multiplyScalar(1);  
    this.rightRotateTrigger.position.copy(dolly.position).add(rightVec);    
  }

  rotate(direction) {

    let facing = this.engine.avatar.facing;
    if(direction === Settings.MOVEMENT_ROTATE_LEFT)
      facing = (facing === 3) ? 0 : (facing + 1);
    else if(direction === Settings.MOVEMENT_ROTATE_RIGHT)
      facing = (facing === 0) ? 3 : (facing - 1);

    this.engine.dolly.rotation.y = THREE.MathUtils.degToRad(facing * 90);
    this.engine.avatar.facing = facing;
    this.positionRotateTriggers(this.engine.dolly);

    console.log(this.engine.avatar.facing);
  }
}