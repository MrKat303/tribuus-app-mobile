import { memo } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { parsePostText } from '@/features/feed/model/postFormatting';
import { typography } from '@/theme/tokens';

export const FormattedPostText = memo(function FormattedPostText({ showMarkers = false, style, value }: {
  showMarkers?: boolean;
  style?: TextStyle | TextStyle[];
  value: string;
}) {
  const segments = parsePostText(value);

  return (
    <AppText style={style}>
      {segments.map((segment, index) => (
        <Text key={`${index}-${segment.text}`}>
          {segment.bold && showMarkers ? <Text style={styles.marker}>*</Text> : null}
          <Text style={segment.bold ? styles.bold : undefined}>{segment.text}</Text>
          {segment.bold && showMarkers ? <Text style={styles.marker}>*</Text> : null}
        </Text>
      ))}
    </AppText>
  );
});

const styles = StyleSheet.create({
  bold: { fontFamily: typography.bodySemiBold, fontWeight: '600' },
  marker: { opacity: 0.42 },
});
