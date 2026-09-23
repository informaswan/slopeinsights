import React, { createRef } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FilterSheet } from '../../components/FilterSheet';
import type { FilterState } from '../../components/FilterSheet';
import { TestWrapper } from '../test-utils';

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  const BottomSheet = React.forwardRef(({ children }: any, _ref: any) => (
    <View testID="bottom-sheet">{children}</View>
  ));
  BottomSheet.displayName = 'BottomSheet';
  return { default: BottomSheet };
});

const defaultFilter: FilterState = { selectedRegions: new Set<string>(), sort: 'snow' };

it('renders sort options', () => {
  const { getByText, queryByText } = render(<FilterSheet ref={createRef()} filterState={defaultFilter} onApply={jest.fn()} filteredCount={10} />, { wrapper: TestWrapper });
  expect(getByText('Most fresh snow')).toBeTruthy();
  expect(getByText('Deepest base')).toBeTruthy();
  expect(queryByText('Least crowded')).toBeNull();
  expect(queryByText('Most lifts open')).toBeNull();
});

it('renders all 9 region options', () => {
  const { getByText } = render(<FilterSheet ref={createRef()} filterState={defaultFilter} onApply={jest.fn()} filteredCount={10} />, { wrapper: TestWrapper });
  expect(getByText('Colorado')).toBeTruthy();
  expect(getByText('Utah')).toBeTruthy();
  expect(getByText('California')).toBeTruthy();
  expect(getByText('Wyoming')).toBeTruthy();
  expect(getByText('Pacific NW')).toBeTruthy();
  expect(getByText('Northeast')).toBeTruthy();
  expect(getByText('Montana / Idaho')).toBeTruthy();
  expect(getByText('Canada')).toBeTruthy();
  expect(getByText('Other US')).toBeTruthy();
});

it('renders apply button with resort count', () => {
  const { getByText } = render(<FilterSheet ref={createRef()} filterState={defaultFilter} onApply={jest.fn()} filteredCount={23} />, { wrapper: TestWrapper });
  expect(getByText('Show 23 Resorts')).toBeTruthy();
});

it('calls onApply when apply button is pressed', () => {
  const onApply = jest.fn();
  const { getByText } = render(<FilterSheet ref={createRef()} filterState={defaultFilter} onApply={onApply} filteredCount={10} />, { wrapper: TestWrapper });
  fireEvent.press(getByText('Show 10 Resorts'));
  expect(onApply).toHaveBeenCalledWith(defaultFilter);
});

it('toggles a region when tapped', () => {
  const onApply = jest.fn();
  const { getByText } = render(<FilterSheet ref={createRef()} filterState={defaultFilter} onApply={onApply} filteredCount={10} />, { wrapper: TestWrapper });
  fireEvent.press(getByText('Colorado'));
  fireEvent.press(getByText('Show 10 Resorts'));
  const appliedState: FilterState = onApply.mock.calls[0][0];
  expect(appliedState.selectedRegions.has('Colorado')).toBe(true);
});
