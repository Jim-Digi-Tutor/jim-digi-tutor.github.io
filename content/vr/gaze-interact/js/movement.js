import * as THREE from "three";
import { Settings } from "./settings.js";
import { Utility } from "./utility.js";

export class CustomTeleportMovementManager {

  engine;
  mode;

  leftRotateTrigger;
  rightRotateTrigger;
  fader;

  teleporting;
  teleportAt;
  teleportTarget;

  constructor(eng, mode) {

    this.engine = eng; 
    this.mode = mode;

    this.teleporting = false;
    this.teleportAt = -1;
  }

  setRotateTriggers(left, right) {

    this.leftRotateTrigger = left;
    this.leftRotateTrigger.children[0].children[0].material.transparent = true;
    this.leftRotateTrigger.children[0].children[0].material.opacity = 0.80;
    this.rightRotateTrigger = right;
    this.rightRotateTrigger.children[0].children[0].material.transparent = true;
    this.rightRotateTrigger.children[0].children[0].material.opacity = 0.80;
  }

  buildTeleportFader() {

    let material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
    let geometry = new THREE.BoxGeometry(2, 4, 2); 
    this.fader = new THREE.Mesh(geometry, material);
    this.fader.material.side = THREE.DoubleSide;
    this.fader.material.transparent = true;
    this.fader.material.opacity = 0.0;
    this.engine.placeObjectAtTile(this.fader, this.engine.playerPosition, [ 0, 0, 0 ] );
    this.engine.scene.add(this.fader);
  }

  positionRotateTriggers(dolly, scale) {
    
    let leftVec = new THREE.Vector3(-(0.1 * scale), (1.6 * scale), -(0.15 * scale));
    leftVec.applyQuaternion(dolly.quaternion);
    leftVec.multiplyScalar(1);  
    this.leftRotateTrigger.position.copy(dolly.position).add(leftVec);

    let rightVec = new THREE.Vector3((0.1 * scale), (1.6 * scale), -(0.15 * scale));
    rightVec.applyQuaternion(dolly.quaternion);
    rightVec.multiplyScalar(1);  
    this.rightRotateTrigger.position.copy(dolly.position).add(rightVec); 
    
    if(this.engine.playerFacing === 0) {

      this.leftRotateTrigger.rotation.x = THREE.MathUtils.degToRad(90);
      this.leftRotateTrigger.rotation.z = THREE.MathUtils.degToRad(-45);
      this.rightRotateTrigger.rotation.x = THREE.MathUtils.degToRad(90);
      this.rightRotateTrigger.rotation.z = THREE.MathUtils.degToRad(45);
    
    } else if(this.engine.playerFacing === 1) {

      this.leftRotateTrigger.rotation.x = THREE.MathUtils.degToRad(90);
      this.leftRotateTrigger.rotation.z = THREE.MathUtils.degToRad(-135);
      this.rightRotateTrigger.rotation.x = THREE.MathUtils.degToRad(90);
      this.rightRotateTrigger.rotation.z = THREE.MathUtils.degToRad(-45);
    
    } else if(this.engine.playerFacing === 2) {

      this.leftRotateTrigger.rotation.x = THREE.MathUtils.degToRad(90);
      this.leftRotateTrigger.rotation.z = THREE.MathUtils.degToRad(135);
      this.rightRotateTrigger.rotation.x = THREE.MathUtils.degToRad(90);
      this.rightRotateTrigger.rotation.z = THREE.MathUtils.degToRad(-135);
    
    } else if(this.engine.playerFacing === 3) {

      this.leftRotateTrigger.rotation.x = THREE.MathUtils.degToRad(90);
      this.leftRotateTrigger.rotation.z = THREE.MathUtils.degToRad(45);
      this.rightRotateTrigger.rotation.x = THREE.MathUtils.degToRad(90);
      this.rightRotateTrigger.rotation.z = THREE.MathUtils.degToRad(-225);
    } 
  }

  prepareTeleport(attributes) {

    let target = Utility.getProperty(attributes, "TeleportTarget");
    let access = Utility.getProperty(attributes, "AccessFrom");
    
    // Only teleport if this teleport is reachable
    if(this.playerPosition !== target[0] && this.teleportIsAccessible(this.engine.playerPosition, access)) {

      this.teleporting = true;
      this.teleportAt = Date.now();
      this.teleportTarget = target;
    }
  }

  teleportIsAccessible(current, access) {

    for(let a = 0; a < access.length; a++) {

      if(current === access[a])
        return true;
    }

    return false;
  }

  prepareClimb(attributes) {

    let targets = Utility.getProperty(attributes, "ClimbTargets");
    
    // Only climb if the trigger is reachable
    if(this.engine.avatar.position === targets[0][0] || this.engine.avatar.position === targets[1][0]) {

      this.teleporting = true;
      this.teleportAt = Date.now();
      this.teleportTarget = (this.engine.avatar.position === targets[0][0]) ? targets[1] : targets[0];
    }
  }  

  teleportTick() {

    let target = this.teleportTarget;
    let timer = Settings.teleportTimer;
    let elapsed = (Date.now() - this.teleportAt);

    if(elapsed >= timer) {

      this.fader.material.opacity = 0;
      this.teleporting = false;

    } else {
      
      let elapsedPercent = (elapsed / timer);
      
      if(elapsedPercent < 0.5) {

        let opacity = (elapsedPercent / 0.5);
        this.fader.material.opacity = opacity;

      } else {

        if(this.engine.playerPosition !== target[0]) {

          this.fader.material.opacity = 1;
          this.engine.playerPosition = target[0];
          this.engine.placeObjectAtTile(this.engine.dolly, target[0], [ 0, target[1], 0] );
          this.engine.placeObjectAtTile(this.fader, target[0], [ 0, target[1], 0] );
          this.positionRotateTriggers(this.engine.dolly, this.engine.scale);
        }

        let opacity = (1 - ((elapsedPercent - 0.5) / 0.5));
        this.fader.material.opacity = opacity;
      }
    }
  }

  rotate(direction) {

    let facing = this.engine.playerFacing;
    if(direction === Settings.MOVEMENT_ROTATE_LEFT)
      facing = (facing === 3) ? 0 : (facing + 1);
    else if(direction === Settings.MOVEMENT_ROTATE_RIGHT)
      facing = (facing === 0) ? 3 : (facing - 1);

    this.engine.dolly.rotation.y = THREE.MathUtils.degToRad(facing * 90);
    this.engine.playerFacing = facing;
    this.positionRotateTriggers(this.engine.dolly, this.engine.scale);
  }
}