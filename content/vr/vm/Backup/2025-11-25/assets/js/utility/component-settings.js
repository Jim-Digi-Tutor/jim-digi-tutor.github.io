import * as THREE from "three";

/*  For an apect ration of 16:9, the multiplier is 0.5625, length to height.
    Screen sizes now reflect this, but any apps and videos need to reflect this also.
    The display board model will need to be amended, also.
    */
export const DisplayBoardSettings = {

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

  sizeLarge : { x: 2.1, y: 1.18125 },

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
};

export const PanelOffsets = {
  
  // Data related to the positioning of the splash, location, and debug panels
  MOBILE: {},
  
  // The following dimensions have been...
  // ...tested on both Meta Quest 2 and Meta Quest 3...
  // ...and they work the same on both devices.
  HEADSET: {
    splash: new THREE.Vector3(0, 0, 0.3),
    loc: new THREE.Vector3(0, -0.275, 0.8),
    debug: new THREE.Vector3(-0.50, 0.3, 0.8)    
  },
  
  PC: {
    // 768px to 992px
    SMALL: {
      splash: new THREE.Vector3(0, 0, 0.3),
      loc: new THREE.Vector3(0, -0.65, 0.8),
      debug: new THREE.Vector3(-0.92, 0.63, 0.8)
    },
    // 993px to 1200px
    MEDIUM: {
      splash: new THREE.Vector3(0, 0, 0.3),
      loc: new THREE.Vector3(0, -0.65, 0.8),
      debug: new THREE.Vector3(-0.92, 0.63, 0.8)
    },
    // 1201px or greater
    LARGE: {
      splash: new THREE.Vector3(0, 0, 0.3),
      loc: new THREE.Vector3(0, -0.65, 0.8),
      debug: new THREE.Vector3(-0.92, 0.63, 0.8)
    }            
  }
}

export const SplashPanelDimensions = {

  MOBILE: {},

  // The following dimensions have been...
  // ...tested on both Meta Quest 2 and Meta Quest 3...
  // ...and they work the same on both devices.
  HEADSET: {
    width: 0.3,
    height: 0.3,
    largeFont: 0.015,
    smallFont: 0.01,
    padding: 0.001,
    titleHeight: 0.02,
    contentHeight: 0.12,
    lowerHeight: 0.12,
    lowerBorder: 0.0025      
  },

  PC: {

    // 768px to 992px
    SMALL: {
      width: 0.5,
      height: 0.5,
      largeFont: 0.02,
      smallFont: 0.015,
      padding: 0.005,
      titleHeight: 0.04,
      contentHeight: 0.15,
      lowerHeight: 0.25,
      lowerBorder: 0.005
    },

    // 993px to 1200px
    MEDIUM: {
      width: 0.5,
      height: 0.5,
      largeFont: 0.02,
      smallFont: 0.015,
      padding: 0.005,
      titleHeight: 0.04,
      contentHeight: 0.15,
      lowerHeight: 0.25,
      lowerBorder: 0.005
    },

    // 1201px or greater
    LARGE: {
      width: 0.55,
      height: 0.55,
      largeFont: 0.03,
      smallFont: 0.02,
      padding: 0.005,
      titleHeight: 0.06,
      contentHeight: 0.2,
      lowerHeight: 0.2,
      lowerBorder: 0.0035
    }
  },

  UNKNOWN: {}
}