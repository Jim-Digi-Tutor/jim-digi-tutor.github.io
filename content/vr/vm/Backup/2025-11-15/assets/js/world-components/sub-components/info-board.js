import * as THREE from "three";
import * as UTILS from "../../utility/utils.js";

import { InfoBoardSettings as ISB } from "../../utility/component-settings.js";

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
  
  #parent;
  #id;
  #isXML;

  #screen;
  #size;
  #position;
  #facing;

  #uniScale;
  #modScale;

  #splash = null;
  #content = null;
  #playing = false;
  #paused = false;
  #pausedAt = 0;
  #shutDown = true;

  #videoState;

  getId() { return this.#id; }
  getShutDown() { return this.#shutDown; }

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
      this.#content = data.querySelector("content")?.textContent.trim() ?? false;
    
    } else {

      this.#id = data.id;
      this.#size = data.size;
      this.#facing = data.facing;
      this.#position = data.position;

      this.#splash = data.splash;
      this.#content = data.content;
    }    
  }

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

    const splashTex = new THREE.TextureLoader().load(this.#splash);
    const screenMat = new THREE.MeshBasicMaterial({
      map: splashTex,
      toneMapped: false
    });

    const screenGeo = new THREE.PlaneGeometry(
      UTILS.scaleDistance(size.x, uniScale, modScale),
      UTILS.scaleDistance(size.y, uniScale, modScale)
    );
    
    this.#screen = new THREE.Mesh(screenGeo, screenMat);
    this.#screen.visible = false;

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
      splashTexture: splashTex,
      material: screenMat,
      mesh: this.#screen,
    };     

    if(this.#content) {
      this.#screen.userData.screen = ("INFO-BOARD-SCREEN-" + this.#parent.getRegion().getId() + "-" + this.#id);
      this.#parent.getRegion().getWorld().getEngine().setInteractable(this.#screen);
    }
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

    // Turn on the screen and add the splash-screen texture
    state.mesh.visible = true;
    state.material.map = state.splashTexture;
    state.material.needsUpdate = true;

    if(this.#content) {

      // Create the video and load it, ready for playing
      if (!state.video) {

        const video = document.createElement("video");
        video.src = this.#content;
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