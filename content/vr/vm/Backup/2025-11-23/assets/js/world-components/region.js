import * as THREE from "three";

import * as UTILS from "../utility/utils.js";

import { DisplayBoardManager } from "./display-board-manager.js"
import { RegionBaseModel } from "./sub-components/region-base-model.js";
import { XMLLoader } from "../utility/xml-loader.js";

export class Region {

  // Flag whether or not to log information to the console
  #log = false;

  #world;
  #file;
  #proximity;

  #uniScale;
  #modScale;

  #id;
  #alias;
  #name;

  #size;
  #position;

  #baseModel;
  #baseMeshes;
  #modelData;
  #collidables;
  #interactables;
  #teleports;
  
  #lights;
  #infoBoardManager;

  // Temporary objects used when adding instances to Instanced Meshes
  #_pos = new THREE.Vector3();
  #_rot = new THREE.Euler(0, 0, 0, "XYZ");
  #_quat = new THREE.Quaternion();
  #_scl = new THREE.Vector3();
  #_mat = new THREE.Matrix4();


  //#_rot = new THREE.Euler(0, 0, 0, 'YXZ'); // or whatever order your rotations use

  constructor(world, file) {

    this.#world = world;
    this.#file = file;
    this.#proximity = UTILS.PROX_DISTANT;

    this.#uniScale = world.getEngine().getUniversalScale();
    this.#modScale = world.getEngine().getModelScale();

    this.#baseMeshes = [];
  }

  async loadRegionData(file) {
    
    const xml = await XMLLoader.loadXml(file, "Region Data", false, {
      onProgress: XMLLoader.handleProgress,
      onError: (e) => XMLLoader.handleError(e, null),
    });
  
    await this.#buildRegion(xml); // <-- Wait for the region to be built
  } 
   
  async #buildRegion(xml) {

    const promises = [];

    const uniScale = this.#uniScale;
    const modScale = this.#modScale;

    this.#id = parseInt(xml.querySelector("id").textContent.trim());
    this.#alias = xml.querySelector("alias").textContent.trim();
    this.#name = xml.querySelector("name").textContent.trim();

