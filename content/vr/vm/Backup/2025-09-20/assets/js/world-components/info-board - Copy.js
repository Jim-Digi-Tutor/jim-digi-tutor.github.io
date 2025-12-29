import * as MESH_UI from "mesh-ui";
import * as THREE from "three";

import * as UTILS from "../utility/utils.js";

export class InfoBoard {

  #parent;
  #id;
  #data;

  #screen;
  #fader;

  #size;
  #position;
  #facing;
  #scaled;

  #uniScale;
  #modScale;
  #screenSize;

  #pages;
  #playing;
  #currentPage = null;
  #startTime;
  #currentTime;
  #elapsed;
  #fadeLength;
  #fadeIn;
  #fadeOut;

  #display = {

    mediumFont: 0.44,
    borderWidth: 0.0035,
    borderRadius: 0.05,
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
    "SOUTH": { x: 0, y: 1.35, z: -0.25 }, "SOUTH-WEST": { x: 0, y: 0, z: 0 },
    "WEST": { x: 0, y: 0, z: 0 }, "NORTH-WEST": { x: 0, y: 0, z: 0 }    
  }

  constructor(parent, id, data) {

    this.#parent = parent;
    this.#id = id;
    this.#data = data;
    
    this.#uniScale = this.#parent.getRegion().getWorld().getEngine().getUniversalScale();
    this.#modScale = this.#parent.getRegion().getWorld().getEngine().getModelScale();    

    this.#playing = true;
    this.#startTime = -1;
    this.#currentTime = -1;
    this.#fadeIn = false;
    this.#fadeOut = true;
  }

  getScreen() { return this.#screen; }
  getFader() { return this.#fader; }
  getScaled() { return this.#scaled; }
  getDisplay() { return this.#display; }
  setCurrentPage(currentPage) { this.#currentPage = currentPage; }
  #resetTransitionCounters() {

    this.#startTime = -1;
    this.#currentTime = -1;
  }

  setupBoard() {

    const region = this.#parent.getRegion();
    const data = this.#data;
    const uniScale = this.#uniScale;
    const modScale = this.#modScale;

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
      borderRadius: 0,
      offset: 0
    }); 

 

    // Configure the position, rotation, and size of the screen
    const pos = this.#position;
    const norm = UTILS.applyVectorToWorld(new THREE.Vector3((pos.x + off.x), (pos.y + off.y), (pos.z + off.z)), uniScale, modScale); 
    this.#screen.position.set(norm.x, norm.y, norm.z);
    
    const rot = this.#rotations[this.#facing];
    this.#screen.rotation.y = THREE.MathUtils.degToRad(rot);

    //this.#fader = new MESH_UI.Block({
      //width: this.#scaled.x,
      //height: this.#scaled.y,
      //backgroundColor: new THREE.Color( 0xffffff ),
      //borderRadius: 0,
      //backgroundOpacity: 0
    //});  
    
    // Configure the position, rotation, and size of the fader
    //******THIS NEEDS TO REFLECT FACING IN ITS OFFSET FROM SCREEN */
    //this.#fader.position.set(norm.x, norm.y, (norm.z + UTILS.scaleDistance(0.1, uniScale, modScale)));
    //this.#fader.rotation.y = THREE.MathUtils.degToRad(rot);

// after creating #fader
//this.#fader.renderOrder = 10; // draw after the screen
//this.#fader.traverse(o => {
  //if (o.material) {
    //o.material.transparent = true;   // you’re animating opacity
    //o.material.depthTest = false;    // don’t get occluded by screen
    //o.material.depthWrite = false;   // don’t occlude the screen/pages
  //}
//});    
      //this.#parent.getRegion().getWorld().getEngine().getScene().add(this.#fader);
    

    this.#pages = [];
    const pages = this.#data.querySelector("content").getElementsByTagName("page");
    for(let a = 0; a < pages.length; a++) {
    
      const page = new Page(this, pages[a]);
      page.processData();
      page.buildPage(this.#uniScale, this.#modScale);
      this.#pages.push(page);
      //console.log(page)
    }
    
    this.#getPageByIndex(0).displayPage(false);
  }

  #getPageByIndex(index) {

    for(let a = 0; a < this.#pages.length; a++) {

      if(this.#pages[a].getIndex() === index)
        return this.#pages[a];
    }
  }

  process(frame, time) {

    if(this.#playing && this.#currentPage !== null) {

      if(this.#startTime === -1 && this.#currentTime === -1) {

        this.#startTime = time;
        this.#currentTime = time;
      }

      this.#currentTime = time;
      this.#elapsed = (this.#currentTime - this.#startTime);      
      if(this.#elapsed >= this.#currentPage.getLength()) {

        let index = this.#currentPage.getIndex();
        index++;
        if(index === this.#pages.length)
          this.#playing = false;
        else
          this.#getPageByIndex(index).displayPage(true);

        this.#resetTransitionCounters();
      }

      const fadeIn = this.#currentPage.getFadeIn();
      const fadeOut = this.#currentPage.getFadeOut();
      
      if(fadeIn > 0) {
      
        const fadeInCheck = (this.#startTime + fadeIn);
        //console.log("CURRENT " + this.#currentTime)
        //console.log("CHECK " + fadeInCheck)
        if(this.#currentTime < fadeInCheck) {

          // Fade the page in
          //console.log("FADING")
          const percent = (Math.abs(fadeIn - (fadeInCheck - this.#currentTime)) / fadeIn);
          this.#currentPage.getBase().set( { borderOpacity: percent } );
          //console.log("IN: " + Math.abs(fadeIn - (fadeInCheck-this.#currentTime)))
          //console.log(percent)
        }

      }

      if(fadeOut > 0) {
      
        const fadeOutCheck = (this.#startTime + this.#currentPage.getLength() - fadeOut);
        if(this.#currentTime > fadeOutCheck) {

          // Fade the page in
          //console.log("FADING")
          const percent = 1 - ((this.#currentTime - fadeOutCheck) / fadeOut);
          this.#currentPage.getBase().set( { borderOpacity: percent } );
          //console.log(percent)
          //console.log(percent)
        }

      }

      //if(fade !== -1) {
      
        //const fadeCheck = (this.#currentPage.getLength() - fade);
        //if(this.#elapsed > (this.#currentPage.getLength() - fade)) {

          // Fade the page out
          //console.log("FADING")
          //const percent = 1 - ((this.#elapsed - fadeCheck) / fade);
          //this.#currentPage.getBase().set( { borderOpacity: percent} );
          
          //console.log(percent)
        //}

      //}      
    }
  }

  disposeCurrentPage() {

    // remove children first to detach from scene graph
    const children = [...this.#screen.children];
    for (const child of children) {
      this.#screen.remove(child);
      UTILS.disposeObject3D(child);
    }
  }

  buildContent() {


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
  #borderWidth;
  #borderColour;
  #borderRadius;
  #base;
  #components;

  constructor(parent, data) {

    this.#parent = parent;
    this.#data = data;
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
    this.#borderWidth = parseFloat(this.#data.querySelector("border-width").textContent.trim());
    this.#borderColour = this.#data.querySelector("border-colour").textContent.trim();
    this.#borderRadius = parseFloat(this.#data.querySelector("border-radius").textContent.trim());
    this.#components = this.#data.getElementsByTagName("component");
  }

  displayPage(removePrevious) {

    if(removePrevious) {

      this.#parent.disposeCurrentPage();
    }

    this.#parent.setCurrentPage(this);
    this.#parent.getScreen().add(this.#base);

    
  }

  buildPage(uniScale, modScale) {

    const w = this.#width;
    const h = this.#height;
    const screen = this.#parent.getScreen();
    const scaled = this.#parent.getScaled();
    const display = this.#parent.getDisplay();
    const components = this.#components;
    
    // Build the base page
    this.#base = new MESH_UI.Block({
      width: (scaled.x * w),
      height: (scaled.y * h),
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",
      borderWidth: 0.5, //((display.borderWidth * this.#borderWidth) * uniScale * modScale),
      borderColor: new THREE.Color(this.#borderColour),      
      borderRadius: ((display.borderRadius * this.#borderRadius) * uniScale * modScale),
      offset: 0
    });



    //    const region = this.#parent.getRegion();
    //const uniScale = region.getWorld().getEngine().getUniversalScale();
    //const modScale = region.getWorld().getEngine().getModelScale();
    //const screenSize = this.#screenSize;
    //const dis = this.#display;
    
    //const title = data.querySelector("text").textContent.trim();
    //const titleElement = new MESH_UI.Block({
      //width: ((screenSize.x * 0.95) * uniScale * modScale),
      //height: ((screenSize.y * 0.1) * uniScale * modScale),
      //letterSpacing: (1.25 * uniScale * modScale),
      //justifyContent: "center",
      //borderWidth: ((screenSize.x * dis.borderWidth) * uniScale * modScale),
      //borderColor: new THREE.Color("#FFFFFF"),
      //borderRadius: ((screenSize.x * 0.02) * uniScale * modScale),
      //margin: ((screenSize.x * 0.025) * uniScale * modScale)
    //});

    //const titleText = new MESH_UI.Text({
      
      //content: title.toUpperCase(),
      //fontColor: new THREE.Color("#FFFFFF"),
      //fontSize: (0.55 * uniScale * modScale)
    //})

    //titleElement.add(titleText);
    //return titleElement;
  }
}