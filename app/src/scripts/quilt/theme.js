'use strict';
var theme = (function($) {

  var $themeCarousel = $('.theme-carousel');

  function init() {

    if ($themeCarousel.length > 0) {

      let $input = $($themeCarousel.data('target')),
          $themes = $themeCarousel.find('.theme'),
          $selectedTheme = $('.selected-theme');
      $themeCarousel.on('init', function(e, slick) {
        setActiveTheme($input, $selectedTheme, $themes.get(slick.currentSlide));
      });
      $themeCarousel.on('afterChange', function(e, slick, currentSlide) {
        setActiveTheme($input, $selectedTheme, $themes.get(currentSlide));
      });
      $themeCarousel.slick();

      initEvents();
    }
  }

  function initEvents() {

    // TODO: only admin/owner of quilt can use this feature
    $('.theme-form').on('submit', function(e) {
      e.preventDefault();
      var form = e.currentTarget,
          actionUrl = form.getAttribute('action'),
          formData = utils.seralizeObject(form);
      $.post(actionUrl, formData, function(e) {
        console.log(e);
      });
    });
  }

  function setActiveTheme($input, $selectedTheme, currentTheme) {
    let themeId = currentTheme.getAttribute('data-id'),
        themeName = currentTheme.getAttribute('data-name');
    console.log(themeName, themeId);
    $input.val(themeId);
    $selectedTheme.text(themeName);
    console.log(currentTheme);
  }

  return {
    init: function() {
      init();
    },
    deinit: function() {
    }
  }
})(jQuery);
