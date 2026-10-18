import React from 'react';
import { Text } from 'react-native';
import { LegalPage } from '../components/LegalPage';
import { openExternalLink } from '../lib/openExternalLink';
import { useTheme } from '../contexts/ThemeContext';
import { COMPANY_NAME, CONTACT_EMAIL } from '../constants/links';

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const email = (
    <Text style={{ color: colors.epic, fontWeight: '700' }} onPress={() => openExternalLink(`mailto:${CONTACT_EMAIL}`)}>
      {CONTACT_EMAIL}
    </Text>
  );

  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 18, 2026"
      sections={[
        {
          heading: 'Who we are',
          body: `SlopeInsights is operated by ${COMPANY_NAME}. This policy explains what the SlopeInsights app and website (slopeinsights.com) collect and how it is used.`,
        },
        {
          heading: 'No account needed',
          body: 'You can use SlopeInsights without signing up. We do not ask for your name, and the app does not use your location, contacts, camera, microphone or photos.',
        },
        {
          heading: 'What stays on your device',
          body: 'Your favorite mountains, your light or dark theme, and recently viewed conditions are saved on your device or in your browser so the app works faster and shows your last-known data when you have no signal. We do not receive this information, and clearing the app data or browser storage removes it.',
        },
        {
          heading: 'Feedback you send us',
          body: 'If you use the feedback form, we store what you write, the category you pick and, only if you choose to give one, your email address so we can reply. We use it to improve the app and to answer you.',
        },
        {
          heading: 'Server logs',
          body: 'Like most services, our server receives your IP address and basic request details when the app loads conditions. We use this to keep the service running, to limit abuse and to fix problems. We do not use it to identify you or build a profile.',
        },
        {
          heading: 'Third-party data and links',
          body: 'Conditions, forecasts and camera images come from public resort feeds, the National Weather Service and road-camera providers. Camera pictures are loaded through our server. Links to resorts, road-camera sites and donation pages open other websites with their own privacy practices.',
        },
        {
          heading: 'Ads, tracking and sharing',
          body: 'SlopeInsights currently shows no ads and uses no analytics or advertising trackers. We do not sell your information. If that changes, we will update this policy first and ask for consent where the law requires it.',
        },
        {
          heading: 'Children',
          body: 'SlopeInsights is not directed at children under 13, and we do not knowingly collect information from them.',
        },
        {
          heading: 'Your choices',
          body: <>To see or delete feedback you sent us, or ask any privacy question, email {email}. We will respond as soon as we can.</>,
        },
        {
          heading: 'Changes',
          body: 'We may update this policy. The date at the top shows when it last changed.',
        },
      ]}
    />
  );
}
