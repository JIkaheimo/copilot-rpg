import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src',
  base: process.env.NODE_ENV === 'production' ? '/copilot-rpg/' : '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'three': ['three'],
          'cannon': ['cannon-es'],
          'gui': ['dat.gui'],
          'events': ['eventemitter3'],
          
          // Core game systems
          'core': [
            'src/core/Game.ts',
            'src/core/GameState.ts',
            'src/core/SceneManager.ts',
            'src/core/EventBus.ts',
            'src/core/InputManager.ts',
            'src/core/GameSystemManager.ts'
          ],
          
          // Game systems
          'systems': [
            'src/systems/WeatherSystem.ts',
            'src/systems/DayNightCycle.ts',
            'src/systems/ParticleSystem.ts',
            'src/systems/LightingSystem.ts',
            'src/systems/AtmosphereSystem.ts',
            'src/systems/LODSystem.ts',
            'src/systems/WaterSystem.ts',
            'src/systems/AudioSystem.ts'
          ],
          
          // Gameplay systems
          'gameplay': [
            'src/systems/CombatSystem.ts',
            'src/systems/EnemySystem.ts',
            'src/systems/PlayerController.ts',
            'src/systems/WeaponSystem.ts',
            'src/systems/MagicSystem.ts',
            'src/systems/InteractionSystem.ts'
          ],
          
          // UI components
          'ui': [
            'src/ui/UIManager.ts',
            'src/ui/MobileControls.ts',
            'src/ui/components/HealthDisplay.ts',
            'src/ui/components/ManaDisplay.ts',
            'src/ui/components/ExperienceDisplay.ts',
            'src/ui/components/NotificationSystem.ts'
          ],
          
          // Utilities
          'utils': [
            'src/utils/TextureGenerator.ts',
            'src/utils/CharacterModelGenerator.ts'
          ]
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 800
  },
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@systems': path.resolve(__dirname, 'src/systems'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@components': path.resolve(__dirname, 'src/components'),
    },
  },
  // Performance optimizations
  optimizeDeps: {
    include: ['three', 'cannon-es', 'dat.gui', 'eventemitter3']
  }
});