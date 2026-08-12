import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      // Conditional: Google-authenticated accounts have no password at
      // all, and requiring one unconditionally would make it impossible
      // to create them. `this.googleId` is checked rather than a flag
      // so there's a single source of truth for "is this a Google user".
      required: [
        function () {
          return !this.googleId;
        },
        "Password is required",
      ],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    // Google's stable user identifier ("sub" in the ID token). Sparse
    // unique index: unique among accounts that HAVE one, while allowing
    // any number of password-only accounts where it's absent. A plain
    // unique index would reject the second null.
    googleId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    avatarPublicId: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "manager", "member"],
        message: "{VALUE} is not a valid role",
      },
      default: "member",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Google accounts skip this entirely (Google already confirmed
    // ownership of the email — see loginWithGoogle) — it only gates
    // password signups, and only when EMAIL_USER/EMAIL_APP_PASSWORD are
    // configured (isEmailVerificationEnabled in env.js). Unverified
    // accounts can't log in (see authService.loginUser).
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Hashed, never the raw code — same reasoning as storing a hashed
    // password: a DB leak shouldn't hand out valid verification codes.
    emailVerificationCodeHash: {
      type: String,
      select: false,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
      default: null,
    },
    // Presence: written on socket disconnect (see sockets/socket.js).
    // "Currently online" is tracked in memory rather than here — writing
    // to Mongo on every connect would be a pointless write, and a stale
    // "online: true" left behind by a crashed server would be worse than
    // no data at all. This field only answers "when were they last here?"
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.index({ name: "text", email: "text" });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.avatarPublicId;
  delete obj.__v;
  // The raw googleId is an internal identifier the client has no use
  // for — but whether an account IS a Google account is genuinely
  // useful (the Profile page hides the change-password form for them),
  // so expose that as a boolean instead of leaking the ID.
  obj.isGoogleAccount = Boolean(obj.googleId);
  delete obj.googleId;
  return obj;
};

export const User = mongoose.model("User", userSchema);
