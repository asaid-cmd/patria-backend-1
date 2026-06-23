/**
 * Loyalty rules — aligned with Flutter app.
 * Redeem: 10 points = 1 EGP  (each point = 0.10 EGP discount)
 * Earn:   1 point per 10 EGP spent (credited when order → Delivered)
 */

const EGP_PER_POINT_REDEEM      = 0.1;  // 10 pts = 1 EGP
const POINTS_PER_EGP_REDEEM     = 10;   // display label
const EGP_SPENT_PER_POINT_EARNED = 10;  // 1 pt per 10 EGP
const MIN_REDEEM_POINTS          = 50;  // minimum to redeem in one order

function redeemDiscountEgp(points) {
  const p = Math.max(0, Math.floor(Number(points) || 0));
  return parseFloat((p * EGP_PER_POINT_REDEEM).toFixed(2));
}

function computePointsEarned(orderTotalEgp) {
  const t = Math.max(0, Number(orderTotalEgp) || 0);
  return Math.floor(t / EGP_SPENT_PER_POINT_EARNED);
}

function maxRedeemablePoints(balance, orderTotalBeforePointsDiscount) {
  const b   = Math.max(0, Math.floor(Number(balance) || 0));
  const cap = Math.max(0, Number(orderTotalBeforePointsDiscount) || 0);
  const byTotal = Math.ceil(cap / EGP_PER_POINT_REDEEM - 1e-9);
  return Math.min(b, byTotal);
}

function autoTier(loyaltyPoints) {
  if (loyaltyPoints >= 2000) return 'Gold';
  if (loyaltyPoints >= 500)  return 'Silver';
  return 'Bronze';
}

module.exports = {
  EGP_PER_POINT_REDEEM,
  POINTS_PER_EGP_REDEEM,
  EGP_SPENT_PER_POINT_EARNED,
  MIN_REDEEM_POINTS,
  redeemDiscountEgp,
  computePointsEarned,
  maxRedeemablePoints,
  autoTier,
};
