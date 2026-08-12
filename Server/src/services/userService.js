import { User } from "../models/User.js";
import { Project } from "../models/Project.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary } from "../utils/uploadToCloudinary.js";
import { isUserOnline } from "../sockets/socket.js";

export const getAllUsers = async ({ page = 1, limit = 20, search = "" }) => {
  const query = search ? { $text: { $search: search } } : {};
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }).lean(),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Admin directory view: same list, plus live presence. isOnline comes
// from the in-memory socket map (never persisted — see socket.js), while
// lastSeen is the stored timestamp for anyone currently offline.
export const getAllUsersWithPresence = async ({ page = 1, limit = 20, search = "" }) => {
  const result = await getAllUsers({ page, limit, search });
  return {
    ...result,
    users: result.users.map((user) => {
      // .lean() above means these are plain objects, so the schema's
      // toJSON (which strips password/avatarPublicId) never runs —
      // delete them explicitly instead of leaking them.
      const { password, avatarPublicId, __v, ...safe } = user;
      return { ...safe, isOnline: isUserOnline(user._id) };
    }),
  };
};

// Users who could be added to this project: everyone active who isn't
// already a member (or the owner). Powers the invite dropdown, replacing
// the old "type an email and hope it exists" flow.
export const getInvitableUsers = async (projectId) => {
  const project = await Project.findById(projectId).lean();
  if (!project) throw new ApiError(404, "Project not found");

  const existingIds = [
    project.owner.toString(),
    ...project.members.map((m) => m.user.toString()),
  ];

  const users = await User.find({
    _id: { $nin: existingIds },
    isActive: true,
  })
    .select("name email avatar role")
    .sort({ name: 1 })
    .lean();

  return users;
};

export const updateProfile = async (userId, updates) => {
  const allowedFields = ["name"];
  const payload = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) payload[field] = updates[field];
  }

  const user = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(401, "Current password is incorrect");

  user.password = newPassword;
  await user.save();
  return user;
};

export const updateAvatar = async (userId, { url, publicId }) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const oldPublicId = user.avatarPublicId;

  user.avatar = url;
  user.avatarPublicId = publicId;
  await user.save();

  if (oldPublicId) {
    await deleteFromCloudinary(oldPublicId, "image");
  }

  return user;
};

export const updateUserRole = async (targetUserId, newRole) => {
  const user = await User.findByIdAndUpdate(
    targetUserId,
    { role: newRole },
    { new: true, runValidators: true }
  );
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const deactivateUser = async (targetUserId) => {
  const user = await User.findByIdAndUpdate(
    targetUserId,
    { isActive: false },
    { new: true }
  );
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const reactivateUser = async (targetUserId) => {
  const user = await User.findByIdAndUpdate(
    targetUserId,
    { isActive: true },
    { new: true }
  );
  if (!user) throw new ApiError(404, "User not found");
  return user;
};
