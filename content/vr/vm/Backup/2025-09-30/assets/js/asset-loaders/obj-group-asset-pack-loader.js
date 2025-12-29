import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

const namePairCollection = {
  
  "nature-asset-pack": [
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
  ],

  "low-poly-trees": [
    { modelName: "Plane", alias: "plane-0-pack-1" },
    { modelName: "Cube", alias: "tree-0-pack-1" },
    { modelName: "Cube.001", alias: "tree-1-pack-1" },
    { modelName: "Cube.002", alias: "tree-2-pack-1" },
    { modelName: "Cube.003", alias: "tree-3-pack-1" },
    { modelName: "Cube.004", alias: "tree-4-pack-1" }
  ]
};

const colourMapCollection = {

  "nature-asset-pack": {
    "Green1.002": 0x228B22, // Forest green - common foliage
    "Green5.002": 0x2E8B57, // Sea green - alternate leaf tone
    "Green2.002": 0x00AA00, // Bright green - young leaves
    "Bark.002": 0x8B4513,   // Saddle brown - tree bark
    "Bark2.001": 0x5C4033,  // Dark walnut - aged bark
    "Rock1.001": 0x888888   // Medium gray - stone / rock
  },

  "low-poly-trees": {
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
  }
};

export async function loadAssetPack(pack, models) {
  
  // Wait for the OBJ to load (wrap callback API in a Promise)
  const obj = await new Promise((resolve, reject) => {

    new OBJLoader().load(
      "./assets/asset-packs/" + pack + ".obj",
      resolve,
      undefined,
      reject
    );

  });

  const namePairs = namePairCollection[pack];
  const colourMap = colourMapCollection[pack];

  // Process and push once per entry in namePairs
  for (let a = 0; a < namePairs.length; a++) {
    
    const { modelName, alias } = namePairs[a];
    const src = obj.getObjectByName(modelName);
    if (!src) continue;

    const clone = src.clone(true);

    clone.traverse((child) => {

      if (!child.geometry) return;

      child.geometry.computeBoundingBox();
      const centre = new THREE.Vector3();
      child.geometry.boundingBox.getCenter(centre);
      child.geometry.translate(-centre.x, 0, -centre.z);

      if (child.isMesh && child.material) {

        if (Array.isArray(child.material)) {
          
          child.material.forEach((mat) => {
            const hex = colourMap[mat.name] ?? 0xffffff;
            mat.color.setHex(hex);
            mat.roughness = 0.8;
            mat.metalness = 0.1;
          });

        } else {
          
          const mat = child.material;
          const hex = colourMap[mat.name] ?? 0xffffff;
          mat.color.setHex(hex);
          mat.roughness = 0.8;
          mat.metalness = 0.1;
        }
      }
    });

    models.push({
      name: alias,
      file: modelName,
      merge: false,
      scale: 1,
      dimensions: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Vector3(0, 0, 0),
      model: clone,
    });
  }

  return models;
}