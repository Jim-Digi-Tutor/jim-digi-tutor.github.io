import * as THREE from "three";
import * as UTILS from "../../utility/utils.js";

import { InEnvironmentApplication } from "./in-env-app.js";
import { InfoBoardSettings as ISB } from "../../utility/component-settings.js";
import { InfoBoardManager } from "../info-board-manager.js";

/**
 * An interactive information board displaying images and / or video.
 * @class
 */
export class InfoBoard {

  /**
   * Whether or not to log construction and processing data to the console
   * @type {Boolean}
   * @private
   */
  #log = true;
  
  /**
   * The parent InfoBoardManager of this board.
   * @type {InfoBoardManager}
   * @private
   */  
  #parent;

  /**
   * The Id of this board.
   * @type {Number}
   * @private
   */  
  #id;

  /**
   * Whether or not the board is populated from XML or JSON data.
   * @type {Boolean}
   * @private
   */    
  #isXML;

  /**
   * The display screen of this board.
   * @type {THREE.Mesh}
   * @private
   */  
  #screen;

  /**
   * A string representing the size of the display screen.
   * @type {String}
   * @private
   */    
  #size;

  /**
   * A Vector2 object representing the actual, numeric size of the screen.
   * @type {THREE.Vector2}
   * @private
   */    
  #actualSize;

  /**
   * The position of the screen.
   * @type {THREE.Vector3}
   * @private
   */  
  #position;

  /**
   * A string representing the facing of the display screen.
   * @type {String}
   * @private
   */    
  #facing;

  #uniScale;
  #modScale;

  #splash = null;
  #type = null;
  #source = null;
  #playing = false;
  #paused = false;
  #pausedAt = 0;
  #shutDown = true;

  #videoState;

  #inEnvApp = null;
  #appMaterial = null;
  #screenMat;

  /**
   * Creates an InfoBoard.
   * @param {InfoBoardManager} parent The parent InfoBoardManager of this board.
   * @param {XML} data The data from which this board is constructed.
   * @param {Boolean} isXML Whether the data object is XML (true) or JSON (false)
  */
  constructor(parent, data, isXML) {

    this.#parent = parent;
    this.#isXML = isXML;
    
    this.#uniScale = this.#parent.getRegion().getWorld().getEngine().getUniversalScale();
    this.#modScale = this.#parent.getRegion().getWorld().getEngine().getModelScale();   
    
    if(this.#isXML) {
      
      this.#id = parseInt(data.querySelector("id").textContent.trim());
      this.#size = data.querySelector("size").textContent.trim();
      this.#facing = data.querySelector("facing").textContent.trim();
      this.#position = UTILS.getVectorFromXml(data.querySelector("position"));

      this.#splash = data.querySelector("splash").textContent.trim();
      this.#type = data.querySelector("type").textContent.trim();
      this.#source = data.querySelector("source")?.textContent.trim();
    
    } else {

      this.#id = data.id;
      this.#size = data.size;
      this.#facing = data.facing;
      this.#position = data.position;

      this.#splash = data.splash;
      this.#type = data.type;
      this.#source = data.source;
    }    
  }

