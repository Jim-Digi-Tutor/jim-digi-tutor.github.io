import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as BGU from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshoptDecoder } from 'three/examples/meshopt_decoder.module.js';

export const PROX_DISTANT = 0;

export function addSpace(count) {

  let str = "";
  for(let a = 0; a < count; a++)
    str += String.fromCharCode(160);

  return str;
}

export function setCameraHeight(camHeight, dolly, uniScale, modScale, camY) {

  dolly.position.y = (scaleDistance(camHeight, uniScale, modScale) - camY);
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

export async function tempLoader(scene) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

  loader.load('./assets/models/common/structures/tower-base-with-door.glb', (gltf) => {
  const a = gltf.scene;
  a.position.set(-3,0,-2);
  scene.add(a);
  dump(a, 'NON-OPT');
});

loader.load('./assets/models/common/structures/tower-base-with-door-opt.glb', (gltf) => {
  const b = gltf.scene;
  b.position.set(+3,0,-2);
  scene.add(b);
  dump(b, 'OPT');
});

function dump(root, tag) {
  const bb = new THREE.Box3().setFromObject(root);
  console.log(tag, 'world bbox:', bb.getSize(new THREE.Vector3()).toArray());

  root.traverse(o => {
    if (o.isMesh) {
      console.log(tag, '[mesh]', o.name,
        'local scale:', o.scale.toArray(),
        'has non-identity local matrix:', !o.matrix.equals(new THREE.Matrix4()),
        'geometry bounds (local):',
        (() => {
          const gbb = new THREE.Box3().setFromBufferAttribute(o.geometry.attributes.position);
          const size = new THREE.Vector3(); gbb.getSize(size); return size.toArray();
        })()
      );
    }
  });
}
}

export async function loadCommonGlb(path, merge, scale, rotation) {

  return new Promise((resolve, reject) => {

    // Set the loader to manage meshopt decoding
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

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
        }

        // Scale the base model
        clone.scale.set(scale, scale, scale);

        // Rotate the base model
        clone.rotation.set(
          THREE.MathUtils.degToRad(rotation.x),
          THREE.MathUtils.degToRad(rotation.y),
          THREE.MathUtils.degToRad(rotation.z)
        );

        console.log(clone)
        resolve(clone);
      },

      undefined,
      
      (err) => reject(err)
    );
  });
}

function mergeToSingleVertexColorMesh(root) {
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
function mergeToSingleVertexColorMesh_FIXED(root) {
  const geos = [];

  // 1) Ensure world matrices are current
  root.updateMatrixWorld(true);

  root.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry) return;

    // Use the mesh’s base color if present; else white.
    const matColor = (obj.material && obj.material.color)
      ? obj.material.color
      : new THREE.Color(0xffffff);

    // 2) Deep-clone geometry so we can safely mutate (meshopt GLBs often share buffers!)
    const g = deepCloneWritableGeometry(obj.geometry);

    // 3) Work with non-indexed, non-interleaved data to avoid index collisions & layout mismatches
    const gn = g.index ? g.toNonIndexed() : g;

    // 4) Apply WORLD transform (positions & normals handled by applyMatrix4)
    gn.applyMatrix4(obj.matrixWorld);

    // 5) Normalize attribute set across all pieces
    //    (strip anything you don't want to carry into the merged geometry)
    if (gn.getAttribute('uv'))      gn.deleteAttribute('uv');
    if (gn.getAttribute('uv2'))     gn.deleteAttribute('uv2');
    if (gn.getAttribute('tangent')) gn.deleteAttribute('tangent');

    // 6) Ensure vertex colors exist (bake per-mesh color)
    const vcount = gn.getAttribute('position').count;
    if (!gn.getAttribute('color')) {
      const colors = new Float32Array(vcount * 3);
      for (let i = 0; i < vcount; i++) {
        colors[3*i + 0] = matColor.r;
        colors[3*i + 1] = matColor.g;
        colors[3*i + 2] = matColor.b;
      }
      gn.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    if (!gn.getAttribute('normal')) {
      // If normals went missing for any reason, rebuild after merge as well.
      gn.computeVertexNormals();
    }

    // Clear groups so we truly end up with a single draw call & single material
    gn.clearGroups();

    geos.push(gn);
  });

  if (geos.length === 0) return null;

  // 7) Merge — NOTE: useGroups=false (second arg) because we want one material
  const mergedGeo = BGU.mergeGeometries(geos, /* useGroups */ false);
          mergedGeo.computeVertexNormals()
  if (!mergedGeo.getAttribute('normal')) mergedGeo.computeVertexNormals();
  mergedGeo.computeBoundingSphere();
  mergedGeo.computeBoundingBox();

  const singleMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.0,
    roughness: 1.0,
    side: THREE.FrontSide,
  });

  const mergedMesh = new THREE.Mesh(mergedGeo, singleMat);
  mergedMesh.name = 'MergedVertexColorMesh';
  mergedMesh.castShadow = mergedMesh.receiveShadow = true;

  // 8) Make sure it doesn’t inherit transforms that would “double-apply”
  mergedMesh.position.set(0, 0, 0);
  mergedMesh.rotation.set(0, 0, 0);
  mergedMesh.scale.set(1, 1, 1);
  mergedMesh.updateMatrix();
  mergedMesh.matrixAutoUpdate = true; // normal behavior; identity at start

  // If you previously parented under `root`, prefer attaching to the scene (or an identity parent):
  // scene.add(mergedMesh);
  // (or) identityParent.add(mergedMesh);

  return mergedMesh;
}

