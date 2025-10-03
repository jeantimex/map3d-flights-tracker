import './style.css'
import { flights } from './Data.js'
import { Flight } from './Flight.js'
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { GUI } from 'dat.gui';

async function init() {
  // Set the options for loading the API.
  setOptions({ key: `${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`, v: "beta" });

  // Import the needed libraries.
  const { Map3DElement, Model3DElement, Polyline3DElement, AltitudeMode } = await importLibrary("maps3d");
  const map = new Map3DElement({
      center: { lat: 0, lng: 0, altitude: 9000 }, range: 9283149, tilt: 0, heading: 0,
      mode: "HYBRID",
  });

  // Control parameters
  const params = {
    numberOfFlights: 100,
    speedMultiplier: 1
  };

  let allFlights = [];

  function createFlights(count) {
    // Remove existing flights from map
    allFlights.forEach(flight => {
      map.removeChild(flight.getPlaneModel());
      map.removeChild(flight.getPolyline());
    });

    // Create new flights
    allFlights = [];
    for (let i = 0; i < Math.min(count, flights.length); i++) {
      const flight = new Flight(flights[i], Model3DElement, Polyline3DElement, AltitudeMode);
      flight.setSpeedMultiplier(params.speedMultiplier);
      allFlights.push(flight);
      map.append(flight.getPlaneModel());
      map.append(flight.getPolyline());
    }
  }

  // Initialize with default flights
  createFlights(params.numberOfFlights);

  document.body.append(map);

  // Setup dat.GUI
  const gui = new GUI();
  gui.add(params, 'numberOfFlights', 1, 500, 1)
     .name('Number of Flights')
     .onChange((value) => {
       createFlights(value);
     });

  gui.add(params, 'speedMultiplier', 0.1, 2, 0.1)
     .name('Speed Multiplier')
     .onChange((value) => {
       allFlights.forEach(flight => {
         flight.setSpeedMultiplier(value);
       });
     });

  function animate(currentTime) {
    allFlights.forEach(flight => {
      flight.update(currentTime);
    });
    requestAnimationFrame(animate);
  }

  // Start animation
  map.addEventListener('gmp-steadychange', (e) => {
    if (e.isSteady) {
      requestAnimationFrame(animate);
    }
  });
}

init();