import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { auth, db, functions } from "../../services/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PricingDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);

  const stateRef = useRef({ currentUser: null, isPremium: false, loading: false });
  stateRef.current = { currentUser, isPremium, loading };

  useEffect(() => {
    let unsubSnapshot = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user?.uid) {
        unsubSnapshot = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsPremium(data.isPremium === true || data.isAdmin === true);
          } else {
            setIsPremium(false);
          }
        });
      } else {
        setIsPremium(false);
        if (unsubSnapshot) unsubSnapshot();
      }
    });

    const handleOpen = () => {
      handleSelectPlan({ id: "pro", billingPeriod: "monthly" });
    };
    window.addEventListener("open-pricing-dialog", handleOpen);

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
      window.removeEventListener("open-pricing-dialog", handleOpen);
    };
  }, []);

  const handleSelectPlan = async (plan) => {
    const { currentUser, isPremium, loading: isLoading } = stateRef.current;
    if (isLoading) return;

    if (plan.id === "explorer") {
      toast.info("You are already on the Explorer plan.");
      return;
    }
    if (plan.id === "enterprise") {
      toast.success("Thank you for your interest! Our sales team will contact you soon.");
      return;
    }

    if (!currentUser) {
      toast.error("Please login to upgrade your plan.");
      window.dispatchEvent(new Event("open-login-dialog"));
      return;
    }

    if (isPremium) {
      toast.success("You are already a premium subscriber!");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Initializing payment...");

    try {
      const resLoaded = await loadRazorpayScript();
      if (!resLoaded) {
        toast.dismiss(loadingToast);
        toast.error("Failed to load Razorpay SDK. Please check your internet connection.");
        setLoading(false);
        return;
      }

      const amount = plan.billingPeriod === "yearly" ? 5599 : 699;

      // Call the createRazorpayOrder Cloud Function
      const createOrderFn = httpsCallable(functions, "createRazorpayOrder");
      const orderRes = await createOrderFn({
        amount: amount,
        currency: "INR",
      });

      const orderData = orderRes.data;

      if (!orderData || !orderData.id) {
        throw new Error("Invalid order data returned from server");
      }

      toast.dismiss(loadingToast);

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Trip Buddy",
        description: `Upgrade to Pro Voyageur (${plan.billingPeriod === "yearly" ? "Annual" : "Monthly"}) Plan`,
        image: "https://trip-buddy-n6b3.onrender.com/favicon.png",
        order_id: orderData.id,
        handler: async function (response) {
          const verifyToast = toast.loading("Verifying payment...");
          try {
            const verifyFn = httpsCallable(functions, "verifyRazorpayPayment");
            const verifyRes = await verifyFn({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount,
            });

            toast.dismiss(verifyToast);

            if (verifyRes.data?.success) {
              toast.success("Congratulations! Your journey is now upgraded to Pro Voyageur.");
            } else {
              toast.error("Payment verification failed. Please reach out to support.");
            }
          } catch (err) {
            toast.dismiss(verifyToast);
            console.error("Verification error:", err);
            toast.error("Error verifying payment: " + err.message);
          }
        },
        prefill: {
          name: currentUser.displayName || "Traveler",
          email: currentUser.email || "",
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment session dismissed.");
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Payment initialization error:", error);
      toast.error(error.message || "Failed to initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return null;
};

export default PricingDialog;
