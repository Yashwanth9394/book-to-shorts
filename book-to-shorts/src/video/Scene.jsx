import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile
} from 'remotion';
import { parseStyle, getTextSize } from '../utils/tailwind-mapper.js';
import { getAnimationStyle, DEFAULT_ANIMATION } from './animations.js';

/**
 * Single scene component
 */
export const Scene = ({ sceneData, audioPath, imagePath, fps }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const { visuals, audio } = sceneData;

  // Calculate base fade-in animation
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  // Get emoji animation style (uses our animation system)
  const emojiAnimationName = visuals.emoji_animation || DEFAULT_ANIMATION;
  const emojiAnimStyle = getAnimationStyle(emojiAnimationName, frame, fps);

  // Text animation (slide up)
  const textY = interpolate(frame, [0, 20], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  // Parse styles using Tailwind mapper
  const backgroundStyle = parseStyle(visuals.background || 'bg-black');
  const textColorStyle = parseStyle(visuals.text_color || 'text-white');
  const textSizeValue = getTextSize(visuals.text_size || 'text-4xl');

  // Use asset paths directly
  const resolvedImagePath = imagePath;
  const resolvedAudioPath = audioPath;
  const resolvedMusicPath = audio?.background_music
    ? staticFile(`data/assets/music/${audio.background_music}`)
    : null;

  return (
    <AbsoluteFill>
      {/* Background */}
      <AbsoluteFill style={backgroundStyle}>
        {/* Background Image (if provided) */}
        {resolvedImagePath && (
          <Img
            src={resolvedImagePath}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.3
            }}
          />
        )}

        {/* Content Layer */}
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 60,
            opacity: fadeIn
          }}
        >
          {/* Emoji with animation */}
          {visuals.emoji && (
            <div
              style={{
                fontSize: 120,
                marginBottom: 40,
                ...emojiAnimStyle
              }}
            >
              {visuals.emoji}
            </div>
          )}

          {/* Text */}
          {visuals.text_on_screen && (
            <div
              style={{
                fontSize: textSizeValue,
                ...textColorStyle,
                fontWeight: 'bold',
                textAlign: 'center',
                textShadow: '0 4px 8px rgba(0,0,0,0.8)',
                lineHeight: 1.3,
                maxWidth: width - 120,
                transform: `translateY(${textY}px)`,
                whiteSpace: 'pre-line'
              }}
            >
              {visuals.text_on_screen}
            </div>
          )}
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Audio with fallback */}
      {resolvedAudioPath && (
        <Audio
          src={resolvedAudioPath}
          volume={1.0}
        />
      )}

      {/* Background Music with fallback */}
      {resolvedMusicPath && (
        <Audio
          src={resolvedMusicPath}
          volume={audio.music_volume || 0.15}
        />
      )}
    </AbsoluteFill>
  );
};

export default Scene;
