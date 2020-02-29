//player movement
keysUsed = {}
document.onkeydown = function(e){
    keysUsed[e.keyCode] = e.type =='keydown'
  }
document.onkeyup = function(e){
    keysUsed[e.keyCode] = e.type =='keydown'
}



//Initialization canvas and contex
const globalCanvas = document.createElement('canvas');
globalCanvas.width = 1500;
globalCanvas.height = 500;
document.getElementById('game-board').appendChild(globalCanvas);

const globalContex1 = globalCanvas.getContext('2d');



//GAME GENERAL
class Game{
    constructor(canvas){
        this.canvas = canvas;
        this.contex = canvas.getContext('2d');
        this.atomization = 500
        this.playerWidth = 20
        this.playerHeigth = 30
        this.gravity = 0.1
        this.drag = 0.1
        this.frames = {principal:0,turn:0,passTurn:0,explosion:0};
        this.animations = []
        this.turn = 1
        this.teams = ['red','blue']
        this.worms = []
        this.coefficientOfLoss = 0.5
        this.playerInitX = [100,200]
        this.playerInitY = 380
        this.timeStampNow = 0
        this.timeStampLast = 0
        this.executionTime = 0
        this.turnTime = 600
        this.faceImage = new Image()
        this.isPause = false
        this.endGame = false
    }

    start = () =>{
        this.gameArea = new GameArea(this.canvas,this.playerInitY+this.playerHeigth,500)
        this.gameArea.start()
        this.startWorms()
        this.timeStampNow=new Date().getTime()
        this.drawTurnTime()
    }

    startWorms = () =>{
        for(let i=0;i<this.teams.length;i++){
            this.worms.push(new Worm(this.playerInitX[i],this.playerInitY,0,0,this.playerWidth,this.playerHeigth,this.teams[i],this.canvas))
            this.worms[i].start()
        }
        this.indWormInUse = Math.floor(Math.random()*this.worms.length)
        this.wormInUse = this.worms[this.indWormInUse]
        this.wormInUse.inUse=true
    }

    drawWorms = () =>{
        for(let i=0;i<this.worms.length;i++){
            this.worms[i].newPos(0,this.gravity)
            this.touchEffectsTerrain(false,this.worms[i],i)
            this.worms[i].bullets.forEach((bullet,idx) => {
                this.touchEffectsTerrain(this.worms[i],bullet,idx)
                this.touchEffectsPlayer(this.worms[i],bullet,idx)
            })
        }

        let notDead = []
        for(let i=0;i<this.worms.length;i++){
            if(this.worms[i].life>0){
                this.worms[i].drawWorm()
                notDead.push(this.worms[i])
            }
        }
        this.wormInUse.drawAim();
        this.worms = notDead
    }

    drawFace =() =>{
        this.contex.beginPath()
        this.contex.strokeStyle = 'white'
        this.contex.lineWidth = 4
        this.contex.arc(60,60,30,0,2*Math.PI)
        this.contex.closePath()
        this.contex.stroke()
        this.contex.fillStyle = this.wormInUse.team
        this.faceImage.src = `./image/soldie${this.wormInUse.team}face.png`
        this.contex.drawImage(this.faceImage,40,40,40,40);
        this.drawBigLifeBar()
        this.drawBigStaminaBar()
    }

    drawBigLifeBar = () =>{
        this.contex.lineWidth = 1
        this.contex.strokeStyle='white'
        this.contex.strokeRect(95, 37,122 , 20);
        this.contex.fillStyle ='red'
        this.contex.fillRect(96,38,120*(this.wormInUse.life/100),18)

        this.contex.font = '15px Droid Sans black'
        this.contex.fillStyle = 'white'
        this.contex.fillText(`${parseInt(this.wormInUse.life)}`,190,52)

    }

