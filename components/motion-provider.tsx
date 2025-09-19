"use client";

import { domAnimation, LazyMotion } from "motion/react";

export const MotionProvider = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
};
