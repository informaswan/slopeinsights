import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn() })),
  Stack: { Screen: () => null },
}));
const originalEnv = process.env;
beforeEach(() => { jest.resetModules(); process.env = { ...originalEnv }; AsyncStorage.clear(); });
afterAll(() => { process.env = originalEnv; });

describe('checkPurchased', () => {
  it('returns false when no purchase key exists', async () => {
    const { checkPurchased } = require('../../app/paywall');
    await expect(checkPurchased()).resolves.toBe(false);
  });

  it('returns true after markPurchased is called', async () => {
    const { checkPurchased, markPurchased } = require('../../app/paywall');
    await markPurchased();
    await expect(checkPurchased()).resolves.toBe(true);
  });

  it('returns true when EXPO_PUBLIC_SKIP_PAYWALL is "true"', async () => {
    process.env.EXPO_PUBLIC_SKIP_PAYWALL = 'true';
    const { checkPurchased } = require('../../app/paywall');
    await expect(checkPurchased()).resolves.toBe(true);
  });
});

describe('Paywall screen', () => {
  it('renders app name, tagline, unlock button, and fine print', () => {
    const PaywallScreen = require('../../app/paywall').default;
    render(<PaywallScreen />);
    expect(screen.getByText('PowderPass')).toBeTruthy();
    expect(screen.getByText('45 Epic & Ikon resorts — snow, lifts, crowds, cams')).toBeTruthy();
    expect(screen.getByText('Unlock Full Access — $4.99')).toBeTruthy();
    expect(screen.getByText('One-time purchase. No subscription.')).toBeTruthy();
  });

  it('calls markPurchased and navigates to / when unlock button is pressed', async () => {
    const mockReplace = jest.fn();
    const { useRouter } = require('expo-router');
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    const PaywallScreen = require('../../app/paywall').default;
    render(<PaywallScreen />);
    await act(async () => { fireEvent.press(screen.getByText('Unlock Full Access — $4.99')); });
    expect(await AsyncStorage.getItem('powderpass_purchased')).toBe('true');
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
