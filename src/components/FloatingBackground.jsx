import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Heart, Sparkles } from 'lucide-react';

const floatingElements = [
  { icon: MessageCircle, size: 32, top: '20%', left: '15%', delay: 0, duration: 12, rotate: -15, y: -50, x: 30 },
  { icon: Send, size: 28, top: '65%', left: '85%', delay: 1, duration: 15, rotate: 25, y: -60, x: -40 },
  { icon: Heart, size: 36, top: '80%', left: '10%', delay: 2, duration: 14, rotate: 10, y: -40, x: 20 },
  { icon: Sparkles, size: 30, top: '15%', left: '75%', delay: 0.5, duration: 18, rotate: -20, y: -45, x: -25 },
  { icon: MessageCircle, size: 40, top: '45%', left: '5%', delay: 1.5, duration: 16, rotate: 15, y: -35, x: 45 },
];

const FloatingBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {floatingElements.map((el, i) => {
        const Icon = el.icon;
        return (
          <motion.div
            key={i}
            className="absolute flex items-center justify-center p-4 bg-white/40 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(244,114,182,0.3)] border border-white/60"
            style={{ top: el.top, left: el.left, rotate: el.rotate }}
            animate={{
              y: [0, el.y, 0],
              x: [0, el.x, 0],
              rotate: [el.rotate, el.rotate + 15, el.rotate],
            }}
            transition={{
              duration: el.duration,
              delay: el.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Icon className="text-pink-500" size={el.size} strokeWidth={2.5} />
          </motion.div>
        );
      })}
    </div>
  );
};

export default FloatingBackground;
