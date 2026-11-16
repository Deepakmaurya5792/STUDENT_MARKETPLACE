// Jest test suite for wishlistController.js
// Covers addToWishlist, removeFromWishlist, and getWishlist

const WishlistController = require('../wishlistController');
const User = require('../models/User');
const Listing = require('../models/Listing');

// Auto‑mock the Mongoose model files
jest.mock('../models/User');
jest.mock('../models/Listing');

// Helper to create a mock Express response object supporting chaining
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Helper to create a mock request object; overrides let you set params/body/query
const mockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  ...overrides,
});

describe('wishlistController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
  });

  // ---------------------------------------------------------------------
  // addToWishlist
  // ---------------------------------------------------------------------
  describe('addToWishlist', () => {
    // SUCCESS: item added to wishlist
    it('adds a listing to the user wishlist and returns 200', async () => {
      const userId = 'u1';
      const listingId = 'l1';
      const mockUser = {
        _id: userId,
        savedListings: [],
        save: jest.fn().mockResolvedValue(undefined),
      };
      const mockListing = { _id: listingId, status: 'active' };

      User.findById.mockResolvedValue(mockUser);
      Listing.findOne.mockResolvedValue(mockListing);

      req = mockRequest({ params: { listingId }, user: { _id: userId } });

      await WishlistController.addToWishlist(req, res);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $addToSet: { savedListings: listingId } },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    // VALIDATION: invalid ObjectId format
    it('returns 400 for an invalid listing ID format', async () => {
      req = mockRequest({ params: { listingId: 'invalid' }, user: { _id: 'u1' } });
      await WishlistController.addToWishlist(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid listing ID format',
      });
    });

    // LISTING NOT FOUND
    it('returns 404 when the listing does not exist or is inactive', async () => {
      Listing.findOne.mockResolvedValue(null);
      req = mockRequest({ params: { listingId: '60f5a3b2c4d5e6f7890abcde' }, user: { _id: 'u1' } });
      await WishlistController.addToWishlist(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Listing not found or is no longer active',
      });
    });

    // USER NOT FOUND
    it('returns 404 when the user cannot be updated', async () => {
      Listing.findOne.mockResolvedValue({ _id: 'l1', status: 'active' });
      User.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      req = mockRequest({ params: { listingId: 'l1' }, user: { _id: 'u1' } });
      await WishlistController.addToWishlist(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    // DATABASE ERROR
    it('returns 500 on unexpected DB error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      Listing.findOne.mockRejectedValue(new Error('DB failure'));
      req = mockRequest({ params: { listingId: 'l1' }, user: { _id: 'u1' } });
      await WishlistController.addToWishlist(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to add listing to wishlist',
      });
      consoleSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------
  // removeFromWishlist
  // ---------------------------------------------------------------------
  describe('removeFromWishlist', () => {
    // SUCCESS: removal
    it('removes a listing from the wishlist and returns 200', async () => {
      const userId = 'u1';
      const listingId = 'l1';
      const mockUpdatedUser = { _id: userId, savedListings: [] };
      User.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUpdatedUser),
      });
      req = mockRequest({ params: { listingId }, user: { _id: userId } });
      await WishlistController.removeFromWishlist(req, res);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $pull: { savedListings: listingId } },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    // INVALID ID
    it('returns 400 for an invalid listing ID format', async () => {
      req = mockRequest({ params: { listingId: 'bad' }, user: { _id: 'u1' } });
      await WishlistController.removeFromWishlist(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid listing ID format',
      });
    });

    // USER NOT FOUND
    it('returns 404 when user is not found', async () => {
      User.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      req = mockRequest({ params: { listingId: 'l1' }, user: { _id: 'u1' } });
      await WishlistController.removeFromWishlist(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    // DATABASE ERROR
    it('returns 500 on DB error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      User.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('DB fail')),
      });
      req = mockRequest({ params: { listingId: 'l1' }, user: { _id: 'u1' } });
      await WishlistController.removeFromWishlist(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to remove listing from wishlist',
      });
      consoleSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------
  // getWishlist
  // ---------------------------------------------------------------------
  describe('getWishlist', () => {
    // SUCCESS
    it('returns the user wishlist with count 200', async () => {
      const userId = 'u1';
      const mockUser = { _id: userId, savedListings: [] };
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      });
      req = mockRequest({ params: { userId } });
      await WishlistController.getWishlist(req, res);
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    // USER NOT FOUND
    it('returns 404 when user does not exist', async () => {
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      req = mockRequest({ params: { userId: 'missing' } });
      await WishlistController.getWishlist(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    // DATABASE ERROR
    it('returns 500 on unexpected error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      User.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      req = mockRequest({ params: { userId: 'u1' } });
      await WishlistController.getWishlist(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch wishlist',
      });
      consoleSpy.mockRestore();
    });
  });
});
