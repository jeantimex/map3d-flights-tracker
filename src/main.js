import './style.css'
import { flights } from './Data.js'
import { Flight } from './Flight.js'
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

async function init() {
  // Set the options for loading the API.
  setOptions({ key: `${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`, v: "beta" });

  // Import the needed libraries.
  const { Map3DElement, Model3DElement, Polyline3DElement, AltitudeMode } = await importLibrary("maps3d");
  const map = new Map3DElement({
      center: { lat: 0, lng: 0, altitude: 9000 }, range: 9283149, tilt: 0, heading: 0,
      mode: "HYBRID",
  });

  // Create flight instances
  const flight1 = new Flight(flights[0], Model3DElement, Polyline3DElement, AltitudeMode);
  const flight2 = new Flight(flights[1], Model3DElement, Polyline3DElement, AltitudeMode);

  const allFlights = [flight1, flight2];

  document.body.append(map);

  // Add all flights to the map
  allFlights.forEach(flight => {
    map.append(flight.getPlaneModel());
    map.append(flight.getPolyline());
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