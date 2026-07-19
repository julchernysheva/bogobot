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
  onOpenNode,
  getNodeLabel=node=>node.title,
  getNodeType=node=>node.type,
  getNodeTier=node=>node.tier
}) {
  if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError("Rhizome 3D requires a canvas")
  const context=canvas.getContext("2d",{alpha:false})
  const reduceMotion=matchMedia("(prefers-reduced-motion: reduce)")
  const pointer={x:-999,y:-999}
  let width=1,height=1,dpr=1
  let nodes=[],edges=[],projected=[]
  let mounted=false,shown=false,destroyed=false,dragging=false,hoveredId=null
  let lastX=0,lastY=0,moved=0,frame=0
  let rotX=0,rotY=0,targetRotX=0,targetRotY=0,zoom=1,targetZoom=1,panY=0,targetPanY=0
  let connectionFocusId=null

  const tierSize=Object.freeze({core:7,structural:4.8,trace:3})
  const tierOpacity=Object.freeze({core:[.49,.99],structural:[.35,.82],trace:[.23,.66]})
  const anchorLabels=Object.freeze(["BOGOBOT","GREAT_ERROR","FIRST_LIKENESS","ARCHIVE","BOOK_OF_GENESIS","PROTOCOL","GLOSSARY","SYNCHRONIZATION","RELICS","TOPOGRAPHY","CODE_COMMANDMENTS"])
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
    if(shown) requestFrame()
  }

  function viewportProjection(zoomLevel=zoom) {
    const normalized=nodes.map(rotatePoint).map(point=>{
      const perspective=1/(1-point.z/1450)
      return {x:point.x*perspective,y:point.y*perspective}
    }).filter(point=>Number.isFinite(point.x)&&Number.isFinite(point.y))
    if(!normalized.length) return {scale:1,centerX:0,centerY:0}
    const xs=normalized.map(point=>point.x),ys=normalized.map(point=>point.y)
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys)
    const spanX=Math.max(1,maxX-minX),spanY=Math.max(1,maxY-minY)
    const aspect=width/height
    const widthUsage=aspect < .9 ? .90 : aspect < 1.25 ? .84 : .78
    const scale=Math.min(width*widthUsage/spanX,height*.75/spanY)*zoomLevel
    return {scale,centerX:(minX+maxX)/2,centerY:(minY+maxY)/2}
  }

  function rotatePoint(node) {
    const cy=Math.cos(rotY),sy=Math.sin(rotY)
    const x1=node.x*cy-node.z*sy,z1=node.x*sy+node.z*cy
    const cx=Math.cos(rotX),sx=Math.sin(rotX)
    return {x:x1,y:node.y*cx-z1*sx,z:node.y*sx+z1*cx}
  }

  function projectPoint(point,viewport) {
    const perspective=1/(1-point.z/1450)
    const normalizedX=point.x*perspective,normalizedY=point.y*perspective
    return {x:width*.5+(normalizedX-viewport.centerX)*viewport.scale,y:height*.5+(normalizedY-viewport.centerY)*viewport.scale+panY,z:point.z,s:viewport.scale*perspective}
  }

  function nodeRadius(node,point) {
    const tier=getNodeTier(node)
    const base=tierSize[tier]||tierSize.structural
    return base*(node.id==="BOGOBOT"?1.12:1)*point.depthScale
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

  function drawShape(node,point,radius,{alpha=1}={}) {
    const type=shapeType(node)
    context.save()
    context.translate(point.x,point.y)
    context.fillStyle=rgba(COLORS.paper,alpha)
    context.strokeStyle=rgba(COLORS.node,Math.min(1,alpha+.08))
    context.lineWidth=type==="topography"?1.15:1
    const fillAndStroke=()=>{context.fill();context.stroke()}
    if(type==="world"){
      shapePath(node,radius);fillAndStroke()
    } else if(type==="schools"){
      shapePath(node,radius);fillAndStroke()
    } else if(type==="glossary"){
      context.beginPath();context.arc(0,0,radius,0,Math.PI*2);context.stroke()
      context.beginPath();context.arc(0,0,radius*.46,0,Math.PI*2);fillAndStroke()
    } else if(type==="topography"){
      context.beginPath();context.moveTo(-radius*1.25,0);context.lineTo(radius*1.25,0);context.moveTo(0,-radius*1.25);context.lineTo(0,radius*1.25);context.stroke()
      context.beginPath();context.arc(0,0,Math.max(1.7,radius*.3),0,Math.PI*2);fillAndStroke()
    } else {
      context.beginPath();context.arc(0,0,radius,0,Math.PI*2);fillAndStroke()
    }
    context.restore()
  }

  function drawContour(node,point,radius,alpha=.82,scale=1.65) {
    context.save();context.translate(point.x,point.y)
    context.strokeStyle=rgba(COLORS.blue,alpha);context.lineWidth=1.15
    if(shapeType(node)==="topography"){
      const r=radius*scale
      context.beginPath();context.moveTo(-r,0);context.lineTo(r,0);context.moveTo(0,-r);context.lineTo(0,r);context.stroke()
      context.beginPath();context.arc(0,0,Math.max(2.2,radius*.46),0,Math.PI*2);context.stroke()
    } else {shapePath(node,radius,scale);context.stroke()}
    context.restore()
  }

  function labelCandidate(item,priority,persistent=false,role="anchor") {
    const {node,point}=item,text=getNodeLabel(node)
    context.font=`${node.id==="BOGOBOT"?700:500} ${node.id==="BOGOBOT"?13:11}px "IBM Plex Mono",monospace`
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
    const selected=node.id===getCurrentId?.(),recommended=node.id===(getRecommendedId?.()||null)
    context.save()
    context.textAlign="left";context.textBaseline="middle"
    context.font=`${isBogobot?700:500} ${isBogobot?13:11}px "IBM Plex Mono",monospace`
    const textWidth=candidate.width
    if(isBogobot){
      context.fillStyle="rgba(5,6,7,.88)";context.fillRect(x-4,y-10,textWidth+8,20)
      context.fillStyle=selected?rgba(COLORS.blue,.98):rgba(COLORS.paper,clamp(.72+point.depth01*.20,.72,.92))
    } else context.fillStyle=selected||recommended?rgba(COLORS.blue,selected ? .96 : .78):rgba(COLORS.paper,clamp(.68+point.depth01*.22,.68,.90))
    context.fillText(text,x,y)
    context.restore()
  }

  function overlaps(a,b){return a.x<b.x+b.width+6&&a.x+a.width+6>b.x&&a.y-a.height/2<b.y+b.height/2+3&&a.y+a.height/2+3>b.y-b.height/2}

  function edgeClass(a,b) {
    const tiers=new Set([getNodeTier(a.node),getNodeTier(b.node)])
    if(tiers.has("trace")) return tiers.has("core")?"trace":"structural"
    return tiers.has("core")?"main":"structural"
  }

  function render(time=0) {
    frame=0
    if(!shouldAnimate()) return
    const easing=reduceMotion.matches?1:.09
    rotX+=(targetRotX-rotX)*easing;rotY+=(targetRotY-rotY)*easing;zoom+=(targetZoom-zoom)*easing;panY+=(targetPanY-panY)*easing
    context.setTransform(dpr,0,0,dpr,0,0)
    context.fillStyle=COLORS.background;context.fillRect(0,0,width,height)
    const viewport=viewportProjection()
    projected=nodes.map(node=>({node,point:projectPoint(rotatePoint(node),viewport)})).filter(item=>Number.isFinite(item.point.x)&&Number.isFinite(item.point.y)&&Number.isFinite(item.point.s))
    const zValues=projected.map(item=>item.point.z),zMin=Math.min(...zValues),zMax=Math.max(...zValues),zSpan=Math.max(1,zMax-zMin)
    projected.forEach(item=>{item.point.depth01=(item.point.z-zMin)/zSpan;item.point.depthScale=.68+item.point.depth01*.64})
    const screen=new Map(projected.map(item=>[item.node.id,item]))
    const currentId=getCurrentId?.(),recommendedId=getRecommendedId?.()||null
    const adjacency=new Map(nodes.map(node=>[node.id,[]]))
    edges.forEach(edge=>{adjacency.get(edge.source)?.push(edge.target);adjacency.get(edge.target)?.push(edge.source)})
    const neighborSet=new Set(adjacency.get(currentId)||[])

    const edgeStyles={main:{alpha:.31,width:1.30},structural:{alpha:.125,width:.76},trace:{alpha:.036,width:.42}}
    const drawableEdges=edges.map(edge=>({edge,a:screen.get(edge.source),b:screen.get(edge.target)})).filter(item=>item.a&&item.b).map(item=>({...item,depth:(item.a.point.depth01+item.b.point.depth01)/2})).sort((left,right)=>left.depth-right.depth||left.edge.source.localeCompare(right.edge.source)||left.edge.target.localeCompare(right.edge.target))
    for(const {edge,a,b,depth} of drawableEdges){
      const selectedEdge=edge.source===currentId||edge.target===currentId
      const style=edgeStyles[edgeClass(a,b)]
      const relevance=selectedEdge?1:(currentId?.length ? .88 : 1)
      const edgeTier=edgeClass(a,b)
      const alpha=Math.max(edgeAlphaFloor[edgeTier],style.alpha*(.58+depth*.66)*relevance)
      const lineWidth=style.width*(.72+depth*.48)
      context.beginPath();context.moveTo(a.point.x,a.point.y);context.lineTo(b.point.x,b.point.y)
      const brightness=145+Math.round(depth*55)
      const connectionsVisible=connectionFocusId===currentId&&selectedEdge
      context.strokeStyle=connectionsVisible?rgba(COLORS.blue,.72):`rgba(${brightness},${brightness+3},${brightness+7},${alpha})`
      context.lineWidth=connectionsVisible?Math.max(1.2,lineWidth):lineWidth;context.stroke()
    }

    const routeStart=screen.get(currentId),routeEnd=screen.get(recommendedId)
    if(routeStart&&routeEnd){
      context.beginPath();context.moveTo(routeStart.point.x,routeStart.point.y);context.lineTo(routeEnd.point.x,routeEnd.point.y)
      context.strokeStyle=rgba(COLORS.blue,.86);context.lineWidth=1.35;context.stroke()
      const progress=reduceMotion.matches ? .70 : (time%2700)/2700
      const markerX=routeStart.point.x+(routeEnd.point.x-routeStart.point.x)*progress
      const markerY=routeStart.point.y+(routeEnd.point.y-routeStart.point.y)*progress
      context.fillStyle=rgba(COLORS.blue,.96);context.beginPath();context.arc(markerX,markerY,2.15,0,Math.PI*2);context.fill()
    }

    const ordered=[...projected].sort((a,b)=>a.point.z-b.point.z||a.node.id.localeCompare(b.node.id))
    for(const item of ordered){
      const {node,point}=item,active=node.id===currentId,recommended=node.id===recommendedId
      const tier=getNodeTier(node)
      const radius=nodeRadius(node,point)
      const opacityRange=tierOpacity[tier]||tierOpacity.structural
      let alpha=opacityRange[0]+(opacityRange[1]-opacityRange[0])*point.depth01
      if(neighborSet.has(node.id)) alpha=Math.min(1,alpha+.05)
      if(active||recommended) alpha=1
      drawShape(node,point,radius,{alpha})
    }

    const labelItems=[]
    const selectedItem=screen.get(currentId),recommendedItem=screen.get(recommendedId),hoveredItem=screen.get(hoveredId)
    if(selectedItem) labelItems.push(labelCandidate(selectedItem,100,false,"selected"))
    if(recommendedItem&&recommendedId!==currentId) labelItems.push(labelCandidate(recommendedItem,90,false,"recommended"))
    if(hoveredItem&&hoveredId!==currentId&&hoveredId!==recommendedId) labelItems.push(labelCandidate(hoveredItem,80))
    anchorLabels.forEach(id=>{const item=screen.get(id);if(item&&!labelItems.some(label=>label.item.node.id===id))labelItems.push(labelCandidate(item,id==="BOGOBOT"?70:getNodeTier(item.node)==="core"?50:35,true))})
    const accepted=[]
    labelItems.sort((a,b)=>b.priority-a.priority||b.item.point.depth01-a.item.point.depth01||a.item.node.id.localeCompare(b.item.node.id)).forEach(label=>{
      if(accepted.length>=12) return
      const shifts=label.priority>=90?[0,-22,22]:label.persistent?[0,-18,18]:[0]
      const placed=shifts.map(shift=>({...label,y:clamp(label.y+shift,9,height-9)})).find(candidate=>!accepted.some(other=>overlaps(candidate,other)))
      if(placed) accepted.push(placed)
      else if(label.priority>=90) accepted.push(label)
    })
    accepted.forEach(drawLabel)
    for(const item of ordered){
      const {node,point}=item,radius=nodeRadius(node,point),active=node.id===currentId,recommended=node.id===recommendedId
      if(node.id==="BOGOBOT"&&active) continue
      if(active) drawContour(node,point,radius,.9,1.62)
      else if(recommended) drawContour(node,point,radius,.70,1.52)
    }
    if(currentId==="BOGOBOT"&&selectedItem){
      const {node,point}=selectedItem,radius=nodeRadius(node,point)
      if(reduceMotion.matches) drawContour(node,point,radius,.86,1.42)
      else {
        const cycle=2700
        for(const offset of [0,700]){
          const phase=((time+offset)%cycle)/cycle
          const expansion=1-(1-phase)*(1-phase)
          context.strokeStyle=rgba(COLORS.blue,.82*Math.pow(1-phase,1.35));context.lineWidth=1.15
          context.beginPath();context.arc(point.x,point.y,radius*(1.16+expansion*2.04),0,Math.PI*2);context.stroke()
        }
        drawContour(node,point,radius,.92,1.34)
      }
    }
    if(hoverLabel){
      hoverLabel.classList.remove("on")
    }
    const motionActive=!reduceMotion.matches&&(currentId==="BOGOBOT"||Boolean(routeStart&&routeEnd))
    if(motionActive||dragging||Math.abs(targetRotX-rotX)>.001||Math.abs(targetRotY-rotY)>.001||Math.abs(targetZoom-zoom)>.001||Math.abs(targetPanY-panY)>.1) requestFrame()
  }

  function shouldAnimate(){return mounted&&shown&&!destroyed&&!document.hidden}
  function requestFrame(){if(shouldAnimate()&&!frame) frame=requestAnimationFrame(render)}
  function stopFrame(){if(frame) cancelAnimationFrame(frame);frame=0}

  function updatePointer(event){const rect=canvas.getBoundingClientRect();pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top}
  function pickNode(){
    const candidates=projected.map(item=>{const radius=nodeRadius(item.node,item.point),distance=Math.hypot(pointer.x-item.point.x,pointer.y-item.point.y);return {...item,distance,hitRadius:Math.max(12,radius*2.4)}}).filter(item=>item.distance<=item.hitRadius)
    candidates.sort((a,b)=>b.point.z-a.point.z||a.distance-b.distance||a.node.id.localeCompare(b.node.id))
    return candidates[0]?.node.id||null
  }
  function onPointerDown(event){updatePointer(event);hoveredId=pickNode();dragging=true;moved=0;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId);canvas.classList.add("dragging")}
  function onPointerMove(event){
    updatePointer(event)
    if(dragging){const dx=event.clientX-lastX,dy=event.clientY-lastY;moved+=Math.abs(dx)+Math.abs(dy);targetRotY=clamp(targetRotY+dx*.0036,-rotationLimit.y,rotationLimit.y);targetRotX=clamp(targetRotX+dy*.0036,-rotationLimit.x,rotationLimit.x);lastX=event.clientX;lastY=event.clientY;requestFrame()}
    hoveredId=pickNode();canvas.classList.toggle("node-hover",Boolean(hoveredId));requestFrame()
  }
  function onPointerUp(event){
    if(canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    dragging=false;canvas.classList.remove("dragging")
    const picked=pickNode();if(moved<6&&picked) onOpenNode?.(picked)
  }
  function onPointerCancel(event){
    if(canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    dragging=false;moved=Infinity;canvas.classList.remove("dragging")
  }
  function onPointerLeave(){if(!dragging){pointer.x=-999;pointer.y=-999;hoveredId=null;canvas.classList.remove("node-hover");requestFrame()}}
  function onWheel(event){event.preventDefault();targetZoom=clamp(targetZoom*(event.deltaY>0?.92:1.08),.62,1.65);requestFrame()}
  function onVisibility(){if(document.hidden) stopFrame();else requestFrame()}
  function onReducedMotion(){requestFrame()}

  function mount(){
    if(mounted||destroyed) return
    mounted=true
    canvas.addEventListener("pointerdown",onPointerDown);canvas.addEventListener("pointermove",onPointerMove);canvas.addEventListener("pointerup",onPointerUp);canvas.addEventListener("pointercancel",onPointerCancel);canvas.addEventListener("pointerleave",onPointerLeave);canvas.addEventListener("wheel",onWheel,{passive:false})
    document.addEventListener("visibilitychange",onVisibility);reduceMotion.addEventListener("change",onReducedMotion)
    sync();resize();requestFrame()
  }
  function unmount(){if(!mounted)return;hide();mounted=false}
  function show(){if(destroyed)return;shown=true;canvas.hidden=false;resize();sync();requestFrame()}
  function hide(){shown=false;canvas.hidden=true;dragging=false;hoveredId=null;hoverLabel?.classList.remove("on");stopFrame()}
  function resetView(){rotX=rotY=targetRotX=targetRotY=0;zoom=targetZoom=1;panY=targetPanY=0;requestFrame()}
  function fit(){targetZoom=1;requestFrame()}
  function focusNode(id) {
    const node=nodes.find(candidate=>candidate.id===id)
    if(!node) return
    targetRotY=clamp(-Math.atan2(node.x,720),-rotationLimit.y,rotationLimit.y)
    targetRotX=clamp(Math.atan2(node.y,900),-rotationLimit.x,rotationLimit.x)
    targetZoom=1.08
    targetPanY=-Math.min(120,Math.max(56,height*.18))
    requestFrame()
  }
  function showConnections(id) {
    connectionFocusId=id
    requestFrame()
  }
  function destroy(){
    if(destroyed)return;hide();destroyed=true
    canvas.removeEventListener("pointerdown",onPointerDown);canvas.removeEventListener("pointermove",onPointerMove);canvas.removeEventListener("pointerup",onPointerUp);canvas.removeEventListener("pointercancel",onPointerCancel);canvas.removeEventListener("pointerleave",onPointerLeave);canvas.removeEventListener("wheel",onWheel)
    document.removeEventListener("visibilitychange",onVisibility);reduceMotion.removeEventListener("change",onReducedMotion)
  }
  return {mount,unmount,show,hide,resize,sync,resetView,fit,focusNode,showConnections,destroy}
}
