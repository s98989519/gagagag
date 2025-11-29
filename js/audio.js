/**
 * 幻想冒險 - 音樂音效系統
 * 處理BGM和音效播放
 * @版本 v2.0 (真實音效版)
 * @更新 2025-11-27
 */

const AudioSystem = {
    bgm: null,
    bgmVolume: 0.05,
    sfxVolume: 0.05,
    isPlaying: false,
    soundCache: {},  // 音效緩存

    // 音效文件路徑配置
    // 你可以替換為本地路徑，例如：'audio/attack.mp3'
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

    init() {
        this.bgm = new Audio();
        this.bgm.loop = true;
        this.bgm.volume = this.bgmVolume;
        this.bgm.src = 'https://www.bensound.com/bensound-music/bensound-epic.mp3';

        const savedBGMVolume = localStorage.getItem('bgm_volume');
        const savedSFXVolume = localStorage.getItem('sfx_volume');

        if (savedBGMVolume !== null) {
            this.bgmVolume = parseFloat(savedBGMVolume);
            this.bgm.volume = this.bgmVolume;
        }

        if (savedSFXVolume !== null) {
            this.sfxVolume = parseFloat(savedSFXVolume);
        }

        // 預載音效
        this.preloadSounds();

        this.enableAutoPlay();
        this.updateVolumeUI();
    },

    /**
     * 預載所有音效到緩存
     */
    preloadSounds() {
        for (const [key, path] of Object.entries(this.soundPaths)) {
            const audio = new Audio();
            audio.src = path;
            audio.volume = this.sfxVolume;
            audio.preload = 'auto';
            this.soundCache[key] = audio;
        }
    },

    enableAutoPlay() {
        const playOnInteraction = () => {
            if (!this.isPlaying) {
                this.playBGM();
            }
        };
        document.addEventListener('click', playOnInteraction, { once: true });
    },

    playBGM() {
        if (this.bgm && !this.isPlaying) {
            this.bgm.play().then(() => {
                this.isPlaying = true;
                this.updateToggleButton();
                localStorage.setItem('bgm_enabled', 'true');
            }).catch(err => console.log('BGM:', err));
        }
    },

    pauseBGM() {
        if (this.bgm && this.isPlaying) {
            this.bgm.pause();
            this.isPlaying = false;
            this.updateToggleButton();
            localStorage.setItem('bgm_enabled', 'false');
        }
    },

    toggleBGM() {
        if (this.isPlaying) {
            this.pauseBGM();
        } else {
            this.playBGM();
        }
    },

    setBGMVolume(value) {
        this.bgmVolume = value / 100;
        if (this.bgm) this.bgm.volume = this.bgmVolume;
        localStorage.setItem('bgm_volume', this.bgmVolume);
        this.updateVolumeUI();
    },

    setSFXVolume(value) {
        this.sfxVolume = value / 100;
        localStorage.setItem('sfx_volume', this.sfxVolume);

        // 更新所有緩存音效的音量
        for (const audio of Object.values(this.soundCache)) {
            audio.volume = this.sfxVolume;
        }

        this.updateVolumeUI();
    },

    /**
     * 播放音效（使用真實音效文件）
     */
    playSFX(type) {
        if (this.sfxVolume === 0) return;

        try {
            // 從緩存獲取或創建新的音效
            let sound = this.soundCache[type];

            if (!sound) {
                console.log('未知音效類型:', type);
                return;
            }

            // 克隆音效以支持同時播放多個相同音效
            const audioClone = sound.cloneNode();
            audioClone.volume = this.sfxVolume;

            audioClone.play().catch(err => {
                console.log('音效播放失敗:', type, err);
            });

        } catch (e) {
            console.log('SFX錯誤:', e);
        }
    },

    updateVolumeUI() {
        const bgmVal = document.getElementById('bgm-volume-value');
        const sfxVal = document.getElementById('sfx-volume-value');
        const bgmSlider = document.getElementById('bgm-volume-slider');
        const sfxSlider = document.getElementById('sfx-volume-slider');

        if (bgmVal) bgmVal.textContent = Math.round(this.bgmVolume * 100) + '%';
        if (sfxVal) sfxVal.textContent = Math.round(this.sfxVolume * 100) + '%';
        if (bgmSlider) bgmSlider.value = Math.round(this.bgmVolume * 100);
        if (sfxSlider) sfxSlider.value = Math.round(this.sfxVolume * 100);
    },

    updateToggleButton() {
        const btn = document.getElementById('bgm-toggle-btn');
        if (btn) {
            if (this.isPlaying) {
                btn.textContent = '⏸️ 暫停 BGM';
                btn.style.background = '#ff9800';
            } else {
                btn.textContent = '▶️ 播放 BGM';
                btn.style.background = '#4caf50';
            }
        }
    },

    showSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.updateVolumeUI();
            this.updateToggleButton();
        }
    }
};

if (typeof window !== 'undefined') {
    window.AudioSystem = AudioSystem;
}

window.addEventListener('DOMContentLoaded', () => {
    AudioSystem.init();
});
