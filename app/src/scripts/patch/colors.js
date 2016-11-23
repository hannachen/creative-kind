'use strict';
var colors = (function($) {

  var $colorSetSelector = $('.palette-selector'),
      $colorSets = $colorSetSelector.find('.selection'),
      $colorPalette = $('.color-palette'),
      $colorButtons = $colorPalette.find('.color-button'),
      selectedSet = document.getElementById('selectedSet');

  function init() {

    if ($colorSetSelector.length > 0) {
      var selectedSetValue = parseInt($colorSetSelector.find('.selected-set').val()),

          // Get radio element by value
          $selectedSet = $colorSets.filter('[value='+selectedSetValue+']'),

          // Get radio option label
          $selectedSetLabel = $colorSetSelector.find('[for='+$selectedSet.attr('id')+']'),

          // Get radio option colours
          $swatches = $selectedSetLabel.find('.swatch');

      selectedSet.value = selectedSetValue;

      // Set element as checked
      $selectedSet.attr('checked', true);
      updateColors($colorButtons, $swatches);
      initEvents();
    }
  }

  function updateColors($paletteColors, $swatches) {
    var colorData = [];
    $paletteColors.each(function(i) {
      var $color = $(this),
          newColor = $swatches.eq(i).data('hex');
      console.log('COLOR SET UPDATE', $color);
      $color.attr('data-color', newColor); // Using jQuery 'attr' to set the data instead of data() to prevent value caching
      $color.css('background-color', newColor);
      colorData.push(newColor);
    });

    // Trigger custom event to the color palette
    $colorPalette.trigger({
      type: 'changeSet',
      colorData: colorData
    });
  }

  function initEvents() {

    $colorSets.on('change', function(e) {
      e.preventDefault();
      console.log('current selection', e.currentTarget);
      var $currentTarget = $(e.currentTarget),
          $selectedSetLabel = $colorSetSelector.find('[for='+$currentTarget.attr('id')+']'),
          $swatches = $selectedSetLabel.find('.swatch');
      updateColors($colorButtons, $swatches);
    });
  }

  return {
    init: function() {
      init();
    },
    deinit: function() {
    }
  }
})(jQuery);
