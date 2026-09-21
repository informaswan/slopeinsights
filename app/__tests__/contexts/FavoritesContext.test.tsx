import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavoritesProvider, useFavorites } from '../../contexts/FavoritesContext';

const KEY = 'slopeinsights_favorites';

function Probe() {
  const { favoriteIds, isLoaded, toggleFavorite } = useFavorites();
  return (
    <>
      <Text testID="loaded">{String(isLoaded)}</Text>
      <Text testID="ids">{favoriteIds.join(',')}</Text>
      <Pressable testID="toggle-vail" onPress={() => toggleFavorite('vail')}>
        <Text>toggle</Text>
      </Pressable>
    </>
  );
}

function renderProbe() {
  return render(<FavoritesProvider><Probe /></FavoritesProvider>);
}

beforeEach(() => AsyncStorage.clear());

it('starts empty and reports loaded once storage has been read', async () => {
  const { getByTestId } = renderProbe();
  await waitFor(() => expect(getByTestId('loaded').props.children).toBe('true'));
  expect(getByTestId('ids').props.children).toBe('');
});

it('restores favorites saved on a previous visit', async () => {
  await AsyncStorage.setItem(KEY, JSON.stringify(['vail', 'mammoth']));
  const { getByTestId } = renderProbe();
  await waitFor(() => expect(getByTestId('ids').props.children).toBe('vail,mammoth'));
});

it('adds a favorite and persists it to the device', async () => {
  const { getByTestId } = renderProbe();
  await waitFor(() => expect(getByTestId('loaded').props.children).toBe('true'));
  fireEvent.press(getByTestId('toggle-vail'));
  await waitFor(() => expect(getByTestId('ids').props.children).toBe('vail'));
  expect(JSON.parse((await AsyncStorage.getItem(KEY))!)).toEqual(['vail']);
});

it('removes a favorite that is already saved', async () => {
  await AsyncStorage.setItem(KEY, JSON.stringify(['vail', 'mammoth']));
  const { getByTestId } = renderProbe();
  await waitFor(() => expect(getByTestId('ids').props.children).toBe('vail,mammoth'));
  fireEvent.press(getByTestId('toggle-vail'));
  await waitFor(() => expect(getByTestId('ids').props.children).toBe('mammoth'));
  expect(JSON.parse((await AsyncStorage.getItem(KEY))!)).toEqual(['mammoth']);
});

it('ignores corrupt stored data instead of crashing', async () => {
  await AsyncStorage.setItem(KEY, 'not json');
  const { getByTestId } = renderProbe();
  await waitFor(() => expect(getByTestId('loaded').props.children).toBe('true'));
  expect(getByTestId('ids').props.children).toBe('');
});
