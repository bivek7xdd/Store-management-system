import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface PremiumEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function PremiumEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: PremiumEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-8">
        {/* Animated Background Glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-primary/30 blur-[40px] rounded-full"
        />
        
        {/* Layered 3D Icon Effect */}
        <div className="relative flex items-center justify-center w-24 h-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1.1, x: 8, y: 8 }}
            className="absolute"
          >
            <Icon size={72} className="text-primary" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.2, scale: 1.05, x: 4, y: 4 }}
            className="absolute"
          >
            <Icon size={72} className="text-primary" />
          </motion.div>
          
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative z-10"
          >
            <Icon size={72} className="text-primary drop-shadow-2xl" strokeWidth={1.5} />
          </motion.div>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
          {title}
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto leading-relaxed mb-8">
          {description}
        </p>
        
        {action && (
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {action}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
