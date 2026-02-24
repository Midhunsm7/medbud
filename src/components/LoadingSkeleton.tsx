'use client';

import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  type?: 'card' | 'form' | 'list';
  count?: number;
}

export default function LoadingSkeleton({ type = 'card', count = 3 }: LoadingSkeletonProps) {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded-lg skeleton w-3/4" />
                <div className="h-4 bg-gray-200 rounded-full skeleton w-20" />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded-lg skeleton w-1/2" />
              <div className="h-4 bg-gray-200 rounded-lg skeleton w-1/3" />
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100">
              <div className="h-3 bg-gray-200 rounded skeleton w-1/4" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'form') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-200 rounded-lg skeleton w-1/3" />
            <div className="h-4 bg-gray-200 rounded skeleton w-1/2" />
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded skeleton w-1/4" />
              <div className="h-12 bg-gray-200 rounded-xl skeleton" />
            </div>
          ))}
          <div className="md:col-span-2 space-y-2">
            <div className="h-4 bg-gray-200 rounded skeleton w-1/4" />
            <div className="h-24 bg-gray-200 rounded-xl skeleton" />
          </div>
        </div>

        {/* Button */}
        <div className="h-14 bg-gray-200 rounded-xl skeleton" />
      </motion.div>
    );
  }

  // List type
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gray-200 rounded-lg skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded skeleton w-3/4" />
            <div className="h-3 bg-gray-200 rounded skeleton w-1/2" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Made with Bob