    const w = parseInt(xml.querySelector("width").textContent.trim());
    const d = parseInt(xml.querySelector("depth").textContent.trim());    
    this.#size = new THREE.Vector3(UTILS.scaleDistance(w, this.#uniScale, this.#modScale), 0, UTILS.scaleDistance(d, uniScale, modScale));
    const p = UTILS.getVectorFromXml(xml.querySelector("position"), 0);
    this.#position = new THREE.Vector3(
      UTILS.scaleDistance(p.x, this.#uniScale, this.#modScale),
      UTILS.scaleDistance(p.y, this.#uniScale, this.#modScale),
      UTILS.scaleDistance(p.z, this.#uniScale, this.#modScale)
    );
    
    promises.push(await this.#processRegionModel(xml));
 
    // Process any models and add them to the scene
    this.#modelData = [];
    this.#collidables = [];
    this.#interactables = [];
    const models = xml.querySelector("models").getElementsByTagName("model");
    for(let a = 0; a < models.length; a++) {
      
      const m = models[a];
      const name = m.querySelector("name").textContent.trim();
      const modName = m?.querySelector("model-name")?.textContent.trim() || "";
      const type = m.querySelector("type").textContent.trim();
      const collidable = parseInt(m.querySelector("collidable").textContent.trim()) === 0 ? false : true; 
      const scale = m?.querySelector("scale")?.textContent.trim() || 1;
      const position = UTILS.applyVectorToWorld(UTILS.getVectorFromXml(m.querySelector("position"), 0), uniScale, modScale);
      const rotation = UTILS.getVectorFromXml(m.querySelector("rotation"), 0);
      switch(type) {

        case "common-model":
          const cMod = new CommonModel(this, name, scale, position, rotation, this.#world.getCommonModel(modName).clone(true));
          cMod.buildModel(
            this.#uniScale,
            this.#modScale,
            ((collidable) ? this.#world.getEngine().getCollidables() : null),
            this.#interactables,
            this.#world.getEngine().getScene()
          );
          break;

        case "multi-part-common-model":
          const parts = UTILS.buildMultiPartModel(m.getElementsByTagName("part"), this.#world.getCommonModel.bind(this.#world));
          const mpMod = new MultiPartModel(this, name, position, rotation, parts);
          mpMod.buildModel(
            this.#uniScale,
            this.#modScale,
            ((collidable) ? this.#world.getEngine().getCollidables() : null),
            this.#interactables,
            this.#world.getEngine().getScene()
          );
          break;
      }

      return Promise.all(promises);
    }

    // Log the base models, if required
    if(this.#log) console.log("Base Models: ", this.#baseMeshes);

    // Collect the data for any teleports
    const ports = xml.querySelector("teleports").getElementsByTagName("teleport");
    for(let a = 0; a < ports.length; a++) {

      const port = new Teleport(this, ports[a]);
      this.#world.getEngine().setTeleport(port);
    }

    // Process any lights in the region
    this.#lights = [];
    const lights = xml.querySelector("lights").getElementsByTagName("light");
    for(let a = 0; a < lights.length; a++)
      this.#lights.push(new LightSource(lights[a], this.#world.getEngine().getScene(), uniScale, modScale));

    // Process the information boards
    if(this.#log) console.log("Loading Info Boards for Region " + this.#name + " (" + this.#id + ")");
    const boards = xml.querySelector("info-boards").getElementsByTagName("info-board");
    this.#infoBoardManager = new DisplayBoardManager(this, boards);
    this.#infoBoardManager.processInfoBoards(true);
    if(this.#log) console.log("Finished Loading Info Boards for Region " + this.#name + " (" + this.#id + ")");
  }

  async #processRegionModel(xml) {

    // Create convenience references to scale members
    const uniScale = this.#uniScale;
    const modScale = this.#modScale;

    // Identify the underlying region model
    const logMod = true;
    const base = xml.querySelector("base");
    this.#baseModel = new RegionBaseModel(this, base);
    const name = base.querySelector("name").textContent.trim();
    
    const now = Date.now();
    const promises = [];
    promises.push(

      await UTILS.loadRegionModel(

        ("./assets/models/regions/" + name + ".glb"), this.#world.getEngine().getRenderer()
      
      ).then(model => {
            
        if(logMod && this.#log) console.log("-- Processing Region .glb File for " + this.#name);

        // Iterate through the children on the Blender model
        model.children.forEach(child => {

          if(logMod && this.#log) console.log("---- Processing Model " + child.name);
          
          // Create a clone of this model
          // Use let rather than const to allow vertex merging later
          let mod = child.clone(true);

          // Ascertain the type of the model
          const modelType = mod.userData?.modelType ?? "";

          // The model is the region's base model
          if(modelType.includes("region-base-")) {

            const baseRemap = mod.userData?.baseRemap ?? false;
            const baseMerge = mod.userData?.baseMerge ?? false;
            if(logMod && this.#log) console.log("------ Model identified as a base region model...");
            if(modelType === "region-base-high")
              this.#baseModel.processModel(3, mod, baseRemap, baseMerge);
            else if(modelType === "region-base-mid")
              this.#baseModel.processModel(2, mod, baseRemap, baseMerge);
            else if(modelType === "region-base-low")
              this.#baseModel.processModel(1, mod, baseRemap, baseMerge);            
            else if(modelType === "region-base-no")
              this.#baseModel.processModel(0, mod, baseRemap, baseMerge);            
          }  
          
          if(modelType === "collidable") {


            //mod.scale.set((modScale * uniScale), (modScale * uniScale), (modScale * uniScale));
                
                // No need to scale position, the region's position has already been normalised
                //const pos = this.#parent.getPosition();
                //target.model.position.set(pos.x, pos.y, pos.z);
              
                //target.model.rotation.set(
                  //THREE.MathUtils.degToRad(this.#rotation.x),
                  //THREE.MathUtils.degToRad(this.#rotation.y),
                  //THREE.MathUtils.degToRad(this.#rotation.z)
               // )

            this.#world.getEngine().setCollidable(mod);
            this.#world.getEngine().getScene().add(mod);
          }

          // Prepare the objects for any position, scale, or rotational adjustments
          // These values are "defaults", but can be modified by the model's position in the scene
          const defPos = new THREE.Vector3(0, 0, 0);    // Position
          const defScale = new THREE.Vector3(1, 1, 1);  // Scale
          const defRot = new THREE.Vector3(0, 0, 0);    // Rotation

          if(modelType === "teleport") {
            
            const size = mod.userData?.modelSize ?? "large";
            const direction = mod.userData?.modelDirection ?? "up";
            const alias = (size + "-teleport-arrow-" + direction);

            if(logMod && this.#log) console.log("------ Common Teleport Model Identified " + alias);
            
            const teleportAlias = mod.userData?.teleportAlias ?? null;
            const check = this.#world.getCommonModel(alias, 0);
            if(check !== null) {

              // Make a clone of the model to avoid affecting the original
              const c = check.clone(true);
              if(logMod && this.#log) console.log("-------- Common Teleport Model Located");

              // Set position on the region position plus the child model's scene position
              this.#_pos.set(
                (this.#position.x + UTILS.scaleDistance(mod.position.x, this.#uniScale, this.#modScale)),
                (this.#position.y + UTILS.scaleDistance(mod.position.y, this.#uniScale, this.#modScale)),
                (this.#position.z + UTILS.scaleDistance(mod.position.z, this.#uniScale, this.#modScale)) 
              );
              
              // If the model is to be scaled on the child model's scale setting, do so
              // Most models should have their scale applied at common export - this will eventually become redundant
              this.#_scl = c.scale.multiply(mod.scale);

              // Base rotation on child model's rotation within the scene
              this.#_rot.set(mod.rotation.x, mod.rotation.y, mod.rotation.z);
              this.#_quat.setFromEuler(this.#_rot);

              // Log the data to the console, if required
              if(logMod && this.#log) console.log("-------- Position: (" + this.#_pos.x.toFixed(2) + ", " + this.#_pos.y.toFixed(2) + ", " + this.#_pos.z.toFixed(2) + ")");
              if(logMod && this.#log) console.log("-------- Scale: (" + this.#_scl.x.toFixed(2) + ", " + this.#_scl.y.toFixed(2) + ", " + this.#_scl.z.toFixed(2) + ")");
              if(logMod && this.#log) console.log("-------- Rotation: (" + this.#_rot.x.toFixed(2) + ", " + this.#_rot.y.toFixed(2) + ", " + this.#_rot.z.toFixed(2) + ")");                   

              // Create an invisible mesh for collision purposes 
              const collider = new THREE.Mesh(
                mod.geometry.clone(), 
                new THREE.MeshBasicMaterial({ visible: false }) // invisible!
              );

              collider.position.copy(this.#_pos);
              collider.quaternion.copy(this.#_quat);
              collider.scale.copy(this.#_scl);

              collider.userData.teleport = teleportAlias;
              this.#world.getEngine().setCollidable(collider);
              this.#world.getEngine().setTeleportMeshData( { pos: this.#_pos.clone(), quat: this.#_quat.clone(), scale: this.#_scl.clone() } );

              this.addToInstancedMesh(alias);

              // Dispose of the temporary models
              UTILS.disposeObject3D(c);
              UTILS.disposeObject3D(mod);
            }            
          }
          // Process any model flags
          // Some of these flags are already obsolete / semi-obsolete and will need to be reviewed
          let flags = mod.userData?.flags ?? "xxxxx";
          if(logMod && this.#log) console.log("------ Flags " + flags);
          let common = (flags.charAt(0) === "c") ? true : false;
          let merge = (flags.charAt(1) === "m") ? true : false;
          let collidable = (flags.charAt(2) === "c") ? true : false;
          let visible = (flags.charAt(3) === "v") ? true : false;
          let noScale = (flags.charAt(4) === "n") ? true : false;

          let regionModel = false;

          if(logMod && this.#log) console.log("------ Common: " + (common ? "Yes" : "No"));
          if(logMod && this.#log) console.log("------ Merge: " + (merge ? "Yes" : "No"));
          if(logMod && this.#log) console.log("------ Collidable: " + (collidable ? "Yes" : "No"));
          if(logMod && this.#log) console.log("------ Visible: " + (visible ? "Yes" : "No"));
          if(logMod && this.#log) console.log("------ No Scale: " + (noScale ? "Yes" : "No"));


          
          // If the model is flagged as common (all but a small minority should be), process it
          if(common) {

            const alias = mod.userData?.alias ?? null;
            if(logMod && this.#log) console.log("------ Common Model Identified " + alias);
            // By default, build all initial common models as low-detail versions where available
            // Upgrade models when proximities are checked
            // Check whether the model actually exists in the library
            // Ask for the lowest detail version, if it doesn't exist, the next available detail level will be returned
            const check = this.#world.getCommonModel(alias, 0);
            if(check !== null) {

              // Make a clone of the model to avoid affecting the original
              const c = check.clone(true);

              if(logMod && this.#log) console.log("-------- Common Model Located");
              
              // Set position on the region position plus the child model's scene position
              this.#_pos.set(
                (this.#position.x + UTILS.scaleDistance(mod.position.x, this.#uniScale, this.#modScale)),
                (this.#position.y + UTILS.scaleDistance(mod.position.y, this.#uniScale, this.#modScale)),
                (this.#position.z + UTILS.scaleDistance(mod.position.z, this.#uniScale, this.#modScale)) 
              );
              
              // If the model is to be scaled on the child model's scale setting, do so
              // Most models should have their scale applied at common export - this will eventually become redundant
              this.#_scl = noScale ?
                c.scale.multiply(defScale) : c.scale.multiply(mod.scale);

              // Base rotation on child model's rotation within the scene
              this.#_rot.set(mod.rotation.x, mod.rotation.y, mod.rotation.z);
              this.#_quat.setFromEuler(this.#_rot);

              // Log the data to the console, if required
              if(logMod && this.#log) console.log("-------- Position: (" + this.#_pos.x.toFixed(2) + ", " + this.#_pos.y.toFixed(2) + ", " + this.#_pos.z.toFixed(2) + ")");
              if(logMod && this.#log) console.log("-------- Scale: (" + this.#_scl.x.toFixed(2) + ", " + this.#_scl.y.toFixed(2) + ", " + this.#_scl.z.toFixed(2) + ")");
              if(logMod && this.#log) console.log("-------- Rotation: (" + this.#_rot.x.toFixed(2) + ", " + this.#_rot.y.toFixed(2) + ", " + this.#_rot.z.toFixed(2) + ")");              

              // Compose the material to be added to the Instanced Mesh
              this.#_mat.compose(this.#_pos, this.#_quat, this.#_scl);

              // Create a reference to the required InstancedMesh(es)
              const mesh = {
                alias: alias,
                indices: {
                  high: null,
                  mid: null,
                  low: null,
                  no: null
                }
              }

              const iMeshHigh = this.#world.getInstancedMeshes()[alias].highDetail;
              if(iMeshHigh !== null) {                
                // Write the material to the InstancedMesh for high-detail
                const i = iMeshHigh.count++;
                mesh.indices.high = i;
                iMeshHigh.setMatrixAt(i, this.#_mat);
                iMeshHigh.instanceMatrix.needsUpdate = true;                    
              }

              const iMeshMid = this.#world.getInstancedMeshes()[alias].midDetail;
              if(iMeshMid !== null) {                
                // Write the material to the InstancedMesh for mid-detail
                const i = iMeshMid.count++;
                mesh.indices.mid = i;
                iMeshMid.setMatrixAt(i, this.#_mat);
                iMeshMid.instanceMatrix.needsUpdate = true;                    
              }              

              const iMeshLow = this.#world.getInstancedMeshes()[alias].lowDetail;
              if(iMeshLow !== null) {                
                // Write the material to the InstancedMesh for low-detail
                const i = iMeshLow.count++;
                mesh.indices.low = i;
                iMeshLow.setMatrixAt(i, this.#_mat);
                iMeshLow.instanceMatrix.needsUpdate = true;                    
              }  
              
              const iMeshNo = this.#world.getInstancedMeshes()[alias].noDetail;
              if(iMeshNo !== null) {                
                // Write the material to the InstancedMesh for no-detail
                const i = iMeshNo.count++;
                mesh.indices.no = i;
                iMeshNo.setMatrixAt(i, this.#_mat);
                iMeshNo.instanceMatrix.needsUpdate = true;                    
              }                  

              // Dispose of the temporary models
              UTILS.disposeObject3D(c);
              UTILS.disposeObject3D(mod);

              // Push the data to the base meshes
              this.#baseMeshes.push(mesh);

              // Set the model to the lowest level of detail
              this.#world.setModelInstance(alias, mesh.indices, 3);
                 
            } else {

              if(logMod && this.#log) console.log("-------- Common Model NOT Located");
              // Essentially nullify this model - do no further processing
              mod = null;
              flags = "xxxxx";
              common = false;
              merge = false;
              collidable = false;
              visible = false;
              noScale = false;
            }

          } else {
          if(!modelType.includes("region-base") && modelType !== collidable) {
            // The model is not common, most likely a textured, base mesh
            // Because of this, it may not need to be merged
            if(merge){

              if(logMod && this.#log) console.log("------ Model to Be Merged");
              mod = UTILS.mergeToSingleVertexColorMesh(mod);          

            } else {

              if(logMod && this.#log) console.log("------ Model Isn't to Be Merged");
              // Iterate through the model's children and set them to receive / cast shadows
              mod.traverse((m) => {
                if (m.isMesh) {
                  m.castShadow = true;
                  m.receiveShadow = true;
                }
              });
            }    
            
            // Identify the appropriate position and apply it to the model
            mod.position.set(
              (this.#position.x + UTILS.scaleDistance(mod.position.x, this.#uniScale, this.#modScale)),
              (this.#position.y + UTILS.scaleDistance(mod.position.y, this.#uniScale, this.#modScale)),
              (this.#position.z + UTILS.scaleDistance(mod.position.z, this.#uniScale, this.#modScale)),
            )

            // Identify the appropriate scale and apply to the model
            if(!noScale)
              mod.scale.multiply(new THREE.Vector3(
                UTILS.scaleDistance(mod.scale.x, uniScale, modScale),
                UTILS.scaleDistance(mod.scale.y, uniScale, modScale),
                UTILS.scaleDistance(mod.scale.z, uniScale, modScale)
              ));
            
     

            // Identify the appropriate rotation and apply to the model
            mod.rotation.set(mod.rotation.x, mod.rotation.y, mod.rotation.z);

            // Log the data to the console, if required
            if(logMod && this.#log) console.log("-------- Position: (" + mod.position.x.toFixed(2) + ", " + mod.position.y.toFixed(2) + ", " + mod.position.z.toFixed(2) + ")");
            if(logMod && this.#log) console.log("-------- Scale: (" + mod.scale.x.toFixed(2) + ", " + mod.scale.y.toFixed(2) + ", " + mod.scale.z.toFixed(2) + ")");
            if(logMod && this.#log) console.log("-------- Rotation: (" + mod.rotation.x.toFixed(2) + ", " + mod.rotation.y.toFixed(2) + ", " + mod.rotation.z.toFixed(2) + ")");                                    
                
            // If visible, add the model to the scene
            if(visible)
              this.#world.getEngine().getScene().add(mod);   
            
            // Manage any collidables
            // if(collidable)
              // this.#world.getEngine().setCollidable(mod);
          }
          }

        });

        UTILS.disposeObject3D(model);
        model = null;
      })
    );

    return promises;
  }

  addToInstancedMesh(alias) {

    // Compose the material to be added to the Instanced Mesh
    this.#_mat.compose(this.#_pos, this.#_quat, this.#_scl);

    // Create a reference to the required InstancedMesh(es)
      const mesh = {
        alias: alias,
        indices: {
          high: null,
          mid: null,
          low: null,
          no: null
        }
      }

      const iMeshHigh = this.#world.getInstancedMeshes()[alias].highDetail;
      if(iMeshHigh !== null) {                
        // Write the material to the InstancedMesh for high-detail
        const i = iMeshHigh.count++;
        mesh.indices.high = i;
        iMeshHigh.setMatrixAt(i, this.#_mat);
        iMeshHigh.instanceMatrix.needsUpdate = true;                    
      }

      const iMeshMid = this.#world.getInstancedMeshes()[alias].midDetail;
      if(iMeshMid !== null) {                
        // Write the material to the InstancedMesh for mid-detail
        const i = iMeshMid.count++;
        mesh.indices.mid = i;
        iMeshMid.setMatrixAt(i, this.#_mat);
        iMeshMid.instanceMatrix.needsUpdate = true;                    
      }              

      const iMeshLow = this.#world.getInstancedMeshes()[alias].lowDetail;
      if(iMeshLow !== null) {                
        // Write the material to the InstancedMesh for low-detail
        const i = iMeshLow.count++;
        mesh.indices.low = i;
        iMeshLow.setMatrixAt(i, this.#_mat);
        iMeshLow.instanceMatrix.needsUpdate = true;                    
      }  
              
      const iMeshNo = this.#world.getInstancedMeshes()[alias].noDetail;
      if(iMeshNo !== null) {                
        // Write the material to the InstancedMesh for no-detail
        const i = iMeshNo.count++;
        mesh.indices.no = i;
        iMeshNo.setMatrixAt(i, this.#_mat);
        iMeshNo.instanceMatrix.needsUpdate = true;                    
      }                  

      // Push the data to the base meshes
      this.#baseMeshes.push(mesh);

      // Set the model to the lowest level of detail
      this.#world.setModelInstance(alias, mesh.indices, 3);
  }

  async processBaseModels() {

    const promises = [];
    // Process the mid-level model, if required
    for(let a = 1; a < 4; a++) {
    
      if(this.#baseModel.getDetailLevelExists(a)) {
    
        promises.push(
        
          await UTILS.loadRegionModel(

            ("./assets/models/regions/" + name + "-mid-detail.glb"), this.#world.getEngine().getRenderer()
      
          ).then(model => {
      
            if(logMod && this.#log) console.log("-------- Processing Region Model File for " + this.#name + ", Detail Level: " + a);
            this.#baseModel.processModel(a, model);
          })
        )
      }
    }

    return promises;
  }

  manageProximity(data) {

    // Prevent any further execution of code unless a change is required
    if(data.proximity !== this.#proximity) {
    
      let reloadModels = false;
      let manageBoards = false;
      if(data.proximity === "IN") {
          
        this.#world.getEngine().updateLocationPanel(this.#name);
        reloadModels = true;
        manageBoards = true;
      
      } else if(data.proximity === "ADJACENT") {

        reloadModels = true;
        if(this.#proximity === "IN")
          manageBoards = true;
        
      } else if(data.proximity === "NEAR") {

        if(this.#proximity !== "DISTANT")
          reloadModels = true;

        if(this.#proximity === "IN")
          manageBoards = true;        

      } else if(data.proximity === "DISTANT") {

        if(this.#proximity !== "NEAR")
          reloadModels = true;

        if(this.#proximity === "IN")
          manageBoards = true;        

      } else if(data.proximity === "REMOTE") {
          
        reloadModels = true;

        if(this.#proximity === "IN")
          manageBoards = true;        
      }

      if(reloadModels)
        this.manageModels(data.proximity);

      if(manageBoards) {
        
        this.#infoBoardManager.manageBoards(data.proximity);
      }

      this.#proximity = data.proximity;
    }
  }

  getWorld() { return this.#world; }
  getId() { return this.#id; }
  getAlias() { return this.#alias; }
  getName() { return this.#name; }

  getSize() { return this.#size; }
  setSize(size) { this.#size = size; }
  getPosition() { return this.#position; }
  setPosition(position) { this.#position = position; }  

  getBaseModel() { return this.#baseModel; }
  setBaseModel(baseModel) { this.#baseModel = baseModel; }
  getModels() { return this.#modelData; }
  getLights() { return this.#lights; }
  setLight(light) { this.#lights.push(light); }
  setLights(lights) { this.#lights = lights; }
  getInfoBoardManager() { return this.#infoBoardManager; }
  //setBoard(board) { this.#boards.push(board); }
  //setBoards(boards) { this.#boards = boards; }

  getLog() { return this.#log; }
  
  getRadius() {

    if(this.#size.x > this.#size.z)
      return (this.#size.x / 2)
    else
      return (this.#size.z / 2)
  }

  refreshDisplayBoards(time) {

    this.#infoBoardManager.refreshDisplayBoards(time);
  }

  /** @function
  * @name manageModels
  * Switches the level of detail of the models in this region depending on the proximity to the active region (where the player currently is).
  * @param {String} prox The proximity of this region to the active region (IN, ADJACENT, NEAR, or DISTANT).
  */
  manageModels(prox) {

    let detail = 3;
    if(prox === "ADJACENT") 
      detail = 2;
    if(prox === "NEAR" || prox === "DISTANT")
      detail = 1;
    if(prox === "REMOTE")
      detail = 0;
    
    // Manage the base model
    this.#baseModel.showModel(detail);

    // Manage any instanced meshes
    const meshes = this.#baseMeshes;
    for(let a = 0; a < meshes.length; a++) {

      this.#world.setModelInstance(meshes[a].alias, meshes[a].indices, detail)
    }
  }
}

export class Teleport {

  #parent;
  #alias;
  #region;
  #target;
  #direction;

  constructor(parent, data) {

    this.#parent = parent;
    this.#alias = data.querySelector("alias").textContent.trim();
    this.#region = parseInt(data.querySelector("region").textContent.trim());
    this.#target = UTILS.getVectorFromXml(data.querySelector("target"), 0)
    this.#direction = UTILS.getVectorFromXml(data.querySelector("direction"), 0)
  }

  getAlias() { return this.#alias; }
  getRegion() { return this.#region; }
  getTarget() { return this.#target; }
  getDirection() { return this.#direction; }

  trigger() {

    this.#parent.getWorld().getEngine().prepareTeleport(this);
  }
}


class LightSource {

  #name;
  #light;

  constructor(data, scene, uniScale, modScale) {
  
    this.#name = data.querySelector("name").textContent.trim();
    switch(data.querySelector("type").textContent.trim()) {

      case "point-light":
        this.#light = new THREE.PointLight(
          Number("0x" + data.querySelector("colour").textContent.trim()),
          parseFloat(data.querySelector("intensity").textContent.trim()),
          parseInt(data.querySelector("distance").textContent.trim()),
          parseFloat(data.querySelector("decay").textContent.trim())
        );
        break;
    }

    const pos = UTILS.applyVectorToWorld(UTILS.getVectorFromXml(data.querySelector("position"), 0), uniScale, modScale);
    this.#light.position.set(pos.x, pos.y, pos.z);
    scene.add(this.#light);
  }
}

class CommonModel {

  #region;
  #name;
  #scale;
  #position;
  #rotation;
  #model;

  constructor(region, name, scale, position, rotation, model) {

    this.#region = region;
    this.#name = name;
    this.#scale = scale;
    this.#position = position;
    this.#rotation = rotation;
    this.#model = model;
  }

  buildModel(uniScale, modScale, collidables, interactables, scene) {

    const scl = this.#scale;
    const pos = this.#position;
    const rot = this.#rotation;
    const mod = this.#model;

    // The scale of most common models at region-level should be 1
    // The base scale of the common models should typically be set at world level when loaded
    mod.scale.multiply(new THREE.Vector3(uniScale, uniScale, uniScale));

    mod.position.set(pos.x, pos.y, pos.z);
    mod.rotation.set(
      THREE.MathUtils.degToRad(rot.x),
      THREE.MathUtils.degToRad(rot.y),
      THREE.MathUtils.degToRad(rot.z)
    );

    if(collidables !== null)
      collidables.push(mod);

    if(scene !== null)
      scene.add(mod);    
  }
}

class MultiPartModel {

  #region;
  #name;
  #position;
  #rotation;
  #parts;

  #group;

  constructor(region, name, position, rotation, parts) {

    this.#region = region;
    this.#name = name;
    this.#position = position;
    this.#rotation = rotation;
    this.#parts = parts;
    this.#group = new THREE.Group();
  }

  buildModel(uniScale, modScale, collidables, interactables, scene) {

    const parts = this.#parts;
    const group = this.#group;
    const pos = this.#position;
    const rot = this.#rotation;
    for(let a = 0; a < parts.length; a++) {

      const p = parts[a];
      const norm = UTILS.applyVectorToWorld(p.offset, uniScale, modScale);
      p.model.position.set(norm.x, norm.y, norm.z);
      p.model.rotation.set(
        THREE.MathUtils.degToRad(p.rotation.x),
        THREE.MathUtils.degToRad(p.rotation.y),
        THREE.MathUtils.degToRad(p.rotation.z)
      );

      group.add(p.model);
    }

    group.position.set(pos.x, pos.y, pos.z);
    group.rotation.set(
      THREE.MathUtils.degToRad(rot.x),
      THREE.MathUtils.degToRad(rot.y),
      THREE.MathUtils.degToRad(rot.z)
    );  

    group.scale.multiply(new THREE.Vector3(uniScale, uniScale, uniScale));

    if(collidables !== null)
      collidables.push(group);

    if(scene !== null)
      scene.add(group);    
  }
}