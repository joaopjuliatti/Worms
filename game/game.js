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
globalCanvas.width = 1000;
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
        this.playerHeigth = 40
        this.gravity = 0.1
        this.drag = 0.1
        this.frames = 0;
        this.turn = 1
        this.teams = ['red','blue','green']
        this.worms = []
        this.coefficientOfLoss = 0.5

        this.playerInitX = [100,900,400]
        this.playerInitY = 400
    }

    start = () =>{
        this.gameArea = new GameArea(this.canvas,this.playerInitY+this.playerHeigth,500)
        this.gameArea.start()
        this.startWorms()
        this.drawTurnTime()
        this.interval()
    }

    startWorms = () =>{
        for(let i=0;i<this.teams.length;i++){
            this.worms.push(new Worm(this.playerInitX[i],this.playerInitY,0,0,this.playerWidth,this.playerHeigth,this.teams[i],this.canvas))
            this.worms[i].start()
        }
        this.indWormInUse = Math.floor(Math.random()*this.worms.length)
        this.wormInUse = this.worms[this.indWormInUse]
    }

    drawWorms = () =>{
        for(let i=0;i<this.worms.length;i++){
            this.worms[i].newPos(0,this.gravity)
            this.touchEffectsTerrain(this.worms[i])
            this.worms[i].drawWorm()
        }
        this.wormInUse.drawAim();
    }

    clear = () =>{
        this.contex.clearRect(0,0,this.canvas.width,this.canvas.height)
    }

    keysPressed = () =>{
        if(keysUsed[37]) this.wormInUse.moveLeft()
        if(keysUsed[39]) this.wormInUse.moveRight()
        if(keysUsed[32]) this.wormInUse.jump()
        if(keysUsed[90]) this.wormInUse.attack()
        if(!this.wormInUse.isMoving()){
            if(keysUsed[38]) this.wormInUse.angleUp()
            if(keysUsed[40]) this.wormInUse.angleDown()
        }
    }

    updateGame = () =>{
        this.passTurn()
        this.clear()
        this.keysPressed()
        this.gameArea.drawGameArea()
        this.drawWorms()
        this.frames++
        this.drawTurnTime()
    }

    interval = () =>{
        setInterval(this.updateGame,1)
    }

    checkIfTouchTerrain = (component) =>{
        return  this.gameArea.terrains.reduce((acc,terrain)=>{
            const sideTouch = component.checkTouch(terrain)
            return [acc[0] || sideTouch[0],acc[1] || sideTouch[1],acc[2] || sideTouch[2],acc[3] ||  sideTouch[3]]
        },[false,false,false,false]) 
    }

    checkIfTouchPlayer = (component) => {
        return  this.worms.reduce((acc,player)=>{
            const sideTouch = component.checkTouch(player)
            return [acc[0] || sideTouch[0],acc[1] || sideTouch[1],acc[2] || sideTouch[2],acc[3] ||  sideTouch[3]]
        },[false,false,false,false]) 
    }

    touchEffectsTerrain = (component)=>{
        const touchVector = this.checkIfTouchTerrain(component)
        if(component.type==='worm'){
            if(touchVector[2]) component.touchBottom(this.drag,this.coefficientOfLoss,true)
            if(touchVector[0]) component.touchTop(this.drag,this.coefficientOfLoss,true)
            if(touchVector[1]) component.touchRight(this.coefficientOfLoss,true)
            if(touchVector[3]) component.touchLeft(this.coefficientOfLoss,true)
        }
        else component.explode()
    }

    touchEffectsPlayer = (component)=>{
        const touchVector = this.checkIfTouchPlayer(component)
        if(component.type==='worm'){
            if(touchVector[2]) component.touchBottom(this.drag,this.coefficientOfLoss,false)
            if(touchVector[0]) component.touchTop(this.drag,this.coefficientOfLoss,false)
            if(touchVector[1]) component.touchRight(this.drag,this.coefficientOfLoss,false)
            if(touchVector[3]) component.touchLeft(this.drag,this.coefficientOfLoss,false)
        }
        else component.explode()
    }

    passTurn = () =>{
        if(this.frames > 600 && !this.wormInUse.isMoving()){
            this.turn++
            this.nextWorm()
            this.frames = 0
            this.wormInUse.beginTurn()
        }
    }

    nextWorm = () =>{
        this.indWormInUse ++
        if(this.indWormInUse>=this.worms.length) this.indWormInUse = 0
        this.wormInUse = this.worms[this.indWormInUse]
    }

    drawTurnTime = () =>{
        this.contex.font = '30px Arial black'
        this.contex.fillStyle = this.wormInUse.team
        this.contex.fillText(`${this.frames/100}`,400,100)

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
    }

    start = () =>{
        const widthAtom = this.canvas.width/this.atomization
        const numberRows = (this.canvas.height - this.initY)/widthAtom
        for(let i = 0;i<this.atomization;i++){
            for(let j=0; j<numberRows;j++){
                this.terrains.push(new Terrain(0+i*widthAtom,this.initY+j*widthAtom,0,0,widthAtom+1,widthAtom+1,this.canvas))
            }
        }
        this.drawGameArea()
    }

    drawGameArea = () =>{
        this.contex.fillStyle = "black"
        this.contex.fillRect(0,0,1000,500);
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
    }

    draw = () =>{
        this.contex.fillStyle = 'yellow'
        this.contex.fillRect(this.x,this.y,this.width,this.height);
    }

}


