import * as THREE from "three";

import * as ObjAPL from "../asset-loaders/obj-group-asset-pack-loader.js";
import * as UTILS from "../utility/utils.js";

import { Region } from "./region.js"
import { XMLLoader } from "../utility/xml-loader.js";

export class World {

  // Flag whether or not to log information to the console
  #log = false;

  #engine;

  #uniScale;
  #modScale;
  #unscaledWorld; // The unscaled size of the world
  #scaledWorld;   // The scaled size of the world; a Vector3 object
  #worldPosition; // The position of the world; a Vector3 object
  
  #ambientLight;
  #hemisphereLight;
  
  #districtId;
  #districtName;
  #avatarPosition;
  #avatarDirection;

  #commonModels;
  #commonModelsLoaded = 0;

  #districts = [];

  #regions;
  #regionsLoaded = 0;

  constructor(engine) {

    this.#engine = engine;
  }

  getScaledWorld() { return this.#scaledWorld; }
  getWorldPosition() { return this.#worldPosition; }

  getEngine() { return this.#engine; }
  getAvatarPosition() { return this.#avatarPosition; }
  getAvatarDirection() { return this.#avatarDirection; }
  getCommonModels() { return this.#commonModels; }

  #instancedMeshes = [];
  getInstancedMeshes() { return this.#instancedMeshes };

  getInstancedMesh(alias, detail = 3) {

    if(Object.prototype.hasOwnProperty.call(this.#instancedMeshes, alias)) {

      const im = this.#instancedMeshes[alias];
      if(detail === 0 && im.noDetail !== null)
        return im.noDetail;
      else if(detail === 1 && im.lowDetail !== null)
        return im.lowDetail;
      else if(detail === 2 && im.midDetail !== null)
        return im.midDetail;
      else
        return im.highDetail;
    }
  
    return null;
  }

  setModelInstance(alias, indices, detail) {

    if(Object.prototype.hasOwnProperty.call(this.#instancedMeshes, alias)) {

      const high = this.#instancedMeshes[alias].highDetail;
      let h = null;
      if(high !== null)
        h = high.geometry.getAttribute("InstanceVisible");
      
      const mid = this.#instancedMeshes[alias].midDetail;
      let m = null;
      if(mid !== null)
        m = mid.geometry.getAttribute("InstanceVisible");
      
      const low = this.#instancedMeshes[alias].lowDetail;
      let l = null;
      if(low !== null)
        l = low.geometry.getAttribute("InstanceVisible");
      
      const no = this.#instancedMeshes[alias].noDetail;
      let n = null;
      if(no !== null)
        n = no.geometry.getAttribute("InstanceVisible");
  
      if(detail === 0 && no !== null) {
        
        n.setX(indices.no, 1);
        n.needsUpdate = true;
        l.setX(indices.low, 0);
        l.needsUpdate = true;
        m.setX(indices.mid, 0);
        m.needsUpdate = true;
        h.setX(indices.high, 0);
        h.needsUpdate = true;

      } else if(detail === 1 && low !== null) { 

        if(no !== null) {
          n.setX(indices.no, 0);
          n.needsUpdate = true;
        } 
        
        l.setX(indices.low, 1);
        l.needsUpdate = true;
        m.setX(indices.mid, 0);
        m.needsUpdate = true;
        h.setX(indices.high, 0);
        h.needsUpdate = true;        

      } else if(detail === 2 && mid !== null) { 

        if(no !== null) {
          n.setX(indices.no, 0);
          n.needsUpdate = true;
        } 

        if(low !== null) {
          l.setX(indices.low, 0);
          l.needsUpdate = true;
        }         

        m.setX(indices.mid, 1);
        m.needsUpdate = true;
        h.setX(indices.high, 0);
        h.needsUpdate = true;      

      } else {

        if(no !== null) {
          n.setX(indices.no, 0);
          n.needsUpdate = true;
        } 

        if(low !== null) {
          l.setX(indices.low, 0);
          l.needsUpdate = true;
        }         

        if(mid !== null) {
          m.setX(indices.mid, 0);
          m.needsUpdate = true;
        }
        
        h.setX(indices.high, 1);
        h.needsUpdate = true;              
      }
    }       
  }

  /** @function
  * @name getCommonModel
  * Selects the common model with the given alias at the specified level of detail. If a model at the specified level of detail is not available, the next, more detailed model is returned.
  * @param {String} alias The name of the common model to be retrieved
  * @param {Number} [detail=2] The level of detail required (0: no, 1: low, 2: mid, 3: high)
  * @returns {Object3D|null} Returns an Object3D representing the common model requested, or null if it doesn't exist.
  */
  getCommonModel(alias, detail = 4) {

    // 0: Low Detail, 1: Mid Detail, 2: High Detail
    for(let a = 0; a < this.#commonModels.length; a++) {

      if(this.#commonModels[a].getAlias() === alias) {

        if(detail === 0 && this.#commonModels[a].getNoDetail() !== null)
          return this.#commonModels[a].getNoDetail().model;
        else if(detail === 1 && this.#commonModels[a].getLowDetail() !== null)
          return this.#commonModels[a].getLowDetail().model;
        else if(detail === 2 && this.#commonModels[a].getMidDetail() !== null)
          return this.#commonModels[a].getMidDetail().model;        
        else
          return this.#commonModels[a].getHighDetail().model;
      }
    }

    return null;
  }

  checkHighDetailModelExists(alias) {

    for(let a = 0; a < this.#commonModels.length; a++) {

      if(this.#commonModels[a].getAlias() === alias)
        return this.#commonModels[a].getHighDetail();
    }

    return null;
  }

  checkMidDetailModelExists(alias) {

    for(let a = 0; a < this.#commonModels.length; a++) {

      if(this.#commonModels[a].getAlias() === alias)
        return this.#commonModels[a].getMidDetail();
    }

    return null;
  }

  checkLowDetailModelExists(alias) {

    for(let a = 0; a < this.#commonModels.length; a++) {

      if(this.#commonModels[a].getAlias() === alias)
        return this.#commonModels[a].getLowDetail();
    }

    return null;
  }

  checkNoDetailModelExists(alias) {

    for(let a = 0; a < this.#commonModels.length; a++) {

      if(this.#commonModels[a].getAlias() === alias)
        return this.#commonModels[a].getNoDetail();
    }

    return null;
  }  

  getDistrictId() { return this.#districtId; }
  setDistrict(id, name) {
    this.#districtId = id;
    this.#districtName = name;
  }

  getRegions() { return this.#regions; }
  getRegion(index) { return this.#regions[index]; }
  getRegionById(id) {

    for(let a = 0; a < this.#regions.length; a++)
      if(this.#regions[a].getId() === id)
        return this.#regions[a];
    
    return null;
  }

  async loadWorldData() {
    
    const xml = await XMLLoader.loadXml("./assets/xml/world-data.xml", "World Data", false, {
      onProgress: XMLLoader.handleProgress,
      onError: (e) => XMLLoader.handleError(e, null),
    });
  
    await this.#buildWorld(xml); // <-- Wait for the world to be built
  }

  setupTeleportMeshes(model) {
                  // Set the teleport meshes for animation purposes
                  model.traverse((ch) => {
                    if(ch.isMesh) {
                      const material = ch.material;
                      material.color.set(this.getEngine().getTeleportStartColour());
                      material.roughness = 0.5;
                      material.metalness = 0.5;
                      this.getEngine().setTeleportMesh(ch)
                    }
                  });
  }
  async #buildWorld(xml) {

    if(this.#log) console.log("World Data Loaded; Starting to Build World");
    this.#uniScale = this.#engine.getUniversalScale();
    this.#modScale = this.#engine.getModelScale();
    if(this.#engine.getSplashPanel() !== null)
      this.#engine.getSplashPanel().updatePanel("WorldData", "loaded");

    // Reference the XML pertaining to the global world
    const global = xml.querySelector("global");

    // Ascertain the width and depth of the world
    const w = parseInt(global.querySelector("width").textContent.trim());
    const d = parseInt(global.querySelector("depth").textContent.trim());
    this.#unscaledWorld = new THREE.Vector3(w, 0, d);

    this.#scaledWorld = new THREE.Vector3(
      UTILS.scaleDistance(w, this.#uniScale, this.#modScale),
      0, // No need to scale along the y-axis
      UTILS.scaleDistance(d, this.#uniScale, this.#modScale)
    );
    
    this.#worldPosition = UTILS.applyVectorToWorld(
      UTILS.getVectorFromXml(global.querySelector("position"), 0),
      this.#uniScale,
      this.#modScale
    );

    // Add an axes-helper at the world center
    this.#buildAxesHelper();    
    // Add a grid-helper at the floor level
    //this.#buildGridHelper();
    // Build the skybox with the XML data
    this.#buildSkyBox(global.querySelector("skybox").getElementsByTagName("box-image"));
    // Add the ambient light
    //this.#ambientLight = this.#buildAmbientLight(global.querySelector("ambient-light")); 
    // Build the hemispherical light
    //this.#hemisphereLight = this.#buildHemisphereLight(global.querySelector("hemisphere-light")); 

    this.#districtId = parseInt(global.querySelector("district").textContent.trim());

    // Ascertain the avatar's position and direction
    const ap = UTILS.getVectorFromXml(global.querySelector("avatar-position"), 0);
    this.#avatarPosition = UTILS.applyVectorToWorld(ap, this.#uniScale, this.#modScale);
    this.#avatarDirection = UTILS.getVectorFromXml(global.querySelector("avatar-direction"), 0);

    // Load and position any base models, such as terrain features
    const base = global.querySelector("base-models").getElementsByTagName("model");
    for(let a = 0; a < base.length; a++) {

      const m = base[a];
      const name = m.querySelector("name").textContent.trim();
      const file = m.querySelector("file").textContent.trim();

      const merge = parseInt(m.querySelector("merge").textContent.trim()) === 0 ? false : true; 
      const scale = parseFloat(m.querySelector("scale").textContent.trim());
      const remap = parseInt(m.querySelector("remap").textContent.trim()) === 0 ? false : true; 
      const pos = UTILS.getVectorFromXml(m.querySelector("position"), 0);
      
      await UTILS.loadRegionModel(

        ("./assets/models/base/" + name + ".glb"), this.#engine.getRenderer()
      
      ).then(model => {    

        model.scale.set((scale * this.#uniScale), (scale * this.#uniScale), (scale * this.#uniScale));
        model.position.set(
          UTILS.scaleDistance(pos.x, this.#uniScale, this.#modScale),
          UTILS.scaleDistance(pos.y, this.#uniScale, this.#modScale),
          UTILS.scaleDistance(pos.z, this.#uniScale, this.#modScale)
        )

        // Apply transformations and shadows
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
          }
        });

        this.#engine.getScene().add(model);
      });
    }

    // Load the common models and store them
    if(this.#log) console.log("Beginning to Load Common Models");
    const common = global.querySelector("common-models").getElementsByTagName("model");
    this.#commonModels = await this.#loadCommonModels(
      common,
      (total) => { 
        this.#commonModelsLoaded++;
        if(this.#log) console.log("Common Models Loaded: " + this.#commonModelsLoaded + " / " + total);
        if(this.#engine.getSplashPanel() !== null)
          this.#engine.getSplashPanel().updatePanel("CommonModelData", (this.#commonModelsLoaded + " / " + total));
      }
    );
    
    if(this.#log) console.log("Common Models: ", this.#commonModels)
    if(this.#log) console.log("Finished Loading Common Models");
    
    // At this all of the common models, and their detailed variants have loaded
    // Begin to create the InstancedMeshes
    for(let a = 0; a < this.#commonModels.length; a++) {

      const common = this.#commonModels[a];
      const alias = common.getAlias();
      const variants = {

        highDetail: ((common.getHighDetail() !== null) ? common.getHighDetail().model : null),
        midDetail: ((common.getMidDetail() !== null) ? common.getMidDetail().model : null),
        lowDetail: ((common.getLowDetail() !== null) ? common.getLowDetail().model : null),
        noDetail: ((common.getLowDetail() !== null) ? common.getNoDetail().model : null),
      };

      this.#createInstancedMesh(alias, variants);
    }

    // Process the regions in the world
    if(this.#log) console.log("Beginning to Build Regions");
    const dData = global.querySelector("districts").getElementsByTagName("district");
    for(let a = 0; a < dData.length; a++) {

      const d = {};
      d.id = parseInt(dData[a].querySelector("id").textContent);
      d.name = dData[a].querySelector("name").textContent;
      d.files = [];
      const rData = dData[a].querySelector("regions").getElementsByTagName("file");
      for(let b = 0; b < rData.length; b++)
        d.files.push(rData[b].textContent.trim());

      this.#districts.push(d);
    }

    const districts = this.#districts;
    for(let a = 0; a < districts.length; a++) {

      const d = districts[a];
      const id = d.id;
      if(id === this.#districtId) {
        
        this.#districtName = d.name;
        const regions = d.files;
        this.#regions = await this.#buildRegions(
          regions,
          (total) => { 
            this.#regionsLoaded++;
            if(this.#log) console.log("Regions Loaded: " + this.#regionsLoaded + " / " + total);
            if(this.#engine.getSplashPanel() !== null)
              this.#engine.getSplashPanel().updatePanel("RegionData", (this.#regionsLoaded + " / " + total));
          }
        );
        
        if(this.#log) console.log("Regions: ", this.#regions)
        if(this.#log) console.log("Finished Loading Regions");
      }
    }

    if(this.#engine.getSplashPanel() !== null)
      this.#engine.getSplashPanel().updatePanel("TraipseData", null);
  }

  #createInstancedMesh(alias, models, estimate = 250) {

    this.#instancedMeshes[alias] = {};
    const iMesh = this.#instancedMeshes[alias];

    if(this.#log) console.log("Creating Instanced Mesh for model-set: " + alias);

    // Create the mesh for the high-detail model
    if(models.highDetail !== null) {

      const geo = models.highDetail.geometry;
      const mat = models.highDetail.material.clone();  
      mat.vertexColors = true;
      const high = new THREE.InstancedMesh(geo, mat, estimate);
      this.#applyInstancedMeshShaderFlag(high);
      high.count = 0;
      high.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      high.frustumCulled = false;
      this.#engine.getScene().add(high);
      
      iMesh.highDetail = high;
      if(this.#log) console.log("-- High-detail version...");

    } else {

      iMesh.highDetail = null;
    }

    // Create the mesh for the mid-detail model
    if(models.midDetail !== null) {

      const geo = models.midDetail.geometry;
      const mat = models.midDetail.material.clone();  
      mat.vertexColors = true;
      const mid = new THREE.InstancedMesh(geo, mat, estimate);
      this.#applyInstancedMeshShaderFlag(mid);
      mid.count = 0;
      mid.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mid.frustumCulled = false;
      this.#engine.getScene().add(mid);
      
      iMesh.midDetail = mid;
      if(this.#log) console.log("-- Mid-detail version...");

    } else {

      iMesh.midDetail = null;
    }

    // Create the mesh for the low-detail model
    if(models.lowDetail !== null) {

      const geo = models.lowDetail.geometry;
      const mat = models.lowDetail.material.clone();  
      mat.vertexColors = true;
      const low = new THREE.InstancedMesh(geo, mat, estimate);
      this.#applyInstancedMeshShaderFlag(low);
      low.count = 0;
      low.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      low.frustumCulled = false;
      this.#engine.getScene().add(low);
      
      iMesh.lowDetail = low;
      if(this.#log) console.log("-- Low-detail version...");

    } else {

      iMesh.lowDetail = null;
    }    

    // Create the mesh for the no-detail model
    if(models.noDetail !== null) {

      const geo = models.noDetail.geometry;
      const mat = models.noDetail.material.clone();  
      mat.vertexColors = true;
      const no = new THREE.InstancedMesh(geo, mat, estimate);
      this.#applyInstancedMeshShaderFlag(no);
      no.count = 0;
      no.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      no.frustumCulled = false;
      this.#engine.getScene().add(no);
      
      iMesh.noDetail = no;
      if(this.#log) console.log("-- No-detail version...");

    } else {

      iMesh.noDetail = null;
    }    
  }

  #applyInstancedMeshShaderFlag(inst) {

    const cap = inst.instanceMatrix.count; // capacity from constructor
    const vis = new Float32Array(cap).fill(1);           // 1 = shown, 0 = hidden
    inst.geometry.setAttribute("InstanceVisible", new THREE.InstancedBufferAttribute(vis, 1));
    inst.material.onBeforeCompile = (shader) => {
      // Pick the right qualifier for WebGL1 vs WebGL2
      const usesWebGL2 = /#version 300 es/.test(shader.vertexShader);
      const qualifier = usesWebGL2 ? 'in' : 'attribute';

      // Declare the attribute
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>\n${qualifier} float InstanceVisible;`
      );

      // Early-out inside main() right after vertex setup
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        if (InstanceVisible < 0.5) {
          // Kill this vertex by bailing out before position/projection is written
          return;
        }
        `
      );
    };
    inst.material.needsUpdate = true; // force recompile
  }

  #buildAxesHelper() {

    // Add the Axes Helper
    const axesHelper = new THREE.AxesHelper(100);
    axesHelper.position.set(0, 0.1, 0);
    this.#engine.getScene().add(axesHelper);   
  }

  #buildGridHelper() {

    const size = ((this.#scaledWorld.x > this.#scaledWorld.z) ? this.#scaledWorld.x : this.#scaledWorld.z);
    const divisions = ((this.#unscaledWorld.x > this.#unscaledWorld.z) ? this.#unscaledWorld.x : this.#unscaledWorld.z);
    const gridHelper = new THREE.GridHelper(size, divisions, 0x004400, 0x004400);
    gridHelper.position.set(0, 0, 0);
    this.#engine.getScene().add(gridHelper);
  }

  #buildSkyBox(images) {

    const loader = new THREE.CubeTextureLoader();
    const boxTex = loader.load([
      images[0].textContent.trim(), images[1].textContent.trim(), images[2].textContent.trim(),
      images[3].textContent.trim(), images[4].textContent.trim(), images[5].textContent.trim()
    ]);
    
    this.#engine.getScene().background = boxTex;
  }

  #buildAmbientLight(data) {

    const colour = data?.querySelector("colour")?.textContent.trim() || "#FFFFFF";
    const intensity = parseFloat(data?.querySelector("intensity")?.textContent.trim() || 0.1);
    const light = new THREE.AmbientLight(new THREE.Color(colour), intensity);
    this.#engine.getScene().add(light);
    return light;
  }

  #buildHemisphereLight(data) {

    const sky = data?.querySelector("sky-colour")?.textContent.trim() || "#FFFFBB";
    const ground = data?.querySelector("ground-colour")?.textContent.trim() || "#080820";
    const intensity = parseFloat(data?.querySelector("intensity")?.textContent.trim() || 0.1);
    const light = new THREE.HemisphereLight(new THREE.Color(sky), new THREE.Color(ground), intensity);
    this.#engine.getScene().add(light);
    return light;
  }

  async #loadCommonModels(common, onModelLoaded) {

    const uni = this.getEngine().getUniversalScale();

    const promises = [];
    for(let a = 0; a < common.length; a++) {

      const c = common[a];
      const name = c.querySelector("name").textContent.trim();
      const file = c.querySelector("file").textContent.trim();

      const high = c?.querySelector("high-detail") || null;
      const mid = c?.querySelector("mid-detail") || null;
      const low = c?.querySelector("low-detail") || null;
      const no = c?.querySelector("no-detail") || null;
      
      // Process the high-detail model
      const hMerge = parseInt(high.querySelector("merge").textContent.trim()) === 0 ? false : true; 
      const hScale = parseFloat(high.querySelector("scale").textContent.trim());
      const hRemap = parseInt(high.querySelector("remap").textContent.trim()) === 0 ? false : true; 
      const hRotNode = high.querySelector("rotation");
      const hRot = hRotNode ? UTILS.getVectorFromXml(hRotNode, 0) : null;
      const hModel = await UTILS.loadCommonGlb(file, hMerge, hScale, uni, hRot, hRemap, this.#engine.getRenderer());

      const highData = {
        file: file,
        merge: hMerge,
        scale: hScale,
        remap: hRemap,
        rotation: hRot,
        model: hModel
      };

      if(name.includes("-teleport-arrow-"))
        this.setupTeleportMeshes(hModel);

      // if(this.#log) console.log("--high-detail version loaded...");

      // Process the low-detail model, if there is one
      let midData = null;
      if(mid !== null) {
        
        const mFile = (file.substring(0, file.length - 4) + "-mid-detail.glb");
        const mMerge = parseInt(mid.querySelector("merge").textContent.trim()) === 0 ? false : true; 
        const mScale = parseFloat(mid.querySelector("scale").textContent.trim());
        const mRemap = parseInt(mid.querySelector("remap").textContent.trim()) === 0 ? false : true; 
        const mRotNode = mid.querySelector("rotation");
        const mRot = mRotNode ? UTILS.getVectorFromXml(mRotNode, 0) : null;
        const mModel = await UTILS.loadCommonGlb(mFile, mMerge, mScale, uni, mRot, mRemap, this.#engine.getRenderer());
        
        midData = {
          file: mFile,
          merge: mMerge,
          scale: mScale,
          remap: mRemap,
          rotation: mRot,
          model: mModel
        };

        if(name.includes("-teleport-arrow-"))
          this.setupTeleportMeshes(mModel);        

        // if(this.#log) console.log("--mid-detail version loaded...");
      }

      // Process the low-detail model, if there is one
      let lowData = null;
      if(low !== null) {
        
        const lFile = (file.substring(0, file.length - 4) + "-low-detail.glb");
        const lMerge = parseInt(low.querySelector("merge").textContent.trim()) === 0 ? false : true; 
        const lScale = parseFloat(low.querySelector("scale").textContent.trim());
        const lRemap = parseInt(low.querySelector("remap").textContent.trim()) === 0 ? false : true; 
        const lRotNode = low.querySelector("rotation");
        const lRot = lRotNode ? UTILS.getVectorFromXml(lRotNode, 0) : null;
        const lModel = await UTILS.loadCommonGlb(lFile, lMerge, lScale, uni, lRot, lRemap, this.#engine.getRenderer());
        
        lowData = {
          file: lFile,
          merge: lMerge,
          scale: lScale,
          remap: lRemap,
          rotation: lRot,
          model: lModel
        };
        
        if(name.includes("-teleport-arrow-"))
          this.setupTeleportMeshes(lModel);

        // if(this.#log) console.log("--low-detail version loaded...");
      }

      // Process the no-detail model, if there is one
      let noData = null;
      if(no !== null) {
        
        const nFile = (file.substring(0, file.length - 4) + "-no-detail.glb");
        const nMerge = parseInt(no.querySelector("merge").textContent.trim()) === 0 ? false : true; 
        const nScale = parseFloat(no.querySelector("scale").textContent.trim());
        const nRemap = parseInt(no.querySelector("remap").textContent.trim()) === 0 ? false : true; 
        const nRotNode = no.querySelector("rotation");
        const nRot = nRotNode ? UTILS.getVectorFromXml(nRotNode, 0) : null;
        const nModel = await UTILS.loadCommonGlb(nFile, nMerge, nScale, uni, nRot, nRemap, this.#engine.getRenderer());
        
        noData = {
          file: nFile,
          merge: nMerge,
          scale: nScale,
          remap: nRemap,
          rotation: nRot,
          model: nModel
        };

        if(name.includes("-teleport-arrow-"))
          this.setupTeleportMeshes(nModel);
        
        // if(this.#log) console.log("--no-detail version loaded...");
      }      

      promises.push(
        new CommonModel(
          name,
          highData,
          midData,
          lowData,
          noData
        )
      );

      onModelLoaded(common.length);
    }

    return Promise.all(promises); 
  }

  async loadDistrict(id) {

    const districts = this.#districts;
    this.#regionsLoaded = 0;
    for(let a = 0; a < districts.length; a++) {

      const d = districts[a];
      if(id === d.id) {
        
        this.#districtId = id;
        this.#districtName = d.name;
        const regions = d.files;
        this.#regions = await this.#buildRegions(
          regions,
          (total) => { 
            this.#regionsLoaded++;
            if(this.#regionsLoaded === total)
              this.#engine.setDistrictLoaded(true);
          }
        );
        
        if(this.#log) console.log("Regions: ", this.#regions)
        if(this.#log) console.log("Finished Loading Regions");
      }
    }
  }

  async #buildRegions(regions, onRegionLoaded) {
    
    const promises = [];
    for(let a = 0; a < regions.length; a++) {

      const file = regions[a];
      const region = new Region(this, file);
      await region.loadRegionData(file).then(function() {

        promises.push(region);

      }.bind(this));

      onRegionLoaded(regions.length);
    }

    return Promise.all(promises);
  }

  manageProximities(proximities) {

    for(let a = 0; a < this.#regions.length; a++) {

      const prox = proximities[a];
      this.#regions[a].manageProximity(prox);
    }
  }  

  refreshDisplayBoards(time) {

    for(let a = 0; a < this.#regions.length; a++)
      this.#regions[a].refreshDisplayBoards(time);
  }
}

class CommonModel {

  #alias;
  #highDetail;
  #midDetail;
  #lowDetail;
  #noDetail;


  constructor(alias, highDetail, midDetail, lowDetail, noDetail) {

    this.#alias = alias;
    this.#highDetail = highDetail;
    this.#midDetail = midDetail;
    this.#lowDetail = lowDetail;
    this.#noDetail = noDetail;
  }

  getAlias() { return this.#alias; }
  getHighDetail() { return this.#highDetail; }
  getMidDetail() { return this.#midDetail; }
  getLowDetail() { return this.#lowDetail; }
  getNoDetail() { return this.#noDetail; }
}