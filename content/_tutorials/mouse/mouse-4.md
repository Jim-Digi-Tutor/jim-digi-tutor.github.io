---
permalink: tutorials/mouse/mouse-4.html
layout: article
type: article
pageTitle: "Tutorial: Using a Mouse"
subtitle: Part 4
title: Dragging & Dropping
css: basic-skills
js: mouse
--- 
<header>

  <h4>{{ page.subtitle }}</h4>  
  <h1>{{ page.title }}</h1>
          
</header>

<article id="article-body">
          
  <section>
          
    <h3>Section</h3>
    <h1>What is Dragging & Dropping?</h1>
          
    <h2>Graphical User Interfaces</h2>
          
    <p>
      When home computers first became popular, they were operated mainly by keyboard commands. If you wanted to open an application or document, you would have to type in the text commands to do that. You had to remember a lot of commands, and this wasn't always ideal! 
    </p>

    <p>
      Then along came the <span class="emphasise">graphical user interface</span>, or <span class="emphasise">GUI</span>, and this made using a computer so much easier. Instead of typing in a text command to open a document, you just pointed your mouse cursor at the file and clicked it.
    </p>

    <h2>Dragging & Dropping</h2>

    <p>
      One thing that GUIs brought to the game was <span class="emphasise">dragging and dropping</span>, the process of using a mouse to move something in a computer from one place to another.
    </p>    

    <p>
      You drag and drop by clicking on an object, holding down the mouse button, and moving the mouse. When you have moved the object to the right position, let go of the mouse button. You can try it below, move the icons from the left to the corresponding boxes on the right:
    </p>

    <figure>

      <div>

        <div class="icon-container">
          <img id="draggable-0" draggable="true" ondragstart="dragStart(event, 0);" class="icon-image" class="icon-image" src="./assets/images/chrome-icon.png">
        </div>

        <div class="icon-container">
          <div id="drop-target-0" class="drop-target" ondrop="dropItem(event, 0);" ondragover="allowDrop(event, 0);"></div>
        </div>

        <img id="tick-image-0" class="tick-image faded-out" src="./assets/images/green-tick.png">

      </div>

      <div>

        <div class="icon-container">
          <img id="draggable-1" draggable="true" ondragstart="dragStart(event, 1);" class="icon-image" class="icon-image" src="./assets/images/word-icon.png">
        </div>

        <div class="icon-container">
          <div id="drop-target-1" class="drop-target" ondrop="dropItem(event, 1);" ondragover="allowDrop(event, 1);"></div>
        </div>

        <img id="tick-image-1" class="tick-image faded-out" src="./assets/images/green-tick.png">

      </div>

      <div>

        <div class="icon-container">
          <img id="draggable-2" draggable="true" ondragstart="dragStart(event, 2);" class="icon-image" class="icon-image" src="./assets/images/folder-icon.png">
        </div>

        <div class="icon-container">
          <div id="drop-target-2" class="drop-target" ondrop="dropItem(event, 2);" ondragover="allowDrop(event, 2);"></div>
        </div>

        <img id="tick-image-2" class="tick-image faded-out" src="./assets/images/green-tick.png">

      </div>

      <p>Dragging & Dropping</p>

    </figure>

    <p>
      Dragging and dropping takes a bit of practice, if you are not comfortable with it, tap the <span class="emphasise">F5</span> key to refresh this page and try again. When you are ready, you can use the links below to move on.
    </p>

    <div class="link-row">
      <div><a href="./mouse-3.html">&#8592;&nbsp;Previous Section</a></div>
      <div><a href="./mouse-5.html">Next Section&nbsp;&#8594;</a></div>
    </div>
  
  </section>

</article>     