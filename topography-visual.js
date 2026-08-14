const TOPOGRAPHY_LABELS=Object.freeze([
  {name:"МОСКВА",role:"ГЛАВНЫЙ УЗЕЛ",tier:"major"},
  {name:"AIRI",role:"МОСКВА",tier:"satellite"},
  {name:"НИУ ВШЭ",role:"МОСКВА",tier:"satellite"},
  {name:"ИСП РАН",role:"МОСКВА",tier:"satellite"},
  {name:"МГУ",role:"МОСКВА",tier:"satellite"},
  {name:"САНКТ-ПЕТЕРБУРГ",role:"ГОРОДСКОЙ УЗЕЛ",tier:"major"},
  {name:"ИТМО",role:"САНКТ-ПЕТЕРБУРГ",tier:"satellite"},
  {name:"ИННОПОЛИС",role:"ГОРОДСКОЙ УЗЕЛ",tier:"major"},
  {name:"НОВОСИБИРСК",role:"ГОРОДСКОЙ УЗЕЛ",tier:"major"},
  {name:"АКАДЕМГОРОДОК",role:"НОВОСИБИРСК",tier:"satellite"},
  {name:"ТОМСК",role:"ГОРОДСКОЙ УЗЕЛ",tier:"major"},
  {name:"ДУБНА",role:"НАУЧНЫЙ УЗЕЛ",tier:"minor"},
  {name:"ЧЕРНОГОЛОВКА",role:"НАУЧНЫЙ УЗЕЛ",tier:"minor"},
  {name:"ТРОИЦК",role:"НАУЧНЫЙ УЗЕЛ",tier:"minor"},
  {name:"ПУЩИНО",role:"НАУЧНЫЙ УЗЕЛ",tier:"minor"},
  {name:"БОРОК",role:"НАУЧНЫЙ УЗЕЛ",tier:"minor"},
  {name:"КОЛЬЦОВО",role:"НАУЧНЫЙ УЗЕЛ",tier:"minor"},
  {name:"КАРЕЛИЯ",role:"ПЕРИФЕРИЙНЫЙ УЗЕЛ",tier:"minor"},
  {name:"МУРМАНСК",role:"ПЕРИФЕРИЙНЫЙ УЗЕЛ",tier:"minor"},
  {name:"НОРИЛЬСК",role:"ПЕРИФЕРИЙНЫЙ УЗЕЛ",tier:"minor"},
  {name:"ШЭНЬЧЖЭНЬ",role:"ПЛОТЬ ПРОТОКОЛА",tier:"external"},
  {name:"БАЙКАЛ",role:"КЛАСТЕР КАРАНТИНА",tier:"external"},
  {name:"ВАРАНАСИ",role:"УЗЕЛ ПЕРЕЗАПУСКА",tier:"external"},
  {name:"ИСФАХАН",role:"ОРНАМЕНТАЛЬНЫЙ ШИФР",tier:"external"}
])

