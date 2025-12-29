import * as MESH_UI from "mesh-ui";
import * as THREE from "three";
import * as UTILS from "../utility/utils.js";

export class InfoBoard {

  // Flag whether or not to log information to the console
  #log = true;
  
  #parent;
  #id;
  #data;

  #screen;
  #size;
  #position;
  #facing;
  #scaled;

  #uniScale;
  #modScale;
  #screenSize;

  #playButton;
  #pauseButton;
  #backButton;

  #commentary;
  #pages;
  #pagesLoaded = 0;
  #playing;
  #paused;
  #currentPage = null;
  #lastTime;
  #thisTime;
  #startTime;
  #currentTime;
  #elapsed;

  #display = {

    background: "#F8F8FF",
    highlight: "#CF1920",
    text1: 0.085,
    textFull: 0.075,
    mediumFont: 0.55,
    borderWidth: 0.0035,
    borderRadius: 0.05,
    padding: 0.05,
    margin: 2.5
  };

  #rotations = {

    "NORTH": 180, "NORTH-EAST": 135, "EAST": 90, "SOUTH-EAST": 45,
    "SOUTH": 0, "SOUTH-WEST": -45, "WEST": 90, "NORTH-WEST": 225
  }

  #positionOffsetsSmall = {

    "NORTH": { x: 8.5, y: 13, z: 0.35 }, "NORTH-EAST": { x: 6.45, y: 13, z: 6.25 },
    "EAST": { x: 0.5, y: 13, z: 8.5 }, "SOUTH-EAST": { x: 6.45, y: 13, z: 6.45 },
    "SOUTH": { x: 0, y: 0, z: -5.92 }, "SOUTH-WEST": { x: 6.25, y: 13, z: 6.45 },
    "WEST": { x: 0, y: 0, z: 0 }, "NORTH-WEST": { x: 6.25, y: 13, z: 6.25 }    
  }

  #buttonOffsetsSmall = {

    "NORTH": { x: 11, y: 14.5, z: 0.35 }, "NORTH-EAST": { x: 0, y: 0, z: 0 },
    "EAST": { x: 0.5, y: 14.5, z: 11 }, "SOUTH-EAST": { x: 0, y: 0, z: 0 },
    "SOUTH": { x: 0, y: 1.35, z: -0.095 }, "SOUTH-WEST": { x: 0, y: 0, z: 0 },
    "WEST": { x: -0.085, y: 1.35, z: 0 }, "NORTH-WEST": { x: 0, y: 0, z: 0 }   
  }

  #positionOffsetsLarge = {

    "NORTH": { x: 11, y: 14.5, z: 0.35 }, "NORTH-EAST": { x: 0, y: 0, z: 0 },
    "EAST": { x: 0.5, y: 14.5, z: 11 }, "SOUTH-EAST": { x: 0, y: 0, z: 0 },
    "SOUTH": { x: 0, y: 1.35, z: -0.095 }, "SOUTH-WEST": { x: 0, y: 0, z: 0 },
    "WEST": { x: -0.085, y: 1.35, z: 0 }, "NORTH-WEST": { x: 0, y: 0, z: 0 }    
  }

  #buttonOffsetsLarge = {

    "NORTH": { x: 11, y: 14.5, z: 0.35 }, "NORTH-EAST": { x: 0, y: 0, z: 0 },
    "EAST": { x: 0.5, y: 14.5, z: 11 }, "SOUTH-EAST": { x: 0, y: 0, z: 0 },
    "SOUTH": { x: 0, y: 1.35, z: -0.095 }, "SOUTH-WEST": { x: 0, y: 0, z: 0 },
    
    "WEST": { 
      play: { x: 0.055, y: 0.6, z: 0.19 },
      pause: { x: 0.055, y: 0.6, z: 0 },
      back: { x: 0.055, y: 0.6, z: -0.19 },
    },
    
    "NORTH-WEST": { x: 0, y: 0, z: 0 }   
  }

  #video;
  #videoTex;

  constructor(parent, data) {

    this.#parent = parent;
    this.#data = data;
    
    this.#uniScale = this.#parent.getRegion().getWorld().getEngine().getUniversalScale();
    this.#modScale = this.#parent.getRegion().getWorld().getEngine().getModelScale();    

    this.#playing = false;
    this.#paused = false;
    this.#lastTime = -1;
    this.#thisTime = -1;
    this.#elapsed = -1;
    this.#startTime = -1;
    this.#currentTime = -1;
  }

  getId() { return this.#id; }
  getScreen() { return this.#screen; }
  getScaled() { return this.#scaled; }
  getDisplay() { return this.#display; }
  getCurrentPage() { return this.#currentPage; }
  setCurrentPage(currentPage) { this.#currentPage = currentPage; }
  #resetTransitionCounters() {

    this.#lastTime = -1;
    this.#thisTime = -1;
    this.#elapsed = -1;
  }

  play() {

    if(!this.#playing && !this.#paused) {

      this.#playing = true;
      
    } else if(this.#playing && this.#paused) {

      this.#lastTime = Date.now();
      this.#thisTime = Date.now();
      this.#playing = true;
      this.#paused = false;
    }

    if(this.#playing && this.#commentary !== null)
      this.#commentary.play();
  }

  pause() {

    if(this.#playing && !this.#paused) {

      this.#paused = true;

      if(this.#commentary !== null)
        this.#commentary.pause();
    }
  }

  restart() {

    this.#resetTransitionCounters();
    this.#getPageByIndex(0).displayPage(true, true);
  }

  setupBoard() {

    const region = this.#parent.getRegion();
    const data = this.#data;
    const uniScale = this.#uniScale;
    const modScale = this.#modScale;

    this.#id = parseInt(data.querySelector("id").textContent.trim());
    this.#size = data.querySelector("size").textContent.trim();
    this.#facing = data.querySelector("facing").textContent.trim();
    this.#position = UTILS.getVectorFromXml(data.querySelector("position"));
  }

  async startVideo() {
    const screen = this.#screen.getObjectByName('infoBoard.screen')
    // ensure texture exists
    if (!this.#videoTex) {
      await new Promise(res => {
        if (this.#video.readyState >= 1) res();  // HAVE_METADATA
        else this.#video.addEventListener('loadedmetadata', res, { once: true });
      });
      if (!this.#videoTex) {
        this.#videoTex = new THREE.VideoTexture(this.#video);
        this.#videoTex.colorSpace = THREE.SRGBColorSpace;
        this.#videoTex.minFilter = THREE.LinearFilter;
        this.#videoTex.magFilter = THREE.LinearFilter;
        this.#videoTex.generateMipmaps = false;
        this.#videoTex.wrapS = this.#videoTex.wrapT = THREE.ClampToEdgeWrapping;
      }
    }

    // swap poster -> video
    screen.material.map = this.#videoTex;
    screen.material.toneMapped = false;    // cheaper, looks right for UI/video
    screen.material.needsUpdate = true;

    // unmute if you want sound (must be inside the gesture)
    this.#video.muted = false;

    // start playback
    await this.#video.play().catch(err => console.warn('Play blocked:', err));
  }

  async buildBoard() {

    const uniScale = this.#uniScale;
    const modScale = this.#modScale;

    // Ascertain the size and offsets of the screen
    const size = { x: 0, y: 0 };
    const off = { x: 0, y: 0, z: 0 };
    const bOff = {};
    if(this.#size === "SMALL") {

      size.x = 1.6;
      size.y = 0.9;

      off.x = this.#positionOffsetsSmall[this.#facing].x;
      off.y = this.#positionOffsetsSmall[this.#facing].y;
      off.z = this.#positionOffsetsSmall[this.#facing].z;

      bOff.play = this.#buttonOffsetsSmall[this.#facing].play;
      bOff.pause = this.#buttonOffsetsSmall[this.#facing].pause;
      bOff.back = this.#buttonOffsetsSmall[this.#facing].back;      

    } else if(this.#size === "LARGE") {

      size.x = 2.1;
      size.y = 1.2;

      off.x = this.#positionOffsetsLarge[this.#facing].x;
      off.y = this.#positionOffsetsLarge[this.#facing].y;
      off.z = this.#positionOffsetsLarge[this.#facing].z;    
      
      bOff.play = this.#buttonOffsetsLarge[this.#facing].play;
      bOff.pause = this.#buttonOffsetsLarge[this.#facing].pause;
      bOff.back = this.#buttonOffsetsLarge[this.#facing].back;    
    }

    // Build the screen; provide its width, height, and base image
    this.#screen = this.buildScreen({
      width: UTILS.scaleDistance(size.x, uniScale, modScale),
      height: UTILS.scaleDistance(size.y, uniScale, modScale),
      image: "./assets/images/gui/kingwell-tower.png",
      frame: false
    });
    
    // Configure the position, rotation, and size of the screen
    const regionPos = this.#parent.getRegion().getPosition();
    const basePos = new THREE.Vector3(
      (regionPos.x + UTILS.scaleDistance(this.#position.x, uniScale, modScale)),
      (regionPos.y + UTILS.scaleDistance(this.#position.y, uniScale, modScale)),
      (regionPos.z + UTILS.scaleDistance(this.#position.z, uniScale, modScale))
    );

    // Add and configure the buttons
    this.#playButton = this.#parent.getRegion().getWorld().getCommonModel("large-play-button").clone(true);
    const playPos = new THREE.Vector3(
      (basePos.x + UTILS.scaleDistance(bOff.play.x, uniScale, modScale)),
      (basePos.y + UTILS.scaleDistance(bOff.play.y, uniScale, modScale)),
      (basePos.z + UTILS.scaleDistance(bOff.play.z, uniScale, modScale)),
    );

    this.#playButton.position.set(playPos.x, playPos.y, playPos.z);
    this.#playButton.userData.onClick = ("INFO-BOARD-PLAY-" + this.#parent.getRegion().getId() + "-" + this.#id);
    this.#parent.getRegion().getWorld().getEngine().getScene().add(this.#playButton);
    this.#parent.getRegion().getWorld().getEngine().setInteractable(this.#playButton);
    // Buttons are being displayed at a smaller scale; possibly because they haven't come through the same...
    // ...workflow as the other common models. Keep this re-scale until fixed.
    this.#playButton.scale.multiplyScalar(uniScale)

    this.#screen.position.set(
     basePos.x + UTILS.scaleDistance(off.x, uniScale, modScale),
     basePos.y + UTILS.scaleDistance(off.y, uniScale, modScale),
     basePos.z + UTILS.scaleDistance(off.z, uniScale, modScale),
    );
    
    const rot = this.#rotations[this.#facing];
    this.#screen.rotation.y = THREE.MathUtils.degToRad(rot);
    
    // Add the screen to the scene
    this.#parent.getRegion().getWorld().getEngine().getScene().add(this.#screen);

    // 1) Make the <video> element
    this.#video = document.createElement('video');
    this.#video.src = './assets/content/video/rmd-landing-page-video.mp4';          // <-- your URL here
    this.#video.playsInline = true;
    this.#video.preload = 'auto';
    this.#video.loop = true;
    this.#video.muted = true;                      // keeps autoplay permissive if you want
    this.#video.crossOrigin = 'anonymous';         // keep if the server sends CORS headers

    // 2) Make a VideoTexture when we know the size
    this.#videoTex = null;
    this.#video.addEventListener('loadedmetadata', () => {
      this.#videoTex = new THREE.VideoTexture(this.#video);
      this.#videoTex.colorSpace = THREE.SRGBColorSpace;
      this.#videoTex.minFilter = THREE.LinearFilter;
      this.#videoTex.magFilter = THREE.LinearFilter;
      this.#videoTex.generateMipmaps = false;      // important for video
      this.#videoTex.wrapS = this.#videoTex.wrapT = THREE.ClampToEdgeWrapping;
    });    


    const promises = [];
    return Promise.all(promises);


    // Initialise the screen element
    //this.#screenSize = size;
    //this.#scaled = { x: UTILS.scaleDistance(size.x, uniScale, modScale), y: UTILS.scaleDistance(size.y, uniScale, modScale) };
    //this.#screen = new MESH_UI.Block({
      //width: this.#scaled.x,
      //height: this.#scaled.y,
      //fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      //fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",
      //backgroundColor: new THREE.Color(this.#display.background),
      //borderColor: new THREE.Color(this.#display.highlight),
      //borderWidth: (this.#display.borderWidth * 5 * modScale * uniScale),
      //borderRadius: 0,
      //borderOpacity: 1,
      //offset: 0
    //}); 

    // Flag base screen child components at this stage
    // The flag is used to prevent them being removed on page transition
    //const children = [...this.#screen.children];
    //for (const child of children) {
      //child.userData.screenComponent = true;
    //}
    
    // Configure the position, rotation, and size of the screen
    //const regionPos = this.#parent.getRegion().getPosition();
    //const basePos = new THREE.Vector3(
      //(regionPos.x + UTILS.scaleDistance(this.#position.x, uniScale, modScale)),
      //(regionPos.y + UTILS.scaleDistance(this.#position.y, uniScale, modScale)),
      //(regionPos.z + UTILS.scaleDistance(this.#position.z, uniScale, modScale))
    //);

    //const norm = UTILS.applyVectorToWorld(new THREE.Vector3((pos.x + off.x), (pos.y + off.y), (pos.z + off.z)), uniScale, modScale); 
    //this.#screen.position.set(
     // basePos.x + UTILS.scaleDistance(off.x, uniScale, modScale),
     // basePos.y + UTILS.scaleDistance(off.y, uniScale, modScale),
     // basePos.z + UTILS.scaleDistance(off.z, uniScale, modScale),
    //);
    
    //const rot = this.#rotations[this.#facing];
    //this.#screen.rotation.y = THREE.MathUtils.degToRad(rot);

    // Add and configure the buttons
    //this.#playButton = this.#parent.getRegion().getWorld().getCommonModel("large-play-button").clone(true);
    //const playPos = new THREE.Vector3(
      //(basePos.x + UTILS.scaleDistance(bOff.play.x, uniScale, modScale)),
      //(basePos.y + UTILS.scaleDistance(bOff.play.y, uniScale, modScale)),
      //(basePos.z + UTILS.scaleDistance(bOff.play.z, uniScale, modScale)),
    //);

    //this.#playButton.position.set(playPos.x, playPos.y, playPos.z);
    //this.#playButton.userData.onClick = ("INFO-BOARD-PLAY-" + this.#parent.getRegion().getId() + "-" + this.#id);
    //this.#parent.getRegion().getWorld().getEngine().getScene().add(this.#playButton);
    //this.#parent.getRegion().getWorld().getEngine().setInteractable(this.#playButton);
    // Buttons are being displayed at a smaller scale; possibly because they haven't come through the same...
    // ...workflow as the other common models. Keep this re-scale until fixed.
    //this.#playButton.scale.multiplyScalar(uniScale)
    
    //this.#pauseButton = this.#parent.getRegion().getWorld().getCommonModel("large-pause-button").clone(true);
    //const pausePos = new THREE.Vector3(
      //(basePos.x + UTILS.scaleDistance(bOff.pause.x, uniScale, modScale)),
      //(basePos.y + UTILS.scaleDistance(bOff.pause.y, uniScale, modScale)),
      //(basePos.z + UTILS.scaleDistance(bOff.pause.z, uniScale, modScale)),
    //);

    //this.#pauseButton.position.set(pausePos.x, pausePos.y, pausePos.z);
    //this.#pauseButton.userData.onClick = ("INFO-BOARD-PAUSE-" + this.#parent.getRegion().getId() + "-" + this.#id);
    //this.#parent.getRegion().getWorld().getEngine().getScene().add(this.#pauseButton);
    //this.#parent.getRegion().getWorld().getEngine().setInteractable(this.#pauseButton);
    // Buttons are being displayed at a smaller scale; possibly because they haven't come through the same...
    // ...workflow as the other common models. Keep this re-scale until fixed.
    //this.#pauseButton.scale.multiplyScalar(uniScale)

    //this.#backButton = this.#parent.getRegion().getWorld().getCommonModel("large-back-button").clone(true);
    //const backPos = new THREE.Vector3(
      //(basePos.x + UTILS.scaleDistance(bOff.back.x, uniScale, modScale)),
     // (basePos.y + UTILS.scaleDistance(bOff.back.y, uniScale, modScale)),
     // (basePos.z + UTILS.scaleDistance(bOff.back.z, uniScale, modScale)),
    //);

   // this.#backButton.position.set(backPos.x, backPos.y, backPos.z);
   // this.#backButton.userData.onClick = ("INFO-BOARD-RESTART-" + this.#parent.getRegion().getId() + "-" + this.#id);
   // this.#parent.getRegion().getWorld().getEngine().getScene().add(this.#backButton);
  //  this.#parent.getRegion().getWorld().getEngine().setInteractable(this.#backButton);
    // Buttons are being displayed at a smaller scale; possibly because they haven't come through the same...
    // ...workflow as the other common models. Keep this re-scale until fixed.
    //this.#backButton.scale.multiplyScalar(uniScale)

    //const promises = [];

    // Process the sound
    //const commentary = this.#data?.querySelector("content")?.querySelector("commentary")?.textContent.trim() || null;
   /// if(commentary === null) {
//
  //    this.#commentary = null;

    //} else {

      //if(this.#log) console.log("Loading Audio Commentary for Info Board " + this.#id);
      //this.#commentary = await new Promise((resolve, reject) => {
//        const audio = new Audio();
  //      audio.oncanplaythrough = () => resolve(audio);
    //    audio.onerror = reject;
      //  audio.src = commentary;
        //audio.load(); // Start loading the audio file
//      }); 

  //    promises.push(this.#commentary);

    //  if(this.#log) console.log("Finished Loading Audio Commentary for Info Board " + this.#id);
   // }

    // Process the pages
//    this.#pages = [];
  //  const pages = this.#data.querySelector("content").getElementsByTagName("page");
    //if(this.#log) { console.log("Building Page Data for Info Board " + this.#parent.getRegion().getId() + "-" + this.#id); }
    //for(let a = 0; a < pages.length; a++) {
    
//      const page = new Page(this, pages[a]);
  //    page.processData();
    //  promises.push(await page.buildPage(this.#uniScale, this.#modScale));
      //this.#pages.push(page);

//      this.#countLoadedPages(pages.length);
  //  }
    
    //if(this.#log) { console.log("Finished Building Page Data for Info Board " + this.#parent.getRegion().getId() + "-" + this.#id); }

    //this.#getPageByIndex(0).displayPage(false, false);*/

  }

  // Curved info board (THREE r160+)
// Usage:
// const board = makeBoard({ image: '/assets/info.jpg', height: 1.25, arc: Math.PI/2, radius: 2.2 });
// board.position.set(0, 1.5, -2.2);
// board.lookAt(0, 1.5, 0);
// scene.add(board);



// THREE r160+
// Curved info board that wraps TOWARD the viewer by default.
// Center of the arc faces -Z. Place the mesh in front of the camera, e.g. z = -radius.



buildScreen({
  width = 1.6,                  // meters
  height = 0.9,                 // meters
  image = null,                 // URL or null
  useStandard = false,          // true -> Standard material w/ emissive
  emissiveIntensity = 0.6,
  frame = true,
  frameThickness = 0.03,        // border around screen
  frameDepth = 0.02,            // z depth of frame slab
  frameBackGap = 0.002,         // extra gap to avoid coplanar (meters)
  frameColor = 0x22272e,
  renderer = null,              // optionally pass your renderer for max anisotropy
} = {}) {
  const group = new THREE.Group();
  group.name = 'infoBoard.flat';

  // --- Screen plane (faces +Z) ---
  const screenGeo = new THREE.PlaneGeometry(width, height);
  const screenMat = useStandard
    ? new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.0, roughness: 0.9 })
    : new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Help the screen win depth when close to the frame
  screenMat.polygonOffset = true;
  screenMat.polygonOffsetFactor = -1; // pull forward
  screenMat.polygonOffsetUnits  = -1;

  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.name = 'infoBoard.screen';
  group.add(screen);

  // --- Optional frame (a slab *behind* the screen) ---
  if (frame) {
    const frameGeo = new THREE.BoxGeometry(
      width + frameThickness * 2,
      height + frameThickness * 2,
      frameDepth
    );
    const frameMat = new THREE.MeshStandardMaterial({
      color: frameColor, metalness: 0.2, roughness: 0.7
    });
    const rim = new THREE.Mesh(frameGeo, frameMat);
    rim.name = 'infoBoard.frame';

    // IMPORTANT:
    // Box is centered at its origin with half-depth front/back.
    // If we place it at z = -(frameDepth/2 + frameBackGap),
    // its *front* face sits at z = -frameBackGap (behind the screen plane at z = 0).
    rim.position.z = -(frameDepth / 2 + frameBackGap);
    group.add(rim);
  }

  // --- Optional image texture ---
  if (image) {
    new THREE.TextureLoader().load(
      image,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;

        // Safer defaults (NPOT-friendly, reduce shimmer in VR)
        tex.minFilter = THREE.LinearMipmapLinearFilter; // will fall back if NPOT
        tex.magFilter = THREE.LinearFilter;
        const maxAniso = renderer?.capabilities?.getMaxAnisotropy?.() || 8;
        tex.anisotropy = Math.min(8, maxAniso);

        screenMat.map = tex;
        screenMat.needsUpdate = true;

        if (useStandard) {
          screenMat.emissive = new THREE.Color(0xffffff);
          screenMat.emissiveIntensity = emissiveIntensity;
        }
      },
      undefined,
      (err) => console.warn('Screen texture failed to load:', err)
    );
  }

  return group;
}


  #countLoadedPages(total) {

    this.#pagesLoaded++;
    if(this.#log) console.log("Info Board " + this.#parent.getRegion().getId() + "-" + this.#id + " Pages Loaded " + this.#pagesLoaded + " / " + total);
  }

  #getPageByIndex(index) {

    for(let a = 0; a < this.#pages.length; a++) {

      if(this.#pages[a].getIndex() === index)
        return this.#pages[a];
    }
  }

  process(frame, time) {

    if(this.#playing && !this.#paused && this.#currentPage !== null) {

      if(this.#lastTime === -1 && this.#thisTime === -1 && this.#elapsed === -1) {

        this.#lastTime = time;
        this.#thisTime = time;
        this.#elapsed = 0;
      }

      this.#thisTime = time;
      this.#elapsed += (this.#thisTime - this.#lastTime);

      const fadeIn = this.#currentPage.getFadeIn();
      const fadeOut = this.#currentPage.getFadeOut();

      if(fadeIn > 0) {
      
        if(this.#elapsed < fadeIn) {

          // Fade the page in
          const percent = (this.#elapsed / fadeIn);
          this.#currentPage.setFadeOpacity((percent > 1) ? 1 : percent);
        }
      }

      if(fadeOut > 0) { 
      
        if(this.#elapsed > (this.#currentPage.getLength() - fadeOut)) {

          // Fade the page out
          const percent = ((this.#currentPage.getLength() - this.#elapsed) / fadeOut);
          this.#currentPage.setFadeOpacity((percent < 0) ? 0 : percent);
        }
      }        

      this.#lastTime = time;

      // Check whether the page needs to switch to the next (or halt playing)
      // Put this section below the fade-in and fade-out checks to avoid anomalies
      if(this.#elapsed >= this.#currentPage.getLength()) {

        let index = this.#currentPage.getIndex();
        index++;
        if(index === this.#pages.length) {
          
          this.#getPageByIndex(0).displayPage(true, true);
          this.#playing = false;

        } else {
         
          this.#getPageByIndex(index).displayPage(true, true);
        }

        this.#resetTransitionCounters();
      }        
    }
  }

  disposeCurrentPage() {

    // Remove the children from the screen object
    // Do not remove any flagged as screen components
    const children = [...this.#screen.children];
    for (const child of children) {

      if(!child.userData.hasOwnProperty("screenComponent") || !child.userData.screenComponent) {

        this.#screen.remove(child);
        UTILS.disposeObject3D(child);
      }
    }
  }
}

class Page {

  // Flag whether or not to log information to the console
  #log = true;

  #parent;
  #data;
  #index;
  #width;
  #height;
  #length;
  #fadeIn;
  #fadeOut;
  #base;
  #components;

  constructor(parent, data) {

    this.#parent = parent;
    this.#data = data;
    this.#components = [];
  }

  getIndex() { return this.#index; }
  getLength() { return this.#length; }
  getFadeIn() { return this.#fadeIn; }
  getFadeOut() { return this.#fadeOut; }
  getBase() { return this.#base; }

  processData() {

    this.#index = parseInt(this.#data.querySelector("index").textContent.trim());
    this.#width = parseFloat(this.#data.querySelector("width").textContent.trim());
    this.#height = parseFloat(this.#data.querySelector("height").textContent.trim());
    this.#length = parseInt(this.#data.querySelector("length").textContent.trim());
    this.#fadeIn = parseInt(this.#data.querySelector("fade-in").textContent.trim());
    this.#fadeOut = parseInt(this.#data.querySelector("fade-out").textContent.trim());
  }

  displayPage(removePrevious, fadeOnLoad) {

    // Check fadeIn / fadeOut to remove flicker between transitions
    if(removePrevious) {

      if(this.#parent.getCurrentPage().getFadeOut() > 0)
        this.#parent.getCurrentPage().setFadeOpacity(0);

      this.#parent.disposeCurrentPage();
    }
     
    this.#parent.setCurrentPage(this);    
    if(this.#fadeIn > 0 && fadeOnLoad)
      this.setFadeOpacity(0);
    else if(this.#fadeIn <= 0 || !fadeOnLoad)
      this.setFadeOpacity(1);

    this.#parent.getScreen().add(this.#base);

    // Prevents transition flickering
    if(removePrevious)
      MESH_UI.update();
  }

  async buildPage(uniScale, modScale) {

    const w = this.#width;
    const h = this.#height;
    const screen = this.#parent.getScreen();
    const scaled = this.#parent.getScaled();
    const display = this.#parent.getDisplay();
    const components = this.#data.getElementsByTagName("component");
  
    // Build the base page
    this.#base = new MESH_UI.Block({
      width: (scaled.x * 0.975),
      height: (scaled.y * 0.955),
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",
      backgroundColor: new THREE.Color(display.background),
      borderWidth: 0,
      borderRadius: 0,
      offset: 0.001
    });

    this.#base.autoLayout = false;

    // Iterate through the components and add them to the base board
    const promises = [];
    for(let a = 0; a < components.length; a++) {

      const c = components[a];
      const type = c.querySelector("type").textContent.trim();
      const borderColour = c?.querySelector("border-colour")?.textContent.trim() || null;
      const backgroundColour = c?.querySelector("background-colour")?.textContent.trim() || null;
      const block = new MESH_UI.Block({
        
        borderColor: (borderColour === null) ? null : new THREE.Color(borderColour),
        backgroundColor: (backgroundColour !== null) ? new THREE.Color(backgroundColour) : new THREE.Color(display.background),
        borderWidth: 0, //(display.borderWidth * (parseFloat(c?.querySelector("border-width")?.textContent.trim() || 0)) * uniScale * modScale),
        borderRadius: 0, //(display.borderRadius * (parseFloat(c?.querySelector("border-radius")?.textContent.trim() || 0)) * uniScale * modScale),     
        offset: 0.0015
      });

      block.autoLayout = false;

      switch(type) {

        case "IMAGE-ABS":
          const src = c.querySelector("file").textContent.trim();
          if(this.#log) console.log("Loading Image For Info Board Page");
          if(this.#log) console.log(src);
          const left = parseFloat(c.querySelector("left").textContent.trim());
          const top = parseFloat(c.querySelector("top").textContent.trim());
          const width = parseFloat(c.querySelector("width").textContent.trim());
          const height = parseFloat(c.querySelector("height").textContent.trim());

          block.set({
            width: (width * scaled.x),
            height: (height * scaled.y),
          });

          const posI = this.#positionBlock(left, top, (width * scaled.x), (height * scaled.y), scaled.x, scaled.y, uniScale, modScale);
          block.position.set(posI.x, posI.y);          

          promises.push(await this.#loadImageTexture(src, block));
          if(this.#log) console.log("Loading Image Complete");

          this.#components.push( { type: type, block: block, solidBg: false } );
          this.#base.add(block);          
          break;
          
        // A full-width, fixed size text block, positioned at the top of the page, aligned to the left
        case "TEXT-1":
          block.set({
            width: (0.95 * scaled.x),
            height: (0.15 * scaled.y),
            padding: (display.padding * 1.1 *uniScale * modScale),
            // backgroundColor: new THREE.Color("#FFFF00"),
            backgroundOpacity: 0,
            textAlign: "left"
          });

          const pos1 = this.#positionBlock(0.025, 0.85, (0.95 * scaled.x), (0.1 * scaled.y), scaled.x, scaled.y, uniScale, modScale);
          block.position.set(pos1.x, pos1.y);
          
          const text1 = new MESH_UI.Text({
            fontColor: new THREE.Color(display.highlight),
            fontSize: (display.text1 * modScale * uniScale),
            content: c.querySelector("content").textContent.trim().toUpperCase()
          });

          block.add(text1);
          this.#components.push( { type: type, block: block, solidBg: false } );
          this.#base.add(block);
          break;

        case "TEXT-FULL":
          block.set({
            width: (0.95 * scaled.x),
            height: (0.5 * scaled.y),
            padding: (display.padding * 1.1 *uniScale * modScale),
            backgroundColor: new THREE.Color("#FFFF00"),
            backgroundOpacity: 1,
            textAlign: "left"
          });

          const posFull = this.#positionBlock(0.025, 0.55, (0.95 * scaled.x), (0.1 * scaled.y), scaled.x, scaled.y, uniScale, modScale);
          block.position.set(posFull.x, posFull.y);
          
          const textFull = new MESH_UI.Text({
            fontColor: new THREE.Color(display.highlight),
            fontSize: (display.textFull * modScale * uniScale),
            content: c.querySelector("content").textContent.trim()
          });

          block.add(textFull);
          this.#components.push( { type: type, block: block, solidBg: false } );
          this.#base.add(block);
          break;          
      }
    }

    return Promise.all(promises);
  }

  async #loadImageTexture(file, block) {
    
    return new Promise((resolve, reject) => {

      const loader = new THREE.TextureLoader();
      loader.load(
        
        file,
        
        (texture) => {
          
          const img = texture.image;
          block.set({
            backgroundTexture: texture,
            backgroundSize: "contain",
          });

          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          
          resolve(texture);
        },
        
        undefined,
        
        (err) => reject(err)
      );
    });
  }

  setFadeOpacity(val) {

    // Blocks inherit from parent block
    // Might need to modify if individual blocks have solid backgrounds
    this.#base.set({
      borderOpacity: val,      
      backgroundOpacity: val,
      fontOpacity: val
    });
  }

  #positionBlock(x, y, cW, cH, sW, sH, uniScale, modScale) {

    const adjX = ((x * sW) - (sW / 2) + (cW / 2));
    const adjY = ((y * sH) - (sH / 2) + (cH / 2));
    return new THREE.Vector2(adjX, adjY);      
  }  
}