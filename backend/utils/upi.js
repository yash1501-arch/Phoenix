/**
 * Generate a UPI deep link for manual payments.
 * @param {{ upiId: string, payeeName: string, amount: number, note: string }} params
 */
function generateUpiLink({ upiId, payeeName, amount, note }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

module.exports = { generateUpiLink };
