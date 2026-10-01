import React from 'react';

interface CameraMotionVisualizerProps {
  motion: string;
  className?: string;
}

export const CameraMotionVisualizer: React.FC<CameraMotionVisualizerProps> = ({ motion, className = '' }) => {
  const getMotionDetails = () => {
    switch (motion) {
      case 'Dynamic Dolly In':
        return {
          title: 'Dolly Push-In',
          desc: 'Camera moves forward along Z-axis toward focal subject, narrowing spatial perception.',
          vector: 'M 50 85 L 50 25 M 35 40 L 50 25 L 65 40',
          speed: '1.2x Dynamic',
        };
      case 'Crane Pan Up':
        return {
          title: 'Jib / Crane Boom Up',
          desc: 'Camera ascends vertically while slightly pitching downward to reveal landscape.',
          vector: 'M 50 80 L 50 20 M 38 35 L 50 20 L 62 35',
          speed: '0.8x Majestic',
        };
      case 'Smooth Orbit 360':
        return {
          title: '360° Orbital Rotation',
          desc: 'Camera revolves around the central subject while maintaining fixed focal distance.',
          vector: 'M 20 50 A 30 20 0 1 1 80 50 A 30 20 0 1 1 20 50 M 75 40 L 82 50 L 70 54',
          speed: '1.0x Orbital',
        };
      case 'Tracking Follow Shot':
        return {
          title: 'Lateral Tracking Shot',
          desc: 'Camera moves parallel to the subject motion, preserving relative velocity and framing.',
          vector: 'M 20 50 L 80 50 M 65 35 L 80 50 L 65 65',
          speed: '1.4x Dynamic',
        };
      case 'High-Speed FPV Drone':
        return {
          title: 'FPV Acrobatic Drone Dive',
          desc: 'High velocity descent with roll and bank curves through architectural/natural obstacles.',
          vector: 'M 15 20 Q 50 80 85 45 M 72 38 L 85 45 L 80 58',
          speed: '2.5x Hyper-Velocity',
        };
      case 'Slow Zoom In':
        return {
          title: 'Optical Zoom Pull',
          desc: 'Lens focal length increases from wide to telephoto without physical camera displacement.',
          vector: 'M 30 30 L 45 45 M 70 30 L 55 45 M 30 70 L 45 55 M 70 70 L 55 55',
          speed: '0.6x Subtle',
        };
      default:
        return {
          title: 'Locked-Off Tripod',
          desc: 'Completely stationary cinematic framing emphasizing internal subject motion.',
          vector: 'M 50 35 L 50 65 M 35 50 L 65 50',
          speed: 'Static Focus',
        };
    }
  };

  const details = getMotionDetails();

  return (
    <div className={`p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 font-medium text-zinc-200">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Camera Trajectory: {details.title}</span>
        </div>
        <span className="text-[11px] text-cyan-400 font-mono">{details.speed}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-14 h-14 shrink-0 rounded-lg bg-black/60 border border-zinc-800/80 flex items-center justify-center p-1">
          <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-400">
            <circle cx="50" cy="50" r="3" fill="currentColor" opacity="0.6" />
            <path
              d={details.vector}
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]"
            />
          </svg>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          {details.desc}
        </p>
      </div>
    </div>
  );
};
