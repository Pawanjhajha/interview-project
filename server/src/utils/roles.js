const ROLES = ['customer', 'merchant'];
const DEFAULT_ROLE = 'customer';
// Every current role may be chosen at registration. Privileged roles added later must stay out of this list.
const SELF_SERVICE_ROLES = ROLES;

module.exports = { ROLES, DEFAULT_ROLE, SELF_SERVICE_ROLES };
