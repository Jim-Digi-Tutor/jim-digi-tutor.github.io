---
permalink: tutorials/mouse/mouse-3.html
layout: article
type: article
subtitle: Part 3
pageTitle: "Tutorial: Using a Mouse"
title: Clicking Buttons, Continued 
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
    <h1>Double Clicking</h1>
          
    <h2>What is double clicking?</h2>
          
    <p>
      A double click is two clicks of the left mouse button, one quite quickly after the other. The trick to double clicking is making sure that you don't move the mouse between clicks. It can take a bit of practice, which is what you're going to do now!
    </p>

    <p>
      When using Microsoft Windows, double clicking on icon will open that file, folder, or application. Try double clicking the icons below. 
    </p>

    <figure>

      <div>

        <div class="icon-container" ondblclick="dblClickItem(this, 0, false);">
          <img class="icon-image" src="./assets/images/chrome-icon.png">
          <h6>Google<br>Chrome</h6>
        </div>

        <div class="icon-container" ondblclick="dblClickItem(this, 1, false);">
          <img class="icon-image" src="./assets/images/word-icon.png">
          <h6>Microsoft<br>Word</h6>
        </div>

        <div class="icon-container" ondblclick="dblClickItem(this, 2, false);">
          <img class="icon-image" src="./assets/images/folder-icon.png">
          <h6>My<br>Documents</h6>
        </div>

      </div>

      <div>

        <img id="tick-image-0" class="tick-image faded-out" src="./assets/images/green-tick.png">
        <img id="tick-image-1" class="tick-image faded-out" src="./assets/images/green-tick.png">
        <img id="tick-image-2" class="tick-image faded-out" src="./assets/images/green-tick.png">

      </div>

      <p>Double Clicking Icons</p>

    </figure>

    <h2>Practice makes perfect!</h2>
          
    <p>
      As mentioned before, double clicking takes a bit of practice. If you're not comfortable with it yet, try clicking on the boxes below for practice.
    </p>

    <figure>

      <div>

        <div id="double-clicker-0" class="double-clicker" ondblclick="dblClickItem(this, 0, true);">0</div>
        <div id="double-clicker-1" class="double-clicker" ondblclick="dblClickItem(this, 1, true);">0</div>
        <div id="double-clicker-2" class="double-clicker" ondblclick="dblClickItem(this, 2, true);">0</div>

      </div>

      <p>Double Click Practice</p>

    </figure>          

  </section>
        
  <section>
          
    <h3>Section</h3>
    <h1>Right Clicking</h1>
          
    <h2>What is a Right Click?</h2>
          
    <p>
      Right clicking will usually bring up a menu (a list of things you can do), and those options will normally be related to the item that you right clicked. For example, on a webpage, right clicking a link on will give you the option to open the link; right clicking an image will give you the option to copy or download that image.
    </p>

    <p>
      When a menu is linked to a particular item, it is known as a <span class="emphasise">Context Menu</span>.
    </p>

    <p>
      Below are some examples of context menus, you'll notice that each has different options.
    </p>

    <figure>

      <div>

        <img class="context-menu-image" src="./assets/images/folder-right-click.png">
        <img class="context-menu-image" src="./assets/images/word-right-click.png">
        <img class="context-menu-image" src="./assets/images/link-right-click.png">
        
      </div>

      <p>Context Menus</p>

    </figure>

    <p>
      Try right clicking on the icons below.
    </p>

    <figure>

      <div>

        <div class="icon-container" oncontextmenu="javascript:selectItem(this, 3); return false;">
          <img class="icon-image" src="./assets/images/chrome-icon.png">
          <h6>Google<br>Chrome</h6>
        </div>

        <div class="icon-container" oncontextmenu="javascript:selectItem(this, 4); return false;">
          <img class="icon-image" src="./assets/images/word-icon.png">
          <h6>Microsoft<br>Word</h6>
        </div>

        <div class="icon-container" oncontextmenu="javascript:selectItem(this, 5); return false;">
          <img class="icon-image" src="./assets/images/folder-icon.png">
          <h6>My<br>Documents</h6>
        </div>

      </div>

      <div>

        <img id="tick-image-3" class="tick-image faded-out" src="./assets/images/green-tick.png">
        <img id="tick-image-4" class="tick-image faded-out" src="./assets/images/green-tick.png">
        <img id="tick-image-5" class="tick-image faded-out" src="./assets/images/green-tick.png">

      </div>

      <p>Selecting Icons</p>

    </figure>

  </section>

  <section>
          
    <h3>Section</h3>
    <h1>Mouse Scrolling</h1>
          
    <h2>What is Scrolling?</h2>
          
    <p>
      <span class="emphasise">Scrolling</span> means to slide pages of content up and down your screen. The content could be a document, or a webpage, or anything else that doesn't fit on a single page.
    </p>

    <p>
      The middle button of a mouse is also known as the <span class="emphasise">scroll wheel</span> and it is used for scrolling through content. To scroll a page up, you roll the middle button away from you, to go down, you roll the button towards you. Practice scrolling the content below until you find the links to continue onto the next section.
    </p>    

      <div class="scroller-div">
        
        <img class="down-arrow" src="./assets/images/down-arrow.png">
        <img class="down-arrow" src="./assets/images/down-arrow.png">
        <img class="down-arrow" src="./assets/images/down-arrow.png">
        <img class="down-arrow" src="./assets/images/down-arrow.png">

        <div class="link-row">
          <div><a href="./mouse-2.html">&#8592;&nbsp;Previous Section</a></div>
          <div><a href="./mouse-4.html">Next Section&nbsp;&#8594;</a></div>
        </div>

      </div>
  
  </section>

</article>     