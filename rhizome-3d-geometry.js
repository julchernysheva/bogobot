import { RHIZOME_3D_GEOMETRY_1 } from "./rhizome-3d-geometry-1.js"
import { RHIZOME_3D_GEOMETRY_2 } from "./rhizome-3d-geometry-2.js"
import { RHIZOME_3D_GEOMETRY_3 } from "./rhizome-3d-geometry-3.js"

export const RHIZOME_3D_GEOMETRY=Object.freeze({
  ...RHIZOME_3D_GEOMETRY_1,
  ...RHIZOME_3D_GEOMETRY_2,
  ...RHIZOME_3D_GEOMETRY_3
})

if(Object.keys(RHIZOME_3D_GEOMETRY).length!==153) throw new Error(`BOGOBOT geometry invariant failed: ${Object.keys(RHIZOME_3D_GEOMETRY).length}`)
