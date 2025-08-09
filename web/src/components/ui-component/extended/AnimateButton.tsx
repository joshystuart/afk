import React, { forwardRef } from 'react';
import { motion, useCycle } from 'framer-motion';

interface AnimateButtonProps {
  children: React.ReactNode;
  type?: 'slide' | 'scale' | 'rotate';
  direction?: 'up' | 'down' | 'left' | 'right';
  offset?: number;
  scale?: number | { hover?: number; tap?: number };
  [key: string]: any;
}

const AnimateButton = forwardRef<HTMLDivElement, AnimateButtonProps>(
  ({ children, type = 'scale', direction = 'right', offset = 10, scale = { hover: 1, tap: 0.9 }, ...others }, ref) => {
    let offset1: number;
    let offset2: number;
    switch (direction) {
      case 'up':
      case 'left':
        offset1 = offset;
        offset2 = 0;
        break;
      case 'right':
      case 'down':
      default:
        offset1 = 0;
        offset2 = offset;
        break;
    }

    const [x, cycleX] = useCycle(offset1, offset2);
    const [y, cycleY] = useCycle(offset1, offset2);

    const hoverScale = typeof scale === 'number' ? scale : scale?.hover || 1;
    const tapScale = typeof scale === 'number' ? scale * 0.9 : scale?.tap || 0.9;

    switch (type) {
      case 'rotate':
        return (
          <motion.div
            ref={ref}
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              repeatType: 'loop',
              duration: 2,
              repeatDelay: 0
            }}
            {...others}
          >
            {children}
          </motion.div>
        );
      case 'slide':
        if (direction === 'up' || direction === 'down') {
          return (
            <motion.div
              ref={ref}
              animate={{ y: y !== undefined ? y : '' }}
              onHoverStart={() => cycleY()}
              onHoverEnd={() => cycleY()}
              {...others}
            >
              {children}
            </motion.div>
          );
        }
        return (
          <motion.div
            ref={ref}
            animate={{ x: x !== undefined ? x : '' }}
            onHoverStart={() => cycleX()}
            onHoverEnd={() => cycleX()}
            {...others}
          >
            {children}
          </motion.div>
        );

      case 'scale':
      default:
        return (
          <motion.div
            ref={ref}
            whileHover={{ scale: hoverScale }}
            whileTap={{ scale: tapScale }}
            {...others}
          >
            {children}
          </motion.div>
        );
    }
  }
);

AnimateButton.displayName = 'AnimateButton';

export default AnimateButton;