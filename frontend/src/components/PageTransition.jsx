import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98
  }
};

const pageTransition = {
  type: 'spring',
  stiffness: 260,
  damping: 25,
  duration: 0.35
};

const PageTransition = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Smaller motion for modals/panels
export const ModalMotion = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 30 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9, y: 30 }}
    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    className={className}
  >
    {children}
  </motion.div>
);

// Staggered list for room cards etc.
export const StaggeredList = ({ children, className = '' }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: 0.08 } }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggeredItem = ({ children, className = '' }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Slide from right (for sidebars/panels)
export const SlideRight = ({ children, className = '' }) => (
  <motion.div
    initial={{ x: 80, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 80, opacity: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    className={className}
  >
    {children}
  </motion.div>
);

export default PageTransition;
