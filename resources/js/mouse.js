let info = [
  ["Left Mouse Button", "You will use the left button more than any of the others. It is used to select and open files and applications, as well as to drag items."],
  ["Middle Mouse Button", "When there is too much content to fit on one page, you can scroll through it by using the middle button to scroll up and down."],
  ["Right Mouse Button", "You won't use the right mouse button all that often. It is mainly used to bring up menus (lists of choices) about items."]
];

function mouseButtonInfo(display, index) {

  let pane = document.getElementById("mouse-info");

  let text = "";
  if(display) {
    
    text += ("<p class=\"heading\">" + info[index][0] + "</p>");
    text += ("<p class=\"description\">" + info[index][1] + "</p>");
  }

  pane.innerHTML = text;
}

function selectItem(element, index) {

  element.classList.add("icon-container-selected");
  
  let tickImage = document.getElementById("tick-image-" + index);
  tickImage.classList.remove("faded-out");
  tickImage.classList.add("fade-in-class");  
}

function finishFrame(id) {

  document.getElementById("frame-" + id + "-start").style.display = "none";
  document.getElementById("frame-" + id + "-done").style.display = "block";
}

function dblClickItem(element, index, practice) {
        
  if(!practice) {
  
    let clickImage = document.getElementById("tick-image-" + index);
    clickImage.classList.remove("faded-out");
    clickImage.classList.add("fade-in-class");
  
  } else {

    let count = parseInt(element.textContent);
    element.textContent = (count + 1);
  }
}

function dragStart(event, index) {

  event.dataTransfer.setData("text", event.target.id);       
}

function dropItem(event, index) {

  event.preventDefault();

  let data = event.dataTransfer.getData("text");

  if(data === ("draggable-" + index)) {

    let img = document.createElement("img");
    img.className = "dropped-item";
    img.src = document.getElementById("draggable-" + index).src;
    document.getElementById("drop-target-" + index).appendChild(img);

    let tickImage = document.getElementById("tick-image-" + index);
    tickImage.classList.remove("faded-out");
    tickImage.classList.add("fade-in-class");          
  }
}

function allowDrop(event, index) {

  event.preventDefault();
}