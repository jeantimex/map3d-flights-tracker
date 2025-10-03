import { Plane } from './Plane.js';

function interpolatePosition(start, end, t) {
  const lat = start.lat + (end.lat - start.lat) * t;
  const lng = start.lng + (end.lng - start.lng) * t;

  // Create a curved path by adding altitude variation
  const maxAltitude = 5000;
  const altitude = Math.sin(t * Math.PI) * maxAltitude + 1000;

  return { lat, lng, altitude };
}

function calculateHeading(from, to) {
  const dLng = to.lng - from.lng;
  const dLat = to.lat - from.lat;
  return Math.atan2(dLng, dLat) * (180 / Math.PI);
}

export class Flight {
  constructor(flightData, Model3DElement, Polyline3DElement, AltitudeMode) {
    this.flightData = flightData;
    this.departure = { lat: flightData.departure.lat, lng: flightData.departure.lng, altitude: 1000 };
    this.arrival = { lat: flightData.arrival.lat, lng: flightData.arrival.lng, altitude: 1000 };

    // Calculate initial heading and rotate 90 degrees clockwise
    this.initialHeading = calculateHeading(this.departure, this.arrival) + 90;

    // Create plane
    this.plane = new Plane(Model3DElement, this.departure, this.initialHeading);

    // Create polyline
    this.polyline = new Polyline3DElement({
      path: [
        { lat: this.departure.lat, lng: this.departure.lng, altitude: 1000 },
        { lat: this.arrival.lat, lng: this.arrival.lng, altitude: 1000 },
      ],
      strokeColor: 'blue',
      strokeWidth: 2,
      altitudeMode: AltitudeMode.ABSOLUTE,
    });

    // Animation state
    this.animationProgress = 0;
    // Use random speed between 2-8 seconds for animation duration
    this.animationDuration = Math.random() * 6000 + 2000; // 2-8 seconds
    this.waitDuration = 500; // 0.5 seconds wait
    this.startTime = null;
    this.currentPhase = 'flying-to-arrival';
    this.isReverse = false;
  }

  update(currentTime) {
    if (!this.startTime) this.startTime = currentTime;
    const elapsed = currentTime - this.startTime;

    if (this.currentPhase === 'flying-to-arrival' || this.currentPhase === 'flying-to-departure') {
      this.animationProgress = Math.min(elapsed / this.animationDuration, 1);

      // Determine start and end points based on direction
      const start = this.isReverse ? this.arrival : this.departure;
      const end = this.isReverse ? this.departure : this.arrival;

      // Interpolate position along the curved path
      const currentPosition = interpolatePosition(start, end, this.animationProgress);

      // Calculate heading for the plane orientation
      const heading = this.isReverse ? this.initialHeading + 180 : this.initialHeading;

      // Update plane position and orientation
      this.plane.updatePosition(currentPosition, heading);

      // Check if flight is complete
      if (this.animationProgress >= 1) {
        if (this.currentPhase === 'flying-to-arrival') {
          this.currentPhase = 'waiting-at-arrival';
        } else {
          this.currentPhase = 'waiting-at-departure';
        }
        this.startTime = currentTime; // Reset timer for wait phase
      }
    } else if (this.currentPhase === 'waiting-at-arrival' || this.currentPhase === 'waiting-at-departure') {
      // Wait for 2 seconds
      if (elapsed >= this.waitDuration) {
        if (this.currentPhase === 'waiting-at-arrival') {
          this.currentPhase = 'flying-to-departure';
          this.isReverse = true;
        } else {
          this.currentPhase = 'flying-to-arrival';
          this.isReverse = false;
        }
        this.animationProgress = 0;
        this.startTime = currentTime; // Reset timer for flight phase
      }
    }
  }

  getPlaneModel() {
    return this.plane.getModel();
  }

  getPolyline() {
    return this.polyline;
  }
}