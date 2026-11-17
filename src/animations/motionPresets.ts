import type { Transition, Variants } from 'motion/react';

export const EASE_SMOOTH: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const PAGE_TRANSITION: Transition = {
  duration: 0.32,
  ease: EASE_SMOOTH,
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: PAGE_TRANSITION },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease: EASE_SMOOTH } },
};

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
};

export const cardEntranceVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: EASE_SMOOTH },
  },
};

export const drawerVariants: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.24, ease: EASE_SMOOTH } },
  exit: { opacity: 0, x: 24, transition: { duration: 0.18, ease: EASE_SMOOTH } },
};
