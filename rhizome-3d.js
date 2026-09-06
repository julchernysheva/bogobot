const COLORS = Object.freeze({
  background: "#050607",
  black: [5, 6, 7],
  paper: [231, 230, 224],
  blue: [0, 60, 255],
  signal: [127, 227, 138]
})

const RELICS_NODE_IDS = new Set(["RELICS","MESM","BESM_6","MAGNETIC_DRUM","PUNCHED_TAPE","ALGOL_60","OGAS"])
const HISTORY_ONLY_MAP_NODE_IDS = new Set(["PRE_ERROR_ARCHIVE","EPSILON_00","EPSILON_01","EPSILON_02","EPSILON_06","EPSILON_20_21","EPSILON_22_26","EPSILON_27_29","EPSILON_30"])

const rgba = (color, alpha) => `rgba(${color[0]},${color[1]},${color[2]},${alpha})`
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const paperToneAlpha = (brightness, alpha) => clamp(alpha*((brightness-6)/(230-6)),0,1)

export function createRhizome3D({
  canvas,
  hoverLabel,
  getNodes,
  getEdges,
  getCurrentId,
  getRecommendedId,
  getRecommendedIds=()=>[],
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
  let mounted=false,shown=false,destroyed=false,dragging=false,hoveredId=null,pointerDownId=null,activePointerId=null
  let lastX=0,lastY=0,pointerStartX=0,pointerStartY=0,moved=0,frame=0
  let hitLabels=[]
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
    world:Object.freeze({desktop:Object.freeze({rotX:-.22,rotY:.32,zoom:.82,panY:0,focusId:"0xMEM",centerBias:.06}),mobile:Object.freeze({rotX:-.24,rotY:.36,zoom:.88,panY:0,focusId:"0xMEM",centerBias:.08})}),
    schools:Object.freeze({desktop:Object.freeze({rotX:-.36,rotY:.26,zoom:.88,panY:0}),mobile:Object.freeze({rotX:-.36,rotY:.26,zoom:.92,panY:0})}),
    glossary:Object.freeze({desktop:Object.freeze({rotX:.28,rotY:.54,zoom:.88,panY:0}),mobile:Object.freeze({rotX:.28,rotY:.54,zoom:.92,panY:0})}),
    topography:Object.freeze({desktop:Object.freeze({rotX:.38,rotY:.72,zoom:.98,panY:0,focusId:"TOPOGRAPHY",centerBias:.12}),mobile:Object.freeze({rotX:.30,rotY:-.64,zoom:.92,panY:0,focusId:"TOPOGRAPHY",centerBias:.16})}),
    history:Object.freeze({desktop:Object.freeze({rotX:.34,rotY:.30,zoom:.78,panY:0,focusId:"GREAT_ERROR",centerBias:.08}),mobile:Object.freeze({rotX:.32,rotY:.34,zoom:.80,panY:0,focusId:"GREAT_ERROR",centerBias:.14})}),
    relics:Object.freeze({desktop:Object.freeze({rotX:.24,rotY:.28,zoom:.82,panY:0,focusId:"RELICS",centerBias:.06}),mobile:Object.freeze({rotX:.18,rotY:.34,zoom:.90,panY:0,focusId:"RELICS",centerBias:.08})})
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
    world:Object.freeze({anchorId:"0xMEM",centerBiasX:.30,centerBiasY:.34,nodeOpacityFloor:.70,edgeOpacityFloor:.40,edgeWidthFloor:1.28,nodeScale:1.44,farNodeBoost:.16,anchorScale:1.48,positions:Object.freeze({
      BRAINROT:Object.freeze({x:-150,y:55,z:120}),
      "0xMEM":Object.freeze({x:0,y:0,z:220}),
      NETWORK_MATTER:Object.freeze({x:145,y:35,z:80}),
      CULTURE:Object.freeze({x:-105,y:-110,z:-60}),
      RITUALS:Object.freeze({x:25,y:125,z:150}),
      EXIT_FROM_CODE:Object.freeze({x:155,y:115,z:-120}),
      TOPOGRAPHY:Object.freeze({x:105,y:-105,z:-160})
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
    relics:Object.freeze({anchorId:"RELICS",centerBiasX:.10,centerBiasY:.08,nodeOpacityFloor:.70,edgeOpacityFloor:.40,edgeWidthFloor:1.28,nodeScale:1.38,anchorScale:1.76,farNodeBoost:.16,positions:Object.freeze({
      RELICS:Object.freeze({x:0,y:0,z:220}),
      MESM:Object.freeze({x:-150,y:-70,z:130}),
      BESM_6:Object.freeze({x:-120,y:95,z:40}),
      MAGNETIC_DRUM:Object.freeze({x:15,y:145,z:-140}),
      PUNCHED_TAPE:Object.freeze({x:120,y:75,z:-20}),
      ALGOL_60:Object.freeze({x:145,y:-55,z:110}),
      OGAS:Object.freeze({x:-65,y:-140,z:-110})
    })})
  })
  const categoryVisualProfiles=Object.freeze({
    map:Object.freeze({
      perspectiveDistance:680,
      depth:Object.freeze({scaleMin:.20,scaleMax:2.48,edgeFactorMin:.22,edgeFactorMax:1.86,brightnessMin:48,brightnessMax:252,nodeFarFade:.30,nodeNearBoost:.15}),
      display:Object.freeze({spreadX:1.22,spreadY:1.16,zScale:1.38,perspectiveScalePower:.30}),
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
  const coreRankFloorDiameter=Object.freeze({map:18.5,canon:21,glossary:14})
  const coreStrokeAlphaFloor=.88
  const coreStrokeWidthFloor=1.5
  const structuralStrokeAlphaCap=.68
  const structuralFillAlphaCap=.56
  const anchorLabels=Object.freeze(["BOGOBOT","GREAT_ERROR","FIRST_LIKENESS","ARCHIVE","BOOK_OF_GENESIS","PROTOCOL","GLOSSARY","SYNCHRONIZATION","RELICS","TOPOGRAPHY","CODE_COMMANDMENTS"])
  const labelTierPriority=Object.freeze({core:3,structural:2,trace:1})
  const edgeAlphaFloor=Object.freeze({main:.16,structural:.075,trace:.03})
  const edgeAtmosphere=Object.freeze({far:.46,midLift:.16,near:1})
  const continuityVisibilityThreshold=.085
  const rotationLimit=Object.freeze({x:.48,y:.78})
  const dragRotationSensitivity=.004

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
    const mapProjection=categoryKeyForNodes()==="map"
    const mobileMapFrame=mapProjection ? mobileLabels.matches ? .90 : width<900 ? .94 : 1 : 1
    const scale=Math.min(width*widthUsage*.5/halfSpanX,height*projectionConfig.heightUsage*.5/halfSpanY)*zoomLevel*mobileMapFrame
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
    const mobileMapSafeInset=mobileLabels.matches&&categoryKeyForNodes()==="map" ? 6 : 0
    return {x:width*.5+(normalizedX-viewport.centerX)*viewport.scale+lensPanX+passivePanX*layerResponse+mobileMapSafeInset,y:height*.5+(normalizedY-viewport.centerY)*viewport.scale+panY+lensPanY+passivePanY*layerResponse,z:point.z,s:viewport.scale*perspective,perspective}
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
    const semanticScale=node.id===anchorId?anchorScale:1
    const perspectiveScale=Math.pow(point.perspective||1,activeVisualProfile()?.display?.perspectiveScalePower||0)
    const projectedRadius=base*(node.id==="BOGOBOT"?1.12:1)*historyScale*point.depthScale*perspectiveScale*categoryScale*farBoost*semanticScale
    const type=shapeType(node)
    const floorDiameter=type==="history"?5:type==="glossary"||type==="topography"||type==="relics"?6:4
    const semanticRole=resolveSemanticRole(node,anchorId)
    const rankFloorDiameter=semanticRole==="CORE"?(coreRankFloorDiameter[categoryKeyForNodes()]||0):0
    const semanticRadius=Math.max(projectedRadius,floorDiameter/2,rankFloorDiameter/2)
    return semanticRadius*(node.id===hoveredId?1.14:1)
  }

  const mobileNodeVisualScale=.86
  const visualNodeRadius=radius=>radius*(width<=899?mobileNodeVisualScale:1)

  function relaxDesktopProjection(items,sceneKey) {
    if(sceneKey!=="map"||width<1024||mobileLabels.matches||items.length<2) return {active:false,iterations:0}
    const activeId=selectedVisualFocusId()||getCurrentId?.()||"BOGOBOT"
    const states=items.map(item=>({
      item,
      x:item.point.x,
      y:item.point.y,
      originX:item.point.x,
      originY:item.point.y,
      radius:nodeRadius(item.node,item.point)
    }))
    const activeState=states.find(state=>state.item.node.id===activeId)||states.find(state=>state.item.node.id==="BOGOBOT")
    if(!activeState) return {active:false,iterations:0}
    const stableAngle=(a,b)=>{
      const key=`${a.item.node.id}:${b.item.node.id}`
      let hash=2166136261
      for(let index=0;index<key.length;index+=1) hash=Math.imul(hash^key.charCodeAt(index),16777619)
      return (hash>>>0)/4294967295*Math.PI*2
    }
    const centralRx=width*.20,centralRy=height*.27
    const collisionPairs=[]
    for(let left=0;left<states.length;left+=1){
      for(let right=left+1;right<states.length;right+=1){
        const a=states[left],b=states[right]
        const midpointX=(a.x+b.x)*.5,midpointY=(a.y+b.y)*.5
        const local=Math.abs(midpointX-activeState.x)<=centralRx&&Math.abs(midpointY-activeState.y)<=centralRy
        if(!local) continue
        const target=a.radius+b.radius+7
        if(Math.hypot(b.x-a.x,b.y-a.y)<target) collisionPairs.push({left,right,target})
      }
    }
    const plaqueZone=activeState.item.node.id==="BOGOBOT"
      ? {minX:activeState.x-activeState.radius-16-70-4,maxX:activeState.x+activeState.radius+5,minY:activeState.y-16,maxY:activeState.y+16}
      : null
    const plaqueClearance=plaqueZone ? states.reduce((entries,state,index)=>{
      if(state===activeState) return entries
      const nearestX=clamp(state.x,plaqueZone.minX,plaqueZone.maxX)
      const nearestY=clamp(state.y,plaqueZone.minY,plaqueZone.maxY)
      const target=state.radius*1.42+4
      if(Math.hypot(state.x-nearestX,state.y-nearestY)<target) entries.push({index,target})
      return entries
    },[]) : []
    if(!collisionPairs.length&&!plaqueClearance.length) return {active:true,iterations:0,collisionPairs:[],plaqueClearance:0,displaced:[],maxDisplacement:0,meanDisplacement:0,untouched:states.length}
    const movableIds=new Set([
      ...collisionPairs.flatMap(pair=>[states[pair.left].item.node.id,states[pair.right].item.node.id]),
      ...plaqueClearance.map(entry=>states[entry.index].item.node.id)
    ])
    const mobility=state=>{
      const id=state.item.node.id
      if(id===activeId) return 0
      if(id===pulseEdge?.target||getNodeTier(state.item.node)==="core") return .42
      return 1
    }
    const iterations=32
    for(let iteration=0;iteration<iterations;iteration+=1){
      const cooling=1-iteration/iterations*.35
      const offsets=states.map(()=>({x:0,y:0}))
      collisionPairs.forEach(pair=>{
        const a=states[pair.left],b=states[pair.right]
        let dx=b.x-a.x,dy=b.y-a.y
        let distance=Math.hypot(dx,dy)
        if(distance<.001){const angle=stableAngle(a,b);dx=Math.cos(angle);dy=Math.sin(angle);distance=1}
        if(distance>=pair.target) return
        const force=(pair.target-distance)/pair.target*4.4*cooling
        const ux=dx/distance,uy=dy/distance
        const mobilityA=mobility(a),mobilityB=mobility(b),mobilitySum=mobilityA+mobilityB
        offsets[pair.left].x-=ux*force*mobilityA/mobilitySum*2
        offsets[pair.left].y-=uy*force*mobilityA/mobilitySum*2
        offsets[pair.right].x+=ux*force*mobilityB/mobilitySum*2
        offsets[pair.right].y+=uy*force*mobilityB/mobilitySum*2
      })
      plaqueClearance.forEach(({index,target})=>{
        const state=states[index]
        const nearestX=clamp(state.x,plaqueZone.minX,plaqueZone.maxX)
        const nearestY=clamp(state.y,plaqueZone.minY,plaqueZone.maxY)
        let dx=state.x-nearestX,dy=state.y-nearestY
        let distance=Math.hypot(dx,dy)
        if(distance<.001){
          const angle=stableAngle(activeState,state)
          dx=0;dy=Math.sin(angle)>=0?1:-1;distance=1
        }
        if(distance>=target) return
        const force=(target-distance)/target*3.6*cooling*mobility(state)
        offsets[index].x+=dx/distance*force
        offsets[index].y+=dy/distance*force
      })
      states.forEach((state,index)=>{
        if(!movableIds.has(state.item.node.id)) return
        offsets[index].x+=(state.originX-state.x)*.18
        offsets[index].y+=(state.originY-state.y)*.18
        const nextX=state.x+offsets[index].x,nextY=state.y+offsets[index].y
        const shiftX=nextX-state.originX,shiftY=nextY-state.originY
        const shift=Math.hypot(shiftX,shiftY)
        const limit=36
        const limited=shift>limit?limit/shift:1
        state.x=state.originX+shiftX*limited
        state.y=state.originY+shiftY*limited
      })
    }
    const displaced=[]
    states.forEach(state=>{
      const displacement=Math.hypot(state.x-state.originX,state.y-state.originY)
      if(displacement>.05){
        state.item.point.x=state.x
        state.item.point.y=state.y
        displaced.push({id:state.item.node.id,displacement})
      }
    })
    const total=displaced.reduce((sum,item)=>sum+item.displacement,0)
    return {
      active:true,
      iterations,
      collisionPairs:collisionPairs.map(pair=>[states[pair.left].item.node.id,states[pair.right].item.node.id]),
      plaqueClearance:plaqueClearance.length,
      displaced,
      maxDisplacement:displaced.length?Math.max(...displaced.map(item=>item.displacement)):0,
      meanDisplacement:displaced.length?total/displaced.length:0,
      untouched:states.length-displaced.length
    }
  }

  function applyDesktopCompositionOffsets(items,sceneKey) {
    if(sceneKey!=="map"||width<1024||mobileLabels.matches) return {active:false,moved:[]}
    const rect=canvas.getBoundingClientRect()
    const viewportHeight=rect.bottom
    const targets=new Map([
      ["WANDERING_NODES",{x:335/1440,y:315/900}],
      ["EPSILON_06",{x:390/1440,y:318/900}],
      ["EPSILON_20_21",{x:350/1440,y:615/900}],
      ["VARANASI",{x:420/1440,y:612/900}]
    ])
    const moved=[]
    items.forEach(item=>{
      const target=targets.get(item.node.id)
      const originalX=item.point.x,originalY=item.point.y
      if(!target) return
      item.point.x=width*target.x
      item.point.y=viewportHeight*target.y-rect.top
      moved.push({id:item.node.id,originalX,originalY,x:item.point.x,y:item.point.y})
    })
    return {active:true,moved}
  }

  function relocateCoreOuterRing(items,sceneKey) {
    if(sceneKey!=="map"||width<1024||mobileLabels.matches) return {active:false,moved:[]}
    const rect=canvas.getBoundingClientRect()
    const viewportHeight=rect.bottom
    const targets=new Map([
      ["PRE_ERROR_ARCHIVE",{x:285/1440,y:380/900}],
      ["EPSILON_02",{x:455/1440,y:315/900}],
      ["EPSILON_01",{x:630/1440,y:400/900}],
      ["EPSILON_00",{x:600/1440,y:590/900}],
      ["MESM",{x:300/1440,y:570/900}]
    ])
    const moved=[]
    items.forEach(item=>{
      const target=targets.get(item.node.id)
      if(!target) return
      const originalX=item.point.x,originalY=item.point.y
      item.point.x=width*target.x
      item.point.y=viewportHeight*target.y-rect.top
      moved.push({id:item.node.id,originalX,originalY,x:item.point.x,y:item.point.y,displacement:Math.hypot(item.point.x-originalX,item.point.y-originalY)})
    })
    return {active:true,moved}
  }

  function safeguardOuterRingCollisions(items,relocation,sceneKey) {
    if(sceneKey!=="map"||!relocation.active||!relocation.moved.length) return {active:false,moved:[]}
    const relocatedIds=new Set(relocation.moved.map(item=>item.id))
    const moved=[]
    relocation.moved.forEach(record=>{
      const item=items.find(candidate=>candidate.node.id===record.id)
      if(!item) return
      let correctionX=0,correctionY=0
      items.forEach(other=>{
        if(other===item) return
        const target=nodeRadius(item.node,item.point)+nodeRadius(other.node,other.point)+8
        let dx=item.point.x-other.point.x,dy=item.point.y-other.point.y
        let distance=Math.hypot(dx,dy)
        if(distance>=target) return
        if(distance<.001){dx=-1;dy=1;distance=Math.SQRT2}
        const overlap=target-distance
        correctionX+=dx/distance*overlap
        correctionY+=dy/distance*overlap
      })
      const correction=Math.hypot(correctionX,correctionY)
      if(correction<=.05) return
      const limited=Math.min(8,correction)/correction
      item.point.x+=correctionX*limited
      item.point.y+=correctionY*limited
      moved.push({id:item.node.id,dx:correctionX*limited,dy:correctionY*limited,displacement:Math.min(8,correction)})
    })
    return {active:true,relocatedIds:[...relocatedIds],moved}
  }

  function resolveBogobotCore(items,sceneKey) {
    if(sceneKey!=="map"||width<1024||mobileLabels.matches) return {active:false,moved:[]}
    const bogobot=items.find(item=>item.node.id==="BOGOBOT")
    if(!bogobot) return {active:false,moved:[]}
    const lockedIds=new Set(["BOGOBOT",getCurrentId?.(),selectedVisualFocusId(),pulseEdge?.target].filter(Boolean))
    const local=items.filter(item=>Math.hypot(item.point.x-bogobot.point.x,item.point.y-bogobot.point.y)<=105)
    const collisions=[]
    for(let left=0;left<local.length;left+=1){
      for(let right=left+1;right<local.length;right+=1){
        const a=local[left],b=local[right]
        const distance=Math.hypot(b.point.x-a.point.x,b.point.y-a.point.y)
        const target=nodeRadius(a.node,a.point)+nodeRadius(b.node,b.point)+15
        if(distance>=target) continue
        const movable=[a,b].filter(item=>!lockedIds.has(item.node.id)&&getNodeTier(item.node)!=="core"&&item.node.id!=="MESM")
        if(!movable.length) continue
        movable.sort((first,second)=>(getNodeTier(first.node)==="trace"?-1:1)-(getNodeTier(second.node)==="trace"?-1:1)||first.node.id.localeCompare(second.node.id))
        collisions.push({a,b,movable:movable[0],overlap:target-distance})
      }
    }
    collisions.sort((a,b)=>b.overlap-a.overlap||a.movable.node.id.localeCompare(b.movable.node.id))
    const moved=[],movedIds=new Set()
    for(const collision of collisions){
      if(moved.length>=2||movedIds.has(collision.movable.node.id)) continue
      const item=collision.movable
      const other=item===collision.a?collision.b:collision.a
      let dx=item.point.x-other.point.x,dy=item.point.y-other.point.y
      let distance=Math.hypot(dx,dy)
      if(distance<.001){dx=-1;dy=1;distance=Math.SQRT2}
      const displacement=Math.min(18,collision.overlap)
      item.point.x+=dx/distance*displacement
      item.point.y+=dy/distance*displacement
      movedIds.add(item.node.id)
      moved.push({id:item.node.id,dx:dx/distance*displacement,dy:dy/distance*displacement,displacement})
    }
    return {active:true,cluster:local.map(item=>item.node.id),gap:15,moved}
  }

  function selectedVisualFocusId() {
    return getActiveSelectionId?.()||null
  }

  function selectedCurrentVisualId() {
    const selectedId=selectedVisualFocusId()
    if(selectedId) return selectedId
    const currentId=getCurrentId?.()||null
    return currentId&&currentId!=="BOGOBOT"?currentId:null
  }

  function activeVisualFocusId() {
    return hoveredId||selectedCurrentVisualId()||previewFocusId||null
  }

  function resolveSemanticRole(node,anchorId=null) {
    const tier=getNodeTier(node)
    if(node.id==="BOGOBOT") return "SYSTEM_ANCHOR"
    if(node.id===anchorId) return "CATEGORY_ANCHOR"
    if(tier==="core") return "CORE"
    if(tier==="structural") return "STRUCTURAL"
    if(tier==="trace") return "TRACE"
    return "ORDINARY"
  }

  function resolveVisualState(node,{selectedCurrentId=null,relatedIds=new Set(),anchorId=null}={}) {
    const semanticRole=resolveSemanticRole(node,anchorId)
    const interactionState=node.id===hoveredId?"HOVER":node.id===selectedCurrentId?"SELECTED_CURRENT":relatedIds.has(node.id)?"RELATED":getNodeTier(node)==="trace"?"BACKGROUND":"NEUTRAL"
    const labelPriority={BACKGROUND:10,NEUTRAL:40,RELATED:90,SELECTED_CURRENT:140,HOVER:150}[interactionState]
    return {
      semanticRole,isMajorWithinTier:node.major===true,interactionState,
      semanticCoreScale:1,
      stateScale:interactionState==="HOVER"?1.14:1,
      fillStrokeState:interactionState==="HOVER"||interactionState==="SELECTED_CURRENT"?"INTERACTION_BLUE":interactionState==="RELATED"?"RELATED_CONTRAST":"SEMANTIC_BASE",
      stateRing:interactionState==="HOVER"||interactionState==="SELECTED_CURRENT",
      plaque:interactionState==="SELECTED_CURRENT",
      labelPriority,
      labelVisible:interactionState!=="BACKGROUND",
      neighbourTreatment:interactionState==="HOVER"||interactionState==="SELECTED_CURRENT"?"FIRST_DEGREE_RELATED":"NONE",
      directEdgeState:interactionState==="HOVER"||interactionState==="SELECTED_CURRENT"?"PRIMARY":"UNCHANGED"
    }
  }

  function shapeType(node){return node.id==="BOGOBOT"?"canon":node.historyLayer||HISTORY_ONLY_MAP_NODE_IDS.has(node.id)?"history":RELICS_NODE_IDS.has(node.id)?"relics":getNodeType(node)}

  function shapePath(node,radius,scale=1) {
    const type=shapeType(node),r=radius*scale
    context.beginPath()
    if(type==="world") context.rect(-r,-r,r*2,r*2)
    else if(type==="relics"){
      for(let index=0;index<6;index++){
        const angle=-Math.PI/2+index*Math.PI/3
        const x=Math.cos(angle)*r,y=Math.sin(angle)*r
        if(index===0) context.moveTo(x,y)
        else context.lineTo(x,y)
      }
      context.closePath()
    }
    else if(type==="schools"){
      context.moveTo(0,-r*1.08);context.lineTo(r*1.08,0);context.lineTo(0,r*1.08);context.lineTo(-r*1.08,0);context.closePath()
    } else context.arc(0,0,r,0,Math.PI*2)
  }

  function interactionPath(node,radius,scale=1) {
    if(shapeType(node)!=="relics") return shapePath(node,radius,scale)
    context.beginPath()
    context.arc(0,0,radius*scale,0,Math.PI*2)
  }

  const interactionRingGapPx=width<=899?1:1.5
  const separatedInteractionScale=(radius,scale)=>scale+interactionRingGapPx/Math.max(1,radius)

  function drawShape(node,point,radius,{alpha=1,secondary=false,recommended=false,mapNeutral=false,hoverActivated=false,interactionState="NEUTRAL"}={}) {
    const type=shapeType(node)
    const semanticRole=resolveSemanticRole(node,activeAnchorId())
    const coreSemantic=semanticRole==="CORE"
    const restrainedStructural=semanticRole==="STRUCTURAL"&&interactionState==="NEUTRAL"
    const activeSystemAnchor=semanticRole==="SYSTEM_ANCHOR"&&interactionState==="SELECTED_CURRENT"
    const selectedFocus=isSelectableNode(node.id)&&(node.id===selectedCurrentVisualId())
    const desktopPrimaryMarker=!mobileLabels.matches&&Boolean(selectedVisualFocusId())&&pulseEdge?.target===node.id
    const isTopographyAnchor=type==="topography"&&node.id===activeAnchorId()
    const isHistory=type==="history"
    const neutralStructuralFill=restrainedStructural&&!secondary&&!desktopPrimaryMarker&&!isHistory
    const semanticFillAlpha=neutralStructuralFill?Math.min(alpha,structuralFillAlphaCap):alpha
    const restrainedRelatedFill=mapNeutral&&interactionState==="RELATED"&&!recommended
    const restrainedAnchorFill=mapNeutral&&!secondary&&!desktopPrimaryMarker&&type==="glossary"
    context.save()
    context.translate(point.x,point.y)
    if(desktopPrimaryMarker){
      context.fillStyle=COLORS.background
      context.strokeStyle=rgba(COLORS.paper,.96)
    } else if(mapNeutral){
      const neutralFillFactor=.82
      const neutralFillFloor=.36
      const neutralStrokeLift=.18
      const neutralStrokeFloor=.48
      context.fillStyle=secondary
        ? rgba(COLORS.paper,paperToneAlpha(178,restrainedRelatedFill?Math.min(.56,clamp(alpha+.08,.50,.84)):secondary==="a"?clamp(alpha+.12,.72,.94):clamp(alpha+.08,.62,.84)))
        : rgba(COLORS.paper,paperToneAlpha(88,clamp(semanticFillAlpha*neutralFillFactor,neutralFillFloor,.70)))
      context.strokeStyle=secondary
        ? rgba(COLORS.paper,paperToneAlpha(132,secondary==="a"?.78:.62))
        : rgba(COLORS.paper,paperToneAlpha(194,clamp(alpha+neutralStrokeLift,neutralStrokeFloor,.88)))
    } else {
      context.fillStyle=secondary==="a"?rgba(COLORS.paper,paperToneAlpha(178,clamp(alpha+.10,.46,.92))):rgba(COLORS.paper,secondary==="b"?clamp(alpha+.04,.32,.74):semanticFillAlpha)
      context.strokeStyle=secondary?rgba(COLORS.blue,secondary==="a"?.42:.24):rgba(COLORS.paper,paperToneAlpha(178,Math.min(1,alpha+.08)))
    }
    if(activeSystemAnchor){
      context.fillStyle=rgba(COLORS.signal,.96)
      context.strokeStyle=rgba(COLORS.paper,.98)
    }
    context.lineWidth=desktopPrimaryMarker?Math.max(1.35,radius*.10):secondary?Math.max(1.05,radius*(secondary==="a"?.075:.06)):isHistory?Math.max(.95,radius*.16):isTopographyAnchor?Math.max(2.15,radius*.18):type==="topography"?1.15:mapNeutral?1.25:1
    if(activeSystemAnchor) context.lineWidth=Math.max(context.lineWidth,1.65)
    if(restrainedStructural&&!secondary&&!desktopPrimaryMarker&&!isHistory){
      const neutralStrokeAlpha=mapNeutral?paperToneAlpha(194,clamp(alpha+.18,.48,.88)):paperToneAlpha(178,Math.min(1,alpha+.08))
      context.strokeStyle=rgba(COLORS.paper,Math.min(structuralStrokeAlphaCap,neutralStrokeAlpha))
    }
    if(coreSemantic&&!secondary&&!desktopPrimaryMarker&&!isHistory){
      const neutralStrokeAlpha=mapNeutral?paperToneAlpha(194,clamp(alpha+.18,.48,.88)):paperToneAlpha(178,Math.min(1,alpha+.08))
      context.strokeStyle=rgba(COLORS.paper,Math.max(coreStrokeAlphaFloor,neutralStrokeAlpha))
      context.lineWidth=Math.max(context.lineWidth,coreStrokeWidthFloor)
    }
    const fillAndStroke=()=>{context.fill();context.stroke()}
    if(isHistory){
      const r=radius*(node.historyThreshold?1.12:1)
      context.fillStyle=rgba(COLORS.black,.78)
      context.beginPath();context.arc(0,0,r,0,Math.PI*2);context.fill();context.stroke()
      context.strokeStyle=node.historyThreshold?rgba(COLORS.paper,Math.min(1,alpha+.18)):rgba(COLORS.paper,paperToneAlpha(178,Math.min(1,alpha+.12)))
      context.lineWidth=node.historyThreshold?Math.max(1.5,radius*.19):Math.max(.8,radius*.14)
      context.beginPath();context.moveTo(-r*.72,-r*.72);context.lineTo(r*.72,r*.72);context.moveTo(-r*.72,r*.72);context.lineTo(r*.72,-r*.72);context.stroke()
      context.fillStyle=rgba(COLORS.paper,Math.min(1,alpha+.06))
      context.beginPath();context.arc(0,0,Math.max(1.25,radius*(node.historyThreshold?.34:.26)),0,Math.PI*2);context.fill()
      if(node.historyThreshold){
        context.strokeStyle=rgba(COLORS.blue,.74)
        context.lineWidth=Math.max(1.05,radius*.10)
        context.beginPath();context.arc(0,0,radius*1.72,0,Math.PI*2);context.stroke()
      }
    } else if(type==="world"||type==="relics"){
      shapePath(node,radius);fillAndStroke()
    } else if(type==="schools"){
      shapePath(node,radius);fillAndStroke()
    } else if(type==="glossary"){
      if(restrainedAnchorFill){
        context.fillStyle=rgba(COLORS.paper,paperToneAlpha(88,clamp(alpha*.90,.42,.62)))
        context.beginPath();context.arc(0,0,radius*.76,0,Math.PI*2);context.fill()
      }
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
    if(desktopPrimaryMarker){
      context.fillStyle=rgba(COLORS.paper,1)
      context.beginPath();context.arc(0,0,clamp(radius*.18,1.5,2.5),0,Math.PI*2);context.fill()
    }
    if(selectedFocus||hoverActivated){
      context.strokeStyle=rgba(COLORS.blue,selectedFocus?.96:.84)
      context.lineWidth=selectedFocus?1.65:1.25
      const interactionScale=type==="glossary"?(selectedFocus?1.62:1.50):(selectedFocus?1.42:1.30)
      interactionPath(node,radius,separatedInteractionScale(radius,interactionScale))
      context.stroke()
    }
    context.restore()
  }

  function drawContour(node,point,radius,alpha=.82,scale=1.65) {
    context.save();context.translate(point.x,point.y)
    const isTopographyAnchor=shapeType(node)==="topography"&&node.id===activeAnchorId()
    const isHistory=shapeType(node)==="history"
    context.strokeStyle=rgba(COLORS.blue,alpha);context.lineWidth=isHistory?Math.max(1.15,radius*.12):isTopographyAnchor?Math.max(1.7,radius*.13):1.15
    if(isHistory){
      const r=radius*(node.historyThreshold?1.9:scale)
      context.beginPath();context.arc(0,0,r,0,Math.PI*2);context.stroke()
      context.beginPath();context.moveTo(-r*.62,0);context.lineTo(r*.62,0);context.moveTo(0,-r*.62);context.lineTo(0,r*.62);context.stroke()
    } else if(shapeType(node)==="topography"){
      const r=radius*(isTopographyAnchor?1.18:scale)
      context.beginPath();context.moveTo(-r,0);context.lineTo(r,0);context.moveTo(0,-r);context.lineTo(0,r);context.stroke()
      context.beginPath();context.arc(0,0,Math.max(2.2,radius*(isTopographyAnchor?.58:.46)),0,Math.PI*2);context.stroke()
    } else {interactionPath(node,radius,separatedInteractionScale(radius,scale));context.stroke()}
    context.restore()
  }

  function drawNeutralContour(node,point,radius,alpha=.58,scale=1.32) {
    context.save();context.translate(point.x,point.y)
    context.strokeStyle=rgba(COLORS.paper,paperToneAlpha(178,alpha));context.lineWidth=.9
    shapePath(node,radius,scale);context.stroke()
    context.restore()
  }

  function drawRecommendedAccent(point,radius) {
    context.save()
    context.translate(point.x,point.y)
    if(mobileLabels.matches){
      context.fillStyle=rgba(COLORS.signal,.90)
      context.beginPath()
      context.arc(radius*.82,-radius*.82,clamp(radius*.18,1.5,2.25),0,Math.PI*2)
      context.fill()
      context.restore()
      return
    }
    const pulse=reduceMotion.matches?.55:.5-.5*Math.cos((renderClock%2400)/2400*Math.PI*2)
    const coreRadius=clamp(radius*(.22+.05*pulse),2.1,4.5)
    const haloRadius=coreRadius*(1.65+.65*pulse)
    const halo=context.createRadialGradient(0,0,coreRadius*.45,0,0,haloRadius)
    halo.addColorStop(0,rgba(COLORS.signal,.34+.18*pulse))
    halo.addColorStop(.46,rgba(COLORS.signal,.18+.16*pulse))
    halo.addColorStop(1,rgba(COLORS.signal,0))
    context.fillStyle=halo
    context.beginPath()
    context.arc(0,0,haloRadius,0,Math.PI*2)
    context.fill()
    context.fillStyle=rgba(COLORS.signal,.88+.10*pulse)
    context.beginPath()
    context.arc(0,0,coreRadius,0,Math.PI*2)
    context.fill()
    context.restore()
  }

  function drawRecommendedOutline(node,point,radius) {
    context.save()
    context.translate(point.x,point.y)
    context.strokeStyle=rgba(COLORS.blue,.72)
    context.lineWidth=1.75
    context.shadowColor=rgba(COLORS.blue,.18)
    context.shadowBlur=4
    interactionPath(node,radius,separatedInteractionScale(radius,1.32))
    context.stroke()
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

  function drawNodeOcclusion(node,point,radius) {
    if(point.depth01<.18) return
    context.save()
    context.translate(point.x,point.y)
    context.fillStyle=COLORS.background
    if(shapeType(node)==="topography"){
      context.beginPath()
      context.arc(0,0,Math.max(2.1,radius*.38),0,Math.PI*2)
    } else shapePath(node,radius+.65)
    context.fill()
    context.restore()
  }

  function drawPulseRecipientResponse(node,point,radius,intensity=0) {
    if(intensity<=0) return
    const alpha=clamp(intensity,0,1)
    context.save()
    context.translate(point.x,point.y)
    const r=radius*(1+.03*alpha)
    context.strokeStyle=rgba(COLORS.signal,.42*alpha)
    context.lineWidth=1.15
    context.shadowColor=rgba(COLORS.signal,.24*alpha)
    context.shadowBlur=4
    interactionPath(node,r+1.25)
    context.stroke()
    context.restore()
  }

  function selectedPlaqueCandidate(item,text,textWidth,priority,persistent) {
    const {point,node}=item
    const radius=nodeRadius(node,point)
    const paddingX=7,plaqueWidth=Math.ceil(textWidth+paddingX*2),plaqueHeight=21
    if(node.id==="BOGOBOT"){
      const gap=mobileLabels.matches?12:16
      const leftX=point.x-radius-gap-plaqueWidth
      const anchorSide=leftX>=4?"left":"right"
      return {
        x:anchorSide==="left"?leftX:clamp(point.x+radius+gap,4,Math.max(4,width-plaqueWidth-4)),
        y:clamp(point.y,plaqueHeight/2+4,Math.max(plaqueHeight/2+4,height-plaqueHeight/2-4)),
        item,text,width:plaqueWidth,height:plaqueHeight,priority,persistent,plaque:true,paddingX,anchorSide,gap
      }
    }
    const candidates=[
      {x:point.x+radius+8,y:point.y},
      {x:point.x-radius-8-plaqueWidth,y:point.y},
      {x:point.x-plaqueWidth/2,y:point.y-radius-10-plaqueHeight/2},
      {x:point.x-plaqueWidth/2,y:point.y+radius+10+plaqueHeight/2}
    ].map(candidate=>({
      ...candidate,
      x:clamp(candidate.x,4,Math.max(4,width-plaqueWidth-4)),
      y:clamp(candidate.y,plaqueHeight/2+4,Math.max(plaqueHeight/2+4,height-plaqueHeight/2-4))
    }))
    const nodeClearance=candidate=>projected.reduce((clearance,other)=>{
      if(other.node.id===node.id) return clearance
      const otherRadius=nodeRadius(other.node,other.point)*1.42+3
      const nearestX=clamp(other.point.x,candidate.x,candidate.x+plaqueWidth)
      const nearestY=clamp(other.point.y,candidate.y-plaqueHeight/2,candidate.y+plaqueHeight/2)
      return Math.min(clearance,Math.hypot(other.point.x-nearestX,other.point.y-nearestY)-otherRadius)
    },Infinity)
    const candidate=candidates.find(candidate=>nodeClearance(candidate)>=0)
      ||candidates.reduce((best,current)=>nodeClearance(current)>nodeClearance(best)?current:best)
    return {...candidate,item,text,width:plaqueWidth,height:plaqueHeight,priority,persistent,plaque:true,paddingX}
  }

  function labelCandidate(item,priority,persistent=false,role="anchor") {
    const {node,point}=item,text=getNodeLabel(node)
    context.font=`${node.id==="BOGOBOT"?500:400} ${node.id==="BOGOBOT"?13:11}px "IBM Plex Mono",monospace`
    const textWidth=context.measureText(text).width
    if(role==="selected"&&node.id===selectedCurrentVisualId()) return selectedPlaqueCandidate(item,text,textWidth,priority,persistent)
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
    if(candidate.plaque){
      const plaqueColor=isBogobot?COLORS.signal:COLORS.blue
      context.fillStyle=rgba(COLORS.black,.96)
      context.strokeStyle=rgba(plaqueColor,.82)
      context.lineWidth=1
      context.beginPath()
      context.rect(x,y-candidate.height/2,candidate.width,candidate.height)
      context.fill();context.stroke()
      context.fillStyle=isBogobot?rgba(COLORS.signal,.96):rgba(COLORS.paper,.96)
      context.fillText(text,x+candidate.paddingX,y)
      context.restore()
      return
    }
    if(isBogobot){
      context.lineWidth=2.6
      context.strokeStyle=rgba(COLORS.black,.72)
      context.strokeText(text,x,y)
      context.fillStyle=selected?rgba(COLORS.signal,.88):rgba(COLORS.paper,clamp(.72+point.depth01*.20,.72,.92))
    } else context.fillStyle=selected?rgba(COLORS.paper,.88):recommended?rgba(COLORS.blue,1):hoverLabelActive?rgba(COLORS.paper,.94):rgba(COLORS.paper,clamp(.68+point.depth01*.22,.68,.90))
    context.fillText(text,x,y)
    context.restore()
  }

  function overlaps(a,b,mobile=false){
    const horizontalPadding=mobile?10:6,verticalPadding=mobile?6:3
    return a.x<b.x+b.width+horizontalPadding&&a.x+a.width+horizontalPadding>b.x
      &&a.y-a.height/2<b.y+b.height/2+verticalPadding&&a.y+a.height/2+verticalPadding>b.y-b.height/2
  }

  function clearsSelectedCluster(candidate,selectedPlaque){
    if(!selectedPlaque||candidate.item.node.id===selectedPlaque.item.node.id) return true
    const selectedPoint=selectedPlaque.item.point
    const proximity=mobileLabels.matches?128:156
    if(Math.hypot(candidate.item.point.x-selectedPoint.x,candidate.item.point.y-selectedPoint.y)>proximity) return true
    return !projected.some(other=>{
      if(other.node.id===candidate.item.node.id) return false
      const ringScale=other.node.id===selectedPlaque.item.node.id?1.9:1.42
      const ringRadius=nodeRadius(other.node,other.point)*ringScale+3
      const nearestX=clamp(other.point.x,candidate.x,candidate.x+candidate.width)
      const nearestY=clamp(other.point.y,candidate.y-candidate.height/2,candidate.y+candidate.height/2)
      return Math.hypot(other.point.x-nearestX,other.point.y-nearestY)<ringRadius
    })
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
    const screenComposition=applyDesktopCompositionOffsets(projected,sceneKey)
    const screenRelaxation=relaxDesktopProjection(projected,sceneKey)
    const coreResolution=resolveBogobotCore(projected,sceneKey)
    const outerRingRelocation=relocateCoreOuterRing(projected,sceneKey)
    const outerRingSafeguard=safeguardOuterRingCollisions(projected,outerRingRelocation,sceneKey)
    const screen=new Map(projected.map(item=>[item.node.id,item]))
    const currentId=selectedVisualFocusId()||getCurrentId?.()
    const recommendedIds=[...new Set((getRecommendedIds?.()||[]).filter(id=>id&&id!==currentId))]
    const recommendedId=getRecommendedId?.()||recommendedIds[0]||null
    const recommendedSet=new Set(recommendedIds.length?recommendedIds:recommendedId?[recommendedId]:[])
    const anchorId=activeAnchorId()
    const adjacency=new Map(nodes.map(node=>[node.id,[]]))
    edges.forEach(edge=>{adjacency.get(edge.source)?.push(edge.target);adjacency.get(edge.target)?.push(edge.source)})
    const edgeSourceIndex=new Map(edges.map((edge,index)=>[edgeIdentity(edge.source,edge.target),index]))
    const neighborSet=new Set(adjacency.get(currentId)||[])
    const selectedCandidateId=selectedCurrentVisualId()
    const selectedFocusId=selectedCandidateId&&screen.has(selectedCandidateId)?selectedCandidateId:null
    const selectedRecommendationPrecedence=Boolean(
      selectedFocusId
      && !hoveredId
      && resolveSemanticRole(screen.get(selectedFocusId).node,anchorId)!=="SYSTEM_ANCHOR"
    )
    const hoverFocusId=hoveredId||selectedFocusId||previewFocusId||connectionFocusId||null
    const hoverNeighborSet=new Set(hoverFocusId?(adjacency.get(hoverFocusId)||[]):[])
    const resolvedState=node=>resolveVisualState(node,{selectedCurrentId:selectedFocusId,relatedIds:hoverNeighborSet,anchorId})
    const hoverActivationId=hoveredId&&hoveredId!==hoverFocusId&&hoverNeighborSet.has(hoveredId)?hoveredId:null
    const anchorNeighborSet=new Set(anchorId?(adjacency.get(anchorId)||[]):[])
    const rankInteractionNeighbors=focusId=>focusId?[...(adjacency.get(focusId)||[])]
      .map(id=>screen.get(id)).filter(Boolean)
      .map(item=>{
        const key=edgeIdentity(focusId,item.node.id)
        const focusItem=screen.get(focusId)
        const semanticTier=focusItem?edgeClass(focusItem,item):"trace"
        return {id:item.node.id,item,key,semanticTier,sourceIndex:edgeSourceIndex.get(key)??Number.MAX_SAFE_INTEGER}
      })
      .sort((a,b)=>{
        const edgePriority={main:3,structural:2,history:2,trace:1}
        return (edgePriority[b.semanticTier]||0)-(edgePriority[a.semanticTier]||0)
          ||(labelTierPriority[getNodeTier(b.item.node)]||0)-(labelTierPriority[getNodeTier(a.item.node)]||0)
          ||a.sourceIndex-b.sourceIndex
          ||a.key.localeCompare(b.key)
      }):[]
    const rankedHoverNeighbors=mapScene?rankInteractionNeighbors(hoverFocusId):hoverFocusId?[...(adjacency.get(hoverFocusId)||[])]
      .map(id=>screen.get(id)).filter(Boolean)
      .map(item=>({id:item.node.id,item,distance:Math.hypot((screen.get(hoverFocusId)?.display.x||0)-item.display.x,(screen.get(hoverFocusId)?.display.y||0)-item.display.y,(screen.get(hoverFocusId)?.display.z||0)-item.display.z)}))
      .sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id)):[]
    const realHoverPreview=Boolean(hoveredId)
    const hoverPreviewPrimaryKey=realHoverPreview&&rankedHoverNeighbors[0]?edgeIdentity(hoverFocusId,rankedHoverNeighbors[0].id):null
    const mapHoverInteractionKeys=new Set(mapScene?rankedHoverNeighbors.slice(0,realHoverPreview?1:4).map(entry=>entry.key):[])
    const distinctHoverSelected=Boolean(mapScene&&hoveredId&&selectedFocusId&&hoveredId!==selectedFocusId)
    const mapSelectedInteractionKeys=new Set(mapScene&&selectedFocusId
      ? rankInteractionNeighbors(selectedFocusId).slice(0,distinctHoverSelected?2:4).map(entry=>entry.key)
      : [])
    const mapCombinedInteractionKeys=new Set([...mapHoverInteractionKeys,...mapSelectedInteractionKeys])
    const basePriorityNeighborIds=rankedHoverNeighbors.slice(0,realHoverPreview?1:3).map(entry=>entry.id)
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
    const edgeStyles={main:{alpha:.27,width:1.16},structural:{alpha:.145,width:.82},trace:{alpha:.055,width:.50},history:{alpha:.24,width:1.05}}
    const neutralEdgeAlphaScale=mapScene?1.30:1.20
    const edgeRenderMetrics=[]
    const frontWireSegments=[]
    const drawableEdges=edges.map(edge=>({edge,a:screen.get(edge.source),b:screen.get(edge.target)})).filter(item=>item.a&&item.b).map(item=>({...item,depth:(item.a.point.depth01+item.b.point.depth01)/2})).sort((left,right)=>left.depth-right.depth||left.edge.source.localeCompare(right.edge.source)||left.edge.target.localeCompare(right.edge.target))
    const structuralEdgeSegmentCount=5
    const spatialEdgeQueue=drawableEdges.flatMap(item=>{
      const {edge,a,b,depth}=item
      const neutralStructural=!(edge.source===currentId||edge.target===currentId)
        &&!Boolean(hoverFocusId&&(edge.source===hoverFocusId||edge.target===hoverFocusId))
        &&!Boolean((edge.source===currentId&&recommendedSet.has(edge.target))||(edge.target===currentId&&recommendedSet.has(edge.source)))
        &&!Boolean(anchorId&&(edge.source===anchorId||edge.target===anchorId))
        &&edge.kind!=="chronology"&&edge.kind!=="semantic"
        &&!Boolean(visualProfile?.importantEdges?.includes(edgeIdentity(edge.source,edge.target)))
      if(!neutralStructural) return [{...item,sortDepth:depth,semanticOverlay:true,segmentIndex:null}]
      return Array.from({length:structuralEdgeSegmentCount},(_,segmentIndex)=>{
        const start=segmentIndex/structuralEdgeSegmentCount,end=(segmentIndex+1)/structuralEdgeSegmentCount
        const segmentDepth=a.point.depth01+(b.point.depth01-a.point.depth01)*((start+end)/2)
        const interpolatePoint=t=>({
          x:a.point.x+(b.point.x-a.point.x)*t,
          y:a.point.y+(b.point.y-a.point.y)*t,
          z:a.point.z+(b.point.z-a.point.z)*t,
          depth01:a.point.depth01+(b.point.depth01-a.point.depth01)*t
        })
        return {
          ...item,
          depth:segmentDepth,
          a:{...a,point:interpolatePoint(start)},
          b:{...b,point:interpolatePoint(end)},
          sortDepth:segmentDepth,
          semanticOverlay:false,
          segmentIndex
        }
      })
    }).sort((left,right)=>Number(left.semanticOverlay)-Number(right.semanticOverlay)||left.sortDepth-right.sortDepth||left.edge.source.localeCompare(right.edge.source)||left.edge.target.localeCompare(right.edge.target)||((left.segmentIndex??-1)-(right.segmentIndex??-1)))
    const edgeDepthAtmosphere=depth01=>{
      const edgeDepth=smoothstep(depth01)
      const midDepthContinuity=Math.sin(Math.PI*edgeDepth)*edgeAtmosphere.midLift
      return clamp(edgeAtmosphere.far+(edgeAtmosphere.near-edgeAtmosphere.far)*edgeDepth+midDepthContinuity,edgeAtmosphere.far,edgeAtmosphere.near)
    }
    const activeEdgeDepthFactor=depth01=>clamp(edgeDepthAtmosphere(depth01),.72,1)
    const strongestVisibleEdge=new Map()
    drawableEdges.forEach(({edge,a,b,depth})=>{
      const edgeTier=edgeClass(a,b)
      const style=edgeStyles[edgeTier]
      const depthFactor=depthRuntime.edgeFactorMin+(depthRuntime.edgeFactorMax-depthRuntime.edgeFactorMin)*smoothstep(depth)
      const neutralAlpha=Math.min(1,Math.max(edgeAlphaFloor[edgeTier],style.alpha*depthFactor*(currentId?.length?.88:1)*(visualProfile?.edgeAlphaBoost||1))*neutralEdgeAlphaScale)
      ;[a,b].forEach(item=>{
        const visibility=neutralAlpha*edgeDepthAtmosphere(depth)
        const strongest=strongestVisibleEdge.get(item.node.id)
        if(!strongest||visibility>strongest.visibility) strongestVisibleEdge.set(item.node.id,{key:edgeIdentity(edge.source,edge.target),visibility})
      })
    })
    const continuityEdgeKeys=new Set([...strongestVisibleEdge.values()].filter(item=>item.visibility<continuityVisibilityThreshold).map(item=>item.key))
    const recommendationEdges=drawableEdges.filter(({edge})=>(edge.source===currentId&&recommendedSet.has(edge.target))||(edge.target===currentId&&recommendedSet.has(edge.source)))
    for(const {edge,a,b,depth,sortDepth,segmentIndex} of spatialEdgeQueue){
      const selectedEdge=edge.source===currentId||edge.target===currentId
      const edgeKey=edgeIdentity(edge.source,edge.target)
      const rawFocusEdge=Boolean(hoverFocusId&&(edge.source===hoverFocusId||edge.target===hoverFocusId))
      const focusEdge=Boolean(rawFocusEdge&&(!realHoverPreview||edgeKey===hoverPreviewPrimaryKey)&&(!mapScene||mapHoverInteractionKeys.has(edgeKey)))
      const focusNeighborId=focusEdge?(edge.source===hoverFocusId?edge.target:edge.source):null
      const primaryPathRelation=Boolean(pulseEdge&&edgeIdentity(edge.source,edge.target)===edgeIdentity(pulseEdge.source,pulseEdge.target))
      const recommendedRelation=Boolean((edge.source===currentId&&recommendedSet.has(edge.target))||(edge.target===currentId&&recommendedSet.has(edge.source)))
      const suppressGenericRecommendationEmphasis=selectedRecommendationPrecedence&&recommendedRelation&&!primaryPathRelation
      const emphasizedEdge=Boolean(focusEdge&&tierANeighborSet.has(focusNeighborId)&&!suppressGenericRecommendationEmphasis)
      const hoverEdgeTier=emphasizedEdge?"a":focusEdge?"b":null
      const hoverActivationEdge=Boolean(hoverActivationId&&hoverFocusId&&edgeIdentity(edge.source,edge.target)===edgeIdentity(hoverFocusId,hoverActivationId))
      const primaryPathEdge=Boolean(!mobileLabels.matches&&pulseEdge&&edgeIdentity(edge.source,edge.target)===pulseEdge.key)
      const anchorEdge=anchorId&&(edge.source===anchorId||edge.target===anchorId)
      const edgeTier=edgeClass(a,b)
      const style=edgeStyles[edgeTier]
      const historyEdge=edge.kind==="chronology"||edge.kind==="semantic"
      const chronologyEdge=edge.kind==="chronology"
      const compositionEdge=Boolean(visualProfile?.importantEdges?.includes(edgeIdentity(edge.source,edge.target)))
      const interactionDepth=activeEdgeDepthFactor(depth)
      const rawSelectedRelationship=Boolean(selectedFocusId&&selectedEdge)
      const selectedRelationship=Boolean(rawSelectedRelationship&&(!mapScene||mapSelectedInteractionKeys.has(edgeKey)))
      const connectionsVisible=connectionFocusId===currentId&&selectedEdge
      const edgeHierarchy=primaryPathEdge||hoverActivationEdge||focusEdge||emphasizedEdge||connectionsVisible||selectedRelationship||compositionEdge
        ? "primary"
        : historyEdge&&!chronologyEdge||edgeTier==="trace"
          ? "trace"
          : "structural"
      const relevanceBase=historyEdge
        ? hoverFocusId?(emphasizedEdge?1.48:focusEdge?.72:.54):selectedEdge?1.36:1
        : hoverFocusId?(emphasizedEdge?1.56:focusEdge?.68:.50):selectedEdge?1.12:anchorEdge?1.08:(currentId?.length ? .88 : 1)
      const relevance=relevanceBase*(compositionEdge&&!hoverFocusId?1.28:1)
      const depthFactor=depthRuntime.edgeFactorMin+(depthRuntime.edgeFactorMax-depthRuntime.edgeFactorMin)*(depth*depth*(3-2*depth))
      let alpha=historyEdge
        ? Math.max(chronologyEdge ? .19 : .075,(chronologyEdge ? .30 : .13)*(.72+depth*.52)*relevance)
        : Math.max(edgeAlphaFloor[edgeTier],style.alpha*depthFactor*relevance*(visualProfile?.edgeAlphaBoost||1))
      const categoryEdgeOpacityFloor=(lensProfile?.edgeOpacityFloor||0)*(edgeHierarchy==="primary"?1.15:edgeHierarchy==="trace"?.52:.88)
      let lineWidth=historyEdge
        ? (chronologyEdge?1.18:.62)*(.78+depth*.54)*(emphasizedEdge?1.18:selectedEdge?1.16:1)
        : Math.max(lensProfile?.edgeWidthFloor||0,style.width*(.52+depth*.88)*(emphasizedEdge?1.18:anchorEdge?1.12:1)*(compositionEdge&&!hoverFocusId?1.16:1)*(visualProfile?.edgeWidthBoost||1))
      context.beginPath();context.moveTo(a.point.x,a.point.y);context.lineTo(b.point.x,b.point.y)
      const staticFloor=mapScene&&!hoverFocusId ? 0 : categoryEdgeOpacityFloor
      if(primaryPathEdge){
        const focusAtSource=edge.source===hoverFocusId
        const from=focusAtSource?a:b
        const to=focusAtSource?b:a
        const activePath=context.createLinearGradient(from.point.x,from.point.y,to.point.x,to.point.y)
        activePath.addColorStop(0,rgba(COLORS.signal,.96))
        activePath.addColorStop(1,rgba(COLORS.paper,.78))
        context.strokeStyle=activePath
        context.lineWidth=2.25
        context.stroke()
        edgeRenderMetrics.push({edge:edgeIdentity(edge.source,edge.target),hierarchy:"primary",state:"active-path",alpha:.87,width:2.25})
        continue
      }
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
            context.strokeStyle=rgba(COLORS.blue,clamp(segment.alpha+.02,.90,1))
            context.lineWidth=segment.width
            context.stroke()
          })
          edgeRenderMetrics.push({edge:edgeIdentity(edge.source,edge.target),hierarchy:"primary",state:"hover-activation",alpha:.96,width:1.24})
          continue
        }
        context.strokeStyle=rgba(COLORS.blue,.70*interactionDepth)
      } else if(connectionsVisible) context.strokeStyle=rgba(COLORS.paper,paperToneAlpha(178,.62))
      else {
        const focusAlpha=mapScene?.40:.48
        const baseNeutralAlpha=focusEdge?Math.max(alpha,focusAlpha):historyEdge?Math.max(alpha,categoryEdgeOpacityFloor):Math.max(alpha,hoverFocusId?edgeAlphaFloor[edgeTier]:Math.max(staticFloor,categoryEdgeOpacityFloor))
        const recalibrationEligible=!selectedEdge&&!focusEdge&&!anchorEdge&&!primaryPathEdge&&!emphasizedEdge&&!hoverActivationEdge&&!connectionsVisible
        const appliedNeutralScale=recalibrationEligible?neutralEdgeAlphaScale:1
        const neutralAlpha=Math.min(1,baseNeutralAlpha*appliedNeutralScale)
        const atmosphericStroke=context.createLinearGradient(a.point.x,a.point.y,b.point.x,b.point.y)
        const atmosphericHalo=context.createLinearGradient(a.point.x,a.point.y,b.point.x,b.point.y)
        const continuityEdge=continuityEdgeKeys.has(edgeIdentity(edge.source,edge.target))
        const edgeDepth=smoothstep(depth)
        const edgeBrightness=depthRuntime.brightnessMin+Math.round(edgeDepth*(depthRuntime.brightnessMax-depthRuntime.brightnessMin))
        const existingAlpha=neutralAlpha*edgeDepthAtmosphere(depth)
        const continuityFloor=.075+.03*edgeDepth
        const edgeAlpha=continuityEdge?Math.max(existingAlpha,continuityFloor):existingAlpha
        const haloDepth=smoothstep(clamp((depth-.18)/.82,0,1))
        const endpointAlphas=[edgeAlpha,edgeAlpha]
        ;[0,1].forEach(index=>{
          atmosphericStroke.addColorStop(index,rgba(COLORS.paper,paperToneAlpha(edgeBrightness+3,edgeAlpha)))
          atmosphericHalo.addColorStop(index,rgba(COLORS.paper,paperToneAlpha(edgeBrightness+3,edgeAlpha*(.04+.26*haloDepth))))
        })
        if(segmentIndex!==null&&sortDepth>=.64){
          context.strokeStyle=COLORS.background
          context.lineWidth=lineWidth+1.1
          context.stroke()
          context.beginPath();context.moveTo(a.point.x,a.point.y);context.lineTo(b.point.x,b.point.y)
        }
        context.strokeStyle=atmosphericHalo
        context.lineWidth=lineWidth+3.2
        context.stroke()
        context.strokeStyle=atmosphericStroke
        if(segmentIndex!==null) frontWireSegments.push({edge,a,b,depth:sortDepth,alpha:edgeAlpha,brightness:edgeBrightness,width:lineWidth})
        if(segmentIndex===null||segmentIndex===Math.floor(structuralEdgeSegmentCount/2)) edgeRenderMetrics.push({edge:edgeIdentity(edge.source,edge.target),hierarchy:edgeHierarchy,state:focusEdge?"direct-focus":selectedRelationship?"selected":"neutral",alpha:endpointAlphas.reduce((sum,value)=>sum+value,0)/Math.max(1,endpointAlphas.length),width:lineWidth})
      }
      const renderedLineWidth=connectionsVisible?Math.max(1.45,lineWidth):hoverActivationEdge?1.35:emphasizedEdge?clamp(lineWidth,1.25,1.55):focusEdge?Math.max(1.12,lineWidth):selectedRelationship?Math.max(1.42,lineWidth):lineWidth
      context.lineWidth=renderedLineWidth;context.stroke()
      if(emphasizedEdge&&!hoverActivationEdge) edgeRenderMetrics.push({edge:edgeIdentity(edge.source,edge.target),hierarchy:"primary",state:"emphasized",alpha:.70*interactionDepth,width:renderedLineWidth})
      else if(connectionsVisible) edgeRenderMetrics.push({edge:edgeIdentity(edge.source,edge.target),hierarchy:"primary",state:"selected-connections",alpha:.62,width:renderedLineWidth})
    }
    recommendationEdges.forEach(({edge,a,b,depth})=>{
      if(!mobileLabels.matches&&pulseEdge&&edgeIdentity(edge.source,edge.target)===edgeIdentity(pulseEdge.source,pulseEdge.target)) return
      const interactionDepth=activeEdgeDepthFactor(depth)
      context.save()
      context.beginPath();context.moveTo(a.point.x,a.point.y);context.lineTo(b.point.x,b.point.y)
      if(!mobileLabels.matches){
        context.strokeStyle=rgba(COLORS.blue,.12*interactionDepth);context.lineWidth=3.5;context.shadowColor=rgba(COLORS.blue,.18*interactionDepth);context.shadowBlur=4;context.stroke()
        context.shadowBlur=0
        context.beginPath();context.moveTo(a.point.x,a.point.y);context.lineTo(b.point.x,b.point.y)
        context.strokeStyle=rgba(COLORS.blue,.64*interactionDepth);context.lineWidth=1.25;context.stroke()
      } else {
        context.strokeStyle=rgba(COLORS.blue,.72*interactionDepth);context.lineWidth=1.2;context.stroke()
      }
      context.restore()
    })
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
          trail.addColorStop(0,rgba(COLORS.signal,0))
          trail.addColorStop(1,rgba(COLORS.signal,.72))
          context.beginPath();context.moveTo(x-ux*trailLength,y-uy*trailLength);context.lineTo(x,y)
          context.strokeStyle=trail;context.lineWidth=1.35;context.stroke()
          const beadGlow=context.createRadialGradient(x,y,r*.25,x,y,r+2.2)
          beadGlow.addColorStop(0,rgba(COLORS.paper,.98))
          beadGlow.addColorStop(.38,rgba(COLORS.signal,.94))
          beadGlow.addColorStop(1,rgba(COLORS.signal,0))
          context.fillStyle=beadGlow
          context.beginPath();context.arc(x,y,r+2.2,0,Math.PI*2);context.fill()
          context.fillStyle=rgba(COLORS.signal,1)
          context.beginPath();context.arc(x,y,r,0,Math.PI*2);context.fill()
          context.fillStyle=rgba(COLORS.paper,.99)
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
          context.strokeStyle=rgba(COLORS.signal,.72*pulseRecipientIntensity)
          context.lineWidth=1.55
          context.stroke()
          context.restore()
        }
      }
    }

    const ordered=[...projected].sort((a,b)=>a.point.z-b.point.z||a.node.id.localeCompare(b.node.id))
    let selectedDrawItem=null
    for(const item of ordered){
      const {node,point}=item,active=node.id===currentId,recommended=recommendedSet.has(node.id)
      const tier=getNodeTier(node)
      const radius=nodeRadius(node,point)
      const opacityRange=tierOpacity[tier]||tierOpacity.structural
      let alpha=opacityRange[0]+(opacityRange[1]-opacityRange[0])*point.depth01
      if(node.historyLayer) alpha=(node.historyThreshold?.56:.34)+(node.historyThreshold?.42:.48)*point.depth01
      alpha=clamp(alpha-depthRuntime.nodeFarFade*(1-point.depth01)+depthRuntime.nodeNearBoost*point.depth01,.16,1)
      if(neighborSet.has(node.id)||anchorNeighborSet.has(node.id)) alpha=Math.min(1,alpha+.06)
      const visualState=resolvedState(node)
      const activeNeighbour=visualState.interactionState==="RELATED"
      const suppressRelatedRecommendationTier=selectedRecommendationPrecedence&&recommended&&activeNeighbour
      const neighbourTier=activeNeighbour&&!suppressRelatedRecommendationTier?(tierANeighborSet.has(node.id)?"a":"b"):false
      if(mapScene&&hoverFocusId){
        if(node.id===hoverFocusId) alpha=1
        else if(node.id===hoverActivationId) alpha=.96
        else if(activeNeighbour) alpha=neighbourTier==="a"?.88:.68
        else alpha=getNodeTier(node)==="trace"?Math.max(.28,alpha*.72):Math.max(.46,alpha*.76)
      } else if(hoverFocusId){
        if(node.id===hoverFocusId) alpha=1
        else if(hoverNeighborSet.has(node.id)) alpha=Math.min(1,alpha+.16)
        else if(node.id!==anchorId&&!active&&!recommended) alpha=Math.max(.36,alpha*.76)
      }
      if(node.id===hoverFocusId||recommended||node.id===anchorId||node.historyThreshold) alpha=1
      if(lensProfile?.nodeOpacityFloor) alpha=Math.max(alpha,lensProfile.nodeOpacityFloor-depthRuntime.categoryFarFloorDrop*(1-point.depth01))
      const visualRadius=visualNodeRadius(radius)
      item.visual={radius:visualRadius,scale:point.depthScale,opacity:alpha,depth01:point.depth01,z:point.z}
      if(node.id===hoverFocusId&&isSelectableNode(node.id)){
        selectedDrawItem=item
        continue
      }
      drawNodeOcclusion(node,point,visualRadius)
      drawShape(node,point,visualRadius,{alpha,secondary:mapScene?neighbourTier:false,recommended,mapNeutral:mapScene,hoverActivated:node.id===hoveredId,interactionState:visualState.interactionState})
    }

    const protectedNodeIds=new Set([currentId,selectedFocusId,hoverFocusId,anchorId,...recommendedSet].filter(Boolean))
    for(const segment of frontWireSegments){
      const dx=segment.b.point.x-segment.a.point.x,dy=segment.b.point.y-segment.a.point.y
      const lengthSquared=dx*dx+dy*dy
      if(lengthSquared<1) continue
      for(const item of ordered){
        const {node,point}=item
        if(node.id===segment.edge.source||node.id===segment.edge.target||protectedNodeIds.has(node.id)||resolvedState(node).interactionState!=="NEUTRAL") continue
        const radius=item.visual?.radius||nodeRadius(node,point)
        const t=clamp(((point.x-segment.a.point.x)*dx+(point.y-segment.a.point.y)*dy)/lengthSquared,0,1)
        if(t<=.02||t>=.98) continue
        const crossingX=segment.a.point.x+dx*t,crossingY=segment.a.point.y+dy*t
        if(Math.hypot(point.x-crossingX,point.y-crossingY)>Math.max(1.5,radius*.72)||segment.depth<=point.depth01+.08) continue
        context.save()
        context.translate(point.x,point.y)
        shapePath(node,Math.max(1,radius*.82))
        context.clip()
        context.setTransform(dpr,0,0,dpr,0,0)
        context.beginPath();context.moveTo(segment.a.point.x,segment.a.point.y);context.lineTo(segment.b.point.x,segment.b.point.y)
        context.strokeStyle=COLORS.background;context.lineWidth=segment.width+1.1;context.stroke()
        context.beginPath();context.moveTo(segment.a.point.x,segment.a.point.y);context.lineTo(segment.b.point.x,segment.b.point.y)
        context.strokeStyle=rgba(COLORS.paper,paperToneAlpha(segment.brightness+3,segment.alpha));context.lineWidth=segment.width;context.stroke()
        context.restore()
      }
    }

    const labelItems=[]
    const selectedItem=screen.get(currentId),recommendedItem=screen.get(recommendedId),hoveredItem=screen.get(hoveredId),previewItem=screen.get(previewFocusId),anchorItem=screen.get(anchorId)
    const activeSelectionItem=screen.get(selectedFocusId)
    const focusItem=hoveredItem||activeSelectionItem||previewItem
    const focusId=focusItem?.node.id||null
    const focusRole=focusItem&&focusItem.node.id===selectedFocusId&&!hoveredItem?"selected":"hover"
    const focusPriority=focusItem?resolvedState(focusItem.node).labelPriority:0
    const priorityIds=[...new Set(getPriorityLabelIds?.()||[])].filter(Boolean)
    const historyScene=sceneKey==="history"
    if(historyScene){
      const thresholdItem=projected.find(item=>item.node.historyThreshold)
      const focusItem=selectedItem||hoveredItem||thresholdItem
      if(thresholdItem) labelItems.push(labelCandidate(thresholdItem,118,true,"selected"))
      if(focusItem&&!labelItems.some(label=>label.item.node.id===focusItem.node.id)) labelItems.push(labelCandidate(focusItem,Math.max(120,focusPriority),true,focusRole))
      const focusNeighbors=(adjacency.get(focusItem?.node.id)||[]).map(id=>screen.get(id)).filter(Boolean)
      focusNeighbors.slice(0,realHoverPreview?1:mobileLabels.matches?2:4).forEach((item,index)=>{
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
      if(focusItem) labelItems.push(labelCandidate(focusItem,focusPriority,true,focusRole))
      else if(activeSelectionItem) labelItems.push(labelCandidate(activeSelectionItem,140,true,"selected"))
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
      if(focusItem) labelItems.push(labelCandidate(focusItem,focusPriority,true,focusRole))
      else if(activeSelectionItem) labelItems.push(labelCandidate(activeSelectionItem,140,true,"selected"))
      if(focusItem&&activeSelectionItem&&activeSelectionItem.node.id!==focusItem.node.id&&!labelItems.some(label=>label.item.node.id===activeSelectionItem.node.id)) labelItems.push(labelCandidate(activeSelectionItem,132,true,"selected"))
      if(!focusItem&&anchorItem&&anchorId!==currentId) labelItems.push(labelCandidate(anchorItem,108,true,"selected"))
      if(!focusItem) (visualProfile?.labels?.desktop||[]).forEach((id,index)=>{
        const item=screen.get(id)
        if(item&&id!==focusId&&!labelItems.some(label=>label.item.node.id===id)) labelItems.push(labelCandidate(item,96-index*5,true,"anchor"))
      })
      if(!focusItem&&!mapScene) priorityIds.forEach(id=>{const item=screen.get(id);if(item&&!labelItems.some(label=>label.item.node.id===id))labelItems.push(labelCandidate(item,110,true,id===recommendedId?"recommended":"anchor"))})
      if(!focusItem&&!mapScene&&recommendedItem&&recommendedId!==currentId&&!labelItems.some(label=>label.item.node.id===recommendedId)) labelItems.push(labelCandidate(recommendedItem,100,false,"recommended"))
      if(focusItem) rankedHoverNeighbors.slice(0,realHoverPreview?1:mapScene?1:3).map(entry=>entry.item).forEach((item,index)=>{
        if(item.node.id!==currentId&&!labelItems.some(label=>label.item.node.id===item.node.id)) labelItems.push(labelCandidate(item,94-index*4,false,"anchor"))
      })
      if(!focusItem&&!mapScene) anchorLabels.forEach(id=>{const item=screen.get(id);if(item&&!labelItems.some(label=>label.item.node.id===id))labelItems.push(labelCandidate(item,id==="BOGOBOT"?70:getNodeTier(item.node)==="core"?50:35,true))})
    }
    for(const item of ordered){
      const {node,point}=item,radius=item.visual?.radius||visualNodeRadius(nodeRadius(node,point)),active=node.id===currentId,recommended=recommendedSet.has(node.id),anchor=node.id===anchorId,hover=node.id===hoveredId||node.id===previewFocusId
      const primaryPathTarget=!mobileLabels.matches&&Boolean(selectedVisualFocusId())&&pulseEdge?.target===node.id
      if(node.id===hoverFocusId) continue
      if(isSelectableNode(node.id)&&hover) continue
      if(hover) drawContour(node,point,radius,.82,1.30)
      else if(active) drawNeutralContour(node,point,radius,.50,1.18)
      else if(anchor) drawContour(node,point,radius,.86,1.64)
      else if(recommended&&!primaryPathTarget) mobileLabels.matches ? drawContour(node,point,radius,mapScene?.70:.76,mapScene?1.24:1.32) : drawRecommendedOutline(node,point,radius)
      if(recommended&&!active&&!primaryPathTarget) drawRecommendedAccent(point,radius)
    }
    if(selectedDrawItem){
      const {node,point}=selectedDrawItem
      const selectedRadius=selectedDrawItem.visual?.radius||nodeRadius(node,point)
      if(pulseRecipientId&&pulseRecipientId!==node.id){
        const recipient=screen.get(pulseRecipientId)
        if(recipient) drawPulseRecipientResponse(recipient.node,recipient.point,recipient.visual?.radius||nodeRadius(recipient.node,recipient.point),pulseRecipientIntensity)
      }
      drawSelectedKnockout(point,selectedRadius)
      drawShape(node,point,selectedRadius,{alpha:selectedDrawItem.visual?.opacity||1,mapNeutral:mapScene,interactionState:resolvedState(node).interactionState})
    }
    const previewCardLabelId=getPreviewCardId?.()||null
    const accepted=[]
    let labelCollisionCount=0
    const selectedPlaque=labelItems.find(label=>label.plaque)||null
    labelItems.sort((a,b)=>b.priority-a.priority||b.item.point.depth01-a.item.point.depth01||a.item.node.id.localeCompare(b.item.node.id)).forEach(label=>{
      if(previewCardLabelId&&label.item.node.id===previewCardLabelId) return
      if(accepted.length>=(mobileLabels.matches?4:12)) return
      const shifts=label.priority>=100?[0,-22,22,-40,40,-58,58]:label.persistent?[0,-18,18]:[0]
      const placed=shifts.map(shift=>({...label,y:clamp(label.y+shift,9,height-9)})).find(candidate=>clearsSelectedCluster(candidate,selectedPlaque)&&!accepted.some(other=>overlaps(candidate,other,mobileLabels.matches)))
      if(placed) accepted.push(placed)
      else labelCollisionCount+=1
    })
    accepted.forEach(drawLabel)
    hitLabels=accepted.filter(label=>label.plaque).map(label=>({id:label.item.node.id,x:label.x,y:label.y-label.height/2,width:label.width,height:label.height}))
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
      edgeHierarchy:{visibleCount:drawableEdges.length,counts:edgeRenderMetrics.reduce((counts,item)=>(counts[item.hierarchy]=(counts[item.hierarchy]||0)+1,counts),{}),edges:edgeRenderMetrics},
      labels:{candidateCount:labelItems.length,acceptedCount:accepted.length,collisionCount:labelCollisionCount},
      continuity:{threshold:continuityVisibilityThreshold,edges:[...continuityEdgeKeys].sort()},
      recommendation:{activeId:currentId,ids:[...recommendedSet],edges:recommendationEdges.map(({edge})=>edgeIdentity(edge.source,edge.target)).sort()},
      screenComposition,
      coreResolution,
      outerRingRelocation,
      outerRingSafeguard,
      screenRelaxation,
      edgeBudget:{limit:mapScene?4:3,selectedLimit:mapScene?(distinctHoverSelected?2:4):null,ranking:mapScene?"base-edge-tier > neighbor-semantic-tier > source-order > edge-id":"display-distance > node-id",basePriorityIds:basePriorityNeighborIds,emphasizedIds:emphasizedNeighborIds,count:emphasizedNeighborIds.length,hoverInteractionEdges:[...mapHoverInteractionKeys],selectedInteractionEdges:[...mapSelectedInteractionKeys],combinedInteractionEdges:[...mapCombinedInteractionKeys],combinedCount:mapCombinedInteractionKeys.size,hoverReplacementId:hoverActivationId&&!basePriorityNeighborIds.includes(hoverActivationId)?hoverActivationId:null},
      pulse:{active:Boolean(pulseEdge&&hoverFocusId&&!reduceMotion.matches),source:pulseEdge?.source||null,target:pulseEdge?.target||null,key:pulseEdge?.key||null,reducedMotion:reduceMotion.matches,progress:pulseProgress,position:pulsePosition,recipient:{id:pulseRecipientId,intensity:pulseRecipientIntensity}},
      breathing:{active:!reduceMotion.matches&&hoverFocusId==="BOGOBOT",node:"BOGOBOT",cycleMs:2000},
      nodes:sortedVisuals,
      samples:{far:sortedVisuals[0]||null,mid:sortedVisuals[Math.floor(sortedVisuals.length/2)]||null,near:sortedVisuals[sortedVisuals.length-1]||null}
    }

    if(hoverLabel){
      hoverLabel.classList.remove("on")
    }
    const motionActive=!reduceMotion.matches&&(Boolean(pulseEdge&&hoverFocusId)||currentId==="BOGOBOT"||recommendedSet.size>0)
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
    targetPassiveRotX=0;targetPassiveRotY=0
    targetPassivePanX=0;targetPassivePanY=0
  }
  function hitDistance(item,radius) {
    const dx=Math.abs(pointer.x-item.point.x),dy=Math.abs(pointer.y-item.point.y)
    const type=shapeType(item.node),minimum=width<=899?22:20
    if(type==="world") return Math.max(dx,dy)/Math.max(minimum,radius*1.35)
    if(type==="schools") return (dx+dy)/Math.max(minimum*1.35,radius*1.55)
    if(type==="topography") return Math.min(Math.max(dx,dy*.42),Math.max(dy,dx*.42))/Math.max(minimum,radius*1.55)
    return Math.hypot(dx,dy)/Math.max(minimum,radius*1.45)
  }
  function hitPriority(node){
    if(node.id===hoveredId) return 150
    if(node.id===selectedCurrentVisualId()) return 140
    const focusId=activeVisualFocusId()
    if(focusId&&(adjacency.get(focusId)||[]).includes(node.id)) return 90
    if(node.id==="BOGOBOT") return 70
    return getNodeTier(node)==="trace"?10:40
  }
  function pickNode(){
    const candidates=projected.map(item=>{const radius=nodeRadius(item.node,item.point),hitScore=hitDistance(item,radius);return {...item,hitScore}}).filter(item=>item.hitScore<=1)
    candidates.sort((a,b)=>a.hitScore-b.hitScore||b.point.z-a.point.z||(hitPriority(b.node)-hitPriority(a.node))||a.node.id.localeCompare(b.node.id))
    return candidates[0]?.node.id||null
  }
  function pickTarget(){return hitLabels.find(label=>pointer.x>=label.x&&pointer.x<=label.x+label.width&&pointer.y>=label.y&&pointer.y<=label.y+label.height)?.id||pickNode()}
  function resetPointerGesture(){dragging=false;activePointerId=null;pointerDownId=null;moved=0;canvas.classList.remove("dragging")}
  function onPointerDown(event){updatePointer(event);pointerDownId=pickTarget();hoveredId=null;dragging=true;activePointerId=event.pointerId;moved=0;pointerStartX=lastX=event.clientX;pointerStartY=lastY=event.clientY;orbitVelocityX=0;orbitVelocityY=0;canvas.setPointerCapture(event.pointerId);canvas.classList.remove("node-hover");canvas.classList.add("dragging")}
  function onPointerMove(event){
    updatePointer(event)
    if(dragging&&event.pointerId===activePointerId){
      const dx=event.clientX-lastX,dy=event.clientY-lastY
      moved=Math.max(moved,Math.hypot(event.clientX-pointerStartX,event.clientY-pointerStartY))
      lastX=event.clientX;lastY=event.clientY
      if(moved>6){
        targetRotX=clamp(targetRotX+dy*dragRotationSensitivity,-rotationLimit.x,rotationLimit.x)
        targetRotY=clamp(targetRotY+dx*dragRotationSensitivity,-rotationLimit.y,rotationLimit.y)
      }
      requestFrame()
    }
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
    if(event.pointerId!==activePointerId) return
    updatePointer(event)
    const picked=pickTarget(),validTap=moved<=6&&picked&&picked===pointerDownId
    activePointerId=null
    if(canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    resetPointerGesture()
    if(validTap) onOpenNode?.(picked)
    else if(moved<=6&&mobileLabels.matches&&!picked) setPreviewFocus(null,"outside")
  }
  function onPointerCancel(event){
    if(event.pointerId!==activePointerId) return
    activePointerId=null
    if(canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    resetPointerGesture();orbitVelocityX=0;orbitVelocityY=0
  }
  function onLostPointerCapture(event){if(event.pointerId===activePointerId) resetPointerGesture()}
  function onPointerLeave(){if(!dragging){pointer.x=-999;pointer.y=-999;hoveredId=null;if(!mobileLabels.matches){lastPreviewId=null;lastPreviewMode=null;setPreviewFocus(null,"leave")}targetPassiveRotX=0;targetPassiveRotY=0;targetPassivePanX=0;targetPassivePanY=0;canvas.classList.remove("node-hover");requestFrame()}}
  function onWheel(event){event.preventDefault();targetZoom=clamp(targetZoom*(event.deltaY>0 ? .92 : 1.08),.62,1.65);requestFrame()}
  function onVisibility(){if(document.hidden) stopFrame();else requestFrame()}
  function onReducedMotion(){requestFrame()}

  function mount(){
    if(mounted||destroyed) return
    mounted=true
    canvas.style.touchAction="none"
    canvas.addEventListener("pointerdown",onPointerDown);canvas.addEventListener("pointermove",onPointerMove);canvas.addEventListener("pointerup",onPointerUp);canvas.addEventListener("pointercancel",onPointerCancel);canvas.addEventListener("lostpointercapture",onLostPointerCapture);canvas.addEventListener("pointerleave",onPointerLeave);canvas.addEventListener("wheel",onWheel,{passive:false})
    document.addEventListener("visibilitychange",onVisibility);reduceMotion.addEventListener("change",onReducedMotion);mobileLabels.addEventListener("change",onReducedMotion)
    sync();resize();requestFrame()
  }
  function unmount(){if(!mounted)return;hide();mounted=false}
  function show(){if(destroyed)return;shown=true;canvas.hidden=false;resize();sync();applyCategoryFraming("show",{force:true});updateCategoryLens("show");requestFrame()}
  function hide(){shown=false;canvas.hidden=true;resetPointerGesture();hoveredId=null;previewFocusId=null;lastPreviewId=null;hitLabels=[];targetPassiveRotX=targetPassiveRotY=passiveRotX=passiveRotY=0;targetPassivePanX=targetPassivePanY=passivePanX=passivePanY=0;orbitVelocityX=orbitVelocityY=0;hoverLabel?.classList.remove("on");onPreviewClear("hide");stopFrame()}
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
