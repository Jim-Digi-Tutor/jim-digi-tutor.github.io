let cookies = false;
let menuClosed = true;
let menuAnimating = false;

function init() {

  //if(getCookie("consent") !== null && parseInt(getCookie("consent")) === 1) {

    //cookies = true;

  //} else {

    //cookies = false;
    //buildCookieDialog();
  //}

  // Build the Table of Contents, if required
  tocRequired(); 
  
  // Run page-specific JS if required
  jsRequired(); 

  // Escape any code elements and highlight them with highlight.js
  document.querySelectorAll("code").forEach(function(element) {
    element.innerHTML = element.innerHTML.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  });

  hljs.highlightAll();

  // Calculate the height of the menu-bar, set the function to run on resize
  calculateMenuBarHeight();
  window.onresize = calculateMenuBarHeight;
}

function calculateMenuBarHeight() {

  let menuBar = document.getElementById("menu-bar");

  // Set the menu-bar height to auto, its natural height
  let styles = window.getComputedStyle(menuBar);
  menuBar.style.height = "auto";

  // Capture the height of the menu-bar
  let height = styles.getPropertyValue("height");

  // Check whether the browser is currently in mobile mode
  let isMobile = styles.getPropertyValue("--is-mobile");
  if(isMobile == 1) {
    
    let root = document.querySelector(":root");
    root.style.setProperty("--menu-height", height);
    menuBar.style.height = "0";
  }
}

function toggleMenu() {

  if(!menuAnimating) {
  
    if(menuClosed) {

      let menuBar = document.getElementById("menu-bar");
      menuBar.classList.add("menu-opening");

      menuBar.addEventListener("animationend", function() {

        let root = document.querySelector(":root");
        let styles = window.getComputedStyle(root);
        menuBar.style.height = styles.getPropertyValue("--menu-height");
        menuBar.classList.remove("menu-opening");

        menuClosed = false;
        menuAnimating = false;
      });

    } else {

      let menuBar = document.getElementById("menu-bar");
      menuBar.classList.add("menu-closing");

      menuBar.addEventListener("animationend", function() {

        menuBar.style.height = "0px";
        menuBar.classList.remove("menu-closing");

        menuClosed = true;
        menuAnimating = false;
      });            
    }
  }
}

function getCookie(name) {
  
  let decodedCookie = decodeURIComponent(document.cookie);
  let data = decodedCookie.split(";");
  for(let a = 0; a < data.length; a++) {
    
    let att = data[a].split("=")[0];
    let val = data[a].split("=")[1];
    if(att === name) 
      return val;
  }
  
  return null;
}

function addCookieConsent(consent) {

  if(consent) {
    
    document.cookie = "consent=1";
    cookies = true;
  }
  
  // Close the dialog and modal boxes
  resetDialog();
  resetModal();
}

function resetDialog() {

  let dialog = document.getElementById("dialog");
  // Iterate backwards through the element's children to remove them all
  for(let a = (dialog.children.length - 1); a > -1; a--)
    dialog.children[a].remove();
}

function resetModal() {
  
  let modal = document.getElementById("modal");
  // Iterate backwards through the element's children to remove them all
  for(let a = (modal.children.length - 1); a > -1; a--)
    modal.children[a].remove();

  modal.style.display = "none";
}

function buildCookieDialog() {

  let modal = document.getElementById("modal");
  let dialog = document.createElement("div");
  dialog.id = "dialog";
  dialog.classList.add("dialog");
  dialog.classList.add("dialog-medium");

  let title = document.createElement("h1");
  title.appendChild(document.createTextNode("Cookies"));
  dialog.appendChild(title);

  let p1 = document.createElement("p");
  p1.innerHTML += "This website uses <span class=\"emphasise\">cookies</span>; small data files that are stored on your computer. ";
  p1.innerHTML += "They are used to store your preferences for this site, such as the colour scheme you have chosen, and where you are up to in the exercises.";
  dialog.appendChild(p1);

  let p2 = document.createElement("p");
  p2.innerHTML += "However, you can choose whether or not you use them. ";
  p2.innerHTML += "If you want to use cookies to store your preferences click <span class=\"emphasise\">Use Cookies</span>; if you would rather not, click <span class=\"emphasise\">Don't Use Cookies</span>.";
  dialog.appendChild(p2);  
  
  let row = document.createElement("div");
  row.className = "content-row-centre";

  let yes = document.createElement("a");
  yes.appendChild(document.createTextNode("Use Cookies"));
  yes.className = "button";
  yes.href = "#";
  yes.onclick = function() { addCookieConsent(true); };
  row.appendChild(yes);

  let no = document.createElement("a");
  no.appendChild(document.createTextNode("Don't Use Cookies"));
  no.className = "button";
  no.href = "#";
  no.onclick = function() { addCookieConsent(false); };
  row.appendChild(no);

  dialog.appendChild(row);
  
  modal.appendChild(dialog);
  modal.style.display = "block";
}

function buildContents(article, menu) {

  for(let a = 0; a < article.children.length; a++) {

    if(article.children[a].tagName === "SECTION") {

      // Build the link to the section
      let section = article.children[a];
      let sid = ("s-" + a);
      section.id = sid;
      let slink = createElement("a", null, "level-1", null, null, menu);
      slink.href = ("#" + sid);

      // Iterate through the sub-contents and add links as appropriate
      let figCount = 0;
      for(let b = 0; b < section.children.length; b++) {

        let child = section.children[b];
        if(child.tagName === "H1") {

          slink.textContent = child.textContent;
        
        } else if(child.tagName === "H2") {

          let hid = ("h-" + a + "-" + b);
          child.id = hid;
          let hlink = createElement("a", null, "level-2", child.textContent, null, menu);
          hlink.href = ("#" + hid);
        
        } else if(child.tagName === "H3") {

          child.textContent = (child.textContent + " " + (a + 1));
          
        } else if(child.tagName === "FIGURE") {

          // Amend the figure with the correct number
          let fig = child.getElementsByTagName("p")[0];
          let figRef = ((a + 1) + "." + (figCount + 1));
          let label = ("Fig " + figRef + ": " + fig.textContent)
          fig.textContent = ("Figure " + figRef + ": " + fig.textContent);
          figCount++;

          let fid = ("f-" + a + "-" + b);
          child.id = fid;
          let flink = createElement("a", null, "level-3", label, null, menu);
          flink.href = ("#" + fid);
        }
      }
    }
  }
}

function createElement(type, id, className, text, styles, target) {

	var elem = document.createElement(type);
	if(id !== null) elem.id = id;
	if(id !== null) elem.name = id;
	if(className !== null) elem.className = className;
	if(text !== null) {

		var tnode = document.createTextNode(text);
		elem.appendChild(tnode);
	}
	
	if(styles !== null) {
	
		for(let name in styles)
			elem.style.setProperty(name, styles[name]);
	}

  if(target !== null)
    target.appendChild(elem);

	return elem;
}

function createInput(strType, strID, strClass, strValue, strLabel) {

	var objInput = document.createElement("input");
	objInput.type = strType;
	if(strID !== null) objInput.id = strID;
	if(strID !== null) objInput.name = strID;
	if(strClass !== null) objInput.className = strClass;
	if(strValue !== null) objInput.value = strValue;
	return objInput;
}