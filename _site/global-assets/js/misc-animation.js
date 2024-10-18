let frame = 0;

function animateExample() {

  frame++;
  if(frame > 11)
    frame = 0;

  let example = document.getElementById("animation-example");
  example.src = document.getElementById("frame-" + frame).src;

  setTimeout(animateExample, 250);
}

function animateExampleAndThumbnails() {

  let previousFrame = frame;

  frame++;
  if(frame > 11)
    frame = 0;

  let example = document.getElementById("animation-example");
  example.src = document.getElementById("thumbnail-" + frame).src;

  let previous = document.getElementById("thumbnail-" + previousFrame);
  previous.classList.remove("frame-active");
  previous.classList.add("frame-inactive");

  let current = document.getElementById("thumbnail-" + frame);
  current.classList.remove("frame-inactive");
  current.classList.add("frame-active");

  setTimeout(animateExampleAndThumbnails, 250);
}