// Create the Google Map…
var map = new google.maps.Map(d3.select("#map").node(), {
  zoom: 13,
  center: new google.maps.LatLng(37.767683, -122.433701),
  mapTypeId: google.maps.MapTypeId.TERRAIN
});

// Load the station data. When the data comes back, create an overlay.
d3.csv("trees.csv", function(error, data) {
  if (error) throw error;

  var overlay = new google.maps.OverlayView();

  // Add the container when the overlay is added to the map.
  overlay.onAdd = function() {
    var layer = d3.select(this.getPanes().overlayMouseTarget).append("div")
        .attr("class", "trees");

    // Draw each marker as a separate SVG element.
    // We could use a single SVG, but what size would it have?
    overlay.draw = function() {
      var projection = this.getProjection(),
          padding = 10;

      var marker = layer.selectAll("svg")
          .data(data)
          .each(transform) // update existing markers
        .enter().append("svg")
          .each(transform)
          .attr("class", "marker");

      // Add a circle.
      marker.append("circle")
          .attr("r", 3)
          .attr("cx", padding)
          .attr("cy", padding);

      function transform(d) {
        // latitude, longitude
        d = new google.maps.LatLng(parseFloat(d.Latitude), parseFloat(d.Longitude));
        d = projection.fromLatLngToDivPixel(d);
        return d3.select(this)
            .style("left", (d.x - padding) + "px")
            .style("top", (d.y - padding) + "px")
            .on('mouseover', (d) => {
                document.getElementById("tree-id").innerHTML = d.TreeID;
                document.getElementById("tree-species").innerHTML = d.qSpecies;
                document.getElementById("tree-address").innerHTML = d.qAddress;
                document.getElementById("tree-site-info").innerHTML = d.qSiteInfo;
            });
      }
    }
  };

  // Bind our overlay to the map…
  overlay.setMap(map);

});

function latLng2Point(latLng, map) {
  var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
  var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
  var scale = Math.pow(2, map.getZoom());
  var worldPoint = map.getProjection().fromLatLngToPoint(latLng);
  return new google.maps.Point((worldPoint.x - bottomLeft.x) * scale, (worldPoint.y - topRight.y) * scale);
}

function point2LatLng(point, map) {
  var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
  var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
  var scale = Math.pow(2, map.getZoom());
  var worldPoint = new google.maps.Point(point.x / scale + bottomLeft.x, point.y / scale + topRight.y);
  return map.getProjection().fromPointToLatLng(worldPoint);
}

function calcDistance(p1, p2) {
  return (google.maps.geometry.spherical.computeDistanceBetween(p1, p2)).toFixed(2);
}

function outBound(d, min, max) {
  var treeHeight = parseInt(d.DBH, 10);
  return treeHeight > max || treeHeight < min;
}

function updateVisibleTrees(aValue, bValue, minHeight, maxHeight, inputs) {
  d3.selectAll("svg circle")
    .style("fill", "red")
    .style("stroke", "black")
    .style("stroke-width", "1px");

  var numSpecies = 0;

  if (markerA == null && markerB == null) {
    d3.selectAll("svg circle")
      .filter((d) => {
        var result = true;
        inputs.forEach((i) => {
          if (d.qSiteInfo.includes(i)) {
            result = false;
          }
        })

        if (result || outBound(d, minHeight, maxHeight) || d.Latitude == "" || d.Longitude == ""){
          numSpecies++;
          return true;
        }
        return false;
      })
      .style("fill", "none")
      .style("stroke", "none")
      .on("mouseover", null);
  } else if (markerA == null) {
    d3.selectAll("svg circle")
      .filter((d) => {
         var position = new google.maps.LatLng(parseFloat(d.Latitude), parseFloat(d.Longitude));
         var result = true;
         inputs.forEach((i) => {
           if (d.qSiteInfo.includes(i)) {
             result = false;
           }
         })

         if (result || calcDistance(position, markerB.getPosition()) > bValue || outBound(d, minHeight, maxHeight) || d.Latitude == "" || d.Longitude == "") {
           numSpecies++;
           return true;
         }
         return false;
      })
      .style("fill", "none")
      .style("stroke", "none")
      .on("mouseover", null);
  } else if (markerB == null) {
    d3.selectAll("svg circle")
      .filter((d) => {
         var position = new google.maps.LatLng(parseFloat(d.Latitude), parseFloat(d.Longitude));var result = false;
         var result = true;
         inputs.forEach((i) => {
           if (d.qSiteInfo.includes(i)) {
             result = false;
           }
         })
         if (result || calcDistance(position, markerA.getPosition()) > aValue || outBound(d, minHeight, maxHeight) || d.Latitude == "" || d.Longitude == "") {
           numSpecies++;
           return true;
         }
         return false;
      })
      .style("fill", "none")
      .style("stroke", "none")
      .on("mouseover", null);
  } else {
    d3.selectAll("svg circle")
      .filter((d) => {
        var position = new google.maps.LatLng(parseFloat(d.Latitude), parseFloat(d.Longitude));
        var result = true;
        inputs.forEach((i) => {
          if (d.qSiteInfo.includes(i)) {
            result = false;
          }
        })
        if (result || calcDistance(position, markerA.getPosition()) > aValue || calcDistance(position, markerB.getPosition()) > bValue || outBound(d, minHeight, maxHeight) || d.Latitude == "" || d.Longitude == "") {
          numSpecies++;
          return true;
        }

        return false;
      })
      .style("fill", "none")
      .style("stroke", "none")
      .on("mouseover", null);
  }

  document.getElementById("num-species").innerHTML = (9831 - numSpecies);
}

var markerA = null, markerB = null;
var circleA = null, circleB = null;
var firstA = true, firstB = true;

var btnDistanceA = document.getElementById("btn-distance-A");
var btnDistanceB = document.getElementById("btn-distance-B");
var btnReset = document.getElementById("btn-reset");
var containerButtonA = document.getElementById("container-btn-A");
var containerButtonB = document.getElementById("container-btn-B");
var sliderA = document.getElementById("slider-A");
var sliderB = document.getElementById("slider-B");
var closeA = document.getElementById("close-A");
var closeB = document.getElementById("close-B");

btnDistanceA.onclick = () => {
  if (markerA == null){
      map.addListener("click", function(e){
          if (markerA == null && firstA){
            var latlng = {lat: e.latLng.lat(), lng: e.latLng.lng()};
            markerA = new google.maps.Marker({
                        position: latlng,
                        map: map,
                        draggable: true,
                        title: 'Drag to move the pinpoint',
                        icon: 'A_pin.png'
                      });

            containerButtonA.style.display = "none";
            sliderA.style.display = "block";

            circleA = new google.maps.Circle({
              strokeColor: '#428bca',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#428bca',
              fillOpacity: 0.35,
              map: map,
              center: latlng,
              radius: 3500
            })

            circleA.bindTo('center',  markerA, 'position');
            updateVisibleTrees(3500, $("#slider-A").slider("value"), $("#slider-range").slider("values",0), $("#slider-range").slider("values",1), locationInput());

            google.maps.event.addListener(markerA, 'dragend', (e) => {
              markerA.set('position', e.latLng);
              updateVisibleTrees($("#slider-A").slider("value"), $("#slider-B").slider("value"), $("#slider-range").slider("values",0), $("#slider-range").slider("values",1), locationInput())
            })


            firstA = false;
            closeA.style.display = "block";
          }
      });
  }
}

btnDistanceB.onclick = () => {
  if (markerB == null){
      map.addListener('click', function(e) {
          if (markerB == null && firstB){
            var latlng = {lat: e.latLng.lat(), lng: e.latLng.lng()};
            markerB = new google.maps.Marker({
                        position: latlng,
                        map: map,
                        draggable: true,
                        title: 'Drag to move the pinpoint',
                        icon: 'B_pin.png'
                      });
            containerButtonB.style.display = "none";
            sliderB.style.display = "block";

            circleB = new google.maps.Circle({
               strokeColor: '#5cb85c',
               strokeOpacity: 0.8,
               strokeWeight: 2,
               fillColor: '#5cb85c',
               fillOpacity: 0.35,
               map: map,
               center: latlng,
               radius: 3500
            })

            circleB.bindTo('center',  markerB, 'position');
            updateVisibleTrees($("#slider-A").slider("value"), 3500, $("#slider-range").slider("values",0), $("#slider-range").slider("values",1), locationInput());

            google.maps.event.addListener(markerB, 'dragend', (e) => {
              markerB.set('position', e.latLng);
              updateVisibleTrees($("#slider-A").slider("value"), $("#slider-B").slider("value"), $("#slider-range").slider("values",0), $("#slider-range").slider("values",1), locationInput())
            })

            firstB = false;
            closeB.style.display = "block";
          }
      });
  }
}

btnReset.onclick = () => {
  if (circleA) circleA.setMap(null);
  if (circleB) circleB.setMap(null);
  if (markerA) markerA.setMap(null);
  if (markerB) markerB.setMap(null);
  markerA = null;
  markerB = null;
  circleA = null;
  circleB = null;
  firstA = true;
  firstB = true;
  containerButtonA.style.display = "block";
  sliderA.style.display = "none";
  containerButtonB.style.display = "block";
  sliderB.style.display = "none";

  d3.selectAll("svg circle")
    .style("fill", "red")
    .style("stroke", "black")
    .style("stroke-width", "1px");

  google.maps.event.clearListeners(map, 'click');
  $("#slider-A").slider({value: 3500});
  $("#slider-B").slider({value: 3500});
  $("#custom-handle-A").text(3500);
  $("#custom-handle-B").text(3500);
  $("#slider-range").slider({values:[0, 140]});
  $("#amount").val("0 - 140 inches");
  var locationInput = $(".location-input");
  for (var i = 0; i < locationInput.length; i++){
    locationInput[i].checked = true;
  }
  document.getElementById("num-species").innerHTML = "9761";

  closeA.style.display = "none";
  closeB.style.display = "none";
}

$(function() {
    var handle = $("#custom-handle-A");
    $("#slider-A").slider({
      create: function() {
        handle.text($(this).slider("value"));
      },
      slide: function(event,ui) {
        handle.text(ui.value);
        circleA.set('radius', ui.value);
        updateVisibleTrees(ui.value, $("#slider-B").slider("value"), $("#slider-range").slider("values",0), $("#slider-range").slider("values",1), locationInput());
      },
      min: 0,
      max: 7000,
      value: 3500
    });
});

$(function() {
    var handle = $("#custom-handle-B");
    $("#slider-B").slider({
      create: function() {
        handle.text($(this).slider("value"));
      },
      slide: function(event,ui) {
        handle.text(ui.value);
        circleB.set('radius', ui.value);
        updateVisibleTrees($("#slider-A").slider("value"), ui.value, $("#slider-range").slider("values",0), $("#slider-range").slider("values",1), locationInput());
      },
      min: 0,
      max: 7000,
      value: 3500
    });
});

$(function() {
    $( "#slider-range" ).slider({
      range: true,
      min: 0,
      max: 140,
      values: [0, 140],
      slide: function( event, ui ) {
        $( "#amount" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] + " inches");
        updateVisibleTrees($("#slider-A").slider("value"), $("#slider-B").slider("value"), ui.values[0], ui.values[1], locationInput())
      }
    });
    $( "#amount" ).val($( "#slider-range" ).slider( "values", 0 ) +
      " - " + $( "#slider-range" ).slider( "values", 1 ) + " inches" );
});

function locationInput() {
  var allVals = [];
  $('.location-input:checked').each(function() {
    allVals.push($(this).val());
  });
  return allVals;
}

$(".location-input").change(function() {
    updateVisibleTrees($("#slider-A").slider("value"), $("#slider-B").slider("value"), $("#slider-range").slider("values",0), $("#slider-range").slider("values",1), locationInput());
});

closeA.onclick = () => {
  if (circleA) circleA.setMap(null);
  if (markerA) markerA.setMap(null);
  markerA = null;
  circleA = null;
  firstA = true;
  containerButtonA.style.display = "block";
  sliderA.style.display = "none";

  d3.selectAll("svg circle")
    .style("fill", "red")
    .style("stroke", "black")
    .style("stroke-width", "1px");

  google.maps.event.clearListeners(map, 'click');
  $("#slider-A").slider({value: 3500});
  $("#custom-handle-A").text(3500);
  closeA.style.display = "none";
  updateVisibleTrees($("#slider-A").slider("value"), $("#slider-B").slider("value"), $("#slider-range").slider("values",0), $("#slider-range").slider("values",1), locationInput());
}

closeB.onclick = () => {
  if (circleB) circleB.setMap(null);
  if (markerB) markerB.setMap(null);
  markerB = null;
  circleB = null;
  firstB = true;
  containerButtonB.style.display = "block";
  sliderB.style.display = "none";

  d3.selectAll("svg circle")
    .style("fill", "red")
    .style("stroke", "black")
    .style("stroke-width", "1px");

  google.maps.event.clearListeners(map, 'click');
  $("#slider-B").slider({value: 3500});
  $("#custom-handle-B").text(3500);
  closeB.style.display = "none";
  updateVisibleTrees($("#slider-A").slider("value"), $("#slider-B").slider("value"), $("#slider-range").slider("values",0), $("#slider-range").slider("values",1), locationInput());
}
