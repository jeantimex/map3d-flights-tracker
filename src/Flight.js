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

function getColorFromLongitude(longitude) {
  // Normalize longitude (-180 to +180) to hue (0 to 1)
  const hue = ((longitude + 180) % 360) / 360;

  // Convert HSL to RGB
  // Using fixed saturation (0.8) and lightness (0.6) for good visibility
  const saturation = 0.8;
  const lightness = 0.6;

  // HSL to RGB conversion
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs((hue * 6) % 2 - 1));
  const m = lightness - c / 2;

  let r, g, b;
  if (hue < 1/6) {
    r = c; g = x; b = 0;
  } else if (hue < 2/6) {
    r = x; g = c; b = 0;
  } else if (hue < 3/6) {
    r = 0; g = c; b = x;
  } else if (hue < 4/6) {
    r = 0; g = x; b = c;
  } else if (hue < 5/6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  // Convert to 0-255 range and return hex color
  const red = Math.round((r + m) * 255);
  const green = Math.round((g + m) * 255);
  const blue = Math.round((b + m) * 255);

  return `rgb(${red}, ${green}, ${blue})`;
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

    // Calculate color based on departure longitude
    const flightColor = getColorFromLongitude(this.departure.lng);

    // Create polyline
    this.polyline = new Polyline3DElement({
      path: [
        { lat: this.departure.lat, lng: this.departure.lng, altitude: 1000 },
        { lat: this.arrival.lat, lng: this.arrival.lng, altitude: 1000 },
      ],
      strokeColor: flightColor,
      strokeWidth: 2,
      altitudeMode: AltitudeMode.ABSOLUTE,
    });

    // Animation state
    this.animationProgress = 0;
    // Use random speed between 6-12 seconds for animation duration
    this.baseAnimationDuration = Math.random() * 6000 + 6000; // 6-12 seconds
    this.animationDuration = this.baseAnimationDuration;
    this.waitDuration = 500; // 0.5 seconds wait
    this.startTime = null;
    this.currentPhase = 'flying-to-arrival';
    this.isReverse = false;
    this.speedMultiplier = 1.0;
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

  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = multiplier;
    this.animationDuration = this.baseAnimationDuration / multiplier;
  }
}