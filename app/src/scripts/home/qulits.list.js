'use strict';
var quiltsList = (function($) {

  var $donationModal = $('#donation-modal').modal('hide'),
      $confirmationModal = $('#confirmation-modal').modal('hide'),
      $confirmationButton = $confirmationModal.find('.btn-primary'),
      $alertModal = $('#alert-modal').modal('hide'),
      $patchPreview = $('#patch-preview'),
      $quilts = $('.quilt-list .quilt'),
      $activeQuilt = $quilts.filter('.active').length > 0 ? $quilts.filter('.active') : $quilts.first(),
      clickedPatch;

  $donationModal.on('hidden.bs.modal', function() {
    $confirmationModal.modal('show');
  });

  $confirmationModal.on('hide.bs.modal', function () {
    $confirmationButton.attr('href', '');
  });

  var containerEl = document.getElementById('canvas-container'),
      grid,
      quilts = [],
      user = {};

  function init() {

    if ($('#grid-area').length) {
      setupCanvas();
    }
  }

  function setupCanvas() {
    // Setup directly from canvas id:
    paper.setup('grid-area');

    // Add grid SVG
    project.importSVG('/img/quilt-grid.svg', {
      expandShapes: false,
      onLoad: onSvgLoaded
    });
    view.draw();

    // Setup viewport events
    viewportEvents();
  }

  function setupQuilt(i, v) {
    var $target = $(v),
        targetSvg = $target.is($activeQuilt) ? grid : grid.clone(),
        patchDataString = $target.find('.patch-data').text(),
        patchData = patchDataString ? JSON.parse(patchDataString) : [],
        newPos = new Point(grid.bounds.width * i, 0);

    targetSvg.pivot = new Point(0, 0);
    targetSvg.position = newPos;
    populateQuilt(targetSvg, patchData);

    if (!$target.is($activeQuilt)) {
      quilts.push(targetSvg);
    }
  }

  function populateQuilt(targetSvg, patchData) {
    if (targetSvg.hasChildren()) {
      let patches = targetSvg.children,
          indexOffset = 0;
      _.forEach(patches, function(group, i) {
        if (group === undefined || group.hasChildren() === undefined || !patchData[i-indexOffset]) {
          indexOffset++;
          return;
        }
        let patch, plus, circle;
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
        patch.data.uid = patchData[i-indexOffset].uid;
        patch.data.status = patchData[i-indexOffset].status;

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
            project.importSVG('/patch/svg/'+patch.data.uid, function(patchSvg) {
              patchSvg.rotate(-45);
              patchSvg.fitBounds(patch.bounds);
              patchSvg.data = patch.data;
              group.addChild(patchSvg);
              patch.off(getPatchEvents());
              patch.visible = false;
            });
            break;
          case 'new':
          default:
            patch.off(getPatchEvents());
            plus.visible = !_.isEmpty(user);
            break;
        }
      });
    }
  }

  function onSvgLoaded(svg) {
    grid = svg;
    fitToContainer(svg);
    quilts.push(svg);
    $quilts.each(setupQuilt);

    // Attach drag event to navigate between quilts
    view.onMouseDrag = function(e) {
      _.forEach(quilts, function(quilt) {
        quilt.position.x += e.delta.x;
      });
    };
  }

  /**
   * Find out the type of a paper item.
   *
   * @param {paper.Item} item
   * @returns {string}
   */
  function getItemType(item) {
    var itemType = '';
    // console.log(item.className);
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
  }

  function enterArea(e) {
    e.target.opacity = 0.8;
  }

  function leaveArea(e) {
    e.target.opacity = 1;
  }

  function htmlEncode(value) {
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
  }

  function htmlDecode(value) {
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
    },
    disable: function() {
      disable();
    }
  }
})(jQuery);