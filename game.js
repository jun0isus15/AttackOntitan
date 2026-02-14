// 진격의 거인 배틀 게임

class Character {
    constructor(name, cost, hp, attack, specialAbility, emoji) {
        this.name = name;
        this.cost = cost;
        this.hp = hp;
        this.attack = attack;
        this.specialAbility = specialAbility;
        this.emoji = emoji;
        this.level = 1;
    }

    getStats() {
        const multiplier = 1 + (this.level - 1) * 0.2;
        return {
            hp: Math.floor(this.hp * multiplier),
            attack: Math.floor(this.attack * multiplier),
            cost: Math.floor(this.cost * 0.8)
        };
    }
}

class Unit {
    constructor(character, x, y, team = 'player') {
        this.character = character;
        this.x = x;
        this.y = y;
        this.team = team;
        this.hp = character.getStats().hp;
        this.maxHp = this.hp;
        this.vx = team === 'player' ? 3 : -3;
        this.width = 40;
        this.height = 50;
    }

    update() {
        this.x += this.vx;
    }

    draw(ctx) {
        // 캐릭터 그리기
        ctx.fillStyle = this.team === 'player' ? '#228B22' : '#DC143C';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // HP 바 그리기
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 - 15, this.width, 5);

        const healthPercent = this.hp / this.maxHp;
        ctx.fillStyle = healthPercent > 0.5 ? '#00AA00' : healthPercent > 0.25 ? '#FFD700' : '#FF0000';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 - 15, this.width * healthPercent, 5);

        // 이모지 그리기
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.character.emoji, this.x, this.y);
    }

    takeDamage(damage) {
        this.hp -= damage;
        return this.hp <= 0;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 캐릭터 정의 (진격의 거인 테마)
        this.characters = [
            new Character('에렌', 30, 100, 25, 'titan_form', '😤'),
            new Character('미카사', 40, 80, 35, 'slice', '⚔️'),
            new Character('아르민', 35, 60, 30, 'strategy', '🧠'),
            new Character('리바이', 60, 95, 50, 'ackerman', '🗡️'),
            new Character('한지', 45, 70, 28, 'analysis', '🔬'),
            new Character('조르벽', 50, 110, 40, 'colossal', '👹'),
            new Character('샤샤', 35, 75, 32, 'charge', '🏇'),
            new Character('장로노', 55, 100, 38, 'defense', '🛡️'),
            new Character('알라딘', 40, 85, 33, 'spear', '🔱'),
            new Character('콘니', 38, 80, 30, 'mobility', '🚀')
        ];

        this.stages = [
            { wave: 1, enemies: 3, difficulty: 1 },
            { wave: 2, enemies: 4, difficulty: 1.2 },
            { wave: 3, enemies: 5, difficulty: 1.4 },
            { wave: 4, enemies: 6, difficulty: 1.6 },
            { wave: 5, enemies: 7, difficulty: 1.8 },
            { wave: 6, enemies: 8, difficulty: 2 },
            { wave: 7, enemies: 5, difficulty: 2.2 },
            { wave: 8, enemies: 6, difficulty: 2.4 },
            { wave: 9, enemies: 7, difficulty: 2.6 },
            { wave: 10, enemies: 8, difficulty: 3 }
        ];

        this.reset();
        this.initUI();
        this.setupEventListeners();
    }

    reset() {
        this.gold = 0;
        this.playerHp = 100;
        this.maxPlayerHp = 100;
        this.currentStage = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.gameWon = false;
        this.difficulty = 'normal';

        this.playerUnits = [];
        this.enemyUnits = [];
        this.spawnTime = 0;
        this.gold = 50;

        this.upgrades = {
            characterLevel: 0,
            goldIncrease: 0,
            hpIncrease: 0,
            attackIncrease: 0
        };

        this.startWave(0);
    }

    startWave(waveIndex) {
        this.currentStage = waveIndex + 1;
        this.playerUnits = [];
        this.enemyUnits = [];
        this.spawnTime = 0;

        const stageConfig = this.stages[waveIndex];
        this.currentWaveConfig = stageConfig;
        this.spawnedEnemies = 0;

        document.getElementById('stage').textContent = this.currentStage;
    }

    addGold(amount) {
        const bonus = Math.floor(amount * (this.upgrades.goldIncrease * 0.1));
        this.gold += amount + bonus;
        document.getElementById('gold').textContent = this.gold;
    }

    deployCharacter(character) {
        const stats = character.getStats();
        if (this.gold < stats.cost) return false;

        this.gold -= stats.cost;
        document.getElementById('gold').textContent = this.gold;

        const y = 100 + Math.random() * 200;
        const unit = new Unit(character, 50, y, 'player');
        this.playerUnits.push(unit);

        this.addGold(2); // 배포 후 약간의 자금 회수
        return true;
    }

    spawnEnemies() {
        if (this.spawnedEnemies >= this.currentWaveConfig.enemies) return;

        this.spawnTime++;
        const spawnInterval = 60 - this.currentWaveConfig.difficulty * 5;

        if (this.spawnTime > spawnInterval) {
            this.spawnTime = 0;

            // 랜덤 거인 선택
            const randomChar = this.characters[Math.floor(Math.random() * this.characters.length)];
            const y = 100 + Math.random() * 200;
            const enemy = new Unit(randomChar, this.canvas.width - 50, y, 'enemy');

            // 난이도 조정
            const difficultyMultiplier = this.difficulty === 'easy' ? 0.8 : 1;
            enemy.character.attack *= difficultyMultiplier;
            enemy.hp *= difficultyMultiplier;
            enemy.maxHp *= difficultyMultiplier;

            this.enemyUnits.push(enemy);
            this.spawnedEnemies++;
        }
    }

    update() {
        if (this.isPaused || this.isGameOver) return;

        // 유닛 업데이트
        this.playerUnits = this.playerUnits.filter(unit => {
            unit.update();
            return unit.x < this.canvas.width && unit.hp > 0;
        });

        this.enemyUnits = this.enemyUnits.filter(unit => {
            unit.update();
            return unit.x > 0 && unit.hp > 0;
        });

        // 적 스폰
        this.spawnEnemies();

        // 충돌 감지
        this.checkCollisions();

        // 골드 생성
        if (Math.random() < 0.02) {
            this.addGold(1);
        }

        // 스테이지 클리어 확인
        if (this.spawnedEnemies >= this.currentWaveConfig.enemies &&
            this.enemyUnits.length === 0 &&
            this.currentStage < 10) {
            this.startWave(this.currentStage);
        }

        // 게임 종료 확인
        if (this.playerHp <= 0) {
            this.endGame(false);
        }

        if (this.currentStage > 10 && this.enemyUnits.length === 0) {
            this.endGame(true);
        }
    }

    checkCollisions() {
        for (let i = 0; i < this.playerUnits.length; i++) {
            for (let j = 0; j < this.enemyUnits.length; j++) {
                const p = this.playerUnits[i];
                const e = this.enemyUnits[j];

                const dist = Math.hypot(p.x - e.x, p.y - e.y);
                if (dist < 50) {
                    // 충돌 발생
                    const damage = p.character.getStats().attack;
                    if (e.takeDamage(damage)) {
                        this.enemyUnits.splice(j, 1);
                        this.addGold(10);
                        j--;
                    } else {
                        const enemyDamage = e.character.getStats().attack;
                        if (p.takeDamage(enemyDamage)) {
                            this.playerUnits.splice(i, 1);
                            i--;
                        } else {
                            this.playerHp -= Math.floor(enemyDamage * 0.1);
                            this.playerHp = Math.max(0, this.playerHp);
                        }
                    }
                }
            }
        }

        // 적이 왼쪽으로 통과
        for (let i = 0; i < this.enemyUnits.length; i++) {
            if (this.enemyUnits[i].x < 0) {
                this.playerHp -= 10;
                this.enemyUnits.splice(i, 1);
                i--;
            }
        }

        document.getElementById('hp').textContent = this.playerHp;
    }

    draw() {
        // 배경 그리기
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 네트워크 선 그리기 (분위기)
        this.ctx.strokeStyle = '#E0F6FF';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 100) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }

        // 유닛 그리기
        this.playerUnits.forEach(unit => unit.draw(this.ctx));
        this.enemyUnits.forEach(unit => unit.draw(this.ctx));

        // 일시정지 표시
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 50px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('일시정지', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    endGame(won) {
        this.isGameOver = true;
        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');

        if (won) {
            title.textContent = '🎉 게임 클리어! 🎉';
            message.textContent = `축하합니다! 모든 거인을 격퇴했습니다!\n\n최종 자금: ${this.gold} G\n최종 HP: ${this.playerHp} / ${this.maxPlayerHp}`;
        } else {
            title.textContent = '💀 게임 오버! 💀';
            message.textContent = `거인의 공격을 막지 못했습니다...\n\n흔적 자금: ${this.gold} G\n클리어한 스테이지: ${this.currentStage} / 10`;
        }

        modal.style.display = 'flex';
    }

    initUI() {
        const grid = document.getElementById('charactersGrid');
        grid.innerHTML = '';

        this.characters.forEach(char => {
            const card = document.createElement('div');
            card.className = 'character-card';
            const stats = char.getStats();
            card.innerHTML = `
                <div style="font-size: 2em;">${char.emoji}</div>
                <div class="character-name">${char.name}</div>
                <div class="character-cost">${stats.cost} G</div>
            `;

            card.addEventListener('click', () => {
                this.selectCharacter(char, card);
            });

            grid.appendChild(card);
        });
    }

    selectCharacter(character, card) {
        document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        const stats = character.getStats();
        const info = document.getElementById('characterInfo');
        info.innerHTML = `
            <h3>${character.emoji} ${character.name}</h3>
            <div class="info-item">
                <span class="info-label">비용:</span> ${stats.cost} G
            </div>
            <div class="info-item">
                <span class="info-label">HP:</span> ${stats.hp}
            </div>
            <div class="info-item">
                <span class="info-label">공격력:</span> ${stats.attack}
            </div>
            <div class="info-item">
                <span class="info-label">특수능력:</span> ${character.specialAbility}
            </div>
            <div class="info-item">
                <span class="info-label">레벨:</span> ${character.level}
            </div>
            <button class="btn" style="width: 100%; margin-top: 15px; padding: 10px;" onclick="game.deployCharacter(game.characters[${game.characters.indexOf(character)}])">배포하기 (${stats.cost} G)</button>
        `;

        this.selectedCharacter = character;
    }

    showUpgradeModal() {
        const modal = document.getElementById('upgradeModal');
        const list = document.getElementById('upgradesList');
        list.innerHTML = '';

        const upgradeOptions = [
            {
                name: '🧬 캐릭터 강화',
                description: '모든 캐릭터의 레벨 +1',
                cost: 100,
                key: 'characterLevel'
            },
            {
                name: '💰 자금 증가',
                description: '자금 드롭량 +10%',
                cost: 80,
                key: 'goldIncrease'
            },
            {
                name: '❤️ HP 증가',
                description: '최대 HP +20',
                cost: 120,
                key: 'hpIncrease'
            },
            {
                name: '⚔️ 공격력 증가',
                description: '캐릭터 공격력 +10%',
                cost: 100,
                key: 'attackIncrease'
            }
        ];

        upgradeOptions.forEach(upgrade => {
            const item = document.createElement('div');
            item.className = 'upgrade-item';

            const canAfford = this.gold >= upgrade.cost;

            item.innerHTML = `
                <h4>${upgrade.name}</h4>
                <p>${upgrade.description}</p>
                <div class="upgrade-cost">${upgrade.cost} G</div>
                <button class="upgrade-btn-item" ${!canAfford ? 'disabled' : ''} onclick="game.purchaseUpgrade('${upgrade.key}', ${upgrade.cost}, this)">구매</button>
            `;

            list.appendChild(item);
        });

        modal.style.display = 'flex';
    }

    purchaseUpgrade(key, cost, btn) {
        if (this.gold < cost) return;

        this.gold -= cost;
        document.getElementById('gold').textContent = this.gold;
        this.upgrades[key]++;

        // 캐릭터 레벨 업그레이드
        if (key === 'characterLevel') {
            this.characters.forEach(char => char.level++);
        }

        // HP 업그레이드
        if (key === 'hpIncrease') {
            this.maxPlayerHp += 20;
            this.playerHp += 20;
            document.getElementById('hp').textContent = this.playerHp;
        }

        btn.disabled = true;
        btn.textContent = '구매됨!';

        this.showUpgradeModal();
    }

    setupEventListeners() {
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            document.getElementById('pauseBtn').textContent = this.isPaused ? '계속' : '일시정지';
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
            this.initUI();
            document.getElementById('gameOverModal').style.display = 'none';
        });

        document.getElementById('upgradeBtn').addEventListener('click', () => {
            this.showUpgradeModal();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.reset();
            this.initUI();
            document.getElementById('gameOverModal').style.display = 'none';
        });

        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('upgradeModal').style.display = 'none';
        });

        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });

        document.getElementById('upgradeModal').addEventListener('click', (e) => {
            if (e.target.id === 'upgradeModal') {
                e.target.style.display = 'none';
            }
        });
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 게임 시작
let game;
window.addEventListener('load', () => {
    game = new Game();
    game.gameLoop();
});
