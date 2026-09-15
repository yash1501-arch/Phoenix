const { ConvexHttpClient } = require('convex/browser');
const { makeFunctionReference } = require('convex/server');
const logger = require('./logger');

let instance = null;
let lastEnvKey = null;

/**
 * Backend-only Convex access.
 * All Convex functions are internalQuery/internalMutation — public clients cannot call them.
 * CONVEX_ADMIN_KEY (deploy key) is required via setAdminAuth.
 */
class ConvexClient {
  constructor(url, apiKey) {
    if (url === undefined || apiKey === undefined) {
      url = process.env.CONVEX_URL;
      apiKey = process.env.CONVEX_ADMIN_KEY;
    }

    if (instance && lastEnvKey === `${url}|${apiKey}`) return instance;

    if (!url || !apiKey) {
      const err = new Error(
        'Convex client misconfigured: CONVEX_URL and CONVEX_ADMIN_KEY must be set. ' +
        'Ensure backend/.env exists and the backend was started from the backend/ directory.'
      );
      err.code = 'CONVEX_CONFIG_MISSING';
      throw err;
    }

    this.baseUrl = url;
    this.apiKey = apiKey;

    this.http = new ConvexHttpClient(url);
    // Admin/deploy key — required to invoke internal functions
    this.http.setAdminAuth(apiKey);

    instance = this;
    lastEnvKey = `${url}|${apiKey}`;
  }

  static resetInstance() {
    instance = null;
    lastEnvKey = null;
  }

  // Explicit query names — anything not listed here is treated as a mutation.
  static QUERY_NAMES = new Set([
    'adventures:getAll', 'adventures:getById', 'adventures:getDashboardStats',
    'users:getAll', 'users:getById', 'users:getByEmail',
    'reviews:getByAdventure', 'reviews:getByUser', 'reviews:getRatingSummary',
    'wishlist:getByUser', 'wishlist:isWishlisted',
    'newsletter:getAll',
    'auditLog:list',
    'settings:getAll',
    'blog:getAll', 'blog:getPublished', 'blog:getBySlug', 'blog:getById',
    'contact:list',
    'bookings:getById', 'bookings:getByCode', 'bookings:getByUser',
    'bookings:getPaymentDetails', 'bookings:listPendingPayments', 'bookings:listAll',
    'bookings:listDueReminders', 'bookings:validateDiscountCode',
    'dashboard:getOverview',
    'analytics:getVisitStats',
    'waitlist:listWaitingForAdventure',
    'wishlist:getByAdventure',
  ]);

  getFunctionType(functionPath) {
    if (ConvexClient.QUERY_NAMES.has(functionPath)) return 'query';
    const path = functionPath.toLowerCase();
    if (path.includes(':get') || path.includes(':list') || path.includes('iswishlisted')) return 'query';
    return 'mutation';
  }

  async callFunction(functionPath, args = {}) {
    try {
      const type = this.getFunctionType(functionPath);
      // Path stays "module:name" for internal functions; admin auth unlocks them
      const ref = makeFunctionReference(functionPath);

      if (type === 'query') {
        return await this.http.query(ref, args);
      }
      return await this.http.mutation(ref, args);
    } catch (error) {
      const msg = error?.message || String(error);
      if (/auth|unauthorized|admin/i.test(msg)) {
        logger.error(`Auth error for Convex function ${functionPath}. Verify CONVEX_ADMIN_KEY (deploy key).`);
      } else if (/not found|Could not find/i.test(msg)) {
        logger.error(`Function not found: ${functionPath}. Deploy Convex after converting to internal*.`);
      } else {
        logger.error(`Error calling Convex function ${functionPath}:`, msg);
      }
      throw error;
    }
  }

  async getAdventures(filters = {}) { return this.callFunction('adventures:getAll', filters); }
  async getAdventureById(id) { return this.callFunction('adventures:getById', { id }); }
  async createAdventure(data) { return this.callFunction('adventures:create', data); }
  async updateAdventure(id, data) { return this.callFunction('adventures:update', { id, ...data }); }
  async deleteAdventure(id) { return this.callFunction('adventures:remove', { id }); }
  async getUsers(filters = {}) { return this.callFunction('users:getAll', filters); }
  async getUserById(id) { return this.callFunction('users:getById', { id }); }
  async getUserByEmail(email) { return this.callFunction('users:getByEmail', { email }); }
  async createUser(data) { return this.callFunction('users:create', data); }
  async updateUser(id, data) { return this.callFunction('users:update', { id, ...data }); }
  async setUserTotp(id, totp_secret, totp_enabled, totp_recovery_hashes = []) {
    return this.callFunction('users:setTotp', {
      id,
      totp_secret,
      totp_enabled,
      totp_recovery_hashes,
    });
  }
  async clearUserTotp(id) { return this.callFunction('users:clearTotp', { id }); }
  async replaceRecoveryHashes(id, totp_recovery_hashes) {
    return this.callFunction('users:replaceRecoveryHashes', { id, totp_recovery_hashes });
  }
  async deleteUser(id) { return this.callFunction('users:remove', { id }); }
  async getDashboardStats() { return this.callFunction('adventures:getDashboardStats', {}); }
  async getDashboardOverview(opts = {}) { return this.callFunction('dashboard:getOverview', opts); }
  async recordVisit(data) { return this.callFunction('analytics:recordVisit', data); }
  async getVisitStats(days) { return this.callFunction('analytics:getVisitStats', { days }); }

