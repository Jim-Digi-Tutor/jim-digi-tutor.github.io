import * as THREE from "three";

import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

const namePairs = [
  { modelName: "Plane", alias: "plane-0-pack-1" },
  { modelName: "Cube", alias: "tree-0-pack-1" },
  { modelName: "Cube.001", alias: "tree-1-pack-1" },
  { modelName: "Cube.002", alias: "tree-2-pack-1" },
  { modelName: "Cube.003", alias: "tree-3-pack-1" },
  { modelName: "Cube.004", alias: "tree-4-pack-1" }
];

const colourMap = {
  'bark': 0x8B4513,     // Saddle brown
  'bark2': 0x7A5230,    // Earthy brown
  'bark3': 0x5C4033,    // Dark walnut
  'bark4': 0x6B4226,    // Chestnut
  'bark5': 0x4B3621,    // Deep bark
  'leaves': 0x228B22,   // Forest green
  'leaves2': 0x2E8B57,  // Sea green
  'leaves3': 0x3CB371,  // Medium sea green
  'leaves4': 0x006400,  // Dark green
  'leaves5': 0x00AA00,  // Bright green
  'None': 0x999999      // Neutral gray fallback
};

export function loadLowPolyTrees(models) {

  // pack-1
  // https://free3d.com/3d-model/sale-nature-asset-pack-7378.html

  new OBJLoader().load("./assets/asset-packs/pack-1.obj", (obj) => {
      
    for(let a = 0; a < namePairs.length; a++) {

      const model = obj.getObjectByName(namePairs[a].modelName);
      const clone = model.clone(true);
      clone.traverse((child) => {

        child.geometry.computeBoundingBox();
        const centre = new THREE.Vector3();
        child.geometry.boundingBox.getCenter(centre);
        child.geometry.translate(-centre.x, 0, -centre.z);
        if (child.isMesh) {
        
          if(child.material) {
            
            if (Array.isArray(child.material)) {
          
              child.material.forEach((mat) => {
    
                const hex = colourMap[mat.name] || 0xFFFFFF;
                mat.color.setHex(hex);
                mat.roughness = 0.8;
                mat.metalness = 0.1;
              });
              
            } else {

                const mat = child.material;
                const hex = colourMap[mat.name] || 0xFFFFFF;
                mat.color.setHex(hex);
                mat.roughness = 0.8;
                mat.metalness = 0.1;
            }
          }
        }

        models.push({
          file: namePairs[a].alias,
          type: "OBJ", 
          scale: new THREE.Vector3(0.2, 0.2, 0.2),
          rotation: new THREE.Vector3(0, 0, 0),
          model: clone,
          scaled: null
        });        
      });
    }
  });
}