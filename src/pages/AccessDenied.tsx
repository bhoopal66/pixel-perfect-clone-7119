import React from 'react';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { motion } from 'framer-motion';
import { ShieldX, ArrowLeft, Home, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AccessDeniedProps {
  requiredRole?: string;
  message?: string;
}

export default function AccessDenied({ 
  requiredRole = 'administrator', 
  message = 'You do not have permission to access this page.' 
}: AccessDeniedProps) {
  const navigate = useNavigateOnce();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-destructive/50 shadow-lg">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4 p-4 rounded-full bg-destructive/10"
            >
              <ShieldX className="h-12 w-12 text-destructive" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-destructive">
              403 - Access Denied
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {message}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Required access level:</span>
              </div>
              <p className="font-medium text-foreground capitalize">
                {requiredRole}
              </p>
            </div>

            <div className="text-sm text-muted-foreground text-center">
              If you believe this is an error, please contact your administrator.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate('/')}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
