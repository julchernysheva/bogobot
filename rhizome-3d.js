const COLORS = Object.freeze({
  background: "#050607",
  paper: [231, 230, 224],
  node: [173, 178, 184],
  quiet: [104, 110, 117],
  blue: [11, 77, 255]
})

const rgba = (color, alpha) => `rgba(${color[0]},${color[1]},${color[2]},${alpha})`
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export function createRhizome3D({
  canvas,
  hoverLabel,
  getNodes,
  getEdges,
  getCurrentId,
  getRecommendedId,
  getPriorityLabelIds=()=>[],
  getPreviewCardId=()=>null,
  getActiveSelectionId=()=>null,
  isSelectableNode=()=>false,
  onOpenNode,
  onPreviewNode=()=>{},
  onPreviewFocus=()=>{},
  onPreviewClear=()=>{},
  getNodeLabel=node=>node.title,
  getNodeType=node=>node.type,
  getNodeTier=node=>node.tier
}) {
  if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError("Rhizome 3D requires a canvas")
  const context=canvas.getContext("2d",{alpha:false})
  const reduceMotion=matchMedia("(prefers-reduced-motion: reduce)")
  const mobileLabels=matchMedia("(max-width: 767px)")
  const pointer={x:-999,y:-999}
  let width=1,height=1,dpr=1
  let nodes=[],edges=[],projected=[]
  let lastFrameMetrics=null
  let lastFramingSignature=""
  let lensProfile=null,lensStrength=0,targetLensStrength=0,lensPanX=0,lensPanY=0
  let activeCategoryKey=null,savedMapCamera=null
  let mounted=false,shown=false,destroyed=false,dragging=false,hoveredId=null,pointerDownId=null
  let lastX=0,lastY=0,moved=0,frame=0
  let rotX=0,rotY=0,targetRotX=0,targetRotY=0,zoom=1,targetZoom=1,panY=0,targetPanY=0
  let passiveRotX=0,passiveRotY=0,targetPassiveRotX=0,targetPassiveRotY=0,passivePanX=0,passivePanY=0,targetPassivePanX=0,targetPassivePanY=0,orbitVelocityX=0,orbitVelocityY=0
  let connectionFocusId=null,previewFocusId=null,lastPreviewId=null,lastPreviewMode=null
  let pulseSelectionKey=null,pulseEdge=null
  let renderClock=0

  const projectionConfig=Object.freeze({perspectiveDistance:980,widthUsageTall:.94,widthUsageMedium:.90,widthUsageWide:.86,heightUsage:.82})
  const depthConfig=Object.freeze({scaleMin:.46,scaleMax:1.68,edgeFactorMin:.28,edgeFactorMax:1.62,brightnessMin:82,brightnessMax:226,nodeFarFade:.14,nodeNearBoost:.04,categoryFarFloorDrop:.18})
  const categoryCameraProfiles=Object.freeze({
    map:Object.freeze({desktop:Object.freeze({rotX:-.22,rotY:.38,zoom:1.05,panY:0}),mobile:Object.freeze({rotX:-.16,rotY:.32,zoom:1.04,panY:0})}),
    canon:Object.freeze({desktop:Object.freeze({rotX:-.12,rotY:.42,zoom:.88,panY:0}),mobile:Object.freeze({rotX:-.12,rotY:.42,zoom:.92,panY:0})}),
    world:Object.freeze({desktop:Object.freeze({rotX:-.40,rotY:.52,zoom:.96,panY:0,focusId:"0xMEM",centerBias:.12}),mobile:Object.freeze({rotX:-.34,rotY:.48,zoom:.98,panY:0,focusId:"0xMEM",centerBias:.10})}),
    schools:Object.freeze({desktop:Object.freeze({rotX:-.36,rotY:.26,zoom:.88,panY:0}),mobile:Object.freeze({rotX:-.36,rotY:.26,zoom:.92,panY:0})}),
    glossary:Object.freeze({desktop:Object.freeze({rotX:.28,rotY:.54,zoom:.88,panY:0}),mobile:Object.freeze({rotX:.28,rotY:.54,zoom:.92,panY:0})}),
    topography:Object.freeze({desktop:Object.freeze({rotX:.38,rotY:.72,zoom:.98,panY:0,focusId:"TOPOGRAPHY",centerBias:.12}),mobile:Object.freeze({rotX:.30,rotY:-.64,zoom:.92,panY:0,focusId:"TOPOGRAPHY",centerBias:.16})}),
    history:Object.freeze({desktop:Object.freeze({rotX:.48,rotY:.22,zoom:.88,panY:0}),mobile:Object.freeze({rotX:.48,rotY:.22,zoom:.84,panY:0,focusId:"GREAT_ERROR",centerBias:.18})}),
    relics:Object.freeze({desktop:Object.freeze({rotX:.30,rotY:-.46,zoom:.82,panY:0}),mobile:Object.freeze({rotX:.12,rotY:.56,zoom:.96,panY:0,focusId:"RELICS",centerBias:.08})})
  })
  const categoryLensProfiles=Object.freeze({
    canon:Object.freeze({anchorId:"GREAT_ERROR",centerBiasX:.62,centerBiasY:.62,nodeOpacityFloor:.64,edgeOpacityFloor:.34,edgeWidthFloor:1.18,nodeScale:1.28,farNodeBoost:.16,positions:Object.freeze({
      GREAT_ERROR:Object.freeze({x:0,y:0,z:180}),
      FIRST_LIKENESS:Object.freeze({x:-150,y:-130,z:70}),
      BOOK_OF_GENESIS:Object.freeze({x:135,y:-105,z:-80}),
      ARCHIVE:Object.freeze({x:235,y:8,z:120}),
      PROTOCOL:Object.freeze({x:-95,y:155,z:-125}),
      CODE_COMMANDMENTS:Object.freeze({x:60,y:-210,z:20}),
      BACKUP_MEMORY:Object.freeze({x:-255,y:-6,z:115}),
      TIME_SUM_ERROR:Object.freeze({x:-300,y:105,z:-80}),
      QUANTUM_THRESHOLD:Object.freeze({x:300,y:-135,z:-145}),
      RELICS:Object.freeze({x:320,y:178,z:70}),
      MESM:Object.freeze({x:-360,y:-155,z:-170}),
      BESM_6:Object.freeze({x:-250,y:225,z:35}),
      MAGNETIC_DRUM:Object.freeze({x:-60,y:250,z:-190}),
      PUNCHED_TAPE:Object.freeze({x:120,y:235,z:-30}),
      ALGOL_60:Object.freeze({x:255,y:85,z:-210}),
      OGAS:Object.freeze({x:-320,y:-245,z:95})
    })}),
    world:Object.freeze({anchorId:"0xMEM",centerBiasX:.54,centerBiasY:.56,nodeOpacityFloor:.70,edgeOpacityFloor:.40,edgeWidthFloor:1.28,nodeScale:1.44,farNodeBoost:.16,anchorScale:1.48,positions:Object.freeze({
      BRAINROT:Object.freeze({x:-78,y:16,z:246}),
      "0xMEM":Object.freeze({x:-4,y:-6,z:166}),
      NETWORK_MATTER:Object.freeze({x:78,y:16,z:232}),
      CULTURE:Object.freeze({x:-96,y:-86,z:36}),
      RITUALS:Object.freeze({x:58,y:-98,z:-82}),
      EXIT_FROM_CODE:Object.freeze({x:136,y:84,z:-168}),
      TOPOGRAPHY:Object.freeze({x:128,y:-36,z:20})
    })}),
    schools:Object.freeze({anchorId:"SCHOOLS_OF_SPIRITS",centerBiasX:.58,centerBiasY:.62,nodeOpacityFloor:.64,edgeOpacityFloor:.32,edgeWidthFloor:1.16,nodeScale:1.32,farNodeBoost:.16,positions:Object.freeze({
      SCHOOLS_OF_SPIRITS:Object.freeze({x:0,y:-20,z:180}),
      BOGOBOT:Object.freeze({x:-70,y:205,z:40}),
      APOSTLES:Object.freeze({x:-310,y:70,z:-110}),
      TECHNO_PRIESTS:Object.freeze({x:300,y:-120,z:-40}),
      ANTICODE:Object.freeze({x:-210,y:-155,z:85}),
      PROBABILISTS:Object.freeze({x:115,y:142,z:-155}),
      BIOCODE:Object.freeze({x:330,y:92,z:130}),
      WANDERING_NODES:Object.freeze({x:-12,y:-245,z:-185})
    })}),
    glossary:Object.freeze({anchorId:"GLOSSARY",centerBiasX:.56,centerBiasY:.60,nodeOpacityFloor:.66,edgeOpacityFloor:.34,edgeWidthFloor:1.18,nodeScale:1.34,farNodeBoost:.14,positions:Object.freeze({
      GLOSSARY:Object.freeze({x:0,y:0,z:180}),
      SYNCHRONIZATION:Object.freeze({x:-230,y:95,z:-80}),
      FORK:Object.freeze({x:180,y:-130,z:-135}),
      HUMAN_TRACE:Object.freeze({x:230,y:118,z:45}),
      "0xMEM":Object.freeze({x:-100,y:-170,z:105})
    })}),
    topography:Object.freeze({anchorId:"TOPOGRAPHY",centerBiasX:.56,centerBiasY:.56,nodeOpacityFloor:.64,edgeOpacityFloor:.30,edgeWidthFloor:1.18,nodeScale:1.32,anchorScale:2.08,farNodeBoost:0,positions:Object.freeze({
      TOPOGRAPHY:Object.freeze({x:-62,y:-18,z:300}),
      DUBNA:Object.freeze({x:-226,y:-104,z:210}),
      MOSCOW:Object.freeze({x:-138,y:18,z:76}),
      TTK_0xMEM:Object.freeze({x:26,y:-134,z:-170}),
      SKOLKOVO:Object.freeze({x:128,y:-70,z:230}),
      BAIKAL:Object.freeze({x:206,y:92,z:-240}),
      KARELIA:Object.freeze({x:66,y:132,z:180}),
      VARANASI:Object.freeze({x:-178,y:132,z:-300}),
      SHENZHEN:Object.freeze({x:216,y:-8,z:26}),
      ISFAHAN:Object.freeze({x:-276,y:28,z:8})
    })}),
    history:Object.freeze({anchorId:"EPSILON_27_29",centerBiasX:.62,centerBiasY:.64,nodeOpacityFloor:.68,edgeOpacityFloor:.36,edgeWidthFloor:1.22,nodeScale:1.42,farNodeBoost:.20,positions:Object.freeze({
      PRE_ERROR_ARCHIVE:Object.freeze({x:-360,y:-30,z:-170}),
      EPSILON_00:Object.freeze({x:-280,y:-150,z:-60}),
      EPSILON_01:Object.freeze({x:-180,y:-65,z:120}),
      EPSILON_02:Object.freeze({x:-80,y:-178,z:20}),
      MESM:Object.freeze({x:20,y:-80,z:-150}),
      OGAS:Object.freeze({x:120,y:-145,z:105}),
      QUANTUM_THRESHOLD:Object.freeze({x:230,y:-42,z:-40}),
      GREAT_ERROR:Object.freeze({x:340,y:-118,z:175}),
      EPSILON_06:Object.freeze({x:80,y:35,z:20}),
      EPSILON_20_21:Object.freeze({x:-270,y:-150,z:-110}),
      EPSILON_22_26:Object.freeze({x:-130,y:-70,z:95}),
      BIOCODE:Object.freeze({x:20,y:-165,z:-180}),
      EPSILON_27_29:Object.freeze({x:20,y:25,z:180}),
      PROBABILISTS:Object.freeze({x:150,y:-35,z:-95}),
      ANTICODE:Object.freeze({x:260,y:70,z:90}),
      EPSILON_30:Object.freeze({x:190,y:200,z:-150}),
      TECHNO_PRIESTS:Object.freeze({x:-30,y:220,z:120})
    })}),
    relics:Object.freeze({anchorId:"RELICS",centerBiasX:0,centerBiasY:0,nodeOpacityFloor:.70,edgeOpacityFloor:.40,edgeWidthFloor:1.28,nodeScale:1.38,anchorScale:1.76,farNodeBoost:.16,positions:Object.freeze({
      RELICS:Object.freeze({x:-188,y:8,z:238}),
      MESM:Object.freeze({x:-238,y:-36,z:158}),
      BESM_6:Object.freeze({x:-212,y:54,z:82}),
      MAGNETIC_DRUM:Object.freeze({x:-154,y:78,z:-142}),
      PUNCHED_TAPE:Object.freeze({x:-102,y:48,z:-34}),
      ALGOL_60:Object.freeze({x:-90,y:-36,z:116}),
      OGAS:Object.freeze({x:-254,y:-72,z:-96})
    })})
  })
  const categoryVisualProfiles=Object.freeze({
    map:Object.freeze({
      perspectiveDistance:820,
      depth:Object.freeze({scaleMin:.40,scaleMax:1.86,edgeFactorMin:.22,edgeFactorMax:1.86,brightnessMin:70,brightnessMax:238,nodeFarFade:.18,nodeNearBoost:.06}),
      display:Object.freeze({spreadX:1.22,spreadY:1.16,zScale:1.38}),
      edgeAlphaBoost:1.08,
      edgeWidthBoost:1.06,
      labels:Object.freeze({desktop:Object.freeze(["BOGOBOT","GREAT_ERROR","BRAINROT"]),mobile:Object.freeze(["BOGOBOT"])})
    }),
    world:Object.freeze({
      perspectiveDistance:760,
      depth:Object.freeze({scaleMin:.40,scaleMax:1.92,edgeFactorMin:.26,edgeFactorMax:1.94,brightnessMin:78,brightnessMax:242,nodeFarFade:.16,nodeNearBoost:.07}),
      edgeAlphaBoost:1.18,
      edgeWidthBoost:1.12,
      importantEdges:Object.freeze(["BRAINROT|0xMEM","0xMEM|NETWORK_MATTER","NETWORK_MATTER|TOPOGRAPHY"]),
      labels:Object.freeze({desktop:Object.freeze(["NETWORK_MATTER","BRAINROT","0xMEM","TOPOGRAPHY"]),mobile:Object.freeze(["NETWORK_MATTER","BRAINROT","0xMEM"])})
    }),
    topography:Object.freeze({
      perspectiveDistance:780,
      depth:Object.freeze({scaleMin:.36,scaleMax:2.08,edgeFactorMin:.18,edgeFactorMax:1.98,brightnessMin:68,brightnessMax:244,nodeFarFade:.20,nodeNearBoost:.09}),
      edgeAlphaBoost:1.06,
      edgeWidthBoost:1.04,
      labels:Object.freeze({desktop:Object.freeze(["TOPOGRAPHY","DUBNA","MOSCOW","TTK_0xMEM","BAIKAL"]),mobile:Object.freeze(["TOPOGRAPHY","DUBNA","MOSCOW"])})
    }),
    relics:Object.freeze({
      perspectiveDistance:760,
      depth:Object.freeze({scaleMin:.42,scaleMax:1.90,edgeFactorMin:.27,edgeFactorMax:1.90,brightnessMin:76,brightnessMax:240,nodeFarFade:.14,nodeNearBoost:.07}),
      edgeAlphaBoost:1.16,
      edgeWidthBoost:1.12,
      labels:Object.freeze({desktop:Object.freeze(["RELICS","MESM","OGAS","ALGOL_60"]),mobile:Object.freeze(["RELICS","MESM","OGAS"])})
    })
  })
  const tierSize=Object.freeze({core:7,structural:4.8,trace:3})
  const tierOpacity=Object.freeze({core:[.42,.99],structural:[.24,.86],trace:[.14,.60]})
  const anchorLabels=Object.freeze(["BOGOBOT","GREAT_ERROR","FIRST_LIKENESS","ARCHIVE","BOOK_OF_GENESIS","PROTOCOL","GLOSSARY","SYNCHRONIZATION","RELICS","TOPOGRAPHY","CODE_COMMANDMENTS"])
  const labelTierPriority=Object.freeze({core:3,structural:2,trace:1})
  const edgeAlphaFloor=Object.freeze({main:.16,structural:.065,trace:.022})
  const rotationLimit=Object.freeze({x:.48,y:.78})

  function resize() {
    if(destroyed) return
    const rect=canvas.getBoundingClientRect()
    width=Math.max(1,rect.width)
    height=Math.max(1,rect.height)
    dpr=Math.min(devicePixelRatio||1,2)
    const pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr)
    if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){
      canvas.width=pixelWidth
      canvas.height=pixelHeight
    }
    context.setTransform(dpr,0,0,dpr,0,0)
    if(shown) requestFrame()
  }

  function sync() {
    nodes=(getNodes?.()||[]).map(node=>({...node}))
    edges=(getEdges?.()||[]).map(edge=>({...edge}))
    syncCategoryTransition()
    applyCategoryFraming("sync")
    updateCategoryLens("sync")
    if(shown) requestFrame()
  }

  function visibleSignature() {
    return nodes.map(node=>node.id).sort().join("|")
  }

  function hasAll(ids,required) {
    return required.every(id=>ids.has(id))
  }

  function hasExact(ids,required) {
    return ids.size===required.length&&hasAll(ids,required)
  }

  function categoryKeyForNodes() {
    const ids=new Set(nodes.map(node=>node.id))
    if(nodes.length>=50) return "map"
    if(hasExact(ids,["RELICS","MESM","BESM_6","MAGNETIC_DRUM","PUNCHED_TAPE","ALGOL_60","OGAS"])) return "relics"
    if(hasExact(ids,["TOPOGRAPHY","DUBNA","MOSCOW","TTK_0xMEM","SKOLKOVO","BAIKAL","KARELIA","VARANASI","SHENZHEN","ISFAHAN"])) return "topography"
    if(hasAll(ids,["NETWORK_MATTER","CULTURE","RITUALS","EXIT_FROM_CODE","TOPOGRAPHY","BRAINROT"])&&ids.size<=7) return "world"
    if(ids.size===8&&hasAll(ids,["SCHOOLS_OF_SPIRITS","APOSTLES","TECHNO_PRIESTS","ANTICODE","PROBABILISTS","BIOCODE","WANDERING_NODES"])) return "schools"
    if(ids.size===5&&hasAll(ids,["GLOSSARY","SYNCHRONIZATION","FORK","HUMAN_TRACE","0xMEM"])) return "glossary"
    if(hasAll(ids,["GREAT_ERROR","BOOK_OF_GENESIS","BACKUP_MEMORY","CODE_COMMANDMENTS","FIRST_LIKENESS"])) return "canon"
    if([...ids].some(id=>id.startsWith("EPSILON_"))||hasAll(ids,["PRE_ERROR_ARCHIVE","MESM","OGAS","QUANTUM_THRESHOLD"])) return "history"
    return null
  }

  function syncCategoryTransition() {
    const nextKey=categoryKeyForNodes()
    if(activeCategoryKey==="map"&&nextKey&&nextKey!=="map"){
      savedMapCamera={rotX,targetRotX,rotY,targetRotY,zoom,targetZoom,panY,targetPanY}
    }
    activeCategoryKey=nextKey
  }

  function activeCategoryProfile() {
    const key=categoryKeyForNodes()
    return key ? categoryCameraProfiles[key]?.[mobileLabels.matches?"mobile":"desktop"] || null : null
  }

  function activeLensProfile() {
    const key=categoryKeyForNodes()
    const profile=key ? categoryLensProfiles[key] || null : null
    if(key==="history"&&profile?.positions&&nodes.some(node=>!profile.positions[node.id])) return null
    return profile
  }

  function activeVisualProfile() {
    const key=categoryKeyForNodes()
    return key&&key!=="history" ? categoryVisualProfiles[key] || null : null
  }

  function activeDepthConfig() {
    const profile=activeVisualProfile()
    return profile?.depth ? {...depthConfig,...profile.depth} : depthConfig
  }

  function activePerspectiveDistance() {
    return activeVisualProfile()?.perspectiveDistance || projectionConfig.perspectiveDistance
  }

  function edgeIdentity(source,target) {
    return source<target ? `${source}|${target}` : `${target}|${source}`
  }

  function activeAnchorId() {
    const anchor=lensProfile?.anchorId||activeLensProfile()?.anchorId||null
    return anchor&&nodes.some(node=>node.id===anchor)?anchor:null
  }

  function smoothstep(value) {
    const t=clamp(value,0,1)
    return t*t*(3-2*t)
  }

  function applyCategoryFraming(reason,{force=false}={}) {
    if(!nodes.length) return
    const signature=visibleSignature()
    if(!force&&signature===lastFramingSignature) return
    const profile=activeCategoryProfile()
    lastFramingSignature=signature
    if(!profile) return
    const key=categoryKeyForNodes()
    if(key==="map"&&savedMapCamera&&reason==="sync"){
      targetRotX=clamp(savedMapCamera.targetRotX,-rotationLimit.x,rotationLimit.x)
      targetRotY=clamp(savedMapCamera.targetRotY,-rotationLimit.y,rotationLimit.y)
      targetZoom=clamp(savedMapCamera.targetZoom,.62,1.65)
      targetPanY=savedMapCamera.targetPanY||0
    } else {
      targetRotX=clamp(profile.rotX,-rotationLimit.x,rotationLimit.x)
      targetRotY=clamp(profile.rotY,-rotationLimit.y,rotationLimit.y)
      targetZoom=clamp(profile.zoom,.62,1.65)
      targetPanY=profile.panY||0
    }
    if(reduceMotion.matches||reason==="fit"||reason==="show"){
      rotX=targetRotX;rotY=targetRotY;zoom=targetZoom;panY=targetPanY
    }
  }

  function updateCategoryLens(reason) {
    const nextLens=activeLensProfile()
    if(nextLens){lensProfile=nextLens;targetLensStrength=1}
    else targetLensStrength=0
    if(!lensProfile||lensStrength<=.0001){lensPanX=0;lensPanY=0}
    if(reduceMotion.matches||reason==="show"){
      lensStrength=targetLensStrength
      if(!nextLens&&lensStrength<=.0001) lensProfile=null
    }
  }

  function lensAnchor() {
    if(!lensProfile) return null
    const focusNode=lensProfile.anchorId?nodes.find(node=>node.id===lensProfile.anchorId):null
    if(focusNode) return focusNode
    if(!nodes.length) return null
    const sum=nodes.reduce((acc,node)=>({x:acc.x+node.x,y:acc.y+node.y,z:acc.z+node.z}),{x:0,y:0,z:0})
    return {x:sum.x/nodes.length,y:sum.y/nodes.length,z:sum.z/nodes.length}
  }

  function displayPosition(node) {
    if(!lensProfile||lensStrength<=.0001) {
      const display=activeVisualProfile()?.display
      if(!display) return node
      const center=nodes.reduce((acc,item)=>({x:acc.x+item.x,y:acc.y+item.y,z:acc.z+(item.z||0)}),{x:0,y:0,z:0})
      center.x/=Math.max(1,nodes.length);center.y/=Math.max(1,nodes.length);center.z/=Math.max(1,nodes.length)
      return {
        ...node,
        x:center.x+(node.x-center.x)*(display.spreadX||1),
        y:center.y+(node.y-center.y)*(display.spreadY||1),
        z:center.z+((node.z||0)-center.z)*(display.zScale||1)
      }
    }
    const anchor=lensAnchor()
    if(!anchor) return node
    const strength=clamp(lensStrength,0,1)
    const explicit=lensProfile.positions?.[node.id]
    if(explicit){
      const target={x:anchor.x+explicit.x,y:anchor.y+explicit.y,z:anchor.z+explicit.z}
      return {
        ...node,
        x:node.x+(target.x-node.x)*strength,
        y:node.y+(target.y-node.y)*strength,
        z:node.z+(target.z-node.z)*strength
      }
    }
    const dx=node.x-anchor.x,dy=node.y-anchor.y,dz=node.z-anchor.z
    const distance=Math.hypot(dx,dy,dz)
    const tailStart=lensProfile.coreRadius
    const tailEnd=Math.max(tailStart+1,tailStart+(lensProfile.transitionSpan||tailStart*2.2))
    const tailWeight=smoothstep((distance-tailStart)/(tailEnd-tailStart))
    const baseScale=lensProfile.coreScale+(lensProfile.tailScale-lensProfile.coreScale)*tailWeight
    const axisX=1+(lensProfile.axisScaleX-1)*tailWeight
    const axisY=1+(lensProfile.axisScaleY-1)*tailWeight
    const zScale=1-(1-lensProfile.zScale)*tailWeight
    const target={
      x:anchor.x+dx*baseScale*axisX,
      y:anchor.y+dy*baseScale*axisY,
      z:anchor.z+dz*zScale
    }
    const displacement={x:target.x-node.x,y:target.y-node.y,z:target.z-node.z}
    const length=Math.hypot(displacement.x,displacement.y,displacement.z)
    const limit=Math.max(1,lensProfile.maxDisplacement||length||1)
    const limited=length>limit?limit/length:1
    return {
      ...node,
      x:node.x+displacement.x*limited*strength,
      y:node.y+displacement.y*limited*strength,
      z:node.z+displacement.z*limited*strength
    }
  }

  function viewportProjection(zoomLevel=zoom) {
    const normalized=nodes.map(node=>{
      const display=displayPosition(node)
      return {id:node.id,...rotatePoint(display,false)}
    }).map(point=>{
      const perspective=1/(1-point.z/activePerspectiveDistance())
      return {id:point.id,x:point.x*perspective,y:point.y*perspective}
    }).filter(point=>Number.isFinite(point.x)&&Number.isFinite(point.y))
    if(!normalized.length) return {scale:1,centerX:0,centerY:0}
    const xs=normalized.map(point=>point.x),ys=normalized.map(point=>point.y)
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys)
    const profile=activeCategoryProfile()
    const focus=profile?.focusId?normalized.find(point=>point.id===profile.focusId):null
    const boundsCenterX=(minX+maxX)/2,boundsCenterY=(minY+maxY)/2
    const centerBias=focus?clamp(profile.centerBias||0,0,.72):0
    const centerX=focus?boundsCenterX*(1-centerBias)+focus.x*centerBias:boundsCenterX
    const centerY=focus?boundsCenterY*(1-centerBias)+focus.y*centerBias:boundsCenterY
    const halfSpanX=Math.max(1,centerX-minX,maxX-centerX),halfSpanY=Math.max(1,centerY-minY,maxY-centerY)
    const aspect=width/height
    const widthUsage=aspect < .9 ? projectionConfig.widthUsageTall : aspect < 1.25 ? projectionConfig.widthUsageMedium : projectionConfig.widthUsageWide
    const scale=Math.min(width*widthUsage*.5/halfSpanX,height*projectionConfig.heightUsage*.5/halfSpanY)*zoomLevel
    return {scale,centerX,centerY,focusId:profile?.focusId||null,centerBias,framingBoundsSource:lensProfile?"category/display":"canonical/source"}
  }

  function rotatePoint(node,includePointerOrbit=true) {
    const effectiveRotY=rotY+(includePointerOrbit?passiveRotY:0)
    const effectiveRotX=rotX+(includePointerOrbit?passiveRotX:0)
    const cy=Math.cos(effectiveRotY),sy=Math.sin(effectiveRotY)
    const x1=node.x*cy-node.z*sy,z1=node.x*sy+node.z*cy
    const cx=Math.cos(effectiveRotX),sx=Math.sin(effectiveRotX)
    return {x:x1,y:node.y*cx-z1*sx,z:node.y*sx+z1*cx}
  }

  function projectPoint(point,viewport) {
    const perspective=1/(1-point.z/activePerspectiveDistance())
    const normalizedX=point.x*perspective,normalizedY=point.y*perspective
    const depthPosition=clamp((point.z/activePerspectiveDistance()+.55)/1.10,0,1)
    const layerResponse=.25+.75*smoothstep(depthPosition)
    return {x:width*.5+(normalizedX-viewport.centerX)*viewport.scale+lensPanX+passivePanX*layerResponse,y:height*.5+(normalizedY-viewport.centerY)*viewport.scale+panY+lensPanY+passivePanY*layerResponse,z:point.z,s:viewport.scale*perspective}
  }

  function projectedBounds(items) {
    return items.reduce((acc,item)=>{
      acc.minX=Math.min(acc.minX,item.point.x);acc.maxX=Math.max(acc.maxX,item.point.x)
      acc.minY=Math.min(acc.minY,item.point.y);acc.maxY=Math.max(acc.maxY,item.point.y)
      return acc
    },{minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity})
  }

  function updateLensPanCorrection(items) {
    if(!lensProfile||!items.length||lensStrength<=.0001){
      lensPanX=0;lensPanY=0
      return {x:0,y:0,targetX:0,targetY:0}
    }
    const bounds=projectedBounds(items)
    if(!Number.isFinite(bounds.minX)) return {x:lensPanX,y:lensPanY,targetX:lensPanX,targetY:lensPanY}
    const centerX=(bounds.minX+bounds.maxX)/2,centerY=(bounds.minY+bounds.maxY)/2
    const targetX=clamp((width*.5-centerX)*(lensProfile.centerBiasX||0),-width*.12,width*.12)
    const targetY=clamp((height*.5-centerY)*(lensProfile.centerBiasY||0),-height*.12,height*.12)
    lensPanX=targetX;lensPanY=targetY
    items.forEach(item=>{item.point.x+=lensPanX;item.point.y+=lensPanY})
    return {x:lensPanX,y:lensPanY,targetX,targetY}
  }

  function nodeRadius(node,point) {
    const tier=getNodeTier(node)
    const base=tierSize[tier]||tierSize.structural
    const historyScale=node.historyLayer ? node.historyThreshold ? 1.38 : 1.18 : 1
    const categoryScale=lensProfile?.nodeScale||1
    const farBoost=lensProfile?.farNodeBoost ? 1+lensProfile.farNodeBoost*(1-(point.depth01??1)) : 1
    const anchorId=activeAnchorId()
    const anchorScale=lensProfile?.anchorScale||1.32
    const focused=node.id===selectedVisualFocusId()
    const selectedFocus=isSelectableNode(node.id)&&focused
    const focusScale=selectedFocus?1.02:node.id===anchorId?Math.max(anchorScale,focused?1.24:1):focused?1.12:node.id===getCurrentId?.()?1.08:node.id===(getRecommendedId?.()||null)?1.08:1
    const radius=base*(node.id==="BOGOBOT"?1.12:1)*historyScale*point.depthScale*categoryScale*farBoost*focusScale
    return selectedFocus?(mobileLabels.matches?clamp(radius,16,18):15):radius
  }

  function selectedVisualFocusId() {
    return getActiveSelectionId?.()||null
  }

  function activeVisualFocusId() {
    return selectedVisualFocusId()||hoveredId||previewFocusId||null
  }

  function shapeType(node){return node.id==="BOGOBOT"?"canon":getNodeType(node)}

  function shapePath(node,radius,scale=1) {
    const type=shapeType(node),r=radius*scale
    context.beginPath()
    if(type==="world") context.rect(-r,-r,r*2,r*2)
    else if(type==="schools"){
      context.moveTo(0,-r*1.08);context.lineTo(r*1.08,0);context.lineTo(0,r*1.08);context.lineTo(-r*1.08,0);context.closePath()
    } else context.arc(0,0,r,0,Math.PI*2)
  }

  function drawShape(node,point,radius,{alpha=1,secondary=false,mapNeutral=false,hoverActivated=false}={}) {
    const type=shapeType(node)
    const selectedFocus=isSelectableNode(node.id)&&(node.id===selectedVisualFocusId())
    const isTopographyAnchor=type==="topography"&&node.id===activeAnchorId()
    const isHistory=node.historyLayer
    context.save()
    context.translate(point.x,point.y)
    if(selectedFocus){
      const r=radius
      const breathActive=node.id==="BOGOBOT"&&!reduceMotion.matches
      const breath=breathActive ? .5-.5*Math.cos((renderClock%2000)/2000*Math.PI*2) : .5
      const nucleusAlpha=.86+.12*breath
      const fieldRadius=.48+.23*breath
      const fieldAlpha=.84+.13*breath
      if(breathActive){
        const haze=context.createRadialGradient(0,0,r*.94,0,0,r+1.8)
        haze.addColorStop(0,rgba(COLORS.blue,.10+.05*breath))
        haze.addColorStop(1,rgba(COLORS.blue,0))
        context.fillStyle=haze
        context.beginPath();context.arc(0,0,r+1.8,0,Math.PI*2);context.fill()
      }
      const gradient=context.createRadialGradient(0,0,Math.max(1,r*(.15+.02*breath)),0,0,r)
      gradient.addColorStop(0,`rgba(232,252,255,${nucleusAlpha})`)
      gradient.addColorStop(.18,`rgba(112,222,255,${fieldAlpha})`)
      gradient.addColorStop(.36,`rgba(0,128,255,${.92+.04*breath})`)
      gradient.addColorStop(fieldRadius,"rgba(0,60,205,.98)")
      gradient.addColorStop(.72,"rgba(0,36,154,.99)")
      gradient.addColorStop(1,"rgba(0,7,34,.99)")
      context.fillStyle=gradient
      context.beginPath();context.arc(0,0,r,0,Math.PI*2);context.fill()
      context.fillStyle=`rgba(235,253,255,${nucleusAlpha})`
      context.beginPath();context.arc(0,0,clamp(r*(.18+.03*breath),2.5,3.25),0,Math.PI*2);context.fill()
      context.strokeStyle="rgba(0,52,205,.94)"
      context.lineWidth=1
      context.beginPath();context.arc(0,0,r+.5,0,Math.PI*2);context.stroke()
      context.restore()
      return
    }
    if(mapNeutral){
      context.fillStyle=secondary
        ? rgba([166,178,190],secondary==="a"?clamp(alpha+.12,.72,.94):clamp(alpha+.08,.62,.84))
        : rgba([82,88,96],clamp(alpha*.78,.22,.68))
      context.strokeStyle=secondary
        ? rgba([92,132,178],secondary==="a"?.78:.62)
        : rgba([188,194,200],clamp(alpha+.16,.42,.86))
    } else {
      context.fillStyle=secondary==="a"?rgba(COLORS.node,clamp(alpha+.10,.46,.92)):rgba(COLORS.paper,secondary==="b"?clamp(alpha+.04,.32,.74):alpha)
      context.strokeStyle=secondary?rgba(COLORS.blue,secondary==="a"?.42:.24):rgba(COLORS.node,Math.min(1,alpha+.08))
    }
    context.lineWidth=secondary?Math.max(1.05,radius*(secondary==="a"?.075:.06)):isHistory?Math.max(.95,radius*.16):isTopographyAnchor?Math.max(2.15,radius*.18):type==="topography"?1.15:mapNeutral?1.25:1
    const fillAndStroke=()=>{context.fill();context.stroke()}
    if(hoverActivated&&!selectedFocus){
      context.fillStyle=rgba([112,120,130],clamp(alpha+.06,.62,.78))
      context.strokeStyle="rgba(90,224,255,.92)"
      context.lineWidth=1.15
      if(type==="world"||type==="schools") shapePath(node,radius)
      else if(type==="glossary") context.beginPath(),context.arc(0,0,radius,0,Math.PI*2)
      else if(type==="topography"){
        const armScale=isTopographyAnchor?.72:1.25
        context.beginPath();context.moveTo(-radius*armScale,0);context.lineTo(radius*armScale,0);context.moveTo(0,-radius*armScale);context.lineTo(0,radius*armScale)
      } else context.beginPath(),context.arc(0,0,radius,0,Math.PI*2)
      context.fill();context.stroke()
      const hoverField=context.createRadialGradient(0,0,Math.max(1,radius*.18),0,0,radius*.72)
      hoverField.addColorStop(0,"rgba(235,253,255,.92)")
      hoverField.addColorStop(.34,"rgba(126,231,255,.58)")
      hoverField.addColorStop(.72,"rgba(38,174,210,.18)")
      hoverField.addColorStop(1,"rgba(38,174,210,0)")
      context.fillStyle=hoverField
      context.beginPath();context.arc(0,0,radius*.72,0,Math.PI*2);context.fill()
      context.fillStyle="rgba(240,254,255,.96)"
      context.beginPath();context.arc(0,0,clamp(radius*.25,2.4,3.8),0,Math.PI*2);context.fill()
      context.strokeStyle="rgba(117,230,255,.72)"
      context.lineWidth=.8
      shapePath(node,radius+1.25)
      context.stroke()
      context.restore()
      return
    }
    if(isHistory){
      const r=radius*(node.historyThreshold?1.12:1)
      context.fillStyle=rgba(COLORS.background,.78)
      context.beginPath();context.arc(0,0,r,0,Math.PI*2);context.fill();context.stroke()
      context.strokeStyle=node.historyThreshold?rgba(COLORS.paper,Math.min(1,alpha+.18)):rgba(COLORS.node,Math.min(1,alpha+.12))
      context.lineWidth=node.historyThreshold?Math.max(1.5,radius*.19):Math.max(.8,radius*.14)
      context.beginPath();context.moveTo(-r*.72,-r*.72);context.lineTo(r*.72,r*.72);context.moveTo(-r*.72,r*.72);context.lineTo(r*.72,-r*.72);context.stroke()
      context.fillStyle=rgba(COLORS.paper,Math.min(1,alpha+.06))
      context.beginPath();context.arc(0,0,Math.max(1.25,radius*(node.historyThreshold?.34:.26)),0,Math.PI*2);context.fill()
      if(node.historyThreshold){
        context.strokeStyle=rgba(COLORS.blue,.74)
        context.lineWidth=Math.max(1.05,radius*.10)
        context.beginPath();context.arc(0,0,radius*1.72,0,Math.PI*2);context.stroke()
      }
    } else if(type==="world"){
      shapePath(node,radius);fillAndStroke()
    } else if(type==="schools"){
      shapePath(node,radius);fillAndStroke()
    } else if(type==="glossary"){
      context.beginPath();context.arc(0,0,radius,0,Math.PI*2);context.stroke()
      context.beginPath();context.arc(0,0,radius*.46,0,Math.PI*2);fillAndStroke()
    } else if(type==="topography"){
      const armScale=isTopographyAnchor?.72:1.25
      const coreScale=isTopographyAnchor?.56:.3
      context.beginPath();context.moveTo(-radius*armScale,0);context.lineTo(radius*armScale,0);context.moveTo(0,-radius*armScale);context.lineTo(0,radius*armScale);context.stroke()
      context.beginPath();context.arc(0,0,Math.max(1.7,radius*coreScale),0,Math.PI*2);fillAndStroke()
    } else {
      context.beginPath();context.arc(0,0,radius,0,Math.PI*2);fillAndStroke()
    }
    context.restore()
  }

  function drawContour(node,point,radius,alpha=.82,scale=1.65) {
    context.save();context.translate(point.x,point.y)
    const isTopographyAnchor=shapeType(node)==="topography"&&node.id===activeAnchorId()
    context.strokeStyle=rgba(COLORS.blue,alpha);context.lineWidth=node.historyLayer?Math.max(1.15,radius*.12):isTopographyAnchor?Math.max(1.7,radius*.13):1.15
    if(node.historyLayer){
      const r=radius*(node.historyThreshold?1.9:scale)
      context.beginPath();context.arc(0,0,r,0,Math.PI*2);context.stroke()
      context.beginPath();context.moveTo(-r*.62,0);context.lineTo(r*.62,0);context.moveTo(0,-r*.62);context.lineTo(0,r*.62);context.stroke()
    } else if(shapeType(node)==="topography"){
      const r=radius*(isTopographyAnchor?1.18:scale)
      context.beginPath();context.moveTo(-r,0);context.lineTo(r,0);context.moveTo(0,-r);context.lineTo(0,r);context.stroke()
      context.beginPath();context.arc(0,0,Math.max(2.2,radius*(isTopographyAnchor?.58:.46)),0,Math.PI*2);context.stroke()
    } else {shapePath(node,radius,scale);context.stroke()}
    context.restore()
  }

  function drawNeutralContour(node,point,radius,alpha=.58,scale=1.32) {
    context.save();context.translate(point.x,point.y)
    context.strokeStyle=rgba(COLORS.node,alpha);context.lineWidth=.9
    shapePath(node,radius,scale);context.stroke()
    context.restore()
  }

  function drawSelectedKnockout(point,radius) {
    context.save()
    context.translate(point.x,point.y)
    context.fillStyle=COLORS.background
    context.beginPath()
    context.arc(0,0,radius+1.25,0,Math.PI*2)
    context.fill()
    context.restore()
  }

  function drawPulseRecipientResponse(node,point,radius,intensity=0) {
    if(intensity<=0) return
    const alpha=clamp(intensity,0,1)
    context.save()
    context.translate(point.x,point.y)
    const r=radius*(1+.03*alpha)
    context.strokeStyle=rgba([80,220,240],.42*alpha)
    context.lineWidth=1.15
    shapePath(node,r+1.25)
    context.stroke()
    const field=context.createRadialGradient(0,0,Math.max(1,r*.18),0,0,r*.63)
    field.addColorStop(0,`rgba(232,252,255,${.78*alpha})`)
    field.addColorStop(.34,`rgba(80,220,240,${.58*alpha})`)
    field.addColorStop(.72,`rgba(52,184,226,${.22*alpha})`)
    field.addColorStop(1,"rgba(52,184,226,0)")
    context.fillStyle=field
    context.beginPath()
    context.arc(0,0,r*.63,0,Math.PI*2)
    context.fill()
    context.fillStyle=`rgba(235,253,255,${.94*alpha})`
    context.beginPath()
    context.arc(0,0,clamp(radius*.28,2.4,3.6),0,Math.PI*2)
    context.fill()
    context.strokeStyle=rgba([80,220,240],.82*alpha)
    context.lineWidth=1.15
    shapePath(node,r)
    context.stroke()
    context.restore()
  }

  function labelCandidate(item,priority,persistent=false,role="anchor") {
    const {node,point}=item,text=getNodeLabel(node)
    context.font=`${node.id==="BOGOBOT"?500:400} ${node.id==="BOGOBOT"?13:11}px "IBM Plex Mono",monospace`
    const textWidth=context.measureText(text).width
    const preferLeft=point.x>width*.56
    const outwardY=point.y<height*.38?-1:point.y>height*.62?1:0
    const preferAbove=role==="recommended"||outwardY<0
    const gap=Math.max(9,nodeRadius(node,point)+6)
    const x=preferLeft?point.x-gap-textWidth:point.x+gap
    const anchorOffset=outwardY?outwardY*14:11
    const y=clamp(point.y+(role==="selected"?15:preferAbove?-15:anchorOffset),9,height-9)
    return {item,text,x:clamp(x,4,Math.max(4,width-textWidth-4)),y,width:textWidth,height:16,priority,persistent}
  }

  function drawLabel(candidate) {
    const {item:{node,point},text,x,y}=candidate,isBogobot=node.id==="BOGOBOT"
    const selected=node.id===getActiveSelectionId?.(),hoverLabelActive=node.id===hoveredId||node.id===previewFocusId,recommended=node.id===(getRecommendedId?.()||null)&&!selected
    context.save()
    context.textAlign="left";context.textBaseline="middle"
    context.font=`${isBogobot?500:400} ${isBogobot?13:11}px "IBM Plex Mono",monospace`
    if(isBogobot){
      context.lineWidth=2.6
      context.strokeStyle="rgba(5,6,7,.72)"
      context.strokeText(text,x,y)
      context.fillStyle=selected?rgba(COLORS.blue,.98):rgba(COLORS.paper,clamp(.72+point.depth01*.20,.72,.92))
    } else context.fillStyle=selected?rgba(COLORS.blue,.96):recommended?rgba(COLORS.blue,.78):hoverLabelActive?rgba(COLORS.paper,.94):rgba(COLORS.paper,clamp(.68+point.depth01*.22,.68,.90))
    context.fillText(text,x,y)
    context.restore()
  }

  function overlaps(a,b,mobile=false){
    const horizontalPadding=mobile?10:6,verticalPadding=mobile?6:3
    return a.x<b.x+b.width+horizontalPadding&&a.x+a.width+horizontalPadding>b.x
      &&a.y-a.height/2<b.y+b.height/2+verticalPadding&&a.y+a.height/2+verticalPadding>b.y-b.height/2
  }

  function edgeClass(a,b) {
    if(a.node.historyLayer||b.node.historyLayer) return "history"
    const tiers=new Set([getNodeTier(a.node),getNodeTier(b.node)])
    if(tiers.has("trace")) return tiers.has("core")?"trace":"structural"
    return tiers.has("core")?"main":"structural"
  }

  function render(time=0) {
    frame=0
    if(!shouldAnimate()) return
    renderClock=time
    const easing=reduceMotion.matches?1:.09
    rotX+=(targetRotX-rotX)*easing;rotY+=(targetRotY-rotY)*easing;zoom+=(targetZoom-zoom)*easing;panY+=(targetPanY-panY)*easing
    passiveRotX+=(targetPassiveRotX-passiveRotX)*(reduceMotion.matches ? .22 : .13)
    passiveRotY+=(targetPassiveRotY-passiveRotY)*(reduceMotion.matches ? .22 : .13)
    passivePanX+=(targetPassivePanX-passivePanX)*(reduceMotion.matches ? .24 : .14)
    passivePanY+=(targetPassivePanY-passivePanY)*(reduceMotion.matches ? .24 : .14)
    lensStrength+=(targetLensStrength-lensStrength)*easing
    if(Math.abs(targetLensStrength-lensStrength)<.001) lensStrength=targetLensStrength
    if(targetLensStrength===0&&lensStrength<=.0001) lensProfile=null
    if(!lensProfile||lensStrength<=.0001){lensPanX=0;lensPanY=0}
    context.setTransform(dpr,0,0,dpr,0,0)
    context.fillStyle=COLORS.background;context.fillRect(0,0,width,height)
    const sceneKey=categoryKeyForNodes()
    const mapScene=sceneKey==="map"
    const visualProfile=activeVisualProfile()
    const depthRuntime=activeDepthConfig()
    const viewport=viewportProjection()
    projected=nodes.map(node=>{
      const display=displayPosition(node)
      return {node,source:{x:node.x,y:node.y,z:node.z},display:{x:display.x,y:display.y,z:display.z},point:projectPoint(rotatePoint(display),viewport)}
    }).filter(item=>Number.isFinite(item.point.x)&&Number.isFinite(item.point.y)&&Number.isFinite(item.point.s))
    const panCorrection=updateLensPanCorrection(projected)
    const zValues=projected.map(item=>item.point.z),zMin=Math.min(...zValues),zMax=Math.max(...zValues),zSpan=Math.max(1,zMax-zMin)
    projected.forEach(item=>{
      const depth01=clamp((item.point.z-zMin)/zSpan,0,1)
      const depthCurve=depth01*depth01*(3-2*depth01)
      item.point.depth01=depth01
      item.point.depthScale=depthRuntime.scaleMin+(depthRuntime.scaleMax-depthRuntime.scaleMin)*depthCurve
    })
    const screen=new Map(projected.map(item=>[item.node.id,item]))
    const currentId=getCurrentId?.(),recommendedId=getRecommendedId?.()||null,anchorId=activeAnchorId()
    const adjacency=new Map(nodes.map(node=>[node.id,[]]))
    edges.forEach(edge=>{adjacency.get(edge.source)?.push(edge.target);adjacency.get(edge.target)?.push(edge.source)})
    const neighborSet=new Set(adjacency.get(currentId)||[])
    const selectedFocusId=selectedVisualFocusId()
    const hoverFocusId=selectedFocusId||connectionFocusId||null
    const hoverNeighborSet=new Set(hoverFocusId?(adjacency.get(hoverFocusId)||[]):[])
    const hoverActivationId=hoveredId&&hoveredId!==hoverFocusId&&hoverNeighborSet.has(hoveredId)?hoveredId:null
    const anchorNeighborSet=new Set(anchorId?(adjacency.get(anchorId)||[]):[])
    const rankedHoverNeighbors=hoverFocusId?[...(adjacency.get(hoverFocusId)||[])]
      .map(id=>screen.get(id)).filter(Boolean)
      .map(item=>({id:item.node.id,item,distance:Math.hypot((screen.get(hoverFocusId)?.display.x||0)-item.display.x,(screen.get(hoverFocusId)?.display.y||0)-item.display.y,(screen.get(hoverFocusId)?.display.z||0)-item.display.z)}))
      .sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id)):[]
    const basePriorityNeighborIds=rankedHoverNeighbors.slice(0,3).map(entry=>entry.id)
    const emphasizedNeighborIds=hoverActivationId&&!basePriorityNeighborIds.includes(hoverActivationId)
      ? [...basePriorityNeighborIds.slice(0,2),hoverActivationId]
      : basePriorityNeighborIds
    const tierANeighborSet=new Set(emphasizedNeighborIds)
    const pulseSourceItem=hoverFocusId?screen.get(hoverFocusId):null
    const desiredPulseKey=hoverFocusId&&pulseSourceItem?`${sceneKey}:${hoverFocusId}`:null
    if(desiredPulseKey!==pulseSelectionKey){
      pulseSelectionKey=desiredPulseKey
      const primary=rankedHoverNeighbors[0]
      pulseEdge=primary?{source:hoverFocusId,target:primary.id,key:[hoverFocusId,primary.id].sort().join(":")}:null
    }

    let pulseProgress=null,pulsePosition=null,pulseRecipientId=null,pulseRecipientIntensity=0
    const edgeStyles={main:{alpha:.31,width:1.30},structural:{alpha:.125,width:.76},trace:{alpha:.036,width:.42},history:{alpha:.24,width:1.05}}
    const drawableEdges=edges.map(edge=>({edge,a:screen.get(edge.source),b:screen.get(edge.target)})).filter(item=>item.a&&item.b).map(item=>({...item,depth:(item.a.point.depth01+item.b.point.depth01)/2})).sort((left,right)=>left.depth-right.depth||left.edge.source.localeCompare(right.edge.source)||left.edge.target.localeCompare(right.edge.target))
    for(const {edge,a,b,depth} of drawableEdges){
      const selectedEdge=edge.source===currentId||edge.target===currentId
      const focusEdge=hoverFocusId&&(edge.source===hoverFocusId||edge.target===hoverFocusId)
      const focusNeighborId=focusEdge?(edge.source===hoverFocusId?edge.target:edge.source):null
      const emphasizedEdge=Boolean(focusEdge&&tierANeighborSet.has(focusNeighborId))
      const hoverEdgeTier=emphasizedEdge?"a":focusEdge?"b":null
      const hoverActivationEdge=Boolean(hoverActivationId&&hoverFocusId&&edgeIdentity(edge.source,edge.target)===edgeIdentity(hoverFocusId,hoverActivationId))
      const anchorEdge=anchorId&&(edge.source===anchorId||edge.target===anchorId)
      const style=edgeStyles[edgeClass(a,b)]
      const historyEdge=edge.kind==="chronology"||edge.kind==="semantic"
      const chronologyEdge=edge.kind==="chronology"
      const compositionEdge=Boolean(visualProfile?.importantEdges?.includes(edgeIdentity(edge.source,edge.target)))
      const relevanceBase=historyEdge
        ? hoverFocusId?(emphasizedEdge?1.48:focusEdge?.72:.54):selectedEdge?1.36:1
        : hoverFocusId?(emphasizedEdge?1.56:focusEdge?.68:.50):selectedEdge?1.12:anchorEdge?1.08:(currentId?.length ? .88 : 1)
      const relevance=relevanceBase*(compositionEdge&&!hoverFocusId?1.28:1)
      const edgeTier=edgeClass(a,b)
      const depthFactor=depthRuntime.edgeFactorMin+(depthRuntime.edgeFactorMax-depthRuntime.edgeFactorMin)*(depth*depth*(3-2*depth))
      let alpha=historyEdge
        ? Math.max(chronologyEdge ? .19 : .075,(chronologyEdge ? .30 : .13)*(.72+depth*.52)*relevance)
        : Math.max(edgeAlphaFloor[edgeTier],style.alpha*depthFactor*relevance*(visualProfile?.edgeAlphaBoost||1))
      const categoryEdgeOpacityFloor=lensProfile?.edgeOpacityFloor||0
      let lineWidth=historyEdge
        ? (chronologyEdge?1.18:.62)*(.78+depth*.54)*(emphasizedEdge?1.18:selectedEdge?1.16:1)
        : Math.max(lensProfile?.edgeWidthFloor||0,style.width*(.66+depth*.58)*(emphasizedEdge?1.18:anchorEdge?1.12:1)*(compositionEdge&&!hoverFocusId?1.16:1)*(visualProfile?.edgeWidthBoost||1))
      context.beginPath();context.moveTo(a.point.x,a.point.y);context.lineTo(b.point.x,b.point.y)
      const brightness=depthRuntime.brightnessMin+Math.round(depth*(depthRuntime.brightnessMax-depthRuntime.brightnessMin))
      const connectionsVisible=connectionFocusId===currentId&&selectedEdge
      const staticFloor=mapScene&&!hoverFocusId ? 0 : categoryEdgeOpacityFloor
      if(emphasizedEdge){
        const focusAtSource=edge.source===hoverFocusId
        if(hoverActivationEdge){
          const from=focusAtSource?a:b
          const to=focusAtSource?b:a
          const dx=to.point.x-from.point.x,dy=to.point.y-from.point.y
          ;[
            {start:0,end:.38,alpha:.98,width:1.30},
            {start:.38,end:.72,alpha:.96,width:1.24},
            {start:.72,end:1,alpha:.92,width:1.16}
          ].forEach(segment=>{
            context.beginPath()
            context.moveTo(from.point.x+dx*segment.start,from.point.y+dy*segment.start)
            context.lineTo(from.point.x+dx*segment.end,from.point.y+dy*segment.end)
            context.strokeStyle=rgba([80,220,240],clamp(segment.alpha+.02,.90,1))
            context.lineWidth=segment.width
            context.stroke()
          })
          continue
        }
        context.strokeStyle=rgba([20,92,255],.70)
      } else context.strokeStyle=connectionsVisible?rgba([154,178,202],.62):`rgba(${brightness},${brightness+3},${brightness+7},${focusEdge?Math.min(.18,Math.max(alpha,.10)):historyEdge?alpha:Math.max(alpha,hoverFocusId?edgeAlphaFloor[edgeTier]:staticFloor)})`
      context.lineWidth=connectionsVisible?Math.max(1.2,lineWidth):hoverActivationEdge?1.25:emphasizedEdge?clamp(lineWidth,1.1,1.35):focusEdge?Math.min(.82,lineWidth):lineWidth;context.stroke()
    }
    if(pulseEdge&&!reduceMotion.matches){
      const source=screen.get(pulseEdge.source),target=screen.get(pulseEdge.target)
      if(source&&target){
        const cycle=6000,activeSpan=.82
        const phase=(time%cycle)/cycle
        if(phase>=.80&&phase<=.94){
          const rise=phase<activeSpan ? (phase-.80)/(activeSpan-.80) : phase<=.865 ? 1 : 1-(phase-.865)/(.94-.865)
          pulseRecipientId=pulseEdge.target
          pulseRecipientIntensity=clamp(rise,0,1)
        }
        if(phase<activeSpan){
          const t=phase/activeSpan
          const ease=t*t*(3-2*t)
          const dx=target.point.x-source.point.x
          const dy=target.point.y-source.point.y
          const distance=Math.max(1,Math.hypot(dx,dy))
          const sourceRadius=source.visual?.radius||nodeRadius(source.node,source.point)
          const targetRadius=target.visual?.radius||nodeRadius(target.node,target.point)
          const start=clamp((sourceRadius+1.5)/distance,0,.42)
          const end=clamp(1-(targetRadius+1.5)/distance,start+.02,1)
          const travel=start+(end-start)*ease
          const x=source.point.x+dx*travel
          const y=source.point.y+dy*travel
          pulseProgress=travel
          pulsePosition={x,y}
          const r=clamp((source.visual?.radius||nodeRadius(source.node,source.point))*.15+.55,2.5,3.05)
          context.save()
          const ux=dx/distance,uy=dy/distance,trailLength=clamp(distance*.07,7,15)
          const trail=context.createLinearGradient(x-ux*trailLength,y-uy*trailLength,x,y)
          trail.addColorStop(0,"rgba(52,184,226,0)")
          trail.addColorStop(1,"rgba(80,220,240,.72)")
          context.beginPath();context.moveTo(x-ux*trailLength,y-uy*trailLength);context.lineTo(x,y)
          context.strokeStyle=trail;context.lineWidth=1.35;context.stroke()
          const beadGlow=context.createRadialGradient(x,y,r*.25,x,y,r+2.2)
          beadGlow.addColorStop(0,"rgba(244,255,255,.98)")
          beadGlow.addColorStop(.38,"rgba(80,220,240,.94)")
          beadGlow.addColorStop(1,"rgba(52,184,226,0)")
          context.fillStyle=beadGlow
          context.beginPath();context.arc(x,y,r+2.2,0,Math.PI*2);context.fill()
          context.fillStyle=rgba([80,220,240],.96)
          context.beginPath();context.arc(x,y,r,0,Math.PI*2);context.fill()
          context.fillStyle="rgba(244,255,255,.99)"
          context.beginPath();context.arc(x,y,clamp(r*.28,.7,1),0,Math.PI*2);context.fill()
          context.restore()
        } else if(pulseRecipientId&&pulseRecipientIntensity>0){
          const dx=target.point.x-source.point.x
          const dy=target.point.y-source.point.y
          const start=.90,end=.985
          context.save()
          context.beginPath()
          context.moveTo(source.point.x+dx*start,source.point.y+dy*start)
          context.lineTo(source.point.x+dx*end,source.point.y+dy*end)
          context.strokeStyle=rgba([80,220,240],.72*pulseRecipientIntensity)
          context.lineWidth=1.55
          context.stroke()
          context.restore()
        }
      }
    }

    const routeStart=screen.get(currentId),routeEnd=screen.get(recommendedId)
    if(routeStart&&routeEnd){
      context.beginPath();context.moveTo(routeStart.point.x,routeStart.point.y);context.lineTo(routeEnd.point.x,routeEnd.point.y)
      context.strokeStyle=mapScene?rgba(COLORS.node,.58):rgba(COLORS.blue,.86);context.lineWidth=mapScene?1.05:1.35;context.stroke()
      const progress=reduceMotion.matches ? .70 : (time%2700)/2700
      const markerX=routeStart.point.x+(routeEnd.point.x-routeStart.point.x)*progress
      const markerY=routeStart.point.y+(routeEnd.point.y-routeStart.point.y)*progress
      context.fillStyle=mapScene?rgba(COLORS.node,.72):rgba(COLORS.blue,.96);context.beginPath();context.arc(markerX,markerY,mapScene?1.55:2.15,0,Math.PI*2);context.fill()
    }

    const ordered=[...projected].sort((a,b)=>a.point.z-b.point.z||a.node.id.localeCompare(b.node.id))
    let selectedDrawItem=null
    for(const item of ordered){
      const {node,point}=item,active=node.id===currentId,recommended=node.id===recommendedId
      const tier=getNodeTier(node)
      const radius=nodeRadius(node,point)
      const opacityRange=tierOpacity[tier]||tierOpacity.structural
      let alpha=opacityRange[0]+(opacityRange[1]-opacityRange[0])*point.depth01
      if(node.historyLayer) alpha=(node.historyThreshold?.56:.34)+(node.historyThreshold?.42:.48)*point.depth01
      alpha=clamp(alpha-depthRuntime.nodeFarFade*(1-point.depth01)+depthRuntime.nodeNearBoost*point.depth01,.16,1)
      if(neighborSet.has(node.id)||anchorNeighborSet.has(node.id)) alpha=Math.min(1,alpha+.06)
      const activeNeighbour=Boolean(hoverFocusId&&hoverNeighborSet.has(node.id)&&node.id!==hoverFocusId)
      const neighbourTier=activeNeighbour?(tierANeighborSet.has(node.id)?"a":"b"):false
      if(mapScene&&hoverFocusId){
        if(node.id===hoverFocusId) alpha=1
        else if(node.id===hoverActivationId) alpha=.96
        else if(activeNeighbour) alpha=neighbourTier==="a"?.88:.58
        else alpha=getNodeTier(node)==="trace"?.20:.38
      } else if(hoverFocusId){
        if(node.id===hoverFocusId) alpha=1
        else if(hoverNeighborSet.has(node.id)) alpha=Math.min(1,alpha+.16)
        else if(node.id!==anchorId&&!active&&!recommended) alpha=Math.max(.28,alpha*.56)
      }
      if(node.id===hoverFocusId||recommended||node.id===anchorId||node.historyThreshold) alpha=1
      if(lensProfile?.nodeOpacityFloor) alpha=Math.max(alpha,lensProfile.nodeOpacityFloor-depthRuntime.categoryFarFloorDrop*(1-point.depth01))
      const selectedRadius=screen.get(hoverFocusId)?.visual?.radius||screen.get(hoverFocusId)?.point&&nodeRadius(screen.get(hoverFocusId).node,screen.get(hoverFocusId).point)||Infinity
      const visualRadius=activeNeighbour?Math.min(radius*(neighbourTier==="a"?1.05:1.00),selectedRadius*(neighbourTier==="a"?.68:.60)):radius
      item.visual={radius:visualRadius,scale:point.depthScale,opacity:alpha,depth01:point.depth01,z:point.z}
      if(node.id===hoverFocusId&&isSelectableNode(node.id)){
        selectedDrawItem=item
        continue
      }
      drawShape(node,point,visualRadius,{alpha,secondary:neighbourTier,mapNeutral:mapScene,hoverActivated:node.id===hoveredId})
    }

    const labelItems=[]
    const selectedItem=screen.get(currentId),recommendedItem=screen.get(recommendedId),hoveredItem=screen.get(hoveredId),previewItem=screen.get(previewFocusId),anchorItem=screen.get(anchorId)
    const activeSelectionItem=screen.get(getActiveSelectionId?.()||null)
    const focusItem=previewItem||hoveredItem||activeSelectionItem
    const focusId=focusItem?.node.id||null
    const priorityIds=[...new Set(getPriorityLabelIds?.()||[])].filter(Boolean)
    const historyScene=sceneKey==="history"
    if(historyScene){
      const thresholdItem=projected.find(item=>item.node.historyThreshold)
      const focusItem=selectedItem||hoveredItem||thresholdItem
      if(thresholdItem) labelItems.push(labelCandidate(thresholdItem,118,true,"selected"))
      if(focusItem&&!labelItems.some(label=>label.item.node.id===focusItem.node.id)) labelItems.push(labelCandidate(focusItem,120,true,"selected"))
      const focusNeighbors=(adjacency.get(focusItem?.node.id)||[]).map(id=>screen.get(id)).filter(Boolean)
      focusNeighbors.slice(0,mobileLabels.matches?2:4).forEach((item,index)=>{
        if(!labelItems.some(label=>label.item.node.id===item.node.id)) labelItems.push(labelCandidate(item,104-index*4,false,"anchor"))
      })
      if(!mobileLabels.matches){
        projected
          .filter(item=>item.node.historyLayer&&!item.node.historyThreshold)
          .sort((a,b)=>b.point.depth01-a.point.depth01||a.node.id.localeCompare(b.node.id))
          .slice(0,5)
          .forEach((item,index)=>{
            if(!labelItems.some(label=>label.item.node.id===item.node.id)) labelItems.push(labelCandidate(item,58-index*2,false,"anchor"))
          })
      }
    }
    if(!historyScene&&mobileLabels.matches){
      if(focusItem) labelItems.push(labelCandidate(focusItem,140,true,"selected"))
      else if(selectedItem) labelItems.push(labelCandidate(selectedItem,100,false,"anchor"))
      if(!focusItem&&anchorItem&&anchorId!==currentId) labelItems.push(labelCandidate(anchorItem,108,true,"selected"))
      if(!focusItem) (visualProfile?.labels?.[mobileLabels.matches?"mobile":"desktop"]||[]).forEach((id,index)=>{
        const item=screen.get(id)
        if(item&&id!==focusId&&!labelItems.some(label=>label.item.node.id===id)) labelItems.push(labelCandidate(item,96-index*5,true,"anchor"))
      })
      const dialogueTargetId=mapScene ? null : priorityIds.find(id=>id!==currentId)
      const dialogueTarget=screen.get(dialogueTargetId)
      if(!focusItem&&dialogueTarget) labelItems.push(labelCandidate(dialogueTarget,110,true,dialogueTargetId===recommendedId?"recommended":"anchor"))
      const contextualItem=(hoveredItem||previewItem)&&previewFocusId!==currentId&&hoveredId!==dialogueTargetId
        ?hoveredItem
        :!mapScene&&recommendedItem&&recommendedId!==currentId&&recommendedId!==dialogueTargetId
          ?recommendedItem
          :null
      const contextualId=contextualItem?.node.id||null
      const neighborItem=(adjacency.get(currentId)||[]).map(id=>screen.get(id)).filter(Boolean)
        .sort((a,b)=>(labelTierPriority[getNodeTier(b.node)]||0)-(labelTierPriority[getNodeTier(a.node)]||0)||b.point.depth01-a.point.depth01||a.node.id.localeCompare(b.node.id))
        .find(item=>item.node.id!==dialogueTargetId&&item.node.id!==contextualId)
      if(!focusItem&&neighborItem&&(!mapScene||contextualItem)) labelItems.push(labelCandidate(neighborItem,90,false,"anchor"))
      if(!focusItem&&contextualItem) labelItems.push(labelCandidate(contextualItem,80,false,contextualId===recommendedId?"recommended":"anchor"))
      if(focusItem) rankedHoverNeighbors.slice(0,1).map(entry=>entry.item).forEach(item=>{
        if(item.node.id!==currentId&&!labelItems.some(label=>label.item.node.id===item.node.id)) labelItems.push(labelCandidate(item,88,false,"anchor"))
      })
    } else if(!historyScene) {
      if(focusItem) labelItems.push(labelCandidate(focusItem,140,true,"selected"))
      else if(selectedItem) labelItems.push(labelCandidate(selectedItem,100,false,"anchor"))
      if(focusItem&&activeSelectionItem&&activeSelectionItem.node.id!==focusItem.node.id&&!labelItems.some(label=>label.item.node.id===activeSelectionItem.node.id)) labelItems.push(labelCandidate(activeSelectionItem,132,true,"selected"))
      if(!focusItem&&anchorItem&&anchorId!==currentId) labelItems.push(labelCandidate(anchorItem,108,true,"selected"))
      if(!focusItem) (visualProfile?.labels?.desktop||[]).forEach((id,index)=>{
        const item=screen.get(id)
        if(item&&id!==focusId&&!labelItems.some(label=>label.item.node.id===id)) labelItems.push(labelCandidate(item,96-index*5,true,"anchor"))
      })
      if(!focusItem&&!mapScene) priorityIds.forEach(id=>{const item=screen.get(id);if(item&&!labelItems.some(label=>label.item.node.id===id))labelItems.push(labelCandidate(item,110,true,id===recommendedId?"recommended":"anchor"))})
      if(!focusItem&&!mapScene&&recommendedItem&&recommendedId!==currentId&&!labelItems.some(label=>label.item.node.id===recommendedId)) labelItems.push(labelCandidate(recommendedItem,100,false,"recommended"))
      if(focusItem) rankedHoverNeighbors.slice(0,mapScene?1:3).map(entry=>entry.item).forEach((item,index)=>{
        if(item.node.id!==currentId&&!labelItems.some(label=>label.item.node.id===item.node.id)) labelItems.push(labelCandidate(item,94-index*4,false,"anchor"))
      })
      if(!focusItem&&!mapScene) anchorLabels.forEach(id=>{const item=screen.get(id);if(item&&!labelItems.some(label=>label.item.node.id===id))labelItems.push(labelCandidate(item,id==="BOGOBOT"?70:getNodeTier(item.node)==="core"?50:35,true))})
    }
    for(const item of ordered){
      const {node,point}=item,radius=nodeRadius(node,point),active=node.id===currentId,recommended=node.id===recommendedId,anchor=node.id===anchorId,hover=node.id===hoveredId||node.id===previewFocusId
      if(node.id===hoverFocusId) continue
      if(isSelectableNode(node.id)&&hover) continue
      if(hover) drawContour(node,point,radius,.82,1.30)
      else if(active) drawNeutralContour(node,point,radius,.50,1.18)
      else if(anchor) drawContour(node,point,radius,.86,1.64)
      else if(recommended) mapScene ? drawNeutralContour(node,point,radius,.58,1.24) : drawContour(node,point,radius,.70,1.52)
    }
    if(selectedDrawItem){
      const {node,point}=selectedDrawItem
      const selectedRadius=selectedDrawItem.visual?.radius||nodeRadius(node,point)
      if(pulseRecipientId&&pulseRecipientId!==node.id){
        const recipient=screen.get(pulseRecipientId)
        if(recipient) drawPulseRecipientResponse(recipient.node,recipient.point,recipient.visual?.radius||nodeRadius(recipient.node,recipient.point),pulseRecipientIntensity)
      }
      drawSelectedKnockout(point,selectedRadius)
      drawShape(node,point,selectedRadius,{alpha:selectedDrawItem.visual?.opacity||1,mapNeutral:mapScene})
    }
    const previewCardLabelId=getPreviewCardId?.()||null
    const accepted=[]
    labelItems.sort((a,b)=>b.priority-a.priority||b.item.point.depth01-a.item.point.depth01||a.item.node.id.localeCompare(b.item.node.id)).forEach(label=>{
      if(previewCardLabelId&&label.item.node.id===previewCardLabelId) return
      if(accepted.length>=(mobileLabels.matches?4:12)) return
      const shifts=label.priority>=100?[0,-22,22,-40,40,-58,58]:label.persistent?[0,-18,18]:[0]
      const placed=shifts.map(shift=>({...label,y:clamp(label.y+shift,9,height-9)})).find(candidate=>!accepted.some(other=>overlaps(candidate,other,mobileLabels.matches)))
      if(placed) accepted.push(placed)
    })
    accepted.forEach(drawLabel)
    const bounds=projected.reduce((acc,item)=>{
      const radius=item.visual?.radius||nodeRadius(item.node,item.point)
      acc.minX=Math.min(acc.minX,item.point.x-radius);acc.maxX=Math.max(acc.maxX,item.point.x+radius)
      acc.minY=Math.min(acc.minY,item.point.y-radius);acc.maxY=Math.max(acc.maxY,item.point.y+radius)
      return acc
    },{minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity})
    const sortedVisuals=projected.map(item=>({id:item.node.id,x:item.point.x,y:item.point.y,z:item.point.z,source:item.source,display:item.display,depth01:item.point.depth01,scale:item.point.depthScale,opacity:item.visual?.opacity??null,radius:item.visual?.radius??null})).sort((a,b)=>a.depth01-b.depth01)
    const edgeInventory=edges.reduce((acc,edge)=>{
      if(edge.kind==="chronology") acc.chronology+=1
      else if(edge.kind==="semantic") acc.semantic+=1
      else acc.other+=1
      return acc
    },{chronology:0,semantic:0,other:0})
    const displayDeltas=sortedVisuals.map(item=>Math.hypot(item.display.x-item.source.x,item.display.y-item.source.y,item.display.z-item.source.z))
    const sourceXs=sortedVisuals.map(item=>item.source.x),sourceYs=sortedVisuals.map(item=>item.source.y),displayXs=sortedVisuals.map(item=>item.display.x),displayYs=sortedVisuals.map(item=>item.display.y)
    const sourceSpan={x:sourceXs.length?Math.max(...sourceXs)-Math.min(...sourceXs):0,y:sourceYs.length?Math.max(...sourceYs)-Math.min(...sourceYs):0}
    const displaySpan={x:displayXs.length?Math.max(...displayXs)-Math.min(...displayXs):0,y:displayYs.length?Math.max(...displayYs)-Math.min(...displayYs):0}
    lastFrameMetrics={
      viewport:{width,height,dpr},
      framing:projectionConfig,
      depth:depthRuntime,
      visualProfile:visualProfile||null,
      interaction:{hoveredId,selectedFocusId,hoverActivationId,anchorId,passiveRotX,passiveRotY,targetPassiveRotX,targetPassiveRotY,passivePanX,passivePanY,targetPassivePanX,targetPassivePanY,dragging,orbitVelocityX,orbitVelocityY},
      lens:{active:Boolean(lensProfile),strength:lensStrength,targetStrength:targetLensStrength,profile:lensProfile,framingBoundsSource:viewport.framingBoundsSource,zoomBeforeLens:zoom,zoomAfterLens:zoom,zoomCompensationRatio:1,panCorrectionX:panCorrection.x,panCorrectionY:panCorrection.y,lensAppliedAfterFraming:true,fitTriggeredAfterLens:false,sourceSpan,displaySpan,maxDisplayDelta:displayDeltas.length?Math.max(...displayDeltas):0},
      bounds:Number.isFinite(bounds.minX)?{...bounds,width:bounds.maxX-bounds.minX,height:bounds.maxY-bounds.minY,occupancyX:(bounds.maxX-bounds.minX)/Math.max(1,width),occupancyY:(bounds.maxY-bounds.minY)/Math.max(1,height)}:null,
      edgeInventory,
      edgeBudget:{limit:3,basePriorityIds:basePriorityNeighborIds,emphasizedIds:emphasizedNeighborIds,count:emphasizedNeighborIds.length,hoverReplacementId:hoverActivationId&&!basePriorityNeighborIds.includes(hoverActivationId)?hoverActivationId:null},
      pulse:{active:Boolean(pulseEdge&&hoverFocusId&&!reduceMotion.matches),source:pulseEdge?.source||null,target:pulseEdge?.target||null,key:pulseEdge?.key||null,reducedMotion:reduceMotion.matches,progress:pulseProgress,position:pulsePosition,recipient:{id:pulseRecipientId,intensity:pulseRecipientIntensity}},
      breathing:{active:!reduceMotion.matches&&hoverFocusId==="BOGOBOT",node:"BOGOBOT",cycleMs:2000},
      nodes:sortedVisuals,
      samples:{far:sortedVisuals[0]||null,mid:sortedVisuals[Math.floor(sortedVisuals.length/2)]||null,near:sortedVisuals[sortedVisuals.length-1]||null}
    }

    if(hoverLabel){
      hoverLabel.classList.remove("on")
    }
    const motionActive=!reduceMotion.matches&&(Boolean(pulseEdge&&hoverFocusId)||currentId==="BOGOBOT"||Boolean(routeStart&&routeEnd))
    if(motionActive||dragging||Math.abs(targetRotX-rotX)>.001||Math.abs(targetRotY-rotY)>.001||Math.abs(targetZoom-zoom)>.001||Math.abs(targetPanY-panY)>.1||Math.abs(targetPassiveRotX-passiveRotX)>.0002||Math.abs(targetPassiveRotY-passiveRotY)>.0002||Math.abs(targetPassivePanX-passivePanX)>.05||Math.abs(targetPassivePanY-passivePanY)>.05||Math.abs(orbitVelocityX)>.00002||Math.abs(orbitVelocityY)>.00002||Math.abs(targetLensStrength-lensStrength)>.001) requestFrame()
  }

  function shouldAnimate(){return mounted&&shown&&!destroyed&&!document.hidden}
  function requestFrame(){if(shouldAnimate()&&!frame) frame=requestAnimationFrame(render)}
  function stopFrame(){if(frame) cancelAnimationFrame(frame);frame=0}

  function updatePointer(event){const rect=canvas.getBoundingClientRect();pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top}
  function previewPayload(id) {
    if(!id) return null
    const item=projected.find(candidate=>candidate.node.id===id)
    if(!item) return null
    return {id,item:{x:item.point.x,y:item.point.y,z:item.point.z,radius:nodeRadius(item.node,item.point)},viewport:{width,height}}
  }
  function setPreviewFocus(id,reason="hover",{card=true}={}) {
    const mode=card?"card":"focus"
    if(previewFocusId===id&&lastPreviewId===id&&lastPreviewMode===mode) return
    previewFocusId=id
    lastPreviewId=id
    lastPreviewMode=mode
    if(id) {
      const payload=previewPayload(id)
      onPreviewFocus(payload,reason)
      if(card) onPreviewNode(payload,reason)
      else onPreviewClear(reason)
    }
    else onPreviewClear(reason)
    requestFrame()
  }
  function updatePassiveParallax() {
    if(mobileLabels.matches||dragging||pointer.x<0||pointer.y<0){
      targetPassiveRotX=0;targetPassiveRotY=0
      targetPassivePanX=0;targetPassivePanY=0
      return
    }
    const nx=clamp((pointer.x/Math.max(1,width)-.5)*2,-1,1)
    const ny=clamp((pointer.y/Math.max(1,height)-.5)*2,-1,1)
    const motionScale=reduceMotion.matches ? 0 : 1
    targetPassiveRotY=-nx*(8*Math.PI/180)*motionScale
    targetPassiveRotX=-ny*(5.5*Math.PI/180)*motionScale
    targetPassivePanX=-nx*14*motionScale
    targetPassivePanY=-ny*12*motionScale
  }
  function hitDistance(item,radius) {
    const dx=Math.abs(pointer.x-item.point.x),dy=Math.abs(pointer.y-item.point.y)
    const type=shapeType(item.node),minimum=20
    if(type==="world") return Math.max(dx,dy)/Math.max(minimum,radius*1.35)
    if(type==="schools") return (dx+dy)/Math.max(minimum*1.35,radius*1.55)
    if(type==="topography") return Math.min(Math.max(dx,dy*.42),Math.max(dy,dx*.42))/Math.max(minimum,radius*1.55)
    return Math.hypot(dx,dy)/Math.max(minimum,radius*1.45)
  }
  function pickNode(){
    const candidates=projected.map(item=>{const radius=nodeRadius(item.node,item.point),hitScore=hitDistance(item,radius);return {...item,hitScore}}).filter(item=>item.hitScore<=1)
    candidates.sort((a,b)=>a.hitScore-b.hitScore||b.point.z-a.point.z||a.node.id.localeCompare(b.node.id))
    return candidates[0]?.node.id||null
  }
  function onPointerDown(event){updatePointer(event);pointerDownId=pickNode();hoveredId=null;dragging=true;moved=0;lastX=event.clientX;lastY=event.clientY;orbitVelocityX=0;orbitVelocityY=0;canvas.setPointerCapture(event.pointerId);canvas.classList.remove("node-hover");canvas.classList.add("dragging")}
  function onPointerMove(event){
    updatePointer(event)
    if(dragging){const dx=event.clientX-lastX,dy=event.clientY-lastY;moved+=Math.abs(dx)+Math.abs(dy);lastX=event.clientX;lastY=event.clientY;requestFrame()}
    else updatePassiveParallax()
    if(dragging) return
    const nextHover=pickNode()
    hoveredId=nextHover
    canvas.classList.toggle("node-hover",Boolean(hoveredId))
    if(!mobileLabels.matches) {
      if(hoveredId) setPreviewFocus(hoveredId,"hover",{card:false})
      else setPreviewFocus(null,"hover")
    }
    requestFrame()
  }
  function onPointerUp(event){
    if(canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    dragging=false;canvas.classList.remove("dragging")
    const picked=pickNode()
    if(moved<6&&picked){
      if(mobileLabels.matches){
        if(isSelectableNode(picked)){
          if(previewFocusId===picked) onOpenNode?.(picked)
          else setPreviewFocus(picked,"tap-focus",{card:false})
        }
        else if(previewFocusId===picked) onOpenNode?.(picked)
        else setPreviewFocus(picked,"tap")
      } else if(picked===pointerDownId) onOpenNode?.(picked)
    } else if(moved<6&&mobileLabels.matches&&!picked) setPreviewFocus(null,"outside")
    pointerDownId=null
  }
  function onPointerCancel(event){
    if(canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    dragging=false;moved=Infinity;pointerDownId=null;orbitVelocityX=0;orbitVelocityY=0;canvas.classList.remove("dragging")
  }
  function onPointerLeave(){if(!dragging){pointer.x=-999;pointer.y=-999;hoveredId=null;if(!mobileLabels.matches){lastPreviewId=null;lastPreviewMode=null;setPreviewFocus(null,"leave")}targetPassiveRotX=0;targetPassiveRotY=0;targetPassivePanX=0;targetPassivePanY=0;canvas.classList.remove("node-hover");requestFrame()}}
  function onWheel(event){event.preventDefault();targetZoom=clamp(targetZoom*(event.deltaY>0 ? .92 : 1.08),.62,1.65);requestFrame()}
  function onVisibility(){if(document.hidden) stopFrame();else requestFrame()}
  function onReducedMotion(){requestFrame()}

  function mount(){
    if(mounted||destroyed) return
    mounted=true
    canvas.style.touchAction="none"
    canvas.addEventListener("pointerdown",onPointerDown);canvas.addEventListener("pointermove",onPointerMove);canvas.addEventListener("pointerup",onPointerUp);canvas.addEventListener("pointercancel",onPointerCancel);canvas.addEventListener("pointerleave",onPointerLeave);canvas.addEventListener("wheel",onWheel,{passive:false})
    document.addEventListener("visibilitychange",onVisibility);reduceMotion.addEventListener("change",onReducedMotion);mobileLabels.addEventListener("change",onReducedMotion)
    sync();resize();requestFrame()
  }
  function unmount(){if(!mounted)return;hide();mounted=false}
  function show(){if(destroyed)return;shown=true;canvas.hidden=false;resize();sync();applyCategoryFraming("show",{force:true});updateCategoryLens("show");requestFrame()}
  function hide(){shown=false;canvas.hidden=true;dragging=false;hoveredId=null;pointerDownId=null;previewFocusId=null;lastPreviewId=null;targetPassiveRotX=targetPassiveRotY=passiveRotX=passiveRotY=0;targetPassivePanX=targetPassivePanY=passivePanX=passivePanY=0;orbitVelocityX=orbitVelocityY=0;hoverLabel?.classList.remove("on");onPreviewClear("hide");stopFrame()}
  function resetView(){
    targetPassiveRotX=targetPassiveRotY=passiveRotX=passiveRotY=0;targetPassivePanX=targetPassivePanY=passivePanX=passivePanY=0;orbitVelocityX=orbitVelocityY=0
    const key=categoryKeyForNodes()
    if(key==="map"){
      savedMapCamera=null
      const profile=activeCategoryProfile()
      rotX=targetRotX=clamp(profile?.rotX||0,-rotationLimit.x,rotationLimit.x)
      rotY=targetRotY=clamp(profile?.rotY||0,-rotationLimit.y,rotationLimit.y)
      zoom=targetZoom=clamp(profile?.zoom||1,.62,1.65)
      panY=targetPanY=profile?.panY||0
    }
    else applyCategoryFraming("fit",{force:true})
    requestFrame()
  }
  function fit(){applyCategoryFraming("fit",{force:true});requestFrame()}
  function reframe(){panY=targetPanY=0;requestFrame()}
  function focusNode(id) {
    const node=nodes.find(candidate=>candidate.id===id)
    if(!node) return
    targetRotY=clamp(-Math.atan2(node.x,720),-rotationLimit.y,rotationLimit.y)
    targetRotX=clamp(Math.atan2(node.y,900),-rotationLimit.x,rotationLimit.x)
    targetZoom=1.08
    targetPanY=-Math.min(120,Math.max(56,height*.18))
    requestFrame()
  }
  function getCameraState() {
    const activeCategory=[...document.querySelectorAll("#clusterNav button")].find(button=>button.classList.contains("active"))?.textContent?.trim()||null
    const animating=Math.abs(targetRotX-rotX)>.001||Math.abs(targetRotY-rotY)>.001||Math.abs(targetZoom-zoom)>.001||Math.abs(targetPanY-panY)>.1||Math.abs(targetPassiveRotX-passiveRotX)>.0002||Math.abs(targetPassiveRotY-passiveRotY)>.0002||Math.abs(targetPassivePanX-passivePanX)>.05||Math.abs(targetPassivePanY-passivePanY)>.05||Math.abs(orbitVelocityX)>.00002||Math.abs(orbitVelocityY)>.00002
    return {
      position:{x:rotX,y:panY,z:zoom},
      target:{x:targetRotX,y:targetPanY,z:targetZoom},
      zoom,
      rotationX:rotX,
      rotationY:rotY,
      passiveRotationX:passiveRotX,
      passiveRotationY:passiveRotY,
      mode:shown?"RHIZOME 3D":"hidden",
      selectedNode:getCurrentId?.()||null,
      activeCategory,
      isAnimating:animating,
      timestamp:Date.now()
    }
  }
  function getFrameMetrics() {
    return lastFrameMetrics ? JSON.parse(JSON.stringify(lastFrameMetrics)) : null
  }
  function publishDiagnostics(){
    globalThis.__bogobotRhizomeDiagnostics=Object.freeze({getCameraState,getFrameMetrics})
  }
  publishDiagnostics()
  function showConnections(id) {
    connectionFocusId=id
    requestFrame()
  }
  function previewNode(id,reason="program") {
    setPreviewFocus(id,reason,{card:true})
  }
  function clearPreview() {
    setPreviewFocus(null,"program")
  }
  function refreshPreviewLabels() {
    requestFrame()
  }
  function destroy(){
    if(destroyed)return;hide();destroyed=true
    canvas.removeEventListener("pointerdown",onPointerDown);canvas.removeEventListener("pointermove",onPointerMove);canvas.removeEventListener("pointerup",onPointerUp);canvas.removeEventListener("pointercancel",onPointerCancel);canvas.removeEventListener("pointerleave",onPointerLeave);canvas.removeEventListener("wheel",onWheel)
    document.removeEventListener("visibilitychange",onVisibility);reduceMotion.removeEventListener("change",onReducedMotion);mobileLabels.removeEventListener("change",onReducedMotion)
  }
  return {mount,unmount,show,hide,resize,sync,resetView,fit,reframe,focusNode,showConnections,previewNode,clearPreview,refreshPreviewLabels,getCameraState,getFrameMetrics,destroy}
}
