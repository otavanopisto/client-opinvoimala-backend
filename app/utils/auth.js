const isPublic = (roles) => {
  if (!roles) return true;

  const roleTypes = roles.map(({ type }) => type);

  return !roles.length || roleTypes.includes("public");
};

const isUserAllowed = (user, roles) => {
  const roleIds = roles.map(({ id }) => id);

  // Access is public if no roles are set
  if (!roles.length) return true;

  // No user or user has no role -> not allowed
  if (!user?.role) return false;

  // Allowed if user's role match to ones defined in a roles array
  return roleIds.includes(user.role.id);
};

module.exports = {
  isPublic,
  isUserAllowed,
};