class Worm extends Component{
    constructor(x,y,Vx,Vy,width,height,team,canvas){
        super(x,y,Vx,Vy,width,height,canvas);
        this.bullets = [];
        this.gravity = 0.1
        this.numberBullets = 10
        this.numberJumps = 1
        this.team = team
        this.front = 'right'
        this.type = 'worm'
        this.angle = 0
        this.life = 100
        this.stamina = 100
    }

    start = () =>{
        this.newPos(0,0)
        this.drawWorm()
    }

    drawWorm = () =>{
        this.contex.fillStyle = this.team
        this.contex.fillRect(this.x,this.y,this.width,this.height);
        this.frames++;    
        this.drawBullets() 
    }
    drawAim = () =>{
        if(!this.isMoving()){
            this.contex.beginPath();
            this.contex.strokeStyle='white';
            if(this.front ==='right') this.contex.arc(this.centerX,this.centerY, 40,2*Math.PI-this.angle/180*Math.PI,2*Math.PI-this.angle/180*Math.PI)
            else this.contex.arc(this.centerX,this.centerY, 40,Math.PI+this.angle/180*Math.PI,Math.PI+this.angle/180*Math.PI)
            this.contex.lineTo(this.centerX, this.centerY);
            this.contex.closePath();
            this.contex.stroke()
        }
    }

    beginTurn(){
        this.frames = 0;
        this.bullets =[];
        this.numberBullets=1;
        this.numberJumps = 2
    }

    jump = () =>{
        if(this.numberJumps>0){
            this.Vy = -1.5
            this.numberJumps--
        }
    }

    moveRight =() =>{
        if(this.front ==='right'){
            this.Vx = 1
        }else{
            this.front = 'right'
            this.Vx = 1
        }
    }

    moveLeft =() =>{
        if(this.front==='right'){
            this.front = 'left'
            this.Vx = -1
        }else{
            this.Vx = -1
        }
    }
    angleUp = () =>{
        if(this.angle<=90){
            this.angle+=2
        }
    }
    angleDown = () =>{
        if(this.angle>=-90){
            this.angle-=2
        }
    }
    
    attack = () =>{
        if(!this.isMoving()){
            if(this.frames % 50 ===0 && this.numberBullets>0){
                const vInicial = 8
                if(this.front ==='right'){
                    this.bullets.push(new Bullet(this.centerX,this.centerY,vInicial*Math.cos(this.angle/180*Math.PI),-vInicial*Math.sin(this.angle/180*Math.PI),10,10,this.canvas))
                }
                else{
                    this.bullets.push(new Bullet(this.x,this.y,-vInicial*Math.cos(this.angle/180*Math.PI),-vInicial*Math.sin(this.angle/180*Math.PI),10,10,this.canvas))
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
        return keysUsed[37] || keysUsed[39]
    }

    touchTop = (drag,coefficientOfLoss) =>{
        this.y = this.previousY

        if(Math.abs(this.Vx)>1){
            this.Vx = this.Vx - Math.sign(this.Vx)*drag
        }
        else if(Math.abs(this.Vx)<1 && this.isArrowRightorLeft())
        {
            this.Vx=this.Vx
        }
        else{
            this.Vx=0
        }
        
        if(this.Vy>-2){
            this.Vy=0;
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
        else if(Math.abs(this.Vx)<=1 && this.isArrowRightorLeft())
        {
            this.Vx=this.Vx
        }
        else{
            this.Vx=0
        }

        if(this.Vy<2){
            this.Vy=0;
        }
        else {
            this.Vy = -this.Vy*coefficientOfLoss
        }   
    }
    touchRight = (drag,coefficientOfLoss) =>{
        this.x = this.previousX
        if(this.Vx>1){
            this.Vy = -this.Vy*coefficientOfLoss
        }
        else if(Math.abs(this.Vx)===1){
            this.Vy=-0.1;
        }
        else{
            this.Vx=0
        }
        
    }
    touchLeft = (drag,coefficientOfLoss) =>{
        this.x = this.previousX
        if(this.Vx<-1){
            this.Vy = -this.Vy*coefficientOfLoss
        }
        else if(Math.abs(this.Vx)===1){
            this.Vy=-0.1;
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
    }

    drawBullet = () =>{
        this.contex.fillStyle = 'pink'
        this.contex.fillRect(this.x,this.y,this.width,this.height);
    }
    explode = () =>{
        console.log('explodiu')
    }

}

game = new Game(globalCanvas)

game.start()
