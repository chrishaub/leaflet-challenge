// global
var myMap = "";

$(document).ready(function() {
    makeMap();
});

//this function is going to grab the data needed for the map
function makeMap() {
    var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson"

    // Perform a GET request to the query URL
    $.ajax({
        type: "GET",
        url: queryUrl,
        success: function(data) {
            console.log(data);

            $.ajax({
                type: "GET",
                url: "static/PB2002_boundaries.json",
                success: function(tectonic) {


                    //BUILD WITH BOTH DATASETS
                    buildMap(data, tectonic);
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert("Status: " + textStatus);
                    alert("Error: " + errorThrown);
                }
            });

        },

        error: function(XMLHttpRequest, textStatus, errorThrown) {
            alert("Status: " + textStatus);
            alert("Error: " + errorThrown);
        }
    });
}

function buildMap(data, tectonic) {
    // Step 0: Create the Tile Layers
    // Add a tile layer
    var dark_mode = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/dark-v10",
        accessToken: API_KEY
    });

    var light_mode = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/light-v10",
        accessToken: API_KEY
    });

    var satellite_mode = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/satellite-v9",
        accessToken: API_KEY
    });

    // STEP 1: INIT MAP
    // Create a map object
    myMap = L.map("map", {
        center: [37.7749, -122.4194],
        zoom: 3,
        layers: dark_mode
    });

    //Step 2: Build the data
    var earthquakes = [];
    var heatmap_list = [];

    data.features.forEach(function(earthquake) {
        var marker = L.geoJSON(earthquake, {
            onEachFeature: onEachFeature
        });
        earthquakes.push(marker);

        var circle = L.geoJSON(earthquake, {
            pointToLayer: function(feature, latlng) {
                var geojsonMarkerOptions = createMarkerOptions(feature);
                return L.circleMarker(latlng, geojsonMarkerOptions);
            },
            onEachFeature: onEachFeature
        });
        heatmap_list.push(circle);

    });

    // create tectonic plates
    var tectonic_plates = L.geoJSON(tectonic, {
        color: "gray",
        weight: 3
    });

    console.log(tectonic_plates)

    var marker_group = L.layerGroup(earthquakes);
    marker_group.addTo(myMap);
    var marker_group2 = L.layerGroup(heatmap_list);
    marker_group2.addTo(myMap);
    var tec_lay = L.layerGroup([tectonic_plates]);
    tec_lay.addTo(myMap);

    console.log(tec_lay);


    var baseMaps = {
        "Light Mode": light_mode,
        "Dark Mode": dark_mode,
        "Satellite": satellite_mode
    };

    var overlayMaps = {
        "Markers": marker_group,
        "Circles": marker_group2,
        "Tectonic Plates": tec_lay
    };

    console.log(overlayMaps);

    L.control.layers(baseMaps, overlayMaps).addTo(myMap);

    // Set up the legend
    var legend = L.control({ position: "bottomright" });
    legend.onAdd = function() {
        var div = L.DomUtil.create("div", "info legend");

        // create legend as raw html
        var legendInfo = `<h4 style = "margin-bottom:10px"> Earthquake Depth </h4>
        <div>
        <div style = "background:#98ee00;height:10px;width:10px;display:inline-block"> </div> 
        <div style = "display:inline-block"> Less than 10 Miles</div>
        </div> 
        <div>
        <div style = "background:#d4ee00;height:10px;width:10px;display:inline-block"></div> 
        <div style = "display:inline-block">10 - 30 Miles</div>
        </div>
        <div>
        <div style = "background:#eecc00;height:10px;width:10px;display:inline-block"></div>
        <div style = "display:inline-block">30 - 50 Miles</div>
        </div>
        <div>
        <div style = "background:#ee9c00;height:10px;width:10px;display:inline-block"></div> 
        <div style = "display:inline-block">50 - 70 Miles</div>
        </div>
        <div>
        <div style = "background:#ea822c;height:10px;width:10px;display:inline-block"></div>
        <div style = "display:inline-block">70 - 90 Miles</div>
        </div> 
        <div>
        <div style = "background:#ea2c2c;height:10px;width:10px;display:inline-block"></div>
        <div style = "display:inline-block">Greater than 90 Miles</div>
        </div>`;

        div.innerHTML = legendInfo;
        return (div)
    }

    // Adding legend to the map
    legend.addTo(myMap);

}







// Input Layer Legend onto the map

function createMarkerOptions(feature) {
    var depth = feature.geometry.coordinates[2];
    var depthColor = "";
    if (depth > 90) {
        depthColor = "#ea2c2c";
    } else if (depth > 70) {
        depthColor = "#ea822c";
    } else if (depth > 50) {
        depthColor = "#ee9c00";
    } else if (depth > 30) {
        depthColor = "#eecc00";
    } else if (depth > 10) {
        depthColor = "#d4ee00";
    } else {
        depthColor = "#98ee00";
    }


    var geojsonMarkerOptions = {
        radius: (feature.properties.mag * 5) + 1,
        fillColor: depthColor,
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    return (geojsonMarkerOptions)
}





// called in the create circles
function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.place) {
        layer.bindPopup(feature.properties.title);
    }
}










//     var marker = L.marker([earthquake.geometry.coordinates[1], earthquake.geometry.coordinates[0]], {
//         draggable: false
//     });
//     marker.bindPopup(`<h3>${earthquake.properties.City}</h3>`);
//     earthquakes.push(marker);

//     heatmap_list.push([earthquake.geometry.coordinates[1], earthquake.geometry.coordinates[0]])
;


// var heat_layer = L.heatLayer(heatmap_list, {
//     radius: 20,
//     blur: 35
// });
// heat_layer.addTo(myMap);

// Create Layer Legend




// // Slap Layer Legend onto the map
// L.control.layers(baseMaps, overlayMaps).addTo(myMap);