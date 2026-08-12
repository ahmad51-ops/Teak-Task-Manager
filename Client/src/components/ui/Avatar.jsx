import { useState } from "react";

const SIZES = {
  xs: { box: "h-8 w-8", text: "text-xs", dot: "h-2.5 w-2.5" },
  sm: { box: "h-10 w-10", text: "text-sm", dot: "h-3 w-3" },
  md: { box: "h-11 w-11", text: "text-sm", dot: "h-3.5 w-3.5" },
  lg: { box: "h-16 w-16", text: "text-xl", dot: "h-4 w-4" },
  xl: { box: "h-20 w-20", text: "text-2xl", dot: "h-5 w-5" },
};

// One component for every place a person is shown, so avatars can never
// drift out of sync between the navbar, comments, member lists, etc.
// Falls back to a gradient initial when there's no uploaded image —
// and ALSO falls back if the image fails to load (a deleted Cloudinary
// asset or a broken URL would otherwise render as a broken-image icon).
const Avatar = ({ user, size = "sm", showPresence = false, isOnline = false, className = "" }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const s = SIZES[size] ?? SIZES.sm;
  const initial = user?.name?.[0]?.toUpperCase() ?? "U";
  const showImage = user?.avatar && !imgFailed;

  return (
    <div className={`relative shrink-0 ${className}`}>
      {showImage ? (
        <img
          src={user.avatar}
          alt={user.name || "User"}
          onError={() => setImgFailed(true)}
          className={`${s.box} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${s.box} ${s.text} flex items-center justify-center rounded-full bg-gradient-to-br from-violet-neon to-cyan-neon font-semibold text-void`}
          aria-label={user?.name || "User"}
        >
          {initial}
        </div>
      )}

      {showPresence && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${s.dot} rounded-full border-2 border-surface ${
            isOnline ? "bg-cyan-neon shadow-glow-cyan" : "bg-surface-3"
          }`}
          title={isOnline ? "Online now" : "Offline"}
        />
      )}
    </div>
  );
};

export default Avatar;
