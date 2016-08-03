'use strict';
var colors = (function($) {

  var $colorSetSelector = $('.palette-selector'),
      $colorSets = $colorSetSelector.find('.selection'),
      $colorPalette = $('.color-palette'),
      $colorButtons = $colorPalette.find('.color-button');

  function init() {

    if ($colorSetSelector.length > 0) {
      var selectedSet = $colorSetSelector.find('.selected-set').val(),

          // Get radio element by value
          $selectedSet = $colorSets.filter('[value='+selectedSet+']'),

          // Get radio option label
          $selectedSetLabel = $colorSetSelector.find('[for='+$selectedSet.attr('id')+']'),

          // Get radio option colours
          $swatches = $selectedSetLabel.find('.swatch');

      // Set element as checked
      $selectedSet.attr('checked', true);
      updateColors($colorButtons, $swatches);
      initEvents();
    }
  }

  function updateColors($paletteColors, $swatches) {
    $paletteColors.each(function(i) {
      var $color = $(this),
        newColor = $swatches.eq(i).data('hex');
      $color.attr('data-color', newColor); // Using jQuery 'attr' to set the data instead of data() to prevent value caching
      $color.css('background-color', newColor);
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
