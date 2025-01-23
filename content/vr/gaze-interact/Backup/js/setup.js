import * as THREE from "three";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { Settings } from "./settings.js";

export class Setup {

  constructor() {}

  static setupRenderer() {
    
    let renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.xr.enabled = true;

    return renderer;
  }

  static calculateScale(renderer, camera) {
    
    //if(renderer.xr.isPresenting)
      return renderer.xr.getCamera(camera).position.y;
    //else
      //return settings.baseScale - 0.999;
  }

  static buildDolly(camera) {

    let dolly = new THREE.Object3D();
    dolly.add(camera);
    return dolly;
  }    

  static buildPlayer() {
  
    // Build the player outline and its bounding box
    let rad = 0.3;
    let height = 0.5;
    let geo = new THREE.CylinderGeometry(rad, rad, height, 32); 
    let mat = new THREE.MeshBasicMaterial( { wireframe: true, opacity: 1 } ); 
    
    // When our game is complete, we can hide the player object by uncommenting the line below
    // This will make the player transparent
    // mat.transparent = true;
    
    let player = new THREE.Mesh(geo, mat);
    player.geometry.computeBoundingBox();
    let bb = new THREE.Box3();
    bb.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld);
  
    return [ player, bb ];
  }
}