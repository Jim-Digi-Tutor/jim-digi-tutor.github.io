import * as THREE from "three";

export function buildAmbientLight(scene, color, intensity) {

    const light = new THREE.AmbientLight(new THREE.Color(color), intensity);
    if(scene !== null)
      scene.add(light);

    return light;
}

export function buildHemisphereLight(scene, sky, ground, intensity) {

    const light = new THREE.HemisphereLight(new THREE.Color(sky), new THREE.Color(ground), intensity);
    if(scene !== null)
      scene.add(light);

    return light;
}

export function getVectorFromXml(xml, fallback) {

  const vec = {};
  vec.x = parseFloat(xml?.querySelector("x")?.textContent.trim() || fallback);
  vec.y = parseFloat(xml?.querySelector("y")?.textContent.trim() || fallback);
  vec.z = parseFloat(xml?.querySelector("z")?.textContent.trim() || fallback);
  return vec;
}

export function getRgbFromXml(xml, fallback) {

  const rgb = {};
  rgb.r = parseFloat(xml?.querySelector("r")?.textContent.trim() || fallback);
  rgb.g = parseFloat(xml?.querySelector("g")?.textContent.trim() || fallback);
  rgb.b = parseFloat(xml?.querySelector("b")?.textContent.trim() || fallback);
  return rgb;
}

export function applyVectorToWorld(vec, scale) {

  const x = (vec.x * scale);
  const y = (vec.y * scale);
  const z = (vec.z * scale);
  return new THREE.Vector3(x, y, z);
}

export function adjustVectorToRegionModel(vec, adjustedSize, position, baseScale, regionScale) {

  // console.log("Position: ", vec);
  // console.log("Adjusted Size: ", adjustedSize);
  // console.log("Model Position: ", position);
  // console.log("Base Scale: ", baseScale);
  // console.log("Region Scale: ", regionScale);
  
  const adj = new THREE.Vector3();
  const x = ((vec.x * regionScale.x) * baseScale);
  const y = ((vec.y * regionScale.y) * baseScale);
  const z = ((vec.z * regionScale.z) * baseScale);

  adj.x = (position.x - (adjustedSize.x) / 2) + x;
  adj.y = (position.y + y);
  adj.z = (position.z + (-(adjustedSize.z / 2) + z));

  // console.log("Adjusted Position: ", adj);
  // console.log("------------------------------")

  return adj;
}

export async function loadObj(path, objLoader, mtlLoader, baseScale, adjustPosition, pos, adjustScale, scale, adjustRotation, rot, addTo) {
  const mtlPath = path.replace(/\.obj$/, '.mtl');

  const materials = await new Promise((resolve, reject) => {
    
    mtlLoader.load(
      mtlPath,
      (materials) => {
        materials.preload();
        resolve(materials);
      },
      undefined,
      (err) => reject(new Error(`Failed to load MTL: ${err.message}`))
    );
  });

  const object = await new Promise((resolve, reject) => {
    
    objLoader.setMaterials(materials);
    objLoader.load(
      path,
      (obj) => resolve(obj),
      undefined,
      (err) => reject(new Error(`Failed to load OBJ: ${err.message}`))
    );
  });

  // Apply transformations and shadows
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  if(adjustPosition) {
    object.position.set(pos.x * baseScale, pos.y * baseScale, pos.z * baseScale);
  } else {

    object.position.set(pos.x, pos.y, pos.z);
  }

  if(adjustScale) {
    object.scale.set(scale.z * baseScale, scale.y * baseScale, scale.z * baseScale);
  } else {

    object.scale.set(scale.z, scale.y, scale.z);
  }

  if(adjustRotation) {
    object.rotation.x = THREE.MathUtils.degToRad(rot.x);
    object.rotation.y = THREE.MathUtils.degToRad(rot.y);
    object.rotation.z = THREE.MathUtils.degToRad(rot.z);
  }
  // Size of the model (width, height, depth)
  const boundingBox = new THREE.Box3().setFromObject(object);
  const scaledSize = new THREE.Vector3();
  boundingBox.getSize(scaledSize);

  //console.log('Natural size of the model:', size);
  //console.log('Width:', size.x, 'Height:', size.y, 'Depth:', size.z);

  //scene.add(object);

  for (let a = 0; a < addTo.length; a++) {
    addTo[a].push(object);
  }

  return { model: object, scaled: scaledSize };
}

