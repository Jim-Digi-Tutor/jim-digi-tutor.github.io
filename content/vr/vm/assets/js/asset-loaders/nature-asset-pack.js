import * as THREE from "three";

import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

const namePairs = [
  { modelName: "Bush1.003_Plane.123", alias: "bush-0-pack-0" },
  { modelName: "Bush2.003_Plane.122", alias: "bush-1-pack-0" },
  { modelName: "Bush3.002_Cube.043", alias: "bush-2-pack-0" },
  { modelName: "Grass1.001_Plane.121", alias: "grass-0-pack-0" },
  { modelName: "Grass2.001_Plane.120", alias: "grass-1-pack-0" },
  { modelName: "Grass3.001_Plane.119", alias: "grass-2-pack-0" },
  { modelName: "Grass4.002_Plane.118", alias: "grass-3-pack-0" },
  { modelName: "Grass5.002_Plane.117", alias: "grass-4-pack-0" },
  { modelName: "Grass6.001_Plane.116", alias: "grass-5-pack-0" },
  { modelName: "Grass7.002_Plane.115", alias: "grass-6-pack-0" },
  { modelName: "Grass8.002_Plane.114", alias: "grass-7-pack-0" },
  { modelName: "GrassClump1.003_Plane.113", alias: "grass-clump-0-pack-0" },
  { modelName: "GrassClump2.005_Plane.112", alias: "grass-clump-1-pack-0" },
  { modelName: "GrassClump3.005_Plane.111", alias: "grass-clump-2-pack-0" },
  { modelName: "Log.001_Plane.110", alias: "log-0-pack-0" },
  { modelName: "Rock1.003_Cube.042", alias: "rock-0-pack-0" },
  { modelName: "Rock2.004_Cube.041", alias: "rock-1-pack-0" },
  { modelName: "Rock3.003_Cube.040", alias: "rock-2-pack-0" },
  { modelName: "Rock4.002_Cube.039", alias: "rock-3-pack-0" },
  { modelName: "Rock5.002_Cube.038", alias: "rock-4-pack-0" },
  { modelName: "Rock6.002_Cube.037", alias: "rock-5-pack-0" },
  { modelName: "Rock7.002_Cube.036", alias: "rock-6-pack-0" },
  { modelName: "Rock8.002_Cube.035", alias: "rock-7-pack-0" },
  { modelName: "Rock9.002_Cube.034", alias: "rock-8-pack-0" },
  { modelName: "Spruce1.002_Plane.109", alias: "spruce-0-pack-0" },
  { modelName: "Spruce2.002_Plane.108", alias: "spruce-1-pack-0" },
  { modelName: "Stump1.001_Plane.107", alias: "stump-0-pack-0" },
  { modelName: "Tree1.002_Plane.106", alias: "tree-0-pack-0" },
  { modelName: "Tree2.002_Plane.105", alias: "tree-1-pack-0" }
];

const colourMap = {
  "Green1.002": 0x228B22, // Forest green - common foliage
  "Green5.002": 0x2E8B57, // Sea green - alternate leaf tone
  "Green2.002": 0x00AA00, // Bright green - young leaves
  "Bark.002": 0x8B4513,   // Saddle brown - tree bark
  "Bark2.001": 0x5C4033,  // Dark walnut - aged bark
  "Rock1.001": 0x888888   // Medium gray - stone / rock
};

export function loadNatureAssetPack(models) {

  // pack-0
  // https://free3d.com/3d-model/sale-nature-asset-pack-7378.html

  new OBJLoader().load("./assets/asset-packs/pack-0.obj", (obj) => {
      
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