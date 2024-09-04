---
---
function folderInfo(show, index) {

  document.getElementById("tick-image-" + index).style.visibility = (show) ? "visible" : "hidden";
}

/* Build variables and functions for File Explorer emulation */
let structure;
let currentFolder;
let done;

function setup() {

  // Build basic structure, can be added to by page
  structure = [];
  structure.push(new icon(0, "C:", "C:\\", 0, null, [ 111, 18, 75, 50 ] ));
  structure.push(new icon(1, "Work Documents", "C:\\Work Documents", 0, 0, [ 17, 106, 90, 53 ] ));
  structure.push(new icon(2, "Home Documents", "C:\\Home Documents", 0, 0, [ 190, 106, 90, 53 ] ));
  structure.push(new icon(3, "Lesson Plans", "C:\\Work Documents\\Lesson Plans", 0, 1, [ 24, 200, 76, 53 ] ));
  structure.push(new icon(4, "Timetable", "C:\\Work Documents\\Timetable", 0, 1, [ 95, 200, 66, 53 ] ));
  structure.push(new icon(5, "Photos", "C:\\Home Documents\\Photos", 0, 2, [ 203, 200, 65, 53 ] ));
  structure.push(new icon(6, "Money", "C:\\Home Documents\\Money", 0, 2, [ 269, 200, 65, 53 ] ));
}

function buildExplorerView() {

  let target = document.getElementById("explorer-content");

  currentFolder = structure[0];
  for(let a = 0; a < structure.length; a++)
    if(structure[a].id === current)
      currentFolder = structure[a];

  document.getElementById("explorer-position").style.left = (currentFolder.cursor[0] + "px");
  document.getElementById("explorer-position").style.top = (currentFolder.cursor[1] + "px");
  document.getElementById("explorer-position").style.width = (currentFolder.cursor[2] + "px");
  document.getElementById("explorer-position").style.height = (currentFolder.cursor[3] + "px");

  document.getElementById("bread-crumbs").textContent = currentFolder.path;

  target.innerHTML = "";

  let count = 0;
  for(let a = 0; a < structure.length; a++) {

    if(structure[a].parent === current){

      structure[a].draw(count, target);
    }
  }

  if(current === targetFolder && targetFile === -1) {

    done = true;
    document.getElementById("big-tick").classList.add("fade-in-class");
    document.getElementById("big-tick").classList.remove("faded-out");
  }
}

function icon(id, name, path, type, parent, cursor) {

  this.id = id;
  this.name = name;
  this.path = path;
  this.type = type;
  this.parent = parent;
  this.cursor = cursor;

  this.icon;

  this.draw = function(count, target) {

    this.icon = document.createElement("div");
    let icon = this.icon;
    icon.ondblclick = this.navigate.bind(this);
    icon.onclick = this.select.bind(this);
    icon.className = "explorer-icon-container";
    let iconImage = document.createElement("img");
    iconImage.className = "explorer-icon-image";
    iconImage.src = document.getElementById("icon-" + this.type).src;
    icon.appendChild(iconImage);
    let label = document.createElement("span");
    label.appendChild(document.createTextNode(this.name));
    icon.appendChild(label);          
    target.appendChild(icon);
  }

  this.navigate = function() {

    if(!done) {
    
      current = this.id;
      buildExplorerView();
    }
  }

  this.select = function() {

    if(!done && this.type !== 0) {

      for(let a = 0; a < structure.length; a++) {

        if(structure[a].parent === current)
          structure[a].icon.classList.remove("icon-container-selected");
      }

      this.icon.classList.add("icon-container-selected");

      if(this.id === targetFile) {

        done = true;
        document.getElementById("big-tick").classList.add("fade-in-class");
        document.getElementById("big-tick").classList.remove("faded-out");
      }            
    }
  }  
}

function goUp() {

  if(!done) {
  
    if(currentFolder.parent !== null) {
  
      current = currentFolder.parent;
      buildExplorerView();
    }
  }
}