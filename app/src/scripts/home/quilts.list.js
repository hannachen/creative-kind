var quiltsList = (function($) {

  var options = {
    showDonationModal: false
  }

  var $document = $(document),
      $loginModal = $('#login-modal').modal(),
      $donationModal = $('#donation-modal').modal(),
      $confirmationModal = $('#confirmation-modal').modal(),
      $alertModal = $('#alert-modal').modal(),
      $quilts = $('.quilt-list .quilt'),
      $quiltNavContainer = $('#quilt-nav-container'),
      $quiltNames = $quiltNavContainer.find('.quilt'),
      $quiltNav = $quiltNavContainer.find('.quilt-nav'),
      $activeQuilt = $quilts.filter('.active').length > 0 ? $quilts.filter('.active') : $quilts.first(),
      $quiltThumbnailContainer = $('#quilt-thumbnails-container'),
      $quiltThumbnailSlide = $quiltThumbnailContainer.find('#quilt-thumbnails'),
      $quiltThumbnails = $quiltThumbnailSlide.children(),
      $quiltLinks = $quiltThumbnails.filter(':not(.new)'),
      breakpoint = utils.breakpoint(window.mobileMq),
      padding = breakpoint === 'mobile' ? 12 : 32,
      userData,
      quiltGroup,
      dragThreshold = 20, // Threshold in %
      dragStartMousePos,
      dragStartQuiltPos,
      dragDirection,
      dragging,
      currentQuiltIndex = 0,
      initialPosition = [0, 0];

  var containerEl = document.getElementById('canvas-container'),
      grid,
      myPatch = '',
      quilts = [],
      user = {};

  function init() {

    if ($('#grid-area').length) {
      initVariables()
      initEvents()
      setupCanvas()
      resizeThumbnails()
    }
    $activeQuilt.addClass('active');
  }

  function initVariables() {

    userData = document.getElementById('user-data');
    if (userData) {
      var userDataString = userData.innerHTML.trim();
      if (!_.isEmpty(userDataString)) {
        try {
          user = JSON.parse(userDataString);
        } catch(e) {
          user = userDataString;
        }
      }
    }
  }

  function resizeThumbnails() {
    var thumbnailWidth = $quiltThumbnailContainer.width()/4,
        offset = 15;
    $quiltThumbnails.width(thumbnailWidth);
    $quiltThumbnailSlide.width(thumbnailWidth * $quiltThumbnails.length + offset);
    console.log('Thumbnails', $quiltThumbnails.length);
    console.log('Thumbnail Width', thumbnailWidth);
  }

  function initEvents() {
    $quiltLinks.find('a').on('click', onThumbClick);
    $document.on('scroll.canvas', onScrollCanvas);
    $document.on('click-patch', onPatchClick);
  }

  function onPatchClick(e) {
    if (dragging) {
      return false;
    }
    var patchData = e.patch,
        targetUrl = '/quilts/view/' + patchData.quilt + '/' + patchData.uid;

    if (_.isEmpty(user)) {
      if (patchData.status === 'new') {
        view.emit('onMouseUp');
        // Add cb to buttons
        $loginModal.find('.signin-link').attr('href', '/account/login/?cb=' + targetUrl);
        $loginModal.find('.signup-link').attr('href', '/account/signup/?cb=' + targetUrl);
        $loginModal.modal('show');
      }
    } else {
      if (patchData.status === 'mine') {
        targetUrl = '/patch/edit/' + patchData.uid;
        window.location.href = targetUrl;
      } else if (patchData.status === 'new') {
        if (myPatch.length) {
          $alertModal.modal('show');
        } else {
          // $confirmationButton.attr('href', targetUrl);
          targetUrl = '/patch/start/' + patchData.uid;
          $confirmationModal.modal('show');

          // Show modal based on feature toggle
          if (options.showDonationModal) {
            $donationModal.find('.btn-secondary').on('click', function() {
              window.location.href = targetUrl;
            });
          } else {
            // Go straight to patch if donation toggle is turned off
            $confirmationModal.find('.btn-primary').off('click').on('click', function() {
              window.location.href = targetUrl;
            })
          }
        }
        view.emit('onMouseUp');
      }
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
        quiltId = $target.data('quilt-id'),
        patchDataString = $target.find('.patch-data').text(),
        patchData = patchDataString ? JSON.parse(patchDataString) : [],
        offset = padding * i,
        newPosX = grid.bounds.width * i + grid.bounds.width / 2 + offset * 2 + padding,
        newPos = new Point(newPosX, grid.bounds.height / 2 + padding);

    console.log(quiltId);

    targetSvg.position = newPos;
    var patchModule = new Quilt(targetSvg, quiltId, patchData);

    if (!$target.is($activeQuilt)) {
      quilts.push(targetSvg);
    }
  }

  function onThumbClick(e) {
    e.preventDefault();
    var index = e.currentTarget.getAttribute('data-index');
    jumpToIndex(index);
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
  }

  function setActiveName(index) {
    var currentQuiltIndex = index || 0;
    $quiltNames.removeClass('active');
    $quiltNames.filter(':eq('+currentQuiltIndex+')').addClass('active');
    setButtonState();
  }

  function setActiveThumbnail(index) {
    var currentQuiltIndex = index || 0;
    $quiltThumbnails.removeClass('active');
    $quiltLinks.filter(':eq('+currentQuiltIndex+')').addClass('active');
    scrollToThumbnail(index);
  }

  function scrollToThumbnail(index) {
    var $targetThumbnail = $quiltThumbnails.find('[data-index='+index+']'),
        winCenter = window.innerWidth/2,
        slideWidth = $quiltThumbnailSlide.width(),
        slideOffset = parseInt($quiltThumbnailContainer.css('padding-left').replace('px', '')),
        slideMargin = parseInt($('.contents').css('margin-left').replace('px', '')),
        thumbPos = $targetThumbnail.offset().left - $quiltThumbnailSlide.offset().left + slideOffset + slideMargin,
        endPos = slideWidth - winCenter,
        targetPos = thumbPos - winCenter + $targetThumbnail.width()/2,
        targetPos = targetPos > 0 ? targetPos : 0,
        targetPos = targetPos > endPos ? endPos : targetPos;
    TweenLite.to($quiltThumbnailContainer.get(0), 0.5, {scrollTo: {x: targetPos}, ease: Expo.easeInOut});
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
        dragging = true;
        dragStartMousePos = e.point;
        dragStartQuiltPos = quilts[0].position;
      };
      // Reset starting position on mouse up
      view.onMouseUp = function(e) {
        dragging = false;
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
              if (!_.isEmpty(user)) {
                window.location.href = '/quilts/create';
              }
            } else {
              currentQuiltIndex--;
              scroll = true;
            }
          }
        }
        scrollToIndex(currentQuiltIndex); // Bounce back to current quilt
        if (dragStartMousePos.x != e.point.x || dragStartMousePos.y != e.point.y) {
          return false; // Prevent event from bubbling up
        }
        if (scroll) {
          $document.trigger({
            type: 'scroll.canvas',
            direction: dragDirection,
            index: currentQuiltIndex
          });
          return false; // Prevent event from bubbling up
        }
        dragStartMousePos = null;
        dragStartQuiltPos = null;
      };
      view.onMouseDrag = function(e) {
        window.requestAnimationFrame(function() {
          quiltGroup.position.x += e.delta.x;
        });
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
    // initQuiltListEvents();
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

  // Hook for canvas carousel scroll event
  function onScrollCanvas(e) {
  }

  function jumpToIndex(index, scroll) {
    var width = getContainerW(),
        targetIndex = index || 0,
        targetWidth = width * quilts.length,
        targetPos = -Math.abs(width * targetIndex),
        scale = targetWidth / quiltGroup.bounds.width;

    quiltGroup.scale = scale;
    quiltGroup.pivot = new Point(quiltGroup.bounds.x - padding, quiltGroup.bounds.y);

    setActiveName(index);
    setActiveThumbnail(index);

    if (scroll) {
      TweenLite.to(quiltGroup.position, 0.5, {x: targetPos, ease: Expo.easeInOut});
    } else {
      quiltGroup.position.x = targetPos;
    }
    currentQuiltIndex = index;
  }

  function fitToContainer(item, i) {
    let width = item.bounds.width,
        index = i || 0,
        newWidth = getContainerW() - padding * 2,
        offset = padding * index,
        scale = newWidth / width,
        newPosX = newWidth * index + newWidth / 2 + offset * 2 + padding;

    item.scale(scale);
    item.position = [newPosX, item.bounds.height / 2 + padding];
    // Last quilt item
    if (i === quilts.length - 1) {
      jumpToIndex(currentQuiltIndex);
    }
  }

  function viewportEvents() {
    setViewport();
    window.addEventListener('resize', _.debounce(onResize, 250));
  }

  function onResize(e) {
    e.preventDefault();
    setViewport();
    resizeThumbnails();
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
