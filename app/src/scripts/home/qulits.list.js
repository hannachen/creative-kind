'use strict';
var quiltsList = (function($) {

  var $document = $(document),
      $donationModal = $('#donation-modal').modal('hide'),
      $confirmationModal = $('#confirmation-modal').modal('hide'),
      $confirmationButton = $confirmationModal.find('.btn-primary'),
      $alertModal = $('#alert-modal').modal('hide'),
      $patchPreview = $('#patch-preview'),
      $quilts = $('.quilt-list .quilt'),
      $quiltNavContainer = $('#quilt-nav-container'),
      $quiltNames = $quiltNavContainer.find('.quilt'),
      $quiltNav = $quiltNavContainer.find('.quilt-nav'),
      $activeQuilt = $quilts.filter('.active').length > 0 ? $quilts.filter('.active') : $quilts.first(),
      breakpoint = utils.breakpoint(window.mobileMq),
      userData = document.getElementById('user-data'),
      clickedPatch,
      padding = breakpoint === 'mobile' ? 12 : 32,
      quiltGroup,
      dragThreshold = 20, // Threshold in %
      dragStartMousePos,
      dragStartQuiltPos,
      dragDirection,
      currentQuiltIndex = 0,
      initialPosition = new Point(0, 0);

  var containerEl = document.getElementById('canvas-container'),
      grid,
      quilts = [],
      user = {};

  function init() {

    if ($('#grid-area').length) {
      initVariables();
      setupCanvas();
      initEvents();
    }
    $activeQuilt.addClass('active');
  }

  function initVariables() {

    if (userData) {
      var userDataString = userData.innerHTML.trim();
      if (!_.isEmpty(userDataString)) {
        user = JSON.parse(userDataString);
      }
    }
  }

  function initEvents() {
    $donationModal.on('hidden.bs.modal', function() {
      $confirmationModal.modal('show');
    });

    $confirmationModal.on('hide.bs.modal', function () {
      $confirmationButton.attr('href', '');
    });

    $document.on('scroll.canvas', scrollCanvas);

    $document.on('click-patch', function(e) {
      var patchData = e.patch,
        targetUrl = '/patch/edit/' + patchData.uid;

      if (!_.isEmpty(user)) {
        if (patchData.status === 'mine') {
          window.location.href = targetUrl;
        } else if (patchData.status === 'new') {
          if (myPatch.length) {
            $alertModal.modal('show');
          } else {
            $confirmationButton.attr('href', targetUrl);
            $donationModal.modal('show');
          }
        }
      } else {
        window.location.href = '/account/login/?cb=' + targetUrl;
      }
    });
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
        offset = padding * i,
        newPosX = grid.bounds.width * i + grid.bounds.width / 2 + offset * 2 + padding,
        newPos = new Point(newPosX, grid.bounds.height / 2 + padding);

    targetSvg.position = newPos;
    var patchModule = new Quilt(targetSvg, patchData);

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

        let myPatch = '';
        if (patch.status === 'mine') {
          myPatch = patchData[i-indexOffset].uid;
        }

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
              patchSvg.on(getPatchEvents());
              patch.visible = false;
            });
            break;
          case 'new':
          default:
            if (myPatch.length) {
              patch.off(getPatchEvents());
            } else {
              plus.visible = true;
            }
            break;
        }
      });
    }
  }

  function onNavClick(e) {
    e.preventDefault();
    var $target = $(e.currentTarget),
        direction = $target.data('value');
    if (direction === 'next') {
      goToNextIndex();
    } else {
      goToPrevIndex();
    }
    setActiveName(currentQuiltIndex);
  }

  function setActiveName(index) {
    var currentQuiltIndex = index || 0;
    $quiltNames.removeClass('active');
    var setActive = $quiltNames.filter(':eq('+currentQuiltIndex+')');
    setActive.addClass('active');
    setButtonState();
  }

  function setButtonState() {
    $quiltNav.prop('disabled', false);
    $quiltNav.each(function(i, v) {
      var $el = $(v),
          direction = $el.data('value');
      if (direction === 'prev' && currentQuiltIndex === 0 ||
        direction === 'next' && currentQuiltIndex === quilts.length - 1) {
        $el.prop('disabled', true);
      }
    });
  }

  /**
   * Attach drag event to navigate between quilts if there are more than one.
   */
  function initQuiltListEvents() {
    if (quilts.length > 1) {
      // Record starting position on mouse down
      view.onMouseDown = function(e) {
        dragStartMousePos = e.point;
        dragStartQuiltPos = quilts[0].position;
      };
      // Reset starting position on mouse up
      view.onMouseUp = function() {
        var dragDistance = quilts[0].position.x - dragStartQuiltPos.x,
          dragThresholdValue = (quilts[0].bounds.width / 100) * dragThreshold,
          scroll = false;
        if (dragDistance < 0) {
          dragDirection = 'left';
        } else {
          dragDirection = 'right';
        }
        if (Math.abs(dragDistance) > dragThresholdValue) {
          if (dragDirection === 'left') {
            if (currentQuiltIndex + 1 >= quilts.length) {
              currentQuiltIndex = quilts.length - 1;
            } else {
              currentQuiltIndex++;
              scroll = true;
            }
          } else {
            if (currentQuiltIndex - 1 < 0) {
              currentQuiltIndex = 0;
            } else {
              currentQuiltIndex--;
              scroll = true;
            }
          }
        }
        scrollToIndex(currentQuiltIndex);
        if (scroll) {
          $document.trigger({
            type: 'scroll.canvas',
            direction: dragDirection,
            index: currentQuiltIndex
          });
        }
        dragStartMousePos = null;
        dragStartQuiltPos = null;
      };
      view.onMouseDrag = function(e) {
        quiltGroup.position.x += e.delta.x;
      };
    }
  }

  function onSvgLoaded(svg) {
    fitToContainer(svg);
    grid = svg;
    quilts.push(svg);
    $quilts.each(setupQuilt);
    quiltGroup = new Group(quilts);
    quiltGroup.pivot = initialPosition;
    quiltGroup.clipped = false;

    $quiltNav.on('click', onNavClick);

    setButtonState();
    initQuiltListEvents();
  }

  function goToNextIndex() {
    currentQuiltIndex++;
    jumpToIndex(currentQuiltIndex, true);
  }

  function goToPrevIndex() {
    currentQuiltIndex--;
    jumpToIndex(currentQuiltIndex, true);
  }

  function scrollToIndex(targetIndex) {
    jumpToIndex(targetIndex, true);
  }

  function scrollCanvas(e) {
    setActiveName(e.index);
  }

  function jumpToIndex(index, scroll) {
    var width = getContainerW(),
        targetIndex = index || 0,
        targetWidth = width * quilts.length,
        targetPos = -Math.abs(width * targetIndex),
        scale = targetWidth / quiltGroup.bounds.width;

    quiltGroup.scale = scale;
    quiltGroup.pivot = new Point(quiltGroup.bounds.x - padding, quiltGroup.bounds.y);

    if (scroll) {
      TweenMax.to(quiltGroup.position, 0.5, {x: targetPos, ease: Expo.easeInOut});
    } else {
      quiltGroup.position.x = targetPos;
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
    console.log(e);
    clickedPatch = e.target.data;
    if (clickedPatch.status === 'complete') {
      console.log(clickedPatch);
      showPatch(clickedPatch.uid);
    } else {

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
      } else {
        var targetUrl = '/account/login/?cb=' + targetUrl;
        window.location.href = targetUrl;
      }
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

  function fitToContainer(item, i) {
    let width = item.bounds.width,
        index = i || 0,
        newWidth = getContainerW() - padding * 2,
        offset = padding * index,
        scale = newWidth / width,
        newPosX = newWidth * index + newWidth / 2 + offset * 2 + padding;

    console.log(offset);
    item.scale(scale);
    item.position = [newPosX, item.bounds.height / 2 + padding];
    // Last quilt item
    if (i === quilts.length - 1) {
      jumpToIndex(currentQuiltIndex);
    }
  }

  function onFrame(event) {
    // Your animation code goes in here
  }

  function viewportEvents() {
    setViewport();
    window.addEventListener('resize', _.debounce(onResize, 250));
  }

  function onResize(e) {
    e.preventDefault();
    setViewport();
    _.forEach(quilts, function(quilt, i) {
      fitToContainer(quilt, i);
    });
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
