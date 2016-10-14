'use strict';
(function($,window) {
  paper.install(window);

  var Home = {
    init: function() {
      this.initVariables();
      this.initEvents();
      this.initPage();
    },
    initVariables: function() {
      this.$welcomeModal = $('#welcome-modal');
    },
    initEvents: function() {
    },
    initPage: function() {
      console.log('INIT');
      quiltsList.init();
      this.checkVisit();
    },
    checkVisit: function() {
      var visited = Boolean(Cookies.get('visited'));
      if (!visited) {
        this.$welcomeModal.on('hide.bs.modal', this.setVisited);
        this.$welcomeModal.on('click', '.btn', this.setVisited);
        this.$welcomeModal.modal('show');
        this.$welcomeModal.find('.signup-link').on('click', function(e) {
          e.preventDefault();
          var link = document.domain + e.currentTarget.getAttribute('href');
          window.location = e.currentTarget.getAttribute('href');
          console.log(document.domain);
          console.log(e.currentTarget.getAttribute('href'));
        });
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