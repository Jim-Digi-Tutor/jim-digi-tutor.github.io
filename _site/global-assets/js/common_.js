let colourSchemes = [

    { label: "Standard Scheme", background: "#EEDDE8", emphasis: "rgb(182, 33, 112)", standard: "black", component: "white", additional1: "black", additional2: "orange", modal: "rgb(140, 140, 140)", darkGrey: "rgb(140, 140, 140)", ncPurple: "rgb(182, 33, 112)", headingBlue: "blue" },
    { label: "Green", background: "green", emphasis: "black", standard: "black", component: "green", additional1: "black", additional2: "white", modal: "rgb(140, 140, 140)", darkGrey: "black", ncPurple: "black", headingBlue: "black" },
    { label: "Lilac", background: "#E1C4FF", emphasis: "black", standard: "black", component: "#E1C4FF", additional1: "black", additional2: "white", modal: "rgb(140, 140, 140)", darkGrey: "black", ncPurple: "black", headingBlue: "black" },
    { label: "Pastel Pink", background: "#F8C8DC", emphasis: "black", standard: "black", component: "#F8C8DC", additional1: "black", additional2: "white", modal: "rgb(140, 140, 140)", darkGrey: "black", ncPurple: "black", headingBlue: "black" },  
    { label: "Pastel Yellow", background: "#FFFAA0", emphasis: "black", standard: "black", component: "#FFFAA0", additional1: "black", additional2: "white", modal: "rgb(140, 140, 140)", darkGrey: "black", ncPurple: "black", headingBlue: "black" }, 
    { label: "Rose Pink", background: "#FF66CC", emphasis: "black", standard: "black", component: "#FF66CC", additional1: "black", additional2: "white", modal: "rgb(140, 140, 140)", darkGrey: "black", ncPurple: "black", headingBlue: "black" },
    { label: "Yellow", background: "yellow", emphasis: "black", standard: "black", component: "yellow", additional1: "black", additional2: "white", modal: "rgb(140, 140, 140)", darkGrey: "black", ncPurple: "black", headingBlue: "black" }
  ];
  
  function setupColourSchemeSelect() {
  
    let target = document.getElementById("change-colour-scheme");
  
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
  
  function changeColourScheme(selector) {
  
    let index = parseInt(selector.value);
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
  
  function displayInfo(text, element) {
    
    let html = "";
    html += ("<p class=\"info-panel-header\">" + text[0] + "</p>");
    html += ("<p class=\"info-panel-content\">" + text[1] + "</p>");
    element.innerHTML = html;
  }
  
  function restartPage() {
  
    window.location.reload();  
  }