import * as THREE from "three";

export const InfoBoardSettings = {

  rotations: {

    "NORTH": 180, "NORTH-EAST": 135, "EAST": 90, "SOUTH-EAST": 45,
    "SOUTH": 0, "SOUTH-WEST": -45, "WEST": 90, "NORTH-WEST": 225
  },

  sizeSmall : { x: 1.6, y: 0.9 },

  positionOffsetsSmall: {

    "NORTH": { x: 8.5, y: 13, z: 0.35 }, "NORTH-EAST": { x: 6.45, y: 13, z: 6.25 },
    "EAST": { x: 0.5, y: 13, z: 8.5 }, "SOUTH-EAST": { x: 6.45, y: 13, z: 6.45 },
    "SOUTH": { x: 0, y: 0, z: -5.92 }, "SOUTH-WEST": { x: 6.25, y: 13, z: 6.45 },
    "WEST": { x: 0, y: 0, z: 0 }, "NORTH-WEST": { x: 6.25, y: 13, z: 6.25 }    
  },

  sizeLarge : { x: 2.1, y: 1.2 },

  positionOffsetsLarge: {

    "NORTH": { x: 11, y: 14.5, z: 0.35 }, "NORTH-EAST": { x: 0, y: 0, z: 0 },
    "EAST": { x: 0.5, y: 14.5, z: 11 }, "SOUTH-EAST": { x: 0, y: 0, z: 0 },
    "SOUTH": { x: 0, y: 1.35, z: -0.095 }, "SOUTH-WEST": { x: 0, y: 0, z: 0 },
    "WEST": { x: -0.085, y: 1.35, z: 0 }, "NORTH-WEST": { x: 0, y: 0, z: 0 }    
  }
};

export const TeleportAnimationSettings = {

  TeleportDuration: 500,
  
  StartColour: new THREE.Color(0xFF8BA0),
  EndColour: new THREE.Color(0xFF0000),  
  ScaleLimit: 0.1,
  AnimationDuration: 650


    //#teleportGrow = true;
    //#teleportLast = Date.now();
    //#teleportFader;
    //#isTeleporting = false;
    //#teleportTarget = {};
    //#teleportAt;
    //#teleportDuration = 500;
    //#teleportRepositioned = false;
};