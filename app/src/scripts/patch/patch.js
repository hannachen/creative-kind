'use strict';
var patch = (function($) {

  var containerEl = document.getElementById('canvas-container'),
      canvasArea = document.getElementById('coloring-area'),
      colorIndexData = [],
      selectedItems = [],
      colorSet = [],
      selectedSet = document.getElementById('selectedSet'),
      grid,
      linesGroup,
      selectedAlpha = 0.8,
      colourAreas = [],
      multipleSelection = true, // initial state for multiple selection
      $paletteSelectons = $('.color-sets .selection'),
      $colorPalette = $('.color-palette'),
      $saveData = $('#saveData'),
      $colorButtons = $colorPalette.find('.color-button'),
      $applyColorButton = $('#apply-color'),
      $startPatchForm;

  function setupCanvas() {

    // Setup directly from canvas id:
    paper.setup('coloring-area');

    // Read save data
    var colorIndexDataString = $saveData.find('.color-index-data').text().trim();
    if (colorIndexDataString) {
      colorIndexData = colorIndexDataString.split(',');
    }
    console.log('data string', colorIndexDataString);

    // Add grid SVG
    project.importSVG('/img/grid-1.svg', {
      expandShapes: false,
      onLoad: onSvgLoaded
    });
    view.draw();

    // Setup viewport events
    viewportEvents();

    // Setup drawing tools
    initToolbars();

    // Setup form handler
    initFormActions();
  }

  function onSvgLoaded(item) {
    grid = item;
    fitToContainer(item);
    if (item.hasChildren() && item.children.gridareas) {
      console.log(item.firstChild);
      item.firstChild.remove(); // Remove document root element of svg, prevents an undefined item error when saving
      console.log('item svg', item.children);
      colourAreas = item.children.gridareas.children;

      // Get color map from colour set
      _.forEach(colourAreas, function(shapeArea, i) {
        shapeArea.data.colorIndex = colorIndexData[i]; // colorIndexData[i];
        attachShapeEvents(shapeArea);
      });
    }
    if (item.hasChildren() && item.children.lines) {
      linesGroup = item.children.lines;
    }

    // Initialize colour palette ONLY after the canvas is set up
    initColorPalette();

    // Init colour set selector
    colors.init();
  }

  function init() {

    initVariables();

    if (canvasArea) {
      setupCanvas();
    }
    if ($('.start-patch-form').length) {
      console.log('start patch');
      $('.carousel').slick();
    }
  }

  function attachShapeEvents(shape) {
    shape.strokeScaling = false;
    if (!Modernizr.touch) {
      shape.onMouseEnter = enterArea;
      shape.onMouseLeave = leaveArea;
    }
    shape.onClick = clickArea;
    shape.selectedColor = multipleSelection ? '#00ecde' : '#009dec';
  }

  function initVariables() {
    $startPatchForm = $('.start-patch-form');
  }

  function initToolbars() {

    // Toolbar selection
    var $toolbar = $('.toolbar');

    // Reset Tool
    $toolbar.find('[data-tool="clear"]').on('touchstart click', function() {
      clearSelected();
    });

    // Line toggle button
    $toolbar.find('[data-tool="line-toggle"]').on('touchstart click', function() {
      if (linesGroup) {
        linesGroup.visible = linesGroup.visible ? false : true;
        view.draw();
      }
    });
  }

  /**
   * Initialize the colour palette using patch's colour set within the quilt's theme.
   */
  function initColorPalette() {
    $colorButtons.on('touchstart click', applyColor);
    $applyColorButton.on('touchstart click', clearSelected);
    $colorPalette.on('changeSet', function(e) {
      console.log('changeset', $paletteSelectons.filter(':checked').val());
      // Update color set
      colorSet = e.colorData;
      console.log('colourSet', colorSet);
      selectedSet.value = $paletteSelectons.filter(':checked').val();
      _.forEach(colourAreas, setColor);
      view.draw();
    });
  }

  function setColor(shapeArea, i) {
    console.log('shape area', shapeArea);
    console.log('setting colour...', shapeArea.data.colorIndex);
    console.log(colorSet[shapeArea.data.colorIndex]);
    console.log('color index data', colorIndexData[i]);
    if (shapeArea === undefined) {
      return;
    }
    if (colorIndexData[i] !== null || colorIndexData[i] === undefined) {
      var currentColor = shapeArea.fillColor.toCSS(true), // Convert Paper.js Color object into hex
          newColor = colorSet[shapeArea.data.colorIndex];
      console.log('current:', currentColor);
      console.log('new:', newColor);
      if (newColor && newColor !== currentColor) {
        shapeArea.fillColor = newColor;
      }
    }
  }

  /**
   * Apply current colour to selected areas.
   * @param e
   */
  function applyColor(e) {
    var colorIndex = e.currentTarget.getAttribute('data-index'),
        colorToApply = colorSet[colorIndex];
    _.forEach(selectedItems, function(selectedItem) {
      selectedItem.fillColor = colorToApply;
      selectedItem.fillColor.alpha = selectedAlpha;
      selectedItem.data.colorIndex = colorIndex;

      console.log('apply color', colorToApply);
    });

    // Clear palette if only one area is selected
    if (selectedItems.length <= 1) {
      clearSelected();
    }
    view.draw();
  }

  function onActionButtonClick(e) {
    console.log('SAVING...', e);
    var $form = $(e.currentTarget.getAttribute('data-target')),
        status = e.currentTarget.value.toLowerCase(),
        postUrl = $form.attr('action') + '/' + status;

    console.log(postUrl);
    if (status === 'complete') {
      console.log('TEST');
      var $submitPatchModal = $('#submit-patch-modal');
      $submitPatchModal.find('.btn').on('click', function() {
        $(this).off('click');
      });
      $submitPatchModal.find('.btn-submit-design').on('click', function() {
        savePatch(postUrl);
      });
      $submitPatchModal.modal('show');
    } else {
      savePatch(postUrl);
    }

  }

  function savePatch(postUrl) {
    var svgString = paper.project.exportSVG({asString:true}),
        parser = new DOMParser(),
        doc = parser.parseFromString(svgString, 'image/svg+xml'),
        $svg = $(doc).find('#gridareas'),
        $gridItem = $svg.find('path'),
        colorData = [],
        data = [];

    // Collect color index
    _.forEach(colourAreas, function(shapeArea) {
      colorData.push(shapeArea.data.colorIndex);
    });

    // Collect shape colors
    $gridItem.each(function(i, v) {
      data.push(v.getAttribute('fill'));
    });

    // Post the data
    $.post(postUrl, {
      patchData: {
        colors: data,
        colorIndexData: colorData,
        colorSet: selectedSet.value
      }
    }, function(data) {
      console.log(data);
      window.location = data.url;
    }, 'json');
  }

  function initFormActions() {
    console.log('starting form action listeners....');
    var $actionsForm = $('#formActions');
    // Prevent default form behaviour
    $actionsForm.on('submit', function(e) {
      e.preventDefault();
    });
    $actionsForm.on('click', '.action-button', onActionButtonClick)
  }

  function changeSelectionColor(newColor) {
    _.forEach(colourAreas, function(colourArea) {
      colourArea.selectedColor = new Color(newColor);
    });
    view.draw();
  }

  function clickArea(e) {
    if (multipleSelection) {
      if (_.includes(selectedItems, e.target)) {
        clearTarget(e.target);
        _.remove(selectedItems, e.target);
      } else {
        selectTarget(e.target);
      }
      // Enable/disable the "apply color" button based on number of selected areas.
      if (selectedItems.length > 1) {
        $applyColorButton.prop('disabled', false);
      } else {
        $applyColorButton.prop('disabled', true);
      }
    } else {
      clearSelected();
    }
    view.draw();
  }

  function enterArea(e) {
    e.target.opacity = selectedAlpha;
  }

  function leaveArea(e) {
    e.target.opacity = 1;
  }

  /**
   * Remove selection indicator for all selected areas.
   */
  function clearSelected() {
    _.forEach(selectedItems, clearTarget);
    selectedItems = [];
    $applyColorButton.prop('disabled', true);
    view.draw();
  }

  /**
   * Select the current target.
   * @param target PaperJs shape
   */
  function selectTarget(target) {
    selectedItems.push(target);
    target.selected = true;
    target.fillColor.alpha = selectedAlpha;
  }

  /**
   * Clear selected target.
   * @param target PaperJs shape
   */
  function clearTarget(target) {
    console.log('clearing..', target);
    target.selected = false;
    target.fillColor.alpha = 1;
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
    window.onresize = function() {
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
