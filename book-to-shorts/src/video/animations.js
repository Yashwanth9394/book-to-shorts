/**
 * Emoji and text animation definitions
 * Maps animation names from scripts to actual CSS/Remotion animations
 */

export const emojiAnimations = {
  'pulse': {
    name: 'pulse',
    getStyle: (frame, fps) => {
      const progress = (frame % (fps * 1)) / (fps * 1); // 1 second loop
      const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.15;
      return {
        transform: `scale(${scale})`,
        opacity: 0.9 + Math.sin(progress * Math.PI * 2) * 0.1
      };
    }
  },

  'bounce': {
    name: 'bounce',
    getStyle: (frame, fps) => {
      const progress = Math.min(frame / (fps * 0.8), 1);
      const bounces = [
        { time: 0, y: 0 },
        { time: 0.25, y: -20 },
        { time: 0.5, y: 0 },
        { time: 0.75, y: -10 },
        { time: 1, y: 0 }
      ];

      let y = 0;
      for (let i = 0; i < bounces.length - 1; i++) {
        if (progress >= bounces[i].time && progress <= bounces[i + 1].time) {
          const segmentProgress = (progress - bounces[i].time) / (bounces[i + 1].time - bounces[i].time);
          y = bounces[i].y + (bounces[i + 1].y - bounces[i].y) * segmentProgress;
          break;
        }
      }

      return { transform: `translateY(${y}px)` };
    }
  },

  'swing': {
    name: 'swing',
    getStyle: (frame, fps) => {
      const progress = (frame % (fps * 1)) / (fps * 1);
      const rotation = Math.sin(progress * Math.PI * 2) * 15;
      return { transform: `rotate(${rotation}deg)` };
    }
  },

  'drip': {
    name: 'drip',
    getStyle: (frame, fps) => {
      const progress = Math.min(frame / (fps * 1.5), 1);
      const y = progress * 30;
      const opacity = 1 - progress;
      return {
        transform: `translateY(${y}px)`,
        opacity
      };
    }
  },

  'flip': {
    name: 'flip',
    getStyle: (frame, fps) => {
      const progress = Math.min(frame / (fps * 0.6), 1);
      const rotateY = progress * 360;
      return { transform: `rotateY(${rotateY}deg)` };
    }
  },

  'fade-in': {
    name: 'fade-in',
    getStyle: (frame, fps) => {
      const progress = Math.min(frame / (fps * 0.5), 1);
      return { opacity: progress };
    }
  },

  'open': {
    name: 'open',
    getStyle: (frame, fps) => {
      const progress = Math.min(frame / (fps * 0.5), 1);
      const scale = progress;
      const opacity = progress;
      return {
        transform: `scale(${scale})`,
        opacity
      };
    }
  },

  'zoom': {
    name: 'zoom',
    getStyle: (frame, fps) => {
      const progress = Math.min(frame / (fps * 0.4), 1);
      const scale = 0.5 + progress * 0.5;
      return { transform: `scale(${scale})` };
    }
  },

  'checkmark': {
    name: 'checkmark',
    getStyle: (frame, fps) => {
      const progress = Math.min(frame / (fps * 0.5), 1);
      let scale, rotation;

      if (progress < 0.5) {
        scale = progress * 2.4;
        rotation = -45 + progress * 90;
      } else {
        scale = 1.2 - (progress - 0.5) * 0.4;
        rotation = 0;
      }

      return { transform: `scale(${scale}) rotate(${rotation}deg)` };
    }
  },

  'slide-up': {
    name: 'slide-up',
    getStyle: (frame, fps) => {
      const progress = Math.min(frame / (fps * 0.5), 1);
      const y = 30 - progress * 30;
      const opacity = progress;
      return {
        transform: `translateY(${y}px)`,
        opacity
      };
    }
  },

  'slide-down': {
    name: 'slide-down',
    getStyle: (frame, fps) => {
      const progress = Math.min(frame / (fps * 0.5), 1);
      const y = -30 + progress * 30;
      const opacity = progress;
      return {
        transform: `translateY(${y}px)`,
        opacity
      };
    }
  }
};

/**
 * Get animation style for current frame
 */
export function getAnimationStyle(animationName, frame, fps) {
  const animation = emojiAnimations[animationName] || emojiAnimations['fade-in'];
  return animation.getStyle(frame, fps);
}

/**
 * Default animation if none specified
 */
export const DEFAULT_ANIMATION = 'fade-in';
