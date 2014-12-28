define([
  "underscore",
  "jquery",
  "d3",
  "semanticui",
  "ui/probabilitybar"
], function(_, $, d3) {

var TRACK_FIRM = 1, TRACK_SEL = 2;

function FirmView(domElem, net) {
  if (!(this instanceof FirmView)) {return new FirmView(domElem, net);}

  var selFirmInfo = $( domElem ),
      firmName = selFirmInfo.find(".name"),
      employed = selFirmInfo.find(".employed"),
      unemployed = selFirmInfo.find(".unemployed"),
      fireProb = selFirmInfo.find(".fire-prob"),
      hireProb = selFirmInfo.find(".hire-prob");

  var network, firm, mode;
  var _getSel;

  if ( _(net.selected).isFunction() ) {
    // We are tracking the selection
    mode = TRACK_SEL;
    network = net.network();
    _getSel = function() {return net.selected();};
    net.on("selectionChange", updateInfo);
    selFirmInfo.find("i.remove").hide();
    selFirmInfo.find("i.pin").show();
  } else {
    mode = TRACK_FIRM;
    firm    = net;
    network = firm.network();
    _getSel = function() {return (firm.exists() ? [firm] : []);};
    selFirmInfo.find("i.pin").hide();
    selFirmInfo.find("i.remove").show();
  }

  this.selFirmInfo = function() {return selFirmInfo;};

  network.on("networkChange",  updateInfo);
  network.on("simulationStep", updateInfo);

  fireProb.probability({
    onUserSetValue: function(p) {
      var sel = _getSel();
      for ( var i in sel ){
        //* @todo optimise this to avoid multiple networkChange events
        sel[i].param("fireProb", p);
      }
    }
  });
  hireProb.probability({
    onUserSetValue: function(p) {
      var sel = _getSel();
      for ( var i in sel ){
        //* @todo optimise this to avoid multiple networkChange events
        sel[i].param("hireProb", p);
      }
    }
  });

  selFirmInfo.find(".shutdown-firm").click(function(e){
    var sel = _getSel();
    for ( var i in sel ){
      //* @todo optimise this to avoid multiple networkChange events
      sel[i].param('fireProb', 1);
      sel[i].param('hireProb', 0);
    }
  });
  selFirmInfo.find(".remove-firm").click(function(e){
    var sel = _getSel();
    for ( var i in sel ){
      //* @todo optimise this to avoid multiple networkChange events
      network.removeFirm(sel[i]);
    }
  });
  selFirmInfo.find(".pin").click(function(e){
    var container = selFirmInfo.parent();
    var sel = _getSel();
    for ( var i in sel ){
      var newCard = selFirmInfo.clone().removeAttr("id").appendTo(container);
      new FirmView(newCard, sel[i]);
    }
  });
  selFirmInfo.find(".remove").click(function(e){
    _destroy();
  });

  function updateInfo () {
    var sel = _getSel();
    if ( sel.length > 0 ){
      selFirmInfo.removeClass("disabled");
      var name, f, w = {employed: 0, unemployed: 0};
      fireProb.removeClass("disabled");
      hireProb.removeClass("disabled");
      if ( sel.length === 1 ){
        f = sel[0];
        w = f.numOfEmployees();
        name = "Firm " + f.id();
        fireProb.probability("value", f.param("fireProb"));
        hireProb.probability("value", f.param("hireProb"));
      } else {
        var commFireProb = sel[0].param("fireProb"), fireCommon = true,
            commHireProb = sel[0].param("hireProb"), hireCommon = true,
            fw;
        name = sel.length + " firms selected";
        for (var i in sel) {
          f = sel[i];
          fw = f.numOfEmployees();
          if ( commFireProb !== f.param("fireProb") ) fireCommon = false;
          if ( commHireProb !== f.param("hireProb") ) hireCommon = false;
          w.employed   += fw.employed;
          w.unemployed += fw.unemployed;
        }
        if( fireCommon )
          fireProb.probability("value", commFireProb);
        else
          fireProb.probability("mixed", true);
        if( hireCommon )
          hireProb.probability("value", commHireProb);
        else
          hireProb.probability("mixed", true);
      }
      firmName.text(name);
      employed.text(w.employed);
      unemployed.text(w.unemployed);
    } else {
      unsetFirmInfo();
    }
  }

  function unsetFirmInfo () {
    if ( mode === TRACK_FIRM ) {
      _destroy();
    } else {
      selFirmInfo.addClass("disabled");
      firmName.text('---');
      employed.text('---');
      unemployed.text('---');
      selFirmInfo.find(".ui.progress")
        .addClass('disabled')
        .probability("value", 0);
    }
  }

  function _destroy () {
    selFirmInfo.remove();
    network.off("networkChange",  updateInfo);
    network.off("simulationStep", updateInfo);
    if ( mode === TRACK_SEL )
      net.off("selectionChange", updateInfo);
  }
  this.destroy = _destroy;

  updateInfo();
}

return FirmView;

});