const ORDER_STATUSES = ['placed', 'cancelled'];
// There is no payment step, so a placed order is final; reports count only these.
const COMPLETED_STATUS = 'placed';

module.exports = { ORDER_STATUSES, COMPLETED_STATUS };
