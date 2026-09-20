import { RHIZOME_3D_SOURCE_NODE_IDS } from "./rhizome-3d-source-nodes.js"
import { RHIZOME_3D_SOURCE_EDGE_ROWS_1 } from "./rhizome-3d-source-edges-1.js"
import { RHIZOME_3D_SOURCE_EDGE_ROWS_2 } from "./rhizome-3d-source-edges-2.js"
import { RHIZOME_3D_SOURCE_EDGE_ROWS_3 } from "./rhizome-3d-source-edges-3.js"

export { RHIZOME_3D_SOURCE_NODE_IDS }

export const RHIZOME_3D_SOURCE_EDGES=Object.freeze(
  [...RHIZOME_3D_SOURCE_EDGE_ROWS_1,...RHIZOME_3D_SOURCE_EDGE_ROWS_2,...RHIZOME_3D_SOURCE_EDGE_ROWS_3]
    .map(([source,target,primary])=>Object.freeze({
      source,
      target,
      importance:primary?"PRIMARY":"SECONDARY",
      kind:primary?"structural":"trace"
    }))
)

if(RHIZOME_3D_SOURCE_NODE_IDS.length!==153) throw new Error(`BOGOBOT source node invariant failed: ${RHIZOME_3D_SOURCE_NODE_IDS.length}`)
if(RHIZOME_3D_SOURCE_EDGES.length!==598) throw new Error(`BOGOBOT source edge invariant failed: ${RHIZOME_3D_SOURCE_EDGES.length}`)