    drawBigStaminaBar = () =>{
        this.contex.lineWidth = 1
        this.contex.strokeStyle='white'
        this.contex.strokeRect(95, 63, 122, 20);
        this.contex.fillStyle ='green'
        this.contex.fillRect(96,64,120*(this.wormInUse.stamina/100),18)

        this.contex.font = '15px Droid Sans black'
        this.contex.fillStyle = 'white'
        this.contex.fillText(`${parseInt(this.wormInUse.stamina)}`,190,79)

    }

    clear = () =>{
        this.contex.clearRect(0,0,this.canvas.width,this.canvas.height)
    }

    keysPressed = () =>{

        
        if(keysUsed[37] && keysUsed[39]){
        }
        else{
            if(keysUsed[37]) this.wormInUse.moveLeft()
            if(keysUsed[39]) this.wormInUse.moveRight()
        }
        if(keysUsed[32]) this.wormInUse.jump()
        if(keysUsed[90]) this.wormInUse.attack()
        if(!this.wormInUse.isMoving()){
            if(keysUsed[38]) this.wormInUse.angleUp()
            if(keysUsed[40]) this.wormInUse.angleDown()
        }
    }

    updateGame = () =>{
        if(!this.endGame && !this.isPause){
            this.executionTime =new Date().getTime() 
            this.timeStampLast = this.timeStampNow
            this.timeStampNow = new Date().getTime()
            this.passTurn()
            this.clear()
            this.keysPressed()
            this.gameArea.drawGameArea()
            this.drawWorms()
            this.frames.principal++
            this.drawTurnTime()
            this.drawFace()
            this.executionTime -= new Date().getTime()
            this.isEndGame()
        }
        window.requestAnimationFrame(this.updateGame);

    }

    checkIfTouchTerrain = (component) =>{
        return  this.gameArea.terrains.reduce((acc,terrain)=>{
            const sideTouch = component.checkTouch(terrain)
            return [acc[0] || sideTouch[0],acc[1] || sideTouch[1],acc[2] || sideTouch[2],acc[3] ||  sideTouch[3]]
        },[false,false,false,false]) 
    }

    checkIfTouchPlayer = (component) => {
        return !this.worms.every((worm) => {
            const sideTouch = worm.checkTouch(component)
            return  !(sideTouch[0] || sideTouch[1] || sideTouch[2] || sideTouch[3])
        })
    }

    touchEffectsTerrain = (worm=false,component,idx)=>{
        const touchVector = this.checkIfTouchTerrain(component)
        if(component.type==='worm'){
            if(touchVector[2]) component.touchBottom(this.drag,this.coefficientOfLoss,true)
            if(touchVector[0]) component.touchTop(this.drag,this.coefficientOfLoss,true)
            if(touchVector[1]) component.touchRight(this.coefficientOfLoss,true)
            if(touchVector[3]) component.touchLeft(this.coefficientOfLoss,true)
            if(component.left()<=0) {
                component.touchLeft(this.coefficientOfLoss,true)
                component.touchTop(this.drag,this.coefficientOfLoss,true)
            }
            if(component.right()>=this.canvas.width) {
                component.touchRight(this.coefficientOfLoss,true)
                component.touchTop(this.drag,this.coefficientOfLoss,true)
            }
        }
        else {
            if(touchVector[0]||touchVector[1]||touchVector[2]||touchVector[3]){
                worm.bullets.splice(idx,1)
                this.explosion(component)
            }
        }
    }

    touchEffectsPlayer = (worm,bullet,idx)=>{
        const touchPlayer = this.checkIfTouchPlayer(bullet)
        if(touchPlayer){
            worm.bullets.splice(idx,1)
            this.explosion(bullet)
        } 
    }

    passTurn = () =>{
        if((this.frames.principal >=this.turnTime ||(keysUsed[13] && keysUsed[18]))&& !this.wormInUse.isMoving()){
            this.turn++
            this.nextWorm()
            this.frames.principal = 0
            this.wormInUse.beginTurn()
        }
    }