  async addReview(data) { return this.callFunction('reviews:add', data); }
  async getReviewsForAdventure(adventureId, opts = {}) { return this.callFunction('reviews:getByAdventure', { adventure_id: adventureId, ...opts }); }
  async getReviewsByUser(userId) { return this.callFunction('reviews:getByUser', { user_id: userId }); }
  async getReviewSummary(adventureId) { return this.callFunction('reviews:getRatingSummary', { adventure_id: adventureId }); }
  async approveReview(id) { return this.callFunction('reviews:approve', { id }); }
  async deleteReview(id) { return this.callFunction('reviews:remove', { id }); }

  async addToWishlist(userId, adventureId) { return this.callFunction('wishlist:add', { user_id: userId, adventure_id: adventureId }); }
  async removeFromWishlist(userId, adventureId) { return this.callFunction('wishlist:remove', { user_id: userId, adventure_id: adventureId }); }
  async getWishlistByUser(userId) { return this.callFunction('wishlist:getByUser', { user_id: userId }); }
  async isWishlisted(userId, adventureId) { return this.callFunction('wishlist:isWishlisted', { user_id: userId, adventure_id: adventureId }); }

  async subscribeNewsletter(email) { return this.callFunction('newsletter:subscribe', { email }); }
  async unsubscribeNewsletter(email) { return this.callFunction('newsletter:unsubscribe', { email }); }
  async getNewsletterSubscribers() { return this.callFunction('newsletter:getAll', {}); }

  async listAuditLog(opts = {}) { return this.callFunction('auditLog:list', opts); }
  async logAudit(entry) { return this.callFunction('auditLog:log', entry); }

  async joinWaitlist(data) { return this.callFunction('waitlist:join', data); }
  async listWaitlistForAdventure(adventureId) {
    return this.callFunction('waitlist:listWaitingForAdventure', { adventure_id: adventureId });
  }
  async markWaitlistNotified(ids) { return this.callFunction('waitlist:markNotified', { ids }); }
  async getWishlistByAdventure(adventureId) {
    return this.callFunction('wishlist:getByAdventure', { adventure_id: adventureId });
  }
  async recordLoginFailure(id) { return this.callFunction('users:recordLoginFailure', { id }); }
  async clearLoginLock(id) { return this.callFunction('users:clearLoginLock', { id }); }
  async submitBalancePayment(data) { return this.callFunction('bookings:submitBalancePayment', data); }
  async patchDeliveryWarnings(bookingId, warnings) {
    return this.callFunction('bookings:patchDeliveryWarnings', { booking_id: bookingId, warnings });
  }

  async getSettings() { return this.callFunction('settings:getAll', {}); }
  async setSetting(key, value) { return this.callFunction('settings:set', { key, value }); }

  async getBlogPosts(opts = {}) { return this.callFunction('blog:getAll', opts); }
  async getPublishedPosts(opts = {}) { return this.callFunction('blog:getPublished', opts); }
  async getBlogPostBySlug(slug) { return this.callFunction('blog:getBySlug', { slug }); }
  async getBlogPostById(id) { return this.callFunction('blog:getById', { id }); }
  async createBlogPost(data) { return this.callFunction('blog:create', data); }
  async updateBlogPost(id, data) { return this.callFunction('blog:update', { id, ...data }); }
  async deleteBlogPost(id) { return this.callFunction('blog:remove', { id }); }

  async submitContactMessage(data) { return this.callFunction('contact:submit', data); }
  async listContactMessages(opts = {}) { return this.callFunction('contact:list', opts); }
  async setContactMessageStatus(id, status) { return this.callFunction('contact:setStatus', { id, status }); }
  async deleteContactMessage(id) { return this.callFunction('contact:remove', { id }); }

  async validateDiscountCode(code, userId) {
    return this.callFunction('bookings:validateDiscountCode', { code, user_id: userId });
  }
  async createManualBooking(data) { return this.callFunction('bookings:createManual', data); }
  async getBookingById(id) { return this.callFunction('bookings:getById', { id }); }
  async getBookingByCode(code) { return this.callFunction('bookings:getByCode', { booking_code: code }); }
  async getBookingsByUser(userId, email) {
    return this.callFunction('bookings:getByUser', {
      user_id: userId,
      ...(email ? { email: String(email) } : {}),
    });
  }
  async getBookingPaymentDetails(bookingId) { return this.callFunction('bookings:getPaymentDetails', { booking_id: bookingId }); }
  async submitManualPayment(data) { return this.callFunction('bookings:submitPayment', data); }
  async verifyPayment(bookingId, verifiedBy) { return this.callFunction('bookings:verifyPayment', { booking_id: bookingId, verified_by: verifiedBy }); }
  async rejectPayment(bookingId, verifiedBy, reason) { return this.callFunction('bookings:rejectPayment', { booking_id: bookingId, verified_by: verifiedBy, rejection_reason: reason }); }
  async releaseBooking(bookingId, reason) { return this.callFunction('bookings:releaseBooking', { booking_id: bookingId, reason }); }
  async cancelBookingByUser(bookingId, userId, reason) {
    return this.callFunction('bookings:cancelByUser', {
      booking_id: bookingId,
      user_id: userId,
      reason,
    });
  }
  async listPendingPayments() { return this.callFunction('bookings:listPendingPayments', {}); }
  async listAllBookings(status) { return this.callFunction('bookings:listAll', status ? { status } : {}); }
  async getPaymentByBookingId(bookingId) {
    const details = await this.getBookingPaymentDetails(bookingId);
    return details?.payment || null;
  }
}

function getConvexClient() {
  const url = process.env.CONVEX_URL;
  const key = process.env.CONVEX_ADMIN_KEY;
  if (!instance || lastEnvKey !== `${url}|${key}`) {
    new ConvexClient(url, key);
  }
  return instance;
}

module.exports = { ConvexClient, getConvexClient };
