const STAFF_ROLES = ['admin', 'clerk'];
const ALL_ROLES = ['admin', 'clerk', 'user'];

function isAdminRole(role) {
  return role === 'admin';
}

function isClerkRole(role) {
  return role === 'clerk';
}

function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

function isValidRole(role) {
  return ALL_ROLES.includes(role);
}

module.exports = {
  STAFF_ROLES,
  ALL_ROLES,
  isAdminRole,
  isClerkRole,
  isStaffRole,
  isValidRole,
};