    nextWorm = () =>{
        this.wormInUse.inUse=false
        this.indWormInUse ++
        if(this.indWormInUse>=this.worms.length) this.indWormInUse = 0
        this.wormInUse = this.worms[this.indWormInUse]
        this.wormInUse.inUse=true
    }

    drawTurnTime = () =>{
        this.contex.font = '30px Arial black'
        this.contex.fillStyle = this.wormInUse.team
        this.contex.fillText(`${parseFloat((this.turnTime-this.frames.principal)/60).toFixed(2)}`,400,100)
        this.contex.font = '15px Robot black'
        this.contex.fillStyle = 'white'
        this.contex.fillText(`fps:${parseInt(1000/(this.timeStampNow-this.timeStampLast))}`,950,20)


    }
    drawAnimations = () => {
        if(this.animations.length>0){
            for (i = 0; i < this.animations.length; i++) {
                this.animations[i]();
            }
        }
    }
    explosion = (bullet) =>{
    //raio da explosao 30
    //raio de efetivo  30
        let temporario = this.gameArea.terrains
        let notDestroyed = []
        for(let i = 0;i<temporario.length;i++){
            let distanceToBulletSquare = (temporario[i].centerX-bullet.centerX)**2+(temporario[i].centerY-bullet.centerY)**2
            if(distanceToBulletSquare>bullet.rExplosion**2 && distanceToBulletSquare<(bullet.rExplosion+5)**2) {
                temporario[i].color='#A2A2A2'
                notDestroyed.push(temporario[i])
            }
            else if(distanceToBulletSquare>(bullet.rExplosion+5)**2) {
                notDestroyed.push(temporario[i])
            }

        }
        this.gameArea.terrains= notDestroyed
        temporario = this.worms
        for(let i = 0;i<temporario.length;i++){

            let xAparente = (temporario[i].centerX-bullet.centerX)
            let yAparente = (temporario[i].centerY-bullet.centerY)
            let distanceToBulletSquare = xAparente**2+yAparente**2
            if(0<distanceToBulletSquare && distanceToBulletSquare<bullet.rExplosion**2){
                temporario[i].Vx= -bullet.vExplosion*xAparente*(distanceToBulletSquare**(-1/2)-bullet.rExplosion**(-1/2))
                temporario[i].Vy= -bullet.vExplosion*yAparente*(distanceToBulletSquare**(-1/2)-bullet.rExplosion**(-1/2))
                temporario[i].life -= bullet.damage*(1-(distanceToBulletSquare**(1/2))/(bullet.rExplosion)) 
            }
            else if(distanceToBulletSquare===0){
                temporario[i].life -= bullet.damage 
            }
        }
    }
    isEndGame = () =>{
        console.log(this.worms.length)
        if(this.worms.length===0){
            this.endGame = true
            this.contex.fillStyle = 'grey'
            this.contex.fillRect(0,100,this.canvas.width,300)
            this.contex.font = '100px Arial black'
            this.contex.fillStyle = 'white'
            this.contex.fillText(`DRAW`,500,280)
        }
        else if(this.worms.length===1){
            this.endGame = true
            this.contex.fillStyle = this.worms[0].team
            this.contex.fillRect(0,100,this.canvas.width,300)
            this.contex.font = '100px Arial black'
            this.contex.fillStyle = 'white'
            this.contex.fillText(`TEAM ${(this.worms[0].team).toUpperCase()} WIN`,400,280)
        }    
    }
}


//MAP TERRAIN AND BACKGROUND
class GameArea{
    constructor(canvas,initY,atomization){
        this.canvas = canvas;
        this.contex = canvas.getContext('2d');
        this.atomization = atomization;
        this.terrains = [];
        this.initY = initY;
        this.backGroundImage = new Image()
    }

    start = () =>{
        this.backGroundImage.src= './image/background.jpg'  
        this.backGroundImage.onload = () =>{
            this.drawGameArea()
        }
        const widthAtom = this.canvas.width/this.atomization
        const numberRows = (this.canvas.height - this.initY)/widthAtom
        for(let i = 0;i<this.atomization;i++){
            for(let j=0; j<numberRows;j++){
                this.terrains.push(new Terrain(0+i*widthAtom,this.initY+j*widthAtom,0,0,widthAtom,widthAtom,this.canvas))
            }
        }
        this.drawGameArea()
    }

