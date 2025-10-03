export class Plane {
  constructor(Model3DElement, initialPosition, initialHeading) {
    this.model = new Model3DElement({
      src: '/plane.glb',
      position: initialPosition,
      orientation: { heading: initialHeading, tilt: 270, roll: 90 },
      scale: 20000,
      altitudeMode: "ABSOLUTE",
    });
  }

  updatePosition(position, heading) {
    this.model.position = position;
    this.model.orientation = { heading, tilt: 270, roll: 90 };
  }

  getModel() {
    return this.model;
  }
}