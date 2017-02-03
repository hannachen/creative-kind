'use strict';
var Quilt = function(svg, quiltId, quiltData) {

  this.$patchPreview = $('#patch-preview');
  this.quiltId = quiltId;
  this.myPatch = '';
  this.patches = [];
  this.clickedPatch;
  this.patchStatus;

  this.setupQuilt(svg, quiltData);
};

Quilt.prototype = {

  disable: function() {
    var _this = this;
    _.forEach(this.patches, function(patch) {
      patch.off(_this.getPatchEvents());
    });
  },

  setupQuilt: function(svg, patchStatus) {
    var _this = this;
    _.forEach(patchStatus, function(patch) {
      if (patch.status === 'mine') {
        _this.myPatch = patch.uid;
      }
    });
    if (svg.hasChildren()) {
      let svgPatches = svg.children,
        indexOffset = 0;
      console.log('LENGTH', svgPatches.length);
      _.forEach(svgPatches, function(group, i) {
        if (group === undefined || group.hasChildren() === undefined || !patchStatus[i-indexOffset]) {
          indexOffset++;
          console.log("SKIP", group);
          return;
        }
        let patch, plus, circle;
        if(group.hasChildren()) {
          _.forEach(group.children, function(item) {
            let itemType = _this.getItemType(item);
            switch(itemType) {
              case 'rectangle':
                patch = item;
                break;
              case 'path':
                plus = item;
                break;
              case 'circle':
                circle = item;
                break;
            }
          });
        }

        plus.locked = true;
        plus.visible = false;

        circle.locked = true;
        circle.visible = false;

        patch.strokeScaling = false;
        patch.fillColor = '#ffffff';
        patch.data.uid = patchStatus[i-indexOffset].uid;
        patch.data.status = patchStatus[i-indexOffset].status;

        switch (patch.data.status) {
          case 'progress':
            patch.fillColor = '#cccccc';
            break;
          case 'mine':
            patch.on(_this.getPatchEvents());
            patch.fillColor = '#aab0ff';
            break;
          case 'complete':
            project.importSVG('/patch/svg/'+patch.data.uid, function(patchSvg) {
              patchSvg.rotate(-45);
              patchSvg.fitBounds(patch.bounds);
              patchSvg.data = patch.data;
              group.addChild(patchSvg);
              patchSvg.on(_this.getPatchEvents());
              patch.visible = false;
            });
            break;
          case 'new':
          default:
            if (_this.myPatch.length) {
              plus.visible = false;
            } else {
              patch.on(_this.getPatchEvents());
              plus.visible = true;
            }
            break;
        }
        _this.patches.push(patch);
      });
    }
  },

  /**
   * Find out the type of a paper item.
   *
   * @param {paper.Item} item
   * @returns {string}
   */
  getItemType: function(item) {
    var itemType = '';
    switch (item.className) {
      case 'Shape':
        itemType = item.type;
        break;
      case 'Path':
        itemType = item.className.toLowerCase();
        break;
      default:
    }
    return itemType;
  },

  getPatchEvents: function() {
    var _this = this,
      events = {};
    events.click = function(e) {
      var clickedPatch = e.target.data;
      clickedPatch.quilt = _this.quiltId;
      console.log(_this.quiltId);
      _this.clickedPatch = clickedPatch;
      if (clickedPatch.status === 'complete') {
        _this.showPatch(clickedPatch.uid);
      } else {
        _this.emitClickEvent(clickedPatch);
      }
    };
    if (!Modernizr.touch) {
      events.mouseenter = _this.enterArea;
      events.mouseleave = _this.leaveArea;
    }
    return events;
  },

  emitClickEvent: function(patchId) {
    // trigger custom event
    $(document).trigger({
      type: 'click-patch',
      patch: patchId
    });
  },

  showPatch: function(patchId) {
    var _this = this;
    this.$patchPreview.css('display', 'block');
    var $preview = $('<img src="/patch/svg/'+patchId+'">');
    $preview.on('click', function() {
      $preview.off('click');
      _this.$patchPreview.css('display', 'none');
      _this.$patchPreview.empty();
    });
    this.$patchPreview.append($preview);
  },

  enterArea: function(e) {
    e.target.opacity = 0.75;
  },

  leaveArea: function(e) {
    e.target.opacity = 1;
    this.dragging = false;
  }
};
