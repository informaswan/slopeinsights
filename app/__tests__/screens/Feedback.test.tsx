import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('../../contexts/ThemeContext', () => {
  const { LightColors } = require('../../constants/theme');
  return { useTheme: () => ({ colors: LightColors, isDark: false, toggleTheme: jest.fn() }) };
});
const mockSend = jest.fn();
jest.mock('../../lib/api', () => ({ api: { sendFeedback: (...a: any[]) => mockSend(...a) } }));

function renderScreen() {
  const Feedback = require('../../app/feedback').default;
  return render(<Feedback />);
}

beforeEach(() => mockSend.mockReset());

it('will not send until there is a real message', () => {
  const { getByLabelText } = renderScreen();
  fireEvent.press(getByLabelText('Send feedback'));
  expect(mockSend).not.toHaveBeenCalled();
  fireEvent.changeText(getByLabelText('Your feedback'), 'hi');
  fireEvent.press(getByLabelText('Send feedback'));
  expect(mockSend).not.toHaveBeenCalled();
});

it('sends the category, message and optional email, then thanks the person', async () => {
  mockSend.mockResolvedValue({ ok: true });
  const { getByLabelText, findByText } = renderScreen();
  fireEvent.press(getByLabelText('Category: Wrong data'));
  fireEvent.changeText(getByLabelText('Your feedback'), '  Winter Park base looks off  ');
  fireEvent.changeText(getByLabelText('Your email (optional)'), 'me@example.com');
  fireEvent.press(getByLabelText('Send feedback'));
  expect(await findByText('Thanks, we got it')).toBeTruthy();
  expect(mockSend).toHaveBeenCalledWith({
    category: 'data', message: 'Winter Park base looks off', email: 'me@example.com', website: '',
  });
});

it('leaves the email out when it is blank', async () => {
  mockSend.mockResolvedValue({ ok: true });
  const { getByLabelText, findByText } = renderScreen();
  fireEvent.changeText(getByLabelText('Your feedback'), 'Please add Alta snow');
  fireEvent.press(getByLabelText('Send feedback'));
  await findByText('Thanks, we got it');
  expect(mockSend.mock.calls[0][0].email).toBeUndefined();
});

it('keeps what was typed and says so when sending fails', async () => {
  mockSend.mockRejectedValue(new Error('boom'));
  const { getByLabelText, findByText } = renderScreen();
  fireEvent.changeText(getByLabelText('Your feedback'), 'Please add Alta snow');
  fireEvent.press(getByLabelText('Send feedback'));
  expect(await findByText(/Couldn't send that/)).toBeTruthy();
  expect(getByLabelText('Your feedback').props.value).toBe('Please add Alta snow');
});

it('explains a rate-limit response differently', async () => {
  mockSend.mockRejectedValue(Object.assign(new Error('429'), { status: 429 }));
  const { getByLabelText, findByText } = renderScreen();
  fireEvent.changeText(getByLabelText('Your feedback'), 'Please add Alta snow');
  fireEvent.press(getByLabelText('Send feedback'));
  expect(await findByText(/sent a few already/)).toBeTruthy();
});

it('can send another after a success', async () => {
  mockSend.mockResolvedValue({ ok: true });
  const { getByLabelText, findByText } = renderScreen();
  fireEvent.changeText(getByLabelText('Your feedback'), 'Please add Alta snow');
  fireEvent.press(getByLabelText('Send feedback'));
  await findByText('Thanks, we got it');
  fireEvent.press(getByLabelText('Send more feedback'));
  await waitFor(() => expect(getByLabelText('Your feedback')).toBeTruthy());
});
