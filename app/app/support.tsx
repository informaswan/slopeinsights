import React from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { LegalPage } from '../components/LegalPage';
import { openExternalLink } from '../lib/openExternalLink';
import { useTheme } from '../contexts/ThemeContext';
import { CONTACT_EMAIL, COMPANY_NAME } from '../constants/links';

export default function SupportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const link = { color: colors.epic, fontWeight: '700' as const };

  return (
    <LegalPage
      title="Support"
      sections={[
        {
          heading: 'Get help',
          body: (
            <>
              Email{' '}
              <Text style={link} onPress={() => openExternalLink(`mailto:${CONTACT_EMAIL}`)}>
                {CONTACT_EMAIL}
              </Text>{' '}
              or use the{' '}
              <Text style={link} onPress={() => router.push('/feedback')}>
                feedback form
              </Text>{' '}
              to report a problem, wrong conditions or a missing mountain.
            </>
          ),
        },
        {
          heading: 'About the data',
          body: 'Conditions come from resort feeds and the National Weather Service and can lag or be wrong. A camera that is offline is hidden. Always check with the resort before you go, especially for lift status and road conditions.',
        },
        {
          heading: 'Who makes SlopeInsights',
          body: `${COMPANY_NAME}.`,
        },
      ]}
    />
  );
}