    drawGameArea = () =>{
        this.contex.drawImage(this.backGroundImage,0,0,this.canvas.width,this.canvas.height);
        for(let i = 0;i<this.terrains.length;i++){
            this.terrains[i].draw();
        }
    }

}



//BASE FOR ANY PIECE
class Component{
    constructor(x,y,Vx,Vy,width,height,canvas){
        this.x = x;
        this.y = y;
        this.previousX = x;
        this.previousY = y;
        this.Vx = Vx;
        this.Vy = Vy;
        this.ax = 0;
        this.ay = 0;
        this.width = width;
        this.height = height;
        this.canvas = canvas;
        this.contex = canvas.getContext('2d')
        this.frames = 0;
        this.gravity = 0;
    }

    left = () =>{
        return this.x;
    }

    right = () =>{
        return this.x+this.width
    }

    top = () =>{
        return this.y
    }

    bottom = () =>{
        return this.y+ this.height
    }
    center = () =>{
        this.centerX = this.x+this.width/2
        this.centerY = this.y+this.height/2
    }

    newPos = (ax,ay) =>{
        this.previousX = this.x
        this.previousY = this.y
        this.x += this.Vx
        this.y += this.Vy
        this.center()
        this.newVelocity(ax,ay)
    }
    
    newVelocity = (ax,ay) =>{
        this.Vx += this.ax
        this.Vy += this.ay
        this.newAceleration(ax,ay)
    }

    newAceleration = (ax,ay) =>{
        this.ay = ay;
        this.ax = ax;
    }
    checkTouch = (component) =>{
        return [//primeiro element verifica se encostou por cima, segudno pela direita, terceira por baixo e ultimo pela esquerda
            ( component.bottom() < this.bottom() && this.top() < component.bottom() && ( ( this.left() < component.left() && component.left() < this.right() )|| ( this.left() < component.right() && component.right() < this.right() ) ) ),
            ( component.left() < this.right() && this.left() < component.left() && ( ( component.top() < this.bottom() && this.top() < component.top() ) || ( this.top() < component.bottom() && component.bottom() < this.bottom() ) ) ),
            ( component.top() < this.bottom() && this.top() < component.top() && ( ( this.left() < component.left() && component.left() < this.right() ) || ( this.left() < component.right() && component.right() < this.right() ) ) ),
            ( component.right() < this.right() && this.left() < component.right() &&  ( ( component.top() < this.bottom() && this.top() < component.top() ) || ( this.top() < component.bottom() && component.bottom() < this.bottom() ) ) ),
        ]  
    }
}


class Terrain extends Component{
    constructor(x,y,Vx,Vy,width,height,canvas){
        super(x,y,Vx,Vy,width,height,canvas);
        this.type = 'terrain'
        this.color = '#555555'
    }

    draw = () =>{
        this.center()
        this.contex.fillStyle = this.color 
        this.contex.fillRect(this.x,this.y,this.width,this.height);
    }

}


class Worm extends Component{
    constructor(x,y,Vx,Vy,width,height,team,canvas){
        super(x,y,Vx,Vy,width,height,canvas);
        this.bullets = [];
        this.gravity = 0.1
        this.numberBullets = 1
        this.numberJumps = 1
        this.team = team
        this.front = 'right'
        this.type = 'worm'
        this.angle = 0
        this.life = 100
        this.stamina = 100
        this.bulletSize = 10
        this.inUse = false
        this.vBullet = 9
        this.wormImage = new Image()
        this.gunImage = new Image()
        this.vPadraoLateral = 10
    }

    start = () =>{
        this.newPos(0,0)
        this.wormImage.src =`./image/soldie${this.team}.png`
        this.gunImage.src =`./image/gun.png`
        
        this.drawWorm()
    }

