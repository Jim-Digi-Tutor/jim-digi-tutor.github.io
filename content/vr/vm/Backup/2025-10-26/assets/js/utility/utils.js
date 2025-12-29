import * as THREE from "three";
import * as BGU from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/meshopt_decoder.module.js';

export const PROX_DISTANT = 0;

export function addSpace(count) {

  let str = "";
  for(let a = 0; a < count; a++)
    str += String.fromCharCode(160);

  return str;
}

export function setCameraHeight(camHeight, dolly, uniScale, modScale, camY) {

  dolly.position.y = (scaleDistance(camHeight, uniScale, modScale) - (camY * 1.025));
}

export function tweakDistance(a, b, decimals = 2) {
  const rawDiff = a - b;
  const factor = Math.pow(10, decimals);

  let tweaked;
  if (rawDiff < 0) {
    tweaked = Math.ceil(rawDiff * factor) / factor;
  } else {
    tweaked = Math.floor(rawDiff * factor) / factor;
  }

  return Math.abs(tweaked);
}

export function getVectorFromXml(xml, fallback) {

  const vec = new THREE.Vector3();
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

/**
 * Takes a Vector3D (or similar) object and converts its coordinates to the universal scale and model scale
 * @param { Vector3D }  vec
 * @param { Number }    uniScale 
 * @param { Number }    modScale
 * @returns Vector3D
 */
export function applyVectorToWorld(vec, uniScale, modScale) {

  const x = ((vec.x * modScale) * uniScale);
  const y = ((vec.y * modScale) * uniScale);
  const z = ((vec.z * modScale) * uniScale);
  return new THREE.Vector3(x, y, z);
}

export function scaleDistance(distance, worldScale, modelScale) {

  return ((distance * modelScale) * worldScale);
}

export function adjustChildPositionToParent(childPos, parentSize, parentPos, uniScale, modScale) {

   console.log("Child Position: ", childPos);
   console.log("Parent Size: ", parentSize);
   console.log("Parent Position: ", parentPos);
   console.log("Universal Scale: ", uniScale);
   console.log("Model Scale: ", modScale);
  
  const adj = new THREE.Vector3();
  const x = ((childPos.x * modScale) * uniScale);
  const y = ((childPos.y * modScale) * uniScale);
  const z = ((childPos.z * modScale) * uniScale);

  adj.x = ((parentPos.x - (parentSize.x) / 2) + x);
  adj.y = (parentPos.y + y);
  adj.z = (parentPos.z + (-(parentSize.z / 2) + z));

   console.log("Adjusted Position: ", adj);
   console.log("------------------------------");

  return adj;
}

export function normalisePlayerPosition(scaled, pos) {

  const normal = new THREE.Vector3();
  normal.x = (pos.x + (scaled.x / 2));
  normal.y = (pos.y + (scaled.y / 2));
  normal.z = (pos.z + (scaled.z / 2));
  return normal;
}

export async function loadObj(path, objLoader, mtlLoader, uniScale, adjustPosition, pos, adjustScale, scale, adjustRotation, rot, addTo) {
 
  
  
  const  mtlPath = path.replace(/\.obj$/, '.mtl');
  
  //const mtlPath = path.split(".obj")[0] + ".mtl";


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
    object.position.set(pos.x * uniScale, pos.y * uniScale, pos.z * uniScale);
  } else {

    object.position.set(pos.x, pos.y, pos.z);
  }

  if(adjustScale) {
    object.scale.set(scale.x * uniScale, scale.y * uniScale, scale.z * uniScale);
  } else {

    object.scale.set(scale.x, scale.y, scale.z);
  }

        if (adjustRotation) {
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


    export async function checkModelExists(url) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      } catch (err) {
        console.error('BLAH Error checking model:', err);
        return false;
      }
    }

