/**
 * 幻想冒險 - 音樂音效系統 (Web Audio API 版)
 * 使用 AudioContext 以支援與背景音樂混音
 * @版本 v3.3
 * @更新 2025-11-30
 */

const AudioSystem = {
    context: null,
    bgmNode: null,
    bgmGainNode: null,
    sfxGainNode: null,
    bgmVolume: 0.05,
    sfxVolume: 0.05,
    isPlaying: false,
    soundCache: {},  // 音效緩存 (AudioBuffer)
    bgmBuffer: null, // BGM 緩存
    proceduralNodes: [], // 儲存生成音樂的節點

    // 音效文件路徑配置
    soundPaths: {
        attack: 'audio/attack.wav',  // 劍揮擊
        damage: 'audio/damage.wav',  // 受擊
        flee: 'audio/flee.wav',    // 快速移動
        coin: 'audio/coin.wav',   // 金幣
        potion: 'audio/potion.wav', // 藥水/液體
        equip: 'audio/equip.wav',  // 裝備
        unequip: 'audio/unequip.wav', // 卸裝
        item: 'audio/item.wav',    // 獲得物品
        die: 'audio/die.wav',      // 死亡
        shop: 'audio/shop.wav',    // 商店
        stranger: 'audio/stranger.wav', // 陌生人/賭場
        anvil: 'audio/anvil.wav',   // 工匠/鐵砧
        anvil_success: 'audio/anvil_2.wav', // 強化成功
        anvil_fail: 'audio/anvil_3.wav'     // 強化失敗
    },

    // BGM URL (使用者指定)
    bgmUrl: 'audio/bensound-epic.mp3',

    init() {
        // 初始化 AudioContext (需等待使用者互動)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();

        // 建立音量控制節點
        this.bgmGainNode = this.context.createGain();
        this.sfxGainNode = this.context.createGain();

        // 連接到輸出
        this.bgmGainNode.connect(this.context.destination);
        this.sfxGainNode.connect(this.context.destination);

        // 讀取儲存的音量
        const savedBGMVolume = localStorage.getItem('bgm_volume');
        const savedSFXVolume = localStorage.getItem('sfx_volume');

        if (savedBGMVolume !== null) this.bgmVolume = parseFloat(savedBGMVolume);
        if (savedSFXVolume !== null) this.sfxVolume = parseFloat(savedSFXVolume);

        this.updateGain();

        // 預載音效
        this.preloadSounds();
        // 嘗試預載 BGM
        this.loadBGM();

        this.enableAutoPlay();
        this.updateVolumeUI();
    },

    updateGain() {
        if (this.bgmGainNode) this.bgmGainNode.gain.value = this.bgmVolume;
        if (this.sfxGainNode) this.sfxGainNode.gain.value = this.sfxVolume;

        // Fallback: 如果正在使用 HTML5 Audio 播放 BGM，也更新其音量
        if (this.bgmNode instanceof Audio) {
            this.bgmNode.volume = this.bgmVolume;
        }
    },

    /**
     * 預載所有音效
     */
    async preloadSounds() {
        for (const [key, path] of Object.entries(this.soundPaths)) {
            try {
                const response = await fetch(path);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                this.soundCache[key] = audioBuffer;
            } catch (e) {
                console.warn(`[AudioSystem] Web Audio API load failed for ${key}, falling back to HTML5 Audio.`, e);
                // Fallback: 標記為使用 HTML5 Audio
                this.soundCache[key] = { type: 'html5', src: path };
            }
        }
    },

    /**
     * 載入 BGM
     */
    async loadBGM() {
        try {
            const response = await fetch(this.bgmUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            this.bgmBuffer = await this.context.decodeAudioData(arrayBuffer);
            console.log('[AudioSystem] BGM loaded successfully (Web Audio)');
        } catch (e) {
            console.warn('[AudioSystem] Failed to load BGM via Web Audio, falling back to HTML5 Audio', e);
            // Fallback: 標記為使用 HTML5 Audio
            this.bgmBuffer = { type: 'html5', src: this.bgmUrl };
        }
    },

    enableAutoPlay() {
        const resumeContext = () => {
            if (this.context && this.context.state === 'suspended') {
                this.context.resume();
            }
            // 首次互動後嘗試播放 BGM (如果已載入)
            if (!this.isPlaying && localStorage.getItem('bgm_enabled') !== 'false') {
                this.playBGM();
            }
        };
        document.addEventListener('click', resumeContext, { once: true });
        document.addEventListener('touchstart', resumeContext, { once: true });
        document.addEventListener('keydown', resumeContext, { once: true });
    },

    /**
     * 播放音效
     */
    playSFX(key) {
        const sound = this.soundCache[key];
        if (!sound) return;

        if (this.context && this.context.state === 'suspended') this.context.resume();

        if (sound instanceof AudioBuffer) {
            // Web Audio API 播放
            const source = this.context.createBufferSource();
            source.buffer = sound;
            source.connect(this.sfxGainNode);
            source.start(0);
        } else if (sound.type === 'html5') {
            // HTML5 Audio Fallback
            const audio = new Audio(sound.src);
            audio.volume = this.sfxVolume;
            audio.play().catch(e => console.error("SFX play failed", e));
        }
    },

    /**
     * 建立程式生成音樂 (Ambient Drone)
     */
    createProceduralBGM() {
        this.stopProceduralBGM(); // 先停止舊的

        // 建立三個振盪器形成和弦 (C Major: C3, E3, G3)
        const freqs = [130.81, 164.81, 196.00];

        freqs.forEach(freq => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            // 每個音的音量稍微隨機，製造流動感
            gain.gain.value = 0.1 + Math.random() * 0.05;

            osc.connect(gain);
            gain.connect(this.bgmGainNode);

            osc.start();
            this.proceduralNodes.push({ osc, gain });
        });

        console.log('[AudioSystem] Playing Procedural BGM');
    },

    stopProceduralBGM() {
        this.proceduralNodes.forEach(node => {
            try {
                node.osc.stop();
                node.osc.disconnect();
                node.gain.disconnect();
            } catch (e) { }
        });
        this.proceduralNodes = [];
    },

    /**
     * 播放 BGM
     */
    async playBGM() {
        if (this.isPlaying) return;

        // 移除這裡的 localStorage 檢查，因為這會阻止使用者手動開啟 BGM
        // if (localStorage.getItem('bgm_enabled') === 'false') return;

        if (this.context && this.context.state === 'suspended') this.context.resume();

        // 如果還沒載入 BGM，嘗試載入
        if (!this.bgmBuffer) {
            await this.loadBGM();
        }

        try {
            if (this.bgmBuffer instanceof AudioBuffer) {
                // Web Audio API
                this.bgmNode = this.context.createBufferSource();
                this.bgmNode.buffer = this.bgmBuffer;
                this.bgmNode.loop = true;
                this.bgmNode.connect(this.bgmGainNode);
                this.bgmNode.start(0);
                this.isPlaying = true;
            } else if (this.bgmBuffer && this.bgmBuffer.type === 'html5') {
                // HTML5 Audio Fallback
                if (!this.bgmNode || !(this.bgmNode instanceof Audio)) {
                    this.bgmNode = new Audio(this.bgmBuffer.src);
                    this.bgmNode.loop = true;
                }
                this.bgmNode.volume = this.bgmVolume;

                // 嘗試播放，如果失敗則切換到程式生成音樂
                await this.bgmNode.play().catch(e => {
                    console.warn("HTML5 Audio play failed, trying procedural...", e);
                    throw e;
                });
                this.isPlaying = true;
            } else {
                throw new Error("No BGM buffer available");
            }
        } catch (e) {
            console.error("BGM play failed, falling back to procedural generation", e);
            // 如果所有方法都失敗，使用程式生成音樂
            this.createProceduralBGM();
            this.isPlaying = true;
        }

        this.updateToggleButton();
        if (this.isPlaying) {
            localStorage.setItem('bgm_enabled', 'true');
        }
    },

    pauseBGM() {
        // 停止 Web Audio Buffer
        if (this.bgmNode) {
            try {
                if (this.bgmNode instanceof AudioBufferSourceNode) {
                    this.bgmNode.stop();
                }
            } catch (e) { }
            // 注意：對於 HTML5 Audio，我們不一定要設為 null，可以保留以便下次 play()
            if (this.bgmNode instanceof AudioBufferSourceNode) {
                this.bgmNode = null;
            }
        }

        // 停止程式生成音樂
        this.stopProceduralBGM();

        // 停止 HTML5 Audio (如果有的話)
        if (this.bgmNode instanceof Audio) {
            this.bgmNode.pause();
        }

        this.isPlaying = false;
        this.updateToggleButton();
        localStorage.setItem('bgm_enabled', 'false');
    },

    toggleBGM() {
        if (this.isPlaying) {
            this.pauseBGM();
        } else {
            this.playBGM();
        }
    },

    setBGMVolume(val) {
        this.bgmVolume = parseFloat(val);
        this.updateGain();
        localStorage.setItem('bgm_volume', this.bgmVolume);

        // 更新 UI 顯示
        const text = document.getElementById('bgm-vol-text');
        if (text) text.innerText = `${Math.round(this.bgmVolume * 100)}%`;
    },

    setSFXVolume(val) {
        this.sfxVolume = parseFloat(val);
        this.updateGain();
        localStorage.setItem('sfx_volume', this.sfxVolume);

        // 更新 UI 顯示
        const text = document.getElementById('sfx-vol-text');
        if (text) text.innerText = `${Math.round(this.sfxVolume * 100)}%`;
    },

    updateVolumeUI() {
        const bgmSlider = document.getElementById('bgm-slider');
        const sfxSlider = document.getElementById('sfx-slider');
        if (bgmSlider) bgmSlider.value = this.bgmVolume;
        if (sfxSlider) sfxSlider.value = this.sfxVolume;

        const bgmText = document.getElementById('bgm-vol-text');
        if (bgmText) bgmText.innerText = `${Math.round(this.bgmVolume * 100)}%`;

        const sfxText = document.getElementById('sfx-vol-text');
        if (sfxText) sfxText.innerText = `${Math.round(this.sfxVolume * 100)}%`;

        this.updateToggleButton();
    },

    updateToggleButton() {
        const btn = document.getElementById('bgm-toggle');
        if (btn) {
            btn.innerText = this.isPlaying ? "🔊 BGM: ON" : "🔇 BGM: OFF";
            btn.className = this.isPlaying ? "" : "off";
        }
    },

    /**
     * 顯示設定介面
     */
    showSettings() {
        const html = `
            <div style="text-align: left; padding: 10px;">
                <h3 style="border-bottom: 1px solid #444; padding-bottom: 10px; margin-bottom: 15px;">音效設定</h3>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px;">🎵 背景音樂 (BGM)</label>
                    <input type="range" id="bgm-slider" min="0" max="1" step="0.01" value="${this.bgmVolume}" 
                        style="width: 100%;" oninput="AudioSystem.setBGMVolume(this.value)">
                    <div id="bgm-vol-text" style="text-align: right; font-size: 0.8em; color: #888;">${Math.round(this.bgmVolume * 100)}%</div>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px;">🔊 音效 (SFX)</label>
                    <input type="range" id="sfx-slider" min="0" max="1" step="0.01" value="${this.sfxVolume}" 
                        style="width: 100%;" oninput="AudioSystem.setSFXVolume(this.value)">
                    <div id="sfx-vol-text" style="text-align: right; font-size: 0.8em; color: #888;">${Math.round(this.sfxVolume * 100)}%</div>
                </div>

                <button id="bgm-toggle" onclick="AudioSystem.toggleBGM()" 
                    class="${this.isPlaying ? '' : 'off'}" style="width: 100%; padding: 10px; margin-top: 10px;">
                    ${this.isPlaying ? "🔊 BGM: ON" : "🔇 BGM: OFF"}
                </button>
            </div>
        `;

        // 假設 UISystem 有 showModal 方法，如果沒有則需要檢查 ui.js
        if (window.UISystem && window.UISystem.showModal) {
            window.UISystem.showModal("⚙️ 遊戲設定", html);
        } else {
            alert("UI 系統尚未就緒");
        }
    }
};

// 綁定到全域
if (typeof window !== 'undefined') {
    window.AudioSystem = AudioSystem;
}
