import { BRAINROT_SOURCES } from "./brainrot-sources.js"

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value))

export function mountBrainrotVisual(stage,{fullView=false}={}){
  const field=document.createElement("div")
  const fog=document.createElement("div")
  const noise=document.createElement("canvas")
  const interference=document.createElement("div")
  const scanline=document.createElement("div")
  const flash=document.createElement("div")
  const controls=document.createElement("div")
  const reduce=document.createElement("button")
  const pause=document.createElement("button")
  field.className="brainrot-fragment-field"
  fog.className="brainrot-signal-fog"
  noise.className="brainrot-noise"
  interference.className="brainrot-interference"
  scanline.className="brainrot-scanline"
  flash.className="brainrot-flash"
  controls.className="brainrot-controls"
  reduce.className="brainrot-control"
  pause.className="brainrot-control"
  reduce.textContent="R / REDUCE"
  pause.textContent="PAUSE"
  reduce.type=pause.type="button"
  controls.append(reduce,pause)
  stage.append(field,fog,noise,interference,scanline,flash,controls)
  stage.tabIndex=0

  let seed=931031
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
  const sprites=[]
  const clouds=[]
  const bands=[]
  let deck=[]
  let cursor=0
  let paused=false
  let reducing=false
  let visible=true
  let stopped=false
  let frame=0
  let last=performance.now()
  const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches

  function refill(){
    deck=Array.from({length:BRAINROT_SOURCES.length},(_,index)=>index)
    for(let index=deck.length-1;index>0;index--){
      const target=Math.floor(random()*(index+1));[deck[index],deck[target]]=[deck[target],deck[index]]
    }
    cursor=0
  }
  function nextSource(exclude=-1){
    if(cursor>=deck.length) refill()
    let index=deck[cursor++]
    if(index===exclude){if(cursor>=deck.length) refill();index=deck[cursor++]}
    return index
  }
  refill()

  function reset(sprite,fromTop=true){
    const width=stage.clientWidth||innerWidth
    const height=stage.clientHeight||innerHeight
    sprite.x=random()*width*1.12-width*.06
    sprite.y=fromTop?-sprite.h-random()*height*.45:random()*height
    sprite.z=-720+random()*1080
    sprite.speed=(34+random()*72)*(fullView?1:.74)
    sprite.drift=(random()-.5)*12
    sprite.rotation=(random()-.5)*8
    sprite.w=30+random()*(fullView?112:82)
    sprite.h=24+random()*(fullView?88:64)
    sprite.phase=random()*Math.PI*2
    sprite.source=nextSource(sprite.source)
    sprite.image.src=BRAINROT_SOURCES[sprite.source]
    sprite.element.style.setProperty("--brainrot-crop",(1.04+random()*.4).toFixed(2))
    sprite.element.style.setProperty("--brainrot-x",`${Math.round(18+random()*64)}%`)
    sprite.element.style.setProperty("--brainrot-y",`${Math.round(18+random()*64)}%`)
  }
  function makeFragment(index,highlight){
    const element=document.createElement("button")
    const image=document.createElement("img")
    element.type="button"
    element.className=`brainrot-fragment${highlight?" highlight":""}`
    element.dataset.id=`R-${String(index+1).padStart(3,"0")}`
    image.alt=`Фрагмент меметического потока ${String(index+1).padStart(3,"0")}`
    image.draggable=false
    element.append(image)
    field.append(element)
    const sprite={element,image,source:-1,w:40,h:30,x:0,y:0,z:0,speed:0,drift:0,rotation:0,phase:0}
    reset(sprite,false)
    element.addEventListener("click",()=>{
      element.classList.add("ranked")
      setTimeout(()=>element.classList.remove("ranked"),1500)
    })
    sprites.push(sprite)
  }

  const count=fullView?(innerWidth<700?48:90):(stage.clientWidth<480?30:48)
  const highlights=new Set(Array.from({length:Math.max(1,Math.round(count*.1))},()=>Math.floor(random()*count)))
  for(let index=0;index<count;index++) makeFragment(index,highlights.has(index))
  for(let index=0;index<6;index++){
    const element=document.createElement("i")
    element.className="brainrot-fog-cloud"
    fog.append(element)
    clouds.push({element,x:random()*100,y:random()*100,dx:(random()-.5)*.05,dy:(random()-.5)*.03,phase:random()*Math.PI*2})
  }
  for(let index=0;index<7;index++){
    const element=document.createElement("i")
    element.className="brainrot-glitch-band"
    interference.append(element)
    bands.push({element,next:0})
  }

  const context=noise.getContext("2d",{alpha:true})
  function resize(){
    noise.width=240
    noise.height=Math.max(96,Math.round(240*(stage.clientHeight/Math.max(1,stage.clientWidth))))
  }
  resize()
  const resizeObserver=new ResizeObserver(resize)
  resizeObserver.observe(stage)

  function reduceField(){
    if(reducing) return
    reducing=true
    reduce.classList.add("active")
    flash.classList.remove("pulse");void flash.offsetWidth;flash.classList.add("pulse")
    sprites.forEach((sprite,index)=>{if(index%5===0) reset(sprite,true)})
    setTimeout(()=>{reducing=false;reduce.classList.remove("active")},900)
  }
  function togglePause(){
    paused=!paused
    pause.classList.toggle("active",paused)
    pause.textContent=paused?"RESUME":"PAUSE"
  }
  reduce.addEventListener("click",reduceField)
  pause.addEventListener("click",togglePause)
  const keydown=event=>{
    const ownsKeyboard=fullView||stage.contains(document.activeElement)
    if(!ownsKeyboard) return
    if(event.code==="Space"){event.preventDefault();togglePause()}
    if(event.key==="r"||event.key==="R") reduceField()
  }
  addEventListener("keydown",keydown)

  function draw(now){
    if(stopped) return
    const delta=Math.min(40,now-last);last=now
    clouds.forEach(cloud=>{
      cloud.x=(cloud.x+cloud.dx+100)%100
      cloud.y=(cloud.y+cloud.dy+100)%100
      cloud.element.style.cssText=`left:${cloud.x}%;top:${cloud.y}%;opacity:${.08+Math.sin(now*.00035+cloud.phase)*.035};transform:translate(-50%,-50%) scale(${.92+Math.sin(now*.00028+cloud.phase)*.1})`
    })
    bands.forEach(band=>{
      if(now>band.next){
        band.element.style.top=`${random()*100}%`
        band.element.style.height=`${2+random()*12}px`
        band.element.style.opacity=random()<.28?String(.05+random()*.11):"0"
        band.next=now+380+random()*1500
      }
    })
    if(Math.floor(now/170)!==Math.floor((now-delta)/170)){
      const image=context.createImageData(noise.width,noise.height)
      for(let index=0;index<image.data.length;index+=4){
        const active=random()<.32
        const value=active?Math.floor(96+random()*159):0
        image.data[index]=image.data[index+1]=image.data[index+2]=value
        image.data[index+3]=active?Math.floor(20+random()*54):0
      }
      context.putImageData(image,0,0)
    }
    if(!paused&&!reducedMotion){
      const height=stage.clientHeight
      sprites.forEach((sprite,index)=>{
        sprite.y+=sprite.speed*delta/1000
        sprite.x+=Math.sin(now*.00042+sprite.phase)*sprite.drift*.13
        if(sprite.y>height+sprite.h*1.6) reset(sprite,true)
        if(reducing&&index%4===0) sprite.z+=180*delta/1000
        const near=clamp((sprite.z+720)/1080,0,1)
        const depth=.62+near*.92
        sprite.element.style.opacity=String(clamp(.05+near*.88,.04,.94))
        sprite.element.style.setProperty("--brainrot-brightness",String(.3+near*.62))
        sprite.element.style.transform=`translate3d(${sprite.x}px,${sprite.y}px,${sprite.z}px) rotate(${sprite.rotation+Math.sin(now*.00055+sprite.phase)*2}deg) scale(${depth})`
        sprite.element.style.width=`${sprite.w}px`;sprite.element.style.height=`${sprite.h}px`
      })
    }
    if(visible) frame=requestAnimationFrame(draw)
  }
  const intersectionObserver=new IntersectionObserver(entries=>{
    visible=entries[0]?.isIntersecting??true
    if(visible&&!frame) frame=requestAnimationFrame(draw)
    if(!visible&&frame){cancelAnimationFrame(frame);frame=0}
  })
  intersectionObserver.observe(stage)
  frame=requestAnimationFrame(draw)

  return ()=>{
    stopped=true
    cancelAnimationFrame(frame)
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
    removeEventListener("keydown",keydown)
    stage.replaceChildren()
  }
}