export async function loadCommonGlb(path, merge, scale, renderer) {

  return new Promise((resolve, reject) => {

    // Set the loader to manage meshopt decoding
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    // Create + configure the KTX2 loader
    const ktx2Loader = new KTX2Loader()
      .setTranscoderPath("./assets/three-assets/")             // <-- folder containing basis_transcoder.js/wasm
      .detectSupport(renderer);                 // check GPU capabilities

    // Attach KTX2 loader to the GLTF loader
    loader.setKTX2Loader(ktx2Loader);

    loader.load(

      path,
          
      (gltf) => {
          
        // Deep clone the model to avoid mutating the cached scene
        let clone = gltf.scene.clone(true);

        if(!merge) {

          // If the model isn't to be merged, ensure its mesh(es) cast and receive shadow
          clone.traverse((m) => {
            if (m.isMesh) {
              m.castShadow = true;
              m.receiveShadow = true;
            }
          });

        } else {

          clone = mergeToSingleVertexColorMesh(clone);
          console.log(clone)
        }

        // Scale the base model
        clone.scale.set(scale, scale, scale);
        resolve(clone);
      },

      undefined,
          
      (err) => reject(err)
    );

    ktx2Loader.dispose();
  });
}



export function mergeToSingleVertexColorMesh(root) {
  const parts = [];
  root.updateMatrixWorld(true);

  root.traverse((obj) => {
    if (!(obj.isMesh && obj.geometry)) return;

    const src = obj.geometry;
    const world = obj.matrixWorld;
    const normalMat = new THREE.Matrix3().getNormalMatrix(world);

    // 1) Start from NON-indexed geometry (avoids index collisions + simplifies copies)
    const base = src.index ? src.toNonIndexed() : src;

    // 2) Rebuild clean Float32 attributes (NO interleave, NO normalized ints)
    const posAttr = base.getAttribute('position');
    if (!posAttr) return;
    const vcount = posAttr.count;

    const pos = new Float32Array(vcount * 3);
    for (let i = 0; i < vcount; i++) {
      pos[3*i+0] = posAttr.getX(i);
      pos[3*i+1] = posAttr.getY(i);
      pos[3*i+2] = posAttr.getZ(i);
    }

    let nrm = null;
    const nAttr = base.getAttribute('normal');
    if (nAttr) {
      nrm = new Float32Array(vcount * 3);
      for (let i = 0; i < vcount; i++) {
        nrm[3*i+0] = nAttr.getX(i);
        nrm[3*i+1] = nAttr.getY(i);
        nrm[3*i+2] = nAttr.getZ(i);
      }
    }

    // 3) Apply WORLD transform explicitly (positions & normals)
    //    Doing it manually avoids any surprises with interleaved/normalized underlying buffers.
    const p = new THREE.Vector3();
    const n = new THREE.Vector3();
    for (let i = 0; i < vcount; i++) {
      p.set(pos[3*i], pos[3*i+1], pos[3*i+2]).applyMatrix4(world);
      pos[3*i] = p.x; pos[3*i+1] = p.y; pos[3*i+2] = p.z;

      if (nrm) {
        n.set(nrm[3*i], nrm[3*i+1], nrm[3*i+2]).applyMatrix3(normalMat).normalize();
        nrm[3*i] = n.x; nrm[3*i+1] = n.y; nrm[3*i+2] = n.z;
      }
    }

    // 4) Make a brand-new geometry with only the attributes we want
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    if (nrm) g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));

    // Ensure a color attribute exists and is consistent (RGB float32)
    const matColor = (obj.material && obj.material.color) ? obj.material.color : new THREE.Color(0xffffff);
    const col = new Float32Array(vcount * 3);
    for (let i = 0; i < vcount; i++) {
      col[3*i+0] = matColor.r;
      col[3*i+1] = matColor.g;
      col[3*i+2] = matColor.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));

    // No groups, no tangents/uvs/etc — keep attribute layouts identical
    g.clearGroups();

    parts.push(g);
  });

  if (parts.length === 0) return null;

  // 5) Merge into a single geometry (single material)
  const merged = BGU.mergeGeometries(parts, /* useGroups */ false);
  if (!merged.getAttribute('normal')) merged.computeVertexNormals();
  merged.computeBoundingSphere();
  merged.computeBoundingBox();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.0,
    roughness: 1.0,
    side: THREE.FrontSide,
  });

  const mesh = new THREE.Mesh(merged, mat);
  mesh.name = 'MergedVertexColorMesh';
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Return an identity-transform mesh so it doesn’t “follow” any parent transforms
  mesh.position.set(0,0,0);
  mesh.rotation.set(0,0,0);
  mesh.scale.set(1,1,1);

  return mesh;
}