const CUBE_EDGES=Object.freeze([[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])

function rgbToken(element,name,fallback){
  const value=getComputedStyle(element).getPropertyValue(name).trim()||fallback
  const hex=value.match(/^#([\da-f]{6})$/i)?.[1]
  if(!hex) return fallback
  return `${parseInt(hex.slice(0,2),16)}, ${parseInt(hex.slice(2,4),16)}, ${parseInt(hex.slice(4,6),16)}`
}

export function mountTopographyVisual(stage){
  const canvas=document.createElement("canvas")
  const mode=document.createElement("span")
  mode.className="topography-visual-mode"
  mode.textContent="TOPOGRAPHY / NETWORK FIELD"
  stage.append(canvas,mode)
  ;["tl","tr","bl","br"].forEach(position=>{
    const corner=document.createElement("i")
    corner.className=`topography-visual-corner ${position}`
    stage.append(corner)
  })

  const ctx=canvas.getContext("2d")
  const paper=rgbToken(stage,"--color-paper","239, 239, 234")
  const black=rgbToken(stage,"--color-black","5, 6, 7")
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches
  let width=1
  let height=1
  let frame=0
  let start=null
  let visible=true
  let stopped=false
  const dust=Array.from({length:260},(_,index)=>({
    a:(index*.61803398875%1)*Math.PI*2,
    r:(index*.754877666%1),
    z:(index*.569840296%1),
    p:(index*.438579%1)*Math.PI*2,
    s:.2+(index%11)/10
  }))

  const rgba=(color,alpha)=>`rgba(${color}, ${alpha})`
  const line=(a,b,alpha=.3,lineWidth=1,dash=[])=>{
    ctx.beginPath()
    ctx.setLineDash(dash)
    ctx.moveTo(a.x,a.y)
    ctx.lineTo(b.x,b.y)
    ctx.strokeStyle=rgba(paper,alpha)
    ctx.lineWidth=lineWidth
    ctx.stroke()
    ctx.setLineDash([])
  }
  const dot=(x,y,r,alpha=1)=>{
    ctx.beginPath()
    ctx.arc(x,y,r,0,Math.PI*2)
    ctx.fillStyle=rgba(paper,alpha)
    ctx.fill()
  }
  const curve=(points,alpha=.08,lineWidth=.8)=>{
    if(points.length<2) return
    ctx.beginPath()
    ctx.moveTo(points[0].x,points[0].y)
    for(let i=1;i<points.length-2;i++){
      const xc=(points[i].x+points[i+1].x)/2
      const yc=(points[i].y+points[i+1].y)/2
      ctx.quadraticCurveTo(points[i].x,points[i].y,xc,yc)
    }
    const n=points.length
    ctx.quadraticCurveTo(points[n-2].x,points[n-2].y,points[n-1].x,points[n-1].y)
    ctx.strokeStyle=rgba(paper,alpha)
    ctx.lineWidth=lineWidth
    ctx.stroke()
  }
  const project=(x,y,z,rotY,rotX,scale)=>{
    const cy=Math.cos(rotY),sy=Math.sin(rotY)
    let rx=x*cy-z*sy
    let rz=x*sy+z*cy
    const cx=Math.cos(rotX),sx=Math.sin(rotX)
    const ry=y*cx-rz*sx
    rz=y*sx+rz*cx
    const perspective=1/(2.62+rz*.4)
    return {x:width/2+rx*scale*perspective,y:height/2+ry*scale*perspective,z:rz}
  }
  const cube=(size,rotY,rotX,alpha,lineWidth)=>{
    const vertices=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]
      .map(point=>project(point[0]*size,point[1]*size,point[2]*size,rotY,rotX,Math.min(width,height)*.72))
    CUBE_EDGES.forEach(edge=>line(vertices[edge[0]],vertices[edge[1]],alpha,lineWidth))
    vertices.forEach((point,index)=>dot(point.x,point.y,index%3===0?2.3:1.4,Math.min(1,alpha*2)))
    return vertices
  }
  const pointMix=(vertices,ids)=>{
    const total=ids.reduce((sum,id)=>({x:sum.x+vertices[id].x,y:sum.y+vertices[id].y}),{x:0,y:0})
    return {x:total.x/ids.length,y:total.y/ids.length}
  }
  const fontSize=(desktop,mobile)=>width<480?mobile:desktop
  const drawLabel=(record,x,y,align,alpha,size,weight=400)=>{
    ctx.textAlign=align
    ctx.fillStyle=rgba(paper,alpha)
    ctx.font=`${weight} ${size}px "IBM Plex Mono", monospace`
    ctx.fillText(record.name,x,y)
  }

  function labelsOnCube(alpha,vertices){
    const center={x:width/2,y:height/2}
    const groups=[
      {city:0,ids:[0,1],bias:46,lift:-24,satellites:[{city:1,dx:-26,dy:-24},{city:2,dx:28,dy:-18},{city:3,dx:-22,dy:22},{city:4,dx:30,dy:25}]},
      {city:5,ids:[0,4],bias:42,lift:-8,satellites:[{city:6,dx:-6,dy:24}]},
      {city:7,ids:[1,5],bias:42,lift:-8},
      {city:8,ids:[3,7],bias:42,lift:10,satellites:[{city:9,dx:-12,dy:24}]},
      {city:10,ids:[2,6],bias:42,lift:10}
    ]
    groups.forEach(group=>{
      const record=TOPOGRAPHY_LABELS[group.city]
      const anchor=pointMix(vertices,group.ids)
      let vx=anchor.x-center.x
      let vy=anchor.y-center.y
      const length=Math.hypot(vx,vy)||1
      vx/=length
      vy/=length
      const node={x:anchor.x+vx*group.bias,y:anchor.y+vy*group.bias+group.lift}
      line(anchor,node,.16*alpha,.75)
      dot(node.x,node.y,6,.1*alpha)
      dot(node.x,node.y,3,.8*alpha)
      const align=vx<-.18?"right":vx>.18?"left":"center"
      const dx=align==="right"?-12:align==="left"?12:0
      drawLabel(record,node.x+dx,node.y-14,align,.82*alpha,fontSize(10,8),500)
      ctx.fillStyle=rgba(paper,.22*alpha)
      ctx.font=`400 ${fontSize(7,6)}px "IBM Plex Mono", monospace`
      ctx.fillText(record.role,node.x+dx,node.y+1)
      ;(group.satellites||[]).forEach(satellite=>{
        const satelliteRecord=TOPOGRAPHY_LABELS[satellite.city]
        const x=node.x+satellite.dx
        const y=node.y+satellite.dy
        line(node,{x,y},.08*alpha,.55)
        dot(x,y,1.8,.42*alpha)
        drawLabel(satelliteRecord,x+(satellite.dx<0?-6:6),y+2,satellite.dx<0?"right":"left",.36*alpha,fontSize(7,6))
      })
    })

    const minor=[
      {city:11,ids:[0,3],bias:22,lift:-4},{city:12,ids:[4,7],bias:24,lift:3},
      {city:13,ids:[0,4],bias:18,lift:18},{city:14,ids:[3,7],bias:18,lift:24},
      {city:15,ids:[3,2],bias:20,lift:14},{city:16,ids:[5,6],bias:20,lift:14},
      {city:17,ids:[7,6],bias:22,lift:22},{city:18,ids:[4,5],bias:22,lift:-18},
      {city:19,ids:[6,7],bias:26,lift:8}
    ]
    minor.forEach(item=>{
      const record=TOPOGRAPHY_LABELS[item.city]
      const anchor=pointMix(vertices,item.ids)
      let vx=anchor.x-center.x
      let vy=anchor.y-center.y
      const length=Math.hypot(vx,vy)||1
      vx/=length
      vy/=length
      const node={x:anchor.x+vx*item.bias,y:anchor.y+vy*item.bias+item.lift}
      line(anchor,node,.07*alpha,.45)
      dot(node.x,node.y,1.8,.38*alpha)
      drawLabel(record,node.x+(vx<0?-6:6),node.y+2,vx<0?"right":"left",.28*alpha,fontSize(7,6))
    })

    const external=[{city:20,x:.9,y:.28,side:"right"},{city:21,x:.92,y:.45,side:"right"},{city:22,x:.1,y:.62,side:"left"},{city:23,x:.12,y:.78,side:"left"}]
    external.forEach(item=>{
      const record=TOPOGRAPHY_LABELS[item.city]
      const x=item.x*width
      const y=item.y*height
      const target={x:center.x+(x-center.x)*.44,y:center.y+(y-center.y)*.44}
      line({x,y},target,.1*alpha,.65,[2,5])
      dot(x,y,5,.08*alpha)
      dot(x,y,2.7,.55*alpha)
      const align=item.side==="left"?"left":"right"
      const dx=item.side==="left"?10:-10
      drawLabel(record,x+dx,y-10,align,.55*alpha,fontSize(9,7),500)
      ctx.fillStyle=rgba(paper,.18*alpha)
      ctx.font=`400 ${fontSize(7,6)}px "IBM Plex Mono", monospace`
      ctx.fillText(record.role,x+dx,y+3)
    })
  }

  function draw(now=0){
    if(stopped) return
    if(start===null) start=now
    const elapsed=reduced?9000:now-start
    const angle=(elapsed%48000)/48000*Math.PI*2
    ctx.clearRect(0,0,width,height)
    ctx.fillStyle=rgba(black,1)
    ctx.fillRect(0,0,width,height)

    const cx=width/2
    const cy=height/2
    const contentScale=width<480?.82:1
    ctx.save()
    ctx.translate(cx,cy)
    ctx.scale(contentScale,contentScale)
    ctx.translate(-cx,-cy)
    const turbulence=.5+.5*Math.sin(angle*2-.7)
    for(let i=0;i<24;i++){
      const side=i%2===0?-1:1
      const baseY=cy+(i-12)*(height*.018)
      const points=[]
      for(let j=0;j<6;j++){
        const t=j/5
        points.push({
          x:cx+side*(Math.min(width,height)*.22*(1-t)+Math.sin(angle*2+i*.31+j*.55)*Math.min(width,height)*.05),
          y:baseY+Math.sin(angle+i*.7)*height*.05+(t-.5)*Math.min(width,height)*.36
        })
      }
      curve(points,.025+(i%5)*.006,.55+(i%4)*.1)
    }

    const rotY=.52+.16*Math.sin(angle-.2)
    const rotX=.48+.035*Math.cos(angle+.18)
    const scale=1.04+.12*Math.sin(angle-.45)
    const outer=cube(scale,rotY,rotX,.5,1.12)
    cube(.74,rotY,rotX,.36,.98)
    cube(.46,rotY,rotX,.28,.88)
    cube(.23,rotY,rotX,.19,.78)

    for(let i=0;i<34;i++){
      const rayAngle=i/34*Math.PI*2
      line({x:cx,y:cy},{x:cx+Math.cos(rayAngle)*Math.min(width,height)*.55,y:cy+Math.sin(rayAngle)*Math.min(width,height)*.38},.045,.6)
    }
    dust.forEach(particle=>{
      const dustAngle=particle.a+angle*(1+Math.round(particle.z*2))
      const radius=(.03+particle.r*.97)*Math.min(width,height)*.42
      dot(cx+Math.cos(dustAngle)*radius,cy+Math.sin(dustAngle)*radius*(.28+particle.z*.45),particle.s,.08+particle.z*.2)
    })
    const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,120)
    glow.addColorStop(0,rgba(paper,.28))
    glow.addColorStop(.15,rgba(paper,.14))
    glow.addColorStop(1,rgba(black,0))
    ctx.fillStyle=glow
    ctx.fillRect(cx-120,cy-120,240,240)
    labelsOnCube(.52+.08*(1-turbulence),outer)
    ctx.restore()
    if(!reduced&&visible) frame=requestAnimationFrame(draw)
  }

  function resize(){
    const bounds=canvas.getBoundingClientRect()
    const dpr=Math.min(devicePixelRatio||1,2)
    width=Math.max(1,bounds.width)
    height=Math.max(1,bounds.height)
    canvas.width=Math.round(width*dpr)
    canvas.height=Math.round(height*dpr)
    ctx.setTransform(dpr,0,0,dpr,0,0)
    if(reduced) draw(0)
  }
  const resizeObserver=new ResizeObserver(resize)
  const intersectionObserver=new IntersectionObserver(entries=>{
    visible=entries[0]?.isIntersecting??true
    if(visible&&!reduced&&!frame) frame=requestAnimationFrame(draw)
    if(!visible&&frame){ cancelAnimationFrame(frame); frame=0 }
  })
  resizeObserver.observe(stage)
  intersectionObserver.observe(stage)
  resize()
  frame=requestAnimationFrame(draw)

  return ()=>{
    stopped=true
    cancelAnimationFrame(frame)
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
  }
}