  /**
   * Gets the ID of this board.
   * @returns {Number} The ID of this board.
   */
  getId() { return this.#id; }

  /**
   * Gets the shut-down state of this board.
   * @returns {Boolean} The shut-down state of the board.
   */  
  getShutDown() { return this.#shutDown; }

  buildBoard() {

    const uniScale = this.#uniScale;
    const modScale = this.#modScale;

    let size = { x: 0, y: 0 };
    let off = { x: 0, y: 0, z: 0 };
    if(this.#size === "SMALL") {

      size = ISB.sizeSmall;
      off = ISB.positionOffsetsSmall[this.#facing];

    } else if(this.#size === "LARGE") {

      size = ISB.sizeLarge;
      off = ISB.positionOffsetsLarge[this.#facing];    
    }

            //const tex = new THREE.CanvasTexture(this.#inEnvApp.getCanvas());
//        this.#appMaterial = new THREE.MeshBasicMaterial( { map: tex } );
    //const splashTex = null; //new THREE.TextureLoader().load(this.#splash);
    //const screenMat = new THREE.MeshBasicMaterial({
    //this.#screenMat = new THREE.MeshBasicMaterial({
      //map: tex,
      //toneMapped: false
    //});

    
    this.#actualSize = new THREE.Vector2(UTILS.scaleDistance(size.x, uniScale, modScale), UTILS.scaleDistance(size.y, uniScale, modScale));
    const screenGeo = new THREE.PlaneGeometry(this.#actualSize.x, this.#actualSize.y);   
    this.#screen = new THREE.Mesh(screenGeo, this.#screenMat); 
          if(this.#type === "app") {
        
        this.#screen.userData.trackOnControllerOver = true;
        this.#inEnvApp = new InEnvironmentApplication(this, this.#source);

        this.#inEnvApp.refresh(999);

        const tex = new THREE.CanvasTexture(this.#inEnvApp.getCanvas());
        //this.#appMaterial = new THREE.MeshBasicMaterial( { map: tex } );
        //this.#screen.material.map.dispose()
        //this.#screen.material.map= null;

    this.#screenMat = new THREE.MeshBasicMaterial({
      map: tex,
      toneMapped:  false
    });        
        
        //this.#screenMat.map= this.#appMaterial;
        
        this.#screenMat.needsUpdate = true;
        console.log("!!!!!!!!!!!!!! setup")
        console.log(this.#screen);
      }
    //this.#screen.visible = false;

    const regionPos = this.#parent.getRegion().getPosition();
    const basePos = new THREE.Vector3(
      (regionPos.x + UTILS.scaleDistance(this.#position.x, uniScale, modScale)),
      (regionPos.y + UTILS.scaleDistance(this.#position.y, uniScale, modScale)),
      (regionPos.z + UTILS.scaleDistance(this.#position.z, uniScale, modScale))
    );

    this.#screen.position.set(
     basePos.x + UTILS.scaleDistance(off.x, uniScale, modScale),
     basePos.y + UTILS.scaleDistance(off.y, uniScale, modScale),
     basePos.z + UTILS.scaleDistance(off.z, uniScale, modScale),
    );
    
    const rot = ISB.rotations[this.#facing];
    this.#screen.rotation.y = THREE.MathUtils.degToRad(rot);
    
    // Add the screen to the scene
    this.#parent.getRegion().getWorld().getEngine().getScene().add(this.#screen);

    this.#videoState = {
      video: null,
      videoTexture: null,
      splashTexture: null, //splashTex,
      material: this.#screenMat,
      mesh: this.#screen,
    };     

    if(this.#type === "app" || this.#type === "video") {

      this.#screen.userData.screen = ("INFO-BOARD-SCREEN-" + this.#parent.getRegion().getId() + "-" + this.#id);



      this.#parent.getRegion().getWorld().getEngine().setInteractable(this.#screen);
    }
  }

  onControllerClick() {

    if(this.#type === "video")
      this.onVideoInteraction();
  }

  onControllerOver(point) {

    if(this.#type === "app") {

      this.#inEnvApp.onControllerOver(this.#calculateHit(point));
    }
  }

  #calculateHit(point) {

    const x = (point.x < 0) 
      ? ((this.#actualSize.x / 2) - Math.abs(point.x))
      : ((this.#actualSize.x / 2) + point.x);
    const y = (point.y < 0) 
      ? ((this.#actualSize.y / 2) - Math.abs(point.y))
      : ((this.#actualSize.y / 2) + point.y);

    // Return the data as a percentage of the size of the screen
    return new THREE.Vector2((x / this.#actualSize.x), (y / this.#actualSize.y));
  }

  onVideoInteraction() {

    const state = this.#videoState;
    if(!this.#playing) {

      // If the state object doesn't have a video or video-texture, abort this interaction
      if(!state.video || !state.videoTexture) return;

      state.material.map = state.videoTexture;
      state.material.needsUpdate = true;
      state.video.currentTime = 0;
      state.video.play().catch(err => {
        console.warn("Video Play Blocked: ", err);
      });

      state.video.currentTime = this.#pausedAt;
      
      // If the video playback has ended, display the splash screen 
      state.video.onended = () => {
        // Switch the texture back to the splash screen
        state.material.map = state.splashTexture;
        state.material.needsUpdate = true;
        // Reset the playback position for if the video is played again
        state.video.currentTime = 0;
      };

      this.#playing = true;

    } else {

      if(this.#paused) {

        state.video.play();
        this.#paused = false;

      } else {

        state.video.pause();
        this.#paused = true;
      }
    }
  }  

  onEnterRegion() {

    this.turnOn();
  }

  onLeaveRegion() {

    if(this.#playing)
      this.#pausedAt = this.#videoState.video.currentTime;

    this.shutDown();
  }

  turnOn() {

    const state = this.#videoState;

    if(this.#type === "video") {

          // Turn on the screen and add the splash-screen texture
    state.mesh.visible = true;
    state.material.map = state.splashTexture;
    state.material.needsUpdate = true;


      // Create the video and load it, ready for playing
      if (!state.video) {

        const video = document.createElement("video");
        video.src = this.#source;
        video.crossOrigin = "anonymous";
        video.preload = "auto";
        video.loop = false;
        video.muted = false;
        video.playsInline = true;

        const tex = new THREE.VideoTexture(video);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;

        state.video = video;
        state.videoTexture = tex;
      }

    } else if(this.#type === "app") {

    // Turn on the screen and add the splash-screen texture
    this.#inEnvApp.refresh(999);
    this.#screen.visible = true;
    this.#screenMat.map = this.#appMaterial;
    this.#screenMat.needsUpdate = true;
    }

    this.#shutDown = false;
  }

  shutDown() {

    const state = this.#videoState;

    // Hide the mesh, prevent draw calls
    state.mesh.visible = false;

    if(state.video) {

      // Pause the video, remove the video element, and release the media
      state.video.pause();
      state.video.removeAttribute("src");
      state.video.load();
      state.video = null;
    }

    if (state.videoTexture) {

      // Dispose of the texture
      state.videoTexture.dispose();
      state.videoTexture = null;
    }

    this.#shutDown = true;
    this.#playing = false;
  }
}