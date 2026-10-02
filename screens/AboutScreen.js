import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const SLIDES = [
  {
    icon: 'shield-checkmark-outline',
    title: 'How Qerity checks your content',
    body: "We look at your content from a few different angles before giving you a result. Here's what each check does.",
  },
  {
    icon: 'document-text-outline',
    title: 'Where the photo came from',
    body: 'Every photo can carry hidden file details about how and where it was made. We check this information for signs that the image may have been edited.',
  },
  {
    icon: 'color-wand-outline',
    title: 'Signs of editing',
    body: 'We look closely at the image itself for patterns that often appear when part of a photo has been changed, like a pasted number or an altered name.',
  },
  {
    icon: 'copy-outline',
    title: 'Matching known scams',
    body: "We compare your image against patterns we've seen before, including images you've checked in the past, to spot repeated scam content.",
  },
  {
    icon: 'business-outline',
    title: 'Lender legality with OJK',
    body: 'If you provide a lender or company name, we check it against the official list of OJK-licensed lending entities.',
  },
  {
    icon: 'information-circle-outline',
    title: 'No single check is proof',
    body: 'None of these checks alone can prove something is fake or genuine. Together, they give you a clearer picture before you decide. Always verify further with OJK when in doubt.',
  },
];

export default function AboutScreen({ onBack }) {
  return (
    <View style={styles.container}>
      <AboutCarousel onBack={onBack} />
    </View>
  );
}

function AboutCarousel({ onBack }) {
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();
  const isLastSlide = activeIndex === SLIDES.length - 1;

  function goToNextSlide() {
    const nextIndex = Math.min(activeIndex + 1, SLIDES.length - 1);
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setActiveIndex(nextIndex);
  }

  function handleScrollEnd(event) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(nextIndex, SLIDES.length - 1)));
  }

  return (
    <View style={styles.carouselArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.titleGroup}>
          <Image source={require('../assets/branding/qerity-icon.png')} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>How it Works</Text>
        </View>
        {!isLastSlide ? (
          <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Skip onboarding">
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerActionSpace} />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(slide) => slide.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Ionicons name={item.icon} size={70} color={theme.accent} style={styles.slideIcon} />
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideBody}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.pagination} accessibilityLabel={`Slide ${activeIndex + 1} of ${SLIDES.length}`}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.title}
              style={[styles.dot, index === activeIndex ? styles.activeDot : styles.inactiveDot]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={isLastSlide ? onBack : goToNextSlide}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? 'Got it' : 'Next'}
        >
          <Text style={styles.nextButtonText}>{isLastSlide ? 'Got it' : 'Next'}</Text>
          {!isLastSlide && <Ionicons name="arrow-forward-outline" size={18} color={theme.surface} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  back: { color: theme.accent, fontSize: 14 },
  skip: { color: theme.accent, fontSize: 14, fontWeight: '600' },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { width: 26, height: 26, borderRadius: 7 },
  headerTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
  headerActionSpace: { width: 60 },
  carouselArea: { flex: 1 },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  slideIcon: { marginBottom: 28 },
  slideTitle: {
    color: theme.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    textAlign: 'center',
  },
  slideBody: {
    color: theme.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 16,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: 20, paddingBottom: 28 },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: { borderRadius: 4, height: 8, width: 8 },
  activeDot: { backgroundColor: theme.accent, width: 20 },
  inactiveDot: { backgroundColor: theme.border },
  nextButton: {
    alignItems: 'center',
    backgroundColor: theme.accent,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  nextButtonText: { color: theme.surface, fontSize: 15, fontWeight: '700' },
});
