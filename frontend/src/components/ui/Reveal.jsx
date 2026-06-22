import React from 'react';
import { motion } from 'framer-motion';

// Fast initial acceleration, extremely slow settle-down phase
export const EASE = [0.16, 1, 0.3, 1];

export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 40,
  duration = 1.2,
  scale = 1
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function wrapIntoLines(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function RevealLines({
  text,
  className = '',
  lineClassName = '',
  stagger = 0.08,
  splitBy = 'wrap',
  charsPerLine = 60
}) {
  let lines;

  if (splitBy === 'wrap') {
    lines = wrapIntoLines(text.trim(), charsPerLine);
  } else if (splitBy === 'sentence') {
    lines = text.split(/(?<=[.]) +|(?<=—) +/).filter(l => l.trim().length > 0);
  } else {
    lines = text.split('\n').filter(l => l.trim().length > 0);
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      transition={{ staggerChildren: stagger }}
      className={className}
    >
      {lines.map((line, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.9, ease: EASE }
            }
          }}
          className={`block ${lineClassName}`}
        >
          {line.trim()}
        </motion.span>
      ))}
    </motion.div>
  );
}

export function RevealWords({
  text,
  className = '',
  wordClassName = '',
  stagger = 0.05
}) {
  const words = text.split(' ');

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ staggerChildren: stagger }}
      className={className}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.8, ease: EASE }
            }
          }}
          className={`inline-block mr-[0.3em] ${wordClassName}`}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

export function RevealGroup({
  children,
  className = '',
  stagger = 0.12
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ staggerChildren: stagger }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className = '',
  y = 30
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 1.0, ease: EASE }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
