'use strict';
var quilt = (function($) {

  var newPatches = document.getElementsByClassName('status-new'),
      myPatches = document.getElementsByClassName('status-mine'),
      $donationModal = $('#donation-modal').modal('hide'),
      $confirmationModal = $('#confirmation-modal').modal('hide'),
      $alertModal = $('#alert-modal').modal('hide'),
      clickedPatch;

  $donationModal.on('hidden.bs.modal', function() {
    $confirmationModal.modal('show');
  });

  _.forEach(newPatches, function(patch) {
    patch.onclick = function(e) {
      e.preventDefault();
      if (myPatches.length) {
        $alertModal.modal('show');
      } else {
        $donationModal.modal('show');
      }
      return false;
    };
  });

  var containerEl = document.getElementById('canvas-container'),
      quiltData = document.getElementById('quilt-data'),
      patchData = [],
      grid,
      startGroup = [],
      takenGroup = [],
      patchStatus;

  function init() {

    // Setup directly from canvas id:
    paper.setup('grid-area');

    if (quiltData) {
      var quiltDataString = quiltData.innerHTML;
    }
    if (quiltDataString) {
      patchStatus = JSON.parse(quiltDataString);
    }

    // Handle layers
    var initialLayer = project.activeLayer;

    // Add grid SVG
    project.importSVG('/img/quilt-grid.svg', function(svg) {
      grid = svg;
      fitToContainer(svg);
      if (svg.hasChildren() && svg.children.patches) {
        if (svg.hasChildren() && svg.children.start) {
          startGroup = svg.children.start.children;
          // console.log(svg.children.start);
          // var startLayer = moveToNewLayer(svg.children.start, 'start');
          // startGroup = startLayer.children;
          // project.layers.push(startLayer);
        }
        if (svg.hasChildren() && svg.children.taken) {
          takenGroup = svg.children.taken.children;
          // var takenLayer = moveToNewLayer(svg.children.taken, 'taken');
          // takenGroup = takenLayer.children;
          // project.layers.push(takenLayer);
        }
        // initialLayer.activate();
        var patches = svg.children,
            i = 0;
        console.log(patches.length);
        // for(var j=0;j<patches.length;j++) {
        //   console.log(patches[j]);
        // }
        _.forEach(patches, function(patch) {
          if (patch === undefined) {
            return;
          }

          var patchGroup = new paper.Group();
          patch.strokeScaling = false;
          patch.fillColor = '#ffffff';
          patch.data.uid = patchStatus[i].uid;
          patch.data.status = patchStatus[i].status;
          patch.copyTo(patchGroup);

          switch (patch.data.status) {
            case 'progress':
              startGroup[i].visible = false;
              takenGroup[i].visible = true;
              break;
            case 'mine':
              patch.fillColor = '#aab0ff';
              break;
            case 'complete':
              patch.fillColor = '#ffcccc';
              break;
            case 'new':
            default:
              startGroup[i].visible = true;
              takenGroup[i].visible = false;
              break;
          }
          startGroup[i].copyTo(patchGroup);
          takenGroup[i].copyTo(patchGroup);
          patchGroup.on(getPatchEvents);
          patchGroup.copyTo(initialLayer);
          console.log(patchGroup);

          i++;

          if (i === patches.length - 1) {
            svg.children.start.remove();
            svg.children.taken.remove();
            console.log(patches.length);
            console.log(i);
          }
        });
      }
    });
    view.draw();

    // Setup viewport events
    viewportEvents();
  }

  /**
   * Move elements into a layer within the project
   * @param element
   * @param {string} newLayerName
   * @returns {paper.Layer} layer
   */
  function moveToNewLayer(element, newLayerName) {
    var layer = new paper.Layer();
    layer.activate();
    _.forEach(element.children, function(shape) {
      shape.copyTo(layer);
    });
    layer.name = newLayerName || '';
    layer.locked = true;
    element.removeChildren();
    return layer;
  }

  function getPatchEvents() {
    var events = {};
    events.click = clickPatch;
    if (!Modernizr.touch) {
      events.mouseenter = enterArea;
      events.mouseleave = leaveArea;
    }
    return events;
  }

  function clickPatch(e) {
    clickedPatch = e.target.data;
    if (myPatches.length) {
      $alertModal.modal('show');
    } else {
      $donationModal.modal('show');
    }
  }

  function enterArea(e) {
    e.target.opacity = 0.8;
  }

  function leaveArea(e) {
    e.target.opacity = 1;
  }

  function htmlEncode(value){
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
  }

  function htmlDecode(value){
    return $('<div/>').html(value).text();
  }

  function fitToContainer(item) {
    var width = item.bounds.x + item.bounds.width,
        height = item.bounds.y + item.bounds.height,
        scale = getContainerW() / width,
        newPosX = getContainerW() / 2,
        newPosY = height * scale / 2;

    item.scale(scale);
    item.position = [newPosX, newPosY];
    view.draw();
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

    // Update paper size
    view.viewSize = size;
  }

  /**
   * Get container width in box sizing mode.
   *
   * @returns {number}
   */
  function getContainerW() {
    var computedStyle = getComputedStyle(containerEl),
        containerWidth = containerEl.clientWidth;

    containerWidth -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    containerWidth -= parseFloat(computedStyle.marginLeft) + parseFloat(computedStyle.marginRight);
    return containerWidth;
  }

  /**
   * Get container height in box sizing mode.
   *
   * @returns {number}
   */
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