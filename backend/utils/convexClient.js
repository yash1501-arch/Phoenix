const axios = require('axios');
const logger = require('./logger');

let instance = null;
let lastEnvKey = null;

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

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Convex ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    instance = this;
    lastEnvKey = `${url}|${apiKey}`;
  }

  static resetInstance() {
    instance = null;
    lastEnvKey = null;
  }

  getFunctionType(functionPath) {
    const path = functionPath.toLowerCase();
    if (path.includes('getall') || path.includes('getby') || path.includes('getdashboard')) return 'query';
    if (path.includes('create') || path.includes('update') || path.includes('remove') || path.includes('delete')) return 'mutation';
    return path.includes('get') ? 'query' : 'mutation';
  }

  async callFunction(functionPath, args = {}) {
    try {
      const type = this.getFunctionType(functionPath);
      const endpoint = type === 'query' ? '/api/query' : '/api/mutation';

      const response = await this.client.post(endpoint, {
        path: functionPath,
        args: args,
        format: 'json',
      });

      if (response.data.status === 'success') {
        return response.data.value;
      } else if (response.data.status === 'error') {
        throw new Error(response.data.errorMessage || 'Unknown error from Convex');
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        logger.error(`Auth error for Convex function ${functionPath}. Verify admin key.`);
      } else if (error.response?.status === 404) {
        logger.error(`Function not found: ${functionPath}.`);
      } else if (error.response?.status === 400) {
        logger.error(`Bad request for Convex function ${functionPath}:`, error.response?.data?.message);
      }

      if (!error.message?.includes('Convex function')) {
        logger.error(`Error calling Convex function ${functionPath}:`, error.response?.data || error.message);
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
  async deleteUser(id) { return this.callFunction('users:remove', { id }); }
  async getBookings(filters = {}) { return this.callFunction('bookings:getAll', filters); }
  async getBookingsByUser(userId) { return this.callFunction('bookings:getByUser', { userId }); }
  async createBooking(data) { return this.callFunction('bookings:create', data); }
  async updateBooking(id, data) { return this.callFunction('bookings:update', { id, ...data }); }
  async getBookingById(id) { return this.callFunction('bookings:getById', { id }); }
  async updateBookingStatus(id, status) { return this.callFunction('bookings:update', { id, status }); }
  async getDashboardStats() { return this.callFunction('adventures:getDashboardStats', {}); }

  async createPayment(data) { return this.callFunction('payments:create', data); }
  async getPaymentsByBookingId(bookingId) { return this.callFunction('payments:getByBookingId', { booking_id: bookingId }); }
  async updatePaymentStatus(id, status) { return this.callFunction('payments:updateStatus', { id, status }); }

  // Reviews
  async addReview(data) { return this.callFunction('reviews:add', data); }
  async getReviewsForAdventure(adventureId, opts = {}) { return this.callFunction('reviews:getByAdventure', { adventure_id: adventureId, ...opts }); }
  async getReviewsByUser(userId) { return this.callFunction('reviews:getByUser', { user_id: userId }); }
  async getReviewSummary(adventureId) { return this.callFunction('reviews:getRatingSummary', { adventure_id: adventureId }); }
  async approveReview(id) { return this.callFunction('reviews:approve', { id }); }
  async deleteReview(id) { return this.callFunction('reviews:remove', { id }); }

  // Wishlist
  async addToWishlist(userId, adventureId) { return this.callFunction('wishlist:add', { user_id: userId, adventure_id: adventureId }); }
  async removeFromWishlist(userId, adventureId) { return this.callFunction('wishlist:remove', { user_id: userId, adventure_id: adventureId }); }
  async getWishlistByUser(userId) { return this.callFunction('wishlist:getByUser', { user_id: userId }); }
  async isWishlisted(userId, adventureId) { return this.callFunction('wishlist:isWishlisted', { user_id: userId, adventure_id: adventureId }); }

  // Newsletter
  async subscribeNewsletter(email) { return this.callFunction('newsletter:subscribe', { email }); }
  async unsubscribeNewsletter(email) { return this.callFunction('newsletter:unsubscribe', { email }); }
  async getNewsletterSubscribers() { return this.callFunction('newsletter:getAll', {}); }

  // Audit log
  async listAuditLog(opts = {}) { return this.callFunction('auditLog:list', opts); }

  // Settings
  async getSettings() { return this.callFunction('settings:getAll', {}); }
  async setSetting(key, value) { return this.callFunction('settings:set', { key, value }); }
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
