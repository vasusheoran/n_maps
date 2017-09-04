// Blank array for all the filtered markers
var markers_filter = [];

function resizeMap() {
    document.getElementById("map");
    google.maps.event.trigger(map, "resize");
}

// This function will loop through the markers array and display them all.
function showListings(value) {

    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < value.length; i++) {
        value[i].setMap(map);
        bounds.extend(value[i].position);
    }
    map.fitBounds(bounds);
}

// This function is used for class bindings
function viewModel() {
    var self = this;

    // If the filter window is to be shown
    self.shouldShowMessage = ko.observable(true);
    self.showWindow = function() {
        self.shouldShowMessage(!self.shouldShowMessage());
        resizeMap();
    }
    self.optionStatus = ko.pureComputed(function() {
        var width = $(window).width();
        if (width > 529) {

            return self.shouldShowMessage() ? "options-box" : "options-box-hide";
        } else {

            return self.shouldShowMessage() ? "options-box" : "options-box-hide-with-filter";
        }
    }, viewModel);
    self.mapStatus = ko.pureComputed(function() {

        var width = $(window).width();

        if (width > 529) {
            return self.shouldShowMessage() ? "map_wrapper" : "map-only";
        } else {

            return !self.shouldShowMessage() ? "map_wrapper-with-filter" : "map-only";
        }
    }, viewModel);
};

//This function is used for binding user data such as filtered location.
function mapsModel() {
    var self = this;
    self.filterLocation = ko.observable();
    self.isListVisible = ko.observable(false);
    self.items = ko.observableArray();
    self.throttledFilterLocation = ko.computed(self.filterLocation)
        .extend({ rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });
    self.throttledFilterLocation.subscribe(function(newValue) {

        if (self.filterLocation().length <= 0) {
            return;
        }

        self.items([]);
        markers_filter = [];
        zoomToArea(newValue).then(function(response) {
            if (response.status) {

                var list = response.results;

                var largeInfowindow = new google.maps.InfoWindow();
                var defaultIcon = makeMarkerIcon('0091ff');

                // Create a "highlighted location" marker color for when the user
                // mouses over the marker.
                var highlightedIcon = makeMarkerIcon('FFFF24');


                for (var index in list) {
                    var add
                    var item = {
                        location: list[index].geometry.location,
                        address: list[index].formatted_address
                    }

                    var marker = new google.maps.Marker({
                        position: list[index].geometry.location,
                        title: list[index].address_components[0].short_name,
                        animation: google.maps.Animation.DROP,
                        id: index,
                        icon:defaultIcon
                    });


                    markers_filter.push(marker);
                    marker.addListener('click', function() {
                        populateInfoWindow(this, largeInfowindow);
                    });
                    // Two event listeners - one for mouseover, one for mouseout,
                    // to change the colors back and forth.
                    marker.addListener('mouseover', function() {
                        this.setIcon(highlightedIcon);
                    });
                    marker.addListener('mouseout', function() {
                        this.setIcon(defaultIcon);
                    });
                    self.items.push(item);
                }

                showListings(markers_filter);
                self.isListVisible(true);
            } else {
                alert('Ooppsss, Something Went wrong!!')
            }
        });
    });
    self.selectedItem = function() {
        var location = { lat: this.location.lat(), lng: this.location.lng() }

        map.setCenter(location);
        map.setZoom(15);
        // var marker = new google.maps.Marker({
        //     position: location,
        //     map: map,
        //     title: this.address,
        //     animation: google.maps.Animation.DROP,
        //     id: 1
        // });
        self.items([]);
        self.isListVisible(false);
        self.filterLocation('');
    }

    self.showListings = function() {
        showListings(markers);
        if (markers_filter.length)
            showListings(markers_filter);

    }
    self.hideListings = function() {
        debugger;
        if (markers.length)
            hideListings(markers);

        // If filtered locations are present then clear
        if (markers_filter.length) {
            hideListings(markers_filter);
            markers_filter = [];
            self.items([]);
            self.isListVisible(false);
            self.filterLocation('');
        }
    }
};

// var myObservableArray = ko.observableArray(); 

var rootModel = {
    view: new viewModel(),
    maps: new mapsModel()
}
ko.applyBindings(rootModel);
// ko.applyBindings(new mapsModel());

$(window).resize(function() {
    resizeMap();
});