'use strict';
var quilt = (function($) {

  var $donationModal = $('#donation-modal').modal('hide'),
      $confirmationModal = $('#confirmation-modal').modal('hide'),
      $confirmationButton = $confirmationModal.find('.btn-primary'),
      $alertModal = $('#alert-modal').modal('hide'),
      $patchPreview = $('#patch-preview'),
      clickedPatch;

  $donationModal.on('hidden.bs.modal', function() {
    $confirmationModal.modal('show');
  });

  $confirmationModal.on('hide.bs.modal', function () {
    $confirmationButton.attr('href', '');
  });

  var containerEl = document.getElementById('canvas-container'),
      quiltData = document.getElementById('quilt-data'),
      userData = document.getElementById('user-data'),
      grid,
      patchStatus,
      myPatch = '',
      user = {};

  function init() {

    if ($('#grid-area').length) {
      setupCanvas();
    }
  }

  function setupCanvas() {
    // Setup directly from canvas id:
    paper.setup('grid-area');

    if (quiltData) {
      var quiltDataString = quiltData.innerHTML;
    }
    if (quiltDataString) {
      patchStatus = JSON.parse(quiltDataString);
      _.forEach(patchStatus, function(patch) {
        if (patch.status === 'mine') {
          myPatch = patch.uid;
        }
      });
    }
    if (userData) {
      var userDataString = userData.innerHTML.trim();
      if (!_.isEmpty(userDataString)) {
        user = JSON.parse(userDataString);
      }
    }

    // Add grid SVG
    project.importSVG('/img/quilt-grid.svg', {
      expandShapes: false,
      onLoad: onSvgLoaded
    });
    view.draw();

    // Setup viewport events
    viewportEvents();
  }

  function onSvgLoaded(svg) {
    grid = svg;
    fitToContainer(svg);
    if (svg.hasChildren()) {
      let patches = svg.children,
          indexOffset = 0;
      console.log('LENGTH', patches.length);
      _.forEach(patches, function(group, i) {
        if (group === undefined || group.hasChildren() === undefined || !patchStatus[i-indexOffset]) {
          indexOffset++;
          console.log("SKIP", group);
          return;
        }
        console.log('PATCH INDEX', i-indexOffset);
        console.log('PATCH STATUS', patchStatus[i-indexOffset]);
        let patch,
            plus,
            circle;
        if(group.hasChildren()) {
          _.forEach(group.children, function(item) {
            let itemType = getItemType(item);
            switch(itemType) {
              case 'rectangle':
                patch = item;
                break;
              case 'path':
                plus = item;
                break;
              case 'circle':
                circle = item;
                break;
            }
          });
        }

        plus.locked = true;
        plus.visible = false;

        circle.locked = true;
        circle.visible = false;

        patch.strokeScaling = false;
        patch.fillColor = '#ffffff';
        patch.data.uid = patchStatus[i-indexOffset].uid;
        patch.data.status = patchStatus[i-indexOffset].status;

        patch.on(getPatchEvents());
        switch (patch.data.status) {
          case 'progress':
            patch.off(getPatchEvents());
            patch.fillColor = '#cccccc';
            break;
          case 'mine':
            patch.fillColor = '#aab0ff';
            break;
          case 'complete':
            project.importSVG('/patch/svg/'+patch.data.uid, function(svg) {
              svg.rotate(-45);
              svg.fitBounds(patch.bounds);
              svg.on(getPatchEvents());
              svg.data = patch.data;
              group.addChild(svg);
            });
            patch.fillColor = '#ffffff';
            break;
          case 'new':
          default:
            if (myPatch.length) {
              patch.off(getPatchEvents());
            } else {
              plus.visible = !_.isEmpty(user);
            }
            break;
        }

      });
    }
  }

  /**
   * Find out the type of a paper item.
   *
   * @param {paper.Item} item
   * @returns {string}
   */
  function getItemType(item) {
    var itemType = '';
    console.log(item.className);
    switch (item.className) {
      case 'Shape':
        itemType = item.type;
        break;
      case 'Path':
        itemType = item.className.toLowerCase();
        break;
      default:
    }
    return itemType;
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
    var targetUrl = '/patch/edit/' + clickedPatch.uid;
    if (!_.isEmpty(user)) {
      if (clickedPatch.status === 'mine') {
        window.location.href = targetUrl;
      } else if (clickedPatch.status === 'new') {
        if (myPatch.length) {
          $alertModal.modal('show');
        } else {
          $confirmationButton.attr('href', targetUrl);
          $donationModal.modal('show');
        }
      }
    }
    // console.log('clicked', clickedPatch);
    if (clickedPatch.status === 'complete') {
      //window.location.href = '/patch/view/' + clickedPatch.uid;
      showPatch(clickedPatch.uid);
    }
  }

  function showPatch(patchId) {
    console.log(patchId);
    $patchPreview.css('display', 'block');
    var $preview = $('<img src="/patch/svg/'+patchId+'">');
    $preview.on('click', function() {
      $preview.off('click');
      $patchPreview.css('display', 'none');
      $patchPreview.empty();
    });
    $patchPreview.append($preview);
    // var symbol = new Symbol(item);
    // placed = symbol.place(item.center);
    // placed.rotate(45);
    // placed.fitBounds(grid.bounds);
    // console.log(patchId);
    // $.get('/patch/json/'+patchId, function(e) {
    //   console.log(e);
    // });
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
    let width = item.bounds.x + item.bounds.width,
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
    window.onresize = function() {
      setViewport();
      fitToContainer(grid);
    };
  }

  function setViewport() {
    let width = getContainerW(),
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
    let computedStyle = getComputedStyle(containerEl),
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
    let computedStyle = getComputedStyle(containerEl),
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
