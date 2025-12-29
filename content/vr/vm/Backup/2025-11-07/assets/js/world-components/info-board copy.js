import * as MESH_UI from "mesh-ui";
import * as THREE from "three";
import * as UTILS from "../utility/utils.js";

export class InfoBoard {

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
  #audioButton;
  #pauseButton;
  #restartButton;

  #pages;
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
    "SOUTH": 0, "SOUTH-WEST": -45, "WEST": 0, "NORTH-WEST": 225
  }

  #positionOffsetsSmall = {

    "NORTH": { x: 8.5, y: 13, z: 0.35 }, "NORTH-EAST": { x: 6.45, y: 13, z: 6.25 },
    "EAST": { x: 0.5, y: 13, z: 8.5 }, "SOUTH-EAST": { x: 6.45, y: 13, z: 6.45 },
    "SOUTH": { x: 0, y: 0, z: -5.92 }, "SOUTH-WEST": { x: 6.25, y: 13, z: 6.45 },
    "WEST": { x: 0, y: 0, z: 0 }, "NORTH-WEST": { x: 6.25, y: 13, z: 6.25 }    
  }

  #positionOffsetsLarge = {

    "NORTH": { x: 11, y: 14.5, z: 0.35 }, "NORTH-EAST": { x: 0, y: 0, z: 0 },
    "EAST": { x: 0.5, y: 14.5, z: 11 }, "SOUTH-EAST": { x: 0, y: 0, z: 0 },
    "SOUTH": { x: 0, y: 1.35, z: -0.095 }, "SOUTH-WEST": { x: 0, y: 0, z: 0 },
    "WEST": { x: 0, y: 0, z: 0 }, "NORTH-WEST": { x: 0, y: 0, z: 0 }    
  }

  constructor(parent, data) {

    this.#parent = parent;
    this.#data = data;
    
    this.#uniScale = this.#parent.getRegion().getWorld().getEngine().getUniversalScale();
    this.#modScale = this.#parent.getRegion().getWorld().getEngine().getModelScale();    

    this.#playing = true;
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
  }

  pause() {

    if(this.#playing && !this.#paused)
      this.#paused = true;
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

  buildScreen() {

    const uniScale = this.#uniScale;
    const modScale = this.#modScale;

    // Ascertain the size and offsets of the screen
    const size = { x: 0, y: 0 };
    const off = { x: 0, y: 0, z: 0 };
    if(this.#size === "SMALL") {

      size.x = 1.6;
      size.y = 0.9;

      off.x = this.#positionOffsetsSmall[this.#facing].x;
      off.y = this.#positionOffsetsSmall[this.#facing].y;
      off.z = this.#positionOffsetsSmall[this.#facing].z;

    } else if(this.#size === "LARGE") {

      size.x = 2.1;
      size.y = 1.2;

      off.x = this.#positionOffsetsLarge[this.#facing].x;
      off.y = this.#positionOffsetsLarge[this.#facing].y;
      off.z = this.#positionOffsetsLarge[this.#facing].z;      
    }

    // Initialise the screen element
    this.#screenSize = size;
    this.#scaled = { x: UTILS.scaleDistance(size.x, uniScale, modScale), y: UTILS.scaleDistance(size.y, uniScale, modScale) };
    this.#screen = new MESH_UI.Block({
      width: this.#scaled.x,
      height: this.#scaled.y,
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",
      backgroundColor: new THREE.Color(this.#display.background),
      borderColor: new THREE.Color(this.#display.highlight),
      borderWidth: (this.#display.borderWidth * 5 * modScale * uniScale),
      borderRadius: 0,
      borderOpacity: 1,
      offset: 0
    }); 

    // Flag base screen child components at this stage
    // The flag is used to prevent them being removed on page transition
    const children = [...this.#screen.children];
    for (const child of children) {
      child.userData.screenComponent = true;
    }
    
    // Configure the position, rotation, and size of the screen
    const pos = this.#position;
    const norm = UTILS.applyVectorToWorld(new THREE.Vector3((pos.x + off.x), (pos.y + off.y), (pos.z + off.z)), uniScale, modScale); 
    this.#screen.position.set(norm.x, norm.y, norm.z);
    
    const rot = this.#rotations[this.#facing];
    this.#screen.rotation.y = THREE.MathUtils.degToRad(rot);

    // Add and configure the buttons
    this.#playButton = this.#parent.getRegion().getWorld().getCommonModel("info-board-large-play-button");
    const pbPos = UTILS.applyVectorToWorld(new THREE.Vector3(pos.x, pos.y, pos.z), uniScale, modScale); 
    this.#playButton.position.set(pbPos.x, pbPos.y, pbPos.z);
    this.#playButton.userData.onClick = ("INFO-BOARD-PLAY-" + this.#parent.getRegion().getId() + "-" + this.#id);
    this.#parent.getRegion().getWorld().getEngine().getScene().add(this.#playButton);
    this.#parent.getRegion().getWorld().getEngine().setInteractable(this.#playButton);

    this.#pauseButton = this.#parent.getRegion().getWorld().getCommonModel("info-board-large-pause-button");
    const pPos = UTILS.applyVectorToWorld(new THREE.Vector3(pos.x, pos.y, pos.z), uniScale, modScale); 
    this.#pauseButton.position.set(pPos.x, pPos.y, pPos.z);
    this.#pauseButton.userData.onClick = ("INFO-BOARD-PAUSE-" + this.#parent.getRegion().getId() + "-" + this.#id);
    this.#parent.getRegion().getWorld().getEngine().getScene().add(this.#pauseButton);
    this.#parent.getRegion().getWorld().getEngine().setInteractable(this.#pauseButton);
    console.log(this.#pauseButton)

    this.#audioButton = this.#parent.getRegion().getWorld().getCommonModel("info-board-large-audio-button");
    const aPos = UTILS.applyVectorToWorld(new THREE.Vector3(pos.x, pos.y, pos.z), uniScale, modScale); 
    this.#audioButton.position.set(aPos.x, aPos.y, aPos.z);
    this.#audioButton.userData.onClick = ("INFO-BOARD-AUDIO-" + this.#parent.getRegion().getId() + "-" + this.#id);
    this.#parent.getRegion().getWorld().getEngine().getScene().add(this.#audioButton);
    this.#parent.getRegion().getWorld().getEngine().setInteractable(this.#audioButton);
    
    this.#restartButton = this.#parent.getRegion().getWorld().getCommonModel("info-board-large-restart-button");
    const rPos = UTILS.applyVectorToWorld(new THREE.Vector3(pos.x, pos.y, pos.z), uniScale, modScale); 
    this.#restartButton.position.set(rPos.x, rPos.y, rPos.z);
    this.#restartButton.userData.onClick = ("INFO-BOARD-RESTART-" + this.#parent.getRegion().getId() + "-" + this.#id);
    this.#parent.getRegion().getWorld().getEngine().getScene().add(this.#restartButton);
    this.#parent.getRegion().getWorld().getEngine().setInteractable(this.#restartButton);

    // Process the pages
    this.#pages = [];
    const pages = this.#data.querySelector("content").getElementsByTagName("page");
    for(let a = 0; a < pages.length; a++) {
    
      const page = new Page(this, pages[a]);
      page.processData();
      page.buildPage(this.#uniScale, this.#modScale);
      this.#pages.push(page);
    }
    
    this.#getPageByIndex(0).displayPage(false, false);
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

  buildPage(uniScale, modScale) {

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