'use strict';
var quiltCanvas = (function($) {

  var options = {
    showDonationModal: false
  };

  var $loginModal = $('#login-modal').modal('hide'),
      $donationModal = $('#donation-modal').modal('hide'),
      $confirmationModal = $('#confirmation-modal').modal('hide'),
      $loginInviteModal = $('#login-invite-modal').modal('hide'),
      $alertModal = $('#alert-modal').modal('hide'),
      $quiltArea = $('#grid-area');

  var containerEl, quiltData, userData, quiltId, newPatch, grid, patchStatus,
      myPatch = '',
      user = {};

  function init() {
    if ($quiltArea.length) {
      initVariables();
      setupCanvas();
      initEvents();
    }
  }

  function initVariables() {
    // Dom selects
    containerEl = document.getElementById('canvas-container');
    quiltData = document.getElementById('quilt-data');
    userData = document.getElementById('user-data');
    quiltId = containerEl.getAttribute('data-quilt-id') || '';
    newPatch = quiltData.getAttribute('data-new-patch') || '';

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
        console.log(userDataString);
        try {
          user = JSON.parse(userDataString);
        } catch(e) {
          user = userDataString;
        }
      }
    }
  }

  function initEvents() {
    $(document).on('click-patch', function(e) {
      var patchData = e.patch,
          targetUrl = '/quilts/view/' + quiltId + '/' + patchData.uid;

      if (_.isEmpty(user)) {
        if (patchData.status === 'new') {
          $loginModal.find('.signin-link').attr('href', '/account/login/?cb=' + targetUrl);
          $loginModal.find('.signup-link').attr('href', '/account/signup/?cb=' + targetUrl);
          $loginModal.modal('show');
        }
      } else {
        targetUrl = '/patch/edit/' + patchData.uid;
        if (patchData.status === 'mine') {
          window.location.href = targetUrl;
        } else if (patchData.status === 'new') {
          if (myPatch.length) {
            $alertModal.modal('show');
          } else {
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
        }
      }
    });

    // Login prompt for invited users
    if (_.isEmpty(user)) {
      $loginInviteModal.modal('show');
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

  function onSvgLoaded(svg) {
    fitToContainer(svg);
    grid = svg;

    var quiltModule = new Quilt(svg, quiltId, patchStatus);

    console.log('NEW PATCH', newPatch);
    if (newPatch && newPatch.length) {
      var patchData = {
        uid: newPatch,
        status: 'new'
      };
      console.log('HELLO', newPatch);
      quiltModule.emitClickEvent(patchData);
    }
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
