import Stripe from "stripe";
import {
  createUserSubscription,
  updateUserSubscription,
  getUserSubscriptionByUserId,
} from "@/backend/service/user_subscription";
import {
  createCreditUsage,
  getCreditUsageByUserId,
  updateCreditUsage,
} from "@/backend/service/credit_usage";
import {
  CreditUsage,
  PaymentHistory,
  UserSubscription,
} from "@/backend/type/type";
import {
  getPaymentHistoryById,
  updatePaymentHistory,
  createPaymentHistory,
} from "@/backend/service/payment_history";
import { UserSubscriptionStatusEnum } from "@/backend/type/enum/user_subscription_enum";

// 暂时禁用 Stripe webhook，等待配置完成
export async function POST() {
  return Response.json({ 
    message: "Stripe webhook is temporarily disabled" 
  }, { status: 503 });
}