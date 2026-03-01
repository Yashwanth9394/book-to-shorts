import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, staticFile } from 'remotion';
import { Scene } from './Scene';

/**
 * Main viral short video component
 */
export const ViralShort = ({ scriptData }) => {
  const { fps } = useVideoConfig();

  // Calculate total duration in frames
  const totalDurationMs = scriptData.timeline.total_duration_ms;
  const totalFrames = Math.ceil((totalDurationMs / 1000) * fps);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000000',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {scriptData.scenes.map((scene) => {
        // Calculate frame positions
        const startFrame = Math.floor((scene.start_time_ms / 1000) * fps);
        const durationFrames = Math.ceil((scene.duration_ms / 1000) * fps);

        // Build asset paths using staticFile()
        const shortId = String(scriptData.short_id).padStart(3, '0');
        const sceneNum = scene.scene_number;

        const audioPath = scene.audio?.narration_text
          ? staticFile(`data/assets/audio/short_${shortId}_scene_${sceneNum}.mp3`)
          : null;

        const imagePath = scene.visuals?.image_needed
          ? staticFile(`data/assets/images/short_${shortId}_scene_${sceneNum}.jpg`)
          : null;

        return (
          <Sequence
            key={`scene-${scene.scene_number}`}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            <Scene
              sceneData={scene}
              audioPath={audioPath}
              imagePath={imagePath}
              fps={fps}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export default ViralShort;
