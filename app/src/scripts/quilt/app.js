'use strict';
var app = (function($) {

  var newPatches = document.getElementsByClassName('status-new'),
      myPatches = document.getElementsByClassName('status-mine'),
      $donationModal = $('#donation-modal').modal('hide'),
      $confirmationModal = $('#confirmation-modal').modal('hide'),
      $alertModal = $('#alert-modal').modal('hide');

  $donationModal.on('hidden.bs.modal', function() {
    $confirmationModal.modal('show');
  });

  _.forEach(newPatches, function(patch) {
    patch.onclick = function(e) {
      console.log(e);
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
      saveData = document.getElementById('saveData'),
      patchData = [],
      selectedItems = [],
      grid,
      linesGroup,
      colourAreas = [],
      multipleSelection = true, // initial state for multiple selection
      $colorPalette,
      $lineToggleButton;

  function init() {

    // Setup directly from canvas id:
    paper.setup('coloring-area');

    var saveDataString = saveData.innerHTML;

    if (saveDataString) {
      patchData = saveDataString.split(',');
      // _.each(patchData, function(color) {
      //
      // });
      // console.log(patchData);
      // console.log(saveDataString);
      // patchSvg = doc.getElementById('gridareas');
    }

    // Add grid SVG
    project.importSVG('/img/grid-1.svg', function(item) {
      grid = item;
      fitToContainer(item);
      if (item.hasChildren() && item.children.gridareas) {
        colourAreas = item.children.gridareas.children;
        var i = 0;
        _.forEach(colourAreas, function(shapeArea) {
          if (shapeArea === undefined) {
            return;
          }
          shapeArea.strokeScaling = false;
          if (!Modernizr.touch) {
            shapeArea.onMouseEnter = enterArea;
            shapeArea.onMouseLeave = leaveArea;
          }
          shapeArea.onClick = clickArea;
          shapeArea.selectedColor = multipleSelection ? '#00ecde' : '#009dec';
          shapeArea.fillColor = patchData[i];
          console.log(patchData[i]);
          i++;
        });
      }
      if (item.hasChildren() && item.children.lines) {
        linesGroup = item.children.lines;
      }
    });
    view.draw();

    // Setup viewport events
    viewportEvents();

    // Setup drawing tools
    initToolbars();

    // Setup form handler
    initFormActions();
  }

  function initToolbars() {

    // Toolbar selection
    var $toolbar = $('.toolbar'),
        $toggleMultiple = $toolbar.find('.select-multiple');

    // Select multiple toggle
    //$toggleMultiple.bootstrapSwitch({
    //  state: multipleSelection,
    //  onSwitchChange: function(e, state) {
    //    if (state) {
    //      multipleSelection = true;
    //      changeSelectionColor('#00ecde');
    //    } else {
    //      multipleSelection = false;
    //      changeSelectionColor('#009dec');
    //    }
    //  }
    //});

    // Reset Tool
    $toolbar.find('[data-tool="clear"]').on('touchstart click', function() {
      clearSelected();
    });

    // Colour palette
    $colorPalette = $('.color-palette .color-button');
    $colorPalette.on('touchstart click', function(e) {
      if (selectedItems.length) {
        _.forEach(selectedItems, function(selectedItem) {
          selectedItem.fillColor = e.currentTarget.getAttribute('data-color');
        });
        view.draw();
      }
    });

    // Line toggle button
    $lineToggleButton = $('.line-toggle');
    $lineToggleButton.on('click', function() {
      if (linesGroup) {
        linesGroup.visible = linesGroup.visible ? false : true;
        view.draw();
      }
    });
  }

  function initFormActions() {
    console.log('starting form action listeners....');
    var $actionsForm = $('#formActions'),
        $saveButton = $actionsForm.find('input[name="saveAction"]');
    $actionsForm.on('submit', function(e) {
      e.preventDefault();
    });
    $saveButton.on('click', function(e) {
      console.log('SAVING...', e);
      var form = e.currentTarget.getAttribute('data-target'),
          $form = $(form),
          svgString = paper.project.exportSVG({asString:true}),
          parser = new DOMParser(),
          doc = parser.parseFromString(svgString, 'image/svg+xml'),
          $svg = $(doc).find('#gridareas'),
          $gridItem = $svg.find('path'),
          data = [];

      $gridItem.each(function(i, v) {
        data.push(v.getAttribute('fill'));
      });
      $.post($form.attr('action'), {
        patchData: {
          colours: data
        }
      }, function() {
        location.reload();
      });
    });
  }

  function changeSelectionColor(newColor) {
    _.forEach(colourAreas, function(colourArea) {
      colourArea.selectedColor = new Color(newColor);
    });
    view.draw();
  }

  function clickArea(e) {
    var selectItem = true;
    if (multipleSelection) {
      if (_.includes(selectedItems, e.target)) {
        selectItem = false;
        e.target.selected = false;
        _.remove(selectedItems, e.target);
      }
    } else {
      clearSelected();
    }
    if (selectItem) {
      selectTarget(e.target);
    }
  }

  function enterArea(e) {
    e.target.opacity = 0.8;
  }

  function leaveArea(e) {
    e.target.opacity = 1;
  }

  /**
   * Remove selection indicator for all selected areas.
   */
  function clearSelected() {
    _.forEach(selectedItems, function(selected) {
      selected.selected = false;
    });
    view.draw();
    selectedItems = [];
  }

  /**
   * Select the current target.
   */
  function selectTarget(target) {
    selectedItems.push(target);
    target.selected = true;
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