    drawWorm = () =>{
        if(this.front==='right'){
            this.contex.drawImage(this.wormImage,this.x,this.y,this.width,this.height);
            this.contex.setTransform(1, 0, 0, 1, 0, 0); 
            if(this.x ===this.previousX || !this.isMoving()){
                this.contex.translate(this.centerX,this.centerY)
                this.contex.rotate(-this.angle * Math.PI / 180);
                this.contex.translate(-this.centerX,-this.centerY)
                this.contex.drawImage(this.gunImage,this.x,this.y+6,this.width,this.width);
            }
            this.contex.setTransform(1, 0, 0, 1, 0, 0);
        }
        else{
            this.contex.scale(-1,1)
            this.contex.drawImage(this.wormImage,-this.width-this.x,this.y,this.width,this.height);
            this.contex.setTransform(1, 0, 0, 1, 0, 0);
            if(this.x ===this.previousX || !this.isMoving()){
                this.contex.translate(this.centerX,this.centerY)
                this.contex.rotate(this.angle * Math.PI / 180);
                this.contex.translate(-this.centerX,-this.centerY)
                this.contex.scale(-1,1)
                this.contex.drawImage(this.gunImage,-this.width-this.x,this.y+6,this.width,this.width);
            }
            this.contex.setTransform(1, 0, 0, 1, 0, 0);
        }
        this.frames++;    
        this.drawBullets() 
        this.drawLifeBar()
    }
    drawAim = () =>{
        if(!this.isMoving()){
            this.contex.beginPath();
            this.contex.strokeStyle='yellow';
            if(this.front ==='right') this.contex.arc(this.centerX,this.centerY, 40,2*Math.PI-this.angle/180*Math.PI,2*Math.PI-this.angle/180*Math.PI)
            else this.contex.arc(this.centerX,this.centerY, 40,Math.PI+this.angle/180*Math.PI,Math.PI+this.angle/180*Math.PI)
            this.contex.lineTo(this.centerX, this.centerY);
            this.contex.closePath();
            this.contex.stroke()
        }
    }
    drawLifeBar = ()=>{
        this.contex.lineWidth = 1
        this.contex.strokeStyle='white'
        this.contex.strokeRect(this.centerX-21, this.centerY-this.height*5/4, 42, 7);
        this.contex.fillStyle ='red'
        this.contex.fillRect(this.centerX-20,this.centerY-this.height*5/4+1,42*(this.life/100),5)
    }

    beginTurn(){
        this.frames = 0;
        this.bullets =[];
        this.numberBullets=1;
        this.numberJumps = 1
        this.angle = 0
        this.stamina =100

    }

    jump = () =>{
        if(this.numberJumps>0){
            this.Vy = -1.5
            this.numberJumps--
        }
    }

    moveRight =() =>{
        if(this.front ==='left'){
            this.front = 'right'
        }
        if(this.stamina>0){
            this.stamina-=0.8
            if(this.Vx<0){
                this.Vx+=0.2
            }
            else if(this.Vx>this.vPadraoLateral){
                this.Vx +=0.01
            }
            else{
                this.Vx = this.vPadraoLateral
            }
        }
    }

    moveLeft =() =>{
        if(this.front==='right'){
            this.front = 'left'
        }
        if(this.stamina>0){
            this.stamina-=0.8
            if(this.Vx>0){
                this.Vx-=0.2
            }
            else if(this.Vx<-this.vPadraoLateral){
                this.Vx -=0.01
            }
            else{
                this.Vx = -this.vPadraoLateral
            }

        }
    }
    angleUp = () =>{
        if(this.angle<90){
            this.angle+=2
        }
    }
    angleDown = () =>{
        if(this.angle>-90){
            this.angle-=2
        }
    }
    
