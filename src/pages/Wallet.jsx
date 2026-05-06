import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import QuickActionsView from '../components/wallet/QuickActionsView';
import ReceiveView from '../components/wallet/ReceiveView';
import SendView from '../components/wallet/SendView';
import SwapView from '../components/wallet/SwapView';

const variants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const Wallet = () => {
  const [view, setView] = useState('quick');
  const [direction, setDirection] = useState(1);

  const navigate = (nextView) => {
    setDirection(1);
    setView(nextView);
  };

  const goBack = () => {
    setDirection(-1);
    setView('quick');
  };

  const renderView = () => {
    switch (view) {
      case 'send':
        return <SendView goBack={goBack} />;
      case 'receive':
        return <ReceiveView goBack={goBack} />;
      case 'swap':
        return <SwapView goBack={goBack} />;
      default:
        return <QuickActionsView navigate={navigate} />;
    
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-black text-white">
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={view}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, { offset }) => {
            if (offset.x > 100) {
              goBack();
            }
          }}
          className="h-full w-full"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
