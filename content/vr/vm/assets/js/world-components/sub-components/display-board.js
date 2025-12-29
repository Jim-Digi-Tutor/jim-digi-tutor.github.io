import * as THREE from "three";
import * as UTILS from "../../utility/utils.js";

import { InEnvironmentApplication } from "./in-env-app.js";
import { DisplayBoardSettings as DBS } from "../../utility/component-settings.js";

/**
 * An interactive display board displaying images, video, or a canvas based app.
 * @class
 */
export class DisplayBoard {

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

  #onSplash = false;
  #shutDown = true;

  #video = null;
  #videoTexture = null;
  #inEnvApp = null;
  #splashMaterial = null;
  #mainMaterial = null;

  /**
   * Creates an DisplayBoard.
   * @param {DisplayBoardManager} parent The parent DisplayBoardManager of this board.
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

      this.#splash = data.querySelector("splash")?.textContent.trim() ?? null;
      this.#type = data.querySelector("type").textContent.trim();
      this.#source = data.querySelector("source")?.textContent.trim() ?? null;
    
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

      size = DBS.sizeSmall;
      off = DBS.positionOffsetsSmall[this.#facing];

    } else if(this.#size === "LARGE") {

      size = DBS.sizeLarge;
      off = DBS.positionOffsetsLarge[this.#facing];    
    }

    // Initialise the screen with a transparent mesh
    this.#actualSize = new THREE.Vector2(UTILS.scaleDistance(size.x, uniScale, modScale), UTILS.scaleDistance(size.y, uniScale, modScale));
    const screenGeo = new THREE.PlaneGeometry(this.#actualSize.x, this.#actualSize.y);   
    this.#screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial( { visible: false } ));

    // Position and rotate the screen mesh
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
    
    const rot = DBS.rotations[this.#facing];
    this.#screen.rotation.y = THREE.MathUtils.degToRad(rot);
    
    // Add the screen to the scene
    this.#parent.getRegion().getWorld().getEngine().getScene().add(this.#screen);
    
    if(this.#log) console.log("Processing display-board...")

    // Set up the splash-material, if required.
    if(this.#log) console.log("-- Splash material to load: " + this.#splash + "...");
    if(this.#splash !== null) {

      const splashTex = new THREE.TextureLoader().load(this.#splash);
      this.#splashMaterial = new THREE.MeshBasicMaterial({
        map: splashTex,
        toneMapped: false
      });
    }

    // Setup the initial material(s) and configure any interactive features
    if(this.#type === "app") {
        
      if(this.#log) console.log("-- Screen is host to an app...");
      this.#screen.userData.trackOnControllerOver = true;
      this.#inEnvApp = new InEnvironmentApplication(this, this.#source, false);

      if(this.#log) console.log("-- Application to load: " + this.#source + "...");
      // Setup the main-material based on the source app
      const mainTex = new THREE.CanvasTexture(this.#inEnvApp.getCanvas());
      this.#mainMaterial = new THREE.MeshBasicMaterial( { map: mainTex } );

      this.#screen.material = (
        this.#splashMaterial === null ? this.#mainMaterial : this.#splashMaterial
      );

      this.#screen.material.needsUpdate = true;
      this.#onSplash = (this.#splashMaterial !== null);

      if(!this.#onSplash)
        this.#inEnvApp.refresh(0, true);

    } else {

      this.#screen.material = this.#splashMaterial;
      this.#screen.material.needsUpdate = true;
      this.#onSplash = true;
    }

    this.#shutDown = false;
    if(this.#type === "app" || this.#type === "video") {

      this.#screen.userData.screen = ("INFO-BOARD-SCREEN-" + this.#parent.getRegion().getId() + "-" + this.#id);
      this.#parent.getRegion().getWorld().getEngine().setInteractable(this.#screen);
    }
  }

  onControllerClickDown(point) {

    if(this.#type === "app") {

      this.#inEnvApp.onControllerClickDown(this.#calculateHit(point));
    }
  }

  onControllerClickRelease(point) {

    if(this.#type === "app") {

      if(this.#onSplash) {

        this.#screen.material.dispose();
        this.#screen.material = null;
        this.#screen.material = this.#mainMaterial;
        this.#screen.material.needsUpdate = true;
        this.#inEnvApp.refresh(0, true);
        this.#onSplash = false;
        
      } else {
      
        this.#inEnvApp.onControllerClickRelease(this.#calculateHit(point));
      }

    } else if(this.#type === "video") {

      if(this.#onSplash) {

        this.#screen.material.dispose();
        this.#screen.material = null;
        this.#screen.material = new THREE.MeshBasicMaterial( { visible: false } )
        this.#screen.material.map = this.#videoTexture;
        this.#screen.material.needsUpdate = true;
        this.#screen.material.visible = true;
        
        this.#video.currentTime = this.#pausedAt;

        this.#video.play().catch(err => {
          console.warn("Video Play Blocked: ", err);
        });

        this.#playing = true;
        this.#paused = false;
        this.#onSplash = false;
        
      } else {
      
        if(this.#paused) {

          this.#video.play().catch(err => {
            console.warn("Video Play Blocked: ", err);
          });

          this.#paused = false;

        } else {
        
          this.#paused = true;
          this.#pausedAt = this.#video.currentTime;
          this.#video.pause();      
        }
      }
    }    
  }

  setAppPointer(point) {

    if(this.#type === "app") {

      this.#inEnvApp.setPointer(this.#calculateHit(point));
    }    
  }
  
  onControllerOver() {
    
    if(this.#type === "app") {

      this.#inEnvApp.onControllerOver();
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

  refresh(time, forceRefresh = false, resetPointer = false) {

    if(!this.#shutDown) {

      if(this.#type === "app") {
        
        if(this.#inEnvApp.refresh(time, forceRefresh, resetPointer)) {

          if(this.#log) console.log("App display has changed and needs a refresh... (" + time + ")");
          this.#screen.material.map.needsUpdate = true;
        }
      }
    }
  }

  onEnterRegion() {

    if(this.#type === "video")
      this.#loadVideo();

    this.turnOn();
  }

  onLeaveRegion() {

    this.shutDown();
  }

  #loadVideo() {

    // Create the video and load it, ready for playing
    this.#video = document.createElement("video");
    this.#video.src = this.#source;
    this.#video.crossOrigin = "anonymous";
    this.#video.preload = "auto";
    this.#video.loop = false;
    this.#video.muted = false;
    this.#video.playsInline = true;

    this.#videoTexture = new THREE.VideoTexture(this.#video);
    this.#videoTexture.minFilter = THREE.LinearFilter;
    this.#videoTexture.magFilter = THREE.LinearFilter;
    this.#videoTexture.generateMipmaps = false;
  } 
  
  #unloadVideo() {

    if(this.#video !== null) {

      // Pause the video, remove the video element, and release the media
      this.#video.pause();
      this.#video.removeAttribute("src");
      this.#video.load();
      this.#video = null;
    }

    if (this.#mainMaterial !== null) {

      // Dispose of the texture
      this.#mainMaterial.dispose();
      this.#mainMaterial = null;
    }
  }
  
  turnOn() {

    if(this.#type === "app") {

      // Steps for app start-up here

    } else if(this.#type === "video") {
    
      this.#loadVideo();
      this.#screen.material = this.#splashMaterial;
      this.#screen.material.needsUpdate = true;
      this.#onSplash = true;      
    }

    this.#screen.visible = true;
    this.#shutDown = false;
  }

  shutDown() {

    if(this.#type === "app") {

      // Steps for app shut-down here

    } else if(this.#type === "video") {
      
      if(this.#playing)
        this.#pausedAt = this.#video.currentTime;

      this.#unloadVideo();
      this.#playing = false;
    }

    this.#screen.visible = false;
    this.#shutDown = true;
  }
}