/** Deep-clone a geometry so attributes and index have their own typed arrays. */
function deepCloneWritableGeometry(src) {
  const dst = new THREE.BufferGeometry();
  // clone attributes
  for (const name in src.attributes) {
    const attr = src.getAttribute(name);
    dst.setAttribute(name, attr.clone()); // clones array, not just the wrapper
  }
  // clone index
  if (src.index) dst.setIndex(src.index.clone());
  // copy draw range & morph data if you care (optional for this use case)
  dst.drawRange.start = src.drawRange.start;
  dst.drawRange.count = src.drawRange.count;
  // (Optional) copy userData if needed:
  // dst.userData = JSON.parse(JSON.stringify(src.userData || {}));
  return dst;
}
// --- Runtime baker/merger ---
function mergeToSingleVertexColorMesh__distort(root) {
  const geos = [];
  const tmpMatrix = new THREE.Matrix4();

  root.updateMatrixWorld(true);

  root.traverse((obj) => {
    if (!obj.isMesh) return;

    // Get a flat base color from the material (fallback white)
    const matColor = (obj.material && obj.material.color) ? obj.material.color : new THREE.Color(0xffffff);

    // Clone geometry into world space
    const g = obj.geometry.clone();
    tmpMatrix.copy(obj.matrixWorld);
    g.applyMatrix4(tmpMatrix);

    // Ensure NON-indexed geometry so colors don't interpolate across shared vertices
    const gn = g.index ? g.toNonIndexed() : g;

    // Strip attributes we don't need so layouts match across all pieces
    // (Keep position + normal; we'll add color below)
    if (gn.getAttribute('uv'))   gn.deleteAttribute('uv');
    if (gn.getAttribute('uv2'))  gn.deleteAttribute('uv2');
    if (gn.getAttribute('tangent')) gn.deleteAttribute('tangent');

    // Add per-vertex color (same color for all verts in this piece)
    const vcount = gn.getAttribute('position').count;
    const colors = new Float32Array(vcount * 3);
    for (let i = 0; i < vcount; i++) {
      colors[3*i + 0] = matColor.r;
      colors[3*i + 1] = matColor.g;
      colors[3*i + 2] = matColor.b;
    }
    gn.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // If normals are missing, rebuild (rare for GLB)
    if (!gn.getAttribute('normal')) gn.computeVertexNormals();

    geos.push(gn);
  });

  // Merge all pieces into ONE geometry
  const mergedGeo = BGU.mergeGeometries(geos, true);
  mergedGeo.computeBoundingSphere();
  mergedGeo.computeBoundingBox();

  // Single material that uses vertex colors
  const singleMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.0,
    roughness: 1.0,
    side: THREE.FrontSide,   // keep culling on for XR perf
  });

  const mergedMesh = new THREE.Mesh(mergedGeo, singleMat);
  mergedMesh.name = 'MergedVertexColorMesh';
  mergedMesh.castShadow = mergedMesh.receiveShadow = true;

  return mergedMesh;
}

function mergeToSingleVertexColorMesh___(root) {
  const geos = [];
  const tmpMatrix = new THREE.Matrix4();

  root.updateMatrixWorld(true);

  root.traverse((obj) => {
    if (!obj.isMesh) return;

    const matColor = (obj.material && obj.material.color)
      ? obj.material.color
      : new THREE.Color(0xffffff);

    // Bake LOCAL transform only
    const g = obj.geometry.clone();
    tmpMatrix.copy(obj.matrix); // <— local matrix, not world
    g.applyMatrix4(tmpMatrix);

    const gn = g.index ? g.toNonIndexed() : g;

    if (gn.getAttribute('uv')) gn.deleteAttribute('uv');
    if (gn.getAttribute('uv2')) gn.deleteAttribute('uv2');
    if (gn.getAttribute('tangent')) gn.deleteAttribute('tangent');

    const vcount = gn.getAttribute('position').count;
    const colors = new Float32Array(vcount * 3);
    for (let i = 0; i < vcount; i++) {
      colors[3*i + 0] = matColor.r;
      colors[3*i + 1] = matColor.g;
      colors[3*i + 2] = matColor.b;
    }
    gn.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    if (!gn.getAttribute('normal')) gn.computeVertexNormals();

    geos.push(gn);
  });

  const mergedGeo = BGU.mergeGeometries(geos, true);
  mergedGeo.computeBoundingSphere();
  mergedGeo.computeBoundingBox();

  const singleMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.0,
    roughness: 1.0,
    side: THREE.FrontSide,
  });

  const mergedMesh = new THREE.Mesh(mergedGeo, singleMat);
  mergedMesh.name = 'MergedVertexColorMesh';
  mergedMesh.castShadow = mergedMesh.receiveShadow = true;

  return mergedMesh;
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