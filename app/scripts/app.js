var app = (function ($) {

  var containerEl = document.getElementById("canvas-container"),
      selectedItem,
      grid,
      colourAreas = [],
      $colorPalette;

  function init() {
    // Colour palette
    $colorPalette = $('.color-palette .color-button');
    $colorPalette.on('click', function(e) {
      if (selectedItem) {
        selectedItem.fillColor = e.currentTarget.getAttribute('data-color');
        view.draw();
      }
    });

    // Setup directly from canvas id:
    paper.setup('coloring-area');

    // Add grid SVG
    project.importSVG('../images/grid-1.svg', function(item) {
      fitToContainer(item);
      grid = item;
      console.log('SVG:', item);
      if (item.hasChildren() && item.children.gridareas) {
        colourAreas = item.children.gridareas.children;
        _.forEach(colourAreas, function(shapeArea) {
          if (shapeArea === undefined) {
            return;
          }
          shapeArea.strokeScaling = false;
          shapeArea.onMouseEnter = enterArea;
          shapeArea.onMouseLeave = leaveArea;
          shapeArea.onClick = clickArea;
        });
      }
    });
    view.draw();

    // Setup viewport events
    viewportEvents();
  }

  function clickArea(e) {
    if (selectedItem) { // Clear previously selected
      selectedItem.selected = false;
    }
    selectedItem = e.target; // Cache selected
    selectedItem.selected = true;
  }

  function enterArea(e) {
    e.target.opacity = 0.5;
  }

  function leaveArea(e) {
    e.target.opacity = 1;
  }

  function fitToContainer(item) {
    var width = item.bounds.x + item.bounds.width,
        height = item.bounds.y + item.bounds.height,
        scale = getContainerW() / width,
        newPosX = getContainerW() / 2,
        newPosY = height * scale / 2;

    item.scale(scale);
    item.position = [newPosX, newPosY];
    console.log('size', width, scale);
  }

  function viewportEvents() {
    setViewport();
    window.onresize = function(e) {
      setViewport();
      fitToContainer(grid);
    };
  }

  function setViewport() {
    var width = getContainerW(),
        height = getContainerH(),
        size = new Size(width, height);

    console.log(width, height);

    // Update paper size
    view.viewSize = size;
  }

  function getContainerW() {
    var computedStyle = getComputedStyle(containerEl),
        containerWidth = containerEl.clientWidth;

    containerWidth -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    containerWidth -= parseFloat(computedStyle.marginLeft) + parseFloat(computedStyle.marginRight);
    return containerWidth;
  }

  function getContainerH() {
    var computedStyle = getComputedStyle(containerEl),
      containerHeight = containerEl.clientHeight;

    containerHeight -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    containerHeight -= parseFloat(computedStyle.marginTop) + parseFloat(computedStyle.marginBottom);
    return containerHeight;
  }

  function getViewportW() {
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  }

  function getViewportH() {
    return window.innerHeight || document.documentElement.clientHeight || document.body.clientWidth;
  }

  return {
    init: function() {
      init();
    },
    deinit: function() {
    }
  }
})(jQuery);