import React, { createRef } from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { FilterSheet } from '../../components/FilterSheet';
import type { FilterState } from '../../components/FilterSheet';
import { TestWrapper } from '../test-utils';

const defaultFilter: FilterState = { selectedRegions: new Set<string>(), sort: 'snow' };

// The sheet is a pop-up: it stays hidden until the Filter button calls ref.expand().
function renderSheet(props: { onApply?: jest.Mock; filteredCount?: number; opened?: boolean } = {}) {
  const ref = createRef<any>();
  const onApply = props.onApply ?? jest.fn();
  const utils = render(
    <FilterSheet ref={ref} filterState={defaultFilter} onApply={onApply} filteredCount={props.filteredCount ?? 10} />,
    { wrapper: TestWrapper },
  );
  if (props.opened !== false) act(() => { ref.current.expand(); });
  return { ...utils, ref, onApply };
}

it('is hidden until it is opened, and opens when asked to', () => {
  const { queryByText, ref } = renderSheet({ opened: false });
  expect(queryByText('Most fresh snow')).toBeNull();
  act(() => { ref.current.expand(); });
  expect(queryByText('Most fresh snow')).toBeTruthy();
});

it('renders sort options', () => {
  const { getByText, queryByText } = renderSheet();
  expect(getByText('Most fresh snow')).toBeTruthy();
  expect(getByText('Deepest base')).toBeTruthy();
  expect(queryByText('Least crowded')).toBeNull();
  expect(queryByText('Most lifts open')).toBeNull();
});

it('renders all 9 region options', () => {
  const { getByText } = renderSheet();
  for (const r of ['Colorado', 'Utah', 'California', 'Wyoming', 'Pacific NW', 'Northeast', 'Montana / Idaho', 'Canada', 'Other US']) {
    expect(getByText(r)).toBeTruthy();
  }
});

it('renders apply button with resort count', () => {
  const { getByText } = renderSheet({ filteredCount: 23 });
  expect(getByText('Show 23 Resorts')).toBeTruthy();
});

it('calls onApply when apply button is pressed, then closes', () => {
  const { getByText, queryByText, onApply } = renderSheet();
  fireEvent.press(getByText('Show 10 Resorts'));
  expect(onApply).toHaveBeenCalledWith(defaultFilter);
  expect(queryByText('Most fresh snow')).toBeNull();
});

it('toggles a region when tapped', () => {
  const { getByText, onApply } = renderSheet();
  fireEvent.press(getByText('Colorado'));
  fireEvent.press(getByText('Show 10 Resorts'));
  const appliedState: FilterState = onApply.mock.calls[0][0];
  expect(appliedState.selectedRegions.has('Colorado')).toBe(true);
});

it('closes without applying', () => {
  const { getByText, queryByText, onApply } = renderSheet();
  fireEvent.press(getByText('Close'));
  expect(queryByText('Most fresh snow')).toBeNull();
  expect(onApply).not.toHaveBeenCalled();
});
