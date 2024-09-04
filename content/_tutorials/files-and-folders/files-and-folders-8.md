---
permalink: tutorials/files-and-folders/files-and-folders-8.html
layout: article-no-aside
type: article-no-aside
subtitle: Part 5
pageTitle: "Tutorial: Intro to Files & Folders"
title: "Finding Folders 4"
css: basic-skills
js: files-and-folders
jsInit: true
--- 
<script type="text/javascript">

  let targetFolder = 5;
  let targetFile = -1;
  let current = 0;

  function pageSpecificInit() {

    setup();
    // Separate these to allow additions to basic folder structure
    buildExplorerView();
  }

</script>

<header>

  <h4>{{ page.subtitle }}</h4>  
  <h1>{{ page.title }}</h1>
          
</header>

<article id="article-body">
          
  <section>
          
    <div class="console">

      <div class="console-section">   
      
        <p>
          You now need to find and open the <span class="emphasise">Photos</span> folder. To move on, click <span class="emphasise">Next Section</span> to move on.
        </p>

      </div>

      <div class="console-section">

          <div class="explorer-mock-up">
            
            <div class="explorer-up-button" onclick="goUp();">&#8593;</div>
          
            <div id="bread-crumbs" class="explorer-bread-crumbs"></div>

            <div id="explorer-content" class="explorer-content"></div>

            <img id="big-tick" class="big-tick-image faded-out" src="./assets/images/green-tick.png"> 

          </div>  

      </div>

      <div class="console-section">
        <div id="explorer-position" class="explorer-position"></div>
        <img class="explorer-map-image" src="./assets/images/folder-structure.png">
      </div>
                
    </div>

    <!-- Pre-load the icon image -->    
    <img id="icon-0" style="display: none;" src="./assets/images/folder-icon-explorer.png"> 
    
    <div class="link-row">
      <div><a href="./files-and-folders-7.html">&#8592;&nbsp;Previous Section</a></div>
      <div><a href="./files-and-folders-9.html">Next Section&nbsp;&#8594;</a></div>
    </div>

  </section> 

</article>     