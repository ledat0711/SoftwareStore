import { auth } from "@/auth";
// import { getUserById } from "@/lib/actions/user.actions";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
// import CheckoutSteps from "@/components/shared/checkout-steps";
import PaymentMethodForm from "./payment-method-form";

export const metadata: Metadata = {
    title: "Payment Method"
}

const PaymentMethodPage = async () => {
    const headersList = await headers();
    const callbackUrl = headersList.get('next-url');

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) redirect(`/sign-in?callbackUrl=${callbackUrl}`);
    // const user = await getUserById(userId);

    return (
        <>
            {/* <CheckoutSteps current={2} /> */}
            <PaymentMethodForm paymentMethodType={null} />
        </>

    );
}

export default PaymentMethodPage;