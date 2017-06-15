'use strict';
(function($,window) {
  paper.install(window)

  var Home = {
    init: function() {
      this.initVariables()
      this.initEvents()
      this.initPage()
    },
    initVariables: function() {
      this.$welcomeModal = $('#welcome-modal')
      this.$quiltOverlay = $('#canvas-overlay')
    },
    initEvents: function() {
    },
    initPage: function() {
      quiltsList.init()
      this.checkVisit()
    },
    checkVisit: function() {
      var visited = Boolean(Cookies.get('visited'));
      console.log('visited', visited);
      console.log('overlay', this.$quiltOverlay);
      if (!visited) {
        var _this = this;
        this.$quiltOverlay.addClass('open');
        this.$quiltOverlay.on('click', function(e) {
          console.log('click', e);
          console.log(_this.$quiltOverlay);
          _this.$quiltOverlay.removeClass('open');
          _this.setVisited();
        });
        // this.$welcomeModal.on('hide.bs.modal', this.setVisited);
        this.$welcomeModal.modal('open');
        setTimeout(function() {
          _this.$welcomeModal.addClass('fade').modal('close');
        }, 15000);
        this.$welcomeModal.on('click', '.get-started-link', this.setVisited);
        /*
        this.$welcomeModal.find('.signup-link').on('click', function(e) {
          e.preventDefault();
          var link = document.domain + e.currentTarget.getAttribute('href');
          window.location = e.currentTarget.getAttribute('href');
          console.log(document.domain);
          console.log(e.currentTarget.getAttribute('href'));
        });
        this.$welcomeModal.find('[data-toggle]').on('click', function(e) {
          e.preventDefault();
          var $target = $(e.currentTarget.getAttribute('data-target'));
          if ($target.length) {
            $target.addClass('open');
          }
        });
        */
      }
    },
    setVisited: function() {
      Cookies.set('visited', 'true', { expires: 365 });
    }
  };

  $(function() {
    Home.init();
  });
})(jQuery,window);