// A function to load the models; it takes the filename, position, and scale as arguments, as well as an array to add the content to
// path, objLoader, mtlLoader, baseScale, adjustPosition, pos, adjustScale, scale, adjustRotation, rot, addTo




export async function loadGltf(path, gltfLoader, baseScale, adjustPosition, pos, adjustScale, scale, adjustRotation, rot, addTo) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,

      (gltf) => {
        const scene = gltf.scene;
        scene.castShadow = true;
        scene.receiveShadow = true;

        scene.traverse((child) => {
          if (child.isMesh) {
            console.log('Found mesh:', child.name);
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              //child.material.transparent = transparent;
              //child.material.opacity = transparent ? 0 : 1;
            }
          }
        });

        // Apply transform adjustments
        if (adjustPosition) {
          scene.position.set(pos.x * baseScale, pos.y * baseScale, pos.z * baseScale);
        } else {
          scene.position.set(pos.x, pos.y, pos.z);
        }

        if (adjustScale) {
          scene.scale.set(scale.x * baseScale, scale.y * baseScale, scale.z * baseScale);
        } else {
          scene.scale.set(scale.x, scale.y, scale.z);
        }

        if (adjustRotation) {
          scene.rotation.set(
            THREE.MathUtils.degToRad(rot.x),
            THREE.MathUtils.degToRad(rot.y),
            THREE.MathUtils.degToRad(rot.z)
          );
        }

        // Ensure transforms are applied
        scene.updateWorldMatrix(true, true);

        // Get actual (scaled) size
        const boundingBox = new THREE.Box3().setFromObject(scene);
        const scaledSize = new THREE.Vector3();
        boundingBox.getSize(scaledSize);

        // Optionally collect references
        for (let a = 0; a < addTo.length; a++) {
          addTo[a].push(scene);
        }

        resolve({ model: scene, scaled: scaledSize });
      },

      undefined,

      (error) => {
        console.error("An error occurred loading the GLTF model:", error);
        reject(error);
      }
    );
  });
}



/*export async function loadGltf(path, gltfLoader, baseScale, adjustPosition, pos, adjustScale, scale, adjustRotation, rot, addTo, transparent) {

    gltfLoader.load(
               
      path,
               
      function(gltf) {
        
              gltf.scene.castShadow = true;
      gltf.scene.receiveShadow = true;
      //console.log(gltf.scene)
  // Optional: Traverse and access mesh objects
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      console.log('Found mesh:', child.name);
      child.castShadow = true;
      child.receiveShadow = true;
      // Modify material if needed
      child.material.transparent = transparent;
      child.material.opacity = (transparent) ? 0 : 1;
    }
  });        
  if(adjustPosition) {
    gltf.scene.position.set(pos.x * baseScale, pos.y * baseScale, pos.z * baseScale);
  } else {

    gltf.scene.position.set(pos.x, pos.y, pos.z);
  }

  if(adjustScale) {
    gltf.scene.scale.set(scale.z * baseScale, scale.y * baseScale, scale.z * baseScale);
  } else {

    gltf.scene.scale.set(scale.z, scale.y, scale.z);
  }

  if(adjustRotation) {
    gltf.scene.rotation.x = THREE.MathUtils.degToRad(rot.x);
    gltf.scene.rotation.y = THREE.MathUtils.degToRad(rot.y);
    gltf.scene.rotation.z = THREE.MathUtils.degToRad(rot.z);
  }
  // Size of the model (width, height, depth)
  const boundingBox = new THREE.Box3().setFromObject(gltf.scene);
  const scaledSize = new THREE.Vector3();
  boundingBox.getSize(scaledSize);

        // Add the model to the specified arrays
        for(let a = 0; a < addTo.length; a++)
          addTo[a].push(gltf.scene);

        return { model: gltf.scene, scaled: scaledSize };

      }.bind(this),
               
      undefined,
               
      function(error) {
      
        console.error("An error occurred loading the GLTF model: ", error);
      }   
    );

    
  }*/