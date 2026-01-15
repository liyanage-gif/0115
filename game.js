// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const ammoElement = document.getElementById('ammo');
const healthElement = document.getElementById('health');
const speedElement = document.getElementById('speed');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

// Game objects
const car = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 60,
    height: 30,
    speed: 0,
    maxSpeed: 8,
    acceleration: 0.2,
    deceleration: 0.1,
    rotation: 0,
    rotationSpeed: 0.05,
    health: 100,
    color: '#ff0000'
};

let bullets = [];
let targets = [];
let explosions = [];
let score = 0;
let ammo = 30;
let gameRunning = true;

// Keys state
const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false
};

// Load images
const carImage = new Image();
carImage.src = 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="30" viewBox="0 0 60 30">
        <rect x="5" y="5" width="50" height="20" rx="5" fill="${car.color}"/>
        <rect x="10" y="0" width="40" height="10" rx="3" fill="${car.color}"/>
        <circle cx="15" cy="25" r="5" fill="#333"/>
        <circle cx="45" cy="25" r="5" fill="#333"/>
        <rect x="20" y="8" width="20" height="8" fill="#00aaff"/>
    </svg>
`);

const targetImage = new Image();
targetImage.src = 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="15" fill="#ff4444"/>
        <circle cx="20" cy="20" r="10" fill="#ffff44"/>
        <circle cx="20" cy="20" r="5" fill="#ff4444"/>
    </svg>
`);

// Event listeners
window.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = true;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            keys.down = true;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = true;
            break;
        case ' ':
            if (!keys.space && ammo > 0 && gameRunning) {
                keys.space = true;
                shoot();
            }
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = false;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            keys.down = false;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = false;
            break;
        case ' ':
            keys.space = false;
            break;
    }
});

// Shooting function
function shoot() {
    if (ammo <= 0) return;
    
    ammo--;
    updateUI();
    
    const bulletSpeed = 15;
    const bulletX = car.x + Math.cos(car.rotation) * (car.width / 2 + 10);
    const bulletY = car.y + Math.sin(car.rotation) * (car.height / 2 + 10);
    
    bullets.push({
        x: bulletX,
        y: bulletY,
        vx: Math.cos(car.rotation) * bulletSpeed + car.speed * 0.5,
        vy: Math.sin(car.rotation) * bulletSpeed + car.speed * 0.5,
        radius: 4,
        color: '#ffff00',
        life: 100
    });
}

// Create targets
function createTarget() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = -40;
            break;
        case 1: // Right
            x = canvas.width + 40;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 40;
            break;
        case 3: // Left
            x = -40;
            y = Math.random() * canvas.height;
            break;
    }
    
    targets.push({
        x: x,
        y: y,
        width: 40,
        height: 40,
        speed: 2 + Math.random() * 2,
        health: 3,
        angle: Math.atan2(car.y - y, car.x - x)
    });
}

// Create explosion
function createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        explosions.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            radius: Math.random() * 3 + 2,
            color: ['#ff0000', '#ff8800', '#ffff00'][Math.floor(Math.random() * 3)],
            life: 30
        });
    }
}

// Update game state
function update() {
    if (!gameRunning) return;
    
    // Update car movement
    if (keys.up) {
        car.speed = Math.min(car.speed + car.acceleration, car.maxSpeed);
    } else if (keys.down) {
        car.speed = Math.max(car.speed - car.acceleration, -car.maxSpeed * 0.5);
    } else {
        // Decelerate
        if (car.speed > 0) {
            car.speed = Math.max(car.speed - car.deceleration, 0);
        } else if (car.speed < 0) {
            car.speed = Math.min(car.speed + car.deceleration, 0);
        }
    }
    
    if (keys.left) {
        car.rotation -= car.rotationSpeed * (Math.abs(car.speed) / car.maxSpeed + 0.5);
    }
    if (keys.right) {
        car.rotation += car.rotationSpeed * (Math.abs(car.speed) / car.maxSpeed + 0.5);
    }
    
    // Update car position
    car.x += Math.cos(car.rotation) * car.speed;
    car.y += Math.sin(car.rotation) * car.speed;
    
    // Boundary check
    car.x = Math.max(car.width / 2, Math.min(canvas.width - car.width / 2, car.x));
    car.y = Math.max(car.height / 2, Math.min(canvas.height - car.height / 2, car.y));
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life--;
        
        // Remove off-screen or expired bullets
        if (bullet.life <= 0 || 
            bullet.x < -50 || bullet.x > canvas.width + 50 ||
            bullet.y < -50 || bullet.y > canvas.height + 50) {
            bullets.splice(i, 1);
        }
    }
    
    // Update targets
    for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];
        target.x += Math.cos(target.angle) * target.speed;
        target.y += Math.sin(target.angle) * target.speed;
        
        // Check collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            const dx = bullet.x - target.x;
            const dy = bullet.y - target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < target.width / 2 + bullet.radius) {
                target.health--;
                createExplosion(bullet.x, bullet.y);
                bullets.splice(j, 1);
                
                if (target.health <= 0) {
                    score += 100;
                    createExplosion(target.x, target.y);
                    targets.splice(i, 1);
                    break;
                }
            }
        }
        
        // Check collision with car
        const dx = target.x - car.x;
        const dy = target.y - car.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (target.width + car.width) / 2) {
            car.health -= 10;
            createExplosion(target.x, target.y);
            targets.splice(i, 1);
            updateUI();
            
            if (car.health <= 0) {
                gameOver();
            }
        }
        
        // Remove off-screen targets
        if (target.x < -100 || target.x > canvas.width + 100 ||
            target.y < -100 || target.y > canvas.height + 100) {
            targets.splice(i, 1);
        }
    }
    
    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        explosion.x += explosion.vx;
        explosion.y += explosion.vy;
        explosion.life--;
        
        if (explosion.life <= 0) {
            explosions.splice(i, 1);
        }
    }
    
    // Spawn new targets
    if (Math.random() < 0.02) {
        createTarget();
    }
    
    // Random ammo drop
    if (Math.random() < 0.005 && ammo < 30) {
        ammo = Math.min(30, ammo + 10);
        updateUI();
    }
    
    updateUI();
}

// Draw game objects
function draw() {
    // Clear canvas
    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw road lines
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw bullets
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    
    // Draw targets
    targets.forEach(target => {
        ctx.save();
        ctx.translate(target.x, target.y);
        ctx.rotate(target.angle);
        
        if (targetImage.complete) {
            ctx.drawImage(targetImage, -target.width / 2, -target.height / 2, target.width, target.height);
        } else {
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(-target.width / 2, -target.height / 2, target.width, target.height);
        }
        
        // Health indicator
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-target.width / 2, -target.height / 2 - 5, target.width * (target.health / 3), 3);
        
        ctx.restore();
    });
    
    // Draw car
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.rotation);
    
    if (carImage.complete) {
        ctx.drawImage(carImage, -car.width / 2, -car.height / 2, car.width, car.height);
    } else {
        ctx.fillStyle = car.color;
        ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    }
    
    // Draw gun turret
    ctx.fillStyle = '#666666';
    ctx.fillRect(-5, -10, 10, 20);
    
    ctx.restore();
    
    // Draw explosions
    explosions.forEach(explosion => {
        ctx.globalAlpha = explosion.life / 30;
        ctx.fillStyle = explosion.color;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    
    // Draw speed lines when moving fast
    if (Math.abs(car.speed) > 5) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 10]);
        
        for (let i = 0; i < 10; i++) {
            const offsetX = Math.cos(car.rotation + Math.PI) * (Math.random() * 100 + 50);
            const offsetY = Math.sin(car.rotation + Math.PI) * (Math.random() * 100 + 50);
            
            ctx.beginPath();
            ctx.moveTo(car.x + offsetX, car.y + offsetY);
            ctx.lineTo(car.x + offsetX * 1.5, car.y + offsetY * 1.5);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }
}

// Update UI
function updateUI() {
    scoreElement.textContent = score;
    ammoElement.textContent = ammo;
    healthElement.textContent = Math.max(0, car.health);
    speedElement.textContent = Math.round(Math.abs(car.speed) * 10);
}

// Game over
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'block';
}

// Reset game
function resetGame() {
    bullets = [];
    targets = [];
    explosions = [];
    
    car.x = canvas.width / 2;
    car.y = canvas.height / 2;
    car.speed = 0;
    car.rotation = 0;
    car.health = 100;
    
    score = 0;
    ammo = 30;
    gameRunning = true;
    
    gameOverScreen.style.display = 'none';
    updateUI();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
updateUI();
gameLoop();