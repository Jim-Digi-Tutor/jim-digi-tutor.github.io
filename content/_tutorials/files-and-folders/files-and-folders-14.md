---
permalink: tutorials/files-and-folders/files-and-folders-14.html
layout: article-no-aside
type: article-no-aside
subtitle: Part 7
pageTitle: "Tutorial: Intro to Files & Folders"
title: "Finding Files 5"
css: basic-skills
js: files-and-folders
jsInit: true
--- 
<script type="text/javascript">

  let targetFolder = 5;
  let targetFile = 12;
  let current = 0;

  function pageSpecificInit() {

    setup();
    // Separate these to allow additions to basic folder structure
    structure.push(new icon(7, "London (1)", null, 4, 5, null));
    structure.push(new icon(8, "London (2)", null, 4, 5, null));
    structure.push(new icon(9, "The Lakes", null, 4, 5, null));
    structure.push(new icon(10, "Class Registers", null, 6, 1, null));
    structure.push(new icon(11, "Digital Skills", null, 2, 3, null));
    structure.push(new icon(12, "Creating Apps", null, 3, 3, null));
    structure.push(new icon(13, "Error Log", null, 5, 0, null));
    structure.push(new icon(14, "Timetable 22-23", null, 6, 4, null));
    structure.push(new icon(15, "Timetable 23-24", null, 6, 4, null));
    structure.push(new icon(16, "Finances", null, 6, 6, null));
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
          Find the <span class="emphasise">MP4</span> file <span class="emphasise">Creating Apps</span>. It is a video tutorial, a resource for a planned course. Where might it be stored?
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
    <img id="icon-1" style="display: none;" src="./assets/images/chrome-icon.png"> 
    <img id="icon-2" style="display: none;" src="./assets/images/word-icon.png"> 
    <img id="icon-3" style="display: none;" src="./assets/images/mp4-icon.png"> 
    <img id="icon-4" style="display: none;" src="./assets/images/jpeg-icon.png"> 
    <img id="icon-5" style="display: none;" src="./assets/images/text-icon.webp"> 
    <img id="icon-6" style="display: none;" src="./assets/images/excel-icon.png">     
    
    <div class="link-row">
      <div><a href="./files-and-folders-13.html">&#8592;&nbsp;Previous Section</a></div>
      <div><a href="./files-and-folders-15.html">Next Section&nbsp;&#8594;</a></div>
    </div>

  </section> 

</article>     