    attack = () =>{
        if(!this.isMoving()){
            if(this.numberBullets>0){
                if(this.front ==='right'){
                    this.bullets.push(new Bullet(this.right(),this.centerY,this.vBullet*Math.cos(this.angle/180*Math.PI),-this.vBullet*Math.sin(this.angle/180*Math.PI),this.bulletSize,this.bulletSize,this.canvas))
                }
                else{
                    this.bullets.push(new Bullet(this.left()-this.bulletSize,this.centerY,-this.vBullet*Math.cos(this.angle/180*Math.PI),-this.vBullet*Math.sin(this.angle/180*Math.PI),this.bulletSize,this.bulletSize,this.canvas))
                }
                this.numberBullets--
            }
        }
    }

    drawBullets =() =>{
        for(let i = 0;i<this.bullets.length;i++){
            this.bullets[i].newPos(0,this.gravity)
            this.bullets[i].drawBullet()
        }
    }

    isMoving =() =>{
        return this.Vx !==0 || this.Vy !==0
    }

    isArrowRightorLeft = () =>{
        if(keysUsed[37] && keysUsed[39]) 
        { return false }
        
        return keysUsed[37] || keysUsed[39]
    }

    touchTop = (drag,coefficientOfLoss) =>{
        this.y = this.previousY

        if(Math.abs(this.Vx)>1){
            this.Vx = this.Vx - Math.sign(this.Vx)*drag
        }
        else if(Math.abs(this.Vx)<1 && this.isArrowRightorLeft() && this.inUse && 0<this.stamina)
        {
            this.Vx=this.Vx
        }
        else{
            this.Vx=0
        }
        
        if(this.Vy>-2){
            this.Vy=0;
        }
        else if(Math.abs(this.Vy)==0.2 && this.isArrowRightorLeft() && this.inUse && 0<this.stamina)
        {
            this.Vy=this.Vy
        }
        else {
            this.Vy = -this.Vy*coefficientOfLoss
        }
    }
    touchBottom = (drag,coefficientOfLoss) =>{
        this.y = this.previousY
        this.numberJumps = 2;
        if(Math.abs(this.Vx)>1){
            this.Vx = this.Vx - Math.sign(this.Vx)*drag
        }
        else if(Math.abs(this.Vx)<=1 && this.isArrowRightorLeft() && this.inUse && 0<this.stamina)
        {
            this.Vx=this.Vx
        }
        else{
            this.Vx=0
        }

        if(this.Vy<2){
            this.Vy=0;
        }
        else if(Math.abs(this.Vy)==0.2 && this.isArrowRightorLeft() && this.inUse && 0<this.stamina)
        {
            this.Vy=this.Vy
        }
        else {
            this.Vy = -this.Vy*coefficientOfLoss
        }   
    }
    touchRight = (coefficientOfLoss) =>{
        this.x = this.previousX
        if(this.Vx>1){
            this.Vx = -this.Vx*coefficientOfLoss
        }
        else if(Math.abs(this.Vx)===1){
            this.Vy=-0.2;
        }
        else{
            this.Vx=0
        }
        
    }
    touchLeft = (coefficientOfLoss) =>{
        this.x = this.previousX
        if(this.Vx<-1){
            this.Vx = -this.Vx*coefficientOfLoss
        }
        else if(Math.abs(this.Vx)===1){
            this.Vy=-0.2;
        }
        else{
            this.Vx=0
        }
    }

}

class Bullet extends Component{
    constructor(x,y,Vx,Vy,width,height,canvas){
        super(x,y,Vx,Vy,width,height,canvas);
        this.type = 'bullet'
        this.color ='pink'
        this.vExplosion = 2
        this.rExplosion = 30
        this.damage = 1000
        this.bulletImage = new Image()
        this.center()
    }

    drawBullet = () =>{
        this.bulletImage.src ='./image/grenade.png'
        this.contex.fillStyle = 'pink'
        this.contex.drawImage(this.bulletImage,this.x,this.y,this.width,this.height);
    }

}

game = new Game(globalCanvas)

game.start()

window.requestAnimationFrame(game.updateGame);
