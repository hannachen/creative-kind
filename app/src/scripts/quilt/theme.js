'use strict';
var theme = (function($) {

  var $themeCarousel = $('.theme-carousel');

  function init() {

    if ($themeCarousel.length > 0) {

      let $input = $($themeCarousel.data('target')),
          $themes = $themeCarousel.find('.theme'),
          $selectedTheme = $('.selected-theme');

      // Carousel options
      var options = {};
      options.mobileFirst = true;

      // Set active theme, either from input or theme
      if (_.isEmpty($input.val())) {
        $themeCarousel.on('init', function(e, slick) {
          setActiveTheme($input, $selectedTheme, $themes.get(slick.currentSlide));
        });
      } else {
        options.initialSlide = $themes.index($themes.filter('[data-id='+$input.val()+']'));
      }

      $themeCarousel.on('beforeChange', function(e, slick, currentSlide, nextSlide) {
        setActiveTheme($input, $selectedTheme, $themes.get(nextSlide));
      });
      $themeCarousel.slick(options);

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
      $.ajax(actionUrl, {
        type: 'post',
        data: formData,
        statusCode: {
          200: function() {
            location.reload();
          },
          404: function() {
            alert('Error saving theme');
          }
        }
      });
    });
  }

  function setActiveTheme($input, $selectedTheme, currentTheme) {
    let themeId = currentTheme.getAttribute('data-id'),
        themeName = currentTheme.getAttribute('data-name');
    console.log(themeName, themeId);
    $input.val(themeId);
    $selectedTheme.text(themeName);
    console.log('CURRENT THEME', currentTheme);
  }

  return {
    init: function() {
      init();
    },
    deinit: function() {
    }
  }
})(jQuery);
