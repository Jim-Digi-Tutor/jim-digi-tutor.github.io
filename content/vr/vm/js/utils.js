import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

import * as MESH_UI from "mesh-ui";

export function ascertainWorldScale() {

  return 0.75;
}

export function ascertainModelScale() {

  return 0.2;
}

export function scaleDistance(distance, worldScale, modelScale) {

  return ((distance * modelScale) * worldScale);
}

export function createFpsPanel() {

  const worldScale = ascertainWorldScale();
  const modelScale = ascertainModelScale();

  const pane = new MESH_UI.Block({
    width: scaleDistance(4, worldScale, modelScale),
    height: scaleDistance(4, worldScale, modelScale),
    fontSize: scaleDistance(0.5, worldScale, modelScale),
    padding: scaleDistance(0.12, worldScale, modelScale),
    fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
    fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",      
    backgroundColor: new THREE.Color("#FF0000"),
    //backgroundOpacity: 0.8,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center"
  });

  const text = new MESH_UI.Text( { content: "FPS" } );
  pane.add(text);

  pane.position.set(
    scaleDistance(0, worldScale, modelScale),
    scaleDistance(2.5, worldScale, modelScale),
    scaleDistance(-5, worldScale, modelScale)
  );  

  return { panel: pane, text: text };
}

export async function loadObj(scene, path, worldScale, modelScale, pos, scale, rot, addTo) {
 
  const mtlLoader = new MTLLoader();
  const objLoader = new OBJLoader();
  const mtlPath = path.replace(/\.obj$/, '.mtl');
  
  const materials = await new Promise((resolve, reject) => {
    
    mtlLoader.load(
      
      mtlPath,

      (materials) => {
        materials.preload();
        resolve(materials);
      },

      undefined,
      
      (err) => reject(new Error(
        "Failed to load material - check that the MTL file is in the models folder and that it has the same name as its model!"
      ))
    );

  });

  const object = await new Promise((resolve, reject) => {
    
    objLoader.setMaterials(materials);

    objLoader.load(
      
      path,
      
      (obj) => resolve(obj),
      
      undefined,
      
      (err) => reject(new Error(
        "Failed to load mode - check the OBJ file is in the models folder and its name is the same as the one specified!"
      ))
    );

  });

  // Apply shadows to the individual meshes
  object.traverse((child) => {

    if (child.isMesh) {
      
      child.castShadow = true;
      child.receiveShadow = true;
    }

  });

  // Position the model
  object.position.set(
    scaleDistance(pos.x, worldScale, modelScale),
    scaleDistance(pos.y, worldScale, modelScale),
    scaleDistance(pos.z, worldScale, modelScale)
  );

  // Scale the model
  object.scale.set(
    (scale.x * worldScale),
    (scale.y * worldScale),
    (scale.z * worldScale)
  );  

  // Rotate the model
  object.rotation.set(
    THREE.MathUtils.degToRad(rot.x),
    THREE.MathUtils.degToRad(rot.y),
    THREE.MathUtils.degToRad(rot.z)
  );
          
  // Add the object to any arrays, such as the collidables or interactables
  for (let a = 0; a < addTo.length; a++) {
    addTo[a].push(object);
  }

  scene.add(object);
  return object;
}