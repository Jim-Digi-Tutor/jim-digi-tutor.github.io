function configureOutputToggle() {

  let target = document.getElementById("output-type");
  if(protocol.getAbsolute()) {

    target.children[0].classList.remove("selected");
    target.children[0].classList.add("unselected");
    target.children[0].onclick = toggleOutputType;

    target.children[2].classList.remove("unselected");
    target.children[2].classList.add("selected");
    target.children[2].onclick = null;
    
    protocol.toggleAbsolute();

  } else {
    
    target.children[0].classList.remove("unselected");
    target.children[0].classList.add("selected");
    target.children[0].onclick = null;

    target.children[2].classList.remove("selected");
    target.children[2].classList.add("unselected");
    target.children[2].onclick = toggleOutputType;

    protocol.toggleAbsolute();
  }
}