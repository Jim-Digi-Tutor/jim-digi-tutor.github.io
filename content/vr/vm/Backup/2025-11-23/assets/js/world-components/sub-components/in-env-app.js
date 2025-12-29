import * as THREE from "three";

export class InEnvironmentApplication {

  #displayBoard;

  #dpr;

  #id;
  #app;
  #canvas;
  #context;

  #addToPage;

  constructor(displayBoard, id, addToPage = false) {

    this.#displayBoard = displayBoard;
    this.#id = id;

    this.#app = null;
    if(id === "test-app")
      this.#app = new TestApp(id, this);

    this.#dpr = window.devicePixelRatio || 1;

    this.#canvas = document.createElement("canvas");
    this.#canvas.width = this.#app.getWidth() * this.#dpr;
    this.#canvas.height = this.#app.getHeight() * this.#dpr;
    this.#context = this.#canvas.getContext("2d");
    this.#context.scale(this.#dpr, this.#dpr);
    
    // addToPage is an optional parameter
    // Passed as true only from the app testing HTML page
    // It should be false by the THREE calls
    this.#addToPage = addToPage;
    if(this.#addToPage)
      document.body.appendChild(this.#canvas);
  }

  getCanvas() { return this.#canvas; }

  refresh(time, forceRefresh = false) {

    const refresh = this.#app.refresh(time);
    if(refresh || (forceRefresh !== undefined && forceRefresh))
      this.#app.draw(this.#context, time);

    return refresh;
  }

  onControllerClickDown(point) {

    this.#app.onControllerClickDown(point);
  }

  onControllerClickRelease(point) {

    this.#app.onControllerClickRelease(point);
  }

  onControllerOver(point) {

    this.#app.onControllerOver(point);
  }
}

class BaseApp {

  id;
  parent;

  width;
  height;

  pointer = new THREE.Vector2();
  components = [];
  picked = null;
  selected = null;  

  constructor(id, parent) {

    this.id = id;
    this.parent = parent;
  }

  getWidth() { return this.width; }
  getHeight() { return this.height; }
  getPicked() { return this.picked; }
  setPicked(picked) { this.picked = picked; }  
  getSelected() { return this.selected; }
  setSelected(selected) { this.selected = selected; }  

  normalisePointer(point) {

    // Point is passed as a percentage of the screen dimensions.
    // Normalise the position.
    this.pointer.x = Math.round((this.width * point.x));

    // Y-coordinates go from bottom to top; reverse this
    this.pointer.y = Math.abs(this.height - Math.round(this.height * point.y));
  }

  refresh(time) {
   
    let refresh = false;
    let picked = null;
    for(let a = 0; a < this.components.length; a++) {
      
      const data = this.components[a].needsRefresh(this.pointer);
      
      if(!refresh && data.refresh)
        refresh = true;
      
      if(data.picked)
        picked = this.components[a];

      if(refresh && picked !== null)
        break;
    }

    this.picked = picked;
    return refresh;
  }  

  onControllerClickDown(point) {

    this.normalisePointer(point);

    let noSelected = true;
    for(let a = 0; a < this.components.length; a++) {
      
      if(this.components[a].isPicked(this.pointer)) {

        this.selected = this.components[a];
        noSelected = false;
        break;
      }
    }

    if(noSelected)
      this.selected = null;

    if(this.selected === null)
      console.log("Controller Down on Null");
    else
      console.log("Controller Down on " + this.selected.getId());
  }

  onControllerClickRelease(point) {

    this.normalisePointer(point);

    let selected = null;
    for(let a = 0; a < this.components.length; a++) {
      
      if(this.components[a].isPicked(this.pointer)) {

        selected = this.components[a];
        break;
      }
    }

    if(selected === null) {
      
      console.log("Controller Released on Null");
    
    } else {
      
      if(selected === this.selected) {
        
        console.log("Controller Released on " + this.selected.getId());
        console.log("This is the target object ", this.selected);
        this.selected.onClick();
      
      } else {
        
        console.log("Controller Released but not on " + this.selected.getId());
      }
    }

    this.selected = null;
  }

  onControllerOver(point) {

    this.normalisePointer(point);
  }  
}

class TestApp extends BaseApp {

  constructor(id, parent) {

    super(id, parent);

    this.width = 800;
    this.height = 450;

    this.components.push(
      new Button(
        this,
        0,
        "test-button-a",
        new THREE.Vector2(50, 50),
        new THREE.Vector2(200, 75),
        "RECTANGLE",
        "A"
      )
    );

    this.components.push(
      new Button(
        this,
        1,
        "test-button-b",
        new THREE.Vector2(50, 150),
        new THREE.Vector2(200, 75),
        "RECTANGLE",
        "B"
      )
    );    
  }

  draw(ctx, time) {

    ctx.font = "64px sans-serif";
    ctx.fillStyle = "#999999";
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillRect(0, 0, this.width, this.height);
    for(let a = 0; a < this.components.length; a++)
      this.components[a].draw(ctx, this.pointer, time);
  }
}

class BaseComponent {

  parent;
  id;
  alias;
  position;
  size;
  shape;
  label;

  hasChanged = false;
  
  click;
  over;
  out;
  
  constructor(parent, id, alias, position, size, shape, label, click = null, over = null, out = null) {

    this.parent = parent;
    this.id = id;
    this.alias = alias;
    this.position = position;
    this.size = size;
    this.shape = shape;
    this.label = label;

    this.click = click;
    this.over = over;
    this.out = out;    
  }

  drawBase(ctx, strokeColour, strokeWidth, fillColour, textColour) {

    ctx.fillStyle = fillColour;
    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);

    ctx.strokeStyle = strokeColour;
    ctx.lineWidth = strokeWidth;
    ctx.strokeRect(this.position.x, this.position.y, this.size.x, this.size.y); 
    
    ctx.fillStyle = textColour;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      this.label,
      (this.position.x + (this.size.x / 2)),
      (this.position.y + (this.size.y / 2))
    ); 
  }

  isPicked(pointer) {

    return (
      pointer.x >= this.position.x &&
      pointer.x <= (this.position.x + this.size.x) &&
      pointer.y >= this.position.y &&
      pointer.y <= (this.position.y + this.size.y)
    );
  }  
}

class Button extends BaseComponent {

  constructor(parent, id, alias, position, size, shape, label, click = null, over = null, out = null) {

    super(parent, id, alias, position, size, shape, label);
  }

  getId() { return this.id; }

  needsRefresh(pointer) {

    let refresh = this.hasChanged;
    this.hasChanged = false;
    
    const lastPicked = this.parent.getPicked();
    const isPicked = this.isPicked(pointer);
    if(!refresh)
      if((lastPicked === this && !isPicked) || (lastPicked !== this && isPicked))
        refresh = true;

    return {
      refresh: refresh,
      picked: isPicked
    }
  }
   
  draw(ctx, pointer, time) {
    
    let stroke = "#FF0000";
    if(this.isPicked(pointer))
      stroke = "#00FF00";

    this.drawBase(ctx, stroke, 3, "#AAAAAA", "#000000");
  }

  onClick() {

    console.log("Clicked " + this.id);
  }

  onOver() {}
  onOut() {}
} 