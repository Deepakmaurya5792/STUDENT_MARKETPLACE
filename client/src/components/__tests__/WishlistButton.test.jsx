import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import WishlistButton from '../../components/WishlistButton';
import api from '../../services/api';

jest.mock('../../services/api');

describe('WishlistButton', () => {
  const listingId = 'test-id';
  const onToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders and toggles from not in wishlist to in wishlist', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    const { getByRole } = render(
      <WishlistButton listingId={listingId} initialInWishlist={false} onToggle={onToggle} />
    );
    const button = getByRole('button');
    fireEvent.click(button);
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(`/wishlist/${listingId}`));
    expect(onToggle).toHaveBeenCalledWith(true, listingId);
  });

  test('removes from wishlist when already added', async () => {
    api.delete.mockResolvedValue({ data: { success: true } });
    const { getByRole } = render(
      <WishlistButton listingId={listingId} initialInWishlist={true} onToggle={onToggle} />
    );
    const button = getByRole('button');
    fireEvent.click(button);
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith(`/wishlist/${listingId}`));
    expect(onToggle).toHaveBeenCalledWith(false, listingId);
  });
});
