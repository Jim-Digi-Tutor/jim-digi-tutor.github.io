---
permalink: tutorials/mouse/mouse-2.html
layout: article
type: article
subtitle: Part 2
pageTitle: "Tutorial: Using a Mouse"
title: Clicking Buttons 
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
    <h1>The Different Clicks</h1>
          
    <h2>What is a click?</h2>
          
    <p>
      When you press a button on a mouse, it is known as a <span class="emphasise">click</span>. There are three different types of clicks. Like everything else to do with computers, each type of click might do something different depending on the situation. 
    </p>

    <h2>Left Click</h2>
          
    <p>
      The <span class="emphasise">Left Click</span> (also described as just a <span class="emphasise">click</span>) is a single click of the mouse's left button. The left click is commonly used to select files and folders in Windows, or open a weblink on a webpage.
    </p>

    <h2>Double Click</h2>
          
    <p>
      The <span class="emphasise">Double Click</span> is two clicks in quick succession of the mouse's left button. The double click is usually used to open files and folders in Windows.
    </p>

    <p>
      Double clicking can be challenging for people who have health conditions affecting the hands or wrists, or who do not have steady hands. This is because the mouse has to remain still between the clicks. One alternative to double-clicking is to click once on your target and then press the <span class="emphasise">Enter Key</span>.
    </p>

    <h2>Right Click</h2>
          
    <p>
      The <span class="emphasise">Right Click</span> is a single click of the mouse's right button. The right click is usually used to open a menu (a list of options) for a particular file, folder, or link.
    </p>

    <h2>Scroll</h2>
          
    <p>
      The <span class="emphasise">Scroll</span> isn't quite a click, but the rolling of the mouse's middle button. When you scroll your mouse, you will scroll the content of a webpage or document up or down. Scrolling up (rolling the mouse wheel away from you) scrolls the content up; scrolling down (rolling the mouse wheel towards you) scrolls the content down.
    </p>
          
  </section>
        
  <section>
          
    <h3>Section</h3>
    <h1>Left Clicking</h1>
          
    <h2>What is a Left Click?</h2>
          
    <p>
      When you click your left mouse button once, it is known as a <span class="emphasis">left click</span>, or just a <span class="emphasise">click</span>. Left clicking is also just known as <span class="emphasise">clicking</span>, and clicking does different things depending on what you are clicking on. For example, if you click a file, app, or folder in Windows, you will <span class="emphasise">select</span> it.
    </p>

    <h2>What is Selecting?</h2>
    
    <p>
      In Windows, you can <span class="emphasise">select</span> icons. When you select an icon, you can then do other things with it, such as  rename it, copy it, or delete it. When an icon is selected, usually it changes colour slightly to indicate it has been clicked on.
    </p>

    <p>
      Try selecting on the icons below, observe what happens to them when they are clicked.
    </p>

    <figure>

      <div>

        <div class="icon-container" onclick="selectItem(this, 0);">
          <img class="icon-image" src="./assets/images/chrome-icon.png">
          <h6>Google<br>Chrome</h6>
        </div>

        <div class="icon-container" onclick="selectItem(this, 1);">
          <img class="icon-image" src="./assets/images/word-icon.png">
          <h6>Microsoft<br>Word</h6>
        </div>

        <div class="icon-container" onclick="selectItem(this, 2);">
          <img class="icon-image" src="./assets/images/folder-icon.png">
          <h6>My<br>Documents</h6>
        </div>

      </div>

      <div>

        <img id="tick-image-0" class="tick-image faded-out" src="./assets/images/green-tick.png">
        <img id="tick-image-1" class="tick-image faded-out" src="./assets/images/green-tick.png">
        <img id="tick-image-2" class="tick-image faded-out" src="./assets/images/green-tick.png">

      </div>

      <p>Selecting Icons</p>

    </figure>

    <h2>Clicking on weblinks</h2>

    <p>
      When navigating a webpage, weblinks only need a single click to open them (not a double click). Try clicking on the weblinks below.
    </p>

    <figure>

      <div>

        <div>
          
          <div id="frame-1-start" class="pseudo-iframe">

            <h1>Mini Web Site 1</h1>

            <h6>
              This is a mini-webpage with a link to take you to another page. This link only needs a single click to open. Why don't you try the link now?
            </h6>
        
            <a class="pseudo-iframe-link" href="javascript:finishFrame(1)">Click this link...</a>

          </div>

          <div id="frame-1-done" class="pseudo-iframe" style="display: none;">

            <h1>Well Done!</h1>

            <h6>
              Weblinks only require a single click. However, other things, as you will find out in the next section, need a double-click. Knowing what to click and what to double-click can sometimes be a little confusing, but with practice, you'll get used to it.
            </h6>

          </div>  

        </div>

        <div>

          <div id="frame-2-start" class="pseudo-iframe">

            <h1>Mini Web Site 2</h1>

            <h6>
              This is another mini-webpage with another link. This link looks like a button, but it works in the same way as other weblinks so it only needs a single click to open. Give it a try!
            </h6>
        
            <a class="pseudo-iframe-button" href="javascript:finishFrame(2)">Click this link...</a>

          </div>

          <div id="frame-2-done" class="pseudo-iframe" style="display: none;">

            <h1>Well Done!</h1>

            <h6>
              Weblinks only require a single click. However, other things, as you will find out in the next section, need a double-click. Knowing what to click and what to double-click can sometimes be a little confusing, but with practice, you'll get used to it.
            </h6>
            
          </div>  

        </div>

      </div>

      <p>Clicking Weblinks</p>

    </figure>

    <p>
      You should now have a good idea of when to click and how to click. In the next section, you'll learn about double-clicking and right-clicking. When you are ready, click the link below to move on.
    </p>

    <div class="link-row">
      <div><a href="./mouse-1.html">&#8592;&nbsp;Previous Section</a></div>
      <div><a href="./mouse-3.html">Next Section&nbsp;&#8594;</a></div>
    </div>
  
  </section>

</article>     