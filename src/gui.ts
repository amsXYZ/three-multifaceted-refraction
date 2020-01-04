import {
  BoxBufferGeometry,
  Color,
  DodecahedronBufferGeometry,
  IcosahedronBufferGeometry,
  OctahedronBufferGeometry,
  PlaneBufferGeometry,
  SphereBufferGeometry,
  TetrahedronBufferGeometry,
  TorusBufferGeometry,
  TorusKnotBufferGeometry
} from "three";

// tslint:disable:no-var-requires
const guify = require("guify");
// tslint:enable:no-var-requires

export function createGUI(options: any, target: any) {
  const gui = new guify({
    title: "AMS - Multifaceted Refraction",
    align: "right",
    barMode: "above"
  });
  gui.Register({
    type: "folder",
    label: "Properties"
  });
  gui.Register({
    type: "color",
    label: "Color",
    folder: "Properties",
    format: "hex",
    object: options,
    property: "color",
    onChange: (value: string) => {
      (target.material.uniforms.color.value as Color).setHex(
        Number("0x" + value.substr(1))
      );
    }
  });
  gui.Register({
    type: "range",
    label: "Refraction Index",
    folder: "Properties",
    min: 1.0,
    max: 4.0,
    object: options,
    property: "refractionIndex",
    onChange: (value: number) => {
      target.material.uniforms.refractionIndex.value = value;
    }
  });
  gui.Register({
    type: "range",
    label: "Dispersion",
    folder: "Properties",
    min: 0.0,
    max: 1.0,
    object: options,
    property: "dispersion",
    onChange: (value: string) => {
      target.material.uniforms.dispersion.value = value;
    }
  });
  gui.Register({
    type: "range",
    label: "Roughness",
    folder: "Properties",
    min: 0.0,
    max: 1.0,
    object: options,
    property: "roughness",
    onChange: (value: string) => {
      target.material.uniforms.roughness.value = value;
    }
  });
  gui.Register({
    type: "select",
    label: "Geometry",
    options: [
      "plane",
      "tetrahedron",
      "cube",
      "octahedron",
      "dodecahedron",
      "icosahedron",
      "sphere",
      "torus",
      "knot"
    ],
    object: options,
    property: "geometry",
    onChange: (value: string) => {
      target.mesh.geometry.dispose();
      target.backMesh.geometry.dispose();
      let geom;
      switch (value) {
        case "plane":
          geom = new PlaneBufferGeometry();
          break;
        case "tetrahedron":
          geom = new TetrahedronBufferGeometry();
          break;
        case "cube":
          geom = new BoxBufferGeometry();
          break;
        case "octahedron":
          geom = new OctahedronBufferGeometry();
          break;
        case "dodecahedron":
          geom = new DodecahedronBufferGeometry();
          break;
        case "icosahedron":
          geom = new IcosahedronBufferGeometry();
          break;
        case "sphere":
          geom = new SphereBufferGeometry(1, 16, 16);
          break;
        case "torus":
          geom = new TorusBufferGeometry(1, 0.5, 16, 32);
          break;
        case "knot":
          geom = new TorusKnotBufferGeometry(1, 0.33, 64, 32);
          break;
      }
      target.mesh.geometry = geom;
      target.backMesh.geometry = geom;
      // value ? target.animation.play() : target.animation.pause();
    }
  });
  gui.Register({
    type: "checkbox",
    label: "Animation",
    object: options,
    property: "animation",
    onChange: (value: boolean) => {
      value ? target.animation.play() : target.animation.pause();
    }
  });
}