export async function loadGltf(path, gltfLoader, baseScale, adjustPosition, pos, adjustScale, scale, adjustRotation, rot, addTo) {



  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,

      (gltf) => {
        const scene = gltf.scene;
        scene.castShadow = true;
        scene.receiveShadow = true;
  const colorMap = {
  'color_2829873': 0x390062,
  'color_4856858': 0x0cce35,
  'color_6306067': 0x8cd0a4,
  'color_6383466': 0x7d6277,
  'color_10988977': 0x7248ad,
  'color_11107152': 0x477183,
  'color_11452141': 0x347a3f,
  'color_12568524': 0x2c833f,
  'color_14541540': 0xd80623,
  'color_14860437': 0x1045d1,
  'color_15277357': 0x0f4194,
  'color_16089887': 0x2ff8d2,
  'color_16768282': 0x6ff151
};
//console.log(scene)
        scene.traverse((child) => {
          if (child.isMesh) {
            //console.log('Found mesh:', child.name);
            child.castShadow = true;
            child.receiveShadow = true;
                        child.material.roughness = 0.8,
            child.material.metalness = 0.1
            //const name = child.material.name;
            //const hex = colorMap[name] || 0xffffff;
            //child.material = new THREE.MeshStandardMaterial({
            //color: colorMap[child.material.name] || 0xffffff,
            //roughness: 0.8,
            //metalness: 0.1
            //});

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
          scene.rotation.x = THREE.MathUtils.degToRad(rot.x);
          scene.rotation.y = THREE.MathUtils.degToRad(rot.y);
          scene.rotation.z = THREE.MathUtils.degToRad(rot.z);
          
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

export function disposeModel(model, scene) {
  if (!model) return;

  // 1. Remove from scene
  if (scene && model.parent === scene) {
    scene.remove(model);
  }

  // 2. Traverse all children to dispose geometry/material/texture
  model.traverse((obj) => {
    if (obj.isMesh) {
      // Dispose geometry
      if (obj.geometry) {
        obj.geometry.dispose();
      }

      // Dispose material(s)
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((mat) => {
        // Dispose textures in the material
        for (const key in mat) {
          const value = mat[key];
          if (value && value.isTexture) {
            value.dispose();
          }
        }
        mat.dispose();
      });
    }
  });

  // 3. Null out the reference if needed (optional)
  // model = null; // Note: only clears your local reference
}

export function buildMultiPartModel(data, search) {

  const models = [];
  for(let a = 0; a < data.length; a++) {

    const m = data[a];
    const name = m.querySelector("model-name").textContent.trim();
    const model = search(name);
    models.push({
      name: name,
      model: (model === null) ? null : model.clone(true),
      offset: getVectorFromXml(m.querySelector("offset"), 0),
      rotation: getVectorFromXml(m.querySelector("rotation"), 0)
    });
  }

  return models;
}

// Recursively dispose GPU stuff on any Object3D
export function disposeObject3D(obj) {
  obj.traverse((node) => {
    // Textures on materials
    const disposeMaterial = (mat) => {
      if (!mat) return;
      // If it's an array (MultiMaterial), iterate
      const mats = Array.isArray(mat) ? mat : [mat];
      for (const m of mats) {
        // dispose common texture slots if present
        for (const key of ['map','alphaMap','aoMap','bumpMap','normalMap','roughnessMap','metalnessMap','envMap','emissiveMap','lightMap','displacementMap']) {
          if (m[key] && typeof m[key].dispose === 'function') m[key].dispose();
        }
        if (typeof m.dispose === 'function') m.dispose();
      }
    };

    // Three.js meshes/lines/points usually expose geometry/material
    if ('geometry' in node && node.geometry && typeof node.geometry.dispose === 'function') {
      node.geometry.dispose();
    }
    if ('material' in node && node.material) {
      disposeMaterial(node.material);
    }

    // If any custom controls (incl. three-mesh-ui internals) expose dispose()
    if (typeof node.dispose === 'function') node.dispose();
  });
}




