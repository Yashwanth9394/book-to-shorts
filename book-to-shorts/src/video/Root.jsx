import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { ViralShort } from './Video';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="viral-short"
        component={ViralShort}
        durationInFrames={1800} // 60 seconds × 30fps (will be overridden by props)
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          scriptData: {
            short_id: 1,
            title: 'Sample Short',
            timeline: {
              total_duration_ms: 60000,
              total_duration_display: '00:01:00'
            },
            scenes: []
          }
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
