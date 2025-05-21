let colourSchemes = [

  { label: "Standard Scheme", background: "#EEDDE8", emphasis: "rgb(182, 33, 112)", standard: "black", component: "white", additional1: "black", additional2: "orange", modal: "rgb(140, 140, 140)", darkGrey: "rgb(140, 140, 140)", ncPurple: "rgb(182, 33, 112)", headingBlue: "blue" },
  { label: "Green", background: "green", emphasis: "black", standard: "black", component: "green", additional1: "black", additional2: "white", modal: "rgb(140, 140, 140)", darkGrey: "black", ncPurple: "black", headingBlue: "black" },
  { label: "Lilac", background: "#E1C4FF", emphasis: "black", standard: "black", component: "#E1C4FF", additional1: "black", additional2: "white", modal: "rgb(140, 140, 140)", darkGrey: "black", ncPurple: "black", headingBlue: "black" },
  { label: "Pastel Pink", background: "#F8C8DC", emphasis: "black", standard: "black", component: "#F8C8DC", additional1: "black", additional2: "white", modal: "rgb(140, 140, 140)", darkGrey: "black", ncPurple: "black", headingBlue: "black" },  
  { label: "Pastel Yellow", background: "#FFFAA0", emphasis: "black", standard: "black", component: "#FFFAA0", additional1: "black", additional2: "white", modal: "rgb(140, 140, 140)", darkGrey: "black", ncPurple: "black", headingBlue: "black" }, 
  { label: "Rose Pink", background: "#FF66CC", emphasis: "black", standard: "black", component: "#FF66CC", additional1: "black", additional2: "white", modal: "rgb(140, 140, 140)", darkGrey: "black", ncPurple: "black", headingBlue: "black" },
  { label: "Yellow", background: "yellow", emphasis: "black", standard: "black", component: "yellow", additional1: "black", additional2: "white", modal: "rgb(140, 140, 140)", darkGrey: "black", ncPurple: "black", headingBlue: "black" }
];

function buildHeaderTitle(title) {

  document.getElementById("title").innerHTML = title.title;
  document.getElementById("sub-title").innerHTML = title.subTitle;
}

function buildHeaderOptions(target, config) {

  // If required, build the colour scheme picker
  if(config.changeScheme) {

    let select = createElement("select", "change-colour-scheme", null, null, null, target);
    select.onchange = changeColourScheme;
    setupColourSchemeSelect(select);
  }

  // If required, build the home link
  if(config.homeButton) {

    let home = createElement("a", null, null, "Home", null, target);
    home.href = config.homeLink;
  }

  // If both the home button and restart button are required, add the divider
  if(config.homeButton && config.restartButton) {

    let span = createElement("span", null, "bold nc-purple font-rem-1-2", null, null, target);
    span.innerHTML = "&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;";
  }

  // If required, build the home link
  if(config.restartButton) {

    let restart = createElement("a", null, null, "Restart", null, target);
    restart.href = "#";
    restart.onclick = restartPage;
  }
}

function buildFooter(targets, config) {

  // Add a "back" button, if required
  if(config.backButton !== null) {

    let back = createElement("a", null, "custom-button custom-button-back", config.backText, null, targets[0]);
    back.href = config.backButton;
  }  

  // Add a "next" button, if required
  if(config.nextButton !== null) {

    let next = createElement("a", null, "custom-button custom-button-next", config.nextText, null, targets[2]);
    next.href = config.nextButton;
  }
}

function setupColourSchemeSelect(target) {

  let def = document.createElement("option");
  def.value = 0;
  def.text = "Change Colour Scheme";
  target.appendChild(def);

  for(let a = 0; a < colourSchemes.length; a++) {

    let opt = document.createElement("option");
    opt.value = a;
    opt.text = (a === 0) ? colourSchemes[a].label : ("Contrast (" + colourSchemes[a].label + ")");
    target.appendChild(opt);
  }
}

function changeColourScheme() {

  let index = parseInt(this.value);
  document.documentElement.style.setProperty("--background-colour", colourSchemes[index].background);
  document.documentElement.style.setProperty("--emphasis-text-colour", colourSchemes[index].emphasis);
  document.documentElement.style.setProperty("--standard-text-colour", colourSchemes[index].standard);
  document.documentElement.style.setProperty("--component-background-colour", colourSchemes[index].component);
  document.documentElement.style.setProperty("--additional-colour-1", colourSchemes[index].additional1);
  document.documentElement.style.setProperty("--additional-colour-2", colourSchemes[index].additional2);
  document.documentElement.style.setProperty("--modal-colour", colourSchemes[index].modal);
  document.documentElement.style.setProperty("--dark-grey", colourSchemes[index].darkGrey);
  document.documentElement.style.setProperty("--nc-purple", colourSchemes[index].ncPurple);
  document.documentElement.style.setProperty("--heading-blue", colourSchemes[index].headingBlue);
}

function getCssVariable(name) {

  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

function setCssVariable(name, value) {

  document.documentElement.style.setProperty(name, value); 
}

function removePx(string) {

  return parseInt(string.split("p")[0]);
}

function displayInfo(text, element) {
  
  let html = "";
  html += ("<p class=\"info-panel-header\">" + text[0] + "</p>");
  html += ("<p class=\"info-panel-content\">" + text[1] + "</p>");
  element.innerHTML = html;
}

function restartPage() {

  window.location.reload();  
}

function createElement(strType, strID, strClass, strText, objStyles, objAppendTo) {

  var objElement = document.createElement(strType);
  if(strID !== null) objElement.id = strID;
  if(strID !== null) objElement.name = strID;
  if(strClass !== null) objElement.className = strClass;
  if(strText !== null) {

    var objText = document.createTextNode(strText);
    objElement.appendChild(objText);
  }
  
  if(objStyles !== null) {
  
    for(strName in objStyles)
      objElement.style.setProperty(strName, objStyles[strName]);
  }

  if(objAppendTo !== null)
    objAppendTo.appendChild(objElement);

  return objElement;
}

function createFormInput(strType, strID, strClass, strValue, strPlaceholder, numMaxLength, objStyles, objAppendTo) {

  var objInput = document.createElement("input");
  objInput.type = strType;
  if(strID !== null) objInput.id = strID;
  if(strID !== null) objInput.name = strID;
  if(strClass !== null) objInput.className = strClass;
  if(strValue !== null) objInput.value = strValue;
  if(strPlaceholder !== null) objInput.placeholder = strPlaceholder;
  if(numMaxLength !== null) objInput.maxlength = numMaxLength;

  if(objStyles !== null) {
  
    for(strName in objStyles)
      objInput.style.setProperty(strName, objStyles[strName]);
  }

  if(objAppendTo !== null)
    objAppendTo.appendChild(objInput);  

  return objInput;
}