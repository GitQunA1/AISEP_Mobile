import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import subscriptionService from '../services/subscriptionService';
import paymentService from '../services/paymentService';
import startupProfileService from '../services/startupProfileService';
import { useAuth } from './AuthContext';

/**
 * SubscriptionContext
 * Cung cấp dữ liệu quota và trạng thái gói đăng ký của Startup/Investor
 * trên toàn ứng dụng, tránh fetch nhiều lần ở các màn hình khác nhau.
 */
const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [packages, setPackages] = useState([]);
  const [startupProfile, setStartupProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  const isStartup = user &&
    (String(user.role).toLowerCase() === 'startup' || user.role === 0);
  const isInvestor = user &&
    (String(user.role).toLowerCase() === 'investor' || user.role === 1);
  const isEligible = isStartup || isInvestor;

  // Derived quota calculations
  const activePackage = packages.find(p => p.packageId === subscription?.packageId);

  const isPremium = !!(
    (subscription?.status === 'Active' || subscription?.status === 1) &&
    subscription?.packageName &&
    !subscription.packageName.toLowerCase().includes('cơ bản') &&
    !subscription.packageName.toLowerCase().includes('basic') &&
    !subscription.packageName.toLowerCase().includes('miễn phí') &&
    !subscription.packageName.toLowerCase().includes('free')
  );

  const quota = {
    // AI Requests
    maxAiRequests: Number(activePackage?.maxAiRequests ?? subscription?.maxAiRequests ?? 0),
    usedAiRequests: Number(subscription?.usedAiRequests ?? 0),
    get remainingAiRequests() {
      return Math.max(0, this.maxAiRequests - this.usedAiRequests);
    },

    // Project Views (Unlock)
    maxProjectViews: Number(activePackage?.maxProjectViews ?? subscription?.maxProjectViews ?? 0),
    usedProjectViews: Number(subscription?.usedProjectViews ?? 0),
    get remainingProjectViews() {
      return Math.max(0, this.maxProjectViews - this.usedProjectViews);
    },

    // Free Bookings
    remainingFreeBookings: Number(subscription?.remainingFreeBookings ?? 0),
    bonusFreeBookings: Number(subscription?.bonusFreeBookings ?? 0),
    get totalFreeBookings() {
      return this.remainingFreeBookings + this.bonusFreeBookings;
    },

    packageName: subscription?.packageName || 'Gói Miễn phí',
    packageId: subscription?.packageId,
    endDate: subscription?.endDate,
  };

  const fetchSubscriptionData = useCallback(async (force = false) => {
    if (!user) return;
    if (!isEligible) return; // Currently only Startup and Investor roles buy packages

    // Avoid re-fetching within 30 seconds unless forced
    const now = Date.now();
    if (!force && lastFetched && (now - lastFetched) < 30000) return;

    setIsLoading(true);
    try {
      const [subData, pkgData, profileData] = await Promise.all([
        subscriptionService.getMySubscription(),
        isStartup ? paymentService.getStartupPackages() : paymentService.getInvestorPackages(),
        isStartup ? startupProfileService.getStartupMe() : Promise.resolve(null),
      ]);

      // Normalize subscription - handle data wrapper
      const finalSub = (subData?.data && typeof subData.data === 'object' && !Array.isArray(subData.data))
        ? subData.data
        : subData;

      const finalPkgs = pkgData?.data && Array.isArray(pkgData.data)
        ? pkgData.data
        : (Array.isArray(pkgData) ? pkgData : []);

      setSubscription(finalSub);
      setPackages(finalPkgs);
      setStartupProfile(profileData);
      setLastFetched(now);
    } catch (err) {
      console.error('[SubscriptionContext] Failed to fetch subscription:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, isStartup, lastFetched]);

  // Refresh subscription data silently in background
  const refreshSubscription = useCallback(() => {
    fetchSubscriptionData(true);
  }, [fetchSubscriptionData]);

  useEffect(() => {
    if (user && isEligible) {
      fetchSubscriptionData();
    } else {
      // Reset when user logs out or is not eligible
      setSubscription(null);
      setPackages([]);
      setStartupProfile(null);
      setLastFetched(null);
    }
  }, [user?.userId, isEligible]);

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      packages,
      isPremium,
      isLoading,
      quota,
      startupProfile,
      refreshSubscription,
      fetchSubscriptionData,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    // Return a safe default when used outside provider (e.g., non-startup roles)
    return {
      subscription: null,
      packages: [],
      isPremium: false,
      isLoading: false,
      quota: {
        maxAiRequests: 0, usedAiRequests: 0, remainingAiRequests: 0,
        maxProjectViews: 0, usedProjectViews: 0, remainingProjectViews: 0,
        remainingFreeBookings: 0, bonusFreeBookings: 0, totalFreeBookings: 0,
        packageName: 'Gói Miễn phí', packageId: null, endDate: null,
      },
      startupProfile: null,
      refreshSubscription: () => {},
      fetchSubscriptionData: () => {},
    };
  }
  return ctx;
}

export default SubscriptionContext;
