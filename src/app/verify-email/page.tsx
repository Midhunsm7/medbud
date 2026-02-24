'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabase';
import { pageVariants, buttonVariants } from '@/lib/animations';
import { toast } from 'react-hot-toast';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    // Check if user is already verified
    const checkVerification = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/reminders');
      }
    };
    checkVerification();
  }, [router]);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      
      setResent(true);
      toast.success('Verification email resent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4"
    >
      <div className="max-w-md w-full">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center mb-8"
        >
          <div className="inline-flex p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-2xl mb-6">
            <Mail className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Check Your Email
          </h1>
          
          {email && (
            <p className="text-gray-600 mb-6">
              We've sent a verification link to:
              <br />
              <span className="font-semibold text-blue-600">{email}</span>
            </p>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3 text-left">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Check your email inbox</li>
                  <li>Click the verification link</li>
                  <li>You'll be redirected to sign in</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Go to Sign In
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            {email && (
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleResendEmail}
                disabled={resending || resent}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <RefreshCw className="w-5 h-5" />
                    </motion.div>
                    Resending...
                  </>
                ) : resent ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Email Resent!
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Resend Verification Email
                  </>
                )}
              </motion.button>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or try resending.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="mailto:support@medireminder.com" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Support
            </a>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

// Made with Bob
