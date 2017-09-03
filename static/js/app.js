var map;

// Create a new blank array for all the listing markers.
var markers = [];

function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 28.6139391, lng: 77.2090212  },
        zoom: 13,
        mapTypeControl: false
    });

    // These are the real estate listings that will be shown to the user.
    // Normally we'd have these in a database instead.
    var locations = [
        { title: 'Rashtrapati Bhavan', location: { lat: 28.6144, lng: 77.1996} },
        { title: 'Nehru Planetarium', location: {
                  "lat" : 28.6039,
                  "lng" : 77.1981
               } },{ title: 'Khan Market', location: {
                  "lat" : 28.6001,
                  "lng" : 77.2270
               } },{ title: 'Jawaharlal Nehru Stadium', location: {
                  "lat" : 28.5828,
                  "lng" : 77.2344
               } },{ title: 'India Gate', location: {
                  "lat" : 28.6129,
                  "lng" : 77.2295
               } }
    ];

    var largeInfowindow = new google.maps.InfoWindow();

    // The following group uses the location array to create an array of markers on initialize.
    for (var i = 0; i < locations.length; i++) {
        // Get the position from the location array.
        var position = locations[i].location;
        var title = locations[i].title;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i
        });
        // Push the marker to our array of markers.
        markers.push(marker);
        // Create an onclick event to open an infowindow at each marker.
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
        });
    }
    // document.getElementById('show-listings').addEventListener('click', showListings);
    // document.getElementById('hide-listings').addEventListener('click', hideListings);
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
// function populateInfoWindow(marker, infowindow) {
//     
//     // Check to make sure the infowindow is not already opened on this marker.
//     if (infowindow.marker != marker) {
//         infowindow.marker = marker;
//         infowindow.setContent('<div>' + marker.title + '</div>');
//         infowindow.open(map, marker);
//         // Make sure the marker property is cleared if the infowindow is closed.
//         infowindow.addListener('closeclick', function() {
//             infowindow.marker = null;
//         });
//     }
// }


// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infowindow.setContent('');
        infowindow.marker = marker;
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 100;
        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options
        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infowindow.setContent('');
                infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent('<div>' + marker.title + '</div>' +
                    '<div>No Street View Found</div>');
            }
        }
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
    }
}
// // This function will loop through the markers array and display them all.
// function showListings() {
//     var bounds = new google.maps.LatLngBounds();
//     // Extend the boundaries of the map for each marker and display the marker
//     for (var i = 0; i < markers.length; i++) {
//         markers[i].setMap(map);
//         bounds.extend(markers[i].position);
//     }
//     map.fitBounds(bounds);
// }

// This function will loop through the listings and hide them all.
function hideListings(array) {
    for (var i = 0; i < array.length; i++) {
        array[i].setMap(null);
    }
}

function zoomToArea(addressValue) {
    var deferred = $.Deferred();
    // Initialize the geocoder.
    var geocoder = new google.maps.Geocoder();
    // Get the address or place that the user entered.
    var address = addressValue;
    // Make sure the address isn't blank.
    if (address == '') {
        window.alert('You must enter an area, or address.');
        deferred.reject({ status: false, 'results': [] })
    } else {
        // Geocode the address/area entered to get the center. Then, center the map
        // on it and zoom in
        geocoder.geocode({
            address: address
            ,
            componentRestrictions: { country: 'India', locality: 'New Delhi' }
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                // map.setCenter(results[0].geometry.location);
                // map.setZoom(15);
                deferred.resolve({ status: true, results: results });
            } else {
                deferred.reject({ status: false, 'results': [] })
                window.alert('We could not find that location - try entering a more' +
                    ' specific place.');
            }
        });
    }

    return deferred.promise();
}


// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}
$(window).resize(function() {
    google.maps.event.trigger(map, "resize